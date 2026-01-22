package repository

import (
	"database/sql"
	"hidemeserver/models"
)

type MessageRepository struct {
	db *sql.DB
}

func NewMessageRepository(database *Database) *MessageRepository {
	return &MessageRepository{
		db: database.DB(),
	}
}

func (r *MessageRepository) Create(msg *models.Message) error {
	query := `
		INSERT INTO messages (id, from_id, to_id, content, type, timestamp, read_status)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`

	_, err := r.db.Exec(query,
		msg.ID,
		msg.FromID,
		msg.ToID,
		msg.Content,
		msg.Type,
		msg.Timestamp,
		msg.Read,
	)

	return err
}

func (r *MessageRepository) GetConversation(userID1, userID2 string, limit int) ([]models.Message, error) {
	var query string
	var args []interface{}

	if limit > 0 {
		query = `
			SELECT id, from_id, to_id, content, type, timestamp, read_status
			FROM (
				SELECT id, from_id, to_id, content, type, timestamp, read_status
				FROM messages
				WHERE ((from_id = ? AND to_id = ?) OR (from_id = ? AND to_id = ?))
				  AND deleted_at IS NULL
				ORDER BY timestamp DESC
				LIMIT ?
			)
			ORDER BY timestamp ASC
		`
		args = []interface{}{userID1, userID2, userID2, userID1, limit}
	} else {
		query = `
			SELECT id, from_id, to_id, content, type, timestamp, read_status
			FROM messages
			WHERE ((from_id = ? AND to_id = ?) OR (from_id = ? AND to_id = ?))
			  AND deleted_at IS NULL
			ORDER BY timestamp ASC
		`
		args = []interface{}{userID1, userID2, userID2, userID1}
	}

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []models.Message
	for rows.Next() {
		var msg models.Message
		err := rows.Scan(
			&msg.ID,
			&msg.FromID,
			&msg.ToID,
			&msg.Content,
			&msg.Type,
			&msg.Timestamp,
			&msg.Read,
		)
		if err != nil {
			return nil, err
		}
		messages = append(messages, msg)
	}

	return messages, rows.Err()
}

func (r *MessageRepository) MarkAsRead(messageID string) error {
	query := `UPDATE messages SET read_status = 1 WHERE id = ? AND deleted_at IS NULL`
	_, err := r.db.Exec(query, messageID)
	return err
}

func (r *MessageRepository) MarkConversationAsRead(userID, otherUserID string) error {
	query := `
		UPDATE messages 
		SET read_status = 1 
		WHERE from_id = ? AND to_id = ? AND read_status = 0 AND deleted_at IS NULL
	`
	_, err := r.db.Exec(query, otherUserID, userID)
	return err
}

func (r *MessageRepository) GetUnreadCount(userID string) (int, error) {
	query := `
		SELECT COUNT(*) 
		FROM messages 
		WHERE to_id = ? AND read_status = 0 AND deleted_at IS NULL
	`

	var count int
	err := r.db.QueryRow(query, userID).Scan(&count)
	return count, err
}

func (r *MessageRepository) GetUnreadCountByUser(userID, fromUserID string) (int, error) {
	query := `
		SELECT COUNT(*) 
		FROM messages 
		WHERE to_id = ? AND from_id = ? AND read_status = 0 AND deleted_at IS NULL
	`

	var count int
	err := r.db.QueryRow(query, userID, fromUserID).Scan(&count)
	return count, err
}

func (r *MessageRepository) GetRecentMessages(limit int) ([]models.Message, error) {
	query := `
		SELECT id, from_id, to_id, content, type, timestamp, read_status
		FROM messages
		WHERE deleted_at IS NULL
		ORDER BY timestamp DESC
		LIMIT ?
	`

	rows, err := r.db.Query(query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []models.Message
	for rows.Next() {
		var msg models.Message
		err := rows.Scan(
			&msg.ID,
			&msg.FromID,
			&msg.ToID,
			&msg.Content,
			&msg.Type,
			&msg.Timestamp,
			&msg.Read,
		)
		if err != nil {
			return nil, err
		}
		messages = append(messages, msg)
	}

	return messages, rows.Err()
}

func (r *MessageRepository) SoftDeleteConversation(userID1, userID2 string) error {
	query := `
		UPDATE messages
		SET deleted_at = CURRENT_TIMESTAMP
		WHERE ((from_id = ? AND to_id = ?) OR (from_id = ? AND to_id = ?))
		  AND deleted_at IS NULL
	`
	_, err := r.db.Exec(query, userID1, userID2, userID2, userID1)
	return err
}

func (r *MessageRepository) HardDeleteByUser(userID string) error {
	query := `DELETE FROM messages WHERE from_id = ? OR to_id = ?`
	_, err := r.db.Exec(query, userID, userID)
	return err
}
