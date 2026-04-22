type StorageSectionProps = { maxItems: number; onMaxItemsChange: (value: number) => void };

export function StorageSection({ maxItems, onMaxItemsChange }: StorageSectionProps) {
  const sliderProgress = `${((maxItems - 10) / (500 - 10)) * 100}%`;

  return (
    <section className="cv-section">
      <h2 className="cv-section-title">STORAGE</h2>
      <div className="cv-panel">
        <div className="cv-storage-row">
          <span className="cv-storage-label">Max saved items</span>
          <span className="cv-storage-value">{maxItems}</span>
        </div>
        <div className="cv-slider-wrap">
          <input type="range" className="cv-slider" min={10} max={500} step={10} value={maxItems} style={{ '--cv-slider-progress': sliderProgress } as any} onChange={event => onMaxItemsChange(Number(event.target.value))} />
          <div className="cv-slider-labels">
            <span>10</span>
            <span>500</span>
          </div>
        </div>
      </div>
    </section>
  );
}
