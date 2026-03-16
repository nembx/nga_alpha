# NGA Alpha

NGA 论坛页面美化浏览器扩展，提供卡片布局、亮暗主题切换、悬浮导航和广告隐藏等功能。

## 功能

- **亮/暗主题切换** - 悬浮按钮一键切换，主题偏好本地持久化
- **悬浮工具栏** - 主题切换 + 回到顶部按钮（滚动超过 400px 自动显示）
- **广告隐藏** - 自动移除广告、页脚等干扰元素
- **帖子操作优化** - 将投票按钮整合到帖子信息栏
- **Popup 控制面板** - 一键启用/禁用插件

## 支持站点

- `bbs.nga.cn`
- `nga.178.com`
- `ngabbs.com`

## 技术栈

- [WXT](https://wxt.dev) - 浏览器扩展开发框架
- React 19 + TypeScript
- Chrome MV3 / Firefox 兼容

## 开发

```bash
# 安装依赖
npm install

# 开发模式（Chrome）
npm run dev

# 开发模式（Firefox）
npm run dev:firefox

# 构建
npm run build

# 打包 zip
npm run zip
```

## 项目结构

```
entrypoints/
  content.ts       # 内容脚本 - 页面美化核心逻辑
  background.ts    # 后台脚本
  popup/           # Popup 控制面板（React）
    App.tsx
    main.tsx
    index.html
public/
  icon/            # 扩展图标（16/32/48/96/128）
```

## 安装使用

1. 运行 `npm run build`
2. 打开 Chrome，进入 `chrome://extensions`
3. 开启「开发者模式」
4. 点击「加载已解压的扩展程序」，选择 `.output/chrome-mv3` 目录
