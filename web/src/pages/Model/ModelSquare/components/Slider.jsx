import { IconChevronDown } from '@douyinfe/semi-icons';
import classNames from 'classnames';
import { t } from 'i18next';
import React, { useMemo, useState } from 'react';
import styled from 'styled-components';

// 侧边栏容器
const SidebarContainer = styled.div`
  width: 240px;
  flex-shrink: 0;
  padding: 20px;
  user-select: none;
  display: flex;
  flex-direction: column;
  background-color: var(--semi-color-bg-0);
  gap: 16px;
  border: 1px solid var(--semi-color-border);
  border-radius: 16px;

  &.is-hide {
    display: none;
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
const TagButton = styled.button`
  padding: 4px 12px;
  border: 1px solid var(--semi-color-border);
  border-radius: 4px;
  color: var(--semi-color-text-0);
  cursor: pointer;
  font-size: 12px;
  background-color: var(--semi-color-bg-4);

  &:hover {
    border-color: var(--semi-color-primary);
    color: var(--semi-color-primary);
  }

  &.active {
    color: #fff;
    border-color: var(--semi-color-primary);
    background-color: var(--semi-color-primary);
  }
`;

/**
 * @param {{
 * isHide: boolean;
 * }} props
 */
const Sidebar = (props) => {
  const { isHide } = props;
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

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  //   临时选项
  const TempArr = new Array(6).fill(0).map((item, index) => {
    return {
      value: index,
      name: `选项${index + 1}`,
    };
  });
  /* 选项 */
  const [options, setOptions] = useState({
    // 类型
    type: TempArr,
    // 标签
    tag: TempArr,
    // 系列/厂商
    series: TempArr,
    // 价格
    price: TempArr,
    // 上下文
    context: TempArr,
    // 规格
    specs: [
      { name: 'MoE', value: 0 },
      { name: '10B 以下', value: 1 },
      { name: '10 ~ 50B', value: 2 },
      { name: '50 ~ 100B', value: 3 },
      { name: '100B 以上', value: 4 },
    ],
    // 发布日期
    releaseDate: TempArr,
  });
  //  类型
  //   const [typeOptions, setTypeOptions] = useState(TempArr);
  const typeOptions = useMemo(() => {
    return openSections.type ? options.type : options.type.slice(0, 2);
  }, [options.type, openSections.type]);
  //   标签
  const tagOptions = useMemo(() => {
    return openSections.tag ? options.tag : options.tag.slice(0, 2);
  }, [options.tag, openSections.tag]);
  //   系列/厂商
  const seriesOptions = useMemo(() => {
    return openSections.series ? options.series : options.series.slice(0, 2);
  }, [options.series, openSections.series]);
  //   价格
  const pricesOptions = [
    {
      value: 0,
      name: '只看免费',
    },
    {
      value: 1,
      name: '可用赠费',
    },
  ];
  //   上下文
  const contextsOptions = [
    { id: '8k', name: '≥ 8K' },
    { id: '16k', name: '≥ 16K' },
    { id: '32k', name: '≥ 32K' },
    { id: '128k', name: '≥ 128K' },
  ];
  //   规格
  const specsOptions = useMemo(() => {
    return openSections.specs ? options.specs : options.specs.slice(0, 2);
  }, [options.specs, openSections.specs]);
  //   发布日期
  const releaseDateOptions = [
    {
      name: '近 30 天',
      value: 0,
    },
    {
      name: '近 90 天',
      value: 0,
    },
  ];
  return (
    <SidebarContainer
      className={classNames({
        'common-scroll-container': true,
        'is-hide': isHide,
      })}
    >
      <section className='sec'>
        <Title>
          {t('类型')}
          <IconChevronDown
            className={classNames({ unfold: openSections.type })}
            onClick={() => toggleSection('type')}
          />
        </Title>
        <OptionContainer>
          {typeOptions.map((item) => (
            <TagButton
              key={item.value}
              //   className={classNames({ active: activeModel === item.value })}
              //   onClick={() => setActiveModel(item.value)}
            >
              {item.name}
            </TagButton>
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
          {tagOptions.map((item) => (
            <TagButton
              key={item.value}
              //   className={classNames({ active: activeModel === item.value })}
              //   onClick={() => setActiveModel(item.value)}
            >
              {item.name}
            </TagButton>
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
          {seriesOptions.map((item) => (
            <TagButton
              key={item.value}
              //   className={classNames({ active: activeModel === item.value })}
              //   onClick={() => setActiveModel(item.value)}
            >
              {item.name}
            </TagButton>
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
          {pricesOptions.map((item) => (
            <TagButton
              key={item.value}
              //   className={classNames({ active: activeModel === item.value })}
              //   onClick={() => setActiveModel(item.value)}
            >
              {item.name}
            </TagButton>
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
          {contextsOptions.map((item) => (
            <TagButton
              key={item.value}
              //   className={classNames({ active: activeModel === item.value })}
              //   onClick={() => setActiveModel(item.value)}
            >
              {item.name}
            </TagButton>
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
          {specsOptions.map((item) => (
            <TagButton
              key={item.value}
              //   className={classNames({ active: activeModel === item.value })}
              //   onClick={() => setActiveModel(item.value)}
            >
              {item.name}
            </TagButton>
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
          {releaseDateOptions.map((item) => (
            <TagButton
              key={item.value}
              //   className={classNames({ active: activeModel === item.value })}
              //   onClick={() => setActiveModel(item.value)}
            >
              {item.name}
            </TagButton>
          ))}
        </OptionContainer>
      </section>
    </SidebarContainer>
  );
};

export default Sidebar;
