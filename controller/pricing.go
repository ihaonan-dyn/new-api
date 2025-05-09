package controller

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"net/http"
	"one-api/model"
	"one-api/setting"
	"one-api/setting/operation_setting"
	"strings"
)

func GetPricing(c *gin.Context) {
	pricing := model.GetPricing()
	userId, exists := c.Get("id")
	usableGroup := map[string]string{}
	groupRatio := map[string]float64{}
	for s, f := range setting.GetGroupRatioCopy() {
		groupRatio[s] = f
	}
	var group string
	if exists {
		user, err := model.GetUserCache(userId.(int))
		if err == nil {
			group = user.Group
		}
	}

	usableGroup = setting.GetUserUsableGroups(group)
	// check groupRatio contains usableGroup
	for group := range setting.GetGroupRatioCopy() {
		if _, ok := usableGroup[group]; !ok {
			delete(groupRatio, group)
		}
	}

	c.JSON(200, gin.H{
		"success":      true,
		"data":         pricing,
		"group_ratio":  groupRatio,
		"usable_group": usableGroup,
	})
}

func GetModels(c *gin.Context) {
	var req model.ModelsQueryParams
	err := c.ShouldBind(&req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}
	// 筛选模型
	models, err := model.GetAvailableModels(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}
	// 获取价格
	pricing := model.GetPricing()
	// 获取分组倍率
	groupRatio := map[string]float64{}
	for s, f := range setting.GetGroupRatioCopy() {
		groupRatio[s] = f
	}

	ModelsResp := make([]model.ModelDetail, 0)
	for _, m := range models {
		modelDetail := model.ModelDetail{
			Model:         m.Model,
			Icon:          m.Icon,
			Manufacturer:  m.Manufacturer,
			PriceType:     m.PriceType,
			Type:          m.Type,
			Tags:          strings.Split(m.Tags, ","),
			Specification: strings.Split(m.Specification, "-"),
			Description:   m.Description,
			PublishTime:   m.PublishTime.Format("2006-01-02"),
		}
		if m.Context != 0 {
			modelDetail.Context = fmt.Sprintf("%vK", m.Context)
		}
		//免费的模型则直接添加
		if m.PriceType == 1 {
			ModelsResp = append(ModelsResp, modelDetail)
			continue
		}
		//给计费的模型查找价格
		for _, p := range pricing {
			if p.ModelName == m.Model {
				modelDetail.QuotaType = p.QuotaType
				modelDetail.EnableGroup = p.EnableGroup
				modelDetail.ModelRatio = p.ModelRatio
				modelDetail.CompletionRatio = p.CompletionRatio
				modelDetail.ModelPrice = p.ModelPrice
				//找到价格的再返回，没找到则说明价格类型设置错误或者模型已下架，不返回
				ModelsResp = append(ModelsResp, modelDetail)
				break
			}
		}
	}

	c.JSON(200, gin.H{
		"success":     true,
		"data":        ModelsResp,
		"group_ratio": groupRatio,
	})
}

func ResetModelRatio(c *gin.Context) {
	defaultStr := operation_setting.DefaultModelRatio2JSONString()
	err := model.UpdateOption("ModelRatio", defaultStr)
	if err != nil {
		c.JSON(200, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	err = operation_setting.UpdateModelRatioByJSONString(defaultStr)
	if err != nil {
		c.JSON(200, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(200, gin.H{
		"success": true,
		"message": "重置模型倍率成功",
	})
}
