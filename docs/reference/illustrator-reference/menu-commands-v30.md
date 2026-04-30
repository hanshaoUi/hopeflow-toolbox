# Illustrator menuCommandString Reference (Notion v30)

Source: https://judicious-night-bca.notion.site/Illustrator-Reference-bb586c9667764361b2ed3aa312049d35

Last update: 2025-12-29. Target version: 30.0.0. Rows: 680.

Use this as a lookup table only; commands are undocumented and can vary by Illustrator version, installed plugins, locale, and active selection.

| Index | menuCommandString | English menu | Japanese menu | ExtendScript snippet | Min | Max |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | new | File > New… | ファイル > 新規... | app.executeMenuCommand('new'); | 16 | 99 |
| 2 | newFromTemplate | File > New from Template… | ファイル > テンプレートから新規... | app.executeMenuCommand('newFromTemplate'); | 16 | 99 |
| 3 | open | File > Open… | ファイル > 開く... | app.executeMenuCommand('open'); | 16 | 99 |
| 4 | Adobe Bridge Browse | File > Browse in Bridge… | ファイル > Bridge で参照... | app.executeMenuCommand('Adobe Bridge Browse'); | 16 | 99 |
| 5 | close | File > Close | ファイル > 閉じる | app.executeMenuCommand('close'); | 16 | 99 |
| 6 | closeAll | File > Close All | ファイル > すべてを閉じる | app.executeMenuCommand('closeAll') | 29.4 | 99.0 |
| 7 | save | File > Save | ファイル > 保存 | app.executeMenuCommand('save'); | 16 | 99 |
| 8 | saveas | File > Save As… | ファイル > 別名で保存... | app.executeMenuCommand('saveas'); | 16 | 99 |
| 9 | saveacopy | File > Save a Copy… | ファイル > 複製を保存... | app.executeMenuCommand('saveacopy'); | 16 | 99 |
| 10 | saveastemplate | File > Save as Template… | ファイル > テンプレートとして保存... | app.executeMenuCommand('saveastemplate'); | 16 | 99 |
| 11 | Adobe AI Save For Web | File > Save for Web… | ファイル > 書き出し > Web 用に保存 (従来)... | app.executeMenuCommand('Adobe AI Save For Web'); | 16 | 19.9 |
| 12 | Adobe AI Save Selected Slices | File > Save Selected Slices… | ファイル > 選択したスライスを保存... | app.executeMenuCommand('Adobe AI Save Selected Slices'); | 16 | 99 |
| 13 | revert | File > Revert | ファイル > 復帰 | app.executeMenuCommand('revert'); | 16 | 99 |
| 14 | Search Adobe Stock | File > Search Adobe Stock… | ファイル > Adobe Stock を検索... | app.executeMenuCommand('Search Adobe Stock'); | 19 | 99 |
| 15 | AI Place | File > Place… | ファイル > 配置... | app.executeMenuCommand('AI Place'); | 16 | 99 |
| 16 | export | File > Export… | ファイル > 書き出し... | app.executeMenuCommand('export'); | 16 | 19.9 |
| 17 | Generate Modal File Menu | File > Generate Vectors (Beta) | ファイル > 生成ベクター (Beta) | app.executeMenuCommand('Generate Modal File Menu '); | 28.6 | 29.4 |
| 18 | Generate Modal File Menu | File > Generate Vectors | ファイル > ベクターを生成 | app.executeMenuCommand('Generate Modal File Menu '); | 29.5 | 29.8 |
| 19 | Invite People | File > Invite to Edit… | ファイル > 編集に招待... | app.executeMenuCommand('Invite People'); | 27.0 | 99.0 |
| 20 | Share For Review | File > Share For Review (Beta)… | ファイル > レビュー用に共有 (ベータ版)... | app.executeMenuCommand('Share For Review'); | 27.0 | 27.3 |
| 21 | Share For Review | File > Share for Review... | ファイル > レビュー用に共有... | app.executeMenuCommand('Share For Review'); | 27.4 | 99.0 |
| 22 | exportForScreens | File > Export > Export for Screens… | ファイル > 書き出し > スクリーン用に書き出し... | app.executeMenuCommand('exportForScreens'); | 20 | 99 |
| 23 | export | File > Export > Export As... | ファイル > 書き出し > 書き出し形式... | app.executeMenuCommand('export'); | 20.0 | 99.0 |
| 24 | Adobe AI Save For Web | File > Export > Save for Web (Legacy)... | ファイル > 書き出し > Web 用に保存 (従来)... | app.executeMenuCommand('Adobe AI Save For Web'); | 20 | 99.0 |
| 25 | exportSelection | File > Export Selection… | ファイル > 選択範囲を書き出し... | app.executeMenuCommand('exportSelection'); | 20 | 99 |
| 26 | Package Menu Item | File > Package… | ファイル > パッケージ... | app.executeMenuCommand('Package Menu Item'); | 16 | 99 |
| 27 | ai_browse_for_script | File > Scripts > Other Script… | ファイル > スクリプト > その他のスクリプト... | app.executeMenuCommand('ai_browse_for_script'); | 16 | 99 |
| 28 | document | File > Document Setup… | ファイル > ドキュメント設定... | app.executeMenuCommand('document'); | 16 | 99 |
| 29 | doc-color-cmyk | File > Document Color Mode > CMYK Color | ファイル > ドキュメントのカラーモード > CMYK カラー | app.executeMenuCommand('doc-color-cmyk'); | 16 | 99 |
| 30 | doc-color-rgb | File > Document Color Mode > RGB Color | ファイル > ドキュメントのカラーモード > RGB カラー | app.executeMenuCommand('doc-color-rgb'); | 16 | 99 |
| 31 | File Info | File > File Info… | ファイル > ファイル情報... | app.executeMenuCommand('File Info'); | 16 | 99 |
| 32 | Print | File > Print… | ファイル > プリント... | app.executeMenuCommand('Print'); | 16 | 99 |
| 33 | quit | File > Exit | ファイル > 終了 | app.executeMenuCommand('quit'); | 16 | 99 |
| 34 | quit | Illustrator > Exit | Illustrator > Illustrator を終了 | app.executeMenuCommand('quit'); | 16 | 99 |
| 35 | undo | Edit > Undo | 編集 > 取り消し | app.executeMenuCommand('undo'); | 16 | 99 |
| 36 | redo | Edit > Redo | 編集 > やり直し | app.executeMenuCommand('redo'); | 16 | 99 |
| 37 | cut | Edit > Cut | 編集 > カット | app.executeMenuCommand('cut'); | 16 | 99 |
| 38 | copy | Edit > Copy | 編集 > コピー | app.executeMenuCommand('copy'); | 16 | 99 |
| 39 | paste | Edit > Paste | 編集 > ペースト | app.executeMenuCommand('paste'); | 16 | 99 |
| 40 | pasteFront | Edit > Paste in Front | 編集 > 前面へペースト | app.executeMenuCommand('pasteFront'); | 16 | 99 |
| 41 | pasteBack | Edit > Paste in Back | 編集 > 背面へペースト | app.executeMenuCommand('pasteBack'); | 16 | 99 |
| 42 | pasteInPlace | Edit > Paste in Place | 編集 > 同じ位置にペースト | app.executeMenuCommand('pasteInPlace'); | 16 | 99 |
| 43 | pasteInAllArtboard | Edit > Paste on All Artboards | 編集 > すべてのアートボードにペースト | app.executeMenuCommand('pasteInAllArtboard'); | 16 | 99 |
| 44 | pasteWithoutFormatting | Edit > Paste without Formatting | 編集 > 書式なしでペースト | app.executeMenuCommand('pasteWithoutFormatting'); | 25.3 | 99 |
| 45 | clear | Edit > Clear | 編集 > 消去 | app.executeMenuCommand('clear'); | 16 | 99 |
| 46 | Find and Replace | Edit > Find and Replace… | 編集 > 検索と置換... | app.executeMenuCommand('Find and Replace'); | 16 | 99 |
| 47 | Find Next | Edit > Find Next | 編集 > 次を検索 | app.executeMenuCommand('Find Next'); | 16 | 99 |
| 48 | Check Spelling | Edit > Check Spelling… | 編集 > スペルチェック | app.executeMenuCommand('Check Spelling'); | 16 | 24.9 |
| 49 | Auto Spell Check | Edit > Spelling > Auto Spellcheck | 編集 > スペルチェック > 自動スペルチェック | app.executeMenuCommand('Auto Spell Check'); | 24.0 | 99.0 |
| 50 | Check Spelling | Edit > Spelling > Check Spelling… | 編集 > スペルチェック > スペルチェック... | app.executeMenuCommand('Check Spelling'); | 24.0 | 99.0 |
| 51 | Edit Custom Dictionary... | Edit > Edit Custom Dictionary… | 編集 > カスタム辞書を編集... | app.executeMenuCommand('Edit Custom Dictionary...'); | 16 | 99 |
| 52 | Recolor Art Dialog | Edit > Edit Colors > Recolor Artwork… | 編集 > カラーを編集 > オブジェクトを再配色... | app.executeMenuCommand('Recolor Art Dialog'); | 16 | 99 |
| 53 | Generative Recolor Art Dialog | Edit > Edit Colors > Generative Recolor | 編集 > カラーを編集 > 生成再配色 | app.executeMenuCommand('Generative Recolor Art Dialog'); | 27.6 | 99.0 |
| 54 | Adjust3 | Edit > Edit Colors > Adjust Color Balance… | 編集 > カラーを編集 > カラーバランス調整... | app.executeMenuCommand('Adjust3'); | 16 | 99 |
| 55 | Colors3 | Edit > Edit Colors > Blend Front to Back | 編集 > カラーを編集 > 前後にブレンド | app.executeMenuCommand('Colors3'); | 16 | 99 |
| 56 | Colors4 | Edit > Edit Colors > Blend Horizontally | 編集 > カラーを編集 > 左右にブレンド | app.executeMenuCommand('Colors4'); | 16 | 99 |
| 57 | Colors5 | Edit > Edit Colors > Blend Vertically | 編集 > カラーを編集 > 上下にブレンド | app.executeMenuCommand('Colors5'); | 16 | 99 |
| 58 | Colors8 | Edit > Edit Colors > Convert to CMYK | 編集 > カラーを編集 > CMYK に変換 | app.executeMenuCommand('Colors8'); | 16 | 99 |
| 59 | Colors7 | Edit > Edit Colors > Convert to Grayscale | 編集 > カラーを編集 > グレースケールに変換 | app.executeMenuCommand('Colors7'); | 16 | 99 |
| 60 | Colors9 | Edit > Edit Colors > Convert to RGB | 編集 > カラーを編集 > RGB に変換 | app.executeMenuCommand('Colors9'); | 16 | 99 |
| 61 | Colors6 | Edit > Edit Colors > Invert Colors | 編集 > カラーを編集 > カラー反転 | app.executeMenuCommand('Colors6'); | 16 | 99 |
| 62 | Overprint2 | Edit > Edit Colors > Overprint Black… | 編集 > カラーを編集 > オーバープリントブラック... | app.executeMenuCommand('Overprint2'); | 16 | 99 |
| 63 | Saturate3 | Edit > Edit Colors > Saturate… | 編集 > カラーを編集 > 彩度調整... | app.executeMenuCommand('Saturate3'); | 16 | 99 |
| 64 | EditOriginal Menu Item | Edit > Edit Original | 編集 > オリジナルを編集 | app.executeMenuCommand('EditOriginal Menu Item'); | 16 | 99 |
| 65 | Transparency Presets | Edit > Transparency Flattener Presets… | 編集 > 透明の分割・統合プリセット... | app.executeMenuCommand('Transparency Presets'); | 16 | 99 |
| 66 | Print Presets | Edit > Print Presets… | 編集 > プリントプリセット... | app.executeMenuCommand('Print Presets'); | 16 | 99 |
| 67 | PDF Presets | Edit > Adobe PDF Presets… | 編集 > Adobe PDF プリセット... | app.executeMenuCommand('PDF Presets'); | 16 | 99 |
| 68 | SWFPresets | Edit > SWF Presets… | 編集 > SWF プリセット... | app.executeMenuCommand('SWFPresets'); | 16 | 25.9 |
| 69 | PerspectiveGridPresets | Edit > Perspective Grid Presets… | 編集 > 遠近グリッドプリセット... | app.executeMenuCommand('PerspectiveGridPresets'); | 16 | 99 |
| 70 | color | Edit > Color Settings… | 編集 > カラー設定... | app.executeMenuCommand('color'); | 16 | 99 |
| 71 | assignprofile | Edit > Assign Profile… | 編集 > プロファイルの指定... | app.executeMenuCommand('assignprofile'); | 16 | 99 |
| 72 | KBSC Menu Item | Edit > Keyboard Shortcuts… | 編集 > キーボードショートカット... | app.executeMenuCommand('KBSC Menu Item'); | 16 | 99 |
| 73 | preference | Edit > Preferences > General… | 編集 > 環境設定 > 一般... | app.executeMenuCommand('preference'); | 16 | 99 |
| 74 | selectPref | Edit > Preferences > Selection & Anchor Display… | 編集 > 環境設定 > 選択範囲・アンカー表示... | app.executeMenuCommand('selectPref'); | 16 | 99 |
| 75 | keyboardPref | Edit > Preferences > Type… | 編集 > 環境設定 > テキスト... | app.executeMenuCommand('keyboardPref'); | 16 | 99 |
| 76 | unitundoPref | Edit > Preferences > Units… | 編集 > 環境設定 > 単位... | app.executeMenuCommand('unitundoPref'); | 16 | 99 |
| 77 | guidegridPref | Edit > Preferences > Guides & Grid… | 編集 > 環境設定 > ガイド・グリッド... | app.executeMenuCommand('guidegridPref'); | 16 | 99 |
| 78 | snapPref | Edit > Preferences > Smart Guides… | 編集 > 環境設定 > スマートガイド... | app.executeMenuCommand('snapPref'); | 16 | 99 |
| 79 | slicePref | Edit > Preferences > Slices… | 編集 > 環境設定 > スライス... | app.executeMenuCommand('slicePref'); | 16 | 99 |
| 80 | hyphenPref | Edit > Preferences > Hyphenation… | 編集 > 環境設定 > ハイフネーション... | app.executeMenuCommand('hyphenPref'); | 16 | 99 |
| 81 | pluginPref | Edit > Preferences > Plug-ins & Scratch Disks… | 編集 > 環境設定 > プラグイン・仮想記憶ディスク... | app.executeMenuCommand('pluginPref'); | 16 | 99 |
| 82 | UIPref | Edit > Preferences > User Interface… | 編集 > 環境設定 > ユーザーインターフェイス... | app.executeMenuCommand('UIPref'); | 16 | 99 |
| 83 | GPUPerformancePref | Edit > Preferences > Performance… | 編集 > 環境設定 > パフォーマンス... | app.executeMenuCommand('GPUPerformancePref'); | 19 | 99 |
| 84 | FileClipboardPref | Edit > Preferences > File Handling & Clipboard… | 編集 > 環境設定 > ファイル管理・クリップボード... | app.executeMenuCommand('FileClipboardPref'); | 16 | 24.9 |
| 85 | FilePref | Edit > Preferences > File Handling… | 編集 > 環境設定 > ファイル管理... | app.executeMenuCommand('FilePref'); | 25 | 99.0 |
| 86 | ClipboardPref | Edit > Preferences > Clipboard Handling… | 編集 > 環境設定 > クリップボードの処理... | app.executeMenuCommand('ClipboardPref'); | 25.0 | 99.0 |
| 87 | BlackPref | Edit > Preferences > Appearance of Black… | 編集 > 環境設定 > ブラックのアピアランス... | app.executeMenuCommand('BlackPref'); | 16 | 99 |
| 88 | TouchPref | Edit > Preferences > Touch Workspace | 編集 > 環境設定 > タッチワークスペース | app.executeMenuCommand('TouchPref'); | 18.1 | 99.0 |
| 89 | DevicesPref | Edit > Preferences > Devices… | 編集 > 環境設定 > デバイス... | app.executeMenuCommand('DevicesPref'); | 24.0 | 99.0 |
| 90 | preference | Illustrator > Preferences > General… | Illustrator > 環境設定 > 一般... | app.executeMenuCommand('preference'); | 16 | 99 |
| 91 | selectPref | Illustrator > Preferences > Selection & Anchor Display… | Illustrator > 環境設定 > 選択範囲・アンカー表示... | app.executeMenuCommand('selectPref'); | 16 | 99 |
| 92 | keyboardPref | Illustrator > Preferences > Type… | Illustrator > 環境設定 > テキスト... | app.executeMenuCommand('keyboardPref'); | 16 | 99 |
| 93 | unitundoPref | Illustrator > Preferences > Units… | Illustrator > 環境設定 > 単位... | app.executeMenuCommand('unitundoPref'); | 16 | 99 |
| 94 | guidegridPref | Illustrator > Preferences > Guides & Grid… | Illustrator > 環境設定 > ガイド・グリッド... | app.executeMenuCommand('guidegridPref'); | 16 | 99 |
| 95 | snapPref | Illustrator > Preferences > Smart Guides… | Illustrator > 環境設定 > スマートガイド... | app.executeMenuCommand('snapPref'); | 16 | 99 |
| 96 | slicePref | Illustrator > Preferences > Slices… | Illustrator > 環境設定 > スライス... | app.executeMenuCommand('slicePref'); | 16 | 99 |
| 97 | hyphenPref | Illustrator > Preferences > Hyphenation… | Illustrator > 環境設定 > ハイフネーション... | app.executeMenuCommand('hyphenPref'); | 16 | 99 |
| 98 | pluginPref | Illustrator > Preferences > Plug-ins & Scratch Disks… | Illustrator > 環境設定 > プラグイン・仮想記憶ディスク... | app.executeMenuCommand('pluginPref'); | 16 | 99 |
| 99 | UIPref | Illustrator > Preferences > User Interface… | Illustrator > 環境設定 > ユーザーインターフェイス... | app.executeMenuCommand('UIPref'); | 16 | 99 |
| 100 | GPUPerformancePref | Illustrator > Preferences > Performance… | Illustrator > 環境設定 > パフォーマンス... | app.executeMenuCommand('GPUPerformancePref'); | 19 | 99 |
| 101 | FileClipboardPref | Illustrator > Preferences > File Handling & Clipboard… | Illustrator > 環境設定 > ファイル管理・クリップボード... | app.executeMenuCommand('FileClipboardPref'); | 16 | 24.9 |
| 102 | FilePref | Illustrator > Preferences > File Handling… | Illustrator > 環境設定 > ファイル管理... | app.executeMenuCommand('FilePref'); | 25 | 99.0 |
| 103 | ClipboardPref | Illustrator > Preferences > Clipboard Handling… | Illustrator > 環境設定 > クリップボードの処理... | app.executeMenuCommand('ClipboardPref'); | 25.0 | 99.0 |
| 104 | BlackPref | Illustrator > Preferences > Appearance of Black… | Illustrator > 環境設定 > ブラックのアピアランス... | app.executeMenuCommand('BlackPref'); | 16 | 99 |
| 105 | DevicesPref | Illustrator > Preferences > Devices… | Illustrator > 環境設定 > デバイス... | app.executeMenuCommand('DevicesPref'); | 24.0 | 99.0 |
| 106 | transformagain | Object > Transform > Transform Again | オブジェクト > 変形 > 変形の繰り返し | app.executeMenuCommand('transformagain'); | 16 | 99 |
| 107 | transformmove | Object > Transform > Move… | オブジェクト > 変形 > 移動... | app.executeMenuCommand('transformmove'); | 16 | 99 |
| 108 | transformrotate | Object > Transform > Rotate… | オブジェクト > 変形 > 回転... | app.executeMenuCommand('transformrotate'); | 16 | 99 |
| 109 | transformreflect | Object > Transform > Reflect… | オブジェクト > 変形 > リフレクト... | app.executeMenuCommand('transformreflect'); | 16 | 99 |
| 110 | transformscale | Object > Transform > Scale… | オブジェクト > 変形 > 拡大・縮小... | app.executeMenuCommand('transformscale'); | 16 | 99 |
| 111 | transformshear | Object > Transform > Shear… | オブジェクト > 変形 > シアー... | app.executeMenuCommand('transformshear'); | 16 | 99 |
| 112 | Transform v23 | Object > Transform > Transform Each… | オブジェクト > 変形 > 個別に変形... | app.executeMenuCommand('Transform v23'); | 16 | 99 |
| 113 | AI Reset Bounding Box | Object > Transform > Reset Bounding Box | オブジェクト > 変形 > バウンディングボックスのリセット | app.executeMenuCommand('AI Reset Bounding Box'); | 16 | 99 |
| 114 | sendToFront | Object > Arrange > Bring to Front | オブジェクト > 重ね順 > 最前面へ | app.executeMenuCommand('sendToFront'); | 16 | 99 |
| 115 | sendForward | Object > Arrange > Bring Forward | オブジェクト > 重ね順 > 前面へ | app.executeMenuCommand('sendForward'); | 16 | 99 |
| 116 | sendBackward | Object > Arrange > Send Backward | オブジェクト > 重ね順 > 背面へ | app.executeMenuCommand('sendBackward'); | 16 | 99 |
| 117 | sendToBack | Object > Arrange > Send to Back | オブジェクト > 重ね順 > 最背面へ | app.executeMenuCommand('sendToBack'); | 16 | 99 |
| 118 | Selection Hat 2 | Object > Arrange > Send to Current Layer | オブジェクト > 重ね順 > 選択しているレイヤーに移動 | app.executeMenuCommand('Selection Hat 2'); | 16 | 99 |
| 119 | Horizontal Align Left | Object > Align > Horizontal Align Left | オブジェクト > 整列 > 水平方向左に整列 | app.executeMenuCommand('Horizontal Align Left'); | 24 | 99 |
| 120 | Horizontal Align Center | Object > Align > Horizontal Align Center | オブジェクト > 整列 > 水平方向中央に整列 | app.executeMenuCommand('Horizontal Align Center'); | 24 | 99 |
| 121 | Horizontal Align Right | Object > Align > Horizontal Align Right | オブジェクト > 整列 > 水平方向右に整列 | app.executeMenuCommand('Horizontal Align Right'); | 24 | 99 |
| 122 | Vertical Align Top | Object > Align > Vertical Align Top | オブジェクト > 整列 > 垂直方向上に整列 | app.executeMenuCommand('Vertical Align Top'); | 24 | 99 |
| 123 | Vertical Align Center | Object > Align > Vertical Align Center | オブジェクト > 整列 > 垂直方向中央に整列 | app.executeMenuCommand('Vertical Align Center'); | 24 | 99 |
| 124 | Vertical Align Bottom | Object > Align > Vertical Align Bottom | オブジェクト > 整列 > 垂直方向下に整列 | app.executeMenuCommand('Vertical Align Bottom'); | 24 | 99 |
| 125 | Vertical Distribute Top | Object > Distribute > Vertical Distribute Top | オブジェクト > 分布 > 垂直方向上に分布 | app.executeMenuCommand('Vertical Distribute Top'); | 27.0 | 99.0 |
| 126 | Vertical Distribute Center | Object > Distribute > Vertical Distribute Center | オブジェクト > 分布 > 垂直方向中央に分布 | app.executeMenuCommand('Vertical Distribute Center'); | 27.0 | 99.0 |
| 127 | Vertical Distribute Bottom | Object > Distribute > Vertical Distribute Bottom | オブジェクト > 分布 > 垂直方向下に分布 | app.executeMenuCommand('Vertical Distribute Bottom'); | 27.0 | 99.0 |
| 128 | Horizontal Distribute Left | Object > Distribute > Horizontal Distribute Left | オブジェクト > 分布 > 水平方向左に分布 | app.executeMenuCommand('Horizontal Distribute Left'); | 27.0 | 99.0 |
| 129 | Horizontal Distribute Center | Object > Distribute > Horizontal Distribute Center | オブジェクト > 分布 > 水平方向中央に分布 | app.executeMenuCommand('Horizontal Distribute Center'); | 27.0 | 99.0 |
| 130 | Horizontal Distribute Right | Object > Distribute > Horizontal Distribute Right | オブジェクト > 分布 > 水平方向右に分布 | app.executeMenuCommand('Horizontal Distribute Right'); | 27.0 | 99.0 |
| 131 | group | Object > Group | オブジェクト > グループ | app.executeMenuCommand('group'); | 16 | 99 |
| 132 | ungroup | Object > Ungroup | オブジェクト > グループ解除 | app.executeMenuCommand('ungroup'); | 16 | 99 |
| 133 | ungroup all | Object > Ungroup All | オブジェクト > すべてグループ解除 | app.executeMenuCommand('ungroup all'); | 29.2 | 99.0 |
| 134 | lock | Object > Lock > Selection | オブジェクト > ロック > 選択 | app.executeMenuCommand('lock'); | 16 | 99 |
| 135 | Selection Hat 5 | Object > Lock > All Artwork Above | オブジェクト > ロック > 前面のすべてのアートワーク | app.executeMenuCommand('Selection Hat 5'); | 16 | 99 |
| 136 | Selection Hat 7 | Object > Lock > Other Layers | オブジェクト > ロック > その他のレイヤー | app.executeMenuCommand('Selection Hat 7'); | 16 | 99 |
| 137 | unlockAll | Object > Unlock All | オブジェクト > すべてをロック解除 | app.executeMenuCommand('unlockAll'); | 16 | 99 |
| 138 | hide | Object > Hide > Selection | オブジェクト > 隠す > 選択 | app.executeMenuCommand('hide'); | 16 | 99 |
| 139 | Selection Hat 4 | Object > Hide > All Artwork Above | オブジェクト > 隠す > 前面のすべてのアートワーク | app.executeMenuCommand('Selection Hat 4'); | 16 | 99 |
| 140 | Selection Hat 6 | Object > Hide > Other Layers | オブジェクト > 隠す > その他のレイヤー | app.executeMenuCommand('Selection Hat 6'); | 16 | 99 |
| 141 | showAll | Object > Show All | オブジェクト > すべてを表示 | app.executeMenuCommand('showAll'); | 16 | 99 |
| 142 | Expand3 | Object > Expand… | オブジェクト > 分割・拡張... | app.executeMenuCommand('Expand3'); | 16 | 99 |
| 143 | expandStyle | Object > Expand Appearance | オブジェクト > アピアランスを分割 | app.executeMenuCommand('expandStyle'); | 16 | 99 |
| 144 | Crop Image | Object > Crop Image | オブジェクト > 画像の切り抜き | app.executeMenuCommand('Crop Image'); | 23 | 99 |
| 145 | Rasterize 8 menu item | Object > Rasterize… | オブジェクト > ラスタライズ... | app.executeMenuCommand('Rasterize 8 menu item'); | 16 | 99 |
| 146 | make mesh | Object > Create Gradient Mesh… | オブジェクト > グラデーションメッシュを作成... | app.executeMenuCommand('make mesh'); | 16 | 99 |
| 147 | AI Object Mosaic Plug-in4 | Object > Create Object Mosaic… | オブジェクト > モザイクオブジェクトを作成... | app.executeMenuCommand('AI Object Mosaic Plug-in4'); | 16 | 99 |
| 148 | TrimMark v25 | Object > Create Trim Marks | オブジェクト > トリムマークを作成 | app.executeMenuCommand('TrimMark v25'); | 16 | 99 |
| 149 | Flatten Transparency | Object > Flatten Transparency… | オブジェクト > 透明部分を分割・統合... | app.executeMenuCommand('Flatten Transparency'); | 16 | 99 |
| 150 | Make Pixel Perfect | Object > Make Pixel Perfect | オブジェクト > ピクセルグリッドに最適化 | app.executeMenuCommand('Make Pixel Perfect'); | 16 | 99 |
| 151 | GenAIConsolidatedGenerateVectors | Object > Generative > Generate Vectors... | オブジェクト > 生成 > ベクターを生成... | app.executeMenuCommand('GenAIConsolidatedGenerateVectors'); | 30.0 | 99.0 |
| 152 | GenAIConsolidatedShapeFill | Object > Generative > Gen Shape Fill... | オブジェクト > 生成 > 生成塗りつぶし (シェイプ)... | app.executeMenuCommand('GenAIConsolidatedShapeFill'); | 30.0 | 99.0 |
| 153 | GenAIConsolidatedTurntable | Object > Generative > Turntable | オブジェクト > 生成 > ターンテーブル | app.executeMenuCommand('GenAIConsolidatedTurntable'); | 30.3 | 99.0 |
| 154 | Gen Expand Object Make | Object > Generative > Generative Expand > Make | オブジェクト > 生成 > 生成拡張 > 作成 | app.executeMenuCommand('Gen Expand Object Make'); | 30.0 | 99.0 |
| 155 | Gen Expand Object Combine | Object > Generative > Generative Expand > Combine | オブジェクト > 生成 > 生成拡張 > ��合 | app.executeMenuCommand('Gen Expand Object Combine'); | 30.0 | 99.0 |
| 156 | GenAIConsolidatedBleed | Object > Generative > Print Bleed | オブジェクト > 生成 > 裁ち落としを印刷 | app.executeMenuCommand('GenAIConsolidatedBleed'); | 30.0 | 99.0 |
| 157 | GenAIConsolidatedRecolor | Object > Generative > Generative Recolor | オブジェクト > 生成 > 生成再配色 | app.executeMenuCommand('GenAIConsolidatedRecolor'); | 30.0 | 99.0 |
| 158 | GenAIConsolidatedPatterns | Object > Generative > Generate Patterns | オブジェクト > 生成 > パターンを生成 | app.executeMenuCommand('GenAIConsolidatedPatterns'); | 30.0 | 99.0 |
| 159 | GenAIConsolidatedVariations | Object > Generative > Generation History | オブジェクト > 生成 > 生成履歴 | app.executeMenuCommand('GenAIConsolidatedVariations'); | 30.0 | 99.0 |
| 160 | AISlice Make Slice | Object > Slice > Make | オブジェクト > スライス > 作成 | app.executeMenuCommand('AISlice Make Slice'); | 16 | 99 |
| 161 | AISlice Release Slice | Object > Slice > Release | オブジェクト > スライス > 解除 | app.executeMenuCommand('AISlice Release Slice'); | 16 | 99 |
| 162 | AISlice Create from Guides | Object > Slice > Create from Guides | オブジェクト > スライス > ガイドから作成 | app.executeMenuCommand('AISlice Create from Guides'); | 16 | 99 |
| 163 | AISlice Create from Selection | Object > Slice > Create from Selection | オブジェクト > スライス > 選択範囲から作成 | app.executeMenuCommand('AISlice Create from Selection'); | 16 | 99 |
| 164 | AISlice Duplicate | Object > Slice > Duplicate Slice | オブジェクト > スライス > スライスを複製 | app.executeMenuCommand('AISlice Duplicate'); | 16 | 99 |
| 165 | AISlice Combine | Object > Slice > Combine Slices | オブジェクト > スライス > スライスを結合 | app.executeMenuCommand('AISlice Combine'); | 16 | 99 |
| 166 | AISlice Divide | Object > Slice > Divide Slices… | オブジェクト > スライス > スライスを分割... | app.executeMenuCommand('AISlice Divide'); | 16 | 99 |
| 167 | AISlice Delete All Slices | Object > Slice > Delete All | オブジェクト > スライス > すべてを削除 | app.executeMenuCommand('AISlice Delete All Slices'); | 16 | 99 |
| 168 | AISlice Slice Options | Object > Slice > Slice Options… | オブジェクト > スライス > スライスオプション... | app.executeMenuCommand('AISlice Slice Options'); | 16 | 99 |
| 169 | AISlice Clip to Artboard | Object > Slice > Clip to Artboard | オブジェクト > スライス > アートボードサイズでクリップ | app.executeMenuCommand('AISlice Clip to Artboard'); | 16 | 99 |
| 170 | Generate Modal File Menu | Object > Generate Vectors (Beta) | オブジェクト > 生成ベクター (Beta) | app.executeMenuCommand('Generate Modal File Menu '); | 28.6 | 29.4 |
| 171 | Generate Modal File Menu | Object > Generate Vectors | オブジェクト > ベクターを生成 | app.executeMenuCommand('Generate Modal File Menu '); | 29.5 | 29.8 |
| 172 | join | Object > Path > Join | オブジェクト > パス > 連結 | app.executeMenuCommand('join'); | 16 | 99 |
| 173 | average | Object > Path > Average… | オブジェクト > パス > 平均... | app.executeMenuCommand('average'); | 16 | 99 |
| 174 | OffsetPath v22 | Object > Path > Outline Stroke | オブジェクト > パス > パスのアウトライン | app.executeMenuCommand('OffsetPath v22'); | 16 | 99 |
| 175 | OffsetPath v23 | Object > Path > Offset Path… | オブジェクト > パス > パスのオフセット... | app.executeMenuCommand('OffsetPath v23'); | 16 | 99 |
| 176 | Reverse Path Direction | Object > Path > Reverse Path Direction | オブジェクト > パス > パスの方向反転 | app.executeMenuCommand('Reverse Path Direction'); | 21 | 99 |
| 177 | simplify menu item | Object > Path > Simplify… | オブジェクト > パス > 単純化... | app.executeMenuCommand('simplify menu item'); | 16 | 99 |
| 178 | smooth menu item | Object > Path > Smooth… | オブジェクト > パス > スムーズ... | app.executeMenuCommand('smooth menu item'); | 28.0 | 99.0 |
| 179 | Add Anchor Points2 | Object > Path > Add Anchor Points | オブジェクト > パス > アンカーポイントの追加 | app.executeMenuCommand('Add Anchor Points2'); | 16 | 99 |
| 180 | Remove Anchor Points menu | Object > Path > Remove Anchor Points | オブジェクト > パス > アンカーポイントを削除 | app.executeMenuCommand('Remove Anchor Points menu'); | 16 | 99 |
| 181 | Knife Tool2 | Object > Path > Divide Objects Below | オブジェクト > パス > 背面のオブジェクトを分割 | app.executeMenuCommand('Knife Tool2'); | 16 | 99 |
| 182 | Rows and Columns.... | Object > Path > Split Into Grid… | オブジェクト > パス > グリッドに分割... | app.executeMenuCommand('Rows and Columns....'); | 16 | 99 |
| 183 | cleanup menu item | Object > Path > Clean Up… | オブジェクト > パス > パスの削除... | app.executeMenuCommand('cleanup menu item'); | 16 | 99 |
| 184 | Convert to Shape | Object > Shape > Convert to Shapes | オブジェクト > シェイプ > シェイプに変換 | app.executeMenuCommand('Convert to Shape'); | 18 | 99 |
| 185 | Expand Shape | Object > Shape > Expand Shapes | オブジェクト > シェイプ > シェイプを拡張 | app.executeMenuCommand('Expand Shape'); | 18 | 99 |
| 186 | Shape Fill Object Menu | Object > Gen Shape Fill (Beta) | オブジェクト > 生成塗りつぶし (シェイプ) (Beta) | app.executeMenuCommand('Shape Fill Object Menu'); | 28.6 | 29.4 |
| 187 | Shape Fill Object Menu | Object > Gen Shape Fill | オブジェクト > 生成塗りつぶし (シェイプ) | app.executeMenuCommand('Shape Fill Object Menu'); | 29.5 | 29.8 |
| 188 | Gen Expand Object Make | Object > Generative Expand... > Make... | オブジェクト > 生成拡張... > 作成... | app.executeMenuCommand('Gen Expand Object Make'); | 29.6 | 29.8 |
| 189 | Gen Expand Object Combine | Object > Generative Expand... > Combine | オブジェクト > 生成拡張... > 結合 | app.executeMenuCommand('Gen Expand Object Combine'); | 29.6 | 29.8 |
| 190 | Gen Bleed Object Menu | Object > Print Bleed... | オブジェクト > 裁ち落としを印刷... | app.executeMenuCommand('Gen Bleed Object Menu'); | 29.6 | 29.8 |
| 191 | Adobe Make Pattern | Object > Pattern > Make | オブジェクト > パターン > 作成 | app.executeMenuCommand('Adobe Make Pattern'); | 16 | 99 |
| 192 | Adobe Edit Pattern | Object > Pattern > Edit Pattern | オブジェクト > パターン > パターンを編集 | app.executeMenuCommand('Adobe Edit Pattern'); | 16 | 99 |
| 193 | Adobe Pattern Tile Color | Object > Pattern > Tile Edge Color… | オブジェクト > パターン > タイルの境界線カラー... | app.executeMenuCommand('Adobe Pattern Tile Color'); | 16 | 99 |
| 194 | Text To Pattern | Object > Pattern > Text to Pattern (Beta) | オブジェクト > パターン > テキストからパターン生成 (Beta) | app.executeMenuCommand('Text To Pattern'); | 28.0 | 28.5 |
| 195 | Adobe Generative Patterns Panel | Object > Pattern > Generate Patterns (Beta) | オブジェクト > パターン > 生成パターン (Beta) | app.executeMenuCommand('Adobe Generative Patterns Panel'); | 28.6 | 29.4 |
| 196 | Adobe Generative Patterns Panel | Object > Pattern > Generate Patterns | オブジェクト > パターン > パターンを生成 | app.executeMenuCommand('Adobe Generative Patterns Panel'); | 29.5 | 29.8 |
| 197 | Partial Rearrange Make | Object > Intertwine > Make | オブジェクト > クロスと重なり > 作成 | app.executeMenuCommand('Partial Rearrange Make'); | 27.0 | 99.0 |
| 198 | Partial Rearrange Release | Object > Intertwine > Release | オブジェクト > クロスと重なり > 解除 | app.executeMenuCommand('Partial Rearrange Release'); | 27.0 | 99.0 |
| 199 | Partial Rearrange Edit | Object > Intertwine > Edit | オブジェクト > クロスと重なり > 編集 | app.executeMenuCommand('Partial Rearrange Edit'); | 27.0 | 99.0 |
| 200 | Make Radial Repeat | Object > Repeat > Make Radial | オブジェクト > リピート > ラジアル | app.executeMenuCommand('Make Radial Repeat'); | 25.1 | 99 |
| 201 | Make Grid Repeat | Object > Repeat > Make Grid | オブジェクト > リピート > グリッド | app.executeMenuCommand('Make Grid Repeat'); | 25.1 | 99 |
| 202 | Make Symmetry Repeat | Object > Repeat > Make Symmetry | オブジェクト > リピート > ミラー | app.executeMenuCommand('Make Symmetry Repeat'); | 25.1 | 99 |
| 203 | Release Repeat Art | Object > Repeat > Release | オブジェクト > リピート > 解除 | app.executeMenuCommand('Release Repeat Art'); | 25.1 | 99 |
| 204 | Repeat Art Options | Object > Repeat > Options… | オブジェクト > リピート > オプション... | app.executeMenuCommand('Repeat Art Options'); | 25.1 | 99 |
| 205 | Attach Objects on Path | Object > Objects on Path > Attach… | オブジェクト > パス上オブジェクト > スナップ… | app.executeMenuCommand('Attach Objects on Path'); | 29.0 | 29.1 |
| 206 | Attach Objects on Path | Object > Objects on Path > Attach... | オブジェクト > パス上オブジェクト > アタッチ... | app.executeMenuCommand('Attach Objects on Path'); | 29.2 | 99.0 |
| 207 | Options Objects on Path | Object > Objects on Path > Options… | オブジェクト > パス上オブジェクト > オプション… | app.executeMenuCommand('Options Objects on Path'); | 29.0 | 99.0 |
| 208 | Expand Objects on Path | Object > Objects on Path > Expand | オブジェクト > パス上オブジェクト > 拡張 | app.executeMenuCommand('Expand Objects on Path'); | 29.0 | 99.0 |
| 209 | Path Blend Make | Object > Blend > Make | オブジェクト > ブレンド > 作成 | app.executeMenuCommand('Path Blend Make'); | 16 | 99 |
| 210 | Path Blend Release | Object > Blend > Release | オブジェクト > ブレンド > 解除 | app.executeMenuCommand('Path Blend Release'); | 16 | 99 |
| 211 | Path Blend Expand | Object > Blend > Expand | オブジェクト > ブレンド > 拡張 | app.executeMenuCommand('Path Blend Expand'); | 16 | 99 |
| 212 | Path Blend Options | Object > Blend > Blend Options… | オブジェクト > ブレンド > ブレンドオプション... | app.executeMenuCommand('Path Blend Options'); | 16 | 99 |
| 213 | Path Blend Replace Spine | Object > Blend > Replace Spine | オブジェクト > ブレンド > ブレンド軸を置き換え | app.executeMenuCommand('Path Blend Replace Spine'); | 16 | 99 |
| 214 | Path Blend Reverse Spine | Object > Blend > Reverse Spine | オブジェクト > ブレンド > ブレンド軸を反転 | app.executeMenuCommand('Path Blend Reverse Spine'); | 16 | 99 |
| 215 | Path Blend Reverse Stack | Object > Blend > Reverse Front to Back | オブジェクト > ブレンド > 前後を反転 | app.executeMenuCommand('Path Blend Reverse Stack'); | 16 | 99 |
| 216 | Make Warp | Object > Envelope Distort > Make with Warp… | オブジェクト > エンベロープ > ワープで作成... | app.executeMenuCommand('Make Warp'); | 16 | 99 |
| 217 | Create Envelope Grid | Object > Envelope Distort > Make with Mesh… | オブジェクト > エンベロープ > メッシュで作成... | app.executeMenuCommand('Create Envelope Grid'); | 16 | 99 |
| 218 | Make Envelope | Object > Envelope Distort > Make with Top Object | オブジェクト > エンベロープ > 最前面のオブジェクトで作成 | app.executeMenuCommand('Make Envelope'); | 16 | 99 |
| 219 | Release Envelope | Object > Envelope Distort > Release | オブジェクト > エンベロープ > 解除 | app.executeMenuCommand('Release Envelope'); | 16 | 99 |
| 220 | Envelope Options | Object > Envelope Distort > Envelope Options… | オブジェクト > エンベロープ > エンベロープオプション... | app.executeMenuCommand('Envelope Options'); | 16 | 99 |
| 221 | Expand Envelope | Object > Envelope Distort > Expand | オブジェクト > エンベロープ > 拡張 | app.executeMenuCommand('Expand Envelope'); | 16 | 99 |
| 222 | Edit Envelope Contents | Object > Envelope Distort > Edit Contents | オブジェクト > エンベロープ > オブジェクトを編集 | app.executeMenuCommand('Edit Envelope Contents'); | 16 | 99 |
| 223 | Attach to Active Plane | Object > Perspective > Attach to Active Plane | オブジェクト > 遠近 > 選択面の図形にする | app.executeMenuCommand('Attach to Active Plane'); | 16 | 99 |
| 224 | Release with Perspective | Object > Perspective > Release with Perspective | オブジェクト > 遠近 > 遠近グリッド上から解除 | app.executeMenuCommand('Release with Perspective'); | 16 | 99 |
| 225 | Show Object Grid Plane | Object > Perspective > Move Plane to Match Object | オブジェクト > 遠近 > オブジェクトに合わせて面を移動 | app.executeMenuCommand('Show Object Grid Plane'); | 16 | 99 |
| 226 | Edit Original Object | Object > Perspective > Edit Text | オブジェクト > 遠近 > テキストを編集 | app.executeMenuCommand('Edit Original Object'); | 16 | 99 |
| 227 | Make Planet X | Object > Live Paint > Make | オブジェクト > ライブペイント > 作成 | app.executeMenuCommand('Make Planet X'); | 16 | 99 |
| 228 | Marge Planet X | Object > Live Paint > Merge | オブジェクト > ライブペイント > 結合 | app.executeMenuCommand('Marge Planet X'); | 16 | 99 |
| 229 | Release Planet X | Object > Live Paint > Release | オブジェクト > ライブペイント > 解除 | app.executeMenuCommand('Release Planet X'); | 16 | 99 |
| 230 | Planet X Options | Object > Live Paint > Gap Options… | オブジェクト > ライブペイント > 隙間オプション... | app.executeMenuCommand('Planet X Options'); | 16 | 99 |
| 231 | Expand Planet X | Object > Live Paint > Expand | オブジェクト > ライブペイント > 拡張 | app.executeMenuCommand('Expand Planet X'); | 16 | 99 |
| 232 | Make Vector Edge | Object > Mockup (Beta) > Make | オブジェクト > モックアップ (Beta) > 作成 | app.executeMenuCommand('Make Vector Edge'); | 28.0 | 28.5 |
| 233 | Make Vector Edge | Object > Mockup (Beta) > Preview Mockup | オブジェクト > モックアップ (Beta) > モックアップをプレビュー | app.executeMenuCommand('Make Vector Edge'); | 28.6 | 28.9 |
| 234 | Make Vector Edge | Object > Mockup > Preview Mockup | オブジェクト > モックアップ > モックアップをプレビュー | app.executeMenuCommand('Make Vector Edge'); | 29.0 | 99.0 |
| 235 | Release Vector Edge | Object > Mockup (Beta) > Release | オブジェクト > モックアップ (Beta) > 解除 | app.executeMenuCommand('Release Vector Edge'); | 28.0 | 28.9 |
| 236 | Release Vector Edge | Object > Mockup > Release | オブジェクト > モックアップ > 解除 | app.executeMenuCommand('Release Vector Edge'); | 29.0 | 99.0 |
| 237 | Edit Vector Edge | Object > Mockup (Beta) > Edit | オブジェクト > モックアップ (Beta) > 編集 | app.executeMenuCommand('Edit Vector Edge'); | 28.0 | 28.9 |
| 238 | Edit Vector Edge | Object > Mockup > Edit | オブジェクト > モックアップ > 編集 | app.executeMenuCommand('Edit Vector Edge'); | 29.0 | 99.0 |
| 239 | Make Image Tracing | Object > Image Trace > Make | オブジェクト > 画像トレース > 作成 | app.executeMenuCommand('Make Image Tracing'); | 16 | 99 |
| 240 | Make and Expand Image Tracing | Object > Image Trace > Make and Expand | オブジェクト > 画像トレース > 作成して拡張 | app.executeMenuCommand('Make and Expand Image Tracing'); | 16 | 99 |
| 241 | Release Image Tracing | Object > Image Trace > Release | オブジェクト > 画像トレース > 解除 | app.executeMenuCommand('Release Image Tracing'); | 16 | 99 |
| 242 | Expand Image Tracing | Object > Image Trace > Expand | オブジェクト > 画像トレース > 拡張 | app.executeMenuCommand('Expand Image Tracing'); | 16 | 99 |
| 243 | Make Text Wrap | Object > Text Wrap > Make | オブジェクト > テキストの回り込み > 作成 | app.executeMenuCommand('Make Text Wrap'); | 16 | 99 |
| 244 | Release Text Wrap | Object > Text Wrap > Release | オブジェクト > テキストの回り込み > 解除 | app.executeMenuCommand('Release Text Wrap'); | 16 | 99 |
| 245 | Text Wrap Options... | Object > Text Wrap > Text Wrap Options… | オブジェクト > テキストの回り込み > テキストの回り込みオプション... | app.executeMenuCommand('Text Wrap Options...'); | 16 | 99 |
| 246 | makeMask | Object > Clipping Mask > Make | オブジェクト > クリッピングマスク > 作成 | app.executeMenuCommand('makeMask'); | 16 | 99 |
| 247 | releaseMask | Object > Clipping Mask > Release | オブジェクト > クリッピングマスク > 解除 | app.executeMenuCommand('releaseMask'); | 16 | 99 |
| 248 | editMask | Object > Clipping Mask > Edit Contents | オブジェクト > クリッピングマスク > マスクを編集 | app.executeMenuCommand('editMask'); | 16 | 99 |
| 249 | compoundPath | Object > Compound Path > Make | オブジェクト > 複合パス > 作成 | app.executeMenuCommand('compoundPath'); | 16 | 99 |
| 250 | noCompoundPath | Object > Compound Path > Release | オブジェクト > 複合パス > 解除 | app.executeMenuCommand('noCompoundPath'); | 16 | 99 |
| 251 | setCropMarks | Object > Artboards > Convert to Artboards | オブジェクト > アートボード > アートボードに変換 | app.executeMenuCommand('setCropMarks'); | 16 | 99 |
| 252 | ReArrange Artboards | Object > Artboards > Rearrange | オブジェクト > アートボード > すべてのアートボードを再配置 | app.executeMenuCommand('ReArrange Artboards'); | 16 | 29.5 |
| 253 | ReArrange Artboards | Object > Artboards > Rearrange Artboards | オブジェクト > アートボード > アートボードを再配置 | app.executeMenuCommand('ReArrange Artboards'); | 29.6 | 99.0 |
| 254 | Fit Artboard to artwork bounds | Object > Artboards > Fit to Artwork Bounds | オブジェクト > アートボード > オブジェクト全体に合わせる | app.executeMenuCommand('Fit Artboard to artwork bounds'); | 16 | 99 |
| 255 | Switch Orientation | Object > Artboards > Switch Orientation | オブジェクト > アートボード > 方向切り替え | app.executeMenuCommand('Switch Orientation'); | 30.0 | 99.0 |
| 256 | Fit Artboard to selected Art | Object > Artboards > Fit to Selected Art | オブジェクト > アートボード > 選択オブジェクトに合わせる | app.executeMenuCommand('Fit Artboard to selected Art'); | 16 | 99 |
| 257 | setGraphStyle | Object > Graph > Type… | オブジェクト > グラフ > 設定... | app.executeMenuCommand('setGraphStyle'); | 16 | 99 |
| 258 | editGraphData | Object > Graph > Data… | オブジェクト > グラフ > データ... | app.executeMenuCommand('editGraphData'); | 16 | 99 |
| 259 | graphDesigns | Object > Graph > Design… | オブジェクト > グラフ > デザイン... | app.executeMenuCommand('graphDesigns'); | 16 | 99 |
| 260 | setBarDesign | Object > Graph > Column… | オブジェクト > グラフ > 棒グラフ... | app.executeMenuCommand('setBarDesign'); | 16 | 99 |
| 261 | setIconDesign | Object > Graph > Marker… | オブジェクト > グラフ > マーカー... | app.executeMenuCommand('setIconDesign'); | 16 | 99 |
| 262 | Browse Typekit Fonts Menu IllustratorUI | Type > More from Adobe Fonts… | 書式 > Adobe Fonts のその他のフォント... | app.executeMenuCommand('Browse Typekit Fonts Menu IllustratorUI'); | 17.1 | 99 |
| 263 | alternate glyph palette plugin | Type > Glyphs | 書式 > 字形 | app.executeMenuCommand('alternate glyph palette plugin'); | 16 | 99 |
| 264 | point-area | Type > Type Conversion \| Convert To Area Type \| Convert To Point Type | 書式 > 文字の種類を切り換え \| エリア内文字に切り換え \| ポイント文字に切り換え | app.executeMenuCommand('point-area'); | 29.4 | 29.4 |
| 265 | point-area | Type > Text Type Conversion \| Convert To Area Type \| Convert To Point Type | 書式 > 文字の種類を切り換え \| エリア内文字に切り換え \| ポイント文字に切り換え | app.executeMenuCommand('point-area'); | 29.5 | 29.5 |
| 266 | point-area | Type > Text Type Conversion \| Convert To Area Type \| Convert To Point Type | 書式 > 文字を切り換え \| エリア内文字に切り換え \| ポイント文字に切り換え | app.executeMenuCommand('point-area'); | 29.6 | 99.0 |
| 267 | area-type-options | Type > Area Type Options… | 書式 > エリア内文字オプション... | app.executeMenuCommand('area-type-options'); | 16 | 99 |
| 268 | Rainbow | Type > Type on a Path > Rainbow | 書式 > パス上文字オプション > 虹 | app.executeMenuCommand('Rainbow'); | 16 | 99 |
| 269 | Skew | Type > Type on a Path > Skew | 書式 > パス上文字オプション > 歪み | app.executeMenuCommand('Skew'); | 16 | 99 |
| 270 | 3D ribbon | Type > Type on a Path > 3D Ribbon | 書式 > パス上文字オプション > 3D リボン | app.executeMenuCommand('3D ribbon'); | 16 | 99 |
| 271 | Stair Step | Type > Type on a Path > Stair Step | 書式 > パス上文字オプション > 階段状 | app.executeMenuCommand('Stair Step'); | 16 | 99 |
| 272 | Gravity | Type > Type on a Path > Gravity | 書式 > パス上文字オプション > 引力 | app.executeMenuCommand('Gravity'); | 16 | 99 |
| 273 | typeOnPathOptions | Type > Type on a Path > Type on a Path Options... | 書式 > パス上文字オプション > パス上文字オプション... | app.executeMenuCommand('typeOnPathOptions'); | 16 | 99 |
| 274 | updateLegacyTOP | Type > Type on a Path > Update Legacy Type on a Path | 書式 > パス上文字オプション > パス上文字を更新 | app.executeMenuCommand('updateLegacyTOP'); | 16 | 99 |
| 275 | Adobe internal composite font plugin | Type > Composite Fonts… | 書式 > 合成フォント... | app.executeMenuCommand('Adobe internal composite font plugin'); | 16 | 99 |
| 276 | Adobe Kinsoku Settings | Type > Kinsoku Shori Settings… | 書式 > 禁則処理設定... | app.executeMenuCommand('Adobe Kinsoku Settings'); | 16 | 99 |
| 277 | Adobe MojiKumi Settings | Type > Mojikumi Settings… | 書式 > 文字組みアキ量設定... | app.executeMenuCommand('Adobe MojiKumi Settings'); | 16 | 99 |
| 278 | threadTextCreate | Type > Threaded Text > Create | 書式 > スレッドテキストオプション > 作成 | app.executeMenuCommand('threadTextCreate'); | 16 | 99 |
| 279 | releaseThreadedTextSelection | Type > Threaded Text > Release Selection | 書式 > スレッドテキストオプション > 選択部分をスレッドから除外 | app.executeMenuCommand('releaseThreadedTextSelection'); | 16 | 99 |
| 280 | removeThreading | Type > Threaded Text > Remove Threading | 書式 > スレッドテキストオプ���ョン > スレッドのリンクを解除 | app.executeMenuCommand('removeThreading'); | 16 | 99 |
| 281 | fitHeadline | Type > Fit Headline | 書式 > ヘッドラインを合わせる | app.executeMenuCommand('fitHeadline'); | 16 | 99 |
| 282 | outline | Type > Create Outlines | 書式 > アウトラインを作成 | app.executeMenuCommand('outline'); | 16 | 99 |
| 283 | Adobe Illustrator Find Font Menu Item | Type > Find Font… | 書式 > フォント検索... | app.executeMenuCommand('Adobe Illustrator Find Font Menu Item'); | 16 | 25.9 |
| 284 | Adobe Illustrator Find Font Menu Item | Type > Find/Replace Font... | 書式 > フォントの検索と置換... | app.executeMenuCommand('Adobe Illustrator Find Font Menu Item'); | 26 | 99.0 |
| 285 | Adobe IllustratorUI Resolve Missing Font | Type > Resolve Missing Fonts… | 書式 > 環境に無いフォントを解決する... | app.executeMenuCommand('Adobe IllustratorUI Resolve Missing Font'); | 16 | 99 |
| 286 | UpperCase Change Case Item | Type > Change Case > UPPERCASE | 書式 > 大文字と小文字の変更 > すべて大文字 | app.executeMenuCommand('UpperCase Change Case Item'); | 16 | 99 |
| 287 | LowerCase Change Case Item | Type > Change Case > lowercase | 書式 > 大文字と小文字の変更 > すべて小文字 | app.executeMenuCommand('LowerCase Change Case Item'); | 16 | 99 |
| 288 | Title Case Change Case Item | Type > Change Case > Title Case | 書式 > 大文字と小文字の変更 > 単語の先頭のみ大文字 | app.executeMenuCommand('Title Case Change Case Item'); | 16 | 99 |
| 289 | Sentence case Change Case Item | Type > Change Case > Sentence case | 書式 > 大文字と小文字の変更 > 文頭のみ大文字 | app.executeMenuCommand('Sentence case Change Case Item'); | 16 | 99 |
| 290 | Adobe Illustrator Smart Punctuation Menu Item | Type > Smart Punctuation… | 書式 > 句読点の自動調節... | app.executeMenuCommand('Adobe Illustrator Smart Punctuation Menu Item'); | 16 | 99 |
| 291 | Adobe Optical Alignment Item | Type > Optical Margin Alignment | 書式 > 最適なマージン揃え | app.executeMenuCommand('Adobe Optical Alignment Item'); | 16 | 99 |
| 292 | convert list style to text | Type > Bullets and Numbering > Convert to text | 書式 > 箇条書き > テキストに変換 | app.executeMenuCommand('convert list style to text'); | 27.1 | 99 |
| 293 | ~bullet | Type > Insert Special Character > Symbols > Bullet | 書式 > 特殊文字を挿入 > 記号 > ビュレット | app.executeMenuCommand('~bullet'); | 29.4 | 99.0 |
| 294 | ~copyright | Type > Insert Special Character > Symbols > Copyright Symbol | 書式 > 特殊文字を挿入 > 記号 > 著作権記号 | app.executeMenuCommand('~copyright'); | 29.4 | 99.0 |
| 295 | ~ellipsis | Type > Insert Special Character > Symbols > Ellipsis | 書式 > 特殊文字を挿入 > 記号 > 省略記号 | app.executeMenuCommand('~ellipsis'); | 29.4 | 99.0 |
| 296 | ~paragraphSymbol | Type > Insert Special Character > Symbols > Paragraph Symbol | 書式 > 特殊文字を挿入 > 記号 > 段落記号 | app.executeMenuCommand('~paragraphSymbol'); | 29.4 | 99.0 |
| 297 | ~registeredTrademark | Type > Insert Special Character > Symbols > Registered Trademark Symbol | 書式 > 特殊文字を挿入 > 記号 > 登録商標記号 | app.executeMenuCommand('~registeredTrademark'); | 29.4 | 99.0 |
| 298 | ~sectionSymbol | Type > Insert Special Character > Symbols > Section Symbol | 書式 > 特殊文字を挿入 > 記号 > セクション記号 | app.executeMenuCommand('~sectionSymbol'); | 29.4 | 99.0 |
| 299 | ~trademarkSymbol | Type > Insert Special Character > Symbols > Trademark Symbol | 書式 > 特殊文字を挿入 > 記号 > 商標記号 | app.executeMenuCommand('~trademarkSymbol'); | 29.4 | 99.0 |
| 300 | ~emDash | Type > Insert Special Character > Hyphens And Dashes > Em Dash | 書式 > 特殊文字を挿入 > ハイフンおよびダッシュ > EM ダッシュ | app.executeMenuCommand('~emDash'); | 29.4 | 99.0 |
| 301 | ~enDash | Type > Insert Special Character > Hyphens And Dashes > En Dash | 書式 > 特殊文字を挿入 > ハイフンおよびダッシュ > EN ダッシュ | app.executeMenuCommand('~enDash'); | 29.4 | 99.0 |
| 302 | ~discretionaryHyphen | Type > Insert Special Character > Hyphens And Dashes > Discretionary Hyphen | 書式 > 特殊文字を挿入 > ハイフンおよびダッシュ > 任意ハイフン | app.executeMenuCommand('~discretionaryHyphen'); | 29.4 | 99.0 |
| 303 | ~doubleLeftQuote | Type > Insert Special Character > Quotation Marks > Double Left Quotation Marks | 書式 > 特殊文字を挿入 > 引用符 > 左二重引用符 | app.executeMenuCommand('~doubleLeftQuote'); | 29.4 | 99.0 |
| 304 | ~doubleRightQuote | Type > Insert Special Character > Quotation Marks > Double Right Quotation Marks | 書式 > 特殊文字を挿入 > 引用符 > 右二重引用符 | app.executeMenuCommand('~doubleRightQuote'); | 29.4 | 99.0 |
| 305 | ~singleLeftQuote | Type > Insert Special Character > Quotation Marks > Single Left Quotation Marks | 書式 > 特殊文字を挿入 > 引用符 > 左一重引用符 | app.executeMenuCommand('~singleLeftQuote'); | 29.4 | 99.0 |
| 306 | ~singleRightQuote | Type > Insert Special Character > Quotation Marks > Single Right Quotation Marks | 書式 > 特殊文字を挿入 > 引用符 > 右一重引用符 | app.executeMenuCommand('~singleRightQuote'); | 29.4 | 99.0 |
| 307 | ~emSpace | Type > Insert WhiteSpace Character > Em Space | 書式 > 空白文字を挿入 > EM スペース | app.executeMenuCommand('~emSpace'); | 29.4 | 99.0 |
| 308 | ~enSpace | Type > Insert WhiteSpace Character > En Space | 書式 > 空白文字を挿入 > EN スペース | app.executeMenuCommand('~enSpace'); | 29.4 | 99.0 |
| 309 | ~hairSpace | Type > Insert WhiteSpace Character > Hair Space | 書式 > 空白文字を挿入 > 極細スペース | app.executeMenuCommand('~hairSpace'); | 29.4 | 99.0 |
| 310 | ~thinSpace | Type > Insert WhiteSpace Character > Thin Space | 書式 > 空白文字を挿入 > 細いスペース | app.executeMenuCommand('~thinSpace'); | 29.4 | 99.0 |
| 311 | ~forcedLineBreak | Type > Insert Break Character > Forced Line Break | 書式 > 分割文字を挿入 > 強制改行 | app.executeMenuCommand('~forcedLineBreak'); | 29.4 | 99.0 |
| 312 | showHiddenChar | Type > Show Hidden Characters | 書式 > 制御文字を表示 | app.executeMenuCommand('showHiddenChar'); | 16 | 99 |
| 313 | type-horizontal | Type > Type Orientation > Horizontal | 書式 > 組み方向 > 横組み | app.executeMenuCommand('type-horizontal'); | 16 | 99 |
| 314 | type-vertical | Type > Type Orientation > Vertical | 書式 > 組み方向 > 縦組み | app.executeMenuCommand('type-vertical'); | 16 | 99 |
| 315 | selectall | Select > All | 選択 > すべてを選択 | app.executeMenuCommand('selectall'); | 16 | 99 |
| 316 | selectallinartboard | Select > All on Active Artboard | 選択 > 作業アートボードのすべてを選択 | app.executeMenuCommand('selectallinartboard'); | 16 | 99 |
| 317 | deselectall | Select > Deselect | 選択 > 選択を解除 | app.executeMenuCommand('deselectall'); | 16 | 99 |
| 318 | Find Reselect menu item | Select > Reselect | 選択 > 再選択 | app.executeMenuCommand('Find Reselect menu item'); | 16 | 99 |
| 319 | Inverse menu item | Select > Inverse | 選択 > 選択範囲を反転 | app.executeMenuCommand('Inverse menu item'); | 16 | 99 |
| 320 | Selection Hat 8 | Select > Next Object Above | 選択 > 前面のオブジェクト | app.executeMenuCommand('Selection Hat 8'); | 16 | 99 |
| 321 | Selection Hat 9 | Select > Next Object Below | 選択 > 背面のオブジェクト | app.executeMenuCommand('Selection Hat 9'); | 16 | 99 |
| 322 | Find Appearance menu item | Select > Same > Appearance | 選択 > 共通 > アピアランス | app.executeMenuCommand('Find Appearance menu item'); | 16 | 25.9 |
| 323 | Find Appearance Attributes menu item | Select > Same > Appearance Attribute | 選択 > 共通 > アピアランス属性 | app.executeMenuCommand('Find Appearance Attributes menu item'); | 16 | 25.9 |
| 324 | Find Blending Mode menu item | Select > Same > Blending Mode | 選択 > 共通 > 描画モード | app.executeMenuCommand('Find Blending Mode menu item'); | 16 | 25.9 |
| 325 | Find Fill & Stroke menu item | Select > Same > Fill & Stroke | 選択 > 共通 > 塗りと線 | app.executeMenuCommand('Find Fill & Stroke menu item'); | 16 | 25.9 |
| 326 | Find Fill Color menu item | Select > Same > Fill Color | 選択 > 共通 > カラー (塗り) | app.executeMenuCommand('Find Fill Color menu item'); | 16 | 25.9 |
| 327 | Find Opacity menu item | Select > Same > Opacity | 選択 > 共通 > 不透明度 | app.executeMenuCommand('Find Opacity menu item'); | 16 | 25.9 |
| 328 | Find Stroke Color menu item | Select > Same > Stroke Color | 選択 > 共通 > カラー (線) | app.executeMenuCommand('Find Stroke Color menu item'); | 16 | 25.9 |
| 329 | Find Stroke Weight menu item | Select > Same > Stroke Weight | 選択 > 共通 > 線幅 | app.executeMenuCommand('Find Stroke Weight menu item'); | 16 | 25.9 |
| 330 | Find Style menu item | Select > Same > Graphic Style | 選択 > 共通 > グラフィックスタイル | app.executeMenuCommand('Find Style menu item'); | 16 | 25.9 |
| 331 | Find Live Shape menu item | Select > Same > Shape | 選択 > 共通 > シェイプ | app.executeMenuCommand('Find Live Shape menu item'); | 17 | 25.9 |
| 332 | Find Symbol Instance menu item | Select > Same > Symbol Instance | 選択 > 共通 > シンボルインスタンス | app.executeMenuCommand('Find Symbol Instance menu item'); | 16 | 25.9 |
| 333 | Find Link Block Series menu item | Select > Same > Link Block Series | 選択 > 共通 > 一連のリンクブロック | app.executeMenuCommand('Find Link Block Series menu item'); | 16 | 25.9 |
| 334 | Find Text Font Family menu item | Select > Same > Text > Font Family | 選択 > 共通 > テキスト > フォントファミリー | app.executeMenuCommand('Find Text Font Family menu item'); | 26 | 99 |
| 335 | Find Appearance menu item | Select > Same > Shape & Text > Appearance | 選択 > 共通 > シェイプとテキスト > アピアランス | app.executeMenuCommand('Find Appearance menu item'); | 26 | 99 |
| 336 | Find Appearance Attributes menu item | Select > Same > Shape & Text > Appearance Attribute | 選択 > 共通 > シェイプとテキスト > アピアランス属性 | app.executeMenuCommand('Find Appearance Attributes menu item'); | 26 | 99 |
| 337 | Find Blending Mode menu item | Select > Same > Shape & Text > Blending Mode | 選択 > 共通 > シェイプとテキスト > 描画モード | app.executeMenuCommand('Find Blending Mode menu item'); | 26 | 99 |
| 338 | Find Fill & Stroke menu item | Select > Same > Shape & Text > Fill & Stroke | 選択 > 共通 > シェイプとテキスト > 塗りと線 | app.executeMenuCommand('Find Fill & Stroke menu item'); | 26 | 99 |
| 339 | Find Fill Color menu item | Select > Same > Shape & Text > Fill Color | 選択 > 共通 > シェイプとテキスト > カラー (塗り) | app.executeMenuCommand('Find Fill Color menu item'); | 26 | 99 |
| 340 | Find Opacity menu item | Select > Same > Shape & Text > Opacity | 選択 > 共通 > シェイプとテキスト > 不透明度 | app.executeMenuCommand('Find Opacity menu item'); | 26 | 99 |
| 341 | Find Stroke Color menu item | Select > Same > Shape & Text > Stroke Color | 選択 > 共通 > シェイプとテキスト > カラー (線) | app.executeMenuCommand('Find Stroke Color menu item'); | 26 | 99 |
| 342 | Find Stroke Weight menu item | Select > Same > Shape & Text > Stroke Weight | 選択 > 共通 > シェイプとテキスト > 線幅 | app.executeMenuCommand('Find Stroke Weight menu item'); | 26 | 99 |
| 343 | Find Style menu item | Select > Same > Shape & Text > Graphic Style | 選択 > 共通 > シェイプとテキスト > グラフィックスタイル | app.executeMenuCommand('Find Style menu item'); | 26 | 99 |
| 344 | Find Live Shape menu item | Select > Same > Shape & Text > Shape | 選択 > 共通 > シェイプとテキスト > シェイプ | app.executeMenuCommand('Find Live Shape menu item'); | 26 | 99 |
| 345 | Find Symbol Instance menu item | Select > Same > Shape & Text > Symbol Instance | 選択 > 共通 > シェイプとテキスト > シンボルインスタンス | app.executeMenuCommand('Find Symbol Instance menu item'); | 26 | 99 |
| 346 | Find Link Block Series menu item | Select > Same > Shape & Text > Link Block Series | 選択 > 共通 > シェイプとテキスト > 一連のリンクブロック | app.executeMenuCommand('Find Link Block Series menu item'); | 26 | 99 |
| 347 | Find Text Font Family Style menu item | Select > Same > Text > Font Family & Style | 選択 > 共通 > テキスト > フォントファミリー (スタイル) | app.executeMenuCommand('Find Text Font Family Style menu item'); | 26 | 99 |
| 348 | Find Text Font Family Style Size menu item | Select > Same > Text > Font Family, Style & Size | 選択 > 共通 > テキスト > フォントファミリー (スタイルとサイズ) | app.executeMenuCommand('Find Text Font Family Style Size menu item'); | 26 | 99 |
| 349 | Find Text Font Size menu item | Select > Same > Text > Font Size | 選択 > 共通 > テキスト > フォントサイズ | app.executeMenuCommand('Find Text Font Size menu item'); | 26 | 99 |
| 350 | Find Text Fill Color menu item | Select > Same > Text > Text Fill Color | 選択 > 共通 > テキスト > テキストカラー (塗り) | app.executeMenuCommand('Find Text Fill Color menu item'); | 26 | 99 |
| 351 | Find Text Stroke Color menu item | Select > Same > Text > Text Stroke Color | 選択 > 共通 > テキスト > テキストカラー (線) | app.executeMenuCommand('Find Text Stroke Color menu item'); | 26 | 99 |
| 352 | Find Text Fill Stroke Color menu item | Select > Same > Text > Test Fill & Stroke Color | 選択 > 共通 > テキスト > テキストカラー (塗りと線) | app.executeMenuCommand('Find Text Fill Stroke Color menu item'); | 26 | 99 |
| 353 | Selection Hat 3 | Select > Object > All on Same Layers | 選択 > オブジェクト > 同一レイヤー上のすべて | app.executeMenuCommand('Selection Hat 3'); | 16 | 99 |
| 354 | Selection Hat 1 | Select > Object > Direction Handles | 選択 > オブジェクト > セグメント | app.executeMenuCommand('Selection Hat 1'); | 16 | 99 |
| 355 | Bristle Brush Strokes menu item | Select > Object > Bristle Brush Strokes | 選択 > オブジェクト > 絵筆ブラシストローク | app.executeMenuCommand('Bristle Brush Strokes menu item'); | 16 | 99 |
| 356 | Brush Strokes menu item | Select > Object > Brush Strokes | 選択 > オブジェクト > ブラシストローク | app.executeMenuCommand('Brush Strokes menu item'); | 16 | 99 |
| 357 | Clipping Masks menu item | Select > Object > Clipping Masks | 選択 > オブジェクト > クリッピングマスク | app.executeMenuCommand('Clipping Masks menu item'); | 16 | 99 |
| 358 | Stray Points menu item | Select > Object > Stray Points | 選択 > オブジェクト > 孤立点 | app.executeMenuCommand('Stray Points menu item'); | 16 | 99 |
| 359 | Text Objects menu item | Select > Object > All Text Objects | 選択 > オブジェクト > すべてのテキストオブジェクト | app.executeMenuCommand('Text Objects menu item'); | 16 | 99 |
| 360 | Point Text Objects menu item | Select > Object > Point Text Objects | 選択 > オブジェクト > ポイント文字オブジェクト | app.executeMenuCommand('Point Text Objects menu item'); | 16 | 99 |
| 361 | Area Text Objects menu item | Select > Object > Area Text Objects | 選択 > オブジェクト > エリア内文字オブジェクト | app.executeMenuCommand('Area Text Objects menu item'); | 16 | 99 |
| 362 | SmartEdit Menu Item | Select > Start\|Stop Global Edit | 選択 > オブジェクトを一括選択\|選択解除 | app.executeMenuCommand('SmartEdit Menu Item'); | 23 | 99 |
| 363 | Selection Hat 10 | Select > Save Selection… | 選択 > 選択範囲を保存... | app.executeMenuCommand('Selection Hat 10'); | 16 | 99 |
| 364 | Selection Hat 11 | Select > Edit Selection… | 選択 > 選択範囲を編集... | app.executeMenuCommand('Selection Hat 11'); | 16 | 99 |
| 365 | Selection Hat 14 | Select > Update Selection | 選択 > 選択範囲を更新 | app.executeMenuCommand('Selection Hat 14'); | 28.0 | 99.0 |
| 366 | Adobe Apply Last Effect | Effect > Apply Last Effect | 効果 > 前回の効果を適用 | app.executeMenuCommand('Adobe Apply Last Effect'); | 16 | 99 |
| 367 | Adobe Last Effect | Effect > Last Effect | 効果 > 前回の効果 | app.executeMenuCommand('Adobe Last Effect'); | 16 | 99 |
| 368 | Live Rasterize Effect Setting | Effect > Document Raster Effects Settings… | 効果 > ドキュメントのラスタライズ効果設定... | app.executeMenuCommand('Live Rasterize Effect Setting'); | 16 | 99 |
| 369 | Live Adobe Geometry3D Extrude | Effect > 3D and Materials > Extrude & Bevel... | 効果 > 3D とマテリアル > 押し出しとベベル… | app.executeMenuCommand('Live Adobe Geometry3D Extrude'); | 26 | 99 |
| 370 | Live Adobe Geometry3D Revolve | Effect > 3D and Materials > Revolve... | 効果 > 3D とマテリアル > 回転体… | app.executeMenuCommand('Live Adobe Geometry3D Revolve'); | 26 | 99 |
| 371 | Live Adobe Geometry3D Inflate | Effect > 3D and Materials > Inflate... | 効果 > 3D とマテリアル > 膨張… | app.executeMenuCommand('Live Adobe Geometry3D Inflate'); | 26 | 99 |
| 372 | Live Adobe Geometry3D Rotate | Effect > 3D and Materials > Rotate... | 効果 > 3D とマテリアル > 回転… | app.executeMenuCommand('Live Adobe Geometry3D Rotate'); | 26 | 99 |
| 373 | Live Adobe Geometry3D Materials | Effect > 3D and Materials > Materials... | 効果 > 3D とマテリアル > マテリアル… | app.executeMenuCommand('Live Adobe Geometry3D Materials'); | 26 | 99 |
| 374 | Live 3DExtrude | Effect > 3D and Materials > 3D (Classic) > Extrude & Bevel (Classic)… | 効果 > 3D とマテリアル > 3D (クラシック) > 押し出し・ベベル (クラシック)… | app.executeMenuCommand('Live 3DExtrude'); | 26 | 99 |
| 375 | Live 3DRevolve | Effect > 3D and Materials > 3D (Classic) > Revolve (Classic)… | 効果 > 3D とマテリアル > 3D (クラシック) > 回転体 (クラシック)… | app.executeMenuCommand('Live 3DRevolve'); | 26 | 99 |
| 376 | Live 3DRotate | Effect > 3D and Materials > 3D (Classic) > Rotate (Classic)… | 効果 > 3D とマテリアル > 3D (クラシック) > 回転 (クラシック)… | app.executeMenuCommand('Live 3DRotate'); | 26 | 99 |
| 377 | Live 3DExtrude | Effect > 3D > Extrude & Bevel… | 効果 > 3D > 押し出し・ベベル... | app.executeMenuCommand('Live 3DExtrude'); | 16 | 25.9 |
| 378 | Live 3DRevolve | Effect > 3D > Revolve… | 効果 > 3D > 回転体... | app.executeMenuCommand('Live 3DRevolve'); | 16 | 25.9 |
| 379 | Live 3DRotate | Effect > 3D > Rotate… | 効果 > 3D > 回転... | app.executeMenuCommand('Live 3DRotate'); | 16 | 25.9 |
| 380 | Live SVG Filters | Effect > SVG Filters > Apply SVG Filter… | 効果 > SVG フィルター > SVG フィルターを適用... | app.executeMenuCommand('Live SVG Filters'); | 16 | 99 |
| 381 | SVG Filter Import | Effect > SVG Filters > Import SVG Filter… | 効果 > SVG フィルター > SVG フィルターの読み込み... | app.executeMenuCommand('SVG Filter Import'); | 16 | 99 |
| 382 | Live Feather | Effect > Stylize > Feather… | 効果 > スタイライズ > ぼかし... | app.executeMenuCommand('Live Feather'); | 16 | 99 |
| 383 | Live Adobe Drop Shadow | Effect > Stylize > Drop Shadow… | 効果 > スタイライズ > ドロップシャドウ... | app.executeMenuCommand('Live Adobe Drop Shadow'); | 16 | 99 |
| 384 | Live Inner Glow | Effect > Stylize > Inner Glow… | 効果 > スタイライズ > 光彩 (内側)... | app.executeMenuCommand('Live Inner Glow'); | 16 | 99 |
| 385 | Live Outer Glow | Effect > Stylize > Outer Glow… | 効果 > スタイライズ > 光彩 (外側)... | app.executeMenuCommand('Live Outer Glow'); | 16 | 99 |
| 386 | Live Scribble Fill | Effect > Stylize > Scribble… | 効果 > スタイライズ > 落書き... | app.executeMenuCommand('Live Scribble Fill'); | 16 | 99 |
| 387 | Live Adobe Round Corners | Effect > Stylize > Round Corners… | 効果 > スタイライズ > 角を丸くする... | app.executeMenuCommand('Live Adobe Round Corners'); | 16 | 99 |
| 388 | Live Trim Marks | Effect > Crop Marks | 効果 > トリムマーク | app.executeMenuCommand('Live Trim Marks'); | 16 | 99 |
| 389 | Live Outline Object | Effect > Path > Outline Object | 効果 > パス > オブジェクトのアウトライン | app.executeMenuCommand('Live Outline Object'); | 16 | 99 |
| 390 | Live Outline Stroke | Effect > Path > Outline Stroke | 効果 > パス > パスのアウトライン | app.executeMenuCommand('Live Outline Stroke'); | 16 | 99 |
| 391 | Live Offset Path | Effect > Path > Offset Path… | 効果 > パス > パスのオフセット... | app.executeMenuCommand('Live Offset Path'); | 16 | 99 |
| 392 | Live Zig Zag | Effect > Distort & Transform > Zig Zag… | 効果 > パスの変形 > ジグザグ... | app.executeMenuCommand('Live Zig Zag'); | 16 | 99 |
| 393 | Live Free Distort | Effect > Distort & Transform > Free Distort… | 効果 > パスの変形 > パスの自由変形... | app.executeMenuCommand('Live Free Distort'); | 16 | 99 |
| 394 | Live Pucker & Bloat | Effect > Distort & Transform > Pucker & Bloat… | 効果 > パスの変形 > パンク・膨張... | app.executeMenuCommand('Live Pucker & Bloat'); | 16 | 99 |
| 395 | Live Roughen | Effect > Distort & Transform > Roughen… | 効果 > パスの変形 > ラフ... | app.executeMenuCommand('Live Roughen'); | 16 | 99 |
| 396 | Live Scribble and Tweak | Effect > Distort & Transform > Tweak… | 効果 > パスの変形 > ランダム・ひねり... | app.executeMenuCommand('Live Scribble and Tweak'); | 16 | 99 |
| 397 | Live Transform | Effect > Distort & Transform > Transform… | 効果 > パスの変形 > 変形... | app.executeMenuCommand('Live Transform'); | 16 | 99 |
| 398 | Live Twist | Effect > Distort & Transform > Twist… | 効果 > パスの変形 > 旋回... | app.executeMenuCommand('Live Twist'); | 16 | 99 |
| 399 | Live Pathfinder Add | Effect > Pathfinder > Add | 効果 > パスファインダー > 追加 | app.executeMenuCommand('Live Pathfinder Add'); | 16 | 28.9 |
| 400 | Live Pathfinder Add | Effect > Pathfinder > Add | 効果 > パスファインダー > 合体 | app.executeMenuCommand('Live Pathfinder Add') | 29.0 | 99.0 |
| 401 | Live Pathfinder Intersect | Effect > Pathfinder > Intersect | 効果 > パスファインダー > 交差 | app.executeMenuCommand('Live Pathfinder Intersect'); | 16 | 99 |
| 402 | Live Pathfinder Exclude | Effect > Pathfinder > Exclude | 効果 > パスファインダー > 中マド | app.executeMenuCommand('Live Pathfinder Exclude'); | 16 | 99 |
| 403 | Live Pathfinder Subtract | Effect > Pathfinder > Subtract | 効果 > パスファインダー > 前面オブジェクトで型抜き | app.executeMenuCommand('Live Pathfinder Subtract'); | 16 | 99 |
| 404 | Live Pathfinder Minus Back | Effect > Pathfinder > Minus Back | 効果 > パスファインダー > 背面オブジェクトで型抜き | app.executeMenuCommand('Live Pathfinder Minus Back'); | 16 | 99 |
| 405 | Live Pathfinder Divide | Effect > Pathfinder > Divide | 効果 > パスファインダー > 分割 | app.executeMenuCommand('Live Pathfinder Divide'); | 16 | 99 |
| 406 | Live Pathfinder Trim | Effect > Pathfinder > Trim | 効果 > パスファインダー > 刈り込み | app.executeMenuCommand('Live Pathfinder Trim'); | 16 | 99 |
| 407 | Live Pathfinder Merge | Effect > Pathfinder > Merge | 効果 > パスファインダー > 合流 | app.executeMenuCommand('Live Pathfinder Merge'); | 16 | 99 |
| 408 | Live Pathfinder Crop | Effect > Pathfinder > Crop | 効果 > パスファインダー > 切り抜き | app.executeMenuCommand('Live Pathfinder Crop'); | 16 | 99 |
| 409 | Live Pathfinder Outline | Effect > Pathfinder > Outline | 効果 > パスファインダー > アウトライン | app.executeMenuCommand('Live Pathfinder Outline'); | 16 | 99 |
| 410 | Live Pathfinder Hard Mix | Effect > Pathfinder > Hard Mix | 効果 > パスファインダー > 濃い混色 | app.executeMenuCommand('Live Pathfinder Hard Mix'); | 16 | 99 |
| 411 | Live Pathfinder Soft Mix | Effect > Pathfinder > Soft Mix… | 効果 > パスファインダー > 薄い混色... | app.executeMenuCommand('Live Pathfinder Soft Mix'); | 16 | 99 |
| 412 | Live Pathfinder Trap | Effect > Pathfinder > Trap… | 効果 > パスファインダー > トラップ... | app.executeMenuCommand('Live Pathfinder Trap'); | 16 | 99 |
| 413 | Live Rasterize | Effect > Rasterize… | 効果 > ラスタライズ... | app.executeMenuCommand('Live Rasterize'); | 16 | 99 |
| 414 | Live Deform Arc | Effect > Warp > Arc… | 効果 > ワープ > 円弧... | app.executeMenuCommand('Live Deform Arc'); | 16 | 99 |
| 415 | Live Deform Arc Lower | Effect > Warp > Arc Lower… | 効果 > ワープ > 下弦... | app.executeMenuCommand('Live Deform Arc Lower'); | 16 | 99 |
| 416 | Live Deform Arc Upper | Effect > Warp > Arc Upper… | 効果 > ワープ > 上弦... | app.executeMenuCommand('Live Deform Arc Upper'); | 16 | 99 |
| 417 | Live Deform Arch | Effect > Warp > Arch… | 効果 > ワープ > アーチ... | app.executeMenuCommand('Live Deform Arch'); | 16 | 99 |
| 418 | Live Deform Bulge | Effect > Warp > Bulge… | 効果 > ワープ > でこぼこ... | app.executeMenuCommand('Live Deform Bulge'); | 16 | 99 |
| 419 | Live Deform Shell Lower | Effect > Warp > Shell Lower… | 効果 > ワープ > 貝殻 (下向き)... | app.executeMenuCommand('Live Deform Shell Lower'); | 16 | 99 |
| 420 | Live Deform Shell Upper | Effect > Warp > Shell Upper… | 効果 > ワープ > 貝殻 (上向き)... | app.executeMenuCommand('Live Deform Shell Upper'); | 16 | 99 |
| 421 | Live Deform Flag | Effect > Warp > Flag… | 効果 > ワープ > 旗... | app.executeMenuCommand('Live Deform Flag'); | 16 | 99 |
| 422 | Live Deform Wave | Effect > Warp > Wave… | 効果 > ワープ > 波形... | app.executeMenuCommand('Live Deform Wave'); | 16 | 99 |
| 423 | Live Deform Fish | Effect > Warp > Fish… | 効果 > ワープ > 魚形... | app.executeMenuCommand('Live Deform Fish'); | 16 | 99 |
| 424 | Live Deform Rise | Effect > Warp > Rise… | 効果 > ワープ > 上昇... | app.executeMenuCommand('Live Deform Rise'); | 16 | 99 |
| 425 | Live Deform Fisheye | Effect > Warp > Fisheye… | 効果 > ワープ > 魚眼レンズ... | app.executeMenuCommand('Live Deform Fisheye'); | 16 | 99 |
| 426 | Live Deform Inflate | Effect > Warp > Inflate… | 効果 > ワープ > 膨張... | app.executeMenuCommand('Live Deform Inflate'); | 16 | 99 |
| 427 | Live Deform Squeeze | Effect > Warp > Squeeze… | 効果 > ワープ > 絞り込み... | app.executeMenuCommand('Live Deform Squeeze'); | 16 | 99 |
| 428 | Live Deform Twist | Effect > Warp > Twist… | 効果 > ワープ > 旋回... | app.executeMenuCommand('Live Deform Twist'); | 16 | 99 |
| 429 | Live Rectangle | Effect > Convert to Shape > Rectangle… | 効果 > 形状に変換 > 長方形... | app.executeMenuCommand('Live Rectangle'); | 16 | 99 |
| 430 | Live Rounded Rectangle | Effect > Convert to Shape > Rounded Rectangle… | 効果 > 形状に変換 > 角丸長方形... | app.executeMenuCommand('Live Rounded Rectangle'); | 16 | 99 |
| 431 | Live Ellipse | Effect > Convert to Shape > Ellipse… | 効果 > 形状に変換 > 楕円形... | app.executeMenuCommand('Live Ellipse'); | 16 | 99 |
| 432 | Live PSAdapter_plugin_GEfc | Effect > Effect Gallery… | 効果 > 効果ギャラリー... | app.executeMenuCommand('Live PSAdapter_plugin_GEfc'); | 16 | 99 |
| 433 | Live Adobe PSL Gaussian Blur | Effect > Blur > Gaussian Blur… | 効果 > ぼかし > ぼかし (ガウス)... | app.executeMenuCommand('Live Adobe PSL Gaussian Blur'); | 16 | 99 |
| 434 | Live PSAdapter_plugin_RdlB | Effect > Blur > Radial Blur… | 効果 > ぼかし > ぼかし (放射状)... | app.executeMenuCommand('Live PSAdapter_plugin_RdlB'); | 16 | 99 |
| 435 | Live PSAdapter_plugin_SmrB | Effect > Blur > Smart Blur… | 効果 > ぼかし > ぼかし (詳細)... | app.executeMenuCommand('Live PSAdapter_plugin_SmrB'); | 16 | 99 |
| 436 | Live PSAdapter_plugin_SmdS | Effect > Artistic > Smudge Stick… | 効果 > アーティスティック > こする... | app.executeMenuCommand('Live PSAdapter_plugin_SmdS'); | 16 | 99 |
| 437 | Live PSAdapter_plugin_PstE | Effect > Artistic > Poster Edges… | 効果 > アーティスティック > エッジのポスタリゼーション... | app.executeMenuCommand('Live PSAdapter_plugin_PstE'); | 16 | 99 |
| 438 | Live PSAdapter_plugin_Ct | Effect > Artistic > Cutout… | 効果 > アーティスティック > カットアウト... | app.executeMenuCommand('Live PSAdapter_plugin_Ct '); | 16 | 99 |
| 439 | Live PSAdapter_plugin_Spng | Effect > Artistic > Sponge… | 効果 > アーティスティック > スポンジ... | app.executeMenuCommand('Live PSAdapter_plugin_Spng'); | 16 | 99 |
| 440 | Live PSAdapter_plugin_DryB | Effect > Artistic > Dry Brush… | 効果 > アーティスティック > ドライブラシ... | app.executeMenuCommand('Live PSAdapter_plugin_DryB'); | 16 | 99 |
| 441 | Live PSAdapter_plugin_NGlw | Effect > Artistic > Neon Glow… | 効果 > アーティスティック > ネオン光彩... | app.executeMenuCommand('Live PSAdapter_plugin_NGlw'); | 16 | 99 |
| 442 | Live PSAdapter_plugin_PltK | Effect > Artistic > Palette Knife… | 効果 > アーティスティック > パレットナイフ... | app.executeMenuCommand('Live PSAdapter_plugin_PltK'); | 16 | 99 |
| 443 | Live PSAdapter_plugin_Frsc | Effect > Artistic > Fresco… | 効果 > アーティスティック > フレスコ... | app.executeMenuCommand('Live PSAdapter_plugin_Frsc'); | 16 | 99 |
| 444 | Live PSAdapter_plugin_PlsW | Effect > Artistic > Plastic Wrap… | 効果 > アーティスティック > ラップ... | app.executeMenuCommand('Live PSAdapter_plugin_PlsW'); | 16 | 99 |
| 445 | Live PSAdapter_plugin_PntD | Effect > Artistic > Paint Daubs… | 効果 > アーティスティック > 塗料... | app.executeMenuCommand('Live PSAdapter_plugin_PntD'); | 16 | 99 |
| 446 | Live PSAdapter_plugin_Wtrc | Effect > Artistic > Watercolor… | 効果 > アーティスティック > 水彩画... | app.executeMenuCommand('Live PSAdapter_plugin_Wtrc'); | 16 | 99 |
| 447 | Live PSAdapter_plugin_FlmG | Effect > Artistic > Film Grain… | 効果 > アーティスティック > 粒状フィルム... | app.executeMenuCommand('Live PSAdapter_plugin_FlmG'); | 16 | 99 |
| 448 | Live PSAdapter_plugin_RghP | Effect > Artistic > Rough Pastels… | 効果 > アーティスティック > 粗いパステル画... | app.executeMenuCommand('Live PSAdapter_plugin_RghP'); | 16 | 99 |
| 449 | Live PSAdapter_plugin_Undr | Effect > Artistic > Underpainting… | 効果 > アーティスティック > 粗描き... | app.executeMenuCommand('Live PSAdapter_plugin_Undr'); | 16 | 99 |
| 450 | Live PSAdapter_plugin_ClrP | Effect > Artistic > Colored Pencil… | 効果 > アーティスティック > 色鉛筆... | app.executeMenuCommand('Live PSAdapter_plugin_ClrP'); | 16 | 99 |
| 451 | Live PSAdapter_plugin_TrnE | Effect > Sketch > Torn Edges… | 効果 > スケッチ > ぎざぎざのエッジ... | app.executeMenuCommand('Live PSAdapter_plugin_TrnE'); | 16 | 99 |
| 452 | Live PSAdapter_plugin_Rtcl | Effect > Sketch > Reticulation… | 効果 > スケッチ > ちりめんじわ... | app.executeMenuCommand('Live PSAdapter_plugin_Rtcl'); | 16 | 99 |
| 453 | Live PSAdapter_plugin_WtrP | Effect > Sketch > Water Paper… | 効果 > スケッチ > ウォーターペーパー... | app.executeMenuCommand('Live PSAdapter_plugin_WtrP'); | 16 | 99 |
| 454 | Live PSAdapter_plugin_CntC | Effect > Sketch > Conté Crayon… | 効果 > スケッチ > クレヨンのコンテ画... | app.executeMenuCommand('Live PSAdapter_plugin_CntC'); | 16 | 99 |
| 455 | Live PSAdapter_plugin_Chrm | Effect > Sketch > Chrome… | 効果 > スケッチ > クロム... | app.executeMenuCommand('Live PSAdapter_plugin_Chrm'); | 16 | 99 |
| 456 | Live PSAdapter_plugin_GraP | Effect > Sketch > Graphic Pen… | 効果 > スケッチ > グラフィックペン... | app.executeMenuCommand('Live PSAdapter_plugin_GraP'); | 16 | 99 |
| 457 | Live PSAdapter_plugin_Phtc | Effect > Sketch > Photocopy… | 効果 > スケッチ > コピー... | app.executeMenuCommand('Live PSAdapter_plugin_Phtc'); | 16 | 99 |
| 458 | Live PSAdapter_plugin_Stmp | Effect > Sketch > Stamp… | 効果 > スケッチ > スタンプ... | app.executeMenuCommand('Live PSAdapter_plugin_Stmp'); | 16 | 99 |
| 459 | Live PSAdapter_plugin_ChlC | Effect > Sketch > Chalk & Charcoal… | 効果 > スケッチ > チョーク・木炭画... | app.executeMenuCommand('Live PSAdapter_plugin_ChlC'); | 16 | 99 |
| 460 | Live PSAdapter_plugin_NtPr | Effect > Sketch > Note Paper… | 効果 > スケッチ > ノート用紙... | app.executeMenuCommand('Live PSAdapter_plugin_NtPr'); | 16 | 99 |
| 461 | Live PSAdapter_plugin_HlfS | Effect > Sketch > Halftone Pattern… | 効果 > スケッチ > ハーフトーンパターン... | app.executeMenuCommand('Live PSAdapter_plugin_HlfS'); | 16 | 99 |
| 462 | Live PSAdapter_plugin_Plst | Effect > Sketch > Plaster… | 効果 > スケッチ > プラスター... | app.executeMenuCommand('Live PSAdapter_plugin_Plst'); | 16 | 99 |
| 463 | Live PSAdapter_plugin_Chrc | Effect > Sketch > Charcoal… | 効果 > スケッチ > 木炭画... | app.executeMenuCommand('Live PSAdapter_plugin_Chrc'); | 16 | 99 |
| 464 | Live PSAdapter_plugin_BsRl | Effect > Sketch > Bas Relief… | 効果 > スケッチ > 浅浮彫り... | app.executeMenuCommand('Live PSAdapter_plugin_BsRl'); | 16 | 99 |
| 465 | Live PSAdapter_plugin_Crql | Effect > Texture > Craquelure… | 効果 > テクスチャ > クラッキング... | app.executeMenuCommand('Live PSAdapter_plugin_Crql'); | 16 | 99 |
| 466 | Live PSAdapter_plugin_StnG | Effect > Texture > Stained Glass… | 効果 > テクスチャ > ステンドグラス... | app.executeMenuCommand('Live PSAdapter_plugin_StnG'); | 16 | 99 |
| 467 | Live PSAdapter_plugin_Txtz | Effect > Texture > Texturizer… | 効果 > テクスチャ > テクスチャライザー... | app.executeMenuCommand('Live PSAdapter_plugin_Txtz'); | 16 | 99 |
| 468 | Live PSAdapter_plugin_Ptch | Effect > Texture > Patchwork… | 効果 > テクスチャ > パッチワーク... | app.executeMenuCommand('Live PSAdapter_plugin_Ptch'); | 16 | 99 |
| 469 | Live PSAdapter_plugin_MscT | Effect > Texture > Mosaic Tiles… | 効果 > テクスチャ > モザイクタイル... | app.executeMenuCommand('Live PSAdapter_plugin_MscT'); | 16 | 99 |
| 470 | Live PSAdapter_plugin_Grn | Effect > Texture > Grain… | 効果 > テクスチャ > 粒状... | app.executeMenuCommand('Live PSAdapter_plugin_Grn '); | 16 | 99 |
| 471 | Live PSAdapter_plugin_NTSC | Effect > Video > NTSC Colors | 効果 > ビデオ > NTSC カラー | app.executeMenuCommand('Live PSAdapter_plugin_NTSC'); | 16 | 99 |
| 472 | Live PSAdapter_plugin_Dntr | Effect > Video > De-Interlace… | 効果 > ビデオ > インターレース解除... | app.executeMenuCommand('Live PSAdapter_plugin_Dntr'); | 16 | 99 |
| 473 | Live PSAdapter_plugin_ClrH | Effect > Pixelate > Color Halftone… | 効果 > ピクセレート > カラーハーフトーン... | app.executeMenuCommand('Live PSAdapter_plugin_ClrH'); | 16 | 99 |
| 474 | Live PSAdapter_plugin_Mztn | Effect > Pixelate > Mezzotint… | 効果 > ピクセレート > メゾティント... | app.executeMenuCommand('Live PSAdapter_plugin_Mztn'); | 16 | 99 |
| 475 | Live PSAdapter_plugin_Crst | Effect > Pixelate > Crystallize… | 効果 > ピクセレート > 水晶... | app.executeMenuCommand('Live PSAdapter_plugin_Crst'); | 16 | 99 |
| 476 | Live PSAdapter_plugin_Pntl | Effect > Pixelate > Pointillize… | 効果 > ピクセレート > 点描... | app.executeMenuCommand('Live PSAdapter_plugin_Pntl'); | 16 | 99 |
| 477 | Live PSAdapter_plugin_Spt | Effect > Brush Strokes > Spatter… | 効果 > ブラシストローク > はね... | app.executeMenuCommand('Live PSAdapter_plugin_Spt '); | 16 | 99 |
| 478 | Live PSAdapter_plugin_InkO | Effect > Brush Strokes > Ink Outlines… | 効果 > ブラシストローク > インク画 (外形)... | app.executeMenuCommand('Live PSAdapter_plugin_InkO'); | 16 | 99 |
| 479 | Live PSAdapter_plugin_AccE | Effect > Brush Strokes > Accented Edges… | 効果 > ブラシストローク > エッジの強調... | app.executeMenuCommand('Live PSAdapter_plugin_AccE'); | 16 | 99 |
| 480 | Live PSAdapter_plugin_SprS | Effect > Brush Strokes > Sprayed Strokes… | 効果 > ブラシストローク > ストローク (スプレー)... | app.executeMenuCommand('Live PSAdapter_plugin_SprS'); | 16 | 99 |
| 481 | Live PSAdapter_plugin_AngS | Effect > Brush Strokes > Angled Strokes… | 効果 > ブラシストローク > ストローク (斜め)... | app.executeMenuCommand('Live PSAdapter_plugin_AngS'); | 16 | 99 |
| 482 | Live PSAdapter_plugin_DrkS | Effect > Brush Strokes > Dark Strokes… | 効果 > ブラシストローク > ストローク (暗)... | app.executeMenuCommand('Live PSAdapter_plugin_DrkS'); | 16 | 99 |
| 483 | Live PSAdapter_plugin_Smie | Effect > Brush Strokes > Sumi-e… | 効果 > ブラシストローク > 墨絵... | app.executeMenuCommand('Live PSAdapter_plugin_Smie'); | 16 | 99 |
| 484 | Live PSAdapter_plugin_Crsh | Effect > Brush Strokes > Crosshatch… | 効果 > ブラシストローク > 網目... | app.executeMenuCommand('Live PSAdapter_plugin_Crsh'); | 16 | 99 |
| 485 | Live PSAdapter_plugin_Gls | Effect > Distort > Glass… | 効果 > 変形 > ガラス... | app.executeMenuCommand('Live PSAdapter_plugin_Gls '); | 16 | 99 |
| 486 | Live PSAdapter_plugin_DfsG | Effect > Distort > Diffuse Glow… | 効果 > 変形 > 光彩拡散... | app.executeMenuCommand('Live PSAdapter_plugin_DfsG'); | 16 | 99 |
| 487 | Live PSAdapter_plugin_OcnR | Effect > Distort > Ocean Ripple… | 効果 > 変形 > 海の波紋... | app.executeMenuCommand('Live PSAdapter_plugin_OcnR'); | 16 | 99 |
| 488 | Live PSAdapter_plugin_GlwE | Effect > Stylize > Glowing Edges… | 効果 > 表現手法 > エッジの光彩... | app.executeMenuCommand('Live PSAdapter_plugin_GlwE'); | 16 | 99 |
| 489 | View using GPU | View > Preview on CPU\|GPU | 表示 > CPU\|GPU で表示 | app.executeMenuCommand('View using GPU'); | 19 | 99 |
| 490 | preview | View > Preview | 表示 > アウトライン | app.executeMenuCommand('preview'); | 16 | 99 |
| 491 | ink | View > Overprint Preview | 表示 > オーバープリントプレビュー | app.executeMenuCommand('ink'); | 16 | 99 |
| 492 | raster | View > Pixel Preview | 表示 > ピクセルプレビュー | app.executeMenuCommand('raster'); | 16 | 99 |
| 493 | proof-document | View > Proof Setup > Document CMYK: | 表示 > 校正設定 > 作業用 CMYK : Japan Color 2001 Coated | app.executeMenuCommand('proof-document'); | 16 | 99 |
| 494 | proof-mac-rgb | View > Proof Setup > Legacy Macintosh RGB (Gamma 1.8) | 表示 > 校正設定 > 以前の Macintosh RGB (ガンマ 1.8) | app.executeMenuCommand('proof-mac-rgb'); | 16 | 99 |
| 495 | proof-win-rgb | View > Proof Setup > Internet Standard RGB (sRGB) | 表示 > 校正設定 > インターネット標準 RGB (sRGB) | app.executeMenuCommand('proof-win-rgb'); | 16 | 99 |
| 496 | proof-monitor-rgb | View > Proof Setup > Monitor RGB | 表示 > 校正設定 > モニター RGB | app.executeMenuCommand('proof-monitor-rgb'); | 16 | 99 |
| 497 | proof-colorblindp | View > Proof Setup > Color blindness - Protanopia-type | 表示 > 校正設定 > P 型 (1 型) 色覚 | app.executeMenuCommand('proof-colorblindp'); | 16 | 99 |
| 498 | proof-colorblindd | View > Proof Setup > Color blindness - Deuteranopia-type | 表示 > 校正設定 > D 型 (2 型) 色覚 | app.executeMenuCommand('proof-colorblindd'); | 16 | 99 |
| 499 | proof-custom | View > Proof Setup > Customize… | 表示 > 校正設定 > カスタム... | app.executeMenuCommand('proof-custom'); | 16 | 99 |
| 500 | proofColors | View > Proof Colors | 表示 > 色の校正 | app.executeMenuCommand('proofColors'); | 16 | 99 |
| 501 | zoomin | View > Zoom In | 表示 > ズームイン | app.executeMenuCommand('zoomin'); | 16 | 99 |
| 502 | zoomout | View > Zoom Out | 表示 > ズームアウト | app.executeMenuCommand('zoomout'); | 16 | 99 |
| 503 | fitin | View > Fit Artboard in Window | 表示 > アートボードを全体表示 | app.executeMenuCommand('fitin'); | 16 | 99 |
| 504 | fitall | View > Fit All in Window | 表示 > すべてのアートボードを全体表示 | app.executeMenuCommand('fitall'); | 16 | 99 |
| 505 | AISlice Feedback Menu | View > Show\|Hide Slices | 表示 > スライスを表示\|隠す | app.executeMenuCommand('AISlice Feedback Menu'); | 16 | 99 |
| 506 | AISlice Lock Menu | View > Lock Slices | 表示 > スライスをロック | app.executeMenuCommand('AISlice Lock Menu'); | 16 | 99 |
| 507 | actualsize | View > Actual Size | 表示 > 100% 表示 | app.executeMenuCommand('actualsize'); | 16 | 99 |
| 508 | edge | View > Show\|Hide Edges | 表示 > 境界線を表示\|隠す | app.executeMenuCommand('edge'); | 16 | 99 |
| 509 | artboard | View > Show\|Hide Artboards | 表示 > アートボードを表示\|隠す | app.executeMenuCommand('artboard'); | 16 | 99 |
| 510 | pagetiling | View > Show\|Hide Print Tiling | 表示 > プリント分割を表示\|隠す | app.executeMenuCommand('pagetiling'); | 16 | 99 |
| 511 | AI Bounding Box Toggle | View > Show\|Hide Bounding Box | 表示 > バウンディングボックスを表示\|隠す | app.executeMenuCommand('AI Bounding Box Toggle'); | 16 | 99 |
| 512 | TransparencyGrid Menu Item | View > Show\|Hide Transparency Grid | 表示 > 透明グリッドを表示\|隠す | app.executeMenuCommand('TransparencyGrid Menu Item'); | 16 | 99 |
| 513 | showtemplate | View > Show\|Hide Template | 表示 > テンプレートを表示\|隠す | app.executeMenuCommand('showtemplate'); | 16 | 99 |
| 514 | Gradient Feedback | View > Show\|Hide Gradient Annotator | 表示 > グラデーションガイドを表示\|隠す | app.executeMenuCommand('Gradient Feedback'); | 16 | 99 |
| 515 | Show Gaps Planet X | View > Show\|Hide Live Paint Gaps | 表示 > ライブペイントの隙間を表示\|隠す | app.executeMenuCommand('Show Gaps Planet X'); | 16 | 99 |
| 516 | Live Corner Annotator | View > Show\|Hide Corner Widget | 表示 > コーナーウィジェットを表示\|隠す | app.executeMenuCommand('Live Corner Annotator'); | 17.1 | 99 |
| 517 | Snapomatic on-off menu item | View > Smart Guides | 表示 > スマートガイド | app.executeMenuCommand('Snapomatic on-off menu item'); | 16 | 99 |
| 518 | Show Perspective Grid | View > Perspective Grid > Show Grid | 表示 > 遠近グリッド > グリッドを表示\|隠す | app.executeMenuCommand('Show Perspective Grid'); | 16 | 99 |
| 519 | Show Ruler | View > Perspective Grid > Show Rulers | 表示 > 遠近グリッド > 定規を表示\|隠す | app.executeMenuCommand('Show Ruler'); | 16 | 99 |
| 520 | Snap to Grid | View > Perspective Grid > Snap to Grid | 表示 > 遠近グリッド > グリッドにスナップ | app.executeMenuCommand('Snap to Grid'); | 16 | 99 |
| 521 | Lock Perspective Grid | View > Perspective Grid > Lock Grid | 表示 > 遠近グリッド > グリッドをロック\|ロック解除 | app.executeMenuCommand('Lock Perspective Grid'); | 16 | 99 |
| 522 | Lock Station Point | View > Perspective Grid > Lock Station Point | 表示 > 遠近グリッド > 測点をロック\|ロック解除 | app.executeMenuCommand('Lock Station Point'); | 16 | 99 |
| 523 | Define Perspective Grid | View > Perspective Grid > Define Grid… | 表示 > 遠近グリッド > グリッドを定義... | app.executeMenuCommand('Define Perspective Grid'); | 16 | 99 |
| 524 | Save Perspective Grid as Preset | View > Perspective Grid > Save Grid as Preset… | 表示 > 遠近グリッド > グリッドをプリセットとして保存... | app.executeMenuCommand('Save Perspective Grid as Preset'); | 16 | 99 |
| 525 | ruler | View > Rulers > Show Rulers | 表示 > 定規 > 定規を表表示\|隠す | app.executeMenuCommand('ruler'); | 16 | 99 |
| 526 | rulerCoordinateSystem | View > Rulers > Change to Global Rulers | 表示 > 定規 > アートボード定規に変更 | app.executeMenuCommand('rulerCoordinateSystem'); | 16 | 99 |
| 527 | videoruler | View > Rulers > Show Video Rulers | 表示 > 定規 > ビデオ定規を表示\|隠す | app.executeMenuCommand('videoruler'); | 16 | 99 |
| 528 | textthreads | View > Show Text Threads | 表示 > テキストのスレッドを表示\|隠す | app.executeMenuCommand('textthreads'); | 16 | 99 |
| 529 | showguide | View > Guides > Hide Guides | 表示 > ガイド > ガイドを表示\|隠す | app.executeMenuCommand('showguide'); | 16 | 99 |
| 530 | lockguide | View > Guides > Lock Guides | 表示 > ガイド > ガイドをロック\|ロック解除 | app.executeMenuCommand('lockguide'); | 16 | 99 |
| 531 | makeguide | View > Guides > Make Guides | 表示 > ガイド > ガイドを作成 | app.executeMenuCommand('makeguide'); | 16 | 99 |
| 532 | releaseguide | View > Guides > Release Guides | 表示 > ガイド > ガイドを解除 | app.executeMenuCommand('releaseguide'); | 16 | 99 |
| 533 | clearguide | View > Guides > Clear Guides | 表示 > ガイド > ガイドを消去 | app.executeMenuCommand('clearguide'); | 16 | 99 |
| 534 | showgrid | View > Show Grid | 表示 > グリッドを表示\|隠す | app.executeMenuCommand('showgrid'); | 16 | 99 |
| 535 | snapgrid | View > Snap to Grid | 表示 > グリッドにスナップ | app.executeMenuCommand('snapgrid'); | 16 | 99 |
| 536 | snappoint | View > Snap to Point | 表示 > ポイントにスナップ | app.executeMenuCommand('snappoint'); | 16 | 99 |
| 537 | newview | View > New View… | 表示 > 新規表示... | app.executeMenuCommand('newview'); | 16 | 99 |
| 538 | editview | View > Edit Views… | 表示 > 表示の編集... | app.executeMenuCommand('editview'); | 16 | 99 |
| 539 | newwindow | Window > New Window | ウィンドウ > 新規ウィンドウ | app.executeMenuCommand('newwindow'); | 16 | 99 |
| 540 | cascade | Window > Arrange > Cascade | ウィンドウ > アレンジ > 重ねて表示 | app.executeMenuCommand('cascade'); | 16 | 99 |
| 541 | tile | Window > Arrange > Tile | ウィンドウ > アレンジ > 並べて表示 | app.executeMenuCommand('tile'); | 16 | 99 |
| 542 | floatInWindow | Window > Arrange > Float in Window | ウィンドウ > アレンジ > ウィンドウを分離 | app.executeMenuCommand('floatInWindow'); | 16 | 99 |
| 543 | floatAllInWindows | Window > Arrange > Float All in Windows | ウィンドウ > アレンジ > すべてのウィンドウを分離 | app.executeMenuCommand('floatAllInWindows'); | 16 | 99 |
| 544 | consolidateAllWindows | Window > Arrange > Consolidate All Windows | ウィンドウ > アレンジ > すべてのウィンドウを統合 | app.executeMenuCommand('consolidateAllWindows'); | 16 | 99 |
| 545 | Browse Add-Ons Menu | Window > Find Extensions on Exchange… | ウィンドウ > Exchange でエクステンションを検索... | app.executeMenuCommand('Browse Add-Ons Menu'); | 19 | 99 |
| 546 | Adobe Reset Workspace | Window > Reset Workspace | ウィンドウ > ワークスペース > 「現在のワークスペース」をリセット | app.executeMenuCommand('Adobe Reset Workspace'); | 16 | 99 |
| 547 | Adobe New Workspace | Window > Workspace > New Workspace… | ウィンドウ > ワークスペース > 新規ワークスペース... | app.executeMenuCommand('Adobe New Workspace'); | 16 | 99 |
| 548 | Adobe Manage Workspace | Window > Workspace > Manage Workspaces… | ウィンドウ > ワークスペース > ワークスペースの管理... | app.executeMenuCommand('Adobe Manage Workspace'); | 16 | 99 |
| 549 | drover control palette plugin | Window > Control | ウィンドウ > コントロール | app.executeMenuCommand('drover control palette plugin'); | 16 | 99 |
| 550 | Default ToolBar | Window > Toolbars > Default | ウィンドウ > ツールバー > 初期設定 | app.executeMenuCommand('Default ToolBar'); | 17 | 22.9 |
| 551 | Adobe Basic Toolbar Menu | Window > Toolbars > Basic | ウィンドウ > ツールバー > 基本 | app.executeMenuCommand('Adobe Basic Toolbar Menu'); | 23 | 99 |
| 552 | Adobe Advanced Toolbar Menu | Window > Toolbars > Advanced | ウィンドウ > ツールバー > 詳細 | app.executeMenuCommand('Adobe Advanced Toolbar Menu'); | 23 | 99 |
| 553 | Adobe Quick Toolbar Menu | Window > Toolbars > Getting Started | ウィンドウ > ツールバー > はじめに | app.executeMenuCommand('Adobe Quick Toolbar Menu'); | 29.3 | 99.0 |
| 554 | New Tools Panel | Window > Toolbars > New Toolbar… | ウィンドウ > ツールバー > 新しいツールバー... | app.executeMenuCommand('New Tools Panel'); | 17 | 99 |
| 555 | Manage Tools Panel | Window > Toolbars > Manage Toolbars… | ウィンドウ > ツールバー > ツールバーを管理... | app.executeMenuCommand('Manage Tools Panel'); | 17 | 99 |
| 556 | Adobe Illustrator Kuler Panel | Window > Color Themes | ウィンドウ > Adobe Color テーマ | app.executeMenuCommand('Adobe Illustrator Kuler Panel'); | 16 | 25.9 |
| 557 | Adobe 3D Panel | Window > 3D and Materials | ウィンドウ > 3D とマテリアル | app.executeMenuCommand('Adobe 3D Panel'); | 26 | 99 |
| 558 | Adobe CSXS Extension com.adobe.DesignLibraries.angularライブラリ | Window > Libraries | ウィンドウ > ライブラリ | app.executeMenuCommand('Adobe CSXS Extension com.adobe.DesignLibraries.angularライブラリ'); | 18.1 | 22.9 |
| 559 | Adobe CSXS Extension com.adobe.DesignLibraries.angularCC ライブラリ | Window > Libraries | ウィンドウ > CC ライブラリ | app.executeMenuCommand('Adobe CSXS Extension com.adobe.DesignLibraries.angularCC ライブラリ'); | 23 | 99 |
| 560 | CSS Menu Item | Window > CSS Properties | ウィンドウ > CSS プロパティ | app.executeMenuCommand('CSS Menu Item'); | 16 | 99 |
| 561 | ReTypeWindowMenu | Window > Retype (Beta) | ウィンドウ > Retype (Beta) | app.executeMenuCommand('ReTypeWindowMenu'); | 27.6 | 29.2 |
| 562 | ReTypeWindowMenu | Window > Retype | ウィンドウ > Retype | app.executeMenuCommand('ReTypeWindowMenu'); | 29.3 | 99.0 |
| 563 | Adobe SVG Interactivity Palette | Window > SVG Interactivity | ウィンドウ > SVG インタラクティビティ | app.executeMenuCommand('Adobe SVG Interactivity Palette'); | 16 | 99 |
| 564 | Adobe Action Palette | Window > Actions | ウィンドウ > アクション | app.executeMenuCommand('Adobe Action Palette'); | 16 | 99 |
| 565 | Adobe SmartExport Panel Menu Item | Window > Asset Export | ウィンドウ > アセットの書き出し | app.executeMenuCommand('Adobe SmartExport Panel Menu Item'); | 20 | 99 |
| 566 | Style Palette | Window > Appearance | ウィンドウ > アピアランス | app.executeMenuCommand('Style Palette'); | 16 | 99 |
| 567 | Adobe Artboard Palette | Window > Artboards | ウィンドウ > アートボード | app.executeMenuCommand('Adobe Artboard Palette'); | 16 | 99 |
| 568 | Adobe Color Palette | Window > Color | ウィンドウ > カラー | app.executeMenuCommand('Adobe Color Palette'); | 16 | 99 |
| 569 | Adobe Harmony Palette | Window > Color Guide | ウィンドウ > カラーガイド | app.executeMenuCommand('Adobe Harmony Palette'); | 16 | 99 |
| 570 | Adobe Gradient Palette | Window > Gradient | ウィンドウ > グラデーション | app.executeMenuCommand('Adobe Gradient Palette'); | 16 | 99 |
| 571 | Adobe Style Palette | Window > Graphic Styles | ウィンドウ > グラフィックスタイル | app.executeMenuCommand('Adobe Style Palette'); | 16 | 99 |
| 572 | Adobe Commenting Palette | Window > Comments | ウィンドウ > コメント | app.executeMenuCommand('Adobe Commenting Palette'); | 26 | 99 |
| 573 | Adobe Symbol Palette | Window > Symbols | ウィンドウ > シンボル | app.executeMenuCommand('Adobe Symbol Palette'); | 16 | 99 |
| 574 | Adobe Swatches Menu Item | Window > Swatches | ウィンドウ > スウォッチ | app.executeMenuCommand('Adobe Swatches Menu Item'); | 16 | 99 |
| 575 | Generate | Window > Text to Vector Graphic (Beta) | ウィンドウ > テキストからベクター生成 (Beta) | app.executeMenuCommand('Generate'); | 28.0 | 28.5 |
| 576 | DocInfo1 | Window > Document Info | ウィンドウ > ドキュメント情報 | app.executeMenuCommand('DocInfo1'); | 16 | 99 |
| 577 | AdobeNavigator | Window > Navigator | ウィンドウ > ナビゲーター | app.executeMenuCommand('AdobeNavigator'); | 16 | 99 |
| 578 |  | Window > Version History | ウィンドウ > バージョン履歴 | app.executeMenuCommand(''); | 24.0 | 25.9 |
| 579 | Adobe Version History File Menu Item | Window > Version History | ウィンドウ > バージョン履歴 | app.executeMenuCommand('Adobe Version History File Menu Item'); | 26 | 99 |
| 580 | Adobe PathfinderUI | Window > Pathfinder | ウィンドウ > パスファインダー | app.executeMenuCommand('Adobe PathfinderUI'); | 16 | 99 |
| 581 | Adobe Pattern Panel Toggle | Window > Pattern Options | ウィンドウ > パターンオプション | app.executeMenuCommand('Adobe Pattern Panel Toggle'); | 16 | 99 |
| 582 | Adobe HistoryPanel Menu Item | Window > History | ウィンドウ > ヒストリー | app.executeMenuCommand('Adobe HistoryPanel Menu Item'); | 26.4 | 26.9 |
| 583 | Adobe History Panel Menu Item | Window > History | ウィンドウ > ヒストリー | app.executeMenuCommand('Adobe History Panel Menu Item'); | 27.0 | 99.0 |
| 584 | Adobe BrushManager Menu Item | Window > Brushes | ウィンドウ > ブラシ | app.executeMenuCommand('Adobe BrushManager Menu Item'); | 16 | 99 |
| 585 |  | Window > Properties | ウィンドウ > プロパティ | app.executeMenuCommand(''); | 22 | 99 |
| 586 | Adobe Property Palette | Window > Properties | ウィンドウ > プロパティ | app.executeMenuCommand('Adobe Property Palette'); | 26 | 99 |
| 587 | Adobe Vector Edge Panel | Window > Mockup (Beta) | ウィンドウ > モックアップ (Beta) | app.executeMenuCommand('Adobe Vector Edge Panel'); | 28.0 | 28.9 |
| 588 | Adobe Vector Edge Panel | Window > Mockup | ウィンドウ > モックアップ | app.executeMenuCommand('Adobe Vector Edge Panel'); | 29.0 | 99.0 |
| 589 | Adobe Learn Panel Menu Item | Window > Learn | ウィンドウ > ラーニング | app.executeMenuCommand('Adobe Learn Panel Menu Item'); | 17 | 25.9 |
| 590 | Adobe LinkPalette Menu Item | Window > Links | ウィンドウ > リンク | app.executeMenuCommand('Adobe LinkPalette Menu Item'); | 16 | 99 |
| 591 | AdobeLayerPalette1 | Window > Layers | ウィンドウ > レイヤー | app.executeMenuCommand('AdobeLayerPalette1'); | 16 | 99 |
| 592 | Adobe Flattening Preview | Window > Flattener Preview | ウィンドウ > 分割・統合プレビュー | app.executeMenuCommand('Adobe Flattening Preview'); | 16 | 99 |
| 593 | Adobe Separation Preview Panel | Window > Separations Preview | ウィンドウ > 分版プレビュー | app.executeMenuCommand('Adobe Separation Preview Panel'); | 16 | 99 |
| 594 | AdobeTransformObjects1 | Window > Transform | ウィンドウ > 変形 | app.executeMenuCommand('AdobeTransformObjects1'); | 16 | 99 |
| 595 | Adobe Variables Palette Menu Item | Window > Variables | ウィンドウ > 変数 | app.executeMenuCommand('Adobe Variables Palette Menu Item'); | 16 | 99 |
| 596 | internal palettes posing as plug-in menus-attributes | Window > Attributes | ウィンドウ > 属性 | app.executeMenuCommand('internal palettes posing as plug-in menus-attributes'); | 16 | 99 |
| 597 | internal palettes posing as plug-in menus-info | Window > Info | ウィンドウ > 情報 | app.executeMenuCommand('internal palettes posing as plug-in menus-info'); | 16 | 99 |
| 598 | AdobeAlignObjects2 | Window > Align | ウィンドウ > 整列 | app.executeMenuCommand('AdobeAlignObjects2'); | 16 | 99 |
| 599 | internal palettes posing as plug-in menus-opentype | Window > Type > OpenType | ウィンドウ > 書式 > OpenType | app.executeMenuCommand('internal palettes posing as plug-in menus-opentype'); | 16 | 99 |
| 600 | internal palettes posing as plug-in menus-tab | Window > Type > Tabs | ウィンドウ > 書式 > タブ | app.executeMenuCommand('internal palettes posing as plug-in menus-tab'); | 16 | 99 |
| 601 | alternate glyph palette plugin 2 | Window > Type > Glyphs | ウィンドウ > 書式 > 字形 | app.executeMenuCommand('alternate glyph palette plugin 2'); | 16 | 99 |
| 602 | internal palettes posing as plug-in menus-character | Window > Type > Character | ウィンドウ > 書式 > 文字 | app.executeMenuCommand('internal palettes posing as plug-in menus-character'); | 16 | 99 |
| 603 | Character Styles | Window > Type > Character Styles | ウィンドウ > 書式 > 文字スタイル | app.executeMenuCommand('Character Styles'); | 16 | 99 |
| 604 | ReflowWindowMenu | Window > Type > Reflow Viewer | ウィンドウ > 書式 > 文字組み更新 | app.executeMenuCommand('ReflowWindowMenu'); | 29.0 | 99.0 |
| 605 | internal palettes posing as plug-in menus-paragraph | Window > Type > Paragraph | ウィンドウ > 書式 > 段落 | app.executeMenuCommand('internal palettes posing as plug-in menus-paragraph'); | 16 | 99 |
| 606 | Adobe Paragraph Styles Palette | Window > Type > Paragraph Styles | ウィンドウ > 書式 > 段落スタイル | app.executeMenuCommand('Adobe Paragraph Styles Palette'); | 16 | 99 |
| 607 | Generate | Window > Generated Variations | ウィンドウ > 生成されたバリエーション | app.executeMenuCommand('Generate'); | 28.6 | 99.0 |
| 608 | Adobe Generative Patterns Panel | Window > Generate Patterns (Beta) | ウィンドウ > 生成パターン (Beta) | app.executeMenuCommand('Adobe Generative Patterns Panel') | 28.6 | 29.4 |
| 609 | Adobe Generative Patterns Panel | Window > Generate Patterns | ウィンドウ > パターンを生成 | app.executeMenuCommand('Adobe Generative Patterns Panel'); | 29.5 | 29.8 |
| 610 | Adobe Stroke Palette | Window > Stroke | ウィンドウ > 線 | app.executeMenuCommand('Adobe Stroke Palette'); | 16 | 99 |
| 611 | AI Magic Wand | Window > Magic Wand | ウィンドウ > 自動選択 | app.executeMenuCommand('AI Magic Wand'); | 16 | 99 |
| 612 | Adobe Transparency Palette Menu Item | Window > Transparency | ウィンドウ > 透明 | app.executeMenuCommand('Adobe Transparency Palette Menu Item'); | 16 | 99 |
| 613 | Adobe Art Style Plugin Other libraries menu item | Window > Graphic Style Libraries > Other Library… | ウィンドウ > グラフィックスタイルライブラリ > その他のライブラリ... | app.executeMenuCommand('Adobe Art Style Plugin Other libraries menu item'); | 16 | 99 |
| 614 | Adobe Symbol Palette Plugin Other libraries menu item | Window > Symbol Libraries > Other Library… | ウィンドウ > シンボルライブラリ > その他のライブラリ... | app.executeMenuCommand('Adobe Symbol Palette Plugin Other libraries menu item'); | 16 | 99 |
| 615 | AdobeSwatch_ Other libraries menu item | Window > Swatch Libraries > Other Library… | ウィンドウ > スウォッチライブラリ > その他のライブラリ... | app.executeMenuCommand('AdobeSwatch_ Other libraries menu item'); | 16.0 | 99.0 |
| 616 | AdobeBrushMgrUI Other libraries menu item | Window > Brush Libraries > Other Library… | ウィンドウ > ブラシライブラリ > その他のライブラリ... | app.executeMenuCommand('AdobeBrushMgrUI Other libraries menu item'); | 16 | 99 |
| 617 | helpcontent | Help > Illustrator Help… | ヘルプ > Illustrator ヘルプ... | app.executeMenuCommand('helpcontent'); | 16 | 99 |
| 618 | about | Help > About Illustrator… | ヘルプ > Illustrator について... | app.executeMenuCommand('about'); | 16 | 99 |
| 619 | about | Illustrator > About Illustrator… | Illustrator > Illustrator について... | app.executeMenuCommand('about'); | 16 | 99 |
| 620 | whatsNewContent | Help > Tutorials... | ヘルプ > チュートリアル... | app.executeMenuCommand('whatsNewContent'); | 27.9 | 99.0 |
| 621 | whatsNewContent | Help > What's New... | ヘルプ > 新機能... | app.executeMenuCommand('whatsNewContent'); | 27.9 | 99.0 |
| 622 | supportCommunity | Help > Support Community | ヘルプ > サポートコミュニティ | app.executeMenuCommand('supportCommunity'); | 26.0 | 99.0 |
| 623 | wishform | Help > Submit Bug/Feature Request… | ヘルプ > バグを送信／機能改善のリクエスト... | app.executeMenuCommand('wishform'); | 25.0 | 99.0 |
| 624 | System Info | Help > System Info… | ヘルプ > システム情報... | app.executeMenuCommand('System Info'); | 16 | 99 |
| 625 | faceSizeUp | Other Text > Point Size Up | その他のテキスト > フォントサイズを大きく (設定値参照) | app.executeMenuCommand('faceSizeUp'); | 29.4 | 99.0 |
| 626 | faceSizeDown | Other Text > Point Size Down | その他のテキスト > フォントサイズを小さく (設定値参照) | app.executeMenuCommand('faceSizeDown'); | 29.4 | 99.0 |
| 627 | sizeStepUp | Other Text > Font Size Step Up | その他のテキスト > フォントサイズを大きく (設定値×5) | app.executeMenuCommand('sizeStepUp'); | 29.4 | 99.0 |
| 628 | sizeStepDown | Other Text > Font Size Step Down | その他のテキスト > フォントサイズを小さく (設定値×5) | app.executeMenuCommand('sizeStepDown'); | 29.4 | 99.0 |
| 629 | ~kernFurther | Other Text > Kern Looser | その他のテキスト > 文字間隔を広く | app.executeMenuCommand('~kernFurther'); | 29.4 | 99.0 |
| 630 | ~kernCloser | Other Text > Kern Tighter | その他のテキスト > 文字間隔を狭く | app.executeMenuCommand('~kernCloser'); | 29.4 | 99.0 |
| 631 | tracking | Other Text > Tracking | その他のテキスト > トラッキング | app.executeMenuCommand('tracking'); | 29.4 | 99.0 |
| 632 | clearTrack | Other Text > Clear Tracking | その他のテキスト > トラッキングを解除 | app.executeMenuCommand('clearTrack'); | 29.4 | 99.0 |
| 633 | spacing | Other Text > Spacing | その他のテキスト > 空白 | app.executeMenuCommand('spacing'); | 29.4 | 99.0 |
| 634 | clearTypeScale | Other Text > Uniform Type | その他のテキスト > 文字の縦横比をリセット | app.executeMenuCommand('clearTypeScale'); | 29.4 | 99.0 |
| 635 | highlightFont | Other Text > Highlight Font | その他のテキスト > フォントを強調表示 | app.executeMenuCommand('highlightFont'); | 29.4 | 99.0 |
| 636 | highlightFont2 | Other Text > Highlight Font (Secondary) | その他のテキスト > フォントを強調表示 (2) | app.executeMenuCommand('highlightFont2'); | 29.4 | 99.0 |
| 637 | leftAlign | Other Text > Left Align Text | その他のテキスト > 左 / 上揃え | app.executeMenuCommand('leftAlign'); | 29.4 | 99.0 |
| 638 | centerAlign | Other Text > Center Text | その他のテキスト > 中央揃え | app.executeMenuCommand('centerAlign'); | 29.4 | 99.0 |
| 639 | rightAlign | Other Text > Right Align Text | その他のテキスト > 右 / 下揃え | app.executeMenuCommand('rightAlign'); | 29.4 | 99.0 |
| 640 | justify | Other Text > Justify Text Left | その他のテキスト > 均等配置 (最終行左 / 上揃え) | app.executeMenuCommand('justify'); | 29.4 | 99.0 |
| 641 | justifyCenter | Other Text > Justify Text Center | その他のテキスト > 均等配置 (最終行中央揃え) | app.executeMenuCommand('justifyCenter'); | 29.4 | 99.0 |
| 642 | justifyRight | Other Text > Justify Text Right | その他のテキスト > 均等配置 (最終行右 / 下揃え) | app.executeMenuCommand('justifyRight'); | 29.4 | 99.0 |
| 643 | justifyAll | Other Text > Justify All Lines | その他のテキスト > 両端揃え | app.executeMenuCommand('justifyAll'); | 29.4 | 99.0 |
| 644 | toggleAutoHyphen | Other Text > Toggle Auto Hyphenation | その他のテキスト > 自動ハイフネーションを切り換え | app.executeMenuCommand('toggleAutoHyphen'); | 29.4 | 99.0 |
| 645 | toggleLineComposer | Other Text > Toggle Line Composer | その他のテキスト > コンポーザーを切り換え | app.executeMenuCommand('toggleLineComposer'); | 29.4 | 99.0 |
| 646 | ~subscript | Other Text > Subscript | その他のテキスト > 下付き文字 | app.executeMenuCommand('~subscript'); | 29.4 | 99.0 |
| 647 | ~superScript | Other Text > Superscript | その他のテキスト > 上付き文字 | app.executeMenuCommand('~superScript'); | 29.4 | 99.0 |
| 648 | ~textBold | Other Text > Bold | その他のテキスト > 太字 | app.executeMenuCommand('~textBold'); | 29.4 | 99.0 |
| 649 | ~textItalic | Other Text > Italic | その他のテキスト > 斜体 | app.executeMenuCommand('~textItalic'); | 29.4 | 99.0 |
| 650 | ~textUnderline | Other Text > Underline | その他のテキスト > 下線 | app.executeMenuCommand('~textUnderline'); | 29.4 | 99.0 |
| 651 | lock2 | Other Object > Lock Others | その他のオブジェクト > 他をロック | app.executeMenuCommand('lock2'); | 29.4 | 99.0 |
| 652 | hide2 | Other Object > Hide Others | その他のオブジェクト > 他を隠す | app.executeMenuCommand('hide2'); | 29.4 | 99.0 |
| 653 | repeatPathfinder | Other Object > Repeat Pathfinder | その他のオブジェクト > パスファインダーの繰り返し | app.executeMenuCommand('repeatPathfinder'); | 29.4 | 99.0 |
| 654 | avgAndJoin | Other Object > Average & Join | その他のオブジェクト > 平均・連結 | app.executeMenuCommand('avgAndJoin'); | 29.4 | 99.0 |
| 655 | enterFocus | Other Object > Isolate Selected Object | その他のオブジェクト > 選択オブジェクト編集モード | app.executeMenuCommand('enterFocus'); | 29.4 | 99.0 |
| 656 | exitFocus | Other Object > Exit Isolation Mode | その他のオブジェクト > 編集モードを終了 | app.executeMenuCommand('exitFocus'); | 29.4 | 99.0 |
| 657 | Adobe New Symbol Shortcut | Other Panel > New Symbol | その他のパネル > 新規シンボル | app.executeMenuCommand('Adobe New Symbol Shortcut'); | 16 | 99 |
| 658 | Adobe Color Palette Secondary | Other Panel > Show Color Panel (Secondary) | その他のパネル > カラーパネルを表示 (2) | app.executeMenuCommand('Adobe Color Palette Secondary'); | 16 | 99 |
| 659 | Adobe Actions Batch | Other Panel > Actions Batch | その他のパネル > アクションバッチ | app.executeMenuCommand('Adobe Actions Batch'); | 16 | 99 |
| 660 | Adobe New Fill Shortcut | Other Panel > Add New Fill | その他のパネル > 新規塗りを追加 | app.executeMenuCommand('Adobe New Fill Shortcut'); | 16 | 99 |
| 661 | Adobe New Stroke Shortcut | Other Panel > Add New Stroke | その他のパネル > 新規線を追加 | app.executeMenuCommand('Adobe New Stroke Shortcut'); | 16 | 99 |
| 662 | Adobe New Style Shortcut | Other Panel > New Graphic Style | その他のパネル > 新規グラフィックスタイル | app.executeMenuCommand('Adobe New Style Shortcut'); | 16 | 99 |
| 663 | AdobeLayerPalette2 | Other Panel > New Layer | その他のパネル > 新規レイヤー | app.executeMenuCommand('AdobeLayerPalette2'); | 16 | 99 |
| 664 | AdobeLayerPalette3 | Other Panel > New Layer with Dialog | その他のパネル > 新規レイヤー (オプション表示) | app.executeMenuCommand('AdobeLayerPalette3'); | 16 | 99 |
| 665 | Adobe Update Link Shortcut | Other Panel > Update Link | その他のパネル > リンクを更新 | app.executeMenuCommand('Adobe Update Link Shortcut'); | 16 | 99 |
| 666 | Adobe New Swatch Shortcut Menu | Other Panel > New Swatch | その他のパネル > 新規スウォッチ | app.executeMenuCommand('Adobe New Swatch Shortcut Menu'); | 16 | 99 |
| 667 | switchSelTool | Other Misc > Switch Units | その他 > 単位を切り換え | app.executeMenuCommand('switchSelTool'); | 29.4 | 99.0 |
| 668 | new2 | Other Misc > New File (No Dialog) | その他 > 新規ファイル (ダイアログなし) | app.executeMenuCommand('new2'); | 29.4 | 99.0 |
| 669 | helpcontent2 | Other Misc > Help (Secondary) | その他 > ヘルプ (2) | app.executeMenuCommand('helpcontent2'); | 29.4 | 99.0 |
| 670 | undo2 | Other Misc > Undo (Secondary) | その他 > 取り消し (2) | app.executeMenuCommand('undo2'); | 29.4 | 99.0 |
| 671 | cut2 | Other Misc > Cut (Secondary) | その他 > カット (2) | app.executeMenuCommand('cut2'); | 29.4 | 99.0 |
| 672 | copy2 | Other Misc > Copy (Secondary) | その他 > コピー (2) | app.executeMenuCommand('copy2'); | 29.4 | 99.0 |
| 673 | paste2 | Other Misc > Paste (Secondary) | その他 > ペースト (2) | app.executeMenuCommand('paste2'); | 29.4 | 99.0 |
| 674 | zoomin2 | Other Misc > Zoom In (Secondary) | その他 > ズームイン (2) | app.executeMenuCommand('zoomin2'); | 29.4 | 99.0 |
| 675 | navigateToNextDocument | Other Misc > Navigate to Next Document | その他 > 次のドキュメントに移動 | app.executeMenuCommand('navigateToNextDocument'); | 29.4 | 99.0 |
| 676 | navigateToPreviousDocument | Other Misc > Navigate to Previous Document | その他 > 前のドキュメントに移動 | app.executeMenuCommand('navigateToPreviousDocument'); | 29.4 | 99.0 |
| 677 | navigateToNextDocumentGroup | Other Misc > Navigate to Next Document Group | その他 > 次のドキュメントグループに移動 | app.executeMenuCommand('navigateToNextDocumentGroup'); | 29.4 | 99.0 |
| 678 | navigateToPreviousDocumentGroup | Other Misc > Navigate to Previous Document Group | その他 > 前のドキュメントグループに移動 | app.executeMenuCommand('navigateToPreviousDocumentGroup'); | 29.4 | 99.0 |
| 679 | ~subscript2 | Other Misc > Subscript (Secondary) | その他 > 下付き文字 (2) | app.executeMenuCommand('~subscript2'); | 29.4 | 99.0 |
| 680 | ~superScript2 | Other Misc > Superscript (Secondary) | その他 > 上付き文字 (2) | app.executeMenuCommand('~superScript2'); | 29.4 | 99.0 |
