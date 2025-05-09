import { Spin } from "@douyinfe/semi-ui";

/**
 * @param { {
 * loading: boolean;
 * children: React.ReactNode;
 * loadingEl: React.ReactNode;
 * } } props
 */
const LoadingContent = (props) => {
  const loadingEl = props.loadingEl || (
    <div className='loading-mask' style={{
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      top: 0,
      left: 0,
    }}>
      <Spin size='large' />
    </div>
  );
  const { loading, children } = props;
  return loading ? loadingEl : children;
};

export default LoadingContent;