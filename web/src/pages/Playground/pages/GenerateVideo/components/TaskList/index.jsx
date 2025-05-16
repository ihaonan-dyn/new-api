import { API } from '@/helpers';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Label } from 'semantic-ui-react';
import styled from 'styled-components';

import { copy } from '@/helpers';
import { IconCopy } from '@douyinfe/semi-icons';
import classNames from 'classnames';
import { enableInfiniteScroll, formatDate } from 'yd-web-utils'; //引入插件
import LoadingContent from '@/components/LoadingContent';
import { t } from 'i18next';

const TaskListContainer = styled.div`
  width: 300px;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  gap: 12px;
  transition: width 0.3s; // 过渡动画效果，用于隐藏/显示任务列表的宽度
  padding-right: 10px;
  position: relative;
  &.hidden {
    width: 0;
    padding: 0;
    position: fixed;
    /* display: none; */
  }

  .loading-mask {
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    top: 0;
    left: 0;
  }
`;

const TaskItem = styled.div`
  background: var(--semi-color-bg-1);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--semi-color-border);

  &.active {
    border: 1px solid var(--semi-color-primary);
  }
`;

const ModelInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const TaskId = styled.span`
  color: #999;
  font-size: 12px;
  display: flex;
  justify-content: space-between;
  .semi-icon {
    cursor: pointer;
  }
`;

const Prompt = styled.div`
  color: var(--semi-color-text-0);
  margin-bottom: 12px;
  line-height: 1.5;
`;

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #666;
`;

const Time = styled.span`
  color: #999;
`;

const renderStatus = (type) => {
  switch (type) {
    case 'SUCCESS':
      return (
        <Label basic color='green'>
          {' '}
          {t('成功')}{' '}
        </Label>
      );
    case 'NOT_START':
      return (
        <Label basic color='black'>
          {' '}
          {t('未启动')}{' '}
        </Label>
      );
    case 'SUBMITTED':
      return (
        <Label basic color='yellow'>
          {' '}
          {t('队列中')}{' '}
        </Label>
      );
    case 'IN_PROGRESS':
      return (
        <Label basic color='blue'>
          {' '}
          {t('执行中')}{' '}
        </Label>
      );
    case 'FAILURE':
      return (
        <Label basic color='red'>
          {' '}
          {t('失败')}{' '}
        </Label>
      );
    case 'QUEUED':
      return (
        <Label basic color='red'>
          {' '}
          {t('排队中')}{' '}
        </Label>
      );
    case 'UNKNOWN':
      return (
        <Label basic color='red'>
          {' '}
          {t('未知')}{' '}
        </Label>
      );
    case '':
      return (
        <Label basic color='black'>
          {' '}
          {t('正在提交')}{' '}
        </Label>
      );
    default:
      return (
        <Label basic color='black'>
          {' '}
          {t('未知')}{' '}
        </Label>
      );
  }
};

/**
 * @param {
 * {
 * task_id: string,
 * };
 * handleChangeTask: (taskItem:{}) => void;
 * } params
 */
const TaskList = forwardRef((params, ref) => {
  const isFirst = useRef(true);
  const [state, setState] = useState({});
  const handleUpdate = () => {
    setState({});
  };
  const { handleChangeTask } = params;

  const isLoading = useRef(true);
  const [searchParams, setSearchParams] = useState({
    pageNum: 1,
    pageSize: 10,
  });
  const [list, setList] = useState([]);
  // 获取任务列表
  const handleTaskList = async () => {
    isLoading.current = true;
    try {
      const { data } = await API.get('/pg/videos/generations', {
        params: searchParams,
      });
      isMore = data.length >= searchParams.pageSize;
      if (searchParams.pageNum === 1) {
        setList(data);
      } else {
        setList((pre) => {
          return pre.concat(data);
        });
      }
      // 初始化赋值
      // if(isFirst.current){
      //   isFirst.current = false;
      //   handleChangeTask(data[0]);
      //   !params.task_id && data.length > 0 && handleChangeTask(data[0]);
      // }
    } catch (error) {}
    isLoading.current = false;
  };

  /**
   * 更改任务
   * @param {(list:any[])=>any[]} callback 回调函数
   */
  const handleUpdateTask = (callback) => {
    const newList = callback(list);
    setList(newList);
    handleUpdate();
  };

  /* 触底加载 */
  const containerRef = useRef(null);
  let infiniteScrollClose;
  // 是否还有任务
  let isMore = true;
  useEffect(() => {
    if (!containerRef.current) return;
    infiniteScrollClose = enableInfiniteScroll(
      {
        container: containerRef.current,
      },
      () => {
        if (isLoading.current || !isMore) return;
        searchParams.pageNum++;
        handleTaskList();
      },
    );
    return () => {
      infiniteScrollClose && infiniteScrollClose.close();
    };
  }, []);
  // 是否隐藏
  const isHidden = useMemo(() => {
    return !isLoading && list.length === 0;
  }, [isLoading, params, list.length]);

  useImperativeHandle(ref, () => {
    return {
      handleRefresh: () => {
        setSearchParams({
          pageNum: 1,
          pageSize: 10,
        });
        handleTaskList();
      },
      handleUpdateTask,
    };
  });

  useEffect(() => {
    handleTaskList();
  }, []);
  return (
    <TaskListContainer
      ref={containerRef}
      className={classNames({
        hidden: isHidden,
        'common-scroll-container': true,
      })}
    >
      <LoadingContent loading={isLoading.current}>
        {list.map((task) => (
          <TaskItem
            key={task.task_id}
            className={classNames({
              active: task.task_id === params.task_id,
            })}
            onClick={() => {
              if (task.task_id === params.task_id) {
                return;
              }
              handleChangeTask(task);
            }}
          >
            <ModelInfo>
              <span>{task.input.model}</span>
            </ModelInfo>
            <TaskId>
              <span className='txt'>{task.task_id}</span>
              <IconCopy
                onClick={(e) => {
                  e.stopPropagation();
                  copy(task.task_id);
                }}
              />
            </TaskId>

            <Prompt>{task.input.prompt}</Prompt>

            <Footer>
              <Time>{formatDate(task.created_at * 1000)}</Time>
              {renderStatus(task.status)}
            </Footer>
          </TaskItem>
        ))}
      </LoadingContent>
    </TaskListContainer>
  );
});

export default TaskList;
