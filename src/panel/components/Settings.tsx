import React, { useState } from 'react';
import { Icon } from './Icon';
import { useSettings } from '../hooks/useSettings';
import { APP_VERSION } from '../../version';

const openExternal = (url: string) => {
  if ((window as any).__adobe_cep__ && typeof (window as any).CSInterface !== 'undefined') {
    new (window as any).CSInterface().openURLInDefaultBrowser(url);
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
};

const card: React.CSSProperties = { background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 10 };
const label: React.CSSProperties = { fontSize: 10, color: 'var(--color-text-tertiary)' };
const btn: React.CSSProperties = { minHeight: 30, padding: '0 10px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', fontSize: 11, cursor: 'pointer' };
const input: React.CSSProperties = { width: '100%', minHeight: 30, boxSizing: 'border-box', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', fontSize: 12, padding: '6px 10px', outline: 'none' };
const divider: React.CSSProperties = { height: 1, background: 'var(--color-border)', margin: '4px 0 10px' };

type Page = 'settings' | 'about' | 'donate';
type Section = 'libraries' | 'online' | 'ai';

export const Settings: React.FC = () => {
  const { settings, update } = useSettings();
  const [page, setPage] = useState<Page>('settings');
  const [openSections, setOpenSections] = useState<Set<Section>>(new Set(['libraries']));
  const [renamingIndex, setRenamingIndex] = useState<number | null>(null);
  const [renamingValue, setRenamingValue] = useState('');

  const toggleSection = (section: Section) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section); else next.add(section);
      return next;
    });
  };

  const chooseLibraryFolder = () => {
    const cep = (window as any).cep;
    if (!cep?.fs) { window.alert('当前环境不支持目录选择。'); return; }
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

  const removeLibrary = (index: number) => update('libraries', settings.libraries.filter((_, i) => i !== index));

  const Accordion = ({ id, icon, iconBg, title, desc, children }: {
    id: Section; icon: string; iconBg: string; title: string; desc: string; children: React.ReactNode;
  }) => {
    const isOpen = openSections.has(id);
    return (
      <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
        <button
          type="button"
          onClick={() => toggleSection(id)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
        >
          <div style={{ width: 30, height: 30, borderRadius: 9, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
            <Icon name={icon} size={14} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)' }}>{title}</div>
            <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 1 }}>{desc}</div>
          </div>
          <svg viewBox="0 0 24 24" width={14} height={14} fill="none"
            style={{ color: 'var(--color-text-tertiary)', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.18s ease', flexShrink: 0 }}>
            <polyline stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points="9 18 15 12 9 6" />
          </svg>
        </button>
        {isOpen && (
          <div style={{ padding: '0 14px 14px' }}>
            <div style={divider} />
            {children}
          </div>
        )}
      </div>
    );
  };

  const renderLibrariesContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {settings.libraries.length === 0
        ? <div style={{ padding: '14px 12px', textAlign: 'center', border: '1px dashed var(--color-border)', borderRadius: 10 }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>还没有添加素材库</div>
            <div style={{ ...label, marginTop: 4 }}>建议至少添加一个常用素材文件夹</div>
          </div>
        : settings.libraries.map((library, index) => (
            <div key={library.path + index} style={{ ...card, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: 7, background: 'rgba(255,207,77,0.16)', color: '#FFCF4D', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="folder" size={12} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {renamingIndex === index
                  ? <input type="text" value={renamingValue} onChange={(e) => setRenamingValue(e.target.value)} onBlur={commitRename}
                      onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') { setRenamingIndex(null); setRenamingValue(''); } }}
                      autoFocus style={input} />
                  : <div onDoubleClick={() => { setRenamingIndex(index); setRenamingValue(library.name); }} title="双击重命名"
                      style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', cursor: 'text' }}>{library.name}</div>
                }
                <div style={{ ...label, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }} title={library.path}>{library.path}</div>
              </div>
              <button type="button" onClick={() => removeLibrary(index)} style={{ ...btn, minHeight: 26, padding: '0 8px', color: 'var(--color-error)', background: 'rgba(227,72,80,0.10)', border: 'none' }}>删除</button>
            </div>
          ))
      }
      <button type="button" onClick={chooseLibraryFolder} style={{ ...btn, background: 'var(--color-accent)', color: '#fff', border: '1px solid transparent' }}>
        添加素材库文件夹
      </button>
    </div>
  );

  const renderOnlineContent = () => {
    const providers = [
      { key: 'pexels' as const, label: 'Pexels API Key', href: 'https://www.pexels.com/api/', placeholder: '输入 Pexels API Key' },
      { key: 'pixabay' as const, label: 'Pixabay API Key', href: 'https://pixabay.com/api/docs/', placeholder: '输入 Pixabay API Key' },
    ];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {providers.map((item) => (
          <div key={item.key} style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-primary)' }}>{item.label}</div>
                <div style={{ ...label, marginTop: 2 }}>点右侧按钮可打开官方申请页面。</div>
              </div>
              <button type="button" onClick={() => openExternal(item.href)} style={{ ...btn, minHeight: 26, padding: '0 8px', fontSize: 10 }}>获取 Key</button>
            </div>
            <input type="password" placeholder={item.placeholder} value={settings.apiKeys[item.key]}
              onChange={(e) => update('apiKeys', { ...settings.apiKeys, [item.key]: e.target.value })} style={input} />
          </div>
        ))}
      </div>
    );
  };

  const renderAIContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={card}>
        <div style={{ ...label, marginBottom: 6 }}>默认放大倍率</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[2, 4].map((scale) => (
            <button key={scale} type="button" onClick={() => update('ai', { ...settings.ai, defaultScale: scale as 2 | 4 })}
              style={{ ...btn, flex: 1, background: settings.ai.defaultScale === scale ? 'rgba(38,128,235,0.10)' : 'var(--color-bg-primary)', border: `1px solid ${settings.ai.defaultScale === scale ? 'var(--color-accent)' : 'var(--color-border)'}`, color: settings.ai.defaultScale === scale ? 'var(--color-accent)' : 'var(--color-text-primary)' }}>
              {scale}x
            </button>
          ))}
        </div>
      </div>
      <div style={card}>
        <div style={{ ...label, marginBottom: 6 }}>默认放大模式</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {([{ key: 'basic', label: '快速' }, { key: 'realesrgan', label: '高质量' }] as const).map((item) => (
            <button key={item.key} type="button" onClick={() => update('ai', { ...settings.ai, defaultUpscaleEngine: item.key })}
              style={{ ...btn, flex: 1, background: (settings.ai.defaultUpscaleEngine || 'basic') === item.key ? 'rgba(38,128,235,0.10)' : 'var(--color-bg-primary)', border: `1px solid ${(settings.ai.defaultUpscaleEngine || 'basic') === item.key ? 'var(--color-accent)' : 'var(--color-border)'}`, color: (settings.ai.defaultUpscaleEngine || 'basic') === item.key ? 'var(--color-accent)' : 'var(--color-text-primary)' }}>
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div style={card}>
        <div style={{ ...label, marginBottom: 6 }}>默认降噪强度</div>
        <select value={settings.ai.defaultDenoiseLevel} onChange={(e) => update('ai', { ...settings.ai, defaultDenoiseLevel: e.target.value as any })} style={input}>
          <option value="none">无</option><option value="low">低</option><option value="medium">中</option><option value="high">高</option>
        </select>
      </div>
      <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-primary)' }}>Alpha Matting</div>
          <div style={{ ...label, marginTop: 2 }}>边缘更细致，但处理速度会更慢。</div>
        </div>
        <button type="button" onClick={() => update('ai', { ...settings.ai, alphaMatting: !settings.ai.alphaMatting })}
          style={{ width: 34, height: 20, borderRadius: 999, border: 'none', position: 'relative', background: settings.ai.alphaMatting ? 'var(--color-accent)' : 'var(--color-bg-active)', cursor: 'pointer', flexShrink: 0 }}>
          <span style={{ position: 'absolute', top: 2, left: settings.ai.alphaMatting ? 17 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.18s ease' }} />
        </button>
      </div>
    </div>
  );

 
  
  const renderAbout = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <button type="button" onClick={() => setPage('settings')} style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', color: 'var(--color-accent)', fontSize: 11, cursor: 'pointer', padding: '2px 0 6px' }}>
        <svg viewBox="0 0 24 24" width={13} height={13} fill="none"><polyline stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points="15 18 9 12 15 6" /></svg>
        返回设置
      </button>
      <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: 20, textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #1aa3ff 0%, #0066cc 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 16px rgba(26,163,255,0.30)' }}>
          <Icon name="sparkle" size={26} />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.3px' }}>HopeFlow Toolbox</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 3 }}>v{APP_VERSION} · Adobe Illustrator 插件</div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.6, maxWidth: 220 }}>
          专为设计师打造的 Illustrator 效率工具集，涵盖排料优化、AI 增强、素材管理、批量导出等 100+ 项功能。
        </div>
      </div>

      <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px 6px', fontSize: 10, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>开发者</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px 12px' }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0, fontSize: 14, fontWeight: 800 }}>H</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)' }}>hanshaoUi</div>
            <div style={{ ...label, marginTop: 2 }}>sayloveyouless@gmail.com</div>
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px 6px', fontSize: 10, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>链接</div>
        {[
          { icon: 'code', label: '问题反馈 / GitHub Issues', url: 'https://github.com/hanshaoUi/hopeflow-toolbox/issues' },
          { icon: 'file-text', label: '使用文档', url: 'https://github.com/hanshaoUi/hopeflow-toolbox#readme' },
        ].map((item, i, arr) => (
          <button key={item.url} type="button" onClick={() => openExternal(item.url)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: 'none', borderTop: i > 0 ? '1px solid var(--color-border)' : 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', ...(i === arr.length - 1 ? { paddingBottom: 12 } : {}) }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(38,128,235,0.10)', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={item.icon} size={12} />
            </div>
            <div style={{ flex: 1, fontSize: 11, color: 'var(--color-text-primary)' }}>{item.label}</div>
            <Icon name="chevron-right" size={11} color="var(--color-text-tertiary)" />
          </button>
        ))}
      </div>

      <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--color-text-tertiary)', lineHeight: 1.7, paddingBottom: 4 }}>
        © 2024–2025 hanshaoUi · 保留所有权利<br />本插件仅供个人学习与设计使用
      </div>
    </div>
  );

  const renderDonate = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <button type="button" onClick={() => setPage('settings')} style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', color: 'var(--color-accent)', fontSize: 11, cursor: 'pointer', padding: '2px 0 6px' }}>
        <svg viewBox="0 0 24 24" width={13} height={13} fill="none"><polyline stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points="15 18 9 12 15 6" /></svg>
        返回设置
      </button>
      <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 12, textAlign: 'center', padding: 20 }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>☕</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 6 }}>请开发者喝杯咖啡</div>
        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          插件完全免费，如果它帮你节省了时间，<br />欢迎打赏支持，让我持续更新与维护。
        </div>
      </div>

      <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 12, display: 'flex', gap: 10 }}>
        {[
          { emoji: '💚', name: '微信支付', color: '#07C160', hint: '微信扫码' },
          { emoji: '💙', name: '支付宝', color: '#1677FF', hint: '支付宝扫码' },
        ].map((item) => (
          <div key={item.name} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ ...card, width: '100%', minHeight: 90, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <span style={{ fontSize: 28 }}>{item.emoji}</span>
              <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)', textAlign: 'center', lineHeight: 1.4 }}>{item.hint}<br/>（联系开发者获取）</div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: item.color }}>{item.name}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px 6px', fontSize: 10, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>其他支持方式</div>
        {[
          { emoji: '⭐', label: '在 GitHub 给项目点 Star', url: 'https://github.com/hanshaoUi/hopeflow-toolbox' },
          { emoji: '📢', label: '推荐给你的设计师朋友', url: '' },
          { emoji: '🐛', label: '提交 Bug 或功能建议', url: 'https://github.com/hanshaoUi/hopeflow-toolbox/issues' },
        ].map((item, i) => (
          <div key={item.label} onClick={() => item.url && openExternal(item.url)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderTop: i > 0 ? '1px solid var(--color-border)' : 'none', cursor: item.url ? 'pointer' : 'default' }}>
            <span style={{ fontSize: 15, width: 24, textAlign: 'center' }}>{item.emoji}</span>
            <div style={{ flex: 1, fontSize: 11, color: 'var(--color-text-primary)' }}>{item.label}</div>
            {item.url && <Icon name="chevron-right" size={11} color="var(--color-text-tertiary)" />}
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--color-text-tertiary)', lineHeight: 1.7, paddingBottom: 4 }}>
        感谢每一位使用者 ❤️<br />你的支持是持续开发的最大动力
      </div>
    </div>
  );

  const NavRow = ({ icon, iconBg, title, desc, onClick }: {
    icon: string; iconBg: string; title: string; desc: string; onClick: () => void;
  }) => (
    <button type="button" onClick={onClick}
      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}>
      <div style={{ width: 30, height: 30, borderRadius: 9, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
        <Icon name={icon} size={14} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)' }}>{title}</div>
        <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 1 }}>{desc}</div>
      </div>
      <svg viewBox="0 0 24 24" width={14} height={14} fill="none" style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }}>
        <polyline stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points="9 18 15 12 9 6" />
      </svg>
    </button>
  );

  const renderSettings = () => (
    <>
      <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 30, height: 30, borderRadius: 10, background: 'linear-gradient(135deg, #1aa3ff 0%, #0066cc 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
            <Icon name="settings" size={14} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>插件设置</div>
            <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>HopeFlow v{APP_VERSION}</div>
          </div>
        </div>
      </div>

      <Accordion id="libraries" icon="folder" iconBg="linear-gradient(135deg, #FFCF4D 0%, #f0a500 100%)" title="本地素材库" desc={`${settings.libraries.length} 个文件夹`}>
        {renderLibrariesContent()}
      </Accordion>

      <Accordion id="online" icon="image" iconBg="linear-gradient(135deg, #26a3ff 0%, #1a7fe0 100%)" title="在线图库 API" desc="Pexels · Pixabay">
        {renderOnlineContent()}
      </Accordion>

      <Accordion id="ai" icon="sparkle" iconBg="linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)" title="AI 默认参数" desc={`${settings.ai.defaultScale}x · ${settings.ai.defaultUpscaleEngine === 'realesrgan' ? '高质量' : '快速'}`}>
        {renderAIContent()}
      </Accordion>

      <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
        <NavRow icon="info" iconBg="linear-gradient(135deg, #34c759 0%, #28a745 100%)" title="关于" desc={`HopeFlow v${APP_VERSION}`} onClick={() => setPage('about')} />
        <div style={{ height: 1, background: 'var(--color-border)', margin: '0 14px' }} />
        <NavRow icon="heart" iconBg="linear-gradient(135deg, #ff6b6b 0%, #e53935 100%)" title="赞赏开发者" desc="请我喝杯咖啡 ☕" onClick={() => setPage('donate')} />
      </div>
    </>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '2px 0 8px' }}>
      {page === 'settings' && renderSettings()}
      {page === 'about' && renderAbout()}
      {page === 'donate' && renderDonate()}
    </div>
  );
};
