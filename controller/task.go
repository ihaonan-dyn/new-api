package controller

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/samber/lo"
	"io"
	"net/http"
	"one-api/common"
	"one-api/constant"
	"one-api/dto"
	"one-api/model"
	"one-api/relay"
	"one-api/relay/channel/ali"
	"runtime"
	"sort"
	"strconv"
	"sync"
	"sync/atomic"
	"time"
)

func UpdateTaskBulk() {
	//revocer
	//imageModel := "midjourney"
	for {
		time.Sleep(time.Duration(15) * time.Second)
		common.SysLog("任务进度轮询开始")
		ctx := context.TODO()
		allTasks := model.GetAllUnFinishSyncTasks(500)
		platformTask := make(map[constant.TaskPlatform][]*model.Task)
		for _, t := range allTasks {
			platformTask[t.Platform] = append(platformTask[t.Platform], t)
		}
		for platform, tasks := range platformTask {
			if len(tasks) == 0 {
				continue
			}
			taskChannelM := make(map[int][]string)
			taskM := make(map[string]*model.Task)
			nullTaskIds := make([]int64, 0)
			for _, task := range tasks {
				if task.TaskID == "" {
					// 统计失败的未完成任务
					nullTaskIds = append(nullTaskIds, task.ID)
					continue
				}
				taskM[task.TaskID] = task
				taskChannelM[task.ChannelId] = append(taskChannelM[task.ChannelId], task.TaskID)
			}
			if len(nullTaskIds) > 0 {
				err := model.TaskBulkUpdateByID(nullTaskIds, map[string]any{
					"status":   "FAILURE",
					"progress": "100%",
				})
				if err != nil {
					common.LogError(ctx, fmt.Sprintf("Fix null task_id task error: %v", err))
				} else {
					common.LogInfo(ctx, fmt.Sprintf("Fix null task_id task success: %v", nullTaskIds))
				}
			}
			if len(taskChannelM) == 0 {
				continue
			}

			UpdateTaskByPlatform(platform, taskChannelM, taskM)
		}
		common.SysLog("任务进度轮询完成")
	}
}

func UpdateTaskByPlatform(platform constant.TaskPlatform, taskChannelM map[int][]string, taskM map[string]*model.Task) {
	switch platform {
	case constant.TaskPlatformMidjourney:
		//_ = UpdateMidjourneyTaskAll(context.Background(), tasks)
	case constant.TaskPlatformSuno:
		_ = UpdateSunoTaskAll(context.Background(), taskChannelM, taskM)
	case constant.TaskPlatformAli:
		_ = UpdateAliTaskAll(context.Background(), taskChannelM, taskM)
	default:
		common.SysLog("未知平台")
	}
}

func UpdateSunoTaskAll(ctx context.Context, taskChannelM map[int][]string, taskM map[string]*model.Task) error {
	for channelId, taskIds := range taskChannelM {
		err := updateSunoTaskAll(ctx, channelId, taskIds, taskM)
		if err != nil {
			common.LogError(ctx, fmt.Sprintf("渠道 #%d 更新异步任务失败: %d", channelId, err.Error()))
		}
	}
	return nil
}

func updateSunoTaskAll(ctx context.Context, channelId int, taskIds []string, taskM map[string]*model.Task) error {
	common.LogInfo(ctx, fmt.Sprintf("渠道 #%d 未完成的任务有: %d", channelId, len(taskIds)))
	if len(taskIds) == 0 {
		return nil
	}
	channel, err := model.CacheGetChannel(channelId)
	if err != nil {
		common.SysLog(fmt.Sprintf("CacheGetChannel: %v", err))
		err = model.TaskBulkUpdate(taskIds, map[string]any{
			"fail_reason": fmt.Sprintf("获取渠道信息失败，请联系管理员，渠道ID：%d", channelId),
			"status":      "FAILURE",
			"progress":    "100%",
		})
		if err != nil {
			common.SysError(fmt.Sprintf("UpdateMidjourneyTask error2: %v", err))
		}
		return err
	}
	adaptor := relay.GetTaskAdaptor(constant.TaskPlatformSuno)
	if adaptor == nil {
		return errors.New("adaptor not found")
	}
	resp, err := adaptor.FetchTask(*channel.BaseURL, channel.Key, map[string]any{
		"ids": taskIds,
	})
	if err != nil {
		common.SysError(fmt.Sprintf("Get Task Do req error: %v", err))
		return err
	}
	if resp.StatusCode != http.StatusOK {
		common.LogError(ctx, fmt.Sprintf("Get Task status code: %d", resp.StatusCode))
		return errors.New(fmt.Sprintf("Get Task status code: %d", resp.StatusCode))
	}
	defer resp.Body.Close()
	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		common.SysError(fmt.Sprintf("Get Task parse body error: %v", err))
		return err
	}
	var responseItems dto.TaskResponse[[]dto.SunoDataResponse]
	err = json.Unmarshal(responseBody, &responseItems)
	if err != nil {
		common.LogError(ctx, fmt.Sprintf("Get Task parse body error2: %v, body: %s", err, string(responseBody)))
		return err
	}
	if !responseItems.IsSuccess() {
		common.SysLog(fmt.Sprintf("渠道 #%d 未完成的任务有: %d, 成功获取到任务数: %d", channelId, len(taskIds), string(responseBody)))
		return err
	}

	for _, responseItem := range responseItems.Data {
		task := taskM[responseItem.TaskID]
		if !checkTaskNeedUpdate(task, responseItem) {
			continue
		}

		task.Status = lo.If(model.TaskStatus(responseItem.Status) != "", model.TaskStatus(responseItem.Status)).Else(task.Status)
		task.FailReason = lo.If(responseItem.FailReason != "", responseItem.FailReason).Else(task.FailReason)
		task.SubmitTime = lo.If(responseItem.SubmitTime != 0, responseItem.SubmitTime).Else(task.SubmitTime)
		task.StartTime = lo.If(responseItem.StartTime != 0, responseItem.StartTime).Else(task.StartTime)
		task.FinishTime = lo.If(responseItem.FinishTime != 0, responseItem.FinishTime).Else(task.FinishTime)
		if responseItem.FailReason != "" || task.Status == model.TaskStatusFailure {
			common.LogInfo(ctx, task.TaskID+" 构建失败，"+task.FailReason)
			task.Progress = "100%"
			//err = model.CacheUpdateUserQuota(task.UserId) ?
			if err != nil {
				common.LogError(ctx, "error update user quota cache: "+err.Error())
			} else {
				quota := task.Quota
				if quota != 0 {
					err = model.IncreaseUserQuota(task.UserId, quota, false)
					if err != nil {
						common.LogError(ctx, "fail to increase user quota: "+err.Error())
					}
					logContent := fmt.Sprintf("异步任务执行失败 %s，补偿 %s", task.TaskID, common.LogQuota(quota))
					model.RecordLog(task.UserId, model.LogTypeSystem, logContent)
				}
			}
		}
		if responseItem.Status == model.TaskStatusSuccess {
			task.Progress = "100%"
		}
		task.Data = responseItem.Data

		err = task.Update()
		if err != nil {
			common.SysError("UpdateMidjourneyTask task error: " + err.Error())
		}
	}
	return nil
}

func UpdateAliTaskAll(ctx context.Context, taskChannelM map[int][]string, taskM map[string]*model.Task) error {
	for channelId, taskIds := range taskChannelM {
		err := updateAliTaskAll(ctx, channelId, taskIds, taskM)
		if err != nil {
			common.LogError(ctx, fmt.Sprintf("渠道 #%d 更新异步任务失败: %d", channelId, err.Error()))
		}
	}
	return nil
}

func updateAliTaskAll(ctx context.Context, channelId int, taskIds []string, taskM map[string]*model.Task) error {
	common.LogInfo(ctx, fmt.Sprintf("渠道 #%d 未完成的任务有: %d", channelId, len(taskIds)))
	if len(taskIds) == 0 {
		return nil
	}
	channel, err := model.CacheGetChannel(channelId)
	if err != nil {
		common.SysLog(fmt.Sprintf("CacheGetChannel: %v", err))
		err = model.TaskBulkUpdate(taskIds, map[string]any{
			"fail_reason": fmt.Sprintf("获取渠道信息失败，请联系管理员，渠道ID：%d", channelId),
			"status":      "FAILURE",
			"progress":    "100%",
		})
		if err != nil {
			common.SysError(fmt.Sprintf("UpdateMidjourneyTask error2: %v", err))
		}
		return err
	}

	adaptor := relay.GetTaskAdaptor(constant.TaskPlatformAli)
	if adaptor == nil {
		return errors.New("adaptor not found")
	}

	tm, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	taskWgCount := runtime.NumCPU() << 2
	taskCount := int64(len(taskIds))
	completeTaskCount := int64(0)
	wgCount := len(taskIds)
	var wg sync.WaitGroup

	/*TODO: Note that the QPM of the Alibaba large model is only = 60
	I only realized it after calling it, so the concurrency afterwards is only useful if the quota is relatively high
	*/
	const qpm = 60 >> 2
	if taskCount > qpm {
		taskWgCount = qpm
		taskCount = qpm
	}

	if wgCount > taskWgCount {
		wgCount = taskWgCount
	}

	wg.Add(wgCount)

	results := make(chan error, taskCount)

	for i := 0; i < wgCount; i++ {
		go func(i int) {
			defer wg.Done()
			for {
				flag := false
				select {
				case <-tm.Done():
					flag = true
					break
				default:
					currentTaskId := atomic.AddInt64(&completeTaskCount, 1)
					if currentTaskId > taskCount {
						flag = true
						break
					}
					aliResponse, err := ali.HandleGetTask(*channel.BaseURL, channel.Key, taskIds[currentTaskId-1], adaptor)
					if err != nil {
						common.SysError(fmt.Sprintf("Get Task Do req error: %v", err))
						results <- err
						continue
					}

					err = ali.HandleUpdateTask(ctx, taskM[aliResponse.Output.TaskId], aliResponse)
					if err != nil {
						common.SysError(fmt.Sprintf("UpdateMidjourneyTask task error: %v", err))
					}
					results <- err
				}

				if flag {
					break
				}
			}
		}(i)
	}

	wg.Wait()

	close(results)
	// 统计结果
	var success, fail int
	for err := range results {
		if err == nil {
			success++
		} else {
			fail++
		}
	}

	common.SysLog(fmt.Sprintf("渠道 #%d 更新异步任务成功: %d, 失败: %d", channelId, success, fail))

	return nil
}

func checkTaskNeedUpdate(oldTask *model.Task, newTask dto.SunoDataResponse) bool {

	if oldTask.SubmitTime != newTask.SubmitTime {
		return true
	}
	if oldTask.StartTime != newTask.StartTime {
		return true
	}
	if oldTask.FinishTime != newTask.FinishTime {
		return true
	}
	if string(oldTask.Status) != newTask.Status {
		return true
	}
	if oldTask.FailReason != newTask.FailReason {
		return true
	}
	if oldTask.FinishTime != newTask.FinishTime {
		return true
	}

	if (oldTask.Status == model.TaskStatusFailure || oldTask.Status == model.TaskStatusSuccess) && oldTask.Progress != "100%" {
		return true
	}

	oldData, _ := json.Marshal(oldTask.Data)
	newData, _ := json.Marshal(newTask.Data)

	sort.Slice(oldData, func(i, j int) bool {
		return oldData[i] < oldData[j]
	})
	sort.Slice(newData, func(i, j int) bool {
		return newData[i] < newData[j]
	})

	if string(oldData) != string(newData) {
		return true
	}
	return false
}

func GetAllTask(c *gin.Context) {
	p, _ := strconv.Atoi(c.Query("p"))
	if p < 0 {
		p = 0
	}
	startTimestamp, _ := strconv.ParseInt(c.Query("start_timestamp"), 10, 64)
	endTimestamp, _ := strconv.ParseInt(c.Query("end_timestamp"), 10, 64)
	// 解析其他查询参数
	queryParams := model.SyncTaskQueryParams{
		Platform:       constant.TaskPlatform(c.Query("platform")),
		TaskID:         c.Query("task_id"),
		Status:         c.Query("status"),
		Action:         c.Query("action"),
		StartTimestamp: startTimestamp,
		EndTimestamp:   endTimestamp,
	}

	logs := model.TaskGetAllTasks(p*common.ItemsPerPage, common.ItemsPerPage, queryParams)
	if logs == nil {
		logs = make([]*model.Task, 0)
	}

	c.JSON(200, gin.H{
		"success": true,
		"message": "",
		"data":    logs,
	})
}

func GetUserTask(c *gin.Context) {
	p, _ := strconv.Atoi(c.Query("p"))
	if p < 0 {
		p = 0
	}

	userId := c.GetInt("id")

	startTimestamp, _ := strconv.ParseInt(c.Query("start_timestamp"), 10, 64)
	endTimestamp, _ := strconv.ParseInt(c.Query("end_timestamp"), 10, 64)

	queryParams := model.SyncTaskQueryParams{
		Platform:       constant.TaskPlatform(c.Query("platform")),
		TaskID:         c.Query("task_id"),
		Status:         c.Query("status"),
		Action:         c.Query("action"),
		StartTimestamp: startTimestamp,
		EndTimestamp:   endTimestamp,
	}

	logs := model.TaskGetAllUserTask(userId, p*common.ItemsPerPage, common.ItemsPerPage, queryParams)
	if logs == nil {
		logs = make([]*model.Task, 0)
	}

	c.JSON(200, gin.H{
		"success": true,
		"message": "",
		"data":    logs,
	})
}

func GetImageTask(c *gin.Context) {
	taskId := c.Param("id")
	//校验用户
	userId := c.GetInt("id")
	//TODO 筛选类型
	originTask, exist, err := model.GetByTaskId(userId, taskId)
	if err != nil {
		requestId := c.GetString(common.RequestIdKey)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"message": common.MessageWithRequestId("数据库繁忙，查找任务失败", requestId),
				"type":    "get_task_failed",
			},
		})
		return
	}
	if !exist {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"message": "用户未提交过该任务",
				"type":    "task_not_exist",
			},
		})
		return
	}

	// 构造返回的结果
	resp := model.APITaskData{
		TaskID:     originTask.TaskID,
		Status:     originTask.Status,
		FailReason: originTask.FailReason,
		TaskResult: nil,
		CreatedAt:  originTask.CreatedAt,
		UpdatedAt:  originTask.UpdatedAt,
	}

	//执行完成，获取结果
	if resp.Status == model.TaskStatusSuccess {
		imageTaskResult := model.ImageTaskResult{}
		var data model.SelfTaskData
		json.Unmarshal(originTask.Data, &data)
		for _, result := range data.Output.Results {
			imageTaskResult.URL = append(imageTaskResult.URL, result.Url)
		}
		resp.TaskResult = imageTaskResult
	}

	c.JSON(200, resp)
}

func GetImageTaskList(c *gin.Context) {
	var req model.APITaskReq
	err := c.ShouldBind(&req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
	}

	//校验用户
	userId := c.GetInt("id")

	//TODO 筛选类型
	queryParams := model.SyncTaskQueryParams{}

	originTasks := model.TaskGetAllUserTask(userId, req.PageSize, req.PageNum, queryParams)

	// 构造返回的结果
	resp := make([]model.APITaskData, 0)
	for _, task := range originTasks {
		one := model.APITaskData{
			TaskID:     task.TaskID,
			Status:     task.Status,
			FailReason: task.FailReason,
			TaskResult: nil,
			CreatedAt:  task.CreatedAt,
			UpdatedAt:  task.UpdatedAt,
		}
		if task.Status == model.TaskStatusSuccess {
			imageTaskResult := model.ImageTaskResult{}
			var data model.SelfTaskData
			json.Unmarshal(task.Data, &data)
			for _, result := range data.Output.Results {
				imageTaskResult.URL = append(imageTaskResult.URL, result.Url)
			}
			one.TaskResult = imageTaskResult
		}
		resp = append(resp, one)
	}

	//执行完成，获取结果

	c.JSON(200, resp)
}

func GetVideoTask(c *gin.Context) {
	taskId := c.Param("id")
	//校验用户
	userId := c.GetInt("id")
	//TODO 筛选类型
	originTask, exist, err := model.GetByTaskId(userId, taskId)
	if err != nil {
		requestId := c.GetString(common.RequestIdKey)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"message": common.MessageWithRequestId("数据库繁忙，查找任务失败", requestId),
				"type":    "get_task_failed",
			},
		})
		return
	}
	if !exist {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"message": "用户未提交过该任务",
				"type":    "task_not_exist",
			},
		})
		return
	}

	// 构造返回的结果
	resp := model.APITaskData{
		TaskID:     originTask.TaskID,
		Status:     originTask.Status,
		FailReason: originTask.FailReason,
		TaskResult: nil,
		CreatedAt:  originTask.CreatedAt,
		UpdatedAt:  originTask.UpdatedAt,
	}

	//执行完成，获取结果
	if resp.Status == model.TaskStatusSuccess {
		videoTaskResult := model.VideoTaskResult{}
		var data model.SelfTaskData
		json.Unmarshal(originTask.Data, &data)
		for _, result := range data.Output.Results {
			videoTaskResult.URL = result.Url
		}
		resp.TaskResult = videoTaskResult
	}

	c.JSON(200, resp)
}

func GetVideoTaskList(c *gin.Context) {
	var req model.APITaskReq
	err := c.ShouldBind(&req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
	}

	//校验用户
	userId := c.GetInt("id")

	//TODO 筛选类型
	queryParams := model.SyncTaskQueryParams{}

	originTasks := model.TaskGetAllUserTask(userId, req.PageSize, req.PageNum, queryParams)

	//执行完成，获取结果
	resp := make([]model.APITaskData, 0)
	for _, task := range originTasks {
		one := model.APITaskData{
			TaskID:     task.TaskID,
			Status:     task.Status,
			FailReason: task.FailReason,
			TaskResult: nil,
			CreatedAt:  task.CreatedAt,
			UpdatedAt:  task.UpdatedAt,
		}
		if task.Status == model.TaskStatusSuccess {
			videoTaskResult := model.VideoTaskResult{}
			var data model.SelfTaskData
			json.Unmarshal(task.Data, &data)
			for _, result := range data.Output.Results {
				videoTaskResult.URL = result.Url
			}
			one.TaskResult = videoTaskResult
		}
		resp = append(resp, one)
	}

	c.JSON(200, resp)
}
