import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'NGA Alpha',
    description: 'NGA论坛板块页面美化：卡片布局、悬浮导航、亮暗主题切换',
    permissions: ['activeTab', 'storage'],
    web_accessible_resources: [
      {
        resources: ['icon/*.png'],
        matches: ['*://bbs.nga.cn/*', '*://nga.178.com/*', '*://ngabbs.com/*'],
      },
    ],
  },
});
