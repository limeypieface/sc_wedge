/**
 * Vitest Setup File
 *
 * Configures the test environment for React components and hooks.
 */

import React from 'react';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Add Jest compatibility - expose vi as jest global for tests using jest.fn()
(globalThis as any).jest = vi;

// Cleanup after each test and manage portal container
beforeEach(() => {
  // Create portal container for Radix UI components (dialogs, popovers, etc.)
  const portalRoot = document.createElement('div');
  portalRoot.setAttribute('id', 'radix-portal');
  document.body.appendChild(portalRoot);
});

afterEach(() => {
  cleanup();
  // Remove portal container
  const portalRoot = document.getElementById('radix-portal');
  if (portalRoot) {
    document.body.removeChild(portalRoot);
  }
});

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) =>
    React.createElement('a', { href, ...props }, children),
}));

// Mock @react-pdf/renderer for PDF components
vi.mock('@react-pdf/renderer', () => ({
  Document: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'pdf-document' }, children),
  Page: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'pdf-page' }, children),
  Text: ({ children }: { children: React.ReactNode }) =>
    React.createElement('span', { 'data-testid': 'pdf-text' }, children),
  View: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'pdf-view' }, children),
  Image: ({ src }: { src: string }) =>
    React.createElement('img', { src, 'data-testid': 'pdf-image' }),
  StyleSheet: { create: <T extends Record<string, unknown>>(styles: T) => styles },
  Font: { register: vi.fn() },
  pdf: vi.fn(),
  PDFDownloadLink: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'pdf-download-link' }, children),
  usePDF: () => [{ loading: false, error: null, url: null }, vi.fn()],
}));

// Mock recharts for chart components
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'responsive-container', style: { width: '100%', height: '100%' } }, children),
  AreaChart: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'area-chart' }, children),
  BarChart: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'bar-chart' }, children),
  LineChart: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'line-chart' }, children),
  PieChart: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'pie-chart' }, children),
  ComposedChart: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'composed-chart' }, children),
  Area: () => React.createElement('div', { 'data-testid': 'chart-area' }),
  Bar: () => React.createElement('div', { 'data-testid': 'chart-bar' }),
  Line: () => React.createElement('div', { 'data-testid': 'chart-line' }),
  Pie: () => React.createElement('div', { 'data-testid': 'chart-pie' }),
  Cell: () => React.createElement('div', { 'data-testid': 'chart-cell' }),
  XAxis: () => React.createElement('div', { 'data-testid': 'chart-xaxis' }),
  YAxis: () => React.createElement('div', { 'data-testid': 'chart-yaxis' }),
  CartesianGrid: () => React.createElement('div', { 'data-testid': 'chart-grid' }),
  Tooltip: () => React.createElement('div', { 'data-testid': 'chart-tooltip' }),
  Legend: () => React.createElement('div', { 'data-testid': 'chart-legend' }),
  ReferenceLine: () => React.createElement('div', { 'data-testid': 'chart-reference-line' }),
}));

// Mock framer-motion for animation components
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement('div', props, children),
    span: ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement('span', props, children),
    button: ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement('button', props, children),
    ul: ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement('ul', props, children),
    li: ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement('li', props, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  useAnimation: () => ({ start: vi.fn(), stop: vi.fn() }),
  useMotionValue: (initial: number) => ({ get: () => initial, set: vi.fn() }),
  useTransform: () => ({ get: () => 0 }),
}));

// Mock window.matchMedia for components that use it
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(window as unknown as { ResizeObserver: typeof ResizeObserverMock }).ResizeObserver = ResizeObserverMock;

// Mock IntersectionObserver
class IntersectionObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(window as unknown as { IntersectionObserver: typeof IntersectionObserverMock }).IntersectionObserver = IntersectionObserverMock;

// Mock Element.scrollIntoView for Radix Select
Element.prototype.scrollIntoView = vi.fn();

// Mock pointer capture APIs for Radix Select
Element.prototype.hasPointerCapture = vi.fn().mockReturnValue(false);
Element.prototype.setPointerCapture = vi.fn();
Element.prototype.releasePointerCapture = vi.fn();
