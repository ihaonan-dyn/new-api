package model

import (
	"fmt"
	"strings"
	"time"
)

// Model 模型表
type Model struct {
	Model         string    `json:"model" gorm:"model"`                   // 模型
	Icon          string    `json:"icon" gorm:"icon"`                     // 图标地址
	Type          string    `json:"type" gorm:"type"`                     // 类型
	Tags          string    `json:"tags" gorm:"tags"`                     // 标签
	Manufacturer  string    `json:"manufacturer" gorm:"manufacturer"`     // 系列/厂商
	PriceType     int       `json:"price_type" gorm:"price_type"`         // 价格类型 1-免费 2-计费
	Context       int64     `json:"context" gorm:"context"`               // 上下文 单位K
	Specification string    `json:"specification" gorm:"specification"`   // 规格 单位B（如果是MoE则记为MoE-xxB）
	PublishTime   time.Time `json:"publish_time" gorm:"publish_time"`     // 发布日期
	Description   string    `json:"description" gorm:"description"`       // 简介
	Status        int       `json:"status" gorm:"status"`                 // 状态 1-可用 2-禁用
	TypeEn        string    `json:"type_en" gorm:"type_en"`               // 类型-英文
	TagsEn        string    `json:"tags_en" gorm:"tags_en"`               // 标签-英文
	DescriptionEn string    `json:"description_en" gorm:"description_en"` // 简介-英文
}

// 模型广场
type ModelDetail struct {
	Model           string   `json:"model" gorm:"model"`                   // 模型
	Icon            string   `json:"icon" gorm:"icon"`                     // 图标地址
	Manufacturer    string   `json:"manufacturer" gorm:"manufacturer"`     // 系列/厂商
	PriceType       int      `json:"price_type" gorm:"price_type"`         // 价格类型 1-免费 2-计费
	QuotaType       int      `json:"quota_type"`                           //0-按量计费 1-按次计费
	EnableGroup     []string `json:"enable_group"`                         //模型可用分组
	ModelRatio      float64  `json:"model_ratio"`                          //模型倍率 提示token定价=模型倍率*2*分组倍率（/M Tokens）
	CompletionRatio float64  `json:"completion_ratio"`                     //补全倍率 补全token定价=补全倍率*提示token定价（/M Tokens）
	ModelPrice      float64  `json:"model_price"`                          //单次价格 单价=单次价格*分组倍率（/次）
	Type            string   `json:"type" gorm:"type"`                     // 类型
	Tags            []string `json:"tags" gorm:"tags"`                     // 标签 支持能力
	Context         string   `json:"context" gorm:"context"`               // 上下文
	Specification   []string `json:"specification" gorm:"specification"`   // 规格
	Description     string   `json:"description" gorm:"description"`       // 简介
	PublishTime     string   `json:"publish_time" gorm:"publish_time"`     // 发布日期
	Status          int      `json:"status" gorm:"status"`                 // 状态 1-可用 2-禁用
	TypeEn          string   `json:"type_en" gorm:"type_en"`               // 类型-英文
	TagsEn          []string `json:"tags_en" gorm:"tags_en"`               // 标签-英文
	DescriptionEn   string   `json:"description_en" gorm:"description_en"` // 简介-英文
}

// ModelsQueryParams 用于包含所有搜索条件的结构体，可以根据需求添加更多字段
type ModelsQueryParams struct {
	English       bool     `json:"english"`       //是否使用英文搜索 true-英文 false-中文
	Model         string   `json:"model"`         //模型关键字
	Type          []string `json:"type"`          // 类型
	Tags          []string `json:"tags"`          // 标签
	Manufacturer  []string `json:"manufacturer"`  // 系列/厂商
	PriceType     []int    `json:"price_type"`    // 价格类型 1-免费 2-计费
	Context       int      `json:"context"`       // 上下文 1-≥8K 2-≥16K 3-≥32K 4-≥128K
	Specification int      `json:"specification"` // 规格 1-MoE 2-10B以下 3-10~50B 4-50~100B 5-100B以上
	PublishTime   int      `json:"publish_time"`  // 发布日期 1-近30天 2-近90天
	Status        int      `json:"status"`        // 状态 1-可用 2-禁用
}

// 获取所有模型
func GetModels(queryParams ModelsQueryParams) ([]*Model, error) {
	query := DB.Table("models")

	if queryParams.Model != "" {
		query = query.Where("model Like ?", "%"+queryParams.Model+"%")
	}
	if len(queryParams.Type) > 0 {
		if queryParams.English {
			query = query.Where("type_en IN ?", queryParams.Type)
		} else {
			query = query.Where("type IN ?", queryParams.Type)
		}
	}
	if len(queryParams.Tags) > 0 {
		queryFiled := "tags"
		if queryParams.English {
			queryFiled = "tags_en"
		}

		var conditions []string
		for _, tag := range queryParams.Tags {
			// 查找格式为：以,开头，后跟tag并以,或字符串结尾
			pattern := fmt.Sprintf("CONCAT(',', %s, ',') LIKE '%%,%s,%%'", queryFiled, tag)
			conditions = append(conditions, pattern)
		}
		query = query.Where(strings.Join(conditions, " OR "))
	}
	if len(queryParams.Manufacturer) > 0 {
		query = query.Where("manufacturer IN ?", queryParams.Manufacturer)
	}
	//价格类型只有两种
	if len(queryParams.PriceType) == 1 {
		query = query.Where("price_type = ?", queryParams.PriceType[0])
	}
	if queryParams.Context != 0 {
		queryContext := 0
		switch queryParams.Context {
		case 1:
			queryContext = 8
		case 2:
			queryContext = 16
		case 3:
			queryContext = 32
		case 4:
			queryContext = 128
		}
		query = query.Where("context >= ?", queryContext)
	}
	switch queryParams.Specification {
	case 1:
		query = query.Where("specification Like 'MoE%'")
	case 2:
		query = query.Where("CAST(REGEXP_SUBSTR(specification, '[0-9]+') AS UNSIGNED) < 10")
	case 3:
		query = query.Where("CAST(REGEXP_SUBSTR(specification, '[0-9]+') AS UNSIGNED) BETWEEN 10 AND 50")
	case 4:
		query = query.Where("CAST(REGEXP_SUBSTR(specification, '[0-9]+') AS UNSIGNED) BETWEEN 50 AND 100")
	case 5:
		query = query.Where("CAST(REGEXP_SUBSTR(specification, '[0-9]+') AS UNSIGNED) >100")
	}
	switch queryParams.PublishTime {
	case 1:
		query = query.Where("publish_time > CURDATE() - INTERVAL 30 DAY")
	case 2:
		query = query.Where("publish_time > CURDATE() - INTERVAL 90 DAY")
	}

	//是否可用，用于筛选pg下可用模型
	if queryParams.Status != 0 {
		query = query.Where("status = ?", queryParams.Status)
	}

	var models []*Model
	// 获取数据
	err := query.Order("status").Find(&models).Error
	if err != nil {
		return nil, err
	}

	return models, nil
}

type (
	ModelFilters struct {
		Types              []ModelType         `json:"types"`
		Tags               []ModelTag          `json:"tags"`
		ModelManufacturers []ModelManufacturer `json:"modelManufacturers"`
	}
	ModelType struct {
		Type   string `json:"type" gorm:"type"`
		TypeEn string `json:"type_en" gorm:"type_en"`
	}
	ModelTag struct {
		Tags   string `json:"tag" gorm:"tags"`
		TagsEn string `json:"tag_en" gorm:"tags_en"`
	}
	ModelManufacturer struct {
		Icon         string `json:"icon" gorm:"icon"`                 // 图标地址
		Manufacturer string `json:"manufacturer" gorm:"manufacturer"` // 系列/厂商
	}
)

// 获取模型类型，标签，厂商
func GetModelFilters() (modelFilters ModelFilters) {
	DB.Table("models").Distinct("type,type_en").Find(&modelFilters.Types)

	var tags []ModelTag
	DB.Table("models").Distinct("tags,tags_en").Find(&tags)
	tagMap := make(map[string]string)
	for _, tag := range tags {
		tagArr := strings.Split(tag.Tags, ",")
		tagEnArr := strings.Split(tag.TagsEn, ",")
		for i, s := range tagArr {
			tagMap[s] = tagEnArr[i]
		}
	}
	for tag, tagEn := range tagMap {
		modelFilters.Tags = append(modelFilters.Tags, ModelTag{
			Tags:   tag,
			TagsEn: tagEn,
		})
	}

	DB.Table("models").Select("DISTINCT(manufacturer), icon").Find(&modelFilters.ModelManufacturers)
	return modelFilters
}
