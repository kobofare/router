package user

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/yeying-community/router/internal/admin/model"
)

func newTopupBalanceLotQueryContext(rawQuery string) *gin.Context {
	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)
	request := httptest.NewRequest(http.MethodGet, "/?"+rawQuery, nil)
	context.Request = request
	return context
}

func TestParseTopupBalanceLotPageParamsDefaultsToHistoricalLots(t *testing.T) {
	_, _, _, _, positiveOnly, err := parseTopupBalanceLotPageParams(newTopupBalanceLotQueryContext(""))
	if err != nil {
		t.Fatalf("parse default params: %v", err)
	}
	if positiveOnly {
		t.Fatalf("positiveOnly default = true, want false")
	}
}

func TestParseTopupBalanceLotPageParamsAcceptsExplicitFilters(t *testing.T) {
	page, pageSize, sourceType, status, positiveOnly, err := parseTopupBalanceLotPageParams(newTopupBalanceLotQueryContext("page=2&page_size=50&source_type=redemption&status=expired&positive_only=true"))
	if err != nil {
		t.Fatalf("parse explicit params: %v", err)
	}
	if page != 2 || pageSize != 50 {
		t.Fatalf("page/pageSize=%d/%d, want 2/50", page, pageSize)
	}
	if sourceType != model.UserBalanceLotSourceRedeem {
		t.Fatalf("sourceType=%q, want %q", sourceType, model.UserBalanceLotSourceRedeem)
	}
	if status != model.UserBalanceLotStatusExpired {
		t.Fatalf("status=%q, want %q", status, model.UserBalanceLotStatusExpired)
	}
	if !positiveOnly {
		t.Fatalf("positiveOnly explicit true = false, want true")
	}
}

func TestNormalizeBatchGrantUserIDsDedupeAndTrim(t *testing.T) {
	got, err := normalizeBatchGrantUserIDs([]string{" user-1 ", "", "user-2", "user-1"}, 10)
	if err != nil {
		t.Fatalf("normalize user ids: %v", err)
	}
	want := []string{"user-1", "user-2"}
	if len(got) != len(want) {
		t.Fatalf("ids len=%d, want %d: %#v", len(got), len(want), got)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("ids[%d]=%q, want %q", i, got[i], want[i])
		}
	}
}

func TestNormalizeBatchGrantUserIDsRejectsEmpty(t *testing.T) {
	if _, err := normalizeBatchGrantUserIDs([]string{" ", ""}, 10); err == nil {
		t.Fatalf("empty ids accepted, want error")
	}
}

func TestNormalizeBatchGrantUserIDsRejectsOverLimit(t *testing.T) {
	if _, err := normalizeBatchGrantUserIDs([]string{"user-1", "user-2", "user-3"}, 2); err == nil {
		t.Fatalf("over limit ids accepted, want error")
	}
}
