package model

import (
	"strings"
	"testing"
)

func TestSanitizeChannelBillingAlertReason(t *testing.T) {
	input := `Get "https://cdk.aixhan.com/api/public/usage/stats?cdk=X9R5SVBSME3S": dial tcp: lookup cdk.aixhan.com: no such host`
	got := SanitizeChannelBillingAlertReason(input)
	if got != "网络错误：账务服务域名解析失败" {
		t.Fatalf("unexpected sanitized reason: %q", got)
	}
}

func TestSanitizeChannelBillingAlertContent(t *testing.T) {
	input := `<p>原因：Get "https://cdk.aixhan.com/api/public/usage/stats?cdk=X9R5SVBSME3S": dial tcp: lookup cdk.aixhan.com: no such host</p>`
	got := SanitizeChannelBillingAlertContent(input)
	if strings.Contains(got, "aixhan.com") || strings.Contains(got, "X9R5SVBSME3S") {
		t.Fatalf("sanitized content leaked sensitive text: %q", got)
	}
	if !strings.Contains(got, "网络错误：账务服务域名解析失败") {
		t.Fatalf("sanitized content missing normalized reason: %q", got)
	}
}

func TestSanitizeChannelBillingAlertPayload(t *testing.T) {
	input := `{"billing_api_base_url":"https://cdk.aixhan.com","reason":"Get \"https://cdk.aixhan.com/api/public/usage/stats?cdk=X9R5SVBSME3S\": dial tcp: lookup cdk.aixhan.com: no such host"}`
	got := SanitizeChannelBillingAlertPayload(input)
	if strings.Contains(got, "aixhan.com") || strings.Contains(got, "X9R5SVBSME3S") {
		t.Fatalf("sanitized payload leaked sensitive text: %q", got)
	}
	if !strings.Contains(got, "[已脱敏地址]") {
		t.Fatalf("expected masked base url in payload: %q", got)
	}
}
