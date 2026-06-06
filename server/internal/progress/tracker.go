package progress

import (
	"sync"
)

// Phase はアップロードのフェーズを表す
type Phase string

const (
	PhaseFFmpeg Phase = "ffmpeg" // サーバー側 AV1 エンコード
	PhaseNAS    Phase = "nas"    // NAS への転送
	PhaseDone   Phase = "done"
	PhaseError  Phase = "error"
)

// Event は SSE に流すイベント
type Event struct {
	Phase   Phase   `json:"phase"`
	Percent float64 `json:"percent,omitempty"`
	FileID  string  `json:"file_id,omitempty"`
	Message string  `json:"message,omitempty"`
}

// Tracker は uploadId ごとにチャネルを管理する
type Tracker struct {
	mu       sync.Mutex
	channels map[string]chan Event
}

var Global = &Tracker{channels: make(map[string]chan Event)}

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
	t.mu.Unlock()
	if ok {
		select {
		case ch <- ev:
		default:
		}
	}
}

func (t *Tracker) Close(id string) {
	t.mu.Lock()
	defer t.mu.Unlock()
	if ch, ok := t.channels[id]; ok {
		close(ch)
		delete(t.channels, id)
	}
}
