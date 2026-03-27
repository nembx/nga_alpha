import { useEffect, useState } from 'react';
import './App.css';

type LightThemePalette = 'blue' | 'brown' | 'gray' | 'pink';

const LIGHT_THEME_PALETTE_STORAGE_KEY = 'lightThemePalette';

const COPY = {
  title: 'NGA Alpha',
  desc: '\u8bba\u575b\u7f8e\u5316\u63d2\u4ef6',
  status: '\u63d2\u4ef6\u72b6\u6001',
  enabled: '\u5df2\u542f\u7528',
  disabled: '\u5df2\u7981\u7528',
  paletteTitle: '\u6d45\u8272\u4e3b\u9898\u914d\u8272',
  paletteHint:
    '\u4ec5\u5f71\u54cd\u6d45\u8272\u4e3b\u9898\uff1b\u9875\u9762\u53f3\u4fa7\u6309\u94ae\u5207\u56de\u6d45\u8272\u540e\u751f\u6548\u3002',
  currentPrefix: '\u5f53\u524d\uff1a',
  summary:
    '\u5361\u7247\u5e03\u5c40 / \u4e3b\u9898\u5207\u6362 / \u53bb\u5e7f\u544a',
} as const;

const lightThemePaletteOptions: Array<{
  value: LightThemePalette;
  label: string;
  description: string;
}> = [
  {
    value: 'blue',
    label: '\u6d45\u84dd',
    description: '\u9ed8\u8ba4\u6e05\u723d\u84dd',
  },
  {
    value: 'brown',
    label: '\u6d45\u68d5',
    description: '\u504f\u6696\u7c73\u68d5',
  },
  {
    value: 'gray',
    label: '\u6d45\u7070',
    description: '\u4f4e\u98bd\u4e2d\u6027',
  },
  {
    value: 'pink',
    label: '\u6d45\u7c89',
    description: '\u67d4\u548c\u7c89\u8272',
  },
];

function normalizeLightThemePalette(value: unknown): LightThemePalette {
  if (value === 'brown' || value === 'gray' || value === 'pink') {
    return value;
  }

  return 'blue';
}

function App() {
  const [enabled, setEnabled] = useState(true);
  const [lightThemePalette, setLightThemePalette] =
    useState<LightThemePalette>('blue');

  useEffect(() => {
    browser.storage.local
      .get(['enabled', LIGHT_THEME_PALETTE_STORAGE_KEY])
      .then((result) => {
        if (typeof result.enabled === 'boolean') {
          setEnabled(result.enabled);
        }

        setLightThemePalette(
          normalizeLightThemePalette(result.lightThemePalette),
        );
      });
  }, []);

  const toggleEnabled = () => {
    const next = !enabled;
    setEnabled(next);
    browser.storage.local.set({ enabled: next });
  };

  const updateLightThemePalette = (palette: LightThemePalette) => {
    setLightThemePalette(palette);
    browser.storage.local.set({ [LIGHT_THEME_PALETTE_STORAGE_KEY]: palette });
  };

  const activePalette = lightThemePaletteOptions.find(
    (option) => option.value === lightThemePalette,
  );

  return (
    <div className="popup-container">
      <div className="popup-header">
        <h1 className="popup-title">{COPY.title}</h1>
        <p className="popup-desc">{COPY.desc}</p>
      </div>

      <section className="popup-card popup-toggle">
        <div>
          <p className="card-label">{COPY.status}</p>
          <span className="toggle-state">
            {enabled ? COPY.enabled : COPY.disabled}
          </span>
        </div>
        <button
          type="button"
          className={`toggle-btn ${enabled ? 'active' : ''}`}
          onClick={toggleEnabled}
        >
          {enabled ? 'ON' : 'OFF'}
        </button>
      </section>

      <section className="popup-card">
        <div className="card-head">
          <div>
            <h2 className="card-title">{COPY.paletteTitle}</h2>
            <p className="card-subtitle">
              {COPY.currentPrefix}
              {activePalette?.label}
            </p>
          </div>
        </div>

        <div className="palette-grid">
          {lightThemePaletteOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`palette-option ${
                lightThemePalette === option.value ? 'active' : ''
              }`}
              onClick={() => updateLightThemePalette(option.value)}
              aria-pressed={lightThemePalette === option.value}
            >
              <span className={`palette-swatch palette-${option.value}`} />
              <span className="palette-copy">
                <strong>{option.label}</strong>
                <small>{option.description}</small>
              </span>
            </button>
          ))}
        </div>

        <p className="popup-tip">{COPY.paletteHint}</p>
      </section>

      <p className="popup-summary">{COPY.summary}</p>
    </div>
  );
}

export default App;
