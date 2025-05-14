import { copy } from '@/helpers';
import { IconCopy, IconSourceControl } from '@douyinfe/semi-icons';
import { Button, SideSheet, Tooltip } from '@douyinfe/semi-ui';
import classNames from 'classnames';
import { t } from 'i18next';
import React, { forwardRef, useImperativeHandle, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const DetailsContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;

  .header {
    padding: 24px 24px 0;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 16px;
  }

  .model-icon {
    width: 40px;
    height: 40px;
    border-radius: var(--semi-border-radius-large);
    object-fit: cover;
  }

  .info {
    flex: 1;
  }

  .title {
    font-size: var(--semi-font-size-header-6);
    color: var(--semi-color-text-0);
    margin: 0;
    display: flex;
    /* align-items: center; */
    gap: 8px;
    .txt {
      overflow: hidden;
      word-break: break-all;
      &.disabled {
        text-decoration: line-through;
      }
    }

    .semi-icon {
      color: var(--semi-color-text-2);
      font-size: 16px;
      flex-shrink: 0;
      cursor: pointer;
      &:hover {
        color: var(--semi-color-primary);
      }
    }
  }

  .manufacturer {
    color: var(--semi-color-text-2);
    margin-top: 4px;
  }

  .desc {
    color: var(--semi-color-text-2);
    font-size: var(--semi-font-size-small);
    margin-top: 4px;
    display: flex;
    > .desc-wrapper {
      overflow: hidden;
      word-break: break-all;
      &.is-pack-up {
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
        text-overflow: ellipsis; /* 确保省略号显示 */
      }
      &::before {
        content: '';
        float: right;
        width: 0;
        height: 100%;
        height: 100%;
        margin-bottom: -20px;
      }
      > .cut-btn {
        float: right;
        clear: both;
        color: var(--semi-color-primary);
        cursor: pointer;
        &:hover {
          opacity: 0.6;
        }
      }
    }
  }

  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
  }

  .tag {
    background: var(--semi-color-primary-light-default);
    color: var(--semi-color-primary);
    padding: 4px 8px;
    border-radius: var(--semi-border-radius-small);
    font-size: var(--semi-font-size-small);
  }

  /* 禁用提示 */
  .disabled-tip {
    padding: 16px 24px;
    color: var(--semi-color-danger);
    font-size: 14px;
    background-color: var(--semi-color-danger-light-default);
    margin-bottom: 16px;
    border-radius: 8px;
  }

  .content {
    flex: 1;
    overflow: auto;
    padding: 0 24px;
  }

  .model-info {
    .info-item {
      display: flex;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid var(--semi-color-border);

      &:last-child {
        border-bottom: none;
      }

      .label {
        width: 100px;
        color: var(--semi-color-text-2);
        flex-shrink: 0;
      }

      .value {
        flex: 1;
        color: var(--semi-color-text-0);

        .price-desc {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .bold-txt {
          font-weight: 700;
          font-size: 14px;
          color: var(--semi-color-text-0);
        }

        .unit {
          color: var(--semi-color-text-2);
          margin-left: 4px;
        }

        .discount-tag {
          display: inline-block;
          margin-left: 8px;
          padding: 2px 6px;
          background: var(--semi-color-danger-light-default);
          color: var(--semi-color-danger);
          border-radius: 4px;
          font-size: 12px;
        }
      }
    }
  }

  .action-btns {
    display: flex;
    gap: 12px;
    padding: 16px 24px;
    border-top: 1px solid var(--semi-color-border);
    background: var(--semi-color-bg-0);
  }
`;

const Details = forwardRef((props, ref) => {
  const { groupRatio, selectedGroup } = props;
  const [data, setData] = useState({});
  const navigate = useNavigate();

  const renderPriceDesc = () => {
    // 不可用
    if (data.status === 2) {
      return (
        <div className='price-desc'>
          <div className='item'>{t('不可用')}</div>
        </div>
      );
    }
    const isFree = data.price_type === 1;
    if (isFree) {
      return (
        <>
          <div className='price-desc'>
            <div className='item'>
              <span className='bold-txt'>{t('免费')}</span>
            </div>
          </div>
        </>
      );
    }

    // 按量计费
    if (data.quota_type === 0) {
      // 这里的 *2 是因为 1倍率=0.002刀，请勿删除
      let inputRatioPrice = data.model_ratio * 2 * groupRatio[selectedGroup];
      let completionRatioPrice =
        data.model_ratio *
        data.completion_ratio *
        2 *
        groupRatio[selectedGroup];
      return (
        <div className='price-desc'>
          <div className='item'>
            {t('提示')}
            {' $ '}
            <span className='bold-txt'>{inputRatioPrice}</span> {' / M tokens '}
          </div>
          <div className='item'>
            {t('补全')} {' $ '}{' '}
            <span className='bold-txt'>{completionRatioPrice} </span>
            {' / M tokens '}
          </div>
        </div>
      );
    }

    const mapUnit = {
      '生图': ' / Image',
      '视频': ' / Video',
    };
    // 按次收费
    let price = data.model_price * groupRatio[selectedGroup];
    return (
      <div className='price-desc'>
        <div className='item'>
          $ <span className='bold-txt'>{price}</span>
          {mapUnit[data.type]}
        </div>
      </div>
    );
  };

  const handleCopy = () => {
    copy(data.model);
  };

  const handleCopyShareLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?model=${data.model}`;
    copy(url, '链接已复制！');
  };

  const [isVisible, setVisible] = useState(false);
  const handleClose = () => {
    setVisible(false);
  };
  const handleOpen = (data) => {
    setData(data);
    setVisible(true);
  };

  useImperativeHandle(ref, () => ({
    handleOpen,
  }));

  // 是否收起
  const [isPackUp, setIsPackUp] = useState(true);

  /* 在线体验 */
  // 体验链接映射
  const experienceLinkMap = {
    对话: () => `/playground?model=${data.model}&enable_group=${JSON.stringify(data.enable_group)}`,
    生图: () => `/playground/image?model=${data.model}&enable_group=${JSON.stringify(data.enable_group)}`,
    视频: () => `/playground/video?model=${data.model}&enable_group=${JSON.stringify(data.enable_group)}`,
  };
  const handleOnlineExperience = () => {
    const linkGetter = experienceLinkMap[data.type];
    linkGetter && navigate(linkGetter());
  };

  // 跳转到API文档
  const apiLinkMap = {
    对话: () => `https://liandanxia-api.apifox.cn/290396775e0`,
    生图: () => `https://liandanxia-api.apifox.cn/290396780e0`,
    视频: () => `https://liandanxia-api.apifox.cn/290396776e0`,
  };
  const handleGoApiDoc = () => {
    const linkGetter = apiLinkMap[data.type];
    linkGetter && window.open(linkGetter());
  };

  return (
    <SideSheet
      title={null}
      visible={isVisible}
      onCancel={handleClose}
      width={600}
      mask
      placement='right'
    >
      <DetailsContainer>
        <div className='header'>
          <img className='model-icon' src={data.icon} alt={data.model} />
          <div className='info'>
            <h3 className='title'>
              <span
                className={classNames({
                  txt: true,
                  disabled: data.status === 2,
                })}
              >
                {data.model}
              </span>
              {data.status !== 2 && (
                <>
                  <Tooltip content={t('复制')} position='top'>
                    <IconCopy className='copy-btn' onClick={handleCopy} />
                  </Tooltip>
                  <Tooltip content={t('分享')} position='top'>
                    <IconSourceControl
                      className='icon'
                      onClick={handleCopyShareLink}
                    />
                  </Tooltip>
                </>
              )}
            </h3>
            <div className='manufacturer'>{data.manufacturer}</div>
            <div className='desc'>
              <div
                className={classNames({
                  'desc-wrapper': true,
                  'is-pack-up': isPackUp,
                })}
              >
                <span
                  className='cut-btn'
                  onClick={() => {
                    setIsPackUp(!isPackUp);
                  }}
                >
                  {isPackUp ? '展开' : '收起'}
                </span>
                {data.description}
              </div>
            </div>
            <div className='tag-list'>
              {/* 类型 */}
              <div className='tag'>{data.type}</div>
              {/* 标签 */}
              {data?.tags?.map((tag) => (
                <div className='tag' key={tag}>
                  {tag}
                </div>
              ))}
              {/* 规格 */}
              {data?.specification?.map((tag) => (
                <div className='tag' key={tag}>
                  {tag}
                </div>
              ))}
              {/* 上下文 */}
              {data.context && <div className='tag'>{data.context}</div>}
            </div>
          </div>
        </div>

        {data.status == 2 && (
          <div className='disabled-tip'>{t('该模型暂不可用')}</div>
        )}
        <div className='content'>
          <div className='model-info'>
            {data.status !== 2 && (
              <div className='info-item'>
                <div className='label'>{t('价格')}</div>
                <div className='value'>{renderPriceDesc()}</div>
              </div>
            )}
            <div className='info-item'>
              <div className='label'>{t('上下文')}</div>
              <div className='value'>128K</div>
            </div>
            <div className='info-item'>
              <div className='label'>{t('发布日期')}</div>
              <div className='value'>{data.publish_time}</div>
            </div>
          </div>
        </div>

        {data.status !== 2 && (
          <div className='action-btns'>
            <Button
              type='primary'
              theme='solid'
              size='large'
              onClick={handleOnlineExperience}
            >
              {t('在线体验')}
            </Button>
            <Button
              type='primary'
              theme='light'
              size='large'
              onClick={handleGoApiDoc}
            >
              {t('API 文档')}
            </Button>
          </div>
        )}
      </DetailsContainer>
    </SideSheet>
  );
});

export default Details;
