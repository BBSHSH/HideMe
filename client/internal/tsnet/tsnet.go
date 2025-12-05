package tsnet

import (
	"context"
	"fmt"
	"log"

	"tailscale.com/tsnet"
)

func RunTailscale(hostname string) {
	server := &tsnet.Server{
		Hostname: hostname,
		Dir:      "./tsnet-" + hostname + "-state",
	}

	if err := server.Start(); err != nil {
		log.Fatalf("Failed to start tsnet server: %v", err)
	}
	defer server.Close()

	fmt.Printf("[%s] Tailscale server running...\n", hostname)

	ctx := context.Background()
	<-ctx.Done()
}
