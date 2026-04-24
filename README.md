# HopeFlow Toolbox

HopeFlow Toolbox 是一款面向 Adobe Illustrator 生产场景的 CEP 插件，聚焦批量处理、画板管理、导出、测量、排版和重复性操作自动化。

当前稳定版：**v3.1.4**

## v3.1.4 更新内容

### 新增

- 新增 **导出画板尺寸表格** 独立面板：
  - 支持按画板或按尺寸分组。
  - 支持 mm、cm、in、pt、px 单位。
  - 支持 1:X 比例换算。
  - 支持 XLSX 和 CSV 导出。
  - XLSX 支持嵌入画板图示。
  - 支持成品面积、单价、金额列，金额可按公式自动计算。
  - 支持文档目录、桌面和弹窗选择导出目录。
- 新增 Windows 图形安装器：
  - `HopeFlow-Installer.bat` 提供安装、更新和卸载入口。
  - 用户电脑不再需要安装 Node.js 或执行构建命令。
  - 安装时自动写入 CEP 调试加载开关。
- 新增 Windows 发布包命令：`npm run package:windows`。

### 优化

- 画板尺寸表导出前自动保存当前 AI 文档。
- 图示导出改为临时 PNG 并写入 XLSX，避免 HTML 形式交付。
- XLSX 图示按原比例等比缩放，不再拉伸变形。
- 按画板创建矩形时，每次创建独立图层存放结果。
- 优化安装方式，安装脚本改为复制发布包，不再依赖 junction 链接。

### 修复

- 修复 CEP 环境中 ExcelJS `createWriteStream` / `readFile` 不可用导致 XLSX 写入失败的问题。
- 修复部分 Illustrator API 抛出 `PARM` 时导致整个画板尺寸表导出中断的问题。
- 修复当前目标图层不可编辑时“按画板创建矩形”失败的问题。

## 安装

### Windows

1. 下载并解压发布包。
2. 关闭 Illustrator。
3. 双击 `HopeFlow-Installer.bat`。
4. 点击 `Install / Update`。
5. 重启 Illustrator。
6. 在 Illustrator 中打开 `窗口 > 扩展 > HopeFlow Toolbox`。

也可以使用命令行：

```bat
install.bat
```

### macOS

运行：

```bash
./install.sh
```

然后重启 Illustrator。

## 开发

环境要求：

- Node.js 20+
- npm
- Adobe Illustrator with CEP support

常用命令：

```bash
npm install
npm run build
npm run typecheck
npm run package:windows
```

## 项目结构

```text
CSXS/          CEP 清单
build/         构建与发布脚本
dist/          构建产物
src/           面板源码、脚本注册与 Illustrator JSX 脚本
tools/         安装器脚本
install.bat    Windows 命令行安装入口
install.sh     macOS 安装脚本
```

## 文档

- 文档站点：[https://hanshaoui.github.io/hopeflow-docs/](https://hanshaoui.github.io/hopeflow-docs/)
- 仓库：[https://github.com/hanshaoUi/hopeflow-toolbox](https://github.com/hanshaoUi/hopeflow-toolbox)
- Releases：[https://github.com/hanshaoUi/hopeflow-toolbox/releases](https://github.com/hanshaoUi/hopeflow-toolbox/releases)

## License

MIT
