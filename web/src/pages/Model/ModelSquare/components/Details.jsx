import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { SideSheet, Button } from '@douyinfe/semi-ui';
import styled from 'styled-components';
import { IconCopy } from '@douyinfe/semi-icons';
import { copy } from '@/helpers';
import { t } from 'i18next';
import classNames from 'classnames';

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
    align-items: center;
    gap: 8px;

    .copy-btn {
      color: var(--semi-color-text-2);
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
            <span className='bold-txt'>{inputRatioPrice}</span> {' / '} 1M
            tokens
          </div>
          <div className='item'>
            {t('补全')} {' $ '}{' '}
            <span className='bold-txt'>{completionRatioPrice} </span>
            {' / '}
            1M tokens
          </div>
        </div>
      );
    }

    // 按次收费
    let price = data.model_price * groupRatio[selectedGroup];
    return (
      <div className='price-desc'>
        <div className='item'>
          $ <span className='bold-txt'>{price}</span>
          {' / '} {t('次')}
        </div>
      </div>
    );
  };

  const handleCopy = () => {
    copy(data.model);
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
              {data.model}
              <IconCopy className='copy-btn' onClick={handleCopy} />
            </h3>
            <div className='manufacturer'>{data.manufacturer}</div>
            <div className='desc'>
              <div
                className={classNames({
                  'desc-wrapper': true,
                  'is-pack-up': isPackUp,
                })}
              >
                3
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

        <div className='content'>
          <div className='model-info'>
            <div className='info-item'>
              <div className='label'>{t('价格')}</div>
              <div className='value'>{renderPriceDesc()}</div>
            </div>
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

        <div className='action-btns'>
          <Button type='primary' theme='solid' size='large'>
            {t('在线体验')}
          </Button>
          <Button type='primary' theme='light' size='large'>
            {t('API 文档')}
          </Button>
        </div>
      </DetailsContainer>
    </SideSheet>
  );
});

export default Details;
