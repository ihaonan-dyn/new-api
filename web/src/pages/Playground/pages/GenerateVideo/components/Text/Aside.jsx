import { renderGroupOption, truncateText } from '@/helpers/render.js';
import { IconAlertCircle } from '@douyinfe/semi-icons';
import { Select, Tooltip, Typography } from '@douyinfe/semi-ui';
import classNames from 'classnames';
import { t } from 'i18next';
import { useMemo } from 'react';

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
const TextAside = ({
  groupDict,
  modelOptions,
  enableGroup,
  handleChangeInputs,
  inputVaue,
  setEnableGroup
}) => {
  const groupsOptions = useMemo(() => {
    if (!groupDict || !enableGroup?.length) {
      return [];
    }
    return enableGroup.map((group) => {
      const info = groupDict[group];
      return {
        label: truncateText(info.desc, '50%'),
        value: group,
        ratio: info.ratio,
        fullLabel: info.desc, // 保存完整文本用于tooltip
      };
    });
  }, [groupDict, enableGroup]);
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
              handleChangeInputs({
                group: value,
              });
            }}
            value={inputVaue.group}
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
              handleChangeInputs({
                model: value.model,
                group: value.enable_group[0],
              });
              setEnableGroup(value.enable_group);
            }}
            value={inputVaue.model}
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
                    active: item.value === inputVaue.size,
                  })}
                  onClick={() => {
                    handleChangeInputs({
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
};

export default TextAside;
