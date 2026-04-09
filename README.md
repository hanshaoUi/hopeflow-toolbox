# HopeFlow Toolbox

HopeFlow Toolbox is an Adobe Illustrator CEP plugin focused on repetitive production work.

HopeFlow Toolbox 是一款面向重复性生产工作的 Adobe Illustrator CEP 插件。

- 85+ tools across alignment, batch actions, color, text, export, measurement, path and nesting workflows
- 85+ 个工具，覆盖对齐、批量处理、颜色、文本、导出、测量、路径和排料等工作流
- Supports Windows and macOS
- 支持 Windows 和 macOS
- Works with Illustrator CS6 and newer
- 兼容 Adobe Illustrator CS6 及更高版本

## Links / 链接

- Docs: [https://hanshaoui.github.io/hopeflow-docs/](https://hanshaoui.github.io/hopeflow-docs/)
- Docs / 文档站点: [https://hanshaoui.github.io/hopeflow-docs/](https://hanshaoui.github.io/hopeflow-docs/)
- Latest release: [v3.1.2](https://github.com/hanshaoUi/hopeflow-toolbox/releases/tag/v3.1.2)
- Latest release / 最新版本: [v3.1.2](https://github.com/hanshaoUi/hopeflow-toolbox/releases/tag/v3.1.2)
- Download zip: [HopeFlow-Toolbox-v3.1.2.zip](https://github.com/hanshaoUi/hopeflow-toolbox/releases/download/v3.1.2/HopeFlow-Toolbox-v3.1.2.zip)
- Download zip / 下载压缩包: [HopeFlow-Toolbox-v3.1.2.zip](https://github.com/hanshaoUi/hopeflow-toolbox/releases/download/v3.1.2/HopeFlow-Toolbox-v3.1.2.zip)

## Installation / 安装

1. Download the latest release zip / 下载最新发布的压缩包.
2. Extract `HopeFlow-Toolbox-v3.1.2.zip` / 解压 `HopeFlow-Toolbox-v3.1.2.zip`.
3. Run `install.bat` on Windows or `install.sh` on macOS / Windows 运行 `install.bat`，macOS 运行 `install.sh`.
4. Restart Illustrator / 重启 Illustrator.
5. Open `Window > Extensions > HopeFlow Toolbox` / 打开 `Window > Extensions > HopeFlow Toolbox`.

Detailed instructions are in the docs site / 详细说明见文档站点。

- Windows / Windows 安装指南: [Install guide](https://hanshaoui.github.io/hopeflow-docs/guide/install-windows)
- macOS / macOS 安装指南: [Install guide](https://hanshaoui.github.io/hopeflow-docs/guide/install-macos)
- Uninstall / 卸载指南: [Uninstall guide](https://hanshaoui.github.io/hopeflow-docs/guide/uninstall)

## Development / 开发

Requirements / 开发环境要求:

- Node.js 20+
- npm
- Adobe Illustrator with CEP enabled / 启用 CEP 的 Adobe Illustrator

Install dependencies / 安装依赖:

```bash
npm install
```

Run development mode / 运行开发模式:

```bash
npm run dev
```

Create a production build / 创建生产构建:

```bash
npm run build
```

Useful commands / 常用命令:

```bash
npm run lint
npm run typecheck
```

## Repository Layout / 仓库结构

```text
CSXS/          CEP manifest / CEP 清单
build/         Webpack config and packaging scripts / Webpack 配置与打包脚本
dist/          Built panel assets / 构建后的面板资源
src/           Panel source, registry and Illustrator scripts / 面板源码、脚本注册表和 Illustrator 脚本
install.bat    Windows installer helper / Windows 安装辅助脚本
install.sh     macOS installer helper / macOS 安装辅助脚本
```

## License / 许可证

MIT
