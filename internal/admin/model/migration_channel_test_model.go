package model

import (
	"strings"

	"github.com/yeying-community/router/common/logger"
	"gorm.io/gorm"
)

func runChannelTestModelMigrations() error {
	return runChannelTestModelMigrationsWithDB(DB)
}

func runChannelTestModelMigrationsWithDB(db *gorm.DB) error {
	channels := make([]Channel, 0)
	if err := db.Select("id", "models", "test_model").
		Where("COALESCE(test_model, '') = '' AND COALESCE(models, '') <> ''").
		Find(&channels).Error; err != nil {
		return err
	}

	updated := 0
	for _, channel := range channels {
		defaultModel := firstModelFromCSV(channel.Models)
		if defaultModel == "" {
			continue
		}
		if err := db.Model(&Channel{}).
			Where("id = ? AND COALESCE(test_model, '') = ''", channel.Id).
			Update("test_model", defaultModel).Error; err != nil {
			return err
		}
		updated++
	}
	if updated > 0 {
		logger.SysLogf("migration: backfilled test_model for %d channels", updated)
	}
	return nil
}

func firstModelFromCSV(models string) string {
	for _, item := range strings.FieldsFunc(models, func(r rune) bool {
		return r == ',' || r == '\n' || r == '\r'
	}) {
		candidate := strings.TrimSpace(item)
		if candidate != "" {
			return candidate
		}
	}
	return ""
}
