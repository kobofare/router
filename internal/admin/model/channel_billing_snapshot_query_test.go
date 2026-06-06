package model

import (
	"testing"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func newChannelBillingSnapshotQueryTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open("file:"+t.Name()+"?mode=memory&cache=private"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&ChannelBillingSnapshot{}); err != nil {
		t.Fatalf("auto migrate snapshot: %v", err)
	}
	return db
}

func TestGetLatestChannelBillingSnapshotCreatedAtByStatusWithDB(t *testing.T) {
	db := newChannelBillingSnapshotQueryTestDB(t)
	rows := []ChannelBillingSnapshot{
		{Id: "1", ChannelId: "channel-1", SourceType: ChannelBillingSnapshotSourceAPI, RawStatus: "failed", CreatedAt: 100},
		{Id: "2", ChannelId: "channel-1", SourceType: ChannelBillingSnapshotSourceAPI, RawStatus: "ok", CreatedAt: 200},
		{Id: "3", ChannelId: "channel-1", SourceType: ChannelBillingSnapshotSourceAPI, RawStatus: "ok", CreatedAt: 300},
	}
	if err := db.Create(&rows).Error; err != nil {
		t.Fatalf("seed snapshots: %v", err)
	}
	got, err := GetLatestChannelBillingSnapshotCreatedAtByStatusWithDB(db, "channel-1", ChannelBillingSnapshotSourceAPI, "ok")
	if err != nil {
		t.Fatalf("GetLatestChannelBillingSnapshotCreatedAtByStatusWithDB returned error: %v", err)
	}
	if got != 300 {
		t.Fatalf("latest created_at = %d, want 300", got)
	}
}

func TestGetEarliestChannelBillingSnapshotCreatedAtByStatusAfterWithDB(t *testing.T) {
	db := newChannelBillingSnapshotQueryTestDB(t)
	rows := []ChannelBillingSnapshot{
		{Id: "1", ChannelId: "channel-1", SourceType: ChannelBillingSnapshotSourceAPI, RawStatus: "failed", CreatedAt: 100},
		{Id: "2", ChannelId: "channel-1", SourceType: ChannelBillingSnapshotSourceAPI, RawStatus: "failed", CreatedAt: 200},
		{Id: "3", ChannelId: "channel-1", SourceType: ChannelBillingSnapshotSourceAPI, RawStatus: "failed", CreatedAt: 300},
	}
	if err := db.Create(&rows).Error; err != nil {
		t.Fatalf("seed snapshots: %v", err)
	}
	got, err := GetEarliestChannelBillingSnapshotCreatedAtByStatusAfterWithDB(db, "channel-1", ChannelBillingSnapshotSourceAPI, "failed", 150)
	if err != nil {
		t.Fatalf("GetEarliestChannelBillingSnapshotCreatedAtByStatusAfterWithDB returned error: %v", err)
	}
	if got != 200 {
		t.Fatalf("earliest created_at after threshold = %d, want 200", got)
	}
}
