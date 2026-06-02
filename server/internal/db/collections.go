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
	ImageURL    string
}

var ErrCollectionNotFound = errors.New("collection not found")

func CreateCollection(db *sql.DB, name, description, color, icon, imageURL string) (Collection, error) {
	id := uuid.NewString()
	_, err := db.Exec(
		`INSERT INTO collections (id, name, description, color, icon, image_url) VALUES (?, ?, ?, ?, ?, ?)`,
		id, name, description, color, icon, imageURL,
	)
	if err != nil {
		return Collection{}, err
	}
	return GetCollectionByID(db, id)
}

func GetCollectionByID(db *sql.DB, id string) (Collection, error) {
	var c Collection
	err := db.QueryRow(
		`SELECT id, name, description, color, icon, image_url FROM collections WHERE id = ?`, id,
	).Scan(&c.ID, &c.Name, &c.Description, &c.Color, &c.Icon, &c.ImageURL)
	if errors.Is(err, sql.ErrNoRows) {
		return Collection{}, ErrCollectionNotFound
	}
	return c, err
}

func ListCollections(db *sql.DB) ([]Collection, error) {
	rows, err := db.Query(`SELECT id, name, description, color, icon, image_url FROM collections`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var collections []Collection
	for rows.Next() {
		var c Collection
		if err := rows.Scan(&c.ID, &c.Name, &c.Description, &c.Color, &c.Icon, &c.ImageURL); err != nil {
			return nil, err
		}
		collections = append(collections, c)
	}
	return collections, rows.Err()
}

func UpdateCollection(db *sql.DB, id, name, description, color, icon, imageURL string) error {
	_, err := db.Exec(
		`UPDATE collections SET name=?, description=?, color=?, icon=?, image_url=? WHERE id=?`,
		name, description, color, icon, imageURL, id,
	)
	return err
}

func DeleteCollection(db *sql.DB, id string) error {
	_, err := db.Exec(`DELETE FROM collections WHERE id = ?`, id)
	return err
}
