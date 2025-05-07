import React from 'react';
import { Spin } from '@douyinfe/semi-ui';
import { t } from 'i18next';

const Loading = ({ prompt: name = 'page' }) => {
  return (
    <Spin style={{ height: 100 }} spinning={true}>
      {t('加载{{name}}中...',{
        name,
      })}
    </Spin>
  );
};

export default Loading;
