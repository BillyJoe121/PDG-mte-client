import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(cleanup);

vi.mock('sonner', () => ({
  Toaster: () => null,
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
}

// Screens are prefetched while the browser is idle; tests never reach that moment,
// so rendering the layout does not import every page in the background.
if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'undefined') {
  window.requestIdleCallback = (() => 0) as unknown as typeof window.requestIdleCallback;
}
