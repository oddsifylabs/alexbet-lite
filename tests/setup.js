/**
 * Test Setup File
 * Global test configuration and mock setup
 */

import { expect, afterEach, beforeEach } from 'vitest';

// ===================================================
// Global Test Setup
// ===================================================

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

global.sessionStorage = sessionStorageMock;

// Mock Notification API
global.Notification = {
  permission: 'granted',
  requestPermission: vi.fn(() => Promise.resolve('granted'))
};

// Mock fetch API
global.fetch = vi.fn();

// Mock Audio API
global.Audio = class {
  constructor() {
    this.src = '';
    this.play = vi.fn();
    this.pause = vi.fn();
  }
};

// Mock Chart.js
global.Chart = vi.fn(() => ({
  update: vi.fn(),
  destroy: vi.fn(),
  resize: vi.fn()
}));

// ===================================================
// Global Test Utilities
// ===================================================

// Setup before each test
beforeEach(() => {
  // Clear all mocks
  vi.clearAllMocks();

  // Reset localStorage
  localStorageMock.getItem.mockReturnValue(null);
  localStorageMock.setItem.mockReturnValue(undefined);
  localStorageMock.removeItem.mockReturnValue(undefined);
  localStorageMock.clear.mockReturnValue(undefined);

  // Reset fetch
  global.fetch.mockClear();
});

// Cleanup after each test
afterEach(() => {
  vi.clearAllMocks();
});

// ===================================================
// Custom Test Matchers
// ===================================================

expect.extend({
  toBeParseable(received) {
    let parsed;
    try {
      parsed = JSON.parse(received);
      return {
        pass: true,
        message: () => `expected ${received} not to be valid JSON`
      };
    } catch (e) {
      return {
        pass: false,
        message: () => `expected ${received} to be valid JSON, but got error: ${e.message}`
      };
    }
  },

  toBeValidEmail(received) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    return {
      pass,
      message: () => 
        pass 
          ? `expected ${received} not to be a valid email`
          : `expected ${received} to be a valid email`
    };
  },

  toBeValidUUID(received) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be a valid UUID`
          : `expected ${received} to be a valid UUID`
    };
  },

  toBeWithinRange(received, min, max) {
    const pass = received >= min && received <= max;
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be within range ${min}-${max}`
          : `expected ${received} to be within range ${min}-${max}`
    };
  }
});

// ===================================================
// Global Test Fixtures
// ===================================================

export const createSampleBet = (overrides = {}) => ({
  id: `bet_${Date.now()}`,
  sport: 'NFL',
  event: 'KC vs SF',
  betType: 'Spread',
  pick: 'KC -3',
  stake: 100,
  entryOdds: -110,
  status: 'PENDING',
  placedDate: new Date(),
  settledDate: null,
  pnl: 0,
  edge: 0,
  notes: '',
  ...overrides
});

export const createSampleBets = (count = 5, overrides = {}) => {
  const bets = [];
  for (let i = 0; i < count; i++) {
    bets.push(createSampleBet({
      id: `bet_${Date.now()}_${i}`,
      ...overrides
    }));
  }
  return bets;
};

export const createMockAnalytics = (bets = []) => ({
  bets,
  getOverallStats: vi.fn(() => ({
    totalBets: bets.length,
    settledBets: bets.filter(b => b.status !== 'PENDING').length,
    pendingBets: bets.filter(b => b.status === 'PENDING').length,
    wins: bets.filter(b => b.status === 'WON').length,
    losses: bets.filter(b => b.status === 'LOST').length,
    pushes: bets.filter(b => b.status === 'PUSH').length,
    winRate: 50,
    totalWagered: 1000,
    totalPnL: 100,
    roi: 10
  })),
  getStatsByBySport: vi.fn(() => ({})),
  getStatsByBetType: vi.fn(() => ({}))
});

export const createMockBetTracker = () => ({
  getBets: vi.fn(() => []),
  getBet: vi.fn(),
  addBet: vi.fn(),
  updateBet: vi.fn(),
  deleteBet: vi.fn(),
  settleBet: vi.fn(),
  filterBets: vi.fn()
});

export const createMockValidator = () => ({
  validateBet: vi.fn(() => ({ isValid: true, errors: [] })),
  validateOdds: vi.fn(() => true),
  validateStake: vi.fn(() => true),
  sanitizeInput: vi.fn((input) => input)
});

export const createMockSecurityManager = () => ({
  sanitizeInput: vi.fn((input) => input),
  generateCSRFToken: vi.fn(() => 'mock-token'),
  validateCSRFToken: vi.fn(() => true),
  detectXSSPatterns: vi.fn(() => ({ detected: false }))
});

export const createMockErrorHandler = () => ({
  handleError: vi.fn(),
  retry: vi.fn(),
  logError: vi.fn(),
  getErrorLog: vi.fn(() => [])
});

// ===================================================
// Utility Functions
// ===================================================

export const waitFor = (fn, options = {}) => {
  const { timeout = 1000, interval = 50 } = options;
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const checkCondition = () => {
      try {
        fn();
        resolve();
      } catch (error) {
        if (Date.now() - startTime > timeout) {
          reject(error);
        } else {
          setTimeout(checkCondition, interval);
        }
      }
    };
    checkCondition();
  });
};

export const flushPromises = () => {
  return new Promise(resolve => setImmediate(resolve));
};
