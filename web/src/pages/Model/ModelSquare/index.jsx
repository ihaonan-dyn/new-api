import LoadingContent from '@/components/LoadingContent';
import { API } from '@/helpers';
import { IconSearch, IconSidebar } from '@douyinfe/semi-icons';
import { Input } from '@douyinfe/semi-ui';
import { t } from 'i18next';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { debounce } from 'yd-web-utils'; //引入插件
import Sidebar from './components/Slider';
import Text from '@douyinfe/semi-ui/lib/es/typography/text';
import { UserContext } from '@/context/User/index.js';
import Details from './components/Details';
const PageContainer = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
  .main-content {
    flex: 1;
    /* padding: 20px; */
    margin-left: 20px;
    display: flex;
    flex-direction: column;
  }

  .top-tools {
    margin-bottom: 16px;
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

  .card-container {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 16px;
    padding-top: 4px;
  }

  .model-card {
    background: var(--semi-color-bg-0);
    border: 1px solid var(--semi-color-border);
    border-radius: var(--semi-border-radius-large);
    padding: 20px 20px 12px;
    transition: all 0.3s;
    position: relative;
    cursor: pointer;

    &:hover {
      box-shadow: var(--semi-shadow-elevated);
      transform: translateY(-2px);
    }
    > .price-desc {
      flex-shrink: 0;
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      line-height: 20px;
      color: var(--semi-color-text-2);
    }
  }

  .model-header {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    gap: 12px;
    > .infos {
      width: calc(100% - 52px);
    }
  }

  .model-icon {
    width: 40px;
    height: 40px;
    border-radius: var(--semi-border-radius-large);
    object-fit: cover;
    flex-shrink: 0;
  }

  .model-title {
    margin: 0;
    font-size: var(--semi-font-size-header-6);
    font-weight: var(--semi-font-weight-semi-bold);
    color: var(--semi-color-text-0);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    word-break: break-all;
    max-width: 100%;
  }

  .model-info {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--semi-color-text-2);
    font-size: var(--semi-font-size-small);
    margin-top: 4px;
    > .version-txt {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      word-break: break-all;
    }
  }

  .model-description {
    margin-top: 4px;
    margin-bottom: 12px;
    font-size: var(--semi-font-size-small);
    color: var(--semi-color-text-0);
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    text-overflow: ellipsis; /* 确保省略号显示 */
    word-break: break-all;
  }

  .tag-container {
    display: flex;
    overflow-x: auto;
    gap: 8px;
    margin-top: 12px;
    padding-bottom: 8px;
    &::-webkit-scrollbar {
      height: 6px;
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
    background: var(--semi-color-primary-light-default);
    color: var(--semi-color-primary);
    padding: 4px 8px;
    border-radius: var(--semi-border-radius-small);
    font-size: var(--semi-font-size-small);
    flex-shrink: 0;
    user-select: none;
  }

  .new-tag {
    background: var(--semi-color-danger);
    color: var(--semi-color-white);
    padding: 2px 6px;
    border-radius: 0 var(--semi-border-radius-small) 0
      var(--semi-border-radius-small);
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
    font-weight: 700;
    font-size: 14px;
    color: var(--semi-color-text-0);
  }
`;

const ModelSquare = () => {
  // ... existing code ...
  const [isHideSlider, setIsHideSlider] = useState(false);
  const [isListLoading, setIsListLoading] = useState(false);
  const [list, setList] = useState([]);
  // 用户信息
  const [userState, userDispatch] = useContext(UserContext);
  const [groupRatio, setGroupRatio] = useState({});
  const selectedGroup = useMemo(() => {
    return userState?.user?.group || 'default';
  }, [userState]);

  const renderPriceDesc = (record) => {
    // 不可用
    if (record.status === 2) {
      return (
        <div className='price-desc'>
          <div className='item'>{t('不可用')}</div>
        </div>
      );
    }
    const isFree = record.price_type === 1;
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
    if (record.quota_type === 0) {
      // 这里的 *2 是因为 1倍率=0.002刀，请勿删除
      let inputRatioPrice = record.model_ratio * 2 * groupRatio[selectedGroup];
      let completionRatioPrice =
        record.model_ratio *
        record.completion_ratio *
        2 *
        groupRatio[selectedGroup];
      return (
        <div className='price-desc'>
          <div className='item'>
            {t('提示')}
            {' $ '}
            <span className='bold-txt'>{inputRatioPrice}</span> {' / '} 1M tokens
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
    let price = record.model_price * groupRatio[selectedGroup];
    return (
      <div className='price-desc'>
        <div className='item'>
          $ <span className='bold-txt'>{price}</span>
          {' / '} {t('次')}
        </div>
      </div>
    );
  };

  const [inputValue, setInputValue] = useState({
    model: '',
    type: [],
    tags: [],
    manufacturer: [],
    price_type: null,
    context: null,
    specification: null,
    publish_time: null,
    status: null,
  });

  const handleInputValueChange = (field, value) => {
    setInputValue((pre) => {
      const newVal = {
        ...pre,
        [field]: value,
      };
      handleGetList(newVal);
      return newVal;
    });
  };

  // 处理基本类型的输入值
  const handleBasicInputVal = (field, value) => {
    inputValue[field] === value && (value = null);
    handleInputValueChange(field, value);
  };

  // 处理数组类型的输入值
  const handleArrInputVal = (field, value) => {
    const preVal = inputValue[field];
    if (!Array.isArray(preVal)) {
      throw new Error('字段非数字');
    }
    let newVal = [];
    if (preVal.includes(value)) {
      newVal = preVal.filter((item) => item !== value);
    } else {
      newVal = [...preVal, value];
    }
    handleInputValueChange(field, newVal);
  };

  // 获取列表数据
  const handleGetList = async (params = inputValue) => {
    setIsListLoading(true);
    try {
      const { data } = await API.post('/api/model_list', params);
      if (data.success) {
        setList(data.data);
        setGroupRatio(data.group_ratio);
      }
    } catch (error) {}
    setIsListLoading(false);
  };

  useEffect(() => {
    handleGetList();
  }, []);

  /* 获取详情页数据 */
  const detailRef = useRef();

  return (
    <PageContainer>
      <Sidebar
        isHide={isHideSlider}
        handleBasicInputVal={handleBasicInputVal}
        handleArrInputVal={handleArrInputVal}
        inputValue={inputValue}
      />
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
              {isHideSlider ? t('展开筛选器') : t('隐藏筛选器')}
            </span>
          </div>
          <Input
            className='search-inp'
            suffix={<IconSearch />}
            placeholder={t('请输入模型名称')}
            showClear
            onChange={debounce(
              (v) => {
                handleInputValueChange('context', v.trim());
              },
              300,
              false,
            )}
          />
        </div>

        <div className='card-container common-scroll-container no-scrollbar'>
          <LoadingContent loading={isListLoading}>
            <div className='card-grid'>
              {list.map((item, index) => (
                <div className='model-card' key={index} onClick={()=>{
                  detailRef.current?.handleOpen(item);
                }}>
                  {/* <span className='new-tag'>tag占位</span> */}
                  <div className='model-header'>
                    <img
                      className='model-icon'
                      src={item.icon}
                      alt={item.model}
                    />
                    <div className='infos'>
                      <div className='model-title'>{item.model}</div>
                      <div className='model-info'>
                        <span className='version-txt'>{item.manufacturer}</span>
                      </div>
                    </div>
                  </div>
                  {renderPriceDesc(item)}
                  <p className='model-description'>{item.description}</p>
                  <div className='tag-container'>
                    {/* 类型 */}
                    <div className='tag'>{item.type}</div>
                    {/* 标签 */}
                    {item.tags.map((tag) => (
                      <div className='tag' key={tag}>
                        {tag}
                      </div>
                    ))}
                    {/* 规格 */}
                    {item.specification.map((tag) => (
                      <div className='tag' key={tag}>
                        {tag}
                      </div>
                    ))}
                    {/* 上下文 */}
                    {item.context && <div className='tag'>{item.context}</div>}
                  </div>
                </div>
              ))}
            </div>
          </LoadingContent>
        </div>
      </div>
      <Details ref={detailRef} groupRatio={groupRatio} selectedGroup={selectedGroup} />
    </PageContainer>
  );
};

export default ModelSquare;
