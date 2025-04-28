package relay

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/gin-gonic/gin"
	"io"
	"net/http"
	"one-api/common"
	"one-api/constant"
	"one-api/dto"
	"one-api/model"
	relaycommon "one-api/relay/common"
	"one-api/relay/helper"
	"one-api/service"
	"strings"
	"time"
)

func getAndValidVideoRequest(c *gin.Context, info *relaycommon.RelayInfo) (*dto.VideoRequest, error) {
	VideoRequest := &dto.VideoRequest{}

	err := common.UnmarshalBodyReusable(c, VideoRequest)
	if err != nil {
		return nil, err
	}

	if VideoRequest.Prompt == "" {
		return nil, errors.New("prompt is required")
	}
	if VideoRequest.Model == "wanx2.1-i2v-turbo" || VideoRequest.Model == "wanx2.1-i2v-plus" { // tu
		if VideoRequest.ImgUrl == "" {
			return nil, errors.New("image_url is required")
		}

		if VideoRequest.Duration != 0 || VideoRequest.Duration < 3 && VideoRequest.Duration > 5 {
			return nil, errors.New("duration is error")
		}

	} else if VideoRequest.Model == "wanx2.1-t2v-turbo" || VideoRequest.Model == "wanx2.1-t2v-plus" { //wen
		switch VideoRequest.Size {
		case "":
		case "1280 * 720":
		case "960 * 960":
		case "720 * 1280":
		case "1088 * 832":
		case "832 * 1088":
		default:
			//异常
			return nil, errors.New("size is error")
		}
		if VideoRequest.Duration != 0 || VideoRequest.Duration != 5 {
			return nil, errors.New("duration is error")
		}
	}

	return VideoRequest, nil
}

func VideoHelper(c *gin.Context) *dto.OpenAIErrorWithStatusCode {
	relayInfo := relaycommon.GenRelayInfo(c)

	VideoRequest, err := getAndValidVideoRequest(c, relayInfo)
	if err != nil {
		common.LogError(c, fmt.Sprintf("getAndValidVideoRequest failed: %s", err.Error()))
		return service.OpenAIErrorWrapper(err, "invalid_Video_request", http.StatusBadRequest)
	}

	err = helper.ModelMappedHelper(c, relayInfo)
	if err != nil {
		return service.OpenAIErrorWrapperLocal(err, "model_mapped_error", http.StatusInternalServerError)
	}

	VideoRequest.Group = relayInfo.Group
	VideoRequest.Model = relayInfo.UpstreamModelName

	//quota
	priceData, err := helper.ModelPriceHelper(c, relayInfo, 0, 0)
	if err != nil {
		return service.OpenAIErrorWrapperLocal(err, "model_price_error", http.StatusInternalServerError)
	}
	if !priceData.UsePrice {
		// modelRatio 16 = modelPrice $0.04
		// per 1 modelRatio = $0.04 / 16
		priceData.ModelPrice = 0.0025 * priceData.ModelRatio
	}

	userQuota, err := model.GetUserQuota(relayInfo.UserId, false)

	//时长默认5s
	durationRatio := 5.0
	if VideoRequest.Model == "wanx2.1-t2v-plus" || VideoRequest.Model == "wanx2.1-t2v-turbo" { //文生视频仅支持5s
		durationRatio = 5.0
	} else if VideoRequest.Model == "wanx2.1-i2v-turbo" || VideoRequest.Model == "wanx2.1-i2v-plus" { //图生视频支持3 4 5
		if VideoRequest.Duration == 3 {
			durationRatio = 3.0
		} else if VideoRequest.Duration == 4 {
			durationRatio = 4.0
		} else { //默认5s
			durationRatio = 5.0
		}
	}

	priceData.ModelPrice *= durationRatio
	quota := int(priceData.ModelPrice * priceData.GroupRatio * common.QuotaPerUnit)

	if userQuota-quota < 0 {
		return service.OpenAIErrorWrapperLocal(fmt.Errorf("image pre-consumed quota failed, user quota: %s, need quota: %s", common.FormatQuota(userQuota), common.FormatQuota(quota)), "insufficient_user_quota", http.StatusForbidden)
	}

	adaptor := GetAdaptor(relayInfo.ApiType)
	if adaptor == nil {
		return service.OpenAIErrorWrapperLocal(fmt.Errorf("invalid api type: %d", relayInfo.ApiType), "invalid_api_type", http.StatusBadRequest)
	}
	adaptor.Init(relayInfo)

	var requestBody io.Reader

	convertedRequest, err := adaptor.ConvertVideoRequest(c, relayInfo, *VideoRequest)
	if err != nil {
		return service.OpenAIErrorWrapperLocal(err, "convert_request_failed", http.StatusInternalServerError)
	}

	jsonData, err := json.Marshal(convertedRequest)
	if err != nil {
		return service.OpenAIErrorWrapperLocal(err, "json_marshal_failed", http.StatusInternalServerError)
	}
	requestBody = bytes.NewBuffer(jsonData)

	statusCodeMappingStr := c.GetString("status_code_mapping")

	resp, err := adaptor.DoRequest(c, relayInfo, requestBody)
	if err != nil {
		return service.OpenAIErrorWrapper(err, "do_request_failed", http.StatusInternalServerError)
	}
	var httpResp *http.Response
	if resp != nil {
		httpResp = resp.(*http.Response)
		relayInfo.IsStream = relayInfo.IsStream || strings.HasPrefix(httpResp.Header.Get("Content-Type"), "text/event-stream")
		if httpResp.StatusCode != http.StatusOK {
			openaiErr := service.RelayErrorHandler(httpResp, false)
			// reset status code 重置状态码
			service.ResetStatusCode(openaiErr, statusCodeMappingStr)
			return openaiErr
		}
	}

	data, openaiErr := adaptor.DoResponse(c, httpResp, relayInfo)
	if openaiErr != nil && data != nil {
		// reset status code 重置状态码
		service.ResetStatusCode(openaiErr, statusCodeMappingStr)
		return openaiErr
	}

	videoResponse := data.(*dto.Task)

	taskRelayInfo := relaycommon.GenTaskRelayInfo(c)
	taskRelayInfo.ConsumeQuota = true
	// insert task
	task := model.InitTask(constant.TaskPlatformAli, taskRelayInfo)
	task.TaskID = videoResponse.TaskId
	task.Quota = quota
	task.Action = constant.AliActionVideo
	// 转换为JSON字符串
	jsonDataInput, err := json.Marshal(*VideoRequest)
	if err != nil {
		return service.OpenAIErrorWrapperLocal(err, "json_marshal_failed", http.StatusInternalServerError)
	}
	task.Properties.Input = string(jsonDataInput)
	var err1 error
	for i := 0; i < 5; i++ {
		if err1 = task.Insert(); err1 == nil {
			break
		}
		time.Sleep(200 * time.Millisecond)
	}

	if err1 != nil {
		return service.OpenAIErrorWrapperLocal(err, "sql_insert_failed", http.StatusInternalServerError)
	}

	//任务插入数据库成功，扣费
	usage := &dto.Usage{
		PromptTokens: int(durationRatio),
		TotalTokens:  int(durationRatio),
	}
	logContent := fmt.Sprintf("时长 %ds", int(durationRatio))
	postConsumeQuota(c, relayInfo, usage, 0, userQuota, priceData, logContent)

	return nil
}
