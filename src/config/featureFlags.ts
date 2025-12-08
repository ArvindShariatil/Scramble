/**
 * Feature Flags Configuration
 * 
 * Controls feature availability via environment variables.
 * Enables/disables Epic 6 unlimited word generation functionality.
 */

export const FEATURE_FLAGS = {
  /**
   * Epic 6: Unlimited Word Generation
   * 
   * When enabled:
   * - Loads Epic 6 components (DatamuseAPI, WordScrambler, AnagramCache)
   * - Shows word mode settings toggle in UI
   * - Enables hybrid/unlimited-only word generation modes
   * 
   * When disabled:
   * - Uses only v2.0.0 curated word set (82 anagrams)
   * - Epic 6 code not loaded (zero bundle impact)
   * - v2.0.0 behavior identical
   */
  EPIC_6_ENABLED: import.meta.env.VITE_EPIC_6_ENABLED === 'true',
  
  /**
   * Canary Rollout Percentage (0-100)
   * Used for gradual production rollout
   */
  CANARY_PERCENTAGE: parseInt(import.meta.env.VITE_CANARY_PERCENTAGE || '0', 10),
  
  /**
   * Application Version
   */
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '2.0.0',
} as const;

/**
 * Type-safe feature flag checker
 */
export function isFeatureEnabled(feature: keyof typeof FEATURE_FLAGS): boolean {
  const value = FEATURE_FLAGS[feature];
  return typeof value === 'boolean' ? value : false;
}
