import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

// ── Suppress all console output ───────────────────────────────
const _noop = () => {};
const _origLog   = console.log.bind(console);
console.log      = _noop;
console.warn     = _noop;
console.error    = _noop;
console.info     = _noop;
console.debug    = _noop;
console.table    = _noop;
console.group    = _noop;
console.groupCollapsed = _noop;
console.groupEnd = _noop;
console.time     = _noop;
console.timeEnd  = _noop;
console.trace    = _noop;
console.assert   = _noop;

// ── Signature (printed once after page clears React noise) ────
setTimeout(() => {
  window.console.clear();
  _origLog("Built with Love by Khetesh Deore");
//   _origLog(`
// ██████╗ ██╗   ██╗██╗██╗  ████████╗
// ██╔══██╗██║   ██║██║██║  ╚══██╔══╝
// ██████╔╝██║   ██║██║██║     ██║
// ██╔══██╗██║   ██║██║██║     ██║
// ██████╔╝╚██████╔╝██║███████╗██║
// ╚═════╝  ╚═════╝ ╚═╝╚══════╝╚═╝

// ██╗    ██╗██╗████████╗██╗  ██╗
// ██║    ██║██║╚══██╔══╝██║  ██║
// ██║ █╗ ██║██║   ██║   ███████║
// ██║███╗██║██║   ██║   ██╔══██║
// ╚███╔███╔╝██║   ██║   ██║  ██║
//  ╚══╝╚══╝ ╚═╝   ╚═╝   ╚═╝  ╚═╝

// ██╗      ██████╗ ██╗   ██╗███████╗
// ██║     ██╔═══██╗██║   ██║██╔════╝
// ██║     ██║   ██║██║   ██║█████╗
// ██║     ██║   ██║╚██╗ ██╔╝██╔══╝
// ███████╗╚██████╔╝ ╚████╔╝ ███████╗
// ╚══════╝ ╚═════╝   ╚═══╝  ╚══════╝

// ██████╗ ██╗   ██╗
// ██╔══██╗╚██╗ ██╔╝
// ██████╔╝ ╚████╔╝
// ██╔══██╗  ╚██╔╝
// ██████╔╝   ██║
// ╚═════╝    ╚═╝

// ██╗  ██╗██╗  ██╗███████╗████████╗███████╗███████╗██╗  ██╗
// ██║ ██╔╝██║  ██║██╔════╝╚══██╔══╝██╔════╝██╔════╝██║  ██║
// █████╔╝ ███████║█████╗     ██║   █████╗  ███████╗███████║
// ██╔═██╗ ██╔══██║██╔══╝     ██║   ██╔══╝  ╚════██║██╔══██║
// ██║  ██╗██║  ██║███████╗   ██║   ███████╗███████║██║  ██║
// ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝╚═╝  ╚═╝

// ██████╗ ███████╗ ██████╗ ██████╗ ███████╗
// ██╔══██╗██╔════╝██╔═══██╗██╔══██╗██╔════╝
// ██║  ██║█████╗  ██║   ██║██████╔╝█████╗
// ██║  ██║██╔══╝  ██║   ██║██╔══██╗██╔══╝
// ██████╔╝███████╗╚██████╔╝██║  ██║███████╗
// ╚═════╝ ╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝
// `);
 }, 200);

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1 } }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
