package app

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
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
				Pattern:     "*. mp4;*.mov;*.mkv;*.avi",
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

// GetLocalFileURL returns the local file URL for the AssetServer
// フロントエンドから呼び出して、ローカルファイルのURLを取得する
func (v *VideoEditorApp) GetLocalFileURL(filePath string) string {
	encodedPath := url.PathEscape(filePath)
	// Windows のドライブレター対応 (C:  -> C%3A だが、PathEscapeは :  をエスケープしない)
	return fmt.Sprintf("/localfile/%s", encodedPath)
}

// VideoHandler serves video files (従来のHTTPサーバー用 - 互換性のため残す)
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
		return nil, fmt.Errorf("video file not found:  %v", err)
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

	// 共通の基本オプションを構築
	baseArgs := []string{"-i", options.InputPath}

	if options.StartTime > 0 {
		baseArgs = append(baseArgs, "-ss", fmt.Sprintf("%.2f", options.StartTime))
	}

	if options.EndTime > 0 {
		duration := options.EndTime - options.StartTime
		baseArgs = append(baseArgs, "-t", fmt.Sprintf("%. 2f", duration))
	}

	// 解像度設定（ビデオフィルター）
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
	baseArgs = append(baseArgs, "-vf", fmt.Sprintf("scale=%s:flags=lanczos", scale))

	// 音量設定（オーディオフィルター）
	if options.Volume != 1.0 {
		baseArgs = append(baseArgs, "-af", fmt.Sprintf("volume=%.2f", options.Volume))
	}

	// シンプルで確実なエンコード設定
	args := append([]string{}, baseArgs...)
	args = append(args,
		"-c:v", "libx264",
		"-profile:v", "baseline",
		"-level", "3.0",
		"-pix_fmt", "yuv420p",
		"-c:a", "aac",
		"-ar", "44100",
		"-b:a", "128k",
		"-movflags", "+faststart",
		"-y", options.OutputPath)

	cmd := exec.Command(v.ffmpegPath, args...)
	cmd.SysProcAttr = &syscall.SysProcAttr{
		HideWindow:    true,
		CreationFlags: 0x08000000,
	}

	output, err := cmd.CombinedOutput()

	if err != nil {
		return fmt.Errorf("エンコードエラー: %v\n%s", err, string(output))
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

// =============================================================================
// LocalFileLoader - Wails AssetServer Handler
// ローカルファイルシステムから直接ファイルを提供するためのハンドラー
// =============================================================================

// LocalFileLoader implements http.Handler for serving local files
type LocalFileLoader struct{}

// NewLocalFileLoader creates a new LocalFileLoader instance
func NewLocalFileLoader() *LocalFileLoader {
	return &LocalFileLoader{}
}

// ServeHTTP handles HTTP requests for local files
// /localfile/ プレフィックスでローカルファイルにアクセス可能
func (l *LocalFileLoader) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// /localfile/ プレフィックスをチェック
	if !strings.HasPrefix(r.URL.Path, "/localfile/") {
		// このハンドラーで処理しないリクエストは404を返す
		// (Wailsの埋め込みアセットが優先される)
		return
	}

	// パスからプレフィックスを除去
	encodedPath := strings.TrimPrefix(r.URL.Path, "/localfile/")

	// URLデコード
	filePath, err := url.PathUnescape(encodedPath)
	if err != nil {
		fmt.Printf("LocalFileLoader: Failed to decode path: %v\n", err)
		http.Error(w, "Invalid path encoding", http.StatusBadRequest)
		return
	}

	// Windows パスの正規化
	// スラッシュをバックスラッシュに変換（Windowsの場合）
	filePath = filepath.FromSlash(filePath)

	fmt.Printf("LocalFileLoader: Serving file: %s\n", filePath)

	// ファイルの存在確認
	fileInfo, err := os.Stat(filePath)
	if os.IsNotExist(err) {
		fmt.Printf("LocalFileLoader: File not found: %s\n", filePath)
		http.Error(w, "File not found", http.StatusNotFound)
		return
	}
	if err != nil {
		fmt.Printf("LocalFileLoader: Error accessing file: %v\n", err)
		http.Error(w, "Error accessing file", http.StatusInternalServerError)
		return
	}

	// ディレクトリへのアクセスは拒否
	if fileInfo.IsDir() {
		fmt.Printf("LocalFileLoader: Directory access denied: %s\n", filePath)
		http.Error(w, "Directory access not allowed", http.StatusForbidden)
		return
	}

	// Content-Type を拡張子から判定
	ext := strings.ToLower(filepath.Ext(filePath))
	contentType := getContentType(ext)

	// レスポンスヘッダーの設定
	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Accept-Ranges", "bytes")
	w.Header().Set("Cache-Control", "no-cache")

	// ファイルを提供（Range リクエストにも対応）
	http.ServeFile(w, r, filePath)
}

// getContentType returns the MIME type for a file extension
func getContentType(ext string) string {
	mimeTypes := map[string]string{
		// 動画
		".mp4":  "video/mp4",
		".mov":  "video/quicktime",
		".mkv":  "video/x-matroska",
		".avi":  "video/x-msvideo",
		".webm": "video/webm",
		". m4v": "video/x-m4v",
		". wmv": "video/x-ms-wmv",
		". flv": "video/x-flv",
		".ogv":  "video/ogg",
		".3gp":  "video/3gpp",

		// 音声
		".mp3":  "audio/mpeg",
		".wav":  "audio/wav",
		".ogg":  "audio/ogg",
		".m4a":  "audio/mp4",
		".aac":  "audio/aac",
		".flac": "audio/flac",
		". wma": "audio/x-ms-wma",

		// 画像
		".jpg":  "image/jpeg",
		".jpeg": "image/jpeg",
		".png":  "image/png",
		".gif":  "image/gif",
		".webp": "image/webp",
		".bmp":  "image/bmp",
		".svg":  "image/svg+xml",
		".ico":  "image/x-icon",

		// その他
		".json": "application/json",
		". xml": "application/xml",
		".pdf":  "application/pdf",
		".txt":  "text/plain",
		".html": "text/html",
		".css":  "text/css",
		".js":   "application/javascript",
	}

	if mimeType, ok := mimeTypes[ext]; ok {
		return mimeType
	}

	// デフォルト
	return "application/octet-stream"
}
