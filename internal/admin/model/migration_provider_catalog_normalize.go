package model

import (
	"sort"
	"strings"

	"github.com/yeying-community/router/common/helper"
	commonutils "github.com/yeying-community/router/common/utils"
	"gorm.io/gorm"
)

func normalizeProviderCatalogWithDB(db *gorm.DB) error {
	if db == nil {
		return nil
	}
	if err := db.AutoMigrate(&Provider{}, &ProviderModel{}); err != nil {
		return err
	}

	providerRows := make([]Provider, 0)
	if err := db.Order("sort_order asc, id asc").Find(&providerRows).Error; err != nil {
		return err
	}
	if len(providerRows) == 0 {
		return nil
	}

	detailsByProvider, err := LoadProviderModelDetailsMap(db)
	if err != nil {
		return err
	}

	now := helper.GetTimestamp()
	providers := buildCanonicalProviderRows(providerRows, detailsByProvider, now)
	modelRows := make([]ProviderModel, 0)
	for _, item := range providers {
		modelRows = append(modelRows, BuildProviderModelRows(item.Id, detailsByProvider[item.Id], now)...)
	}

	return db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("1 = 1").Delete(&ProviderModel{}).Error; err != nil {
			return err
		}
		if err := tx.Where("1 = 1").Delete(&Provider{}).Error; err != nil {
			return err
		}
		if len(providers) > 0 {
			if err := tx.Create(&providers).Error; err != nil {
				return err
			}
		}
		if len(modelRows) > 0 {
			if err := tx.Create(&modelRows).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func buildCanonicalProviderRows(rows []Provider, detailsByProvider map[string][]ProviderModelDetail, now int64) []Provider {
	merged := make(map[string]Provider, len(rows))
	for _, row := range rows {
		rawID := strings.TrimSpace(row.Id)
		providerID := commonutils.NormalizeProvider(rawID)
		if providerID == "" || providerID == "unknown" {
			providerID = strings.TrimSpace(strings.ToLower(rawID))
		}
		if providerID == "" {
			continue
		}
		candidate := Provider{
			Id:        providerID,
			Name:      strings.TrimSpace(row.Name),
			BaseURL:   strings.TrimSpace(row.BaseURL),
			SortOrder: row.SortOrder,
			Source:    strings.TrimSpace(strings.ToLower(row.Source)),
			UpdatedAt: row.UpdatedAt,
		}
		if candidate.Name == "" {
			candidate.Name = providerID
		}
		if candidate.Source == "" {
			candidate.Source = "manual"
		}
		existing, ok := merged[providerID]
		if !ok {
			merged[providerID] = candidate
			continue
		}
		merged[providerID] = mergeCanonicalProviderRow(existing, candidate, strings.EqualFold(rawID, providerID))
	}

	for providerID := range detailsByProvider {
		if _, ok := merged[providerID]; ok {
			continue
		}
		merged[providerID] = Provider{
			Id:        providerID,
			Name:      providerID,
			Source:    "manual",
			UpdatedAt: now,
		}
	}

	items := make([]Provider, 0, len(merged))
	for _, item := range merged {
		if strings.TrimSpace(item.Name) == "" {
			item.Name = item.Id
		}
		if strings.TrimSpace(item.Source) == "" {
			item.Source = "manual"
		}
		if item.UpdatedAt <= 0 {
			item.UpdatedAt = now
		}
		items = append(items, item)
	}
	sort.SliceStable(items, func(i, j int) bool {
		leftOrder := items[i].SortOrder
		rightOrder := items[j].SortOrder
		switch {
		case leftOrder > 0 && rightOrder > 0:
			if leftOrder != rightOrder {
				return leftOrder < rightOrder
			}
		case leftOrder > 0:
			return true
		case rightOrder > 0:
			return false
		}
		return items[i].Id < items[j].Id
	})
	return items
}

func mergeCanonicalProviderRow(existing Provider, candidate Provider, preferCandidate bool) Provider {
	result := existing
	if preferCandidate {
		if candidate.Name != "" {
			result.Name = candidate.Name
		}
		if candidate.BaseURL != "" {
			result.BaseURL = candidate.BaseURL
		}
		if candidate.SortOrder > 0 {
			result.SortOrder = candidate.SortOrder
		}
		if candidate.Source != "" {
			result.Source = candidate.Source
		}
	}
	if result.Name == "" && candidate.Name != "" {
		result.Name = candidate.Name
	}
	if result.BaseURL == "" && candidate.BaseURL != "" {
		result.BaseURL = candidate.BaseURL
	}
	if candidate.SortOrder > 0 && (result.SortOrder <= 0 || candidate.SortOrder < result.SortOrder) {
		result.SortOrder = candidate.SortOrder
	}
	if candidate.Source != "" && (result.Source == "" || result.Source == "default") {
		result.Source = candidate.Source
	}
	if candidate.UpdatedAt > result.UpdatedAt {
		result.UpdatedAt = candidate.UpdatedAt
	}
	return result
}
