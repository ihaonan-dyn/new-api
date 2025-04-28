package controller

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"io"
	"net/http"
	"one-api/common"
	"os"
	"path/filepath"
	"strings"
)

func UploadImage(c *gin.Context) {
	data := make(map[string]interface{})

	file, err := c.FormFile("images")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"message": "获取传参失败",
				"type":    "get_image_failed",
			},
		})
		return
	}
	fileReader, err := file.Open()
	defer fileReader.Close()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"message": "获取文件失败",
				"type":    "get_image_failed",
			},
		})
		return
	}

	// 如果是临时文件，存在硬盘中，则是 *os.File（大于32M），直接报错
	if _, ok := fileReader.(*os.File); ok {
		c.JSON(http.StatusRequestEntityTooLarge, gin.H{
			"error": gin.H{
				"message": "文件太大!",
				"type":    "image_too_large",
			},
		})
		return
	}

	buf, err := io.ReadAll(fileReader)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"message": "文件读取失败",
				"type":    "get_image_failed",
			},
		})
		return
	}

	MaxImageSize := 50 << 20 // 50M
	size := len(buf)
	data["size"] = size
	if size > MaxImageSize {
		c.JSON(http.StatusRequestEntityTooLarge, gin.H{
			"error": gin.H{
				"message": "文件太大!",
				"type":    "image_too_large",
			},
		})
		return
	}

	fileReader.Seek(0, io.SeekStart)

	filename := file.Filename

	// 检查文件扩展名
	ext := strings.ToLower(filepath.Ext(filename))
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".gif" {
		c.JSON(http.StatusUnsupportedMediaType, gin.H{
			"error": gin.H{
				"message": "只能上传JPG、PNG、GIF格式图片!",
				"type":    "unsupported_type",
			},
		})
		return
	}

	imgName, err := common.UploadImageMinio(filename, uint32(file.Size), buf)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"message": "上传图片失败",
				"type":    "failed_to_upload_image",
			},
		})
		return
	}

	data["url"] = imgName
	//拼接 图片地址
	httpStr := "http"
	if os.Getenv("USE_SSL") == "true" {
		httpStr = "https"
	}
	data["full_url"] = fmt.Sprintf("%s://%s/%s/%s", httpStr, os.Getenv("END_POINT"), os.Getenv("BUCKET_NAME"), imgName)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    data,
	})
}
