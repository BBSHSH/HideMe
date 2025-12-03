package main

import (
	"fmt"
	"net/http"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"fyne.io/fyne/v2"
	"fyne.io/fyne/v2/app"
	"fyne.io/fyne/v2/container"
	"fyne.io/fyne/v2/dialog"
	"fyne.io/fyne/v2/widget"
)

type VideoEditor struct {
	window       fyne.Window
	webView      *widget.RichText
	playBtn      *widget.Button
	stopBtn      *widget.Button
	timeline     *widget.Slider
	trimStart    *widget.Slider
	trimEnd      *widget.Slider
	volumeSlider *widget.Slider
	statusLabel  *widget.Label
	progressBar  *widget.ProgressBar

	videoPath string
	duration  float64
	httpPort  int
}

func main() {
	a := app.NewWithID("com.example.videoeditor")
	w := a.NewWindow("動画編集アプリ")
	w.Resize(fyne.NewSize(800, 600))

	editor := &VideoEditor{
		window:   w,
		httpPort: 8765,
	}

	editor.setupUI()
	w.ShowAndRun()
}

func (v *VideoEditor) setupUI() {
	// プレビューエリア（WebView の代わりに RichText で案内表示）
	v.webView = widget.NewRichText()
	v.webView.ParseMarkdown("## 動画プレビュー\n\n動画を選択してください")

	// ファイル選択ボタン
	selectBtn := widget.NewButton("動画を選択", func() {
		dialog.ShowFileOpen(func(uc fyne.URIReadCloser, err error) {
			if err != nil || uc == nil {
				return
			}
			defer uc.Close()
			v.loadVideo(uc.URI().Path())
		}, v.window)
	})

	// 再生コントロール
	v.playBtn = widget.NewButton("▶ 再生", func() {
		v.playVideo()
	})

	v.stopBtn = widget.NewButton("■ 停止", func() {
		v.stopVideo()
	})

	v.timeline = widget.NewSlider(0, 100)
	v.timeline.OnChanged = func(val float64) {
		v.seekVideo(val)
	}

	timelineLabel := widget.NewLabel("00:00 / 00:00")
	playControls := container.NewBorder(
		nil, nil,
		container.NewHBox(v.playBtn, v.stopBtn),
		timelineLabel,
		v.timeline,
	)

	// トリミング設定
	v.trimStart = widget.NewSlider(0, 100)
	v.trimStart.SetValue(0)
	trimStartLabel := widget.NewLabel("開始: 0.0秒")
	v.trimStart.OnChanged = func(val float64) {
		trimStartLabel.SetText(fmt.Sprintf("開始: %.1f秒", val))
	}

	v.trimEnd = widget.NewSlider(0, 100)
	v.trimEnd.SetValue(100)
	trimEndLabel := widget.NewLabel("終了: 0.0秒")
	v.trimEnd.OnChanged = func(val float64) {
		trimEndLabel.SetText(fmt.Sprintf("終了: %.1f秒", val))
	}

	trimBox := container.NewVBox(
		widget.NewLabel("トリミング範囲"),
		container.NewBorder(nil, nil, trimStartLabel, nil, v.trimStart),
		container.NewBorder(nil, nil, trimEndLabel, nil, v.trimEnd),
	)

	// 音量調整
	v.volumeSlider = widget.NewSlider(0, 200)
	v.volumeSlider.SetValue(100)
	volumeLabel := widget.NewLabel("音量: 100%")
	v.volumeSlider.OnChanged = func(val float64) {
		volumeLabel.SetText(fmt.Sprintf("音量: %.0f%%", val))
	}

	volumeBox := container.NewBorder(
		nil, nil,
		volumeLabel, nil,
		v.volumeSlider,
	)

	// 保存ボタン
	saveBtn := widget.NewButton("動画を保存", func() {
		v.saveVideo()
	})

	// ステータス
	v.statusLabel = widget.NewLabel("動画を選択してください")
	v.progressBar = widget.NewProgressBar()
	v.progressBar.Hide()

	statusBox := container.NewVBox(
		v.statusLabel,
		v.progressBar,
	)

	// メインレイアウト
	content := container.NewBorder(
		container.NewVBox(selectBtn),
		container.NewVBox(
			playControls,
			trimBox,
			volumeBox,
			saveBtn,
			statusBox,
		),
		nil, nil,
		v.webView,
	)

	v.window.SetContent(content)
}

func (v *VideoEditor) loadVideo(path string) {
	v.videoPath = path
	v.statusLabel.SetText(fmt.Sprintf("読み込み中: %s", filepath.Base(path)))

	// FFmpeg で動画の長さを取得
	go func() {
		duration, err := v.getVideoDuration(path)
		if err != nil {
			v.statusLabel.SetText(fmt.Sprintf("エラー: %v", err))
			return
		}

		v.duration = duration
		v.timeline.Max = duration
		v.trimStart.Max = duration
		v.trimEnd.Max = duration
		v.trimEnd.SetValue(duration)

		v.statusLabel.SetText(fmt.Sprintf("準備完了: %s (%.1f秒)", filepath.Base(path), duration))
		v.webView.ParseMarkdown(fmt.Sprintf("## 動画読み込み完了\n\n**ファイル:** %s\n\n**長さ:** %.1f秒", filepath.Base(path), duration))

		// ローカル HTTP サーバーを起動（オプション）
		v.startHTTPServer()
	}()
}

func (v *VideoEditor) getVideoDuration(path string) (float64, error) {
	cmd := exec.Command("ffprobe",
		"-v", "error",
		"-show_entries", "format=duration",
		"-of", "default=noprint_wrappers=1:nokey=1",
		path,
	)

	output, err := cmd.Output()
	if err != nil {
		return 0, fmt.Errorf("FFmpeg/FFprobe が見つかりません: %v", err)
	}

	durationStr := strings.TrimSpace(string(output))
	duration, err := strconv.ParseFloat(durationStr, 64)
	if err != nil {
		return 0, err
	}

	return duration, nil
}

func (v *VideoEditor) startHTTPServer() {
	// 動画ファイルを配信する簡易HTTPサーバー
	http.HandleFunc("/video", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, v.videoPath)
	})

	go func() {
		addr := fmt.Sprintf(":%d", v.httpPort)
		http.ListenAndServe(addr, nil)
	}()
}

func (v *VideoEditor) playVideo() {
	v.statusLabel.SetText("再生中...")
	// 実際のWebViewがあれば JavaScript で video.play() を実行
	// ここでは簡易実装のため省略
}

func (v *VideoEditor) stopVideo() {
	v.statusLabel.SetText("停止")
	// 実際のWebViewがあれば JavaScript で video.pause() を実行
}

func (v *VideoEditor) seekVideo(position float64) {
	// 実際のWebViewがあれば JavaScript で video.currentTime = position を実行
}

func (v *VideoEditor) saveVideo() {
	if v.videoPath == "" {
		dialog.ShowError(fmt.Errorf("動画が選択されていません"), v.window)
		return
	}

	// 保存先を選択
	dialog.ShowFileSave(func(uc fyne.URIWriteCloser, err error) {
		if err != nil || uc == nil {
			return
		}
		defer uc.Close()

		outputPath := uc.URI().Path()
		v.exportVideo(outputPath)
	}, v.window)
}

func (v *VideoEditor) exportVideo(outputPath string) {
	startTime := v.trimStart.Value
	endTime := v.trimEnd.Value
	volume := v.volumeSlider.Value / 100.0

	v.statusLabel.SetText("エクスポート中...")
	v.progressBar.Show()

	go func() {
		// FFmpeg でエクスポート
		args := []string{
			"-i", v.videoPath,
			"-ss", fmt.Sprintf("%.2f", startTime),
			"-to", fmt.Sprintf("%.2f", endTime),
			"-af", fmt.Sprintf("volume=%.2f", volume),
			"-c:v", "libx264",
			"-preset", "fast",
			"-c:a", "aac",
			"-y", // 上書き
			outputPath,
		}

		cmd := exec.Command("ffmpeg", args...)

		// プログレス更新（簡易版）
		done := make(chan error)
		go func() {
			done <- cmd.Run()
		}()

		// プログレスバーアニメーション
		ticker := time.NewTicker(100 * time.Millisecond)
		defer ticker.Stop()

		progress := 0.0
		for {
			select {
			case err := <-done:
				v.progressBar.Hide()
				if err != nil {
					v.statusLabel.SetText(fmt.Sprintf("エラー: %v", err))
					dialog.ShowError(err, v.window)
				} else {
					v.statusLabel.SetText(fmt.Sprintf("保存完了: %s", filepath.Base(outputPath)))
					dialog.ShowInformation("完了", "動画の保存が完了しました", v.window)
				}
				return
			case <-ticker.C:
				progress += 0.01
				if progress > 1.0 {
					progress = 0.0
				}
				v.progressBar.SetValue(progress)
			}
		}
	}()
}
