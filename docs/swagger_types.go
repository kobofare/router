package docs

// StandardResponse represents common API response.
type StandardResponse struct {
	Success   bool        `json:"success,omitempty"`
	Message   string      `json:"message"`
	Data      interface{} `json:"data,omitempty"`
	Code      int         `json:"code,omitempty"`
	Timestamp int64       `json:"timestamp,omitempty"`
}

// ErrorResponse represents a common error response.
type ErrorResponse struct {
	Success   bool   `json:"success,omitempty"`
	Message   string `json:"message"`
	Code      int    `json:"code,omitempty"`
	Timestamp int64  `json:"timestamp,omitempty"`
}

// OpenAIErrorResponse represents OpenAI-compatible error response.
type OpenAIErrorResponse struct {
	Error OpenAIError `json:"error"`
}

// OpenAIError is the inner error object for OpenAI-compatible responses.
type OpenAIError struct {
	Message string `json:"message"`
	Type    string `json:"type"`
	Param   string `json:"param"`
	Code    string `json:"code"`
}
