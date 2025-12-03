package handlers

import (
	"encoding/json"
	"log"

	"server/models"
)

// handleCallOffer handles WebRTC call offer
func handleCallOffer(fromID string, payload interface{}) {
	data, _ := json.Marshal(payload)
	var offer models.CallOffer
	json.Unmarshal(data, &offer)

	offer.FromID = fromID

	sendToUser(offer.ToID, models.WSMessage{
		Type:    "call-offer",
		Payload: offer,
	})

	log.Printf("Call offer from %s to %s", fromID, offer.ToID)
}

// handleCallAnswer handles WebRTC call answer
func handleCallAnswer(fromID string, payload interface{}) {
	data, _ := json.Marshal(payload)
	var answer models.CallOffer
	json.Unmarshal(data, &answer)

	answer.FromID = fromID

	sendToUser(answer.ToID, models.WSMessage{
		Type:    "call-answer",
		Payload: answer,
	})

	log.Printf("Call answer from %s to %s", fromID, answer.ToID)
}

// handleICECandidate handles ICE candidate exchange
func handleICECandidate(fromID string, payload interface{}) {
	data, _ := json.Marshal(payload)
	var candidate map[string]interface{}
	json.Unmarshal(data, &candidate)

	toID := candidate["toId"].(string)
	candidate["fromId"] = fromID

	sendToUser(toID, models.WSMessage{
		Type:    "ice-candidate",
		Payload: candidate,
	})

	log.Printf("ICE candidate from %s to %s", fromID, toID)
}
