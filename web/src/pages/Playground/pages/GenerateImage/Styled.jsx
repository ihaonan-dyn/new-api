import styled from 'styled-components';

const PageContainer = styled.main`
  display: flex;
  height: calc(100vh - 60px - 48px - 20px - 2px);
  overflow: hidden;
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .aside {
    border: 1px solid var(--semi-color-border);
    border-radius: 16px;
    margin: 0px 8px;
    width: 320px;
    padding: 20px;
    flex-shrink: 0;

    > .sec {
      &:not(:last-child) {
        margin-bottom: 10px;
      }

      > .title {
        margin-bottom: 2px;
        display: flex;
        align-items: center;
        > .semi-input-number {
          width: 66px;
          margin-left: auto;
        }

        > .txt {
          color: var(--semi-color-text-0);
          font-size: 14px;
          line-height: 20px;
          font-family:
            'Inter',
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            'PingFang SC',
            'Hiragino Sans GB',
            'Microsoft YaHei',
            'Helvetica Neue',
            Helvetica,
            Arial,
            sans-serif;
          font-weight: 600;
        }

        > .semi-icon-alert_circle {
          font-size: 12px;
          cursor: pointer;
        }
      }

      > .content {
        .semi-select {
          width: 100%;
        }
      }

      // 图片分辨率
      &.size {
        // color: red;
        .tags {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 3px;

          .item {
            height: 56px;
            padding-bottom: 4px;
            display: flex;
            flex-direction: column;
            align-items: center;
            border: 1px solid var(--semi-color-text-0);
            cursor: pointer;
            user-select: none;
            transition: all 0.3s ease;

            &:active {
              box-shadow: 0 0 10px 5px rgba(52, 152, 219, 0.7); /* 扩散阴影 */
            }

            &:first-of-type {
              border-top-left-radius: 6px;
              border-bottom-left-radius: 6px;
            }

            &:last-of-type {
              border-top-right-radius: 6px;
              border-bottom-right-radius: 6px;
            }

            .icon-box {
              flex-grow: 1;
              display: flex;
              justify-content: center;
              align-items: center;
              position: relative;

              .icon-wrapper {
                width: 20px;
                // height: 20px;

                > .icon {
                  margin: 0 auto;
                  border: 1px solid var(--semi-color-text-0);
                  border-radius: 2px;
                  object-fit: cover;
                  max-block-size: 20px;
                  // position: absolute;
                  // top: 50%;
                  position: relative;
                  transform: translate(-50);
                }
              }
            }

            > .label {
              flex-shrink: 0;
              font-size: 12px;
            }
            &:hover {
              > .label {
                color: var(--semi-color-primary);
              }
            }
            &.active {
              border: 1px solid var(--semi-color-primary);
              /* --semi-color-text-0: var(--semi-color-primary); */
              > .label {
                color: var(--semi-color-primary);
              }
            }
          }
        }
      }

      /* 输出数量 */
      &.image-num {
        > .title {
        }
      }

      /* 种子 */
      &.seed {
        > .content {
          display: flex;
          align-items: center;
          .semi-input-number {
            flex-grow: 1;
            --semi-border-radius-small: 3px 0 0 3px;
          }
          > .refresh-btn {
            flex-shrink: 0;
            height: 32px;
            width: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            border: 1px solid var(--semi-color-fill-0);
            border-radius: 0 3px 3px 0;
          }
        }
      }
    }
  }

  > .container {
    padding-left: 10px;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow: hidden;
    /* 输出资源预览区 */
    .preview-container {
      --padding: 16px;
      /* aspect-ratio: 1; */
      flex: 1;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
      justify-content: center;

      > .scroll-box {
        max-height: 100%;
        display: flex;
        flex-direction: column;
        gap: 12px;
        // 滚动条相关
        overflow-y: auto;
        &::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        &::-webkit-scrollbar-thumb {
          background: rgba($color: #909399, $alpha: 0.3);
          border-radius: 3px;
          cursor: pointer;
        }

        &::-webkit-scrollbar-track {
          // box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.1);
          background: none;
        }
        > .item {
          > img {
            width: 100%;
          }
        }
      }
      .loading-mask{
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(255, 255, 255, 0.5);
        z-index: 999;
        display: flex;
        justify-content: center;
        align-items: center;
        .semi-spin-wrapper svg{
          width: 40px;
          height: 40px;
        }
      }
    }
    .prompt-tags {
      display: flex;
      gap: 12px;
      > .tag {
        padding: 4px 12px;
        max-width: 200px;
        background-color: var(--semi-color-fill-0);
        white-space: nowrap; /* 禁止换行 */
        overflow: hidden; /* 隐藏超出部分 */
        text-overflow: ellipsis; /* 超出部分显示省略号 */
        border-radius: 4px;
        cursor: pointer;
      }
    }
    .input-area {
      position: relative;
      .semi-input-textarea{
        padding-right: 60px;
      }
      .btn {
        width: 40px;
        height: 40px;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 16px;
        border-radius: 4px;
        color: #fff;
        background-color: var(--semi-color-primary);
        cursor: pointer;
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        right: 12px;
        &.disabled {
          background-color: var(--semi-color-disabled-bg);
          color: var(--semi-color-disabled-text);
          cursor: not-allowed;
        }
      }
    }
  }
`;

export default PageContainer;
