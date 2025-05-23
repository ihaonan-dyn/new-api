import { API } from '@/helpers';
import { renderGroupOption, truncateText } from '@/helpers/render.js';
import { Button, Image, Select, Typography } from '@douyinfe/semi-ui';
import { t } from 'i18next';
import { useMemo, useState } from 'react';

const ImageAside = ({
    groupDict,
    enableGroup,
    handleChangInputs,
    inputVaue,
    modelOptions,
    setEnableGroup
}) => {
  const modelMapGroup = useMemo(()=>{
    return new Map(modelOptions.map(((item) => [item.model, item.enable_group])))
  },[modelOptions]);
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
  const [loading, setLoading] = useState(false);
  const handleFileChange = async (event) => {
    if (loading) return;
    const input = event.target;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('images', file);
      const {
        data: { data },
      } = await API.post('/pg/upload/image', formData);
      handleChangInputs({ img_url: data.full_url });
    } catch (error) {}
    setLoading(false);
  };
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
              handleChangInputs({
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
              const enable_group = modelMapGroup.get(value);
              handleChangInputs({
                model: value,
                group: enable_group[0],
              });
              setEnableGroup(enable_group);
            }}
            value={inputVaue.model}
          >
            {modelOptions.map((item) => (
              <Select.Option key={item.model} value={item.model}>
                {item.model}
              </Select.Option>
            ))}
          </Select>
        </div>
      </section>
      <section className='sec required upload-image'>
        <div className={'title'}>
          <span className={'txt'}>
            <Typography.Text strong>{t('上传图片')}：</Typography.Text>
          </span>
        </div>
        <div className={'content'}>
          <Button className='trigger-btn' loading={loading}>
            {t('添加图片')}
            <input
              className='file-input'
              type='file'
              accept='image/jpeg, image/png, image/jpg'
              onChange={handleFileChange}
            />
          </Button>
          {inputVaue.img_url && (
            <div className='preview'>
              <Image src={inputVaue.img_url} />
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default ImageAside;
