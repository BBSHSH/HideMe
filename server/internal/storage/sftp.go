package storage

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net"
	"os"
	"path"
	"time"

	"github.com/BBSHSH/HideMe/server/internal/config"
	"github.com/pkg/sftp"
	"golang.org/x/crypto/ssh"
)

type SFTPStorage struct {
	cfg config.NASConfig
}

func NewSFTPStorage(cfg config.NASConfig) *SFTPStorage {
	return &SFTPStorage{cfg: cfg}
}

func (s *SFTPStorage) Delete(ctx context.Context, name string) error {
	client, sshClient, err := s.connect(ctx)
	if err != nil {
		return err
	}
	defer func() {
		_ = client.Close()
		_ = sshClient.Close()
	}()

	target := s.uploadPath(name)
	if err := client.Remove(target); err != nil {
		if os.IsNotExist(err) {
			return ErrNotFound
		}
		return err
	}
	return nil
}

func (s *SFTPStorage) List(ctx context.Context) ([]FileItem, error) {
	client, sshClient, err := s.connect(ctx)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = client.Close()
		_ = sshClient.Close()
	}()

	if err := s.ensureDirs(client); err != nil {
		return nil, err
	}

	entries, err := client.ReadDir(s.cfg.UploadDir)
	if err != nil {
		return nil, err
	}

	items := make([]FileItem, 0, len(entries))
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		items = append(items, FileItem{
			Name:     entry.Name(),
			Size:     entry.Size(),
			Modified: entry.ModTime().UTC(),
		})
	}
	return items, nil
}

func (s *SFTPStorage) Upload(ctx context.Context, name string, data io.Reader, size int64) (FileItem, error) {
	if s.cfg.MaxFileSize > 0 && size > s.cfg.MaxFileSize {
		return FileItem{}, ErrFileTooLarge
	}

	client, sshClient, err := s.connect(ctx)
	if err != nil {
		return FileItem{}, err
	}
	defer func() {
		_ = client.Close()
		_ = sshClient.Close()
	}()

	if err := s.ensureDirs(client); err != nil {
		return FileItem{}, err
	}

	target := s.uploadPath(name)
	writer, err := client.OpenFile(target, os.O_CREATE|os.O_WRONLY|os.O_TRUNC)
	if err != nil {
		return FileItem{}, err
	}
	defer writer.Close()

	buf := make([]byte, s.cfg.ChunkSize)
	if _, err := io.CopyBuffer(writer, data, buf); err != nil {
		return FileItem{}, err
	}

	info, err := client.Stat(target)
	if err != nil {
		return FileItem{}, err
	}

	return FileItem{
		Name:     info.Name(),
		Size:     info.Size(),
		Modified: info.ModTime().UTC(),
	}, nil
}

func (s *SFTPStorage) Open(ctx context.Context, name string) (io.ReadCloser, FileItem, error) {
	client, sshClient, err := s.connect(ctx)
	if err != nil {
		return nil, FileItem{}, err
	}

	if err := s.ensureDirs(client); err != nil {
		_ = client.Close()
		_ = sshClient.Close()
		return nil, FileItem{}, err
	}

	target := s.uploadPath(name)
	file, err := client.Open(target)
	if err != nil {
		_ = client.Close()
		_ = sshClient.Close()
		if os.IsNotExist(err) {
			return nil, FileItem{}, ErrNotFound
		}
		var statusErr *sftp.StatusError
		if errors.As(err, &statusErr) && statusErr.Code == uint32(sftp.ErrSSHFxNoSuchFile) {
			return nil, FileItem{}, ErrNotFound
		}
		return nil, FileItem{}, err
	}

	info, err := file.Stat()
	if err != nil {
		_ = file.Close()
		_ = client.Close()
		_ = sshClient.Close()
		return nil, FileItem{}, err
	}

	return &sftpReadCloser{
			file:   file,
			client: client,
			ssh:    sshClient,
		}, FileItem{
			Name:     info.Name(),
			Size:     info.Size(),
			Modified: info.ModTime().UTC(),
		}, nil
}

func (s *SFTPStorage) uploadPath(name string) string {
	safe := path.Base(name)
	return path.Join(s.cfg.UploadDir, safe)
}

func (s *SFTPStorage) ensureDirs(client *sftp.Client) error {
	if err := client.MkdirAll(s.cfg.UploadDir); err != nil {
		return err
	}
	if s.cfg.TempDir != "" {
		if err := client.MkdirAll(s.cfg.TempDir); err != nil {
			return err
		}
	}
	return nil
}

func (s *SFTPStorage) connect(ctx context.Context) (*sftp.Client, *ssh.Client, error) {
	var lastErr error
	retries := s.cfg.MaxRetries
	for attempt := 0; attempt <= retries; attempt++ {
		client, sshClient, err := s.connectOnce(ctx)
		if err == nil {
			return client, sshClient, nil
		}
		lastErr = err

		if attempt == retries {
			break
		}

		select {
		case <-ctx.Done():
			return nil, nil, ctx.Err()
		case <-time.After(time.Duration(s.cfg.RetryDelay) * time.Second):
		}
	}
	return nil, nil, lastErr
}

func (s *SFTPStorage) connectOnce(ctx context.Context) (*sftp.Client, *ssh.Client, error) {
	auths := make([]ssh.AuthMethod, 0)
	if s.cfg.PrivateKeyPath != "" {
		keyBytes, err := os.ReadFile(s.cfg.PrivateKeyPath)
		if err != nil {
			return nil, nil, err
		}
		signer, err := ssh.ParsePrivateKey(keyBytes)
		if err != nil {
			return nil, nil, err
		}
		auths = append(auths, ssh.PublicKeys(signer))
	}
	if s.cfg.Password != "" {
		auths = append(auths, ssh.Password(s.cfg.Password))
	}
	if len(auths) == 0 {
		return nil, nil, errors.New("no auth method configured")
	}

	sshConfig := &ssh.ClientConfig{
		User:            s.cfg.Username,
		Auth:            auths,
		HostKeyCallback: ssh.InsecureIgnoreHostKey(), // TODO: replace with known_hosts in production.
		Timeout:         time.Duration(s.cfg.Timeout) * time.Second,
	}

	addr := fmt.Sprintf("%s:%d", s.cfg.Host, s.cfg.Port)
	dialer := net.Dialer{Timeout: time.Duration(s.cfg.Timeout) * time.Second}
	conn, err := dialer.DialContext(ctx, "tcp", addr)
	if err != nil {
		return nil, nil, err
	}

	clientConn, chans, reqs, err := ssh.NewClientConn(conn, addr, sshConfig)
	if err != nil {
		_ = conn.Close()
		return nil, nil, err
	}
	sshClient := ssh.NewClient(clientConn, chans, reqs)

	sftpClient, err := sftp.NewClient(sshClient)
	if err != nil {
		_ = sshClient.Close()
		return nil, nil, err
	}
	return sftpClient, sshClient, nil
}

type sftpReadCloser struct {
	file   *sftp.File
	client *sftp.Client
	ssh    *ssh.Client
}

func (s *sftpReadCloser) Read(p []byte) (int, error) {
	return s.file.Read(p)
}

func (s *sftpReadCloser) Close() error {
	_ = s.file.Close()
	_ = s.client.Close()
	return s.ssh.Close()
}
