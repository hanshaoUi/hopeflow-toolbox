# HopeFlow Toolbox

HopeFlow Toolbox 是一个面向 Adobe Illustrator 生产场景的 CEP 插件，聚焦重复性高、规则明确、需要批量化处理的工作流。

当前稳定版：**v3.1.3**

## 功能概览

- 覆盖对齐、画板、批量处理、颜色、文字、导出、测量、路径、排料等多个工具分类
- 适用于 Windows 和 macOS
- 兼容 Adobe Illustrator CS6 及以上版本
- 前端面板基于 React + TypeScript，宿主脚本基于 ExtendScript

## v3.1.3 更新内容

- 新增“拼接切割”功能
  - 支持纵切 / 横切
  - 支持按固定单片尺寸切割，搭接包含在单片尺寸内
  - 支持比例换算，适配缩小稿文件
  - 支持末片不足时按实际剩余尺寸生成
  - 支持生成后清理旧画板
  - 支持分片画板命名规则、前后缀、起始编号和尺寸后缀
  - 修复命名输入框在中文输入法下偶发无法正常输入的问题
- 同步增强测量与批量处理相关脚本
  - 面积、路径长度、尺寸标注能力更新
  - 批量缩放与对象编号等脚本同步调整
- 统一同步发布版本号
  - `package.json`、`package-lock.json`、CEP `manifest.xml` 现已统一为 `v3.1.3`

## 安装

1. 下载发布包并解压
2. Windows 运行 `install.bat`
3. macOS 运行 `install.sh`
4. 重启 Illustrator
5. 在 Illustrator 中打开 `窗口 > 扩展 > HopeFlow Toolbox`

文档站点：

- [https://hanshaoui.github.io/hopeflow-docs/](https://hanshaoui.github.io/hopeflow-docs/)

## 开发

环境要求：

- Node.js 20+
- npm
- 已启用 CEP 的 Adobe Illustrator

安装依赖：

```bash
npm install
```

启动开发模式：

```bash
npm run dev
```

构建生产包：

```bash
npm run build
```

常用检查命令：

```bash
npm run lint
npm run typecheck
```

## 项目结构

```text
CSXS/          CEP 清单
build/         Webpack 配置与打包脚本
dist/          构建产物
src/           面板源码、脚本注册与 Illustrator JSX 脚本
install.bat    Windows 安装脚本
install.sh     macOS 安装脚本
```

## 发布信息

- 仓库地址：[https://github.com/hanshaoUi/hopeflow-toolbox](https://github.com/hanshaoUi/hopeflow-toolbox)
- Release 页面：[https://github.com/hanshaoUi/hopeflow-toolbox/releases](https://github.com/hanshaoUi/hopeflow-toolbox/releases)

## License

MIT
