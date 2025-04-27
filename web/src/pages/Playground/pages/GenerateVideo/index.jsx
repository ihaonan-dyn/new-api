import { API } from '@/helpers';
import {
  IconAlertCircle,
  IconSend
} from '@douyinfe/semi-icons';
import {
  Select,
  Spin,
  TextArea,
  Tooltip
} from '@douyinfe/semi-ui';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import PageContainer from './Styled';
import generateTaskStore from '@/store/generateTaskStore';

function GenerateVideo() {
  // 提交状态
  const [submitLoading, setSubmitLoading] = useState(false);
  /* 模型 */
  const modelOptions = [
    {
      label: 'wan2.1模型',
      value: 'wan2.1模型',
    },
  ];
  const [model, setModel] = useState('wan2.1模型');

  /* 比例 */
  const sizeOptions = [
    {
      label: '16:9',
      value: '1280*720',
      tipText: '1280x720',
      iconStyle: {
        aspectRatio: 16/9,
      },
    },
    {
      label: '9:16',
      value: '720*1280',
      tipText: '720x1280',
      iconStyle: {
        aspectRatio: 9/16,
      },
    },
    {
      label: '1:1',
      value: '960*960',
      tipText: '960x960',
      iconStyle: {
        aspectRatio: 1,
      },
    },
    {
      label: '4:5',
      value: '832*1088',
      tipText: '832x1088',
      iconStyle: {
        aspectRatio: 4/5,
      },
    },
    {
      label: '5:4',
      value: '1088*832',
      tipText: '1088x832',
      iconStyle: {
        aspectRatio: 5/4,
      },
    },
  ];
  const [size, setSize] = useState(sizeOptions[0].value);

  /* 提示词 */
  // 推荐词
  const promptTags = [
    {
      value:
        'Stock image, front view, white humidifier placed on the bedside table, white wall, light coming in from the upper left, dappled light and shadow, Scandinavian style, wide-angle shot, central composition, simple background, high-definition, ultra-detailed, high-resolution',
    },
    {
      value:
        'An angel with pink hair, big dark blue eyes, like stars, long and long eyelashes, wearing a white dress, delicate makeup, cute expression, a pair of white wings, with crystal earrings and necklace, front, upper body, background abstract, Korean comic style, fairy tale elements, soft colors and detail description, perfect detail, 16k HD resolution',
    },
    {
      value: `A stunning and vibrant 3D render scene featuring a decadent chocolate strawberry cake with the number '4000' displayed byluxurious candles. The cake is beautifully adorned with colorful confetti, dripping frosting, and a sparkly red ribbon. Surrounding the cake are floating candles, thumbs up icons, and red neon hearts. Iconic superheroes such as Hulk, Spider-Man, Batman, Captain America, and Superman are seen celebrating the momentous occasion. The bold, glowing words 'followers Thank you ideogramers!' are written on the cake, indicating a celebration of a significant milestone among social media followers. The image bears the red neon firm signature "Hans Darias AI" and is captured in a cinematic, fashionable style., photo, cinematic, fashionLess`,
    },
    {
      value: `In a vast, boundless desert, a female warrior stands at the center of the composition. Her figure contrasts sharply with the endless sand dunes, dressed in futuristic, post-apocalyptic armor adorned with sci-fi elements. She turns her head towards the camera, her gaze deep and mysterious, as if concealing a secret. The style of the artwork is inspired by the film Dune, evoking a sense of desolation and future aesthetics. The desert sky is painted in soft hues, with the distant dunes glistening in golden light. The overall tone of the piece is composed and powerful`,
    },
  ];
  const [prompt, setPrompt] = useState('');

  /* SSE */
  const [taskInfo, setTaskInfo] = useState({
    url: '',
  });
  // 开始任务
  const handleStartTask = async () => {
    if (submitLoading || !prompt) {
      return;
    }
    setSubmitLoading(true);
    const params = {
      model,
      prompt,
      size,
    };
    try {
      const res = await API.post('/pg/videos/generations', params);
      generateTaskStore.setVideoFromTextTaskId(res.data.task_id);
      handleTastResult();
    } catch (error) {
      setSubmitLoading(false);
    }
  };

  let taskTimer = null;
  // 处理任务结果
  const handleTastResult = async () => {
    setSubmitLoading(true);
    try {
      const { data } = await API.get(
        `/pg/videos/generations/${generateTaskStore.videoFromTextState.task_id}`,
      );
      if (data.fail_reason) {
        setSubmitLoading(false);
        return;
      }
      if (data.task_status === 'SUCCESS') {
        taskInfo.url = data.task_result.url;
        setSubmitLoading(false);
        setTaskInfo({ ...taskInfo,url: data.task_result.url }); // 触发组件重渲染，更新 taskInfo.urlLis
        return;
      }
      taskTimer = setTimeout(() => {
        handleTastResult();
      }, 2000);
    } catch (error) {}
  };

  useEffect(() => {
   if(generateTaskStore.videoFromTextState.task_id){
    handleTastResult();
   }
   return () => {
    if(taskTimer){
     clearTimeout(taskTimer); // 清除定时器
     taskTimer = null; // 将定时器变量设置为 null
    }
   };
  }, []); // 只在组件挂载时执行 onc
  // 关闭任务
  const handleCloseTask = () => {

  };

  return (
    <PageContainer>
      <aside className='aside'>
        <section className='sec'>
          <div className={'title'}>
            <span className={'txt'}>Model</span>
          </div>
          <div className={'content'}>
            <Select
              onChange={setModel}
              optionList={modelOptions}
              value={model}
            ></Select>
          </div>
        </section>
        <section className='sec size'>
          <div className={'title'}>
            <span className={'txt'}>Image Size</span>
            <Tooltip content='生成图像的长宽比。'>
              <IconAlertCircle />
            </Tooltip>
          </div>
          <div className={'content'}>
            <ul className='tags'>
              {sizeOptions.map((item, index) => (
                <Tooltip key={index} content={item.tipText}>
                  <li
                    className={classNames({
                      item: true,
                      active: item.value === size,
                    })}
                    onClick={() => {
                      setSize(item.value);
                    }}
                  >
                    <div className='icon-box'>
                      <div className='icon-wrapper'>
                        <div className='icon' style={item.iconStyle}></div>
                      </div>
                    </div>
                    <div className='label'>{item.label}</div>
                  </li>
                </Tooltip>
              ))}
            </ul>
          </div>
        </section>

      </aside>
      <main className='container'>
        <div className='preview-container'>
         { submitLoading && <div className="loading-mask">
           <Spin size="large" />
          </div>}
          <div className="scroll-box">
         
          </div>
          <div className="video-container">
          {taskInfo.url && !submitLoading && <video src={taskInfo.url} controls ></video>}
          </div>
        </div>
        <ul className='prompt-tags'>
          {promptTags.map((item, index) => (
            <li
              className='tag'
              key={index}
              onClick={() => {
                setPrompt(item.value);
              }}
            >
              {item.value}
            </li>
          ))}
        </ul>
        <div className='input-area'>
          <TextArea
            showClear
            placeholder='请输入提示词'
            rows={6}
            onChange={setPrompt}
            value={prompt}
          />
          <div
            className={classNames({
              btn: true,
              disabled: !prompt || submitLoading,
            })}
            onClick={handleStartTask}
          >
            <IconSend />
          </div>
          {/* {submitLoading ? (
            <div className='btn' onClick={handleCloseTask}>
              <IconStop />
            </div>
          ) : (
            <div
              className={classNames({
                btn: true,
                disabled: !prompt || submitLoading,
              })}
              onClick={handleStartTask}
            >
              <IconSend />
            </div>
          )} */}
        </div>
      </main>
    </PageContainer>
  );
}

export default GenerateVideo;
