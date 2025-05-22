import { IconChevronDown } from '@douyinfe/semi-icons';
import classNames from 'classnames';
// import { t,i18n } from 'i18next';
import { API } from '@/helpers';
import React, { memo, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import LoadingContent from '@/components/LoadingContent';
import { Tooltip } from '@douyinfe/semi-ui';

// 侧边栏容器
const SidebarContainer = styled.div`
  width: 250px;
  flex-shrink: 0;
  padding: 20px 8px 20px 20px;
  user-select: none;
  border: 1px solid var(--semi-color-border);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  &.is-hide {
    display: none;
  }
  .scroll-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: var(--semi-color-bg-0);
    gap: 16px;
    padding-right: 12px;
  }
`;

// 标题
const Title = styled.div`
  color: var(--semi-color-text-0);
  font-size: 12px;
  line-height: 20px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  .semi-icon {
    font-size: 12px;
    transition: transform 0.2s;
    cursor: pointer;
    &.unfold {
      transform: rotate(180deg);
    }
  }
`;

// 选项容器
const OptionContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
`;

// 标签按钮
const TagButton = styled.div`
  padding: 4px 12px;
  border: 1px solid var(--semi-color-border);
  border-radius: 4px;
  color: var(--semi-color-text-0);
  cursor: pointer;
  font-size: 12px;
  background-color: var(--semi-color-bg-4);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
  overflow: hidden;
  &:hover {
    border-color: var(--semi-color-primary);
    color: var(--semi-color-primary);
  }

  &.active {
    color: #fff;
    border-color: var(--semi-color-primary);
    background-color: var(--semi-color-primary);
  }
  > .prefix-icon {
    width: 12px;
    flex-shrink: 0;
  }

  > .txt {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }
`;

/**
 * @param {{
 * isHide: boolean;
 * handleBasicInputVal: (key: string, value: any) => void;
 * handleArrInputVal: (key: string, value: any) => void;
 * inputValue:{};
 * }} props
 */
const Sidebar = (props) => {
  const { isHide, handleBasicInputVal, handleArrInputVal, inputValue } = props;
  const [openSections, setOpenSections] = useState({
    type: true,
    tag: true,
    series: true,
    models: true,
    price: true,
    context: true,
    specs: true,
    releaseDate: true,
  });
  const [isLoading, setIsLoading] = useState(false);

  const { t, i18n } = useTranslation();

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  /* 选项 */
  const [options, setOptions] = useState({
    // 类型
    types: [],
    // 标签
    tags: [],
    // 系列/厂商
    modelManufacturers: [],
    // 价格
    price: () => [
      {
        name: t('免费'),
        value: 1,
      },
      {
        name: t('计费'),
        value: 2,
      },
    ],
    // 上下文
    context: [
      {
        name: '≥8K',
        value: 1,
      },
      {
        name: '≥16K',
        value: 2,
      },
      {
        name: '≥32K',
        value: 3,
      },
      {
        name: '≥128K',
        value: 4,
      },
    ],
    // 规格
    specs: () => [
      { name: 'MoE', value: 1 },
      {
        name: t('{{text}} 以下', {
          text: '10B',
        }),
        value: 2,
      },
      { name: '10 ~ 50B', value: 3 },
      { name: '50 ~ 100B', value: 4 },
      {
        name: t('{{text}} 以上', {
          text: '100B',
        }),
        value: 5,
      },
    ],
    // 发布日期
    releaseDate: () => [
      { name: t('近 30 天'), value: 1 },
      { name: t('近 90 天'), value: 2 },
    ],
  });
  // const [isLoading, setIsLoading] = useState(false);
  const handleGetOptions = async () => {
    setIsLoading(true);
    try {
      const { data } = await API.get('/api/model_filter');
      data.success &&
        setOptions((pre) => ({
          ...pre,
          ...data.data,
        }));
    } catch (error) {
      console.error(error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    handleGetOptions();
  }, []);

  //  类型
  //   const [typeOptions, setTypeOptions] = useState(TempArr);
  const typeOptions = useMemo(() => {
    return openSections.type ? options.types : options.types.slice(0, 2);
  }, [options.types, openSections.type]);
  //   标签
  const tagOptions = useMemo(() => {
    return openSections.tag ? options.tags : options.tags.slice(0, 2);
  }, [options.tags, openSections.tag]);
  //   系列/厂商
  const seriesOptions = useMemo(() => {
    return openSections.series
      ? options.modelManufacturers
      : options.modelManufacturers.slice(0, 2);
  }, [options.modelManufacturers, openSections.series]);
  //   价格
  const pricesOptions = options.price();
  //   上下文
  const contextsOptions = [
    { value: 1, name: '≥ 8K' },
    { value: 2, name: '≥ 16K' },
    { value: 3, name: '≥ 32K' },
    { value: 4, name: '≥ 128K' },
  ];
  //   规格
  const specsOptions = useMemo(() => {
    return openSections.specs ? options.specs() : options.specs().slice(0, 2);
  }, [options.specs, i18n.language]);
  //   发布日期
  const releaseDateOptions = options.releaseDate();

  return (
    <SidebarContainer
      className={classNames({
        'is-hide': isHide,
      })}
    >
      <LoadingContent loading={isLoading}>
        <div className='scroll-wrapper common-scroll-container'>
          <section className='sec'>
            <Title>
              {t('类型')}
              <IconChevronDown
                className={classNames({ unfold: openSections.type })}
                onClick={() => toggleSection('type')}
              />
            </Title>
            <OptionContainer>
              {typeOptions?.map((item) => (
                <Tooltip content={<>{i18n.language === 'zh' ? item.type : item.type_en}</>} position='top' key={item.type}>
                  <TagButton
                    className={classNames({
                      active: inputValue.type.includes(item.type),
                    })}
                    onClick={() => {
                      handleArrInputVal('type', item.type);
                    }}
                  >
                    <span className='txt'>
                      {i18n.language === 'zh' ? item.type : item.type_en}
                    </span>
                  </TagButton>
                </Tooltip>
              ))}
            </OptionContainer>
          </section>
          <section className='sec'>
            <Title>
              {t('标签')}
              <IconChevronDown
                className={classNames({ unfold: openSections.tag })}
                onClick={() => toggleSection('tag')}
              />
            </Title>
            <OptionContainer>
              {tagOptions?.map((item) => (
                <Tooltip content={<>{i18n.language==="zh"?item.tag:item.tag_en}</>} position='top' key={item.tag}>
                  <TagButton
                    className={classNames({
                      active: inputValue.tags.includes(item.tag),
                    })}
                    onClick={() => {
                      handleArrInputVal('tags', item.tag);
                    }}
                  >
                    <span className='txt'>
                      {i18n.language === 'zh' ? item.tag : item.tag_en}
                    </span>
                  </TagButton>
                </Tooltip>
              ))}
            </OptionContainer>
          </section>
          <section className='sec'>
            <Title>
              {t('系列 / 厂商')}
              <IconChevronDown
                className={classNames({ unfold: openSections.series })}
                onClick={() => toggleSection('series')}
              />
            </Title>
            <OptionContainer>
              {seriesOptions?.map((item) => (
                <Tooltip
                  content={<>{item.manufacturer}</>}
                  position='top'
                  key={item.manufacturer}
                >
                  <TagButton
                    className={classNames({
                      active: inputValue.manufacturer.includes(
                        item.manufacturer,
                      ),
                    })}
                    onClick={() => {
                      handleArrInputVal('manufacturer', item.manufacturer);
                    }}
                  >
                    <img className='prefix-icon' src={item.icon} alt='' />
                    <span className='txt'>{item.manufacturer}</span>
                  </TagButton>
                </Tooltip>
              ))}
            </OptionContainer>
          </section>
          <section className='sec'>
            <Title>
              {t('价格')}
              {/* <IconChevronDown
            className={classNames({ unfold: openSections.price })}
          /> */}
            </Title>
            <OptionContainer>
              {pricesOptions?.map((item) => (
                <Tooltip
                  content={<>{item.name}</>}
                  position='top'
                  key={item.value}
                >
                  <TagButton
                    className={classNames({
                      active: inputValue.price_type.includes(item.value),
                    })}
                    onClick={() => {
                      handleArrInputVal('price_type', item.value);
                    }}
                  >
                    <span className='txt'>{item.name}</span>
                  </TagButton>
                </Tooltip>
              ))}
            </OptionContainer>
          </section>
          <section className='sec'>
            <Title>
              {t('上下文')}
              {/* <IconChevronDown
            className={classNames({ unfold: openSections.context })}
          /> */}
            </Title>
            <OptionContainer>
              {contextsOptions?.map((item) => (
                <Tooltip
                  content={<>{item.name}</>}
                  position='top'
                  key={item.value}
                >
                  <TagButton
                    className={classNames({
                      active: inputValue.context === item.value,
                    })}
                    onClick={() => {
                      handleBasicInputVal('context', item.value);
                    }}
                  >
                    <span className='txt'> {item.name}</span>
                  </TagButton>
                </Tooltip>
              ))}
            </OptionContainer>
          </section>
          <section className='sec'>
            <Title>
              {t('规格')}
              <IconChevronDown
                className={classNames({ unfold: openSections.specs })}
                onClick={() => toggleSection('specs')}
              />
            </Title>
            <OptionContainer>
              {specsOptions?.map((item) => (
                <Tooltip
                  content={<>{item.name}</>}
                  position='top'
                  key={item.value}
                >
                  <TagButton
                    className={classNames({
                      active: inputValue.specification === item.value,
                    })}
                    onClick={() => {
                      handleBasicInputVal('specification', item.value);
                    }}
                  >
                    <span className='txt'>{item.name}</span>
                  </TagButton>
                </Tooltip>
              ))}
            </OptionContainer>
          </section>
          <section className='sec'>
            <Title>
              {t('发布日期')}
              {/* <IconChevronDown
            className={classNames({ unfold: openSections.releaseDate })}
            onClick={() => toggleSection('releaseDate')}
          /> */}
            </Title>
            <OptionContainer>
              {releaseDateOptions?.map((item) => (
                <Tooltip
                  content={<>{item.name}</>}
                  position='top'
                  key={item.value}
                >
                  <TagButton
                    className={classNames({
                      active: inputValue.publish_time === item.value,
                    })}
                    onClick={() => {
                      handleBasicInputVal('publish_time', item.value);
                    }}
                  >
                    <span className='txt'>{item.name}</span>
                  </TagButton>
                </Tooltip>
              ))}
            </OptionContainer>
          </section>
        </div>
      </LoadingContent>
    </SidebarContainer>
  );
};

export default memo(Sidebar);
