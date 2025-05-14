import { UserContext } from '@/context/User/index.js';
import { API } from '@/helpers';
import { renderGroupOption, truncateText } from '@/helpers/render.js';
import generateTaskStore from '@/store/generateTaskStore';
import { IconAlertCircle, IconSend, IconSync } from '@douyinfe/semi-icons';
import {
  InputNumber,
  Select,
  Slider,
  Spin,
  TextArea,
  Tooltip,
  Typography,
} from '@douyinfe/semi-ui';
import classNames from 'classnames';
import { useContext, useEffect, useState } from 'react';
import PageContainer from './Styled';
import { t } from 'i18next';
import { useSearchParams } from 'react-router-dom';
import LoadingContent from '@/components/LoadingContent';

let taskTimer = null;
function GenerateImage() {
  const handleCleartaskTimer = () => {
    if (taskTimer === null) {
      return;
    }
    clearTimeout(taskTimer);
    taskTimer = null;
  };
  const [userState, userDispatch] = useContext(UserContext);
  // 查询字符串参数
  const [searchParams] = useSearchParams();
  const enable_group = searchParams.get('enable_group');
  // 提交状态
  const [submitLoading, setSubmitLoading] = useState(false);
  const [inputs, setInputs] = useState({
    model: searchParams.get('model') || 'wanx2.1-t2i-turbo', // 模型
    prompt: '', // 提示词
    seed: 214748364, // 种子
    size: '1024*1024', // 比例
    n: 1,
    group: 'default',
  });
  const handleInputChange = (name, value) => {
    setInputs((inputs) => ({ ...inputs, [name]: value }));
  };
  /* 模型 */
  const [modelOptions, setModelOptions] = useState([
    {
      model: 'wanx2.1-t2i-turbo',
    },
  ]);

  const handleGetModelOptions = async () => {
    const params = {
      type: ['生图'],
      status: 1,
    };
    try {
      const { data } = await API.post('/api/model_list', params);
      if (data.success && data.data.length) {
        setModelOptions(data.data);
        const model = searchParams.get('model');
        !model && handleInputChange('model', data.data[0].model);
      }
    } catch (error) {}
  };

  /* 比例 */
  const sizeOptions = [
    {
      label: '1:1',
      value: '1024*1024',
      tipText: '1024x1024',
      iconStyle: {
        aspectRatio: 1,
      },
    },
    {
      label: '1:2',
      value: '512*1024',
      tipText: '512x1024',
      iconStyle: {
        aspectRatio: 1 / 2,
      },
    },
    {
      label: '3:2',
      value: '1440*960',
      tipText: '1440x960',
      iconStyle: {
        aspectRatio: 3 / 2,
      },
    },
    {
      label: '3:4',
      value: '768*1024',
      tipText: '768x1024',
      iconStyle: {
        aspectRatio: 3 / 4,
      },
    },
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
  ];

  /* 种子 */
  const maxSeed = 2147483647;
  const handleRadomSeed = () => {
    const newSeed = Math.floor(Math.random() * maxSeed + 1);
    handleInputChange('seed', newSeed);
  };

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

  const [url, setUrl] = useState([]);
  /* 分组 */
  const [groups, setGroups] = useState([]);
  const loadGroups = async () => {
    let res = await API.get(`/api/user/self/groups`);
    const { success, message, data } = res.data;
    if (success) {
      let localGroupOptions;
      if(!enable_group){
        localGroupOptions = Object.entries(data).map(([group, info]) => ({
          label: truncateText(info.desc, '50%'),
          value: group,
          ratio: info.ratio,
          fullLabel: info.desc, // 保存完整文本用于tooltip
        }));
      }else{
        const groupData = JSON.parse(enable_group);
        localGroupOptions = groupData.map(group => {
          const info = data[group];
          return {
            label: truncateText(info.desc, '50%'),
            value: group,
            ratio: info.ratio,
            fullLabel: info.desc, // 保存完整文本用于tooltip
          };
        });
      }

      if (localGroupOptions.length === 0) {
        localGroupOptions = [
          {
            label: t('用户分组'),
            value: '',
            ratio: 1,
          },
        ];
      } else {
        const localUser = JSON.parse(localStorage.getItem('user'));
        const userGroup =
          (userState.user && userState.user.group) ||
          (localUser && localUser.group);

        if (userGroup) {
          const userGroupIndex = localGroupOptions.findIndex(
            (g) => g.value === userGroup,
          );
          if (userGroupIndex > -1) {
            const userGroupOption = localGroupOptions.splice(
              userGroupIndex,
              1,
            )[0];
            localGroupOptions.unshift(userGroupOption);
          }
        }
      }

      setGroups(localGroupOptions);
      handleInputChange('group', localGroupOptions[0].value);
    } else {
      showError(t(message));
    }
  };
  // 开始任务
  const handleStartTask = async () => {
    if (submitLoading || !inputs.prompt) {
      return;
    }
    setSubmitLoading(true);
    try {
      const res = await API.post('/pg/images/generations', inputs);
      generateTaskStore.setImageGenerationTaskId(res.data.task_id);
      handleTastResult();
    } catch (error) {
      setSubmitLoading(false);
    }
  };

  // 处理任务结果
  const handleTastResult = async () => {
    setSubmitLoading(true);
    try {
      const { data } = await API.get(
        `/pg/images/generations/${generateTaskStore.imageGenerationState.task_id}`,
      );
      if (data.fail_reason) {
        setSubmitLoading(false);
        return;
      }
      if (data.task_status === 'SUCCESS') {
        setSubmitLoading(false);
        setUrl(data.task_result.url); // 触发组件重渲染，更新 taskInfo.urlLis
        handleCleartaskTimer();
        return;
      }
      handleCleartaskTimer();
      taskTimer = setTimeout(() => {
        handleTastResult();
      }, 5000);
    } catch (error) {}
  };

  useEffect(() => {
    if (generateTaskStore.imageGenerationState.task_id) {
      handleTastResult();
    }
    return () => {
      handleCleartaskTimer();
    };
  }, []); // 添加依赖项，确保在 task_id 变化时重新执行 handleTastResult

  // 初始化操作
  useEffect(() => {
    loadGroups();
    handleGetModelOptions();
  }, []);

  // 关闭任务
  const handleCloseTask = () => {};

  return (
    <PageContainer>
      <aside className='aside'>
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
                handleInputChange('group', value);
              }}
              value={inputs.group}
              autoComplete='new-password'
              optionList={groups}
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
                handleInputChange('model', value);
              }}
              value={inputs.model}
            >
              {modelOptions.map((item, index) => (
                <Select.Option key={index} value={item.model}>
                  {item.model}
                </Select.Option>
              ))}
            </Select>
          </div>
        </section>
        <section className='sec size'>
          <div className={'title'}>
            <span className={'txt'}>
              <Typography.Text strong>{t('图像尺寸')}：</Typography.Text>
            </span>
            <Tooltip content={t('生成图像的长宽比。')}>
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
                      active: item.value === inputs.size,
                    })}
                    onClick={() => {
                      handleInputChange('size', item.value);
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
        <section className='sec image-num'>
          <div className='title'>
            <span className='txt'>
              <Typography.Text strong>{t('图像数量')}：</Typography.Text>
            </span>
            <InputNumber
              innerButtons={true}
              defaultValue={1}
              value={inputs.n}
              min={1}
              max={4}
              onChange={(value) => {
                handleInputChange('n', value);
              }}
            />
          </div>
          <div className='content'>
            <Slider
              step={1}
              marks={{
                1: '',
                2: '',
                3: '',
                4: '',
              }}
              min={1}
              max={4}
              value={inputs.n}
              onChange={(value) => {
                handleInputChange('n', value);
              }}
            />
          </div>
        </section>
        <section className='sec seed'>
          <div className='title'>
            <span className='txt'>
              <Typography.Text strong>{t('种子')}：</Typography.Text>
            </span>
            <Tooltip content={t('相同的种子和提示词可以产生类似的图像。')}>
              <IconAlertCircle />
            </Tooltip>
          </div>
          <div className='content'>
            <InputNumber
              value={inputs.seed}
              onChange={(value) => {
                handleInputChange('seed', value);
              }}
              innerButtons
            ></InputNumber>
            <div className='refresh-btn' onClick={handleRadomSeed}>
              <IconSync />
            </div>
          </div>
        </section>
      </aside>
      <main className='container'>
        <div className='preview-container'>
          <LoadingContent loading={submitLoading}>
            <div className='scroll-box'>
              {url.map((item) => (
                <div className='item' key={item}>
                  <img src={item} alt='' />
                </div>
              ))}
            </div>
          </LoadingContent>
        </div>
        <ul className='prompt-tags'>
          {promptTags.map((item, index) => (
            <li
              className='tag'
              key={index}
              onClick={() => {
                handleInputChange('prompt', item.value);
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
            onChange={(value) => {
              handleInputChange('prompt', value);
            }}
            value={inputs.prompt}
          />
          <div
            className={classNames({
              btn: true,
              disabled: !inputs.prompt || submitLoading,
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

export default GenerateImage;
