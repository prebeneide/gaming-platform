"use client";

import { useState, useEffect } from 'react';
import { UserPreferences } from '@/lib/formatting';

// Default preferences
const DEFAULT_PREFERENCES: UserPreferences = {
  currency: 'USD',
  timezone: 'UTC',
  locale: 'en-US',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12',
  language: 'en',
};

export function useUserPreferences(userId?: string) {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simplified: Always use default preferences since we only support USD
  useEffect(() => {
    setLoading(false);
    setPreferences(DEFAULT_PREFERENCES);
  }, [userId]);

  // Update preferences (simplified - only update local state since we only support USD)
  const updatePreferences = async (newPreferences: Partial<UserPreferences>) => {
    // Only update timezone, locale, dateFormat, timeFormat - currency is always USD
    const updatedPreferences = {
      ...DEFAULT_PREFERENCES,
      ...newPreferences,
      currency: 'USD', // Always USD
    };
    setPreferences(updatedPreferences);
  };

  return {
    preferences,
    updatePreferences,
    loading,
    error,
  };
}
