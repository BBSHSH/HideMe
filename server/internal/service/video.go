package service

import (
	"bufio"
	"context"
	"database/sql"
	"fmt"
	"io"
	"log"
	"math"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"

	"github.com/BBSHSH/HideMe/server/internal/chat"
	"github.com/BBSHSH/HideMe/server/internal/db"
	"github.com/BBSHSH/HideMe/server/internal/progress"
	"github.com/BBSHSH/HideMe/server/internal/storage"
)

func FFmpegPath() string {
	if p := os.Getenv("FFMPEG_PATH"); p != "" {
		return p
	}
	return "ffmpeg"
}

func ResolutionHeight(s string) int {
	switch s {
	case "1080p":
		return 1080
	case "480p":
		return 480
	case "240p":
		return 240
	default:
		return 720
	}
}

func CRFForHeight(height int) int {
	switch {
	case height >= 1080:
		return 20
	case height >= 720:
		return 22
	case height >= 480:
		return 24
	default:
		return 26
	}
}

func GetVideoDuration(path string) (float64, error) {
	ffprobePath := strings.Replace(FFmpegPath(), "ffmpeg", "ffprobe", 1)
	out, err := exec.Command(ffprobePath,
		"-v", "error",
		"-show_entries", "format=duration",
		"-of", "default=noprint_wrappers=1:nokey=1",
		path,
	).Output()
	if err != nil {
		return 0, err
	}
	return strconv.ParseFloat(strings.TrimSpace(string(out)), 64)
}

var reOutTime = regexp.MustCompile(`out_time_ms=(\d+)`)

func RunFFmpeg(args []string, totalSec float64, onProgress func(float64)) error {
	allArgs := append([]string{"-progress", "pipe:2", "-nostats"}, args...)
	cmd := exec.Command(FFmpegPath(), allArgs...)
	cmd.Stdout = io.Discard

	stderr, err := cmd.StderrPipe()
	if err != nil {
		return err
	}
	if err := cmd.Start(); err != nil {
		return fmt.Errorf("ffmpeg start: %w", err)
	}

	var stderrBuf strings.Builder
	scanner := bufio.NewScanner(stderr)
	for scanner.Scan() {
		line := scanner.Text()
		stderrBuf.WriteString(line + "\n")
		if m := reOutTime.FindStringSubmatch(line); len(m) == 2 {
			ms, _ := strconv.ParseFloat(m[1], 64)
			if totalSec > 0 && onProgress != nil {
				pct := math.Min((ms/1e6)/totalSec*100, 99)
				onProgress(pct)
			}
		}
	}

	if err := cmd.Wait(); err != nil {
		log.Printf("[FFMPEG] error output:\n%s", stderrBuf.String())
		return fmt.Errorf("ffmpeg: %w\n%s", err, stderrBuf.String())
	}
	return nil
}

// BuildFFmpegArgs builds H.264 encoding args with aspect-ratio-preserving scale.
func BuildFFmpegArgs(input, output string, trimStart, trimEnd float64, volume, height, fps int) []string {
	args := []string{"-y"}
	if trimStart > 0.01 {
		args = append(args, "-ss", fmt.Sprintf("%.3f", trimStart))
	}
	args = append(args, "-i", input)
	if trimEnd > 0.01 && trimEnd > trimStart {
		args = append(args, "-t", fmt.Sprintf("%.3f", trimEnd-trimStart))
	}
	args = append(args,
		"-vf", fmt.Sprintf("scale=-2:%d", height),
		"-r", strconv.Itoa(fps),
		"-af", fmt.Sprintf("volume=%.2f", float64(volume)/100.0),
		"-c:v", "libx264",
		"-crf", strconv.Itoa(CRFForHeight(height)),
		"-preset", "fast",
		"-profile:v", "high",
		"-avoid_negative_ts", "make_zero",
		"-movflags", "+faststart",
		"-c:a", "aac",
		"-b:a", "128k",
		output,
	)
	return args
}

func IsVideoFilename(name string) bool {
	lower := strings.ToLower(name)
	for _, ext := range []string{".mp4", ".webm", ".mov", ".mkv", ".avi", ".flv", ".wmv"} {
		if strings.HasSuffix(lower, ext) {
			return true
		}
	}
	return false
}

// ProcessVideoBackground encodes a video and uploads it to storage asynchronously.
func ProcessVideoBackground(store storage.Storage, database *sql.DB, storageType, uploadID, collectionID, userID, fileName, inputPath string, trimStart, trimEnd float64, volumeVal int, resolution string, fpsVal int) {
	tmpOut := filepath.Join(os.TempDir(), "hideme_out_"+uploadID+".mp4")
	defer os.Remove(tmpOut)

	totalSec, _ := GetVideoDuration(inputPath)
	if trimEnd > 0.01 && trimEnd > trimStart {
		totalSec = trimEnd - trimStart
	}

	height := ResolutionHeight(resolution)
	ffArgs := BuildFFmpegArgs(inputPath, tmpOut, trimStart, trimEnd, volumeVal, height, fpsVal)
	log.Printf("[FFMPEG/BG] start: %s -> %s", fileName, resolution)

	if err := RunFFmpeg(ffArgs, totalSec, func(pct float64) {
		progress.Global.Send(uploadID, progress.Event{Phase: progress.PhaseFFmpeg, Percent: pct})
	}); err != nil {
		log.Printf("[FFMPEG/BG] error: %v", err)
		progress.Global.Send(uploadID, progress.Event{Phase: progress.PhaseError, Message: "encoding_failed"})
		return
	}
	progress.Global.Send(uploadID, progress.Event{Phase: progress.PhaseFFmpeg, Percent: 100})

	outFile, err := os.Open(tmpOut)
	if err != nil {
		progress.Global.Send(uploadID, progress.Event{Phase: progress.PhaseError, Message: "failed_to_open_output"})
		return
	}
	defer outFile.Close()

	outInfo, _ := outFile.Stat()
	outFileName := strings.TrimSuffix(fileName, filepath.Ext(fileName)) + ".mp4"

	item, err := store.UploadWithProgress(
		context.Background(),
		outFileName,
		outFile,
		outInfo.Size(),
		func(loaded, total int64) {
			if total > 0 {
				progress.Global.Send(uploadID, progress.Event{
					Phase:   progress.PhaseNAS,
					Percent: math.Min(float64(loaded)/float64(total)*100, 99),
				})
			}
		},
	)
	if err != nil {
		log.Printf("[NAS/BG] error: %v", err)
		progress.Global.Send(uploadID, progress.Event{Phase: progress.PhaseError, Message: "nas_failed"})
		return
	}

	cf, err := db.AddFileToCollection(database, collectionID, item.Name, "", storageType, item.Size, userID)
	if err != nil {
		progress.Global.Send(uploadID, progress.Event{Phase: progress.PhaseError, Message: "db_failed"})
		return
	}

	progress.Global.Send(uploadID, progress.Event{Phase: progress.PhaseDone, FileID: cf.ID})
	log.Printf("[UPLOAD/BG] done: id=%s size=%dMB", cf.ID, outInfo.Size()/1024/1024)
}

// UploadNonVideoBackground uploads a non-video file to storage asynchronously.
func UploadNonVideoBackground(store storage.Storage, database *sql.DB, storageType, uploadID, collectionID, userID, fileName, filePath string) {
	progress.Global.Send(uploadID, progress.Event{Phase: progress.PhaseNAS, Percent: 0})

	f, err := os.Open(filePath)
	if err != nil {
		progress.Global.Send(uploadID, progress.Event{Phase: progress.PhaseError, Message: "failed_to_open_file"})
		return
	}
	defer f.Close()

	info, _ := f.Stat()
	item, err := store.Upload(context.Background(), fileName, f, info.Size())
	if err != nil {
		progress.Global.Send(uploadID, progress.Event{Phase: progress.PhaseError, Message: "nas_failed"})
		return
	}

	cf, err := db.AddFileToCollection(database, collectionID, item.Name, "", storageType, item.Size, userID)
	if err != nil {
		progress.Global.Send(uploadID, progress.Event{Phase: progress.PhaseError, Message: "db_failed"})
		return
	}

	progress.Global.Send(uploadID, progress.Event{Phase: progress.PhaseDone, FileID: cf.ID})
}

// BroadcastActivity logs an activity event and broadcasts it over WebSocket.
func BroadcastActivity(database *sql.DB, eventType, userID, username, avatar, detail string) {
	db.LogActivity(database, eventType, userID, username, avatar, detail)
	chat.Global.Broadcast(chat.WSMessage{Type: "activity", Data: map[string]string{
		"type": eventType, "user_id": userID, "username": username, "avatar": avatar, "detail": detail,
	}})
}
