import React from 'react';

const DemoSwitcher = () => {
  const currentVersion = new URLSearchParams(window.location.search).get('version');
  
  const switchToOriginal = () => {
    window.location.href = window.location.pathname;
  };
  
  const switchToEnhanced = () => {
    window.location.href = window.location.pathname + '?version=enhanced';
  };
  
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '20px',
      zIndex: 1001,
      background: 'rgba(0, 0, 0, 0.8)',
      padding: '15px',
      borderRadius: '8px',
      color: 'white'
    }}>
      <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Demo Version</h4>
      <div>
        <button
          onClick={switchToOriginal}
          style={{
            background: currentVersion !== 'enhanced' ? '#4CAF50' : '#666',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px',
            fontSize: '12px'
          }}
        >
          Original
        </button>
        <button
          onClick={switchToEnhanced}
          style={{
            background: currentVersion === 'enhanced' ? '#4CAF50' : '#666',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Enhanced
        </button>
      </div>
      <p style={{ 
        margin: '10px 0 0 0', 
        fontSize: '11px', 
        opacity: 0.8,
        maxWidth: '200px'
      }}>
        {currentVersion === 'enhanced' 
          ? 'Enhanced: localStorage, async ops, parent/child machines'
          : 'Original: Basic XState demo'
        }
      </p>
    </div>
  );
};

export default DemoSwitcher;
