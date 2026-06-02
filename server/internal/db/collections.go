package db

import (
	"database/sql"
	"errors"

	"github.com/google/uuid"
)

type Collection struct {
	ID          string
	Name        string
	Description string
	Color       string
	Icon        string
}

var ErrCollectionNotFound = errors.New("collection not found")

func CreateCollection(db *sql.DB, name, description, color, icon string) (Collection, error) {
	id := uuid.NewString()
	_, err := db.Exec(
		`INSERT INTO collections (id, name, description, color, icon) VALUES (?, ?, ?, ?, ?)`,
		id, name, description, color, icon,
	)
	if err != nil {
		return Collection{}, err
	}
	return GetCollectionByID(db, id)
}

func GetCollectionByID(db *sql.DB, id string) (Collection, error) {
	var c Collection
	err := db.QueryRow(
		`SELECT id, name, description, color, icon FROM collections WHERE id = ?`, id,
	).Scan(&c.ID, &c.Name, &c.Description, &c.Color, &c.Icon)
	if errors.Is(err, sql.ErrNoRows) {
		return Collection{}, ErrCollectionNotFound
	}
	return c, err
}

func ListCollections(db *sql.DB) ([]Collection, error) {
	rows, err := db.Query(`SELECT id, name, description, color, icon FROM collections`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var collections []Collection
	for rows.Next() {
		var c Collection
		if err := rows.Scan(&c.ID, &c.Name, &c.Description, &c.Color, &c.Icon); err != nil {
			return nil, err
		}
		collections = append(collections, c)
	}
	return collections, rows.Err()
}

func UpdateCollection(db *sql.DB, id, name, description, color, icon string) error {
	_, err := db.Exec(
		`UPDATE collections SET name=?, description=?, color=?, icon=? WHERE id=?`,
		name, description, color, icon, id,
	)
	return err
}

func DeleteCollection(db *sql.DB, id string) error {
	_, err := db.Exec(`DELETE FROM collections WHERE id = ?`, id)
	return err
}
