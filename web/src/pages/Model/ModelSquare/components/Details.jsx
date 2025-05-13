import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { SideSheet, Button } from '@douyinfe/semi-ui';
import styled from 'styled-components';
import { IconCopy } from '@douyinfe/semi-icons';
import { copy } from '@/helpers';

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

  .desc {
    color: var(--semi-color-text-2);
    font-size: var(--semi-font-size-small);
    margin-top: 4px;
  }

  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
  }

  .tag {
    background: var(--semi-color-fill-0);
    color: var(--semi-color-text-2);
    padding: 4px 8px;
    border-radius: var(--semi-border-radius-small);
    font-size: var(--semi-font-size-small);
  }

  .content {
    flex: 1;
    overflow: auto;
    padding: 0 24px;
    margin-top: 24px;
  }

  .price-info {
    margin: 24px 0;
    padding: 16px;
    background: var(--semi-color-fill-0);
    border-radius: var(--semi-border-radius-large);

    .price-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      &:last-child {
        margin-bottom: 0;
      }

      .label {
        color: var(--semi-color-text-2);
      }

      .value {
        color: var(--semi-color-text-0);
        font-weight: var(--semi-font-weight-bold);
        &.discount {
          color: var(--semi-color-danger);
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

const Details = forwardRef((params, ref) => {
  const [data, setData] = useState({});
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

  return (
    <SideSheet
      title={null}
      visible={isVisible}
      onCancel={handleClose}
      width={600}
      mask
      placement="right"
    >
      <DetailsContainer>
        <div className='header'>
          <img className='model-icon' src={data.icon} alt={data.model} />
          <div className='info'>
            <h3 className='title'>
              {data.model}
              <IconCopy className='copy-btn' onClick={handleCopy} />
            </h3>
            <div className='desc'>Qwen3-30B-A3B</div>
            <div className='tag-list'>
              <span className='tag'>对话</span>
              <span className='tag'>Tools</span>
              <span className='tag'>推理模型</span>
              <span className='tag'>MoE</span>
              <span className='tag'>30B</span>
              <span className='tag'>128K</span>
            </div>
          </div>
        </div>

        <div className='content'>
          <div className='price-info'>
            <div className='price-row'>
              <span className='label'>输入：</span>
              <span className='value discount'>¥0.35 / M Tokens</span>
            </div>
            <div className='price-row'>
              <span className='label'>输出：</span>
              <span className='value'>¥1.4 / M Tokens</span>
            </div>
            <div className='price-row'>
              <span className='label'>优惠：</span>
              <span className='value discount'>
                可限时五折（4月30日-5月18日）
              </span>
            </div>
          </div>
          <div>{'描述占位'}</div>
        </div>

        <div className='action-btns'>
          <Button type='primary' theme='solid' size='large'>
            在线体验
          </Button>
          <Button type='primary' theme='light' size='large'>
            API 文档
          </Button>
        </div>
      </DetailsContainer>
    </SideSheet>
  );
});

export default Details;