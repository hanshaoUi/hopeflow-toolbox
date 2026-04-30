# Illustrator app.executeMenuCommand Reference

Downloaded for HopeFlow Toolbox local reference.

Sources:
- Original Notion page supplied by project: https://judicious-night-bca.notion.site/app-executeMenuCommand-43b5a4b7a99d4ba2befd1798ba357b1a
- Extracted fallback source, because the Notion page only returned the web app shell to a non-browser fetch: https://divib.cc/docs/Adobe-illustrator/%E8%8F%9C%E5%8D%95%E5%91%BD%E4%BB%A4
- Related Adobe Community thread: https://community.adobe.com/questions-652/executemenucommand-command-list-797322

Generated: 2026-04-30

Notes:
- These command strings are undocumented and vary by Illustrator version, language features, installed plugins, and selection context.
- Prefer adding only verified commands to runtime code. Use this file as a lookup table.
- CSV version: ./illustrator-menu-commands.csv

## File 文件

| Command | English Menu | Chinese Menu |
| --- | --- | --- |
| `new` | New | 新建 |
| `newFromTemplate` | New from Template | 从模板新建 |
| `open` | Open | 打开 |
| `Adobe Bridge Browse` | Browse in Bridge | 在Bridge中浏览 |
| `close` | Close | 关闭 |
| `save` | Save | 保存 |
| `saveas` | Save As | 另存为 |
| `saveacopy` | Save a Copy | 保存副本 |
| `saveastemplate` | Save as Template | 另存为模板 |
| `Adobe AI Save For Web` | Save for Web & Devices | 保存为Web和设备 |
| `Adobe AI Save Selected Slices` | Save Selected Slices | 保存选定的切片 |
| `revert` | Revert | 还原 |
| `AI Place` | Place | 导入 |
| `export` | Export | 导出 |
| `exportSelection` | Export Selection | 导出选择 |
| `exportForScreens` | Export/Export For Screens | 导出/导出屏幕 |
| `ai_browse_for_script` | Scripts>Other Script | 脚本>其他脚本 |
| `document` | Document Setup | 文档设置 |
| `doc-color-cmyk` | Document Color Mode>CMYK Color | 文档颜色模式>CMYK颜色 |
| `doc-color-rgb` | Document Color Mode>RGB Color | 文档颜色模式>RGB颜色 |
| `File Info` | File Info | 文件信息 |
| `Print` | Print | 打印 |
| `quit` | Exit | 退出 |
## Edi 编辑

| Command | English Menu | Chinese Menu |
| --- | --- | --- |
| `undo` | Undo | 撤消 |
| `redo` | Redo | 重做 |
| `cut` | Cut | 剪切 |
| `copy` | Copy | 复制 |
| `paste` | Paste | 粘贴 |
| `pasteFront` | Paste in Front | 粘贴在前面 |
| `pasteBack` | Paste in Back | 粘贴到后面 |
| `pasteInPlace` | Paste in Place | 粘贴到原位 |
| `pasteInAllArtboard` | Paste on All Artboards | 粘贴到所有画板上 |
| `clear` | Clear | 清除 |
| `Find and Replace` | Find & Replace | 查找和替换 |
| `Find Next` | Find Next | 查找下一个 |
| `Check Spelling` | Check Spelling | 检查拼写 |
| `Define Pattern Menu Item` | Define Pattern | 定义图案 |
| `Recolor Art Dialog` | Edit Colors>Recolor Artwork | 编辑颜色>重新着色图稿 |
| `Adjust3` | Edit Colors>Adjust Color Balance | 编辑颜色>调整色彩平衡 |
| `Colors3` | Edit Colors>Blend Front to Back | 编辑颜色>从前到后混合 |
| `Colors4` | Edit Colors>Blend Horizontally | 编辑颜色>水平混合 |
| `Colors5` | Edit Colors>Blend Vertically | 编辑颜色>垂直混合 |
| `Colors8` | Edit Colors>Convert to CMYK | 编辑颜色>转换为CMYK |
| `Colors7` | Edit Colors>Convert to Grayscale | 编辑颜色>转换为灰度 |
| `Colors9` | Edit Colors>Convert to RGB | 编辑颜色>转换为RGB |
| `Colors6` | Edit Colors>Invert Colors | 编辑颜色>反转颜色 |
| `Overprint2` | Edit Colors>Overprint Black | 编辑颜色>叠印黑色 |
| `Saturate3` | Edit Colors>Saturate | 编辑颜色>饱和 |
| `EditOriginal Menu Item` | Edit Original | 编辑原始 |
| `Transparency Presets` | Transparency Flattener Presets | 透明度拼合器预设 |
| `TracingPresets` | Tracing Presets | 描摹预设 |
| `Print Presets` | Print Presets | 打印预设 |
| `PDF Presets` | Adobe PDF Presets | AdobePDF预设 |
| `SWFPresets` | SWF Presets | SWF预设 |
| `PerspectiveGridPresets` | Perspective Grid Presets | 透视网格预设 |
| `color` | Color Settings | 颜色设置 |
| `assignprofile` | Assign Profile | 分配配置文件 |
| `KBSC Menu Item` | Keyboard Shortcuts | 键盘快捷键 |
| `preference` | Preferences>General | 首选项>常规 |
| `selectPref` | Preferences>Selection & Anchor Display | 首选项>选择和锚点显示 |
| `keyboardPref` | Preferences>Type | 首选项>类型 |
| `unitundoPref` | Preferences>Units | 首选项>单位 |
| `guidegridPref` | Preferences>Guides & Grid | 首选项>指南&网格 |
| `snapPref` | Preferences>Smart Guides | 首选项>智能指南 |
| `slicePref` | Preferences>Slices | 首选项>切片 |
| `hyphenPref` | Preferences>Hyphenation | 首选项>连字 |
| `pluginPref` | Preferences>Plug-ins & Scratch Disks | 首选项>插件和暂存盘 |
| `UIPref` | Preferences>User Interface | 首选项>用户界面 |
| `FileClipboardPref` | Preferences>File Handling & Clipboard | 首选项>文件处理和剪贴板 |
| `BlackPref` | Preferences>Appearance of Black | 偏好>黑色的外观 |
## Object 对象

| Command | English Menu | Chinese Menu |
| --- | --- | --- |
| `transformagain` | Transform>Transform Again | 变换>再次变换 |
| `transformmove` | Transform>Move | 变换>移动 |
| `transformrotate` | Transform>Rotate | 变换>旋转 |
| `transformreflect` | Transform>Reflect | 转换>反射 |
| `transformscale` | Transform>Scale | 转换>缩放 |
| `transformshear` | Transform>Shear | 变换>剪切 |
| `Transform v23` | Transform Each | 分别变换 |
| `AI Reset Bounding Box` | Transform>Reset Bounding Box | 变换>重置边界框 |
| `sendToFront` | Arrange>Bring to Front | 排列>置于前面 |
| `sendForward` | Arrange>Bring Forward | 排列>向前 |
| `sendBackward` | Arrange>Send Backward | 排列>向后发送 |
| `sendToBack` | Arrange>Send to Back | 排列>发送到后面 |
| `Selection Hat 2` | Arrange>Send to Current Layer | 排列>发送到当前图层 |
| `group` | Group | 组 |
| `ungroup` | Ungroup | 取消分组 |
| `lock` | Lock>Selection | 锁定>选择 |
| `Selection Hat 5` | Lock>All Artwork Above | 锁定>上面的所有图稿 |
| `Selection Hat 7` | Lock>Other Layers | 锁定>其他图层 |
| `unlockAll` | Unlock All | 全部解锁 |
| `hide` | Hide>Selection | 隐藏>选择 |
| `Selection Hat 4` | Hide>All Artwork Above | 隐藏>上面的所有图稿 |
| `Selection Hat 6` | Hide>Other Layers | 隐藏>其他图层 |
| `showAll` | Show All | 显示全部 |
| `Expand3` | Expand | 扩展 |
| `expandStyle` | Expand Appearance | 扩展外观 |
| `Flatten Transparency` | Flatten Transparency | 合并透明度 |
| `Rasterize 8 menu item` | Rasterize | 栅格化 |
| `make mesh` | Create Gradient Mesh | 创建渐变网格 |
| `AI Object Mosaic Plug-in4` | Create Object Mosaic | 创建对象镶嵌 |
| `TrimMark v25` | Create Trim Marks | 创建修剪标记 |
| `AISlice Make Slice` | Slice>Make | 切片>制作 |
| `AISlice Release Slice` | Slice>Release | 切片>发布 |
| `AISlice Create from Guides` | Slice>Create from Guides | 切片>从参考线创建 |
| `AISlice Create from Selection` | Slice>Create from Selection | 切片>从选择创建 |
| `AISlice Duplicate` | Slice>Duplicate Slice | 切片>重复切片 |
| `AISlice Combine` | Slice>Combine Slices | 切片>组合切片 |
| `AISlice Divide` | Slice>Divide Slices | 切片>分割切片 |
| `AISlice Delete All Slices` | Slice>Delete All | 切片>全部删除 |
| `AISlice Slice Options` | Slice>Slice Options | 切片>切片选项 |
| `AISlice Clip to Artboard` | Slice>Clip to Artboard | 切片>剪辑到画板 |
| `join` | Path>Join | 路径>连接 |
| `average` | Path>Average | 路径>平均 |
| `OffsetPath v22` | Path>Outline Stroke | 路径>轮廓化描边 |
| `OffsetPath v23` | Path>Offset Path | 路径>偏移路径 |
| `simplify menu item` | Path>Simplify | 路径>简化 |
| `Add Anchor Points2` | Path>Add Anchor Points | 路径>添加锚点 |
| `Remove Anchor Points menu` | Path>Remove Anchor Points | 路径>删除锚点 |
| `Knife Tool2` | Path>Divide Objects Below | 路径>划分下面的对象 |
| `Rows and Columns….` | Path>Split Into Grid | 路径>拆分为网格 |
| `cleanup menu item` | Path>Clean Up | 路径>清理 |
| `Path Blend Make` | Blend>Make | 混合>制作 |
| `Path Blend Release` | Blend>Release | 混合>发布 |
| `Path Blend Expand` | Blend>Expand | 混合>展开 |
| `Path Blend Options` | Blend>Blend Options | 混合>混合选项 |
| `Path Blend Replace Spine` | Blend>Replace Spine | 混合>替换书脊 |
| `Path Blend Reverse Spine` | Blend>Reverse Spine | 混合>反向书脊 |
| `Path Blend Reverse Stack` | Blend>Reverse Front to Back | 混合>从前到后反向 |
| `Make Warp` | Envelope Distort>Make with Warp | 信封扭曲>用变形制作 |
| `Create Envelope Grid` | Envelope Distort>Make with Mesh | 信封扭曲>用网格制作 |
| `Make Envelope` | Envelope Distort>Make with Top Object | 信封扭曲>用顶部对象制作 |
| `Release Envelope` | Envelope Distort>Release | 信封扭曲>释放 |
| `Envelope Options` | Envelope Distort>Envelope Options | 信封扭曲>信封选项 |
| `Expand Envelope` | Envelope Distort>Expand | 信封扭曲>展开 |
| `Edit Envelope Contents` | Envelope Distort>Edit Contents | 信封扭曲>编辑内容 |
| `Attach to Active Plane` | Perspective>Attach to Active Plane | 透视>附加到活动平面 |
| `Release with Perspective` | Perspective>Release with Perspective | 透视>使用透视释放 |
| `Show Object Grid Plane` | Perspective>Move Plane to Match Object | 透视>移动平面以匹配对象 |
| `Edit Original Object` | Perspective>Edit Text | 透视>编辑文本 |
| `Make Planet X` | Live Paint>Make | 实时上色>制作 |
| `Marge Planet X` | Live Paint>Merge | 实时上色>合并 |
| `Release Planet X` | Live Paint>Release | 实时上色>发布 |
| `Planet X Options` | Live Paint>Gap Options | 实时上色>间隙选项 |
| `Expand Planet X` | Live Paint>Expand | 实时上色>展开 |
| `Make Text Wrap` | Text Wrap>Make | 文本绕排>制作 |
| `Release Text Wrap` | Text Wrap>Release | 文本绕排>释放 |
| `Text Wrap Options…` | Text Wrap>Text Wrap Options | 文本绕排>文本绕排选项 |
| `makeMask` | Clipping Mask>Make | 剪切蒙版>制作 |
| `releaseMask` | Clipping Mask>Release | 剪切蒙版>释放 |
| `editMask` | Clipping Mask>Edit Contents | 剪切蒙版>编辑内容 |
| `compoundPath` | Compound Path>Make | 复合路径>制作 |
| `noCompoundPath` | Compound Path>Release | 复合路径>释放e |
| `setCropMarks` | Artboards>Convert to Artboards | 画板>转换为画板 |
| `ReArrange Artboards` | Artboards>Rearrange | 画板>重新排列 |
| `Fit Artboard to artwork bounds` | Artboards>Fit to Artwork Bounds | 画板>适合图稿边界 |
| `Fit Artboard to selected Art` | Artboards>Fit to Selected Art | 画板>适合所选图稿 |
| `setGraphStyle` | Graph>Type | 图>类型 |
| `editGraphData` | Graph>Data | 图>数据 |
| `graphDesigns` | Graph>Design | 图>设计 |
| `setBarDesign` | Graph>Column | 图>列 |
| `setIconDesign` | Graph>Marker | 图>标记 |
| `Horizontal Align Left` | Align>Horizontal Align Left | 对齐>水平左对齐 |
| `Horizontal Align Center` | Align>Horizontal Align Center | 对齐>水平居中对齐 |
| `Horizontal Align Right` | Align>Horizontal Align Right | 对齐>水平右对齐 |
| `Vertical Align Top` | Align>Vertical Align Top | 对齐>垂直向上对齐 |
| `Vertical Align Center` | Align>Vertical Align Center | 对齐>垂直对齐中心 |
| `Vertical Align Bottom` | Align>Vertical Align Bottom | 对齐>垂直底部对齐 |
## Type 文字

| Command | English Menu | Chinese Menu |
| --- | --- | --- |
| `alternate glyph palette plugin` | Glyphs | 字形 |
| `area-type-options` | Area Type Options | 区域类型选项 |
| `Rainbow` | Type on a Path>Rainbow | 路径文字>彩虹 |
| `3D ribbon` | Type on a Path>3D Ribbon | 路径文字>3D带状效果 |
| `Skew` | Type on a Path>Skew | 路径文字>倾斜 |
| `Stair Step` | Type on a Path>Stair Step | 路径文字>楼梯台阶 |
| `Gravity` | Type on a Path>Gravity | 路径文字>重力 |
| `typeOnPathOptions` | Type on a Path>Type on a path Options | 路径文字>在路径上键入选项 |
| `updateLegacyTOP` | Type on a Path>Update Legacy Type on a Path | 路径文字>更新路径上的旧类型 |
| `threadTextCreate` | Threaded Text>Create | 串接文本>创建 |
| `releaseThreadedTextSelection` | Threaded Text>Release Selection | 串接文本>发布选择 |
| `removeThreading` | Threaded Text>Remove Threading | 串接文本>删除串接 |
| `Adobe internal composite font plugin` | Composite Fonts | 复合字体 |
| `Adobe Kinsoku Settings` | Kinsoku Shori Settings | 隐尾书店设置 |
| `Adobe MojiKumi Settings` | Mojikumi Settings | 标点挤压设置 |
| `fitHeadline` | Fit Headline | 适合标题 |
| `outline` | Create Outlines | 创建大纲 |
| `Adobe Illustrator Find Font Menu Item` | Find Font | 查找字体 |
| `UpperCase Change Case Item` | Change Case>UPPERCASE | 更改大小写>大写 |
| `LowerCase Change Case Item` | Change Case>lowercase | 更改大小写>小写 |
| `Title Case Change Case Item` | Change Case>Title Case | 更改大小写>标题大小写 |
| `Sentence case Change Case Item` | Change Case>Sentence case | 更改大小写>句子大小写 |
| `Adobe Illustrator Smart Punctuation Menu Item` | Smart Punctuation | 智能标点符号 |
| `Adobe Optical Alignment Item` | Optical Margin Alignment | 视觉边距对齐方式 |
| `showHiddenChar` | Show Hidden Characters | 显示隐藏字符 |
| `type-horizontal` | Type Orientation>Horizontal | 文字方向>水平 |
| `type-vertical` | Type Orientation>Vertical | 文字方向>垂直 |
## Select 选择

| Command | English Menu | Chinese Menu |
| --- | --- | --- |
| `selectall` | All | 选择全部 |
| `selectallinartboard` | All on Active Artboard | 活动画板上的全部 |
| `deselectall` | Deselect | 取消选择 |
| `Find Reselect menu item` | Reselect | 重新选择 |
| `Inverse menu item` | Inverse | 反向 |
| `Selection Hat 8` | Next Object Above | 上面的下一个对象 |
| `Selection Hat 9` | Next Object Below | 下面的下一个对象 |
| `Find Appearance menu item` | Same>Appearance | 相同>外观 |
| `Find Appearance Attributes menu item` | Same>Appearance Attribute | 相同>外观属性 |
| `Find Blending Mode menu item` | Same>Blending Mode | 相同>混合模式 |
| `Find Fill & Stroke menu item` | Same>Fill & Stroke | 相同>填充和描边 |
| `Find Fill Color menu item` | Same>Fill Color | 相同>>填充颜色 |
| `Find Opacity menu item` | Same>Opacity | 相同>不透明度 |
| `Find Stroke Color menu item` | Same>Stroke Color | 相同>描边颜色 |
| `Find Stroke Weight menu item` | Same>Stroke Weight | 相同>描边粗细 |
| `Find Style menu item` | Same>Graphic Style | 相同>图形样式 |
| `Find Symbol Instance menu item` | Same>Symbol Instance | 相同>符号实例 |
| `Find Link Block Series menu item` | Same>Link Block Series | 相同>链接块系列 |
| `Selection Hat 3` | Object>All on Same Layers | 对象>全部在同一图层上 |
| `Selection Hat 1` | Object>Direction Handles | 对象>方向手柄 |
| `Selection Hat 12` | Object>Not Aligned to Pixel Grid | 对象>未与像素网格对齐 |
| `Bristle Brush Strokes menu item` | Object>Bristle Brush Strokes | 对象>刷毛笔触 |
| `Brush Strokes menu item` | Object>Brush Strokes | 对象>画笔描边 |
| `Clipping Masks menu item` | Object>Clipping Masks | 对象>剪切蒙版 |
| `Stray Points menu item` | Object>Stray Points | 对象>杂散点 |
| `Text Objects menu item` | Object>Text Objects | 对象>文本对象 |
| `Dynamic Text` | Object>Flash Dynamic Text | 对象>Flash动态文本 |
| `Input Text` | Object>Flash Input Text | 对象>Flash输入文本 |
| `Selection Hat 10` | Save Selection | 保存选区 |
| `Selection Hat 11` | Edit Selection | 编辑选区 |
## Effec 效果

| Command | English Menu | Chinese Menu |
| --- | --- | --- |
| `Adobe Apply Last Effect` | Apply Last Effect | 应用最后效果 |
| `Adobe Last Effect` | Last Effect | 最后效果 |
| `Live Rasterize Effect Setting` | Document Raster Effects Settings | 文档光栅效果设置 |
| `Live 3DExtrude` | 3D>Extrude & Bevel | 3D>挤压和斜面 |
| `Live 3DRevolve` | 3D>Revolve | 3D>旋转 |
| `Live 3DRotate` | 3D>Rotate | 3D>旋转 |
| `Live Rectangle` | Convert to Shape>Rectangle | 转换为形状>矩形 |
| `Live Rounded Rectangle` | Convert to Shape>Rounded Rectangle | 转换为形状>圆角矩形 |
| `Live Ellipse` | Convert to Shape>Ellipse | 转换为形状>椭圆 |
| `Live Trim Marks` | Crop Marks | 裁剪标记 |
| `Live Free Distort` | Distort & Transform>Free Distort | 扭曲和变换>自由扭曲 |
| `Live Pucker & Bloat` | Distort & Transform>Pucker & Bloat | 扭曲和变换>皱皮和膨胀 |
| `Live Roughen` | Distort & Transform>Roughen | 扭曲和变换>粗糙 |
| `Live Transform` | Distort & Transform>Transform | 扭曲和变换>变换 |
| `Live Scribble and Tweak` | Distort & Transform>Tweak | 扭曲与变换>Tweak |
| `Live Twist` | Distort & Transform>Twist | 扭曲和变换>扭曲 |
| `Live Zig Zag` | Distort & Transform>Zig Zag | 扭曲和变换>之字形 |
| `Live Offset Path` | Path>Offset Path | 路径>偏移路径 |
| `Live Outline Object` | Path>Outline Object | 路径>轮廓对象 |
| `Live Outline Stroke` | Path>Outline Stroke | 路径>轮廓描边 |
| `Live Pathfinder Add` | Pathfinder>Add | 路径查找器>添加 |
| `Live Pathfinder Intersect` | Pathfinder>Intersect | 路径查找器>相交 |
| `Live Pathfinder Exclude` | Pathfinder>Exclude | 路径查找器>排除 |
| `Live Pathfinder Subtract` | Pathfinder>Subtract | 路径查找器>减去 |
| `Live Pathfinder Minus Back` | Pathfinder>Minus Back | 路径查找器>减去返回 |
| `Live Pathfinder Divide` | Pathfinder>Divide | 路径查找器>划分 |
| `Live Pathfinder Trim` | Pathfinder>Trim | 路径查找器>修剪 |
| `Live Pathfinder Merge` | Pathfinder>Merge | 路径查找器>合并 |
| `Live Pathfinder Crop` | Pathfinder>Crop | 路径查找器>裁剪 |
| `Live Pathfinder Outline` | Pathfinder>Outline | 路径查找器>轮廓 |
| `Live Pathfinder Hard Mix` | Pathfinder>Hard Mix | 路径查找器>实时混合 |
| `Live Pathfinder Soft Mix` | Pathfinder>Soft Mix | 路径查找器>透明混合 |
| `Live Pathfinder Trap` | Pathfinder>Trap | 路径查找器>陷阱 |
| `Live Rasterize` | Rasterize | 栅格化 |
| `Live Adobe Drop Shadow` | Stylize>Drop Shadow | 风格化>投影 |
| `Live Feather` | Stylize>Feather | 风格化>羽毛 |
| `Live Inner Glow` | Stylize>Inner Glow | 风格化>内发光 |
| `Live Outer Glow` | Stylize>outer Glow | 风格化>外发光 |
| `Live Adobe Round Corners` | Stylize>Round Corners | 风格化>圆角 |
| `Live Scribble Fill` | Stylize>Scribble | 风格化>涂鸦 |
| `Live SVG Filters` | SVG Filters>Apply SVG Filter | SVG滤镜>应用SVG滤镜 |
| `SVG Filter Import` | SVG Filters>Import SVG Filter | SVG滤镜>导入SVG滤镜 |
| `Live Deform Arc` | Warp>Arc | 翘曲>弧 |
| `Live Deform Arc Lower` | Warp>Arc Lower | 翘曲>弧下 |
| `Live Deform Arc Upper` | Warp>Arc Upper | 翘曲>弧上 |
| `Live Deform Arch` | Warp>Arch | 翘曲>拱形 |
| `Live Deform Bulge` | Warp>Bulge | 翘曲>凸起 |
| `Live Deform Shell Lower` | Warp>Shell Lower | 经线>壳下部 |
| `Live Deform Shell Upper` | Warp>Shell Upper | 翘曲>壳上部 |
| `Live Deform Flag` | Warp>Flag | 翘曲>旗 |
| `Live Deform Wave` | Warp>Wave | 翘曲>波浪 |
| `Live Deform Fish` | Warp>Fish | 翘曲>鱼 |
| `Live Deform Rise` | Warp>Rise | 翘曲>上升 |
| `Live Deform Fisheye` | Warp>Fisheye | 翘曲>鱼眼 |
| `Live Deform Inflate` | Warp>Inflate | 翘曲>膨胀 |
| `Live Deform Squeeze` | Warp>Squeeze | 翘曲>挤压 |
| `Live Deform Twist` | Warp>Twist | 翘曲>扭曲 |
| `Live PSAdapter_plugin_GEfc` | Effect Gallery | 效果库 |
| `Live PSAdapter_plugin_ClrP` | Artistic>Colored Pencil | 艺术>彩色铅笔 |
| `Live PSAdapter_plugin_Ct` | Artistic>Cutout | 艺术>剪切 |
| `Live PSAdapter_plugin_DryB` | Artistic>Dry Brush | 艺术>干刷 |
| `Live PSAdapter_plugin_FlmG` | Artistic>Film Grain | 艺术>电影颗粒 |
| `Live PSAdapter_plugin_Frsc` | Artistic>Fresco | 艺术>壁画 |
| `Live PSAdapter_plugin_NGlw` | Artistic>Neon Glow | 艺术>霓虹灯发光 |
| `Live PSAdapter_plugin_PntD` | Artistic>Paint Daubs | 艺术>油漆涂抹 |
| `Live PSAdapter_plugin_PltK` | Artistic>Palette Knife | 艺术>调色刀 |
| `Live PSAdapter_plugin_PlsW` | Artistic>Plastic Wrap | 艺术>保鲜膜 |
| `Live PSAdapter_plugin_PstE` | Artistic>Poster Edges | 艺术>海报边缘 |
| `Live PSAdapter_plugin_RghP` | Artistic>Rough Pastels | 艺术>粗糙粉彩 |
| `Live PSAdapter_plugin_SmdS` | Artistic>Smudge Stick | 艺术>涂抹棒 |
| `Live PSAdapter_plugin_Spng` | Artistic>Sponge | 艺术>海绵 |
| `Live PSAdapter_plugin_Undr` | Artistic>Underpainting | 艺术>底画 |
| `Live PSAdapter_plugin_Wtrc` | Artistic>Watercolor | 艺术>水彩 |
| `Live PSAdapter_plugin_GblR` | Blur>Gaussian Blur | 模糊>高斯模糊 |
| `Live PSAdapter_plugin_RdlB` | Blur>Radial Blur | 模糊>拉德模糊 |
| `Live PSAdapter_plugin_SmrB` | Blur>Smart Blur | 模糊>智能模糊 |
| `Live PSAdapter_plugin_AccE` | Brush Strokes>Accented Edges | 画笔描边>强调边缘 |
| `Live PSAdapter_plugin_AngS` | Brush Strokes>Angled Strokes | 画笔描边>角度描边 |
| `Live PSAdapter_plugin_Crsh` | Brush Strokes>Crosshatch | 画笔描边>剖面线 |
| `Live PSAdapter_plugin_DrkS` | Brush Strokes>Dark Strokes | 画笔描边>深色描边 |
| `Live PSAdapter_plugin_InkO` | Brush Strokes>Ink Outlines | 画笔描  边>墨迹轮廓 |
| `Live PSAdapter_plugin_Spt` | Brush Strokes>Spatter | 画笔描边>飞溅 |
| `Live PSAdapter_plugin_SprS` | Brush Strokes>Sprayed Strokes | 画笔描边>喷涂描边 |
| `Live PSAdapter_plugin_Smie` | Brush Strokes>Sumi-e | 笔触>Sumi-e |
| `Live PSAdapter_plugin_DfsG` | Distort>Diffuse Glow | 扭曲>漫反射发光 |
| `Live PSAdapter_plugin_Gls` | Distort>Glass | 扭曲>玻璃 |
| `Live PSAdapter_plugin_OcnR` | Distort>Ocean Ripple | 扭曲>海洋波纹 |
| `Live PSAdapter_plugin_ClrH` | Pixelate>Color Halftone | 像素化>彩色半色调 |
| `Live PSAdapter_plugin_Crst` | Pixelate>Crystallize | 像素化>结晶 |
| `Live PSAdapter_plugin_Mztn` | Pixelate>Mezzotint | 像素化>中音 |
| `Live PSAdapter_plugin_Pntl` | Pixelate>Pointillize | 像素化>点画 |
| `Live PSAdapter_plugin_USMk` | Sharpen>Unsharp Mask | 锐化>不锐化蒙版 |
| `Live PSAdapter_plugin_BsRl` | Sketch>Bas Relief | 素描>浅浮雕 |
| `Live PSAdapter_plugin_ChlC` | Sketch>Chalk & Charcoal | 素描>粉笔和木炭 |
| `Live PSAdapter_plugin_Chrc` | Sketch>Charcoal | 素描>木炭 |
| `Live PSAdapter_plugin_Chrm` | Sketch>Chrome | 素描>铬 |
| `Live PSAdapter_plugin_CntC` | Sketch>Cont￩ Crayon | 素描>续←蜡笔 |
| `Live PSAdapter_plugin_GraP` | Sketch>Graphic Pen | 素描>图形笔 |
| `Live PSAdapter_plugin_HlfS` | Sketch>Halftone Pattern | 素描>半色调图案 |
| `Live PSAdapter_plugin_NtPr` | Sketch>Note Paper | 素描>便笺纸 |
| `Live PSAdapter_plugin_Phtc` | Sketch>Photocopy | 素描>复印 |
| `Live PSAdapter_plugin_Plst` | Sketch>Plaster | 素描>石膏 |
| `Live PSAdapter_plugin_Rtcl` | Sketch>Reticulation | 素描>网状 |
| `Live PSAdapter_plugin_Stmp` | Sketch>Stamp | 素描>邮票 |
| `Live PSAdapter_plugin_TrnE` | Sketch>Torn Edges | 素描>撕裂的边缘 |
| `Live PSAdapter_plugin_WtrP` | Sketch>Water Paper | 素描>水纸 |
| `Live PSAdapter_plugin_GlwE` | Stylize>Glowing Edges | 风格化>发光边缘 |
| `Live PSAdapter_plugin_Crql` | Texture>Craquelure | 纹理>Craquelure |
| `Live PSAdapter_plugin_Grn` | Texture>Grain | 纹理>颗粒 |
| `Live PSAdapter_plugin_MscT` | Texture>Mosaic Tiles | 纹理>马赛克瓷砖 |
| `Live PSAdapter_plugin_Ptch` | Texture>Patchwork | 纹理>拼布 |
| `Live PSAdapter_plugin_StnG` | Texture>Stained Glass | 纹理>彩色玻璃 |
| `Live PSAdapter_plugin_Txtz` | Texture>Texturizer | 纹理>纹理器 |
| `Live PSAdapter_plugin_Dntr` | Video>De-Interlace | 视频>去隔行 |
| `Live PSAdapter_plugin_NTSC` | Video>NTSC Colors | 视频>NTSC颜色 |
## View 视图

| Command | English Menu | Chinese Menu |
| --- | --- | --- |
| `preview` | Preview | 预览 |
| `ink` | Overprint Preview | 叠印预览 |
| `raster` | Pixel Preview | 像素预览 |
| `proof-document` | Proof Setup>Document CMYK> | 校样设置>文档CMYK> |
| `proof-mac-rgb` | Proof Setup>Legacy Macintosh RGB (Gamma 1.8) | 校样设置>传统麦金塔RGB(伽玛1.8) |
| `proof-win-rgb` | Proof Setup>Internet Standard RGB (sRGB) | 校样设置>互联网标准RGB(sRGB) |
| `proof-monitor-rgb` | Proof Setup>Monitor RGB | 校样设置>显示器RGB |
| `proof-colorblindp` | Proof Setup>Color blindness – Protanopia-type | 校样设置>色盲–远视型 |
| `proof-colorblindd` | Proof Setup>Color blindness – Deuteranopia-type | 校样设置>色盲–氘视型 |
| `proof-custom` | Proof Setup>Customize | 校样设置>自定义 |
| `proofColors` | Proof Colors | 校样颜色 |
| `zoomin` | Zoom In | 放大 |
| `zoomout` | Zoom Out | 缩小 |
| `fitin` | Fit Artboard in Window | 画板适合窗口大小 |
| `fitall` | Fit All in Window | 全部适合窗口大小 |
| `actualsize` | Actual Size | 实际大小 |
| `edge` | Hide Edges | 隐藏边缘 |
| `artboard` | Hide Artboards | 隐藏画板 |
| `pagetiling` | Hide Print Tiling | 隐藏打印平铺 |
| `AISlice Feedback Menu` | Show Slices | 显示切片 |
| `AISlice Lock Menu` | Lock Slices | 锁定切片 |
| `showtemplate` | Show Template | 显示模板 |
| `ruler` | Rulers>Show Rulers | 标尺>显示标尺 |
| `videoruler` | Rulers>Show Video Rulers | 标尺>显示视频标尺 |
| `rulerCoordinateSystem` | Rulers>Change to Global Rulers | 标尺>更改为全局标尺 |
| `AI Bounding Box Toggle` | Hide Bounding Box | 隐藏边界框 |
| `TransparencyGrid Menu Item` | Show Transparency Grid | 显示透明度网格 |
| `textthreads` | Show Text Threads | 显示文本线程 |
| `Gradient Feedback` | Hide Gradient Annotator | 隐藏渐变注释器 |
| `Show Gaps Planet X` | Show Live Paint Gaps | 显示实时绘画间隙 |
| `showguide` | Guides>Hide Guides | 参考线>隐藏参考线 |
| `lockguide` | Guides>Lock Guides | 参考线>锁定参考线 |
| `makeguide` | Guides>Make Guides | 参考线>建立参考线 |
| `releaseguide` | Guides>Release Guides | 参考线>释放参考线 |
| `clearguide` | Guides>Clear Guides | 参考线>清除参考线 |
| `Snapomatic on-off menu item` | Smart Guides | 智能参考线 |
| `Show Perspective Grid` | Perspective Grid>Show Grid | 透视网格>显示网格 |
| `Show Ruler` | Perspective Grid>Show Rulers | 透视网格>显示标尺 |
| `Snap to Grid` | Perspective Grid>Snap to Grid | 透视网格>对齐网格 |
| `Lock Perspective Grid` | Perspective Grid>Lock Grid | 透视网格>锁定网格 |
| `Lock Station Point` | Perspective Grid>Lock Station Point | 透视网格>锁定站点 |
| `Define Perspective Grid` | Perspective Grid>Define Grid | 透视网格>定义网格 |
| `Save Perspective Grid as Preset` | Perspective Grid>Save Grid as Preset | 透视网格>将网格另存为预设 |
| `showgrid` | Show Grid | 显示网格 |
| `snapgrid` | Snap to Grid | 对齐网格 |
| `snappoint` | Snap to Point | 对齐点 |
| `newview` | New View | 新视图 |
| `editview` | Edit Views | 编辑视图 |
## Window 窗口

| Command | English Menu | Chinese Menu |
| --- | --- | --- |
| `newwindow` | New Window | 新窗口 |
| `cascade` | Arrange>Cascade | 排列>级联 |
| `tile` | Arrange>Tile | 排列>平铺 |
| `floatInWindow` | Arrange>Float in Window | 排列>在窗口中浮动 |
| `floatAllInWindows` | Arrange>Float All in Windows | 排列>在窗口中浮动 |
| `consolidateAllWindows` | Arrange>Consolidate All Windows | 排列>合并所有窗口 |
| `Adobe Save Workspace` | Workspace>Save Workspace | 工作区>保存工作区 |
| `Adobe New Workspace` | Workspace>New Workspace | 工作区>新建工作区 |
| `Adobe Manage Workspace` | Workspace>Manage Workspaces | 工作区>管理工作区 |
| `CSS Menu Item` | CSS Menu | CSS菜单 |
| `AdobeBuiltInToolbox1` | Tools | 工具 |
| `Adobe Action Palette` | Actions | 操作 |
| `AdobeAlignObjects2` | Align | 对齐 |
| `Style Palette` | Appearance | 外观 |
| `Adobe Artboard Palette` | Artboards | 画板 |
| `internal palettes posing as plug-in menus-attributes` | Attributes | 属性 |
| `Adobe BrushManager Menu Item` | Brushes | 画笔 |
| `Adobe Color Palette` | Color | 颜色 |
| `Adobe Harmony Palette` | Color Guide | 颜色指南 |
| `Adobe Illustrator Kuler Panel` | Kuler Panel | 库勒面板 |
| `DocInfo1` | Document Info | 文档信息 |
| `Adobe Flattening Preview` | Flattener Preview | 展平预览 |
| `Adobe Gradient Palette` | Gradient | 渐变 |
| `Adobe Style Palette` | Graphic Styles | 图形样式 |
| `internal palettes posing as plug-in menus-info` | Info | 信息 |
| `AdobeLayerPalette1` | Layers | 图层 |
| `Adobe LinkPalette Menu Item` | Links | 链接 |
| `AI Magic Wand` | Magic Wand | 魔杖 |
| `AdobeNavigator` | Navigator | 导航器 |
| `Adobe PathfinderUI` | Pathfinder | 路径查找器 |
| `Adobe Separation Preview Panel` | Separations Preview | 分色预览 |
| `Adobe Stroke Palette` | Stroke | 笔画 |
| `Adobe SVG Interactivity Palette` | SVG Interactivity | SVG交互性 |
| `Adobe Swatches Menu Item` | Swatches | 色板 |
| `Adobe Symbol Palette` | Symbols | 符号 |
| `AdobeTransformObjects1` | Transform | 转换 |
| `Adobe Transparency Palette Menu Item` | Transparency | 透明度 |
| `Adobe Variables Palette Menu Item` | Variables | 变量 |
| `internal palettes posing as plug-in menus-character` | Character | 字符 |
| `Character Styles` | Character Styles | 字符样式 |
| `alternate glyph palette plugin 2` | Glyphs | glyphs |
| `internal palettes posing as plug-in menus-opentype` | OpenType | OpenType |
| `internal palettes posing as plug-in menus-paragraph` | Paragraph | 段落 |
| `Adobe Paragraph Styles Palette` | Paragraph Styles | 段落样式 |
| `internal palettes posing as plug-in menus-tab` | Tabs | 选项卡 |
| `Adobe Art Style Plugin Other libraries menu item` | Other Library | 其他库 |
| `Adobe Symbol Palette Plugin Other libraries menu item` | Other Library | 其他库 |
## Help 帮助

| Command | English Menu | Chinese Menu |
| --- | --- | --- |
| `helpcontent` | Illustrator Help | 插画师帮助 |
| `about` | About Illustrator | 关于插画师 |
| `System Info` | System Info | 系统信息 |
## Other Panel 其他面板

| Command | English Menu | Chinese Menu |
| --- | --- | --- |
| `Adobe New Symbol Shortcut` | New Symbol | 新符号 |
| `Adobe Color Palette Secondary` | Show Color Panel (Secondary) | 显示颜色面板(次要) |
| `Adobe Actions Batch` | Actions Batch | 动作批处理 |
| `Adobe New Fill Shortcut` | Add New Fill | 添加新填充 |
| `Adobe New Stroke Shortcut` | Add New Stroke | 添加新笔触 |
| `Adobe New Style Shortcut` | New Graphic Style | 新图形样式 |
| `AdobeLayerPalette2` | New Layer | 新建图层 |
| `AdobeLayerPalette3` | New Layer with Dialog | 带对话框的新图层 |
| `Adobe Update Link Shortcut` | Update Link | 更新链接 |
| `AdobeNavigator2` | Navigator Options | 导航器选项 |
| `Adobe New Swatch Shortcut Menu` | New Swatch | 新色板 |
