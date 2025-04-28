package common

import (
	"bytes"
	"errors"
	"fmt"
	"github.com/google/uuid"
	"github.com/minio/minio-go/v6"
	"os"
	"strings"
)

var MinioClientGlobal *minio.Client

func InitMinioClient() error {
	// 初始化minio客户端
	if os.Getenv("END_POINT") == "" {
		SysLog("END_POINT not set, Minio is not enabled")
		return nil
	}
	endpoint := os.Getenv("END_POINT")
	accessKeyID := os.Getenv("ACCOUNT")
	secretAccessKey := os.Getenv("PASSWORD")
	useSSL := os.Getenv("USE_SSL") == "true"

	minioClient, err := minio.New(endpoint, accessKeyID, secretAccessKey, useSSL)
	if err != nil {
		return err
	}
	MinioClientGlobal = minioClient
	return nil
}

func UploadImageMinio(filename string, size uint32, data []byte) (string, error) {
	// 初始化minio客户端
	minioClient := MinioClientGlobal
	//拼接上传文件路径
	newRandom, _ := uuid.NewRandom()
	newName := newRandom.String()
	fileType := ""
	filenameArray := strings.Split(filename, ".")
	if len(filenameArray)-1 > 0 {
		fileType = filenameArray[len(filenameArray)-1]
	} else {
		return "", errors.New("img file no type")
	}

	objectName := newName + "." + fileType
	// 图片上传至bucket
	upFile := bytes.NewReader(data)
	minioContentType := "image/" + fileType
	if fileType == "mp4" {
		minioContentType = "video/mp4"
	}
	_, err := minioClient.PutObject(os.Getenv("BUCKET_NAME"), objectName, upFile, int64(size), minio.PutObjectOptions{ContentType: minioContentType})
	if err != nil {
		SysLog(fmt.Sprintf("Failed to Minio Save Image err:%v ", err))
		return "", err
	}

	return objectName, nil
}
