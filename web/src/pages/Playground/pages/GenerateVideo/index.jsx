import { UserContext } from '@/context/User/index';
import { API } from '@/helpers';
import { renderGroupOption, truncateText } from '@/helpers/render.js';
import { IconAlertCircle, IconSend } from '@douyinfe/semi-icons';
import {
  Button,
  Image,
  Select,
  Spin,
  TextArea,
  Tooltip,
  Typography,
} from '@douyinfe/semi-ui';
import classNames from 'classnames';
import { t } from 'i18next';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import TaskList from './components/TaskList';
import PageContainer from './Styled';
import LoadingContent from '@/components/LoadingContent';

let taskTimer = null;

function GenerateVideo() {
  const [searchParams] = useSearchParams();
  const model = searchParams.get('model');
  // 提交状态
  const [submitLoading, setSubmitLoading] = useState(false);
  const [userState] = useContext(UserContext);
  /* 模型 */
  const [modelOptions, setModelOptions] = useState([
    {
      model: 'wan2.1模型',
      enable_group: ['default'],
    },
  ]);

  const handleGetModelOptions = async () => {
    const params = {
      type: ['视频'],
      status: 1,
    };
    try {
      const {
        data: { data, success },
      } = await API.post('/api/model_list', params);
      if (success && data.length) {
        setModelOptions(data);
        const { enable_group } = data[0];
        setEnable_group(enable_group);
        if (!model) {
          handleChangeImageInputs({ model: data[0].model });
          handleChangeTextInputs({ model: data[0].model });
        }

        // 回显分组
        if (enable_group?.lengt) {
          handleChangeImageInputs({ group: enable_group[0] });
          handleChangeTextInputs({ group: enable_group[0] });
        }
      }
    } catch (error) {}
  };

  const sizeOptions = [
    {
      label: '16:9',
      value: '1280*720',
      tipText: '1280x720',
      iconStyle: {
        aspectRatio: 16 / 9,
      },
    },
    {
      label: '9:16',
      value: '720*1280',
      tipText: '720x1280',
      iconStyle: {
        aspectRatio: 9 / 16,
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
        aspectRatio: 4 / 5,
      },
    },
    {
      label: '5:4',
      value: '1088*832',
      tipText: '1088x832',
      iconStyle: {
        aspectRatio: 5 / 4,
      },
    },
  ];

  /* 提示词 */
  // 推荐词
  const [prompt, setPrompt] = useState('');
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

  /* 视频url */
  const [url, setUrl] = useState('');

  /* 分组 */
  const [enable_group, setEnable_group] = useState(() => {
    const params = searchParams.get('enable_group');
    const result = params ? JSON.parse(params) : [];
    if (!Array.isArray(result)) {
      throw new Error('enable_group is not a valid array');
    }
    return result;
  });
  const [groupDict, setGroupDict] = useState(null);

  const groupsOptions = useMemo(() => {
    if (!groupDict || !enable_group?.length) {
      return [];
    }
    return enable_group.map((group) => {
      const info = groupDict[group];
      return {
        label: truncateText(info.desc, '50%'),
        value: group,
        ratio: info.ratio,
        fullLabel: info.desc, // 保存完整文本用于tooltip
      };
    });
  }, [groupDict, enable_group]);

  const loadGroups = async () => {
    let res = await API.get(`/api/user/self/groups`);
    const { success, message, data } = res.data;
    if (success) {
      setGroupDict(data);
    } else {
      showError(t(message));
    }
  };

  /* 文生视频组件 */
  const [videoFromTextInputs, setVideoFromTextInputs] = useState({
    model: model || 'wan2.1模型',
    size: sizeOptions[0].value,
    group: 'default',
  });

  /**
   * 更改文生视频入参
   * @param { {model: string; size:string; group: string } } params
   */
  const handleChangeTextInputs = (params) => {
    setVideoFromTextInputs({ ...videoFromTextInputs, ...params });
  };

  const TextGenerate = {
    aside: () => {
      return (
        <>
          <section className='sec'>
            <div className={'title'}>
              <span className={'txt'}>
                <Typography.Text strong>{t('分组')}：</Typography.Text>
              </span>
            </div>
            <div className={'content'}>
              <Select
                placeholder={t('请选择分组')}
                name='group'
                required
                selection
                onChange={(value) => {
                  handleChangeTextInputs({
                    group: value,
                  });
                }}
                value={videoFromTextInputs.group}
                autoComplete='new-password'
                optionList={groupsOptions}
                renderOptionItem={renderGroupOption}
                style={{ width: '100%' }}
              />
            </div>
          </section>
          <section className='sec'>
            <div className={'title'}>
              <span className={'txt'}>
                <Typography.Text strong>{t('模型')}：</Typography.Text>
              </span>
            </div>
            <div className={'content'}>
              <Select
                onChange={(value) => {
                  handleChangeTextInputs({
                    model: value.model,
                    group: value.enable_group[0],
                  });
                  setEnable_group(value.enable_group);
                }}
                value={videoFromTextInputs.model}
              >
                {modelOptions.map((item) => (
                  <Select.Option key={item.model} value={item}>
                    {item.model}
                  </Select.Option>
                ))}
              </Select>
            </div>
          </section>
          <section className='sec size'>
            <div className='title'>
              <span className='txt'>
                <Typography.Text strong>{t('视频尺寸')}：</Typography.Text>
              </span>
              <Tooltip content={t('生成视频的长宽比。')}>
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
                        active: item.value === videoFromTextInputs.size,
                      })}
                      onClick={() => {
                        handleChangeTextInputs({
                          size: item.value,
                        });
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
        </>
      );
    },
  };

  /* 图生视频组件 */
  const [videoFromImageInputs, setVideoFromImageInputs] = useState({
    model: model || 'wan2.1模型',
    prompt: '',
    img_url: '',
    group: 'default',
  });
  /**
   * 更改图生视频入参
   * @param {{
   * model: string;
   * prompt: string;
   * img_url: string;
   * group: string;
   * }} params
   */
  const handleChangeImageInputs = (params) => {
    setVideoFromImageInputs({ ...videoFromImageInputs, ...params });
  };

  const ImageGenerate = {
    aside: () => {
      const [loading, setLoading] = useState(false);
      const handleFileChange = async (event) => {
        if (loading) return;
        const input = event.target;
        if (!input.files || input.files.length === 0) return;
        const file = input.files[0];
        setLoading(true);
        try {
          const formData = new FormData();
          formData.append('images', file);
          const {
            data: { data },
          } = await API.post('/pg/upload/image', formData);
          handleChangeImageInputs({ img_url: data.full_url });
        } catch (error) {}
        setLoading(false);
      };
      return (
        <>
          <section className='sec'>
            <div className={'title'}>
              <span className={'txt'}>
                <Typography.Text strong>{t('分组')}：</Typography.Text>
              </span>
            </div>
            <div className={'content'}>
              <Select
                placeholder={t('请选择分组')}
                name='group'
                required
                selection
                onChange={(value) => {
                  handleChangeImageInputs({
                    group: value,
                  });
                }}
                value={videoFromImageInputs.group}
                autoComplete='new-password'
                optionList={groupsOptions}
                renderOptionItem={renderGroupOption}
                style={{ width: '100%' }}
              />
            </div>
          </section>
          <section className='sec'>
            <div className={'title'}>
              <span className={'txt'}>
                <Typography.Text strong>{t('模型')}：</Typography.Text>
              </span>
            </div>
            <div className={'content'}>
              <Select
                onChange={(value) => {
                  handleChangeImageInputs({
                    model: value.model,
                    group: value.enable_group[0],
                  });
                  setEnable_group(value.enable_group);
                }}
                value={videoFromImageInputs.model}
              >
                {modelOptions.map((item) => (
                  <Select.Option key={item.model} value={item}>
                    {item.model}
                  </Select.Option>
                ))}
              </Select>
            </div>
          </section>
          <section className='sec required upload-image'>
            <div className={'title'}>
              <span className={'txt'}>
                <Typography.Text strong>{t('上传图片')}：</Typography.Text>
              </span>
            </div>
            <div className={'content'}>
              <Button className='trigger-btn' loading={loading}>
                {t('添加图片')}
                <input
                  className='file-input'
                  type='file'
                  accept='image/jpeg, image/png, image/jpg'
                  onChange={handleFileChange}
                />
              </Button>
              {videoFromImageInputs.img_url && (
                <div className='preview'>
                  <Image src={videoFromImageInputs.img_url} />
                </div>
              )}
            </div>
          </section>
        </>
      );
    },
  };

  const TypeEnum = Object.freeze({
    text: 'text',
    image: 'image',
  });

  const ComponentTypeMap = {
    [TypeEnum.text]: TextGenerate,
    [TypeEnum.image]: ImageGenerate,
  };

  const typeOptions = [
    { label: t('文本'), value: TypeEnum.text },
    { label: t('图片'), value: TypeEnum.image },
  ];

  const [type, setType] = useState(TypeEnum.text);
  // 最终渲染组件
  const FinallyRenderElem = useMemo(() => {
    return ComponentTypeMap[type];
  });
  /* 任务处理 */
  const taskListRef = useRef(null);
  const [taskInfo, setTaskInfo] = useState({
    task_id: null,
  });
  const handleChangeTaskInfo = (params) => {
    setTaskInfo({ ...taskInfo, ...params });
  };
  // 进行任务变更
  const handleChangeTask = (item) => {
    taskInfo.task_id = item.task_id;
    setPrompt(item.input.prompt);
    if (item.input.img_url) {
      setType(TypeEnum.image);
      handleChangeImageInputs(item.input);
    } else {
      setType(TypeEnum.text);
      handleChangeTextInputs(item.input);
    }
    handleTastResult();
  };
  // 任务处理分支
  const startTaskHandlerMap = {
    // 文生视频
    [TypeEnum.text]: async () => {
      setSubmitLoading(true);
      try {
        const { data } = await API.post('/pg/videos/generations', {
          ...videoFromTextInputs,
          prompt,
        });
        taskInfo.task_id = data.task_id;
        handleChangeTaskInfo({
          task_id: data.task_id,
        });

        taskListRef.current?.handleRefresh();
        handleTastResult();
      } catch (error) {
        setSubmitLoading(false);
      }
    },
    // 图生视频
    [TypeEnum.image]: async () => {
      if (!videoFromImageInputs.img_url) {
        return;
      }
      setSubmitLoading(true);
      try {
        const { data } = await API.post('/pg/videos/generations', {
          ...videoFromImageInputs,
          prompt,
        });
        handleChangeTaskInfo({
          task_id: data.task_id,
        });
        taskListRef.current?.handleRefresh();
        handleTastResult();
      } catch (error) {
        setSubmitLoading(false);
      }
    },
  };
  // 开始任务
  const handleStartTask = async () => {
    if (!prompt) {
      return;
    }
    const callback = startTaskHandlerMap[type];
    if (!callback) {
      return;
    }
    callback();
    setUrl('');
    taskListRef.current?.handleRefresh();
  };

  const handleCleartaskTimer = () => {
    if (taskTimer === null) {
      return;
    }

    clearTimeout(taskTimer);
    taskTimer = null;
  };
  // 处理任务结果
  const handleTastResult = async () => {
    setSubmitLoading(true);
    try {
      const { data } = await API.get(
        `/pg/videos/generations/${taskInfo.task_id}`,
      );
      if (data.fail_reason) {
        setSubmitLoading(false);
        return;
      }
      if (data.task_status === 'SUCCESS') {
        handleCleartaskTimer();
        setSubmitLoading(false);
        setUrl(data.task_result.url);
        taskListRef.current?.handleUpdateTask((list) => {
          const item = list.find((item) => item.task_id === taskInfo.task_id);
          item.task_status = 'SUCCESS';
          return list;
        });

        return;
      }
      handleCleartaskTimer();
      taskTimer = setTimeout(() => {
        handleTastResult();
      }, 5000);
    } catch (error) {
      handleCleartaskTimer();
      setSubmitLoading(false);
    }
  };

  // 初始化操作
  useEffect(() => {
    loadGroups();
    handleGetModelOptions();
  }, []);

  useEffect(() => {
    return () => {
      handleCleartaskTimer();
    };
  }, []); // 只在组件挂载时执行

  const isDisabledSend = useMemo(() => {
    if (type === TypeEnum.image) {
      return !prompt || !videoFromImageInputs.img_url;
    }

    return !prompt;
  }, [prompt, type, videoFromImageInputs.img_url]);

  return (
    <PageContainer>
      <aside className='aside'>
        <ul className='tabs'>
          {typeOptions.map((item) => (
            <li
              className={classNames({
                tab: true,
                active: item.value === type,
              })}
              key={item.value}
              onClick={() => {
                setType(item.value);
              }}
            >
              {item.label}
            </li>
          ))}
        </ul>
        <FinallyRenderElem.aside />
      </aside>
      <main className='container'>
        <div className='preview-container'>
          <LoadingContent loading={submitLoading}>
            <div className='video-container'>
              {url && <video src={url} controls></video>}
            </div>
          </LoadingContent>
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
            placeholder={t('请输入提示词')}
            rows={6}
            onChange={setPrompt}
            value={prompt}
          />
          <div
            className={classNames({
              btn: true,
              disabled: isDisabledSend,
            })}
            onClick={handleStartTask}
          >
            <IconSend />
          </div>
        </div>
      </main>
      <TaskList
        task_id={taskInfo.task_id}
        handleChangeTask={handleChangeTask}
        ref={taskListRef}
      />
    </PageContainer>
  );
}

export default GenerateVideo;
