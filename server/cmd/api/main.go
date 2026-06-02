package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/BBSHSH/HideMe/server/internal/config"
	"github.com/BBSHSH/HideMe/server/internal/db"
	"github.com/BBSHSH/HideMe/server/internal/handlers"
	"github.com/BBSHSH/HideMe/server/internal/middleware"
	"github.com/BBSHSH/HideMe/server/internal/storage"
	"github.com/gin-gonic/gin"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	configPath := os.Getenv("NAS_CONFIG")
	if configPath == "" {
		configPath = "./config/nas.yaml"
	}

	cfg, err := config.Load(configPath)
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "./hideme.db"
	}

	database, err := db.Open(dbPath)
	if err != nil {
		log.Fatalf("failed to open db: %v", err)
	}
	defer database.Close()

	store := storage.NewSFTPStorage(cfg.NAS)

	router := gin.New()
	router.Use(gin.Logger(), gin.Recovery(), middleware.CORS())

	router.GET("/health", handlers.Health)

	api := router.Group("/v1")

	// auth (認証不要)
	api.POST("/auth/register", handlers.Register(database))
	api.POST("/auth/login", handlers.Login(database))

	// files
	api.GET("/files", handlers.ListFiles(store))
	api.POST("/files/upload", handlers.UploadFile(store))
	api.GET("/files/:name", handlers.DownloadFile(store))

	// collections (adminのみ)
	api.GET("/collections", handlers.ListCollections(database))
	api.POST("/collections", middleware.RequireAuth(), middleware.RequireAdmin(), handlers.CreateCollection(database))
	api.PUT("/collections/:id", middleware.RequireAuth(), middleware.RequireAdmin(), handlers.UpdateCollection(database))
	api.DELETE("/collections/:id", middleware.RequireAuth(), middleware.RequireAdmin(), handlers.DeleteCollection(database))

	// collection files
	api.GET("/collections/:id/files", handlers.ListCollectionFiles(database))
	api.POST("/collections/:id/files", middleware.RequireAuth(), handlers.UploadToCollection(store, database))
	api.DELETE("/collections/:id/files/:fileID", middleware.RequireAuth(), handlers.DeleteCollectionFile(store, database))

	server := &http.Server{
		Addr:              ":" + port,
		Handler:           router,
		ReadTimeout:       15 * time.Second,
		ReadHeaderTimeout: 10 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	log.Printf("api listening on :%s", port)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server error: %v", err)
	}
}
