package repository

import (
	"database/sql"
	"encoding/json"
)

type AuditRepository struct {
	db *sql.DB
}

func NewAuditRepository(database *Database) *AuditRepository {
	return &AuditRepository{
		db: database.DB(),
	}
}

func (r *AuditRepository) Log(userID, action, resourceType, resourceID, ipAddress, userAgent string, metadata map[string]interface{}) error {
	var metadataJSON string
	if metadata != nil {
		bytes, err := json.Marshal(metadata)
		if err != nil {
			return err
		}
		metadataJSON = string(bytes)
	}

	query := `
		INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, user_agent, metadata)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`

	_, err := r.db.Exec(query, userID, action, resourceType, resourceID, ipAddress, userAgent, metadataJSON)
	return err
}

func (r *AuditRepository) GetUserLogs(userID string, limit int) ([]map[string]interface{}, error) {
	query := `
		SELECT action, resource_type, resource_id, timestamp, metadata
		FROM audit_logs
		WHERE user_id = ?
		ORDER BY timestamp DESC
		LIMIT ?
	`

	rows, err := r.db.Query(query, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []map[string]interface{}
	for rows.Next() {
		var action, resourceType, resourceID, timestamp, metadataStr string

		err := rows.Scan(&action, &resourceType, &resourceID, &timestamp, &metadataStr)
		if err != nil {
			return nil, err
		}

		log := map[string]interface{}{
			"action":        action,
			"resource_type": resourceType,
			"resource_id":   resourceID,
			"timestamp":     timestamp,
		}

		if metadataStr != "" {
			var metadata map[string]interface{}
			if err := json.Unmarshal([]byte(metadataStr), &metadata); err == nil {
				log["metadata"] = metadata
			}
		}

		logs = append(logs, log)
	}

	return logs, rows.Err()
}
