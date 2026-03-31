import React, { useState } from 'react';
import { Icon } from './Icon';
import { useSettings } from '../hooks/useSettings';

const openExternal = (url: string) => {
  if ((window as any).__adobe_cep__ && typeof (window as any).CSInterface !== 'undefined') {
    new (window as any).CSInterface().openURLInDefaultBrowser(url);
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
};

const panel: React.CSSProperties = { background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 12 };
const card: React.CSSProperties = { background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 10 };
const label: React.CSSProperties = { fontSize: 10, color: 'var(--color-text-tertiary)' };
const btn: React.CSSProperties = { minHeight: 30, padding: '0 10px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', fontSize: 11, cursor: 'pointer' };
const input: React.CSSProperties = { width: '100%', minHeight: 30, boxSizing: 'border-box', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', fontSize: 12, padding: '6px 10px', outline: 'none' };

type Tab = 'libraries' | 'online' | 'ai';

export const Settings: React.FC = () => {
  const { settings, update } = useSettings();
  const [tab, setTab] = useState<Tab>('libraries');
  const [renamingIndex, setRenamingIndex] = useState<number | null>(null);
  const [renamingValue, setRenamingValue] = useState('');

  const chooseLibraryFolder = () => {
    const cep = (window as any).cep;
    if (!cep?.fs) {
      window.alert('当前环境不支持目录选择。');
      return;
    }
    const result = cep.fs.showOpenDialog(false, true, '选择素材库文件夹', '', null);
    if (result.err !== cep.fs.NO_ERROR || !Array.isArray(result.data) || result.data.length === 0) return;
    const fullPath = String(result.data[0] || '');
    if (!fullPath || settings.libraries.some((entry) => entry.path === fullPath)) return;
    const parts = fullPath.split(/[\\/]/);
    update('libraries', [...settings.libraries, { name: parts[parts.length - 1] || '素材库', path: fullPath }]);
  };

  const commitRename = () => {
    if (renamingIndex === null) return;
    const nextName = renamingValue.trim();
    if (nextName) update('libraries', settings.libraries.map((entry, index) => index === renamingIndex ? { ...entry, name: nextName } : entry));
    setRenamingIndex(null);
    setRenamingValue('');
  };

  const removeLibrary = (index: number) => update('libraries', settings.libraries.filter((_, current) => current !== index));

  const renderLibraries = () => (
    <div style={{ ...panel, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div><div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-primary)' }}>本地素材库</div><div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 4 }}>添加常用素材文件夹，素材库面板会自动读取这些目录。</div></div>
      {settings.libraries.length === 0 ? <div style={{ padding: '16px 12px', textAlign: 'center', border: '1px dashed var(--color-border)', borderRadius: 10, background: 'var(--color-bg-primary)' }}><div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>还没有添加素材库</div><div style={{ ...label, marginTop: 4 }}>建议至少添加一个常用素材文件夹</div></div> : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {settings.libraries.map((library, index) => <div key={library.path + index} style={{ ...card, display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 24, height: 24, borderRadius: 8, background: 'rgba(255,207,77,0.16)', color: '#FFCF4D', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="folder" size={12} /></div><div style={{ flex: 1, minWidth: 0 }}>{renamingIndex === index ? <input type="text" value={renamingValue} onChange={(event) => setRenamingValue(event.target.value)} onBlur={commitRename} onKeyDown={(event) => { if (event.key === 'Enter') commitRename(); if (event.key === 'Escape') { setRenamingIndex(null); setRenamingValue(''); } }} autoFocus style={input} /> : <div onDoubleClick={() => { setRenamingIndex(index); setRenamingValue(library.name); }} title="双击重命名" style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', cursor: 'text' }}>{library.name}</div>}<div style={{ ...label, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }} title={library.path}>{library.path}</div></div><button type="button" onClick={() => removeLibrary(index)} style={{ ...btn, minHeight: 26, padding: '0 8px', color: 'var(--color-error)', background: 'rgba(227,72,80,0.10)' }}>删除</button></div>)}
      </div>}
      <button type="button" onClick={chooseLibraryFolder} style={{ ...btn, background: 'var(--color-accent)', color: '#fff', border: '1px solid transparent' }}>添加素材库文件夹</button>
    </div>
  );

  const renderOnline = () => {
    const providers = [
      { key: 'pexels' as const, label: 'Pexels API Key', href: 'https://www.pexels.com/api/', placeholder: '输入 Pexels API Key' },
      { key: 'pixabay' as const, label: 'Pixabay API Key', href: 'https://pixabay.com/api/docs/', placeholder: '输入 Pixabay API Key' },
    ];

    return (
      <div style={{ ...panel, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div><div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-primary)' }}>在线图库 API</div><div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 4 }}>配置后可在素材库面板中直接搜索在线图片。</div></div>
        {providers.map((item) => (
          <div key={item.key} style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-primary)' }}>{item.label}</div>
                <div style={{ ...label, marginTop: 2 }}>点右侧按钮可打开官方申请页面。</div>
              </div>
              <button type="button" onClick={() => openExternal(item.href)} style={{ ...btn, minHeight: 26, padding: '0 8px', fontSize: 10 }}>获取 Key</button>
            </div>
            <input
              type="password"
              placeholder={item.placeholder}
              value={settings.apiKeys[item.key]}
              onChange={(event) => update('apiKeys', { ...settings.apiKeys, [item.key]: event.target.value })}
              style={input}
            />
          </div>
        ))}
      </div>
    );
  };

  const renderAI = () => (
    <div style={{ ...panel, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div><div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-primary)' }}>AI 默认参数</div><div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 4 }}>作为 AI 增强面板的默认值，不影响单次手动覆盖。</div></div>
      <div style={card}><div style={{ ...label, marginBottom: 6 }}>默认放大倍率</div><div style={{ display: 'flex', gap: 8 }}>{[2, 4].map((scale) => <button key={scale} type="button" onClick={() => update('ai', { ...settings.ai, defaultScale: scale as 2 | 4 })} style={{ ...btn, flex: 1, background: settings.ai.defaultScale === scale ? 'rgba(38,128,235,0.10)' : 'var(--color-bg-primary)', border: `1px solid ${settings.ai.defaultScale === scale ? 'var(--color-accent)' : 'var(--color-border)'}`, color: settings.ai.defaultScale === scale ? 'var(--color-accent)' : 'var(--color-text-primary)' }}>{scale}x</button>)}</div></div>
      <div style={card}><div style={{ ...label, marginBottom: 6 }}>默认降噪强度</div><select value={settings.ai.defaultDenoiseLevel} onChange={(event) => update('ai', { ...settings.ai, defaultDenoiseLevel: event.target.value as 'none' | 'low' | 'medium' | 'high' })} style={input}><option value="none">无</option><option value="low">低</option><option value="medium">中</option><option value="high">高</option></select></div>
      <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}><div><div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-primary)' }}>Alpha Matting</div><div style={{ ...label, marginTop: 2 }}>边缘更细致，但处理速度会更慢。</div></div><button type="button" onClick={() => update('ai', { ...settings.ai, alphaMatting: !settings.ai.alphaMatting })} style={{ width: 34, height: 20, borderRadius: 999, border: 'none', position: 'relative', background: settings.ai.alphaMatting ? 'var(--color-accent)' : 'var(--color-bg-active)', cursor: 'pointer' }}><span style={{ position: 'absolute', top: 2, left: settings.ai.alphaMatting ? 17 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.18s ease' }} /></button></div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '2px 0 8px' }}>
      <div style={{ ...panel, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 30, height: 30, borderRadius: 10, background: 'linear-gradient(135deg, #1aa3ff 0%, #0066cc 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}><Icon name="settings" size={14} /></div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>插件设置</div>
            <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>素材库路径、在线图库 API 和 AI 默认参数。</div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, background: 'var(--color-bg-tertiary)', borderRadius: 10, padding: 3 }}>{([{ key: 'libraries', label: '本地素材', icon: 'folder' }, { key: 'online', label: '在线图库', icon: 'image' }, { key: 'ai', label: 'AI 默认值', icon: 'sparkle' }] as const).map((item) => <button key={item.key} type="button" onClick={() => setTab(item.key)} style={{ flex: 1, minHeight: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: 'none', borderRadius: 8, background: tab === item.key ? 'var(--color-bg-primary)' : 'transparent', color: tab === item.key ? 'var(--color-accent)' : 'var(--color-text-secondary)', fontSize: 11, fontWeight: tab === item.key ? 700 : 500, cursor: 'pointer' }}><Icon name={item.icon} size={12} />{item.label}</button>)}</div>
      {tab === 'libraries' && renderLibraries()}
      {tab === 'online' && renderOnline()}
      {tab === 'ai' && renderAI()}
      <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--color-text-tertiary)', paddingBottom: 4 }}>HopeFlow v3.1.2 · Illustrator Panel Settings</div>
    </div>
  );
};
