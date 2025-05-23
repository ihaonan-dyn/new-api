
/**
 * @param {string} value
 * @param {CookieOptions} options
 * @typedef {{name?: string;  path?: string;domain?: string;expires?: Date | string | undefined;secure?: string;}} CookieOptions
 * @property {string} name
*/
export const setCookie = (value, options = {}) => {
   let { name, path = '/', domain, expires, secure } = options;
   if (typeof window === 'undefined') {
     return;
   }
   if (!name) {
     const hostname = window.location.hostname;
     name = getBaseDomain(hostname);
   }
   domain = '.' + name;
   let cookie = encodeURIComponent(name) + '=' + encodeURIComponent(value);
   if (expires instanceof Date) {
     cookie += '; expires=' + expires.toUTCString();
   } else {
     const date = new Date();
     date.setFullYear(date.getFullYear() + 1);
     cookie += '; expires=' + date.toUTCString();
   }
   if (path) {
     cookie += '; path=' + path;
   }
   if (domain) {
     cookie += '; domain=' + domain;
   }
   if (secure) {
     cookie += '; ' + secure;
   }
   document.cookie = cookie;
 };

/*获取cookie*/
export const getCookie = (name) => {
   if (!name) {
     const hostname = window.location.hostname;
     name = getBaseDomain(hostname);
   }
   let cookieValue = '';
   const cookieName = encodeURIComponent(name);
   /*正则表达式获取cookie*/
   const reStr = '(^| )' + cookieName + '=([^;]*)(;|$)';
   const reg = new RegExp(reStr);
   if (document.cookie) {
     cookieValue = String(document.cookie.match(reg)?.[2]);
   } else {
     return '';
   }
   return cookieValue;
 };

export const getBaseDomain = (domain) => {
   // 匹配顶级域名和二级域名
   const regex = /(?:.*\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})$/;
   const match = domain.match(regex);

   if (match) {
      return match[1]; // 返回基础域名（包含顶级域名和次级域名）
   } else {
      return domain; // 如果没有找到基础域名
   }
};