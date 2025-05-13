import HeaderBar from './HeaderBar.js';
import { Layout } from '@douyinfe/semi-ui';
import SiderBar from './SiderBar.js';
import App from '../App.js';
import FooterBar from './Footer.js';
import { ToastContainer } from 'react-toastify';
import React, { useContext, useEffect } from 'react';
import { StyleContext } from '../context/Style/index.js';
import { useTranslation } from 'react-i18next';
import { API, getLogo, getSystemName, showError } from '../helpers/index.js';
import { setStatusData } from '../helpers/data.js';
import { UserContext } from '../context/User/index.js';
import { StatusContext } from '../context/Status/index.js';
const { Sider, Content, Header, Footer } = Layout;


const PageLayout = () => {
  const [userState, userDispatch] = useContext(UserContext);
  const [statusState, statusDispatch] = useContext(StatusContext);
  const [styleState, styleDispatch] = useContext(StyleContext);
  const { i18n } = useTranslation();

  const loadUser = () => {
    let user = localStorage.getItem('user');
    if (user) {
      let data = JSON.parse(user);
      userDispatch({ type: 'login', payload: data });
    }
  };

  const loadStatus = async () => {
    try {
      const res = await API.get('/api/status');
      const { success, data } = res.data;
      if (success) {
        statusDispatch({ type: 'set', payload: data });
        setStatusData(data);
      } else {
        showError('Unable to connect to server');
      }
    } catch (error) {
      showError('Failed to load status');
    }
  };

  useEffect(() => {
    loadUser();
    loadStatus().catch(console.error);
    let systemName = getSystemName();
    if (systemName) {
      document.title = systemName;
    }
    let logo = getLogo();
    if (logo) {
      let linkElement = document.querySelector("link[rel~='icon']");
      if (linkElement) {
        linkElement.href = logo;
      }
    }
    // 从localStorage获取上次使用的语言
    const savedLang = localStorage.getItem('i18nextLng');
    if (savedLang) {
      i18n.changeLanguage(savedLang);
    }
    
    // 默认显示侧边栏
    styleDispatch({ type: 'SET_SIDER', payload: true });
  }, [i18n]);

  // 获取侧边栏折叠状态
  const isSidebarCollapsed = localStorage.getItem('default_collapse_sidebar') === 'true';

  return (
    <Layout style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
    }}>
      <Header style={{ 
        padding: 0, 
        boxShadow: '0 1px 6px rgba(0, 0, 0, 0.08)'
      }}>
        <HeaderBar />
      </Header>
      <Layout style={{ 
        display: 'flex',
        flex: 1,
        overflow: 'hidden'
      }}>
        {styleState.showSider && (
          <Sider>
            <SiderBar />
          </Sider>
        )}
        <Layout style={{ 
          flex: '1 1 auto',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <Content
            style={{ 
              flex: '1 1 auto',
              WebkitOverflowScrolling: 'touch',
              padding: styleState.shouldInnerPadding? '24px': '0',
              position: 'relative',
              marginTop: styleState.isMobile ? '2px' : '0',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'auto'
            }}
          >
            <App />
          </Content>
          <Layout.Footer style={{ 
            flex: '0 0 auto',
            width: '100%'
          }}>
            <FooterBar />
          </Layout.Footer>
        </Layout>
      </Layout>
      <ToastContainer />
    </Layout>
  )
}

export default PageLayout;