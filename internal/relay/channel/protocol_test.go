package channel

import "testing"

func TestNormalizeProtocolNameVolcengineRealtimeAlias(t *testing.T) {
	if got := NormalizeProtocolName("volcengine-realtime"); got != "volcengine" {
		t.Fatalf("NormalizeProtocolName(volcengine-realtime) = %q, want volcengine", got)
	}
	if got := NormalizeProtocolName("49"); got != "volcengine" {
		t.Fatalf("NormalizeProtocolName(49) = %q, want volcengine", got)
	}
	if got := TypeByProtocol("volcengine-realtime"); got != Doubao {
		t.Fatalf("TypeByProtocol(volcengine-realtime) = %d, want %d", got, Doubao)
	}
}
