package controller

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"one-api/service"
	"strings"
)

type Resp struct {
	Code int `json:"code"`
	Data struct {
	} `json:"data"`
	Msg string `json:"msg"`
}

func SendMessage(url, context string) error {
	//发送http请求 https://www.feishu.cn/flow/api/trigger-webhook/461672a3df203f72373e1ec96cdde4c5
	resp, err := doHttpRequest(url, strings.NewReader(context))
	if err != nil {
		return fmt.Errorf("new request failed: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return errors.New(fmt.Sprintf("Get Task status code: %d", resp.StatusCode))
	}
	defer resp.Body.Close()
	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	var r Resp
	err = json.Unmarshal(responseBody, &r)
	if err != nil {
		return err
	}

	if r.Code != 0 || r.Msg != "success" {
		return errors.New("Fail in send")
	}
	return nil
}

func doHttpRequest(url string, requestBody io.Reader) (*http.Response, error) {
	req, err := http.NewRequest("POST", url, requestBody)
	if err != nil {
		return nil, fmt.Errorf("new request failed: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	client := service.GetHttpClient()
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	if resp == nil {
		return nil, errors.New("resp is nil")
	}
	_ = req.Body.Close()
	return resp, nil
}
