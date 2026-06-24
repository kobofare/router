package model

import (
	"testing"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func TestEnsureProcurementCostTablesWithDBRepairsMissingCostPerUnitColumn(t *testing.T) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	if err := db.Exec(`
		CREATE TABLE channel_procurement_batches (
			id char(36) PRIMARY KEY,
			channel_id char(36) NOT NULL,
			resource_type varchar(32) NOT NULL DEFAULT '',
			quota_type varchar(32) NOT NULL DEFAULT '',
			scope_type varchar(32) NOT NULL DEFAULT 'global',
			scope_value varchar(191) NOT NULL DEFAULT '',
			capacity_unit varchar(32) NOT NULL DEFAULT '',
			capacity_total double precision NOT NULL DEFAULT 0,
			capacity_effective double precision NOT NULL DEFAULT 0,
			capacity_remaining double precision NOT NULL DEFAULT 0,
			purchase_currency varchar(16) NOT NULL DEFAULT '',
			purchase_amount double precision NOT NULL DEFAULT 0,
			purchase_fx_rate double precision NOT NULL DEFAULT 0,
			purchase_cost_amount double precision NOT NULL DEFAULT 0,
			cost_source varchar(32) NOT NULL DEFAULT '',
			cost_status varchar(32) NOT NULL DEFAULT 'cost_unconfigured',
			valid_from bigint NOT NULL DEFAULT 0,
			expire_at bigint NOT NULL DEFAULT 0,
			reset_cycle varchar(32) NOT NULL DEFAULT 'none',
			source_snapshot_id char(36) NOT NULL DEFAULT '',
			source_snapshot_item_id char(36) NOT NULL DEFAULT '',
			source_ref varchar(191) NOT NULL DEFAULT '',
			metadata text,
			created_at bigint,
			updated_at bigint
		)
	`).Error; err != nil {
		t.Fatalf("create legacy table: %v", err)
	}
	if db.Migrator().HasColumn(&ChannelProcurementBatch{}, "CostPerUnitAmount") {
		t.Fatalf("legacy table unexpectedly has cost_per_unit_amount")
	}

	if err := ensureProcurementCostTablesWithDB(db); err != nil {
		t.Fatalf("ensure procurement tables: %v", err)
	}

	if !db.Migrator().HasColumn(&ChannelProcurementBatch{}, "CostPerUnitAmount") {
		t.Fatalf("cost_per_unit_amount column was not repaired")
	}
	if !db.Migrator().HasTable(&RequestProcurementConsumption{}) {
		t.Fatalf("request procurement consumption table was not created")
	}
}
