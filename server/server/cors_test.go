package server

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCORSMiddleware(t *testing.T) {
	// Create a simple handler
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	// Wrap with CORS middleware
	corsHandler := corsMiddleware(handler)

	tests := []struct {
		name           string
		origin         string
		method         string
		expectCORS     bool
		expectOrigin   string
	}{
		{
			name:         "Allowed origin - wails.localhost",
			origin:       "http://wails.localhost:34115",
			method:       http.MethodGet,
			expectCORS:   true,
			expectOrigin: "http://wails.localhost:34115",
		},
		{
			name:         "Allowed origin - localhost",
			origin:       "http://localhost:3000",
			method:       http.MethodPost,
			expectCORS:   true,
			expectOrigin: "http://localhost:3000",
		},
		{
			name:         "Allowed origin - 127.0.0.1",
			origin:       "http://127.0.0.1:8080",
			method:       http.MethodGet,
			expectCORS:   true,
			expectOrigin: "http://127.0.0.1:8080",
		},
		{
			name:       "Not allowed origin",
			origin:     "http://evil.com",
			method:     http.MethodGet,
			expectCORS: false,
		},
		{
			name:       "No origin header",
			origin:     "",
			method:     http.MethodGet,
			expectCORS: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(tt.method, "http://example.com/test", nil)
			if tt.origin != "" {
				req.Header.Set("Origin", tt.origin)
			}
			w := httptest.NewRecorder()

			corsHandler.ServeHTTP(w, req)

			if tt.expectCORS {
				if got := w.Header().Get("Access-Control-Allow-Origin"); got != tt.expectOrigin {
					t.Errorf("Access-Control-Allow-Origin = %v, want %v", got, tt.expectOrigin)
				}
				if got := w.Header().Get("Access-Control-Allow-Methods"); got == "" {
					t.Errorf("Access-Control-Allow-Methods header missing")
				}
				if got := w.Header().Get("Access-Control-Allow-Headers"); got == "" {
					t.Errorf("Access-Control-Allow-Headers header missing")
				}
				if got := w.Header().Get("Access-Control-Allow-Credentials"); got != "true" {
					t.Errorf("Access-Control-Allow-Credentials = %v, want true", got)
				}
			} else {
				if got := w.Header().Get("Access-Control-Allow-Origin"); got != "" {
					t.Errorf("Access-Control-Allow-Origin should be empty for disallowed origin, got %v", got)
				}
			}
		})
	}
}

func TestCORSPreflightRequest(t *testing.T) {
	// Create a simple handler
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	// Wrap with CORS middleware
	corsHandler := corsMiddleware(handler)

	req := httptest.NewRequest(http.MethodOptions, "http://example.com/test", nil)
	req.Header.Set("Origin", "http://wails.localhost:34115")
	req.Header.Set("Access-Control-Request-Method", "POST")
	req.Header.Set("Access-Control-Request-Headers", "Content-Type")
	
	w := httptest.NewRecorder()
	corsHandler.ServeHTTP(w, req)

	// Preflight requests should return 200 OK
	if w.Code != http.StatusOK {
		t.Errorf("Preflight request status = %v, want %v", w.Code, http.StatusOK)
	}

	// Should have CORS headers
	if got := w.Header().Get("Access-Control-Allow-Origin"); got != "http://wails.localhost:34115" {
		t.Errorf("Access-Control-Allow-Origin = %v, want %v", got, "http://wails.localhost:34115")
	}
	if got := w.Header().Get("Access-Control-Allow-Methods"); got == "" {
		t.Errorf("Access-Control-Allow-Methods header missing")
	}

	// Body should be empty for preflight
	if w.Body.String() != "" {
		t.Errorf("Preflight response body should be empty, got %v", w.Body.String())
	}
}

func TestIsAllowedOrigin(t *testing.T) {
	tests := []struct {
		name     string
		origin   string
		expected bool
	}{
		{"wails.localhost with port", "http://wails.localhost:34115", true},
		{"wails.localhost without port", "http://wails.localhost", true},
		{"localhost with port", "http://localhost:3000", true},
		{"localhost without port", "http://localhost", true},
		{"127.0.0.1 with port", "http://127.0.0.1:8080", true},
		{"127.0.0.1 without port", "http://127.0.0.1", true},
		{"https not allowed", "https://localhost:3000", false},
		{"evil domain", "http://evil.com", false},
		{"empty origin", "", false},
		{"subdomain of localhost", "http://sub.localhost:3000", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := isAllowedOrigin(tt.origin)
			if got != tt.expected {
				t.Errorf("isAllowedOrigin(%v) = %v, want %v", tt.origin, got, tt.expected)
			}
		})
	}
}
