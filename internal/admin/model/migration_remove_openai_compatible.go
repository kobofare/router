package model

import (
	"fmt"

	"github.com/yeying-community/router/internal/relay/channeltype"
	"gorm.io/gorm"
)

func runRemoveOpenAICompatibleProtocolMigrationWithDB(tx *gorm.DB) error {
	if tx == nil {
		return fmt.Errorf("database handle is nil")
	}

	if tx.Migrator().HasTable(&Channel{}) {
		if err := tx.Model(&Channel{}).
			Where("type = ?", channeltype.OpenAICompatible).
			Update("type", channeltype.OpenAI).Error; err != nil {
			return err
		}
	}

	if tx.Migrator().HasTable(&ChannelTypeCatalog{}) {
		if err := tx.Where("id = ?", channeltype.OpenAICompatible).
			Delete(&ChannelTypeCatalog{}).Error; err != nil {
			return err
		}
	}

	return nil
}
