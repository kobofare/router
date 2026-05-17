package model

import (
	"fmt"
	"sort"
	"strings"
)

type GroupModelSummaryItem struct {
	Model string `json:"model"`
}

func ListGroupModelSummaries(groupID string) ([]GroupModelSummaryItem, error) {
	groupID = strings.TrimSpace(groupID)
	if groupID == "" {
		return nil, fmt.Errorf("分组 ID 不能为空")
	}
	groupCatalog, err := getGroupCatalogByIDWithDB(DB, groupID)
	if err != nil {
		return nil, err
	}

	groupModels, err := listGroupModelRowsWithDB(DB, groupCatalog.Id, true)
	if err != nil {
		return nil, err
	}
	if len(groupModels) == 0 {
		return []GroupModelSummaryItem{}, nil
	}

	summaryByModel := make(map[string]*GroupModelSummaryItem, len(groupModels))
	modelOrder := make([]string, 0, len(groupModels))
	for _, row := range groupModels {
		modelName := strings.TrimSpace(row.Model)
		if modelName == "" {
			continue
		}
		if _, ok := summaryByModel[modelName]; ok {
			continue
		}
		summaryByModel[modelName] = &GroupModelSummaryItem{
			Model: modelName,
		}
		modelOrder = append(modelOrder, modelName)
	}

	result := make([]GroupModelSummaryItem, 0, len(modelOrder))
	for _, modelName := range modelOrder {
		item := summaryByModel[modelName]
		if item == nil {
			continue
		}
		result = append(result, *item)
	}
	sort.Slice(result, func(i, j int) bool {
		return result[i].Model < result[j].Model
	})
	return result, nil
}
