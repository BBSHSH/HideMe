package app

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type VideoEditorApp struct {
	ctx        context.Context
	ffmpegPath string
	videoPath  string
	videoDir   string
	videoPort  string
}

type VideoInfo struct {
	Duration float64 `json:"duration"`
	Width    int     `json:"width"`
	Height   int     `json:"height"`
}

type ExportOptions struct {
	InputPath  string  `json:"inputPath"`
	OutputPath string  `json:"outputPath"`
	StartTime  float64 `json:"startTime"`
	EndTime    float64 `json:"endTime"`
	Volume     float64 `json:"volume"`
	Resolution string  `json:"resolution"`
}

func NewVideoEditorApp() *VideoEditorApp {
	return &VideoEditorApp{
		videoPort: "8082",
	}
}

func (v *VideoEditorApp) Startup(ctx context.Context) {
	v.ctx = ctx
	v.ffmpegPath = "ffmpeg/ffmpeg.exe"

	// FFmpegのバージョン確認
	cmd := exec.Command(v.ffmpegPath, "-version")
	output, err := cmd.CombinedOutput()
	if err != nil {
		fmt.Printf("FFmpeg version check failed: %v\n", err)
	} else {
		fmt.Printf("FFmpeg version: %s\n", string(output[:min(200, len(output))]))
	}
}

func (v *VideoEditorApp) Shutdown(ctx context.Context) {
	// クリーンアップ処理
}

// SelectFile opens file dialog
func (v *VideoEditorApp) SelectFile() (string, error) {
	options := runtime.OpenDialogOptions{
		Title: "動画を選択",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "動画ファイル",
				Pattern:     "*.mp4;*.mov;*.mkv;*.avi",
			},
		},
	}

	path, err := runtime.OpenFileDialog(v.ctx, options)
	if err != nil || path == "" {
		return "", err
	}

	v.videoPath = path
	v.videoDir = filepath.Dir(path)
	fmt.Printf("Selected video: %s\n", path)
	return path, nil
}

// GetVideoServerURL returns the video server URL
func (v *VideoEditorApp) GetVideoServerURL() string {
	return fmt.Sprintf("http://localhost:%s", v.videoPort)
}

// VideoHandler serves video files
func (v *VideoEditorApp) VideoHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	path := r.URL.Query().Get("path")
	if path == "" {
		http.Error(w, "path required", 400)
		return
	}

	if _, err := os.Stat(path); os.IsNotExist(err) {
		http.Error(w, "file not found", 404)
		return
	}

	ext := filepath.Ext(path)
	contentType := "video/mp4"
	switch ext {
	case ".mov":
		contentType = "video/quicktime"
	case ".mkv":
		contentType = "video/x-matroska"
	case ".avi":
		contentType = "video/x-msvideo"
	}

	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Accept-Ranges", "bytes")

	http.ServeFile(w, r, path)
}

// GetVideoInfo returns video metadata
func (v *VideoEditorApp) GetVideoInfo(inputPath string) (*VideoInfo, error) {
	fmt.Printf("Getting video info for: %s\n", inputPath)

	if _, err := os.Stat(v.ffmpegPath); err != nil {
		return nil, fmt.Errorf("ffmpeg not found: %v", err)
	}

	if _, err := os.Stat(inputPath); err != nil {
		return nil, fmt.Errorf("video file not found: %v", err)
	}

	args := []string{"-i", inputPath, "-f", "null", "-"}
	cmd := exec.Command(v.ffmpegPath, args...)
	cmd.SysProcAttr = &syscall.SysProcAttr{
		HideWindow:    true,
		CreationFlags: 0x08000000,
	}

	output, _ := cmd.CombinedOutput()
	outputStr := string(output)

	info := &VideoInfo{}
	lines := strings.Split(outputStr, "\n")

	for _, line := range lines {
		if strings.Contains(line, "Duration:") {
			parts := strings.Split(line, "Duration: ")
			if len(parts) > 1 {
				timeStr := strings.TrimSpace(strings.Split(parts[1], ",")[0])
				info.Duration = parseTimeString(timeStr)
				fmt.Printf("Parsed duration: %.2f seconds\n", info.Duration)
			}
		}

		if strings.Contains(line, "Stream") && strings.Contains(line, "Video:") {
			parts := strings.Fields(line)
			for _, part := range parts {
				if strings.Contains(part, "x") && !strings.Contains(part, "0x") {
					resPart := strings.TrimRight(part, ",")
					dims := strings.Split(resPart, "x")
					if len(dims) == 2 {
						w, err1 := strconv.Atoi(dims[0])
						h, err2 := strconv.Atoi(dims[1])
						if err1 == nil && err2 == nil && w > 0 && h > 0 {
							info.Width = w
							info.Height = h
							fmt.Printf("Parsed resolution: %dx%d\n", w, h)
							break
						}
					}
				}
			}
		}
	}

	if info.Duration == 0 {
		return nil, fmt.Errorf("動画の長さを取得できませんでした")
	}

	if info.Width == 0 || info.Height == 0 {
		info.Width = 1280
		info.Height = 720
	}

	fmt.Printf("VideoInfo: Duration=%.2f, Size=%dx%d\n", info.Duration, info.Width, info.Height)
	return info, nil
}

// ExportVideo exports the video
func (v *VideoEditorApp) ExportVideo(options ExportOptions) error {
	fmt.Printf("Exporting video: %+v\n", options)

	args := []string{"-i", options.InputPath}

	if options.StartTime > 0 {
		args = append(args, "-ss", fmt.Sprintf("%.2f", options.StartTime))
	}

	if options.EndTime > 0 {
		duration := options.EndTime - options.StartTime
		args = append(args, "-t", fmt.Sprintf("%.2f", duration))
	}

	if options.Volume != 1.0 {
		args = append(args, "-af", fmt.Sprintf("volume=%.2f", options.Volume))
	}

	// 解像度設定
	var scale string
	switch options.Resolution {
	case "1080p":
		scale = "1920:1080"
	case "720p":
		scale = "1280:720"
	case "480p":
		scale = "854:480"
	default:
		scale = "1280:720"
	}
	args = append(args, "-vf", "scale="+scale)

	args = append(args, "-c:v", "h264_nvenc", "-preset", "fast", "-c:a", "aac", "-b:a", "192k", "-y", options.OutputPath)

	cmd := exec.Command(v.ffmpegPath, args...)
	cmd.SysProcAttr = &syscall.SysProcAttr{
		HideWindow:    true,
		CreationFlags: 0x08000000,
	}

	output, err := cmd.CombinedOutput()

	if err != nil {
		args[len(args)-8] = "libx264"
		cmd = exec.Command(v.ffmpegPath, args...)
		cmd.SysProcAttr = &syscall.SysProcAttr{
			HideWindow:    true,
			CreationFlags: 0x08000000,
		}
		output, err = cmd.CombinedOutput()
		if err != nil {
			return fmt.Errorf("エンコードエラー: %v\n%s", err, string(output))
		}
	}

	fmt.Printf("Export completed\n")
	return nil
}

func parseTimeString(timeStr string) float64 {
	parts := strings.Split(strings.TrimSpace(timeStr), ":")
	if len(parts) != 3 {
		return 0
	}
	hours, _ := strconv.ParseFloat(parts[0], 64)
	minutes, _ := strconv.ParseFloat(parts[1], 64)
	seconds, _ := strconv.ParseFloat(parts[2], 64)
	return hours*3600 + minutes*60 + seconds
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
