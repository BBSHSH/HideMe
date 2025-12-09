package app

import (
	"log"

	"tailscale.com/tsnet"
)

type TsnetManager struct {
	server *tsnet.Server
}

func NewTsnetManager() *TsnetManager {
	return &TsnetManager{}
}

func (t *TsnetManager) StartServer(hostname string) error {
	t.server = &tsnet.Server{
		Hostname: hostname,
		Dir:      "./tsnet-server-state",
	}

	if err := t.server.Start(); err != nil {
		return err
	}

	log.Println("tsnet server started with hostname:", hostname)
	return nil
}

func (t *TsnetManager) StopServer() error {
	if t.server != nil {
		return t.server.Close()
	}
	return nil
}

// tsnet.Server を返す
func (t *TsnetManager) Server() *tsnet.Server {
	return t.server
}
