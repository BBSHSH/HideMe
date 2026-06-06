package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/BBSHSH/HideMe/server/internal/config"
	"github.com/BBSHSH/HideMe/server/internal/db"
	"github.com/joho/godotenv"
	"github.com/BBSHSH/HideMe/server/internal/handlers"
	"github.com/BBSHSH/HideMe/server/internal/middleware"
	"github.com/BBSHSH/HideMe/server/internal/storage"
	"github.com/gin-gonic/gin"
)

func main() {
	// .env ファイルが存在すれば読み込む（なくてもエラーにしない）
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

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

	discordCfg := config.LoadDiscord()

	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "./hideme.db"
	}

	database, err := db.Open(dbPath)
	if err != nil {
		log.Fatalf("failed to open db: %v", err)
	}
	defer database.Close()

	// 両ストレージを常に生成し、設定された方をプライマリに
	nasStore   := storage.NewSFTPStorage(cfg.NAS)
	localStore := storage.NewLocalStorage(cfg.Local)

	var store storage.Storage
	switch cfg.StorageType {
	case config.StorageLocal:
		store = localStore
		log.Printf("storage: local  dir=%s", cfg.Local.UploadDir)
	default:
		store = nasStore
		log.Printf("storage: nas  host=%s  dir=%s", cfg.NAS.Host, cfg.NAS.UploadDir)
	}

	// ストレージセレクター: ファイルに記録された storage_type で正しいストアを返す
	storeFor := func(storageType string) storage.Storage {
		if storageType == "local" {
			return localStore
		}
		return nasStore
	}

	router := gin.New()
	router.Use(gin.Logger(), gin.Recovery(), middleware.CORS())

	router.GET("/health", handlers.Health)

	// フロントエンド静的ファイル配信（./dist が存在する場合）
	if _, err := os.Stat("./dist"); err == nil {
		router.Static("/assets", "./dist/assets")
		router.StaticFile("/favicon.ico", "./dist/favicon.ico")
		// SPA: /v1 以外はすべて index.html を返す
		router.NoRoute(func(c *gin.Context) {
			if len(c.Request.URL.Path) >= 3 && c.Request.URL.Path[:3] == "/v1" {
				c.JSON(404, gin.H{"error": "not found"})
				return
			}
			c.File("./dist/index.html")
		})
		log.Println("serving frontend from ./dist")
	}

	api := router.Group("/v1")

	// auth (認証不要)
	api.POST("/auth/register", handlers.Register(database))
	api.POST("/auth/login", handlers.Login(database))
	api.GET("/auth/settings", handlers.GetAuthSettings(database))
	api.PUT("/auth/settings", middleware.RequireAuth(), middleware.RequireAdmin(), handlers.UpdateAuthSettings(database))

	// Discord OAuth2
	api.GET("/auth/discord", handlers.DiscordOAuthRedirect(discordCfg))
	api.GET("/auth/discord/callback", handlers.DiscordOAuthCallback(discordCfg, database))

	// files（ワイルドカード *name は最後に登録 — 全パスをキャッチするため）
	api.GET("/files", handlers.ListFiles(store))
	api.POST("/files/upload", handlers.UploadFile(store))
	api.GET("/all-files", handlers.ListAllFiles(database))
	api.GET("/files/*name", handlers.DownloadFile(database, storeFor))
	api.GET("/stats", handlers.GetStats(database, store))
	// collections (adminのみ)
	api.GET("/collections", handlers.ListCollections(database))
	api.POST("/collections/upload-image", middleware.RequireAuth(), middleware.RequireAdmin(), handlers.UploadCollectionImage(store))
	api.POST("/collections", middleware.RequireAuth(), middleware.RequireAdmin(), handlers.CreateCollection(database))
	api.PUT("/collections/:id", middleware.RequireAuth(), middleware.RequireAdmin(), handlers.UpdateCollection(database))
	api.DELETE("/collections/:id", middleware.RequireAuth(), middleware.RequireAdmin(), handlers.DeleteCollection(database, store))
	// collection files
	api.GET("/collections/:id/files", handlers.ListCollectionFiles(database))
	api.POST("/collections/:id/files", middleware.RequireAuth(), handlers.UploadToCollection(store, database, string(cfg.StorageType)))
	api.DELETE("/collections/:id/files/:fileID", middleware.RequireAuth(), handlers.DeleteCollectionFile(database, storeFor))

	// SSE: アップロード進捗
	api.GET("/upload-progress/:uploadId", handlers.SSEUploadProgress())

	// users (DM 相手選択用)
	api.GET("/users", middleware.RequireAuth(), handlers.ListUsers(database))

	// DM
	api.GET("/dm/conversations", middleware.RequireAuth(), handlers.ListDMConversations(database))
	api.POST("/dm/conversations", middleware.RequireAuth(), handlers.OpenDMConversation(database))
	api.GET("/dm/conversations/:id/messages", middleware.RequireAuth(), handlers.ListDMMessages(database))
	api.POST("/dm/conversations/:id/messages", middleware.RequireAuth(), handlers.PostDMMessage(database))

	// chat
	api.GET("/chat/ws", handlers.ChatWebSocket())
	api.GET("/chat/channels", handlers.ListChannels(database))
	api.POST("/chat/channels", middleware.RequireAuth(), middleware.RequireAdmin(), handlers.CreateChannel(database))
	api.DELETE("/chat/channels/:id", middleware.RequireAuth(), middleware.RequireAdmin(), handlers.DeleteChannel(database))
	api.GET("/chat/channels/:id/messages", middleware.RequireAuth(), handlers.ListMessages(database))
	api.POST("/chat/channels/:id/messages", middleware.RequireAuth(), handlers.PostMessage(database))
	api.DELETE("/chat/messages/:id", middleware.RequireAuth(), handlers.DeleteMessage(database))
	api.POST("/chat/channels/:id/voice/join", middleware.RequireAuth(), handlers.VoiceJoin())
	api.POST("/chat/channels/:id/voice/leave", middleware.RequireAuth(), handlers.VoiceLeave())

	server := &http.Server{
		Addr:              ":" + port,
		Handler:           router,
		ReadTimeout:       0,
		ReadHeaderTimeout: 10 * time.Second,
		WriteTimeout:      0,
		IdleTimeout:       60 * time.Second,
	}

	log.Printf("api listening on :%s", port)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server error: %v", err)
	}
}
