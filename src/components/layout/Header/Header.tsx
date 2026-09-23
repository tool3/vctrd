import { memo } from 'react';
import { Icon, SwatchPicker } from '@/components/common';
import { ACCENT_PRESETS } from '@/lib/accent';
import { useStore } from '@/store';
import styles from './Header.module.scss';

const PRESET_HEXES = ACCENT_PRESETS.map((preset) => preset.hex);

export const Header = memo(function Header() {
  const accent = useStore((s) => s.accent);
  const setAccent = useStore((s) => s.setAccent);

  return (
    <header className={styles.header}>
      <span className={styles.title}>vctrd</span>
      <nav className={styles.nav}>
        <SwatchPicker value={accent} onChange={setAccent} presets={PRESET_HEXES} size={26} ariaLabel="Change the app accent colour" />
        <a href="https://github.com/tool3/vctrfx" target="_blank" rel="noopener noreferrer" aria-label="vctrfx on GitHub">
          <Icon name="github" size={20} />
        </a>
      </nav>
    </header>
  );
});
