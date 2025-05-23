import LoadingContent from '@/components/LoadingContent';
import { UserContext } from '@/context/User/index';
import { API,showError } from '@/helpers';
import { renderGroupOption, truncateText } from '@/helpers/render.js';
import { IconAlertCircle, IconSend } from '@douyinfe/semi-icons';
import {
  Button,
  Image,
  Select,
  TextArea,
  Tooltip,
  Typography,
} from '@douyinfe/semi-ui';
import classNames from 'classnames';
import { t } from 'i18next';
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSearchParams } from 'react-router-dom';
import TaskList from './components/TaskList';
import PageContainer from './Styled';
import TextAside from './components/Text/Aside';
import ImageAside from './components/Image/Aside';
import { UNFINISHED_TASK_STATUS } from '../../utils';
import { debounce } from 'yd-web-utils';

let taskTimer = null;

function GenerateVideo() {
  const [searchParams] = useSearchParams();
  const model = searchParams.get('model');
  const tag = searchParams.get('tag');
  // 提交状态
  const [submitLoading, setSubmitLoading] = useState(false);
  const [userState] = useContext(UserContext);

  const TypeEnum = Object.freeze({
    text: '文生视频',
    image: '图生视频',
  });

  const handleGetModelOptions = () => {
    // 文生视频
    (async () => {
      const params = {
        type: ['视频'],
        tags: ['文生视频'],
        status: 1,
      };
      try {
        const {
          data: { data, success },
        } = await API.post('/api/model_list', params);
        if (success && data.length) {
          setTextModelOptions(data);
          const { enable_group } = data[0];
          if (!model && tag !== TypeEnum.text) {
            handleChangeTextInputs({
              model: data[0].model,
              group: enable_group[0],
            });
            setTextEnableGroup(enable_group);
          }
        }
      } catch (error) {}
    })();
    // 图生视频
    (async () => {
      const params = {
        type: ['视频'],
        tags: ['图生视频'],
        status: 1,
      };
      try {
        const {
          data: { data, success },
        } = await API.post('/api/model_list', params);
        if (success && data.length) {
          setImageModelOptions(data);
          const { enable_group } = data[0];
          if (!model && tag !== TypeEnum.image) {
            handleChangeImageInputs({
              model: data[0].model,
              group: enable_group[0],
            });
            setImageEnableGroup(enable_group);
          }
        }
      } catch (error) {}
    })();
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

  const [groupDict, setGroupDict] = useState(null);

  const loadGroups = async () => {
    let res = await API.get(`/api/user/self/groups`);
    const { success, message, data } = res.data;
    if (success) {
      setGroupDict(data);
    } else {
      showError(t(message));
    }
  };

  const [textModelOptions, setTextModelOptions] = useState([]);
  /* 文生视频组件 */
  const [videoFromTextInputs, setVideoFromTextInputs] = useState({
    model: tag === TypeEnum.text ? model || 'wan2.1模型' : 'wan2.1模型',
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

  const [textEnableGroup, setTextEnableGroup] = useState(() => {
    // 如果有 tag 但并不是文生视频
    if (!tag || tag !== TypeEnum.text) {
      return [];
    }
    const params = searchParams.get('enable_group');
    const result = params ? JSON.parse(params) : [];
    if (!Array.isArray(result)) {
      throw new Error('enable_group is not a valid array');
    }
    return result;
  });
  /* 图生视频组件 */
  const [imageModelOptions, setImageModelOptions] = useState([]);
  const [videoFromImageInputs, setVideoFromImageInputs] = useState({
    model: tag === TypeEnum.image ? model || 'wan2.1模型' : 'wan2.1模型',
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

  const [imageEnableGroup, setImageEnableGroup] = useState(() => {
    if (!tag || tag !== TypeEnum.text) {
      return [];
    }
    const params = searchParams.get('enable_group');
    const result = params ? JSON.parse(params) : [];
    if (!Array.isArray(result)) {
      throw new Error('enable_group is not a valid array');
    }
    return result;
  });

  /* 任务结果 */

  const typeOptions = [
    { label: t('文本'), value: TypeEnum.text },
    { label: t('图片'), value: TypeEnum.image },
  ];

  const [type, setType] = useState(tag || TypeEnum.text);
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
  /* 开始任务的后置操作 */
  const handleStartTaskError = ()=>{
    setIsHasUnfinishedTask(false);
    setSubmitLoading(false);
  }
  // 开始任务成功
  const handleStartTaskSuccess = (data)=>{
    setUrl('')
    taskInfo.task_id = data.task_id;
    handleChangeTaskInfo({
      task_id: data.task_id,
    });
    taskListRef.current?.handleRefresh();
    taskListRef.current?.handleStartTastResult(data.task_id);
    handleTastResult();
  }
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
        return Promise.resolve(data);
      } catch (error) {
        return Promise.reject();
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
        return Promise.resolve(data);
      } catch (error) {
        return Promise.reject();
      }
    },
  };
  // 开始任务
  const handleStartTask = debounce(async () => {
    if(isDisabledSend){
      if (!prompt) {
        showError(t('请输入提示词'));
      }else
      if(isHasUnfinishedTask){
        showError(t('上一个视频生成任务未完成，暂不能发起新的视频生成任务'));
      }
      return;
    }

    const callback = startTaskHandlerMap[type];
    if (!callback) {
      return;
    }
    setIsHasUnfinishedTask(true);
    callback().then(handleStartTaskSuccess).catch(handleStartTaskError);
  },300);

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
      
      // 未完成任务状态
      if(UNFINISHED_TASK_STATUS.has(data.task_status)){
        handleCleartaskTimer();
        taskTimer = setTimeout(() => {
          handleTastResult();
        }, 5000);
        return;
      }
      // 已完成任务状态
      setSubmitLoading(false);
      handleCleartaskTimer();
      if (data.task_status === 'SUCCESS') {
        setUrl(data.task_result.url);
        return;
      }

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

  // 是否有未完成任务
  const [isHasUnfinishedTask, setIsHasUnfinishedTask] = useState(false);
  const isDisabledSend = useMemo(() => {
    let flag = true;
    if (type === TypeEnum.image) {
      flag = !prompt || !videoFromImageInputs.img_url;
    }

    flag = !prompt;
    return isHasUnfinishedTask ||  flag;
  }, [prompt, type, videoFromImageInputs.img_url,isHasUnfinishedTask]);

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
        {type === TypeEnum.text ? (
          <TextAside
            modelOptions={textModelOptions}
            enableGroup={textEnableGroup}
            handleChangeInputs={handleChangeTextInputs}
            inputVaue={videoFromTextInputs}
            groupDict={groupDict}
            setEnableGroup={setTextEnableGroup}
          />
        ) : (
          <ImageAside
            modelOptions={imageModelOptions}
            enableGroup={imageEnableGroup}
            handleChangInputs={handleChangeImageInputs}
            inputVaue={videoFromImageInputs}
            groupDict={groupDict}
            setEnableGroup={setImageEnableGroup}
          />
        )}
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
        setIsHasUnfinishedTask={setIsHasUnfinishedTask}
        task_id={taskInfo.task_id}
        handleChangeTask={handleChangeTask}
        ref={taskListRef}
      />
    </PageContainer>
  );
}

export default GenerateVideo;
