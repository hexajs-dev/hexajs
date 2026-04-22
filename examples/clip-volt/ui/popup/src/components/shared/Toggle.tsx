type ToggleProps = { checked: boolean; onChange: (value: boolean) => void };

export function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <button className={`cv-switch${checked ? ' cv-switch-on' : ''}`} onClick={() => onChange(!checked)} role="switch" aria-checked={checked}>
      <span className="cv-switch-thumb" />
    </button>
  );
}
