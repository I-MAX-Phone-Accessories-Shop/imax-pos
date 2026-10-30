import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Stop the mouse wheel from changing number inputs (prices, quantities, amounts).
// Browsers change a focused <input type="number"> when you scroll over it, so we
// blur it first: the value stays as typed and the page scrolls normally.
document.addEventListener(
  'wheel',
  (event) => {
    const target = event.target;
    if (
      target instanceof HTMLInputElement &&
      target.type === 'number' &&
      target === document.activeElement
    ) {
      target.blur();
    }
  },
  { passive: true, capture: true }
);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);