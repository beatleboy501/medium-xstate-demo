import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import EnhancedApp from './EnhancedApp';

// Check URL parameter to determine which version to show
const urlParams = new URLSearchParams(window.location.search);
const version = urlParams.get('version');

const AppToRender = version === 'enhanced' ? EnhancedApp : App;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppToRender />
  </React.StrictMode>
);
