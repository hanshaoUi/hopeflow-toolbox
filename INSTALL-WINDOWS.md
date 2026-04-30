# HopeFlow Toolbox Windows 安装说明

## 推荐方式：图形安装器

1. 解压发布包。
2. 关闭 Adobe Illustrator。
3. 双击 `HopeFlow-Installer.bat`。
4. 点击 `Install / Update`。
5. 安装完成后重启 Illustrator。
6. 在 Illustrator 中打开 `窗口 > 扩展 > HopeFlow Toolbox`。

这个安装器会自动完成：

- 检查插件包是否完整。
- 写入当前用户的 CEP 调试加载开关。
- 安装或覆盖旧版本插件。
- 备份旧版本到系统临时目录。

## 兼容方式：命令行安装

如果图形安装器无法打开，可以运行：

```bat
install.bat
```

新版 `install.bat` 不再执行 `npm install` 或 `npm run build`，也不再创建 junction 链接。它会直接复制当前发布包到：

```text
%APPDATA%\Adobe\CEP\extensions\com.hopeflow.toolbox
```

## 卸载

打开 `HopeFlow-Installer.bat`，点击 `Uninstall`。

或者手动删除：

```text
%APPDATA%\Adobe\CEP\extensions\com.hopeflow.toolbox
```

## 打包注意

发布包必须包含以下文件或目录：

- `CSXS/manifest.xml`
- `dist/index.html`
- `src/scripts/_runtime/bootstrap.jsx`
- `HopeFlow-Installer.bat`
- `install.bat`
- `tools/windows-installer.ps1`

如果缺少 `dist/index.html`，先在开发机运行：

```bash
npm run build
```

## 生成 Windows 发布包

开发机运行：

```bash
npm run package:windows
```

会生成：

```text
release/HopeFlow-Toolbox-3.1.404-Windows.zip
```
