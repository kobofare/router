package controller

import (
	"testing"

	"github.com/yeying-community/router/internal/admin/model"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func newRedemptionControllerTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open("file:"+t.Name()+"?mode=memory&cache=private"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&model.Redemption{}); err != nil {
		t.Fatalf("AutoMigrate: %v", err)
	}
	return db
}

func TestCreateRedemptionsWithDBRollsBackBatchOnInsertFailure(t *testing.T) {
	db := newRedemptionControllerTestDB(t)
	template := model.Redemption{
		Name:               "batch",
		GroupID:            "group-1",
		FaceValueAmount:    100,
		FaceValueUnit:      model.RedemptionFaceValueUnitYYC,
		Quota:              100,
		Count:              2,
		CodeValidityDays:   7,
		CreditValidityDays: 30,
	}

	err := db.Transaction(func(tx *gorm.DB) error {
		_, err := createRedemptionsWithDB(tx, template, "admin-1", func() string {
			return "duplicate-code"
		})
		return err
	})
	if err == nil {
		t.Fatal("expected duplicate code error")
	}

	var count int64
	if err := db.Model(&model.Redemption{}).Count(&count).Error; err != nil {
		t.Fatalf("count redemptions: %v", err)
	}
	if count != 0 {
		t.Fatalf("redemption count = %d, want rollback to 0", count)
	}
}
