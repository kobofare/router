package channel

import "testing"

func TestShouldNotifyChannelBillingRefreshFailureForStreak(t *testing.T) {
	nowTs := int64(3600)
	if shouldNotifyChannelBillingRefreshFailureForStreak(nowTs, nowTs-600, nowTs-2400) {
		t.Fatalf("expected no alert when there was a success within the last 30 minutes")
	}
	if shouldNotifyChannelBillingRefreshFailureForStreak(nowTs, nowTs-4000, nowTs-1200) {
		t.Fatalf("expected no alert when failure streak is shorter than 30 minutes")
	}
	if !shouldNotifyChannelBillingRefreshFailureForStreak(nowTs, nowTs-4000, nowTs-2400) {
		t.Fatalf("expected alert when failures have continued for at least 30 minutes")
	}
	if !shouldNotifyChannelBillingRefreshFailureForStreak(nowTs, 0, nowTs-2400) {
		t.Fatalf("expected alert when there has been no success and failures exceed 30 minutes")
	}
}
