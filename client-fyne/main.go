package main

import (
	"fmt"
	"image/color"
	"os"
	"os/exec"
	"strconv"
	"syscall"
	"time"
	"unsafe"

	"fyne.io/fyne/v2"
	"fyne.io/fyne/v2/app"
	"fyne.io/fyne/v2/canvas"
	"fyne.io/fyne/v2/container"
	"fyne.io/fyne/v2/layout"
	"fyne.io/fyne/v2/theme"
	"fyne.io/fyne/v2/widget"
	"github.com/sqweek/dialog"
)

// Windows API
var (
	user32              = syscall.NewLazyDLL("user32.dll")
	procFindWindowW     = user32.NewProc("FindWindowW")
	procCreateWindowExW = user32.NewProc("CreateWindowExW")
	procMoveWindow      = user32.NewProc("MoveWindow")
	procShowWindow      = user32.NewProc("ShowWindow")
	procDestroyWindow   = user32.NewProc("DestroyWindow")
)

const (
	WS_CHILD        = 0x40000000
	WS_VISIBLE      = 0x10000000
	WS_CLIPSIBLINGS = 0x04000000
	WS_CLIPCHILDREN = 0x02000000
	SW_SHOW         = 5
)

type HWND uintptr

// アプリケーション状態
type AppState struct {
	selectedFilePath string
	isPlaying        bool
	mpvCmd           *exec.Cmd
	volume           float64

	// Windows埋め込み用
	mainHWND         HWND
	panelHWND        HWND
	windowTitle      string
	videoPlaceholder *videoPanel
}

// ビデオパネル（位置追跡用カスタムウィジェット）
type videoPanel struct {
	widget.BaseWidget
	state  *AppState
	window fyne.Window
}

func newVideoPanel(state *AppState, window fyne.Window) *videoPanel {
	v := &videoPanel{state: state, window: window}
	v.ExtendBaseWidget(v)
	return v
}

func (v *videoPanel) CreateRenderer() fyne.WidgetRenderer {
	// 黒背景
	bg := canvas.NewRectangle(color.Black)

	label := canvas.NewText("動画プレビュー", color.White)
	label.Alignment = fyne.TextAlignCenter

	return &videoPanelRenderer{
		panel: v,
		bg:    bg,
		label: label,
	}
}

func (v *videoPanel) MinSize() fyne.Size {
	return fyne.NewSize(400, 300)
}

type videoPanelRenderer struct {
	panel *videoPanel
	bg    *canvas.Rectangle
	label *canvas.Text
}

func (r *videoPanelRenderer) Layout(size fyne.Size) {
	r.bg.Resize(size)
	r.label.Move(fyne.NewPos(size.Width/2-50, size.Height/2-10))

	// パネル位置更新
	if r.panel.state != nil && r.panel.state.panelHWND != 0 {
		go r.panel.updatePanelPosition()
	}
}

func (r *videoPanelRenderer) MinSize() fyne.Size {
	return fyne.NewSize(400, 300)
}

func (r *videoPanelRenderer) Refresh() {
	r.bg.FillColor = color.Black
	r.bg.Refresh()
}

func (r *videoPanelRenderer) Objects() []fyne.CanvasObject {
	return []fyne.CanvasObject{r.bg, r.label}
}

func (r *videoPanelRenderer) Destroy() {}

func (v *videoPanel) updatePanelPosition() {
	if v.state.mainHWND == 0 || v.state.panelHWND == 0 {
		return
	}

	pos := v.Position()
	size := v.Size()
	scale := v.window.Canvas().Scale()

	x := int(pos.X * scale)
	y := int(pos.Y * scale)
	w := int(size.Width * scale)
	h := int(size.Height * scale)

	// タイトルバーとボーダーの補正
	titleBarHeight := int(32 * scale)
	borderWidth := int(8 * scale)

	procMoveWindow.Call(
		uintptr(v.state.panelHWND),
		uintptr(x+borderWidth),
		uintptr(y+titleBarHeight),
		uintptr(w),
		uintptr(h),
		1,
	)
}

func main() {
	myApp := app.New()
	myApp.Settings().SetTheme(theme.DarkTheme())

	title := "動画トリミングツール"
	myWindow := myApp.NewWindow(title)
	myWindow.Resize(fyne.NewSize(900, 700))

	state := &AppState{
		volume:      100,
		windowTitle: title,
	}

	ui := createUI(myWindow, state)
	myWindow.SetContent(ui)

	myWindow.SetOnClosed(func() {
		stopVideo(state)
		if state.panelHWND != 0 {
			procDestroyWindow.Call(uintptr(state.panelHWND))
		}
	})

	go func() {
		time.Sleep(500 * time.Millisecond)
		initEmbedding(state)
	}()

	myWindow.ShowAndRun()
}

func initEmbedding(state *AppState) {
	state.mainHWND = findWindowByTitle(state.windowTitle)
	if state.mainHWND == 0 {
		fmt.Println("メインウィンドウのHWNDが見つかりません")
		return
	}
	fmt.Printf("メインHWND: %d\n", state.mainHWND)

	createEmbedPanel(state)
}

func findWindowByTitle(title string) HWND {
	titlePtr, _ := syscall.UTF16PtrFromString(title)
	ret, _, _ := procFindWindowW.Call(0, uintptr(unsafe.Pointer(titlePtr)))
	return HWND(ret)
}

func createEmbedPanel(state *AppState) {
	if state.mainHWND == 0 {
		return
	}

	className, _ := syscall.UTF16PtrFromString("STATIC")
	style := uintptr(WS_CHILD | WS_VISIBLE | WS_CLIPSIBLINGS | WS_CLIPCHILDREN)

	ret, _, err := procCreateWindowExW.Call(
		0,
		uintptr(unsafe.Pointer(className)),
		0,
		style,
		uintptr(20), uintptr(200),
		uintptr(860), uintptr(350),
		uintptr(state.mainHWND),
		0, 0, 0,
	)

	if ret == 0 {
		fmt.Println("パネル作成失敗:", err)
		return
	}

	state.panelHWND = HWND(ret)
	procShowWindow.Call(uintptr(state.panelHWND), SW_SHOW)
	fmt.Printf("パネルHWND: %d\n", state.panelHWND)

	if state.videoPlaceholder != nil {
		state.videoPlaceholder.updatePanelPosition()
	}
}

func createUI(window fyne.Window, state *AppState) fyne.CanvasObject {
	fileLabel := widget.NewLabel("ファイル: 未選択")
	fileLabel.Wrapping = fyne.TextWrapWord

	outputEntry := widget.NewEntry()
	outputEntry.SetPlaceHolder("自動生成されます")

	selectFileBtn := widget.NewButtonWithIcon("ファイル選択", theme.FolderOpenIcon(), func() {
		filePath, err := dialog.File().Filter("動画ファイル", "mp4", "mkv", "avi", "mov", "webm").Load()
		if err != nil {
			fmt.Println("キャンセルまたはエラー:", err)
			return
		}
		state.selectedFilePath = filePath
		fileLabel.SetText("ファイル: " + state.selectedFilePath)
		outputEntry.SetText(generateOutputFileName(filePath))
	})

	playBtn := widget.NewButtonWithIcon("再生", theme.MediaPlayIcon(), nil)
	stopBtn := widget.NewButtonWithIcon("停止", theme.MediaStopIcon(), nil)
	stopBtn.Disable()

	playBtn.OnTapped = func() {
		if state.selectedFilePath == "" {
			fmt.Println("ファイル未選択")
			return
		}
		if state.isPlaying {
			return
		}
		if state.panelHWND == 0 {
			fmt.Println("埋め込みパネルが準備できていません、外部ウィンドウで再生")
			go playVideoExternal(state)
		} else {
			go playVideoEmbedded(state)
		}
		playBtn.Disable()
		stopBtn.Enable()
	}

	stopBtn.OnTapped = func() {
		stopVideo(state)
		playBtn.Enable()
		stopBtn.Disable()
	}

	volumeLabel := widget.NewLabel("音量: 100%")
	volumeSlider := widget.NewSlider(0, 100)
	volumeSlider.Value = 100
	volumeSlider.OnChanged = func(value float64) {
		state.volume = value
		volumeLabel.SetText(fmt.Sprintf("音量: %.0f%%", value))
	}

	// ビデオプレビュー用カスタムウィジェット
	videoPanel := newVideoPanel(state, window)
	state.videoPlaceholder = videoPanel

	startTimeEntry := widget.NewEntry()
	startTimeEntry.SetText("0")
	startTimeEntry.SetPlaceHolder("開始秒数")

	endTimeEntry := widget.NewEntry()
	endTimeEntry.SetText("0")
	endTimeEntry.SetPlaceHolder("終了秒数 (0=最後まで)")

	processBtn := widget.NewButtonWithIcon("処理開始", theme.MediaRecordIcon(), func() {
		if state.selectedFilePath == "" {
			fmt.Println("ファイル未選択")
			return
		}

		startSec, err1 := strconv.Atoi(startTimeEntry.Text)
		endSec, err2 := strconv.Atoi(endTimeEntry.Text)
		if err1 != nil || err2 != nil {
			fmt.Println("時間指定が不正")
			return
		}
		if endSec > 0 && startSec >= endSec {
			fmt.Println("終了時間は開始時間より後にしてください")
			return
		}

		outputFile := outputEntry.Text
		if outputFile == "" {
			outputFile = generateOutputFileName(state.selectedFilePath)
		}

		go execFFmpegTrim(state.selectedFilePath, outputFile, startSec, endSec)
	})
	processBtn.Importance = widget.HighImportance

	// レイアウト
	fileSection := widget.NewCard("ファイル選択", "",
		container.NewVBox(fileLabel, selectFileBtn),
	)

	controlSection := widget.NewCard("再生コントロール", "",
		container.NewHBox(
			playBtn,
			stopBtn,
			layout.NewSpacer(),
			volumeLabel,
			container.NewGridWrap(fyne.NewSize(200, 40), volumeSlider),
		),
	)

	videoSection := widget.NewCard("動画プレビュー", "",
		container.NewGridWrap(fyne.NewSize(860, 350), videoPanel),
	)

	trimSection := widget.NewCard("トリミング設定", "",
		container.NewVBox(
			container.NewGridWithColumns(4,
				widget.NewLabel("開始時間 (秒):"), startTimeEntry,
				widget.NewLabel("終了時間 (秒):"), endTimeEntry,
			),
			container.NewBorder(nil, nil,
				widget.NewLabel("出力ファイル:"), nil, outputEntry,
			),
		),
	)

	processSection := container.NewCenter(processBtn)

	content := container.NewVBox(
		fileSection,
		controlSection,
		videoSection,
		trimSection,
		processSection,
	)

	return container.NewPadded(content)
}

func generateOutputFileName(inputPath string) string {
	timestamp := time.Now().Format("20060102_150405")
	ext := ". mp4"
	for i := len(inputPath) - 1; i >= 0; i-- {
		if inputPath[i] == '.' {
			ext = inputPath[i:]
			break
		}
	}
	return fmt.Sprintf("output_%s%s", timestamp, ext)
}

func playVideoEmbedded(state *AppState) {
	state.isPlaying = true

	args := []string{
		"--player-operation-mode=pseudo-gui",
		"--force-window=yes",
		"--volume=" + fmt.Sprintf("%.0f", state.volume),
		"--loop=inf",
		"--wid=" + fmt.Sprint(uintptr(state.panelHWND)),
		"--no-border",
		state.selectedFilePath,
	}

	state.mpvCmd = exec.Command("mpv.exe", args...)
	state.mpvCmd.Stdout = os.Stdout
	state.mpvCmd.Stderr = os.Stderr

	err := state.mpvCmd.Run()
	if err != nil {
		fmt.Println("mpvエラー:", err)
	}

	state.isPlaying = false
	state.mpvCmd = nil
}

func playVideoExternal(state *AppState) {
	state.isPlaying = true
	args := []string{
		"--player-operation-mode=pseudo-gui",
		"--force-window=yes",
		"--volume=" + fmt.Sprintf("%.0f", state.volume),
		"--loop=inf",
		"--title=動画プレビュー",
		state.selectedFilePath,
	}
	state.mpvCmd = exec.Command("mpv.exe", args...)
	state.mpvCmd.Stdout = os.Stdout
	state.mpvCmd.Stderr = os.Stderr
	_ = state.mpvCmd.Run()
	state.isPlaying = false
	state.mpvCmd = nil
}

func stopVideo(state *AppState) {
	if state.mpvCmd != nil && state.mpvCmd.Process != nil {
		state.mpvCmd.Process.Kill()
		state.mpvCmd = nil
		state.isPlaying = false
	}
}

func execFFmpegTrim(input, output string, startSec, endSec int) {
	fmt.Printf("処理開始: %s -> %s (開始:%d, 終了:%d)\n", input, output, startSec, endSec)

	args := []string{"-y", "-i", input}

	if startSec > 0 {
		args = append(args, "-ss", fmt.Sprint(startSec))
	}
	if endSec > 0 {
		args = append(args, "-to", fmt.Sprint(endSec))
	}
	args = append(args, "-c", "copy", output)

	cmd := exec.Command("ffmpeg", args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	err := cmd.Run()
	if err != nil {
		fmt.Println("FFmpegエラー:", err)
	} else {
		fmt.Println("処理完了:", output)
	}
}
