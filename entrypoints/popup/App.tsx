import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    browser.storage.local.get('enabled').then((result) => {
      if (result.enabled !== undefined) {
        setEnabled(result.enabled);
      }
    });
  }, []);

  const toggleEnabled = () => {
    const next = !enabled;
    setEnabled(next);
    browser.storage.local.set({ enabled: next });
  };

  return (
    <div className="popup-container">
      <h1 className="popup-title">NGA Alpha</h1>
      <p className="popup-desc">论坛美化插件</p>
      <div className="popup-toggle">
        <span>{enabled ? '已启用' : '已禁用'}</span>
        <button
          className={`toggle-btn ${enabled ? 'active' : ''}`}
          onClick={toggleEnabled}
        >
          {enabled ? 'ON' : 'OFF'}
        </button>
      </div>
      <div className="popup-info">
        <p>卡片布局 / 主题切换 / 去广告</p>
      </div>
    </div>
  );
}

export default App;
