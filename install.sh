#!/bin/bash
set -e # 遇到错误立即停止

# 定义颜色
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}开始安装 HopeFlow Toolbox 开发环境...${NC}"

# 1. 安装依赖
echo -e "${GREEN}步骤 1/4: 安装 npm 依赖...${NC}"
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "依赖已安装，跳过。"
fi

# 2. 构建项目
echo -e "${GREEN}步骤 2/4: 构建项目...${NC}"
npm run build

# 3. 设置调试模式 (允许加载未签名的扩展)
echo -e "${GREEN}步骤 3/4: 开启调试模式 (CSXS Debug Mode)...${NC}"
# 针对不同版本的 CSXS 开启调试模式，以防万一
defaults write com.adobe.CSXS.9 PlayerDebugMode 1
defaults write com.adobe.CSXS.10 PlayerDebugMode 1
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
defaults write com.adobe.CSXS.12 PlayerDebugMode 1
defaults write com.adobe.CSXS.13 PlayerDebugMode 1
defaults write com.adobe.CSXS.14 PlayerDebugMode 1
defaults write com.adobe.CSXS.15 PlayerDebugMode 1
defaults write com.adobe.CSXS.16 PlayerDebugMode 1

echo "调试模式已开启。"

# 4. 创建软链接
echo -e "${GREEN}步骤 4/4: 部署到 Adobe 扩展目录...${NC}"

EXTENSION_ID="com.hopeflow.toolbox"
DEST_DIR="$HOME/Library/Application Support/Adobe/CEP/extensions/$EXTENSION_ID"
SOURCE_DIR="$(pwd)"

# 确保扩展目录存在
mkdir -p "$HOME/Library/Application Support/Adobe/CEP/extensions"

# 如果目标目录已存在（且是文件夹而非链接），先备份
if [ -d "$DEST_DIR" ] && [ ! -L "$DEST_DIR" ]; then
    echo "检测到现有同名扩展，正在备份..."
    mv "$DEST_DIR" "${DEST_DIR}_backup_$(date +%s)"
fi

# 如果是死链接或已存在链接，删除
if [ -L "$DEST_DIR" ]; then
    rm "$DEST_DIR"
fi

# 创建软链接
ln -s "$SOURCE_DIR" "$DEST_DIR"

echo -e "${BLUE}安装完成！${NC}"
echo -e "请重启 Adobe Illustrator，在 ${GREEN}窗口 > 扩展 > HopeFlow Toolbox${NC} 中找到插件。"
