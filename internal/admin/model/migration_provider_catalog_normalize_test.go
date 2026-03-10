package model

import "testing"

func TestBuildCanonicalProviderRows_MergesAliases(t *testing.T) {
	rows := []Provider{
		{Id: "x-ai", Name: "X-ai", SortOrder: 40, Source: "default", UpdatedAt: 100},
		{Id: "xai", Name: "xAI Grok", SortOrder: 40, Source: "default", UpdatedAt: 200},
		{Id: "meta", Name: "Meta", SortOrder: 1000, Source: "default", UpdatedAt: 100},
		{Id: "meta-llama", Name: "Meta Llama", SortOrder: 900, Source: "default", UpdatedAt: 200},
	}
	detailsByProvider := map[string][]ProviderModelDetail{
		"xai": {
			{Model: "x-ai/grok-beta", Type: ProviderModelTypeText},
			{Model: "grok-4", Type: ProviderModelTypeText},
		},
		"meta-llama": {
			{Model: "meta/llama-2-13b-chat", Type: ProviderModelTypeText},
			{Model: "meta-llama/llama-3.1-8b-instruct", Type: ProviderModelTypeText},
		},
	}

	items := buildCanonicalProviderRows(rows, detailsByProvider, 300)
	if len(items) != 2 {
		t.Fatalf("expected 2 canonical provider rows, got %d", len(items))
	}
	if items[0].Id != "xai" {
		t.Fatalf("expected first provider to be xai, got %q", items[0].Id)
	}
	if items[0].Name != "xAI Grok" {
		t.Fatalf("expected canonical xai name to be preserved, got %q", items[0].Name)
	}
	if items[1].Id != "meta-llama" {
		t.Fatalf("expected second provider to be meta-llama, got %q", items[1].Id)
	}
	if items[1].Name != "Meta Llama" {
		t.Fatalf("expected canonical meta-llama name to be preserved, got %q", items[1].Name)
	}
}
