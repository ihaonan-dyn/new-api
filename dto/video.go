package dto

type VideoRequest struct {
	Group        string `json:"group,omitempty"`
	Model        string `json:"model"`
	Prompt       string `json:"prompt" binding:"required"`
	ImgUrl       string `json:"img_url,omitempty"`
	Duration     int64  `json:"parameters,omitempty"`
	PromptExtend bool   `json:"prompt_extend,omitempty"`
	Seed         int64  `json:"seed,omitempty"`
	Size         string `json:"size,omitempty"`
	Resolution   string `json:"resolution,omitempty"`
}

//type VideoResponse struct {
//	//RequestID     string `json:"request_id"`
//	TaskID        string `json:"task_id"`
//	TaskStatus    string `json:"task_status"`
//	SubmitTime    string `json:"submit_time"`
//	ScheduledTime string `json:"scheduled_time"`
//	EndTime       string `json:"end_time"`
//	VideoURL      string `json:"video_url"`
//	VideoDuration int    `json:"video_duration"`
//	VideoRatio    string `json:"video_ratio"`
//	VideoCount    int    `json:"video_count"`
//}
