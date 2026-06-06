package model

import (
	"encoding/json"
	"regexp"
	"strings"

	"gorm.io/gorm"
)

var (
	channelBillingAlertURLPattern      = regexp.MustCompile(`https?://[^\s"']+`)
	channelBillingAlertDomainPattern   = regexp.MustCompile(`\b(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}\b`)
	channelBillingAlertIPv4Pattern     = regexp.MustCompile(`\b(?:\d{1,3}\.){3}\d{1,3}\b`)
	channelBillingAlertQuotedURLPrefix = regexp.MustCompile(`(?i)\b(get|post|put|delete|patch|head)\s+"[^"]+"`)
	channelBillingAlertReasonLine      = regexp.MustCompile(`原因：([^<]+)`)
	channelBillingAlertDetailLine      = regexp.MustCompile(`详情：([^<]+)`)
)

func SanitizeChannelBillingAlertReason(raw string) string {
	reason := strings.TrimSpace(raw)
	if reason == "" {
		return ""
	}
	lowerReason := strings.ToLower(reason)
	switch {
	case strings.Contains(lowerReason, "no such host"):
		return "网络错误：账务服务域名解析失败"
	case strings.Contains(lowerReason, "connection refused"):
		return "网络错误：账务服务拒绝连接"
	case strings.Contains(lowerReason, "i/o timeout"),
		strings.Contains(lowerReason, "context deadline exceeded"),
		strings.Contains(lowerReason, "client.timeout exceeded"):
		return "网络错误：访问账务服务超时"
	}
	sanitized := channelBillingAlertQuotedURLPrefix.ReplaceAllStringFunc(reason, func(match string) string {
		parts := strings.SplitN(match, " ", 2)
		if len(parts) != 2 {
			return `请求 "[已脱敏]"`
		}
		return parts[0] + ` "[已脱敏]"`
	})
	sanitized = channelBillingAlertURLPattern.ReplaceAllString(sanitized, "[已脱敏地址]")
	sanitized = channelBillingAlertIPv4Pattern.ReplaceAllString(sanitized, "[已脱敏地址]")
	sanitized = channelBillingAlertDomainPattern.ReplaceAllString(sanitized, "[已脱敏主机]")
	return strings.TrimSpace(sanitized)
}

func SanitizeChannelBillingAlertContent(raw string) string {
	content := strings.TrimSpace(raw)
	if content == "" {
		return ""
	}
	content = channelBillingAlertReasonLine.ReplaceAllStringFunc(content, func(match string) string {
		parts := strings.SplitN(match, "原因：", 2)
		if len(parts) != 2 {
			return match
		}
		return "原因：" + SanitizeChannelBillingAlertReason(parts[1])
	})
	content = channelBillingAlertDetailLine.ReplaceAllStringFunc(content, func(match string) string {
		parts := strings.SplitN(match, "详情：", 2)
		if len(parts) != 2 {
			return match
		}
		return "详情：" + SanitizeChannelBillingAlertReason(parts[1])
	})
	content = channelBillingAlertURLPattern.ReplaceAllString(content, "[已脱敏地址]")
	content = channelBillingAlertIPv4Pattern.ReplaceAllString(content, "[已脱敏地址]")
	content = channelBillingAlertDomainPattern.ReplaceAllString(content, "[已脱敏主机]")
	return content
}

func SanitizeChannelBillingAlertPayload(raw string) string {
	payload := strings.TrimSpace(raw)
	if payload == "" {
		return ""
	}
	data := map[string]any{}
	if err := json.Unmarshal([]byte(payload), &data); err != nil {
		return channelBillingAlertURLPattern.ReplaceAllString(payload, "[已脱敏地址]")
	}
	if reason, ok := data["reason"].(string); ok {
		data["reason"] = SanitizeChannelBillingAlertReason(reason)
	}
	if baseURL, ok := data["billing_api_base_url"].(string); ok && strings.TrimSpace(baseURL) != "" {
		data["billing_api_base_url"] = "[已脱敏地址]"
	}
	body, err := json.Marshal(data)
	if err != nil {
		return payload
	}
	return string(body)
}

func SanitizeHistoricalChannelBillingAlertsWithDB(db *gorm.DB) error {
	if db == nil {
		return gorm.ErrInvalidDB
	}
	rows := make([]ChannelBillingAlertEvent, 0)
	if err := db.Find(&rows).Error; err != nil {
		return err
	}
	for _, row := range rows {
		nextContent := SanitizeChannelBillingAlertContent(row.Content)
		nextPayload := SanitizeChannelBillingAlertPayload(row.Payload)
		if nextContent == row.Content && nextPayload == row.Payload {
			continue
		}
		if err := db.Model(&ChannelBillingAlertEvent{}).
			Where("id = ?", row.Id).
			Updates(map[string]any{
				"content":    nextContent,
				"payload":    nextPayload,
				"updated_at": row.UpdatedAt,
			}).Error; err != nil {
			return err
		}
	}
	return nil
}
