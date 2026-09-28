import { setMode } from '@stencil/core';
export default function () {
  // Check if setMode is available before calling it
  if (typeof setMode === 'function') {
    setMode(elm => {
      elm.setAttribute('mode', 'urban');
      return 'urban';
    });
  } else {
    // Ensure the mode is set for runtime getMode() calls
    // This is for components that call getMode(this.el) at runtime
    const html = document.documentElement;

    // Set mode attribute for getMode() to work correctly
    html.setAttribute('mode', 'urban');

    // Set data attribute for additional compatibility
    html.setAttribute('data-mode', 'urban');
  }
}
