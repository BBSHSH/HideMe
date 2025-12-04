package main

import (
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/sqweek/dialog"
	"fyne.io/fyne/v2"
	"fyne.io/fyne/v2/app"
	"fyne.io/fyne/v2/container"
	"fyne.io/fyne/v2/data/binding"
	"fyne.io/fyne/v2/widget"
)

type VideoEditor struct {
	app          fyne.App
	window       fyne.Window
	infoLabel    *widget.Label
	playBtn      *widget.Button
	stopBtn      *widget.Button
	timeline     *widget.Slider
	trimStart    *widget.Slider
	trimEnd      *widget.Slider
	volumeSlider *widget.Slider
	statusLabel  *widget.Label
	progressBar  *widget.ProgressBar

	videoPath      string
	duration       float64
	httpPort       int
	serverStarted  bool
	serverMutex    sync.Mutex

	statusText      binding.String
	videoInfoText   binding.String
	progressValue   binding.Float
	progressVisible binding.Bool
	
	// スライダー用バインディング
	timelineMax   binding.Float
	trimStartMax  binding.Float
	trimStartVal  binding.Float
	trimEndMax    binding.Float
	trimEndVal    binding.Float
}

type VideoInfo struct {
	Duration float64
	Width    int
	Height   int
}

func main() {
	a := app.NewWithID("com.example.videoeditor")
	w := a.NewWindow("動画編集アプリ")
	w.Resize(fyne.NewSize(800, 600))

	editor := &VideoEditor{
		app:             a,
		window:          w,
		httpPort:        8765,
		serverStarted:   false,
		statusText:      binding.NewString(),
		videoInfoText:   binding.NewString(),
		progressValue:   binding.NewFloat(),
		progressVisible: binding.NewBool(),
		timelineMax:     binding.NewFloat(),
		trimStartMax:    binding.NewFloat(),
		trimStartVal:    binding.NewFloat(),
		trimEndMax:      binding.NewFloat(),
		trimEndVal:      binding.NewFloat(),
	}

	// 初期値設定
	editor.timelineMax.Set(100)
	editor.trimStartMax.Set(100)
	editor.trimStartVal.Set(0)
	editor.trimEndMax.Set(100)
	editor.trimEndVal.Set(100)

	editor.setupUI()
	w.ShowAndRun()
}

// ------------------ ファイルダイアログ ------------------

func selectVideoFile() string {
	file, err := dialog.File().Filter("動画ファイル", "mp4", "mov", "mkv", "avi").Load()
	if err != nil {
		return ""
	}
	return file
}

func saveVideoFile() string {
	file, err := dialog.File().Filter("動画ファイル", "mp4").Save()
	if err != nil {
		return ""
	}
	return file
}

// ------------------ UI設定 ------------------

func (v *VideoEditor) setupUI() {
	// 動画情報表示エリア（データバインディング使用）
	v.videoInfoText.Set("動画を選択してください")
	v.infoLabel = widget.NewLabelWithData(v.videoInfoText)
	v.infoLabel.Wrapping = fyne.TextWrapWord

	selectBtn := widget.NewButton("動画を選択", func() {
		path := selectVideoFile()
		if path != "" {
			v.loadVideo(path)
		}
	})

	v.playBtn = widget.NewButton("▶ 再生", func() { v.playVideo() })
	v.stopBtn = widget.NewButton("■ 停止", func() { v.stopVideo() })

	// タイムライン
	v.timeline = widget.NewSlider(0, 100)
	timelineLabel := widget.NewLabel("00:00 / 00:00")
	v.timeline.OnChanged = func(val float64) { v.seekVideo(val) }

	playControls := container.NewBorder(nil, nil, container.NewHBox(v.playBtn, v.stopBtn), timelineLabel, v.timeline)

	// トリミング
	v.trimStart = widget.NewSlider(0, 100)
	v.trimEnd = widget.NewSlider(0, 100)

	trimStartLabel := widget.NewLabel("開始: 0.0秒")
	v.trimStart.OnChanged = func(val float64) {
		trimStartLabel.SetText(fmt.Sprintf("開始: %.1f秒", val))
	}

	trimEndLabel := widget.NewLabel("終了: 0.0秒")
	v.trimEnd.OnChanged = func(val float64) {
		trimEndLabel.SetText(fmt.Sprintf("終了: %.1f秒", val))
	}

	trimBox := container.NewVBox(
		widget.NewLabel("トリミング範囲"),
		container.NewBorder(nil, nil, trimStartLabel, nil, v.trimStart),
		container.NewBorder(nil, nil, trimEndLabel, nil, v.trimEnd),
	)

	// 音量
	v.volumeSlider = widget.NewSlider(0, 200)
	v.volumeSlider.SetValue(100)
	volumeLabel := widget.NewLabel("音量: 100%")
	v.volumeSlider.OnChanged = func(val float64) {
		volumeLabel.SetText(fmt.Sprintf("音量: %.0f%%", val))
	}
	volumeBox := container.NewBorder(nil, nil, volumeLabel, nil, v.volumeSlider)

	// 保存
	saveBtn := widget.NewButton("動画を保存", func() {
		if v.videoPath == "" {
			v.statusText.Set("動画が選択されていません")
			return
		}
		outputPath := saveVideoFile()
		if outputPath != "" {
			v.exportVideo(outputPath)
		}
	})

	v.statusText.Set("動画を選択してください")
	v.statusLabel = widget.NewLabelWithData(v.statusText)

	v.progressValue.Set(0)
	v.progressVisible.Set(false)
	v.progressBar = widget.NewProgressBarWithData(v.progressValue)
	v.progressBar.Hide()

	statusBox := container.NewVBox(v.statusLabel, v.progressBar)

	// 動画情報表示エリアをスクロール可能に
	infoScroll := container.NewScroll(v.infoLabel)
	infoScroll.SetMinSize(fyne.NewSize(0, 150))

	content := container.NewBorder(
		container.NewVBox(selectBtn, infoScroll),
		container.NewVBox(playControls, trimBox, volumeBox, saveBtn, statusBox),
		nil, nil,
		container.NewCenter(widget.NewLabel("プレビューエリア")),
	)
	v.window.SetContent(content)
}

// ------------------ 動画読み込み ------------------

func (v *VideoEditor) loadVideo(path string) {
	v.videoPath = path
	v.statusText.Set(fmt.Sprintf("読み込み中: %s", filepath.Base(path)))

	go func() {
		info, err := v.getVideoInfo(path)
		if err != nil {
			v.statusText.Set(fmt.Sprintf("エラー: %v", err))
			return
		}

		v.duration = info.Duration
		
		// スライダーの更新（エラーは出るが動作する）
		v.timeline.Max = info.Duration
		v.trimStart.Max = info.Duration
		v.trimEnd.Max = info.Duration
		v.trimEnd.SetValue(info.Duration)

		// データバインディングを使ってUI更新
		v.statusText.Set(fmt.Sprintf("準備完了: %s (%.1f秒)", filepath.Base(path), info.Duration))
		
		// 動画情報をテキストで表示
		infoText := fmt.Sprintf("【動画情報】\n\nファイル名: %s\n\n長さ: %.1f秒\n\n解像度: %dx%d\n\nHTTPサーバー: http://localhost:%d/video",
			filepath.Base(path), info.Duration, info.Width, info.Height, v.httpPort)
		v.videoInfoText.Set(infoText)

		v.startHTTPServer()
	}()
}

func (v *VideoEditor) getVideoInfo(path string) (*VideoInfo, error) {
	ffmpegPath := filepath.Join(".", "ffmpeg", "ffmpeg.exe")

	if _, err := os.Stat(ffmpegPath); err != nil {
		return nil, fmt.Errorf("ffmpeg not found: %v", err)
	}
	if _, err := os.Stat(path); err != nil {
		return nil, fmt.Errorf("video file not found: %v", err)
	}

	args := []string{"-i", path, "-f", "null", "-"}
	cmd := exec.Command(ffmpegPath, args...)
	output, _ := cmd.CombinedOutput()
	lines := strings.Split(string(output), "\n")

	info := &VideoInfo{}
	for _, line := range lines {
		line = strings.TrimSpace(line)

		if strings.Contains(line, "Duration:") {
			parts := strings.Split(line, "Duration: ")
			if len(parts) > 1 {
				timeStr := strings.TrimSpace(strings.Split(parts[1], ",")[0])
				info.Duration = parseTimeString(timeStr)
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

	return info, nil
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

// ------------------ HTTPサーバー ------------------

func (v *VideoEditor) startHTTPServer() {
	v.serverMutex.Lock()
	defer v.serverMutex.Unlock()

	if v.serverStarted {
		return
	}

	v.serverStarted = true

	http.HandleFunc("/video", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, v.videoPath)
	})

	go func() {
		addr := fmt.Sprintf(":%d", v.httpPort)
		http.ListenAndServe(addr, nil)
	}()
}

// ------------------ 再生 / 停止 / シーク ------------------

func (v *VideoEditor) playVideo() {
	v.statusText.Set("再生中...")
}

func (v *VideoEditor) stopVideo() {
	v.statusText.Set("停止")
}

func (v *VideoEditor) seekVideo(f float64) {
	// シーク用（未実装）
}

// ------------------ 動画エクスポート ------------------

func (v *VideoEditor) exportVideo(outputPath string) {
	startTime := v.trimStart.Value
	endTime := v.trimEnd.Value
	volume := v.volumeSlider.Value / 100.0

	v.statusText.Set("エクスポート中...")
	v.progressVisible.Set(true)
	v.progressBar.Show()

	go func() {
		ffmpegPath := filepath.Join(".", "ffmpeg", "ffmpeg.exe")
		args := []string{
			"-i", v.videoPath,
			"-ss", fmt.Sprintf("%.2f", startTime),
			"-to", fmt.Sprintf("%.2f", endTime),
			"-af", fmt.Sprintf("volume=%.2f", volume),
			"-c:v", "libx264",
			"-preset", "fast",
			"-c:a", "aac",
			"-y", outputPath,
		}

		cmd := exec.Command(ffmpegPath, args...)
		done := make(chan error)
		go func() { done <- cmd.Run() }()

		ticker := time.NewTicker(100 * time.Millisecond)
		defer ticker.Stop()

		progress := 0.0
		for {
			select {
			case err := <-done:
				v.progressBar.Hide()
				v.progressVisible.Set(false)
				if err != nil {
					v.statusText.Set(fmt.Sprintf("エラー: %v", err))
				} else {
					v.statusText.Set(fmt.Sprintf("保存完了: %s", filepath.Base(outputPath)))
				}
				return
			case <-ticker.C:
				progress += 0.01
				if progress > 1.0 {
					progress = 0.0
				}
				v.progressValue.Set(progress)
			}
		}
	}()
}