package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestIsAllowedOrigin(t *testing.T) {
	tests := []struct {
		name     string
		origin   string
		expected bool
	}{
		{"Empty origin", "", false},
		{"Localhost exact", "http://localhost", true},
		{"Localhost with port", "http://localhost:34115", true},
		{"Wails localhost exact", "http://wails.localhost", true},
		{"Wails localhost with port", "http://wails.localhost:34115", true},
		{"127.0.0.1 exact", "http://127.0.0.1", true},
		{"127.0.0.1 with port", "http://127.0.0.1:8080", true},
		{"Malicious localhost", "http://localhost.evil.com", false},
		{"Malicious localhost with port", "http://localhost.evil.com:8080", false},
		{"Malicious wails", "http://wails.localhost.evil.com", false},
		{"HTTPS localhost", "https://localhost", false},
		{"Unknown origin", "http://example.com", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := isAllowedOrigin(tt.origin)
			if result != tt.expected {
				t.Errorf("isAllowedOrigin(%q) = %v, expected %v", tt.origin, result, tt.expected)
			}
		})
	}
}

func TestCORSMiddleware(t *testing.T) {
	handler := corsMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	}))

	tests := []struct {
		name           string
		origin         string
		method         string
		expectCORS     bool
		expectStatus   int
		expectBody     string
	}{
		{
			name:         "Allowed origin with GET",
			origin:       "http://localhost:34115",
			method:       "GET",
			expectCORS:   true,
			expectStatus: http.StatusOK,
			expectBody:   "OK",
		},
		{
			name:         "Allowed origin with OPTIONS",
			origin:       "http://wails.localhost:34115",
			method:       "OPTIONS",
			expectCORS:   true,
			expectStatus: http.StatusOK,
			expectBody:   "",
		},
		{
			name:         "Disallowed origin",
			origin:       "http://evil.com",
			method:       "GET",
			expectCORS:   false,
			expectStatus: http.StatusOK,
			expectBody:   "OK",
		},
		{
			name:         "No origin header",
			origin:       "",
			method:       "GET",
			expectCORS:   false,
			expectStatus: http.StatusOK,
			expectBody:   "OK",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(tt.method, "/test", nil)
			if tt.origin != "" {
				req.Header.Set("Origin", tt.origin)
			}

			rr := httptest.NewRecorder()
			handler.ServeHTTP(rr, req)

			if rr.Code != tt.expectStatus {
				t.Errorf("Expected status %d, got %d", tt.expectStatus, rr.Code)
			}

			if tt.expectCORS {
				corsOrigin := rr.Header().Get("Access-Control-Allow-Origin")
				if corsOrigin != tt.origin {
					t.Errorf("Expected CORS origin %q, got %q", tt.origin, corsOrigin)
				}

				methods := rr.Header().Get("Access-Control-Allow-Methods")
				if methods != "GET, POST, PUT, DELETE, OPTIONS" {
					t.Errorf("Expected CORS methods, got %q", methods)
				}

				headers := rr.Header().Get("Access-Control-Allow-Headers")
				if headers != "Content-Type, Authorization" {
					t.Errorf("Expected CORS headers, got %q", headers)
				}

				credentials := rr.Header().Get("Access-Control-Allow-Credentials")
				if credentials != "true" {
					t.Errorf("Expected CORS credentials true, got %q", credentials)
				}
			} else {
				corsOrigin := rr.Header().Get("Access-Control-Allow-Origin")
				if corsOrigin != "" {
					t.Errorf("Expected no CORS headers, but got origin %q", corsOrigin)
				}
			}

			if rr.Body.String() != tt.expectBody {
				t.Errorf("Expected body %q, got %q", tt.expectBody, rr.Body.String())
			}
		})
	}
}
