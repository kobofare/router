package routeobs

import (
	"encoding/json"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/yeying-community/router/common/ctxkey"
	"github.com/yeying-community/router/common/helper"
)

type FallbackAttempt struct {
	Attempt     int    `json:"attempt"`
	ChannelID   string `json:"channel_id"`
	ChannelName string `json:"channel_name,omitempty"`
	Model       string `json:"model,omitempty"`
	Endpoint    string `json:"endpoint,omitempty"`
	Protocol    string `json:"protocol,omitempty"`
	Status      int    `json:"status,omitempty"`
	ErrorType   string `json:"error_type,omitempty"`
	ErrorCode   string `json:"error_code,omitempty"`
	Error       string `json:"error,omitempty"`
	CreatedAt   int64  `json:"created_at,omitempty"`
}

func Reset(c *gin.Context) {
	if c == nil {
		return
	}
	c.Set(ctxkey.RelayFallbackAttempts, "")
}

func AppendFallbackAttempt(c *gin.Context, attempt FallbackAttempt) {
	if c == nil {
		return
	}
	attempt.ChannelID = strings.TrimSpace(attempt.ChannelID)
	attempt.ChannelName = strings.TrimSpace(attempt.ChannelName)
	attempt.Model = strings.TrimSpace(attempt.Model)
	attempt.Endpoint = strings.TrimSpace(attempt.Endpoint)
	attempt.Protocol = strings.TrimSpace(attempt.Protocol)
	attempt.ErrorType = strings.TrimSpace(attempt.ErrorType)
	attempt.ErrorCode = strings.TrimSpace(attempt.ErrorCode)
	attempt.Error = strings.TrimSpace(attempt.Error)
	if attempt.CreatedAt <= 0 {
		attempt.CreatedAt = helper.GetTimestamp()
	}
	attempts := FallbackAttempts(c)
	attempts = append(attempts, attempt)
	payload, err := json.Marshal(attempts)
	if err != nil {
		return
	}
	c.Set(ctxkey.RelayFallbackAttempts, string(payload))
}

func FallbackAttempts(c *gin.Context) []FallbackAttempt {
	if c == nil {
		return []FallbackAttempt{}
	}
	raw := strings.TrimSpace(c.GetString(ctxkey.RelayFallbackAttempts))
	if raw == "" {
		return []FallbackAttempt{}
	}
	var attempts []FallbackAttempt
	if err := json.Unmarshal([]byte(raw), &attempts); err != nil {
		return []FallbackAttempt{}
	}
	return attempts
}
