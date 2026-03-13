import { registerRemotes } from '@module-federation/enhanced/runtime';
import { configureQuantumUI } from '@vritti/quantum-ui';
import React from 'react';
import ReactDOM from 'react-dom/client';
import quantumUIConfig from '../quantum-ui.config';
import App from './App';
import { ALL_REMOTES } from './config/remotes.config';

import './index.css';

// Configure quantum-ui BEFORE rendering to ensure proper session recovery
configureQuantumUI(quantumUIConfig);

/**
 * Register all remote micro-frontends at startup
 * This allows the host to dynamically load routes from all remotes
 */
registerRemotes(
  ALL_REMOTES.map((remote) => ({
    name: remote.name,
    entry: remote.entry,
  })),
);

const rootEl = document.getElementById('root');
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
