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
	Genre       string
}

var ErrCollectionNotFound = errors.New("collection not found")

func CreateCollection(db *sql.DB, name, description, color, icon, imageURL, genre string) (Collection, error) {
	id := uuid.NewString()
	_, err := db.Exec(
		`INSERT INTO collections (id, name, description, color, icon, image_url, genre) VALUES (?, ?, ?, ?, ?, ?, ?)`,
		id, name, description, color, icon, imageURL, genre,
	)
	if err != nil {
		return Collection{}, err
	}
	return GetCollectionByID(db, id)
}

func GetCollectionByID(db *sql.DB, id string) (Collection, error) {
	var c Collection
	err := db.QueryRow(
		`SELECT id, name, description, color, icon, COALESCE(image_url,''), COALESCE(genre,'') FROM collections WHERE id = ?`, id,
	).Scan(&c.ID, &c.Name, &c.Description, &c.Color, &c.Icon, &c.ImageURL, &c.Genre)
	if errors.Is(err, sql.ErrNoRows) {
		return Collection{}, ErrCollectionNotFound
	}
	return c, err
}

func ListCollections(db *sql.DB) ([]Collection, error) {
	rows, err := db.Query(`SELECT id, name, description, color, icon, COALESCE(image_url,''), COALESCE(genre,'') FROM collections`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var collections []Collection
	for rows.Next() {
		var c Collection
		if err := rows.Scan(&c.ID, &c.Name, &c.Description, &c.Color, &c.Icon, &c.ImageURL, &c.Genre); err != nil {
			return nil, err
		}
		collections = append(collections, c)
	}
	return collections, rows.Err()
}

func UpdateCollection(db *sql.DB, id, name, description, color, icon, imageURL, genre string) error {
	_, err := db.Exec(
		`UPDATE collections SET name=?, description=?, color=?, icon=?, image_url=?, genre=? WHERE id=?`,
		name, description, color, icon, imageURL, genre, id,
	)
	return err
}

func DeleteCollection(db *sql.DB, id string) error {
	_, err := db.Exec(`DELETE FROM collections WHERE id = ?`, id)
	return err
}
