package controller

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestExtractVideoResponseSummary_TopLevelFields(t *testing.T) {
	header := http.Header{}
	header.Set("x-request-id", "req-header")
	body := []byte(`{
		"id":"video_123",
		"status":"queued",
		"url":"https://example.com/result.mp4"
	}`)

	summary := extractVideoResponseSummary(body, header)
	if summary.TaskID != "video_123" {
		t.Fatalf("TaskID=%q, want %q", summary.TaskID, "video_123")
	}
	if summary.Status != "queued" {
		t.Fatalf("Status=%q, want %q", summary.Status, "queued")
	}
	if summary.ResultURL != "https://example.com/result.mp4" {
		t.Fatalf("ResultURL=%q, want %q", summary.ResultURL, "https://example.com/result.mp4")
	}
	if summary.RequestID != "req-header" {
		t.Fatalf("RequestID=%q, want %q", summary.RequestID, "req-header")
	}
}

func TestExtractVideoResponseSummary_ArrayFieldsAndRequestIDOverride(t *testing.T) {
	header := http.Header{}
	body := []byte(`{
		"task_id":"task_456",
		"state":"running",
		"request_id":"req-body",
		"data":[{"url":"https://example.com/data.mp4"}]
	}`)

	summary := extractVideoResponseSummary(body, header)
	if summary.TaskID != "task_456" {
		t.Fatalf("TaskID=%q, want %q", summary.TaskID, "task_456")
	}
	if summary.Status != "running" {
		t.Fatalf("Status=%q, want %q", summary.Status, "running")
	}
	if summary.ResultURL != "https://example.com/data.mp4" {
		t.Fatalf("ResultURL=%q, want %q", summary.ResultURL, "https://example.com/data.mp4")
	}
	if summary.RequestID != "req-body" {
		t.Fatalf("RequestID=%q, want %q", summary.RequestID, "req-body")
	}
}

func TestAppendVideoSummaryToLogContent(t *testing.T) {
	content := appendVideoSummaryToLogContent(
		"计费: source=provider_migration",
		videoResponseSummary{
			TaskID:    "video_123",
			Status:    "queued",
			ResultURL: "https://example.com/result.mp4",
			RequestID: "req-1",
		},
	)
	for _, expected := range []string{
		"计费: source=provider_migration",
		"video_task_id=video_123",
		"video_status=queued",
		"video_result_url=https://example.com/result.mp4",
		"upstream_request_id=req-1",
	} {
		if !strings.Contains(content, expected) {
			t.Fatalf("content=%q does not contain %q", content, expected)
		}
	}
}

func TestRelayVideoRawResponse_WritesBodyOnce(t *testing.T) {
	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(recorder)
	resp := &http.Response{
		StatusCode: http.StatusAccepted,
		Header: http.Header{
			"Content-Type": []string{"application/json"},
			"X-Request-Id": []string{"req-video-1"},
		},
	}
	body := []byte(`{"id":"video_123","status":"queued"}`)

	err := relayVideoRawResponse(c, resp, body)
	if err != nil {
		t.Fatalf("relayVideoRawResponse returned error: %v", err)
	}
	if recorder.Code != http.StatusAccepted {
		t.Fatalf("status=%d, want %d", recorder.Code, http.StatusAccepted)
	}
	if recorder.Header().Get("Content-Type") != "application/json" {
		t.Fatalf("content-type=%q, want %q", recorder.Header().Get("Content-Type"), "application/json")
	}
	if recorder.Header().Get("X-Request-Id") != "req-video-1" {
		t.Fatalf("x-request-id=%q, want %q", recorder.Header().Get("X-Request-Id"), "req-video-1")
	}
	if !bytes.Equal(recorder.Body.Bytes(), body) {
		t.Fatalf("body=%q, want %q", recorder.Body.Bytes(), body)
	}
}
