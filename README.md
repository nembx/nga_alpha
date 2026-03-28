# NGA Alpha

NGA Alpha 是一个面向 NGA 论坛的浏览器扩展，目标是改善版面和帖子页的阅读体验。它在尽量不打断原站使用习惯的前提下，对页面布局、主题、导航和干扰元素做了一层增强。

## 功能亮点

- 卡片化阅读布局，降低原始表格样式带来的视觉噪音
- 顶部导航吸附，滚动时保留常用入口
- 浅色 / 深色主题切换
- 浅色主题多配色方案，支持浅蓝、浅棕、浅灰、浅粉
- 页面右侧悬浮工具栏，支持主题切换和返回顶部
- 自动隐藏广告、页脚和部分无关干扰元素
- 帖子操作区域整理，将投票按钮并入帖子信息区
- Popup 面板可直接启用 / 禁用扩展，并切换浅色主题配色

## 支持站点

- `bbs.nga.cn`
- `nga.178.com`
- `ngabbs.com`

## 技术栈

- [WXT](https://wxt.dev/)
- React 19
- TypeScript
- Chrome MV3
- Firefox 构建支持

## 开发命令

```bash
npm install

# Chrome 开发模式
npm run dev

# Firefox 开发模式
npm run dev:firefox

# Chrome 构建
npm run build

# Firefox 构建
npm run build:firefox

# Chrome 打包 zip
npm run zip

# Firefox 打包 zip
npm run zip:firefox

# TypeScript 类型检查
npm run compile
```

## 本地安装

### Chrome

1. 运行 `npm run build`
2. 打开 `chrome://extensions`
3. 开启“开发者模式”
4. 点击“加载已解压的扩展程序”
5. 选择 `.output/chrome-mv3` 目录

### Firefox

1. 运行 `npm run build:firefox`
2. 打开 `about:debugging#/runtime/this-firefox`
3. 点击“临时载入附加组件”
4. 选择 `.output` 中 Firefox 构建产物目录下的 `manifest.json`