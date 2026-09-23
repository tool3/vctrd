import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon, type IconName } from '@/components/common';
import { ArtworkSection } from '@/components/features/Settings/ArtworkSection';
import { BackgroundSection } from '@/components/features/Settings/BackgroundSection';
import { EffectsSection } from '@/components/features/Settings/EffectsSection';
import { ExportSection } from '@/components/features/Settings/ExportSection';
import { PaddingSection } from '@/components/features/Settings/PaddingSection';
import { PresetSelector } from '@/components/features/Settings/PresetSelector';
import { useExport } from '@/hooks/useExport';
import type { RenderView } from '@/hooks/useRender';
import styles from './Toolbar.module.scss';

type ToolbarTab = 'preset' | 'background' | 'effects' | 'artwork' | 'padding' | 'export';

const MENU_ITEMS: ReadonlyArray<{ id: ToolbarTab; label: string; icon: IconName; wide: boolean }> = [
  { id: 'preset', label: 'Preset', icon: 'palette', wide: true },
  { id: 'background', label: 'BG', icon: 'image', wide: true },
  { id: 'effects', label: 'Effects', icon: 'sparkles', wide: true },
  { id: 'artwork', label: 'Artwork', icon: 'frame', wide: false },
  { id: 'padding', label: 'Padding', icon: 'padding', wide: false },
  { id: 'export', label: 'Export', icon: 'download', wide: false },
];

const MOBILE_PAGES: readonly (readonly ToolbarTab[])[] = [
  ['preset', 'background', 'effects', 'artwork'],
  ['padding', 'export'],
];

const TITLES: Record<ToolbarTab, string> = {
  preset: 'Presets',
  background: 'Background',
  effects: 'Effects',
  artwork: 'Artwork',
  padding: 'Padding',
  export: 'Export',
};

interface PopoverProps {
  anchor: HTMLElement;
  wide: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

const GAP = 12;
const EDGE = 16;

function ToolbarPopover({ anchor, wide, title, onClose, children }: PopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const bar = anchor.closest(`.${styles.toolbar}`) ?? anchor.closest(`.${styles.mobilePill}`) ?? anchor;
  const barRect = bar.getBoundingClientRect();
  const anchorRect = anchor.getBoundingClientRect();
  const width = Math.min(wide ? 360 : 320, window.innerWidth - EDGE * 2);
  const centered = anchorRect.left + anchorRect.width / 2 - width / 2;
  const left = Math.max(EDGE, Math.min(centered, window.innerWidth - EDGE - width));
  const bottom = window.innerHeight - barRect.top + GAP;

  useEffect(() => {
    const opened = performance.now();
    const onPointerDown = (event: PointerEvent) => {
      if (performance.now() - opened < 50) return;
      const target = event.target as Node;
      if (popoverRef.current?.contains(target) || anchor.contains(target)) return;
      if (target instanceof Element && target.closest('[data-popover-portal]')) return;
      onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [anchor, onClose]);

  return createPortal(
    <div
      ref={popoverRef}
      className={styles.popover}
      style={{ bottom, left, width, maxHeight: `calc(100dvh - ${window.innerHeight - barRect.top + GAP + EDGE}px)` }}
      role="dialog"
      aria-label={title}
    >
      <div className={styles.popoverInner}>
        <div className={styles.popoverTitle}>{title}</div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function Toolbar({ render }: { render: RenderView }) {
  const [active, setActive] = useState<{ tab: ToolbarTab; anchor: HTMLElement } | null>(null);
  const [mobilePage, setMobilePage] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const exporter = useExport();
  const close = useCallback(() => setActive(null), []);
  const size = render.output ? { width: render.output.width, height: render.output.height } : null;

  const toggle = (tab: ToolbarTab, anchor: HTMLElement) => setActive((current) => (current?.tab === tab ? null : { tab, anchor }));

  const renderItem = (item: (typeof MENU_ITEMS)[number]) => (
    <button
      key={item.id}
      type="button"
      className={`${styles.item} ${active?.tab === item.id ? styles.itemActive : ''}`}
      onClick={(event) => toggle(item.id, event.currentTarget)}
      aria-expanded={active?.tab === item.id}
    >
      <span className={styles.itemIcon}>
        <Icon name={item.icon} size={18} />
      </span>
      <span className={styles.itemLabel}>{item.label}</span>
    </button>
  );

  const content = (tab: ToolbarTab): ReactNode => {
    switch (tab) {
      case 'preset':
        return <PresetSelector />;
      case 'background':
        return <BackgroundSection size={size} />;
      case 'effects':
        return <EffectsSection />;
      case 'artwork':
        return <ArtworkSection size={size} />;
      case 'padding':
        return <PaddingSection />;
      case 'export':
        return <ExportSection render={render} status={exporter.status} onDownload={exporter.download} onCopy={exporter.copy} />;
    }
  };

  const quickDownload = (
    <>
      <span className={styles.itemIcon}>
        {exporter.status.kind === 'working' ? <span className={styles.spinner} /> : <Icon name={exporter.status.kind === 'done' ? 'check' : 'download'} size={18} />}
      </span>
      <span className={styles.itemLabel}>Save</span>
    </>
  );

  const activeItem = MENU_ITEMS.find((item) => item.id === active?.tab);

  return (
    <>
      <div className={styles.desktopBar}>
        <div className={styles.toolbar}>
          {MENU_ITEMS.map(renderItem)}
          <div className={styles.divider} />
          <button
            type="button"
            className={styles.item}
            onClick={exporter.download}
            disabled={!render.output || exporter.status.kind === 'working'}
            title="Download with the current export settings"
          >
            {quickDownload}
          </button>
        </div>
      </div>

      <div className={styles.mobileBar}>
        <div className={styles.mobileColumn}>
          <div className={styles.mobilePill}>
            <div
              className={styles.mobilePillScroll}
              ref={scrollRef}
              onScroll={(event) => setMobilePage(Math.round(event.currentTarget.scrollLeft / event.currentTarget.offsetWidth))}
            >
              <div className={styles.mobileTrack}>
                {MOBILE_PAGES.map((page, index) => (
                  <div key={index} className={styles.mobilePage}>
                    {page.flatMap((id) => MENU_ITEMS.filter((item) => item.id === id)).map(renderItem)}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className={styles.dots}>
            {MOBILE_PAGES.map((_, index) => (
              <button
                key={index}
                type="button"
                className={`${styles.dot} ${index === mobilePage ? styles.dotActive : ''}`}
                onClick={() => scrollRef.current?.scrollTo({ left: index * scrollRef.current.offsetWidth, behavior: 'smooth' })}
                aria-label={`Toolbar page ${index + 1}`}
              />
            ))}
          </div>
        </div>
        <button
          type="button"
          className={styles.mobileAction}
          onClick={exporter.download}
          disabled={!render.output || exporter.status.kind === 'working'}
          aria-label="Download"
        >
          {exporter.status.kind === 'working' ? (
            <span className={styles.spinner} />
          ) : (
            <Icon name={exporter.status.kind === 'done' ? 'check' : 'download'} size={18} />
          )}
        </button>
      </div>

      {active && activeItem && (
        <ToolbarPopover key={active.tab} anchor={active.anchor} wide={activeItem.wide} title={TITLES[active.tab]} onClose={close}>
          {content(active.tab)}
        </ToolbarPopover>
      )}
    </>
  );
}
