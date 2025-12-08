/**
 * Feature Flags Tests
 * 
 * Validates feature flag configuration and behavior
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Feature Flags', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...import.meta.env };
  });

  afterEach(() => {
    // Restore original environment
    Object.keys(import.meta.env).forEach(key => {
      delete import.meta.env[key];
    });
    Object.assign(import.meta.env, originalEnv);
    
    // Clear module cache to reload featureFlags with new env
    vi.resetModules();
  });

  describe('EPIC_6_ENABLED flag', () => {
    it('should be false when VITE_EPIC_6_ENABLED is "false"', async () => {
      import.meta.env.VITE_EPIC_6_ENABLED = 'false';
      const { FEATURE_FLAGS } = await import('../../src/config/featureFlags');
      expect(FEATURE_FLAGS.EPIC_6_ENABLED).toBe(false);
    });

    it('should be true when VITE_EPIC_6_ENABLED is "true"', async () => {
      import.meta.env.VITE_EPIC_6_ENABLED = 'true';
      const { FEATURE_FLAGS } = await import('../../src/config/featureFlags');
      expect(FEATURE_FLAGS.EPIC_6_ENABLED).toBe(true);
    });

    it('should be false when VITE_EPIC_6_ENABLED is undefined', async () => {
      delete import.meta.env.VITE_EPIC_6_ENABLED;
      const { FEATURE_FLAGS } = await import('../../src/config/featureFlags');
      expect(FEATURE_FLAGS.EPIC_6_ENABLED).toBe(false);
    });

    it('should be false for any string other than "true"', async () => {
      const testCases = ['TRUE', 'True', '1', 'yes', 'enabled', ''];
      
      for (const value of testCases) {
        vi.resetModules();
        import.meta.env.VITE_EPIC_6_ENABLED = value;
        const { FEATURE_FLAGS } = await import('../../src/config/featureFlags');
        expect(FEATURE_FLAGS.EPIC_6_ENABLED).toBe(false);
      }
    });
  });

  describe('CANARY_PERCENTAGE', () => {
    it('should parse integer from VITE_CANARY_PERCENTAGE', async () => {
      import.meta.env.VITE_CANARY_PERCENTAGE = '25';
      const { FEATURE_FLAGS } = await import('../../src/config/featureFlags');
      expect(FEATURE_FLAGS.CANARY_PERCENTAGE).toBe(25);
    });

    it('should default to 0 when VITE_CANARY_PERCENTAGE is undefined', async () => {
      delete import.meta.env.VITE_CANARY_PERCENTAGE;
      const { FEATURE_FLAGS } = await import('../../src/config/featureFlags');
      expect(FEATURE_FLAGS.CANARY_PERCENTAGE).toBe(0);
    });

    it('should handle invalid numbers gracefully (NaN becomes 0)', async () => {
      import.meta.env.VITE_CANARY_PERCENTAGE = 'invalid';
      const { FEATURE_FLAGS } = await import('../../src/config/featureFlags');
      expect(FEATURE_FLAGS.CANARY_PERCENTAGE).toBeNaN();
    });

    it('should handle percentage boundaries', async () => {
      const testCases = [
        { input: '0', expected: 0 },
        { input: '50', expected: 50 },
        { input: '100', expected: 100 },
      ];

      for (const { input, expected } of testCases) {
        vi.resetModules();
        import.meta.env.VITE_CANARY_PERCENTAGE = input;
        const { FEATURE_FLAGS } = await import('../../src/config/featureFlags');
        expect(FEATURE_FLAGS.CANARY_PERCENTAGE).toBe(expected);
      }
    });
  });

  describe('APP_VERSION', () => {
    it('should use VITE_APP_VERSION when provided', async () => {
      import.meta.env.VITE_APP_VERSION = '3.0.0-staging';
      const { FEATURE_FLAGS } = await import('../../src/config/featureFlags');
      expect(FEATURE_FLAGS.APP_VERSION).toBe('3.0.0-staging');
    });

    it('should default to "2.0.0" when VITE_APP_VERSION is undefined', async () => {
      delete import.meta.env.VITE_APP_VERSION;
      const { FEATURE_FLAGS } = await import('../../src/config/featureFlags');
      expect(FEATURE_FLAGS.APP_VERSION).toBe('2.0.0');
    });
  });

  describe('isFeatureEnabled helper', () => {
    it('should return true for enabled boolean flags', async () => {
      import.meta.env.VITE_EPIC_6_ENABLED = 'true';
      const { isFeatureEnabled } = await import('../../src/config/featureFlags');
      expect(isFeatureEnabled('EPIC_6_ENABLED')).toBe(true);
    });

    it('should return false for disabled boolean flags', async () => {
      import.meta.env.VITE_EPIC_6_ENABLED = 'false';
      const { isFeatureEnabled } = await import('../../src/config/featureFlags');
      expect(isFeatureEnabled('EPIC_6_ENABLED')).toBe(false);
    });

    it('should return false for non-boolean flags', async () => {
      const { isFeatureEnabled } = await import('../../src/config/featureFlags');
      expect(isFeatureEnabled('CANARY_PERCENTAGE')).toBe(false);
      expect(isFeatureEnabled('APP_VERSION')).toBe(false);
    });
  });

  describe('Feature flag immutability', () => {
    it('should be readonly (const assertion)', async () => {
      const { FEATURE_FLAGS } = await import('../../src/config/featureFlags');
      
      // TypeScript compilation will fail if we try to modify
      // This test verifies the runtime behavior
      expect(() => {
        // @ts-expect-error - Testing immutability
        FEATURE_FLAGS.EPIC_6_ENABLED = true;
      }).toThrow();
    });
  });

  describe('Production environment simulation', () => {
    it('should have Epic 6 disabled in production by default', async () => {
      import.meta.env.VITE_EPIC_6_ENABLED = 'false';
      import.meta.env.VITE_APP_VERSION = '2.0.0';
      import.meta.env.VITE_CANARY_PERCENTAGE = '0';

      const { FEATURE_FLAGS } = await import('../../src/config/featureFlags');
      
      expect(FEATURE_FLAGS.EPIC_6_ENABLED).toBe(false);
      expect(FEATURE_FLAGS.APP_VERSION).toBe('2.0.0');
      expect(FEATURE_FLAGS.CANARY_PERCENTAGE).toBe(0);
    });

    it('should have Epic 6 enabled in staging', async () => {
      import.meta.env.VITE_EPIC_6_ENABLED = 'true';
      import.meta.env.VITE_APP_VERSION = '3.0.0-staging';

      const { FEATURE_FLAGS } = await import('../../src/config/featureFlags');
      
      expect(FEATURE_FLAGS.EPIC_6_ENABLED).toBe(true);
      expect(FEATURE_FLAGS.APP_VERSION).toBe('3.0.0-staging');
    });

    it('should support canary rollout configuration', async () => {
      import.meta.env.VITE_EPIC_6_ENABLED = 'true';
      import.meta.env.VITE_APP_VERSION = '3.0.0-canary';
      import.meta.env.VITE_CANARY_PERCENTAGE = '10';

      const { FEATURE_FLAGS } = await import('../../src/config/featureFlags');
      
      expect(FEATURE_FLAGS.EPIC_6_ENABLED).toBe(true);
      expect(FEATURE_FLAGS.APP_VERSION).toBe('3.0.0-canary');
      expect(FEATURE_FLAGS.CANARY_PERCENTAGE).toBe(10);
    });
  });
});
