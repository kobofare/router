package adaptor

import "testing"

func TestUpstreamResponseLogLevel(t *testing.T) {
	tests := []struct {
		name        string
		statusCode  int
		healthProbe bool
		want        string
	}{
		{name: "success is not logged", statusCode: 200, want: ""},
		{name: "user upstream error", statusCode: 503, want: "error"},
		{name: "user upstream bad request", statusCode: 400, want: "warn"},
		{name: "health probe upstream error is warn", statusCode: 503, healthProbe: true, want: "warn"},
		{name: "health probe upstream bad request is warn", statusCode: 400, healthProbe: true, want: "warn"},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := upstreamResponseLogLevel(test.statusCode, test.healthProbe); got != test.want {
				t.Fatalf("upstreamResponseLogLevel(%d, %v) = %q, want %q", test.statusCode, test.healthProbe, got, test.want)
			}
		})
	}
}
