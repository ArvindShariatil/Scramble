// Utility functions
// This module will contain storage helpers, analytics, and common utilities

// Placeholder - will be implemented in SCRAM-014
export class Analytics {
  constructor() {
    console.log('Analytics initialized - placeholder');
  }
  
  track(event: string, properties: Record<string, any> = {}) {
    console.log(`Analytics event: ${event}`, properties);
  }
}

// Storage helpers - localStorage/sessionStorage utilities
export class StorageHelper {
  static save(key: string, value: any) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }
  
  static load(key: string) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
      return null;
    }
  }
  
  static remove(key: string) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  }
}