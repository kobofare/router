package routeobs

import (
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/yeying-community/router/common/ctxkey"
)

func TestAppendFallbackAttemptStoresJSONInContext(t *testing.T) {
	c, _ := gin.CreateTestContext(nil)
	Reset(c)

	AppendFallbackAttempt(c, FallbackAttempt{
		Attempt:   1,
		ChannelID: " channel-1 ",
		ErrorCode: " do_request_failed ",
		Error:     " upstream unavailable ",
	})

	raw := c.GetString(ctxkey.RelayFallbackAttempts)
	if raw == "" {
		t.Fatalf("fallback attempts not stored")
	}
	attempts := FallbackAttempts(c)
	if len(attempts) != 1 {
		t.Fatalf("len=%d, want 1", len(attempts))
	}
	if attempts[0].ChannelID != "channel-1" {
		t.Fatalf("ChannelID=%q, want channel-1", attempts[0].ChannelID)
	}
	if attempts[0].ErrorCode != "do_request_failed" {
		t.Fatalf("ErrorCode=%q, want do_request_failed", attempts[0].ErrorCode)
	}
	if attempts[0].Error != "upstream unavailable" {
		t.Fatalf("Error=%q, want upstream unavailable", attempts[0].Error)
	}
	if attempts[0].CreatedAt <= 0 {
		t.Fatalf("CreatedAt=%d, want positive timestamp", attempts[0].CreatedAt)
	}
}

func TestFallbackAttemptsReturnsEmptyForInvalidJSON(t *testing.T) {
	c, _ := gin.CreateTestContext(nil)
	c.Set(ctxkey.RelayFallbackAttempts, "{")

	if attempts := FallbackAttempts(c); len(attempts) != 0 {
		t.Fatalf("len=%d, want 0", len(attempts))
	}
}
