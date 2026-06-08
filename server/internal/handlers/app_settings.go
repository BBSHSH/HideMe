package handlers

import (
	"database/sql"
	"net/http"

	"github.com/BBSHSH/HideMe/server/internal/db"
	"github.com/gin-gonic/gin"
)

const (
	keySidebarNav          = "sidebar_nav"
	keyStorageDefaultTab   = "storage_default_tab"
	keyMemberCanCustomize  = "member_can_customize"
)

func GetAppSettings(database *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		nav, err := db.GetAppSetting(database, keySidebarNav)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error"})
			return
		}
		tab, err := db.GetAppSetting(database, keyStorageDefaultTab)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error"})
			return
		}
		memberCanCustomize, err := db.GetAppSetting(database, keyMemberCanCustomize)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error"})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"sidebar_nav":           nav,
			"storage_default_tab":   tab,
			"member_can_customize":  memberCanCustomize == "true",
		})
	}
}

func UpdateAppSettings(database *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var body struct {
			SidebarNav          *string `json:"sidebar_nav"`
			StorageDefaultTab   *string `json:"storage_default_tab"`
			MemberCanCustomize  *bool   `json:"member_can_customize"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_request"})
			return
		}
		if body.SidebarNav != nil {
			if err := db.SetAppSetting(database, keySidebarNav, *body.SidebarNav); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error"})
				return
			}
		}
		if body.StorageDefaultTab != nil {
			if err := db.SetAppSetting(database, keyStorageDefaultTab, *body.StorageDefaultTab); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error"})
				return
			}
		}
		if body.MemberCanCustomize != nil {
			val := "false"
			if *body.MemberCanCustomize { val = "true" }
			if err := db.SetAppSetting(database, keyMemberCanCustomize, val); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "db_error"})
				return
			}
		}
		c.JSON(http.StatusOK, gin.H{"updated": true})
	}
}
