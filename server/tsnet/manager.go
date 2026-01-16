package tsnet

import (
	"context"
	"log"
	"net"

	"tailscale.com/tsnet"
)

type TsnetManager struct {
	server *tsnet.Server
}

func NewTsnetManager() *TsnetManager {
	return &TsnetManager{}
}

func (t *TsnetManager) Start(ctx context.Context, hostname string) error {
	t.server = &tsnet.Server{
		Hostname: hostname,
		Dir:      "./tsnet-server-state",
	}

	status, err := t.server.Up(ctx)
	if err != nil {
		return err
	}

	log.Printf("tsnet server started: %s (%v)\n",
		hostname, status.TailscaleIPs)

	return nil
}

func (t *TsnetManager) Listen(network, addr string) (net.Listener, error) {
	return t.server.Listen(network, addr)
}

func (t *TsnetManager) Server() *tsnet.Server {
	return t.server
}

func (t *TsnetManager) Stop() error {
	if t.server != nil {
		return t.server.Close()
	}
	return nil
}
