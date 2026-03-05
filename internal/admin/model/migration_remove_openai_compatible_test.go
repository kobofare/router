package model

import (
	"testing"

	"github.com/yeying-community/router/internal/relay/channeltype"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func TestRunRemoveOpenAICompatibleProtocolMigrationWithDB(t *testing.T) {
	db, err := gorm.Open(sqlite.Open("file:remove_openai_compatible_test?mode=memory&cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite failed: %v", err)
	}

	if err := db.AutoMigrate(&Channel{}, &ChannelTypeCatalog{}); err != nil {
		t.Fatalf("auto migrate failed: %v", err)
	}

	catalogRows := []ChannelTypeCatalog{
		{ID: channeltype.OpenAI, Name: "openai", Label: "OpenAI", Enabled: true},
		{ID: channeltype.OpenAICompatible, Name: "openai-compatible", Label: "OpenAI 兼容", Enabled: true},
	}
	if err := db.Create(&catalogRows).Error; err != nil {
		t.Fatalf("insert channel protocol rows failed: %v", err)
	}

	channels := []Channel{
		{Id: "channel-openai", Type: channeltype.OpenAI},
		{Id: "channel-openai-compatible", Type: channeltype.OpenAICompatible},
	}
	if err := db.Create(&channels).Error; err != nil {
		t.Fatalf("insert channels failed: %v", err)
	}

	if err := runRemoveOpenAICompatibleProtocolMigrationWithDB(db); err != nil {
		t.Fatalf("run migration failed: %v", err)
	}

	var compatibleChannelCount int64
	if err := db.Model(&Channel{}).
		Where("type = ?", channeltype.OpenAICompatible).
		Count(&compatibleChannelCount).Error; err != nil {
		t.Fatalf("count openai-compatible channels failed: %v", err)
	}
	if compatibleChannelCount != 0 {
		t.Fatalf("expected 0 openai-compatible channels after migration, got %d", compatibleChannelCount)
	}

	var openAIChannelCount int64
	if err := db.Model(&Channel{}).
		Where("type = ?", channeltype.OpenAI).
		Count(&openAIChannelCount).Error; err != nil {
		t.Fatalf("count openai channels failed: %v", err)
	}
	if openAIChannelCount != 2 {
		t.Fatalf("expected 2 openai channels after migration, got %d", openAIChannelCount)
	}

	var compatibleCatalogCount int64
	if err := db.Model(&ChannelTypeCatalog{}).
		Where("id = ?", channeltype.OpenAICompatible).
		Count(&compatibleCatalogCount).Error; err != nil {
		t.Fatalf("count openai-compatible channel protocol rows failed: %v", err)
	}
	if compatibleCatalogCount != 0 {
		t.Fatalf("expected openai-compatible protocol row to be deleted, got %d", compatibleCatalogCount)
	}
}
