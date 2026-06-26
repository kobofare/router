package common

import (
	"strings"
	"testing"

	"github.com/yeying-community/router/common/config"
)

func TestNormalizeCacheType(t *testing.T) {
	tests := []struct {
		name            string
		raw             string
		redisConnString string
		want            string
		wantErr         bool
	}{
		{
			name: "empty without redis uses local",
			want: config.CacheTypeLocal,
		},
		{
			name:            "empty with redis uses redis for compatibility",
			redisConnString: "redis://127.0.0.1:6379/0",
			want:            config.CacheTypeRedis,
		},
		{
			name: "local",
			raw:  "local",
			want: config.CacheTypeLocal,
		},
		{
			name: "redis",
			raw:  "redis",
			want: config.CacheTypeRedis,
		},
		{
			name:    "unsupported",
			raw:     "other",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := normalizeCacheType(tt.raw, tt.redisConnString)
			if tt.wantErr {
				if err == nil {
					t.Fatal("normalizeCacheType returned nil error, want error")
				}
				if !strings.Contains(err.Error(), "unsupported cache.type") {
					t.Fatalf("unexpected error: %v", err)
				}
				return
			}
			if err != nil {
				t.Fatalf("normalizeCacheType returned error: %v", err)
			}
			if got != tt.want {
				t.Fatalf("normalizeCacheType = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestApplyAppConfigRequiresRedisConnStringForRedisCache(t *testing.T) {
	cfg := defaultAppConfig()
	cfg.Cache.Type = config.CacheTypeRedis
	cfg.Redis.ConnString = ""

	err := ApplyAppConfig(&cfg, false, false)
	if err == nil {
		t.Fatal("ApplyAppConfig returned nil error, want error")
	}
	if !strings.Contains(err.Error(), "cache.type=redis requires redis.conn_string") {
		t.Fatalf("unexpected error: %v", err)
	}
}
