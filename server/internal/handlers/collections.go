package handlers

import (
	"database/sql"
	"net/http"

	"github.com/BBSHSH/HideMe/server/internal/db"
	"github.com/gin-gonic/gin"
)

func ListCollections(database *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		collections, err := db.ListCollections(database)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_list_collections"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"items": collections})
	}
}

func CreateCollection(database *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var body struct {
			Name        string `json:"name"        binding:"required"`
			Description string `json:"description"`
			Color       string `json:"color"`
			Icon        string `json:"icon"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_request"})
			return
		}
		col, err := db.CreateCollection(database, body.Name, body.Description, body.Color, body.Icon)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_create_collection"})
			return
		}
		c.JSON(http.StatusOK, col)
	}
}

func UpdateCollection(database *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var body struct {
			Name        string `json:"name"        binding:"required"`
			Description string `json:"description"`
			Color       string `json:"color"`
			Icon        string `json:"icon"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_request"})
			return
		}
		if err := db.UpdateCollection(database, id, body.Name, body.Description, body.Color, body.Icon); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_update_collection"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"updated": true})
	}
}

func DeleteCollection(database *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		if err := db.DeleteCollection(database, id); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_delete_collection"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"deleted": true})
	}
}
