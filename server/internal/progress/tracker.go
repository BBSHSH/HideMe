package progress

import (
	"sync"
)

// Phase はアップロードのフェーズを表す
type Phase string

const (
	PhaseFFmpeg Phase = "ffmpeg" // サーバー側エンコード
	PhaseNAS    Phase = "nas"    // NAS への転送
	PhaseDone   Phase = "done"
	PhaseError  Phase = "error"
)

// Event は進捗イベント
type Event struct {
	Phase   Phase   `json:"phase"`
	Percent float64 `json:"percent,omitempty"`
	FileID  string  `json:"file_id,omitempty"`
	Message string  `json:"message,omitempty"`
}

// Tracker は uploadId ごとにチャネルと最新状態を管理する
type Tracker struct {
	mu       sync.Mutex
	channels map[string]chan Event
	latest   map[string]Event // ポーリング用に最新イベントを保持
}

var Global = &Tracker{
	channels: make(map[string]chan Event),
	latest:   make(map[string]Event),
}

func (t *Tracker) Register(id string) chan Event {
	ch := make(chan Event, 64)
	t.mu.Lock()
	t.channels[id] = ch
	t.mu.Unlock()
	return ch
}

func (t *Tracker) Send(id string, ev Event) {
	t.mu.Lock()
	ch, ok := t.channels[id]
	t.latest[id] = ev // 最新状態を常に保持
	t.mu.Unlock()
	if ok {
		select {
		case ch <- ev:
		default:
		}
	}
}

// Latest は指定 ID の最新イベントを返す（ポーリング用）
func (t *Tracker) Latest(id string) (Event, bool) {
	t.mu.Lock()
	defer t.mu.Unlock()
	ev, ok := t.latest[id]
	return ev, ok
}

func (t *Tracker) Close(id string) {
	t.mu.Lock()
	defer t.mu.Unlock()
	if ch, ok := t.channels[id]; ok {
		close(ch)
		delete(t.channels, id)
	}
	// latest は done/error 後も一定時間保持（ポーリングが間に合うように）
}

// CleanLatest は最新状態を削除する（done/error 確認後に呼ぶ）
func (t *Tracker) CleanLatest(id string) {
	t.mu.Lock()
	defer t.mu.Unlock()
	delete(t.latest, id)
}
