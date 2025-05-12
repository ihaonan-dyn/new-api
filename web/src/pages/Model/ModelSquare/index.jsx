import { IconSearch, IconSidebar } from '@douyinfe/semi-icons';
import { Input } from '@douyinfe/semi-ui';
import React, { useState } from 'react';
import styled from 'styled-components';
import Sidebar from './components/Slider';

const PageContainer = styled.div`
  display: flex;

  .main-content {
    flex: 1;
    padding: 20px;
  }

  .top-tools {
    margin-bottom: 20px;
    border-radius: var(--semi-border-radius-large);
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .switch-slider-btn {
    flex-shrink: 0;
    padding: 8px 16px;
    border: 1px solid var(--semi-color-border);
    border-radius: var(--semi-border-radius-large);
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    cursor: pointer;
  }

  .search-inp {
    width: 400px;
  }

  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
  }

  .model-card {
    background: var(--semi-color-bg-0);
    border: 1px solid var(--semi-color-border);
    border-radius: var(--semi-border-radius-large);
    padding: 16px;
    transition: all 0.3s;
    position: relative;
    cursor: pointer;

    &:hover {
      box-shadow: var(--semi-shadow-elevated);
      transform: translateY(-2px);
    }
  }

  .model-header {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .model-icon {
    width: 40px;
    height: 40px;
    border-radius: var(--semi-border-radius-large);
    object-fit: cover;
  }

  .model-title {
    margin: 0;
    font-size: var(--semi-font-size-header-6);
    font-weight: var(--semi-font-weight-semi-bold);
    flex-grow: 1;
    color: var(--semi-color-text-0);
    display: flex;
    align-items: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .model-info {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--semi-color-text-2);
    font-size: var(--semi-font-size-small);
    margin-top: 4px;
  }

  .model-description {
    margin: 12px 0;
    font-size: var(--semi-font-size-small);
    color: var(--semi-color-text-0);
  }

  .tag-container {
    display: flex;
    overflow-x: auto;
    gap: 8px;
    margin-top: 12px;
    &::-webkit-scrollbar {
      height: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: var(--semi-color-fill-2);
      border-radius: var(--semi-border-radius-small);
    }
    &::-webkit-scrollbar-track {
      background: var(--semi-color-fill-0);
      border-radius: var(--semi-border-radius-small);
    }
  }

  .tag {
    background: var(--semi-color-fill-0);
    color: var(--semi-color-text-2);
    padding: 4px 8px;
    border-radius: var(--semi-border-radius-small);
    font-size: var(--semi-font-size-small);
    flex-shrink: 0;

    &:hover {
      background: var(--semi-color-primary-light-default);
      color: var(--semi-color-primary);
    }
  }

  .new-tag {
    background: var(--semi-color-danger);
    color: var(--semi-color-white);
    padding: 2px 6px;
    border-radius: 0 var(--semi-border-radius-small) 0 var(--semi-border-radius-small);
    font-size: var(--semi-font-size-small);
    line-height: 16px;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    position: absolute;
    right: 0;
    top: 0;
  }

  .bold-txt {
    font-weight: var(--semi-font-weight-bold);
  }
`;

const renderPriceDesc = () => {
  const isFree = true;
  if (isFree) {
    return (
      <div className='price-desc'>
        <span className='bold-txt'>免费</span>
      </div>
    );
  }

  return (
    <div className='price-desc'>
      ￥<span className="bold-txt">价格占位</span>/ M Tokens
    </div>
  )
};

const ModelSquare = () => {
  // ... existing code ...
  const [isHideSlider, setIsHideSlider] = useState(false);
  const [isListLoading, setIsListLoading] = useState(false);
  const [list, setList] = useState([{}, {}]);

  return (
    <PageContainer>
      <Sidebar isHide={isHideSlider} />
      <div className='main-content'>
        <div className='top-tools'>
          <div
            className='switch-slider-btn'
            onClick={() => {
              setIsHideSlider(!isHideSlider);
            }}
          >
            <IconSidebar />
            <span className='txt'>
              {isHideSlider ? '展开筛选器' : '隐藏筛选器'}
            </span>
          </div>
          <Input className='search-inp' suffix={<IconSearch />} showClear />
        </div>

        <div className='card-grid'>
          {list.map((item, index) => (
            <div className='model-card' key={index}>
              <span className='new-tag'>tag占位</span>
              <div className='model-header'>
                <img className='model-icon' src={''} alt={''} />
                <div>
                  <h3 className='model-title'>{'名称占位'}</h3>
                  <div className='model-info'>
                    <span>v{'版本占位'}</span>
                    <span>|</span>
                    {renderPriceDesc()}
                  </div>
                </div>
              </div>
              <p className='model-description'>{'描述占位'}</p>
              <div className='tag-container'>
                {new Array(10).fill(1).map((tag, index) => (
                  <div className='tag' key={index}>
                    {'tag占位'}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
};

export default ModelSquare;
