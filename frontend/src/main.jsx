import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

// ── Save originals before suppressing ────────────────────────
const _noop = () => {};
const _origLog   = console.log.bind(console);
const _origClear = console.clear.bind(console);

// ── Suppress all console output ──────────────────────────────
console.log            = _noop;
console.warn           = _noop;
console.error          = _noop;
console.info           = _noop;
console.debug          = _noop;
console.table          = _noop;
console.group          = _noop;
console.groupCollapsed = _noop;
console.groupEnd       = _noop;
console.time           = _noop;
console.timeEnd        = _noop;
console.trace          = _noop;
console.assert         = _noop;

// ── Signature — survives terser because called via saved ref ─
setTimeout(function () {
  _origClear();
  _origLog('Built with love by Khetesh Deore ()');
}, 200);

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1 } }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
