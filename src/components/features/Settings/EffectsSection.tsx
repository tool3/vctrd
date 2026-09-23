import { memo, useState, type ReactNode } from 'react';
import { Button, ColorPicker, Icon, NumberSlider, Select, Toggle } from '@/components/common';
import {
  EFFECTS,
  EFFECT_GROUPS,
  LOOKS,
  createEffect,
  expandLook,
  findEffect,
  groupStack,
  isAnimatable,
  isTuned,
  reorderInGroup,
  reorderRuns,
  resolveParams,
  type Control,
  type ControlValue,
  type EffectConfig,
} from '@/lib/effects';
import { useStore } from '@/store';
import type { EffectName } from 'vctrfx';
import { useDragLists, type DragLists } from './useDragLists';
import styles from './EffectsSection.module.scss';
import settings from './Settings.module.scss';

const EffectControl = memo(function EffectControl({
  control,
  value,
  onChange,
}: {
  control: Control;
  value: ControlValue | undefined;
  onChange: (next: ControlValue) => void;
}) {
  switch (control.type) {
    case 'number':
      return (
        <NumberSlider
          label={control.label}
          value={typeof value === 'number' ? value : control.default}
          onChange={onChange}
          min={control.min}
          max={control.max}
          step={control.step}
          suffix={control.suffix}
        />
      );
    case 'boolean':
      return <Toggle label={control.label} checked={typeof value === 'boolean' ? value : control.default} onChange={onChange} />;
    case 'color':
      return (
        <ColorPicker label={control.label} value={typeof value === 'string' ? value : control.default} onChange={onChange} fullWidth />
      );
    case 'optionalColor':
      return (
        <ColorPicker
          label={control.label}
          value={typeof value === 'string' ? value : ''}
          onChange={(next) => onChange(next === '' ? null : next)}
          placeholder="none"
          fullWidth
        />
      );
    case 'enum':
      return (
        <Select
          label={control.label}
          value={typeof value === 'string' ? value : control.default}
          onChange={onChange}
          options={control.options.map((option) => ({ value: option, label: option }))}
          fullWidth
        />
      );
  }
});

const GripIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
    {[2, 5, 8].flatMap((cy) =>
      [3.5, 6.5].map((cx) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="0.9" fill="currentColor" />),
    )}
  </svg>
);

const DragHandle = ({ label, drag, list, index }: { label: string; drag: DragLists; list: string; index: number }) => (
  <span
    className={styles.dragHandle}
    role="button"
    tabIndex={-1}
    aria-label={`Drag to reorder ${label}`}
    title="Drag to reorder"
    {...drag.handleProps(list, index)}
  >
    <GripIcon />
  </span>
);

const rowClass = (base: string | undefined, drag: DragLists, list: string, index: number, extra: string | undefined = ''): string =>
  [base, extra, drag.isDragging(list, index) ? styles.rowDragging : '', drag.isOver(list, index) ? styles.rowDropTarget : '']
    .filter(Boolean)
    .join(' ');

interface EffectRowProps {
  entry: EffectConfig;
  nested?: boolean;
  open: boolean;
  onToggleOpen: () => void;
  drag: DragLists;
  dragList: string;
  dragIndex: number;
  onEnabled: (value: boolean) => void;
  onRemove: () => void;
  onParam: (key: string, value: ControlValue) => void;
  onReset: () => void;
}

const EffectRow = memo(function EffectRow({
  entry,
  nested = false,
  open,
  onToggleOpen,
  drag,
  dragList,
  dragIndex,
  onEnabled,
  onRemove,
  onParam,
  onReset,
}: EffectRowProps) {
  const descriptor = findEffect(entry.id);
  if (!descriptor) return null;
  const params = resolveParams(descriptor, entry.params);
  const tuned = isTuned(entry);
  const count = descriptor.controls.length;
  const animated = params.animate === true;

  return (
    <li className={rowClass(styles.row, drag, dragList, dragIndex, nested ? styles.rowNested : '')} {...drag.rowProps(dragList, dragIndex)}>
      <div className={styles.rowHead}>
        <DragHandle label={descriptor.label} drag={drag} list={dragList} index={dragIndex} />
        <Toggle checked={entry.enabled} onChange={onEnabled} aria-label={`Enable ${descriptor.label}`} />
        <button
          type="button"
          className={`${styles.rowName} ${open ? styles.rowNameOpen : ''}`}
          onClick={onToggleOpen}
          disabled={count === 0}
          aria-expanded={open}
        >
          <span className={styles.rowLabel}>{descriptor.label}</span>
          <span className={styles.rowMeta}>
            {animated ? 'animated · ' : ''}
            {tuned ? 'edited' : `${count} setting${count === 1 ? '' : 's'}`}
          </span>
        </button>
        <div className={styles.rowActions}>
          <Button variant="ghost" size="sm" icon="x" onClick={onRemove} aria-label={`Remove ${descriptor.label}`} />
        </div>
      </div>

      {open && (
        <div className={styles.params}>
          <p className={styles.paramsDesc}>{descriptor.description}</p>
          {descriptor.controls.map((control) => (
            <EffectControl key={control.key} control={control} value={params[control.key]} onChange={(v) => onParam(control.key, v)} />
          ))}
          {tuned && (
            <button type="button" className={styles.reset} onClick={onReset}>
              {entry.group ? `Reset to ${entry.group.label} values` : 'Reset to defaults'}
            </button>
          )}
        </div>
      )}
    </li>
  );
});

interface LookRowProps {
  label: string;
  count: number;
  enabled: boolean;
  animatable: boolean;
  animated: boolean;
  open: boolean;
  onToggleOpen: () => void;
  onEnabled: (value: boolean) => void;
  onAnimate: (value: boolean) => void;
  onRemove: () => void;
  drag: DragLists;
  dragIndex: number;
  children: ReactNode;
}

const LookRow = ({
  label,
  count,
  enabled,
  animatable,
  animated,
  open,
  onToggleOpen,
  onEnabled,
  onAnimate,
  onRemove,
  drag,
  dragIndex,
  children,
}: LookRowProps) => (
  <li className={rowClass(styles.group, drag, 'root', dragIndex)} {...drag.rowProps('root', dragIndex)}>
    <div className={styles.groupHead}>
      <DragHandle label={label} drag={drag} list="root" index={dragIndex} />
      <Toggle checked={enabled} onChange={onEnabled} aria-label={`Enable ${label}`} />
      <button type="button" className={`${styles.rowName} ${open ? styles.rowNameOpen : ''}`} onClick={onToggleOpen} aria-expanded={open}>
        <span className={styles.groupChevron} aria-hidden>
          {open ? '▾' : '▸'}
        </span>
        <span className={styles.rowLabel}>{label}</span>
        <span className={styles.rowMeta}>
          Look · {count} effects{animated ? ' · animated' : ''}
        </span>
      </button>
      <div className={styles.rowActions}>
        <Button variant="ghost" size="sm" icon="x" onClick={onRemove} aria-label={`Remove ${label}`} />
      </div>
    </div>

    {open && (
      <ul className={styles.groupChildren}>
        {animatable && (
          <li className={styles.groupMotion}>
            <Toggle checked={animated} onChange={onAnimate} label="Animate this look" />
          </li>
        )}
        {children}
      </ul>
    )}
  </li>
);

function RenderSettings() {
  const pipeline = useStore((s) => s.pipeline);
  const setPipeline = useStore((s) => s.setPipeline);

  return (
    <div className={styles.library}>
      <span className={styles.groupName}>Render</span>
      <div className={settings.seedRow}>
        <label className={settings.inlineLabel} htmlFor="vctrd-seed">
          Seed
        </label>
        <input
          id="vctrd-seed"
          className={settings.seedInput}
          value={pipeline.seed}
          onChange={(event) => setPipeline({ seed: event.target.value })}
          spellCheck={false}
          autoComplete="off"
        />
        <Button
          variant="ghost"
          size="sm"
          icon="dice"
          onClick={() => setPipeline({ seed: crypto.randomUUID().slice(0, 6) })}
          aria-label="Reroll seed"
          title="Reroll grain, glitch and other random choices"
        />
      </div>
      <Toggle checked={pipeline.animate} onChange={(animate) => setPipeline({ animate })} label="Allow motion" />
      <Toggle
        checked={pipeline.clip === 'shape'}
        onChange={(shape) => setPipeline({ clip: shape ? 'shape' : 'none' })}
        label="Keep the artwork's shape"
      />
      <Toggle
        checked={pipeline.scope === 'canvas'}
        onChange={(canvas) => setPipeline({ scope: canvas ? 'canvas' : 'artwork' })}
        label="Apply effects to the background too"
      />
    </div>
  );
}

export const EffectsSection = memo(function EffectsSection() {
  const stack = useStore((s) => s.effects);
  const setEffects = useStore((s) => s.setEffects);
  const [openUid, setOpenUid] = useState<string | null>(null);
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const add = (id: EffectName) => {
    const entry = createEffect(id);
    setEffects([...stack, entry]);
    if ((findEffect(id)?.controls.length ?? 0) > 0) setOpenUid(entry.uid);
  };

  const addLook = (lookId: string) => {
    const look = LOOKS.find((l) => l.id === lookId);
    if (!look) return;
    const entries = expandLook(look);
    setEffects([...stack, ...entries]);
    setOpenGroup(entries[0]?.group?.uid ?? null);
  };

  const update = (uid: string, patch: Partial<EffectConfig>) =>
    setEffects(stack.map((entry) => (entry.uid === uid ? { ...entry, ...patch } : entry)));

  const remove = (uid: string) => setEffects(stack.filter((entry) => entry.uid !== uid));

  const drag = useDragLists((list, from, to) =>
    setEffects(list === 'root' ? reorderRuns(stack, from, to) : reorderInGroup(stack, list, from, to)),
  );

  const updateGroup = (groupUid: string, patch: (entry: EffectConfig) => EffectConfig) =>
    setEffects(stack.map((entry) => (entry.group?.uid === groupUid ? patch(entry) : entry)));

  const setParam = (entry: EffectConfig, key: string, value: ControlValue) =>
    update(entry.uid, { params: { ...entry.params, [key]: value } });

  const rowFor = (entry: EffectConfig, list: string, index: number, nested: boolean) => (
    <EffectRow
      key={entry.uid}
      entry={entry}
      nested={nested}
      open={openUid === entry.uid}
      onToggleOpen={() => setOpenUid(openUid === entry.uid ? null : entry.uid)}
      drag={drag}
      dragList={list}
      dragIndex={index}
      onEnabled={(enabled) => update(entry.uid, { enabled })}
      onRemove={() => remove(entry.uid)}
      onParam={(key, value) => setParam(entry, key, value)}
      onReset={() => update(entry.uid, { params: { ...(entry.baseline ?? {}) } })}
    />
  );

  return (
    <div className={styles.wrap}>
      <div className={styles.stackHead}>
        <span className={styles.stackTitle}>Stack{stack.length > 0 ? ` · ${stack.length}` : ''}</span>
        {stack.length > 0 && (
          <button type="button" className={styles.clear} onClick={() => setEffects([])}>
            Clear all
          </button>
        )}
      </div>

      {stack.length === 0 ? (
        <p className={styles.empty}>Nothing applied. Add a Look for a whole recipe, or a single effect — they stack in order, top to bottom.</p>
      ) : (
        <ul className={styles.rows}>
          {groupStack(stack).map((run, runIndex) =>
            run.kind === 'effect' ? (
              rowFor(run.entry, 'root', runIndex, false)
            ) : (
              <LookRow
                key={run.uid}
                label={run.label}
                count={run.entries.length}
                enabled={run.entries.some((entry) => entry.enabled)}
                animatable={run.entries.some((entry) => isAnimatable(entry.id))}
                animated={run.entries.some((entry) => entry.params.animate === true)}
                open={openGroup === run.uid}
                onToggleOpen={() => setOpenGroup(openGroup === run.uid ? null : run.uid)}
                onEnabled={(enabled) => updateGroup(run.uid, (entry) => ({ ...entry, enabled }))}
                onAnimate={(animate) =>
                  updateGroup(run.uid, (entry) => (isAnimatable(entry.id) ? { ...entry, params: { ...entry.params, animate } } : entry))
                }
                onRemove={() => setEffects(stack.filter((entry) => entry.group?.uid !== run.uid))}
                drag={drag}
                dragIndex={runIndex}
              >
                {run.entries.map((entry, childIndex) => rowFor(entry, run.uid, childIndex, true))}
              </LookRow>
            ),
          )}
        </ul>
      )}

      <div className={styles.library}>
        <div className={styles.libGroup}>
          <span className={styles.groupName}>
            Looks
            <span className={styles.groupNote}>added as editable effects</span>
          </span>
          <div className={styles.chips}>
            {LOOKS.map((look) => (
              <button
                key={look.id}
                type="button"
                className={`${styles.chip} ${styles.chipLook}`}
                onClick={() => addLook(look.id)}
                title={`${look.description} — ${look.recipe.length} effects`}
              >
                {look.label}
              </button>
            ))}
          </div>
        </div>

        {EFFECT_GROUPS.map((group) => (
          <div key={group} className={styles.libGroup}>
            <span className={styles.groupName}>{group}</span>
            <div className={styles.chips}>
              {EFFECTS.filter((descriptor) => descriptor.group === group).map((descriptor) => (
                <button
                  key={descriptor.id}
                  type="button"
                  className={styles.chip}
                  onClick={() => add(descriptor.id)}
                  title={descriptor.description}
                >
                  {isAnimatable(descriptor.id) && <Icon name="film" size={10} className={styles.chipIcon} />}
                  {descriptor.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <RenderSettings />
    </div>
  );
});
