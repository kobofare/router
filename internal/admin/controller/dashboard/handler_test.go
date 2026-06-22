package dashboard

import (
	"math"
	"testing"

	"github.com/yeying-community/router/internal/admin/model"
)

func TestSummarizeChannelHealthItemsUsesAllItems(t *testing.T) {
	items := []channelHealthItem{
		{
			SelectedModelCount: 2,
			TestedModelCount:   2,
			PassRate:           0.5,
			AvgLatencyMs:       9000,
			HasTestData:        true,
			HealthLevel:        channelHealthLevelCritical,
			CircuitBreaker: &channelCircuitBreakerDashboardItem{
				State: model.ChannelCircuitBreakerStateOpen,
			},
		},
		{
			SelectedModelCount: 1,
			TestedModelCount:   0,
			HasTestData:        false,
			HealthLevel:        channelHealthLevelWarning,
		},
		{
			SelectedModelCount: 0,
			TestedModelCount:   0,
			HasTestData:        false,
			HealthLevel:        channelHealthLevelHealthy,
		},
	}

	summary := summarizeChannelHealthItems(items)
	if summary.WithTests != 1 {
		t.Fatalf("WithTests=%d, want 1", summary.WithTests)
	}
	if summary.WithoutTests != 2 {
		t.Fatalf("WithoutTests=%d, want 2", summary.WithoutTests)
	}
	if summary.NeedsRetest != 2 {
		t.Fatalf("NeedsRetest=%d, want 2", summary.NeedsRetest)
	}
	if summary.RiskCount != 1 {
		t.Fatalf("RiskCount=%d, want 1", summary.RiskCount)
	}
	if summary.ActiveCircuitBreakerCount != 1 {
		t.Fatalf("ActiveCircuitBreakerCount=%d, want 1", summary.ActiveCircuitBreakerCount)
	}
	if summary.HighLatencyCount != 1 {
		t.Fatalf("HighLatencyCount=%d, want 1", summary.HighLatencyCount)
	}
	if math.Abs(summary.AvgPassRate-0.5) > 0.0001 {
		t.Fatalf("AvgPassRate=%f, want 0.5", summary.AvgPassRate)
	}
	if math.Abs(summary.AvgCoverageRate-(2.0/3.0)) > 0.0001 {
		t.Fatalf("AvgCoverageRate=%f, want %f", summary.AvgCoverageRate, 2.0/3.0)
	}
	if summary.AvgLatencyMs != 9000 {
		t.Fatalf("AvgLatencyMs=%d, want 9000", summary.AvgLatencyMs)
	}
}
