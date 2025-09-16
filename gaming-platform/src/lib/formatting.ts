// Utility functions for formatting dates, times, and currency based on user preferences

export interface UserPreferences {
  currency: string;
  timezone: string;
  locale: string;
  dateFormat: string;
  timeFormat: string;
  country?: string;
  language: string;
}

// Currency configuration
export const CURRENCY_CONFIG = {
  USD: { symbol: '$', code: 'USD', name: 'US Dollar' },
  EUR: { symbol: '€', code: 'EUR', name: 'Euro' },
  GBP: { symbol: '£', code: 'GBP', name: 'British Pound' },
  NOK: { symbol: 'kr', code: 'NOK', name: 'Norwegian Krone' },
} as const;

// Timezone configuration for common countries
export const COUNTRY_TIMEZONES = {
  'US': 'America/New_York',
  'GB': 'Europe/London', 
  'NO': 'Europe/Oslo',
  'DE': 'Europe/Berlin',
  'FR': 'Europe/Paris',
  'ES': 'Europe/Madrid',
  'IT': 'Europe/Rome',
  'CA': 'America/Toronto',
  'AU': 'Australia/Sydney',
  'JP': 'Asia/Tokyo',
  'CN': 'Asia/Shanghai',
  'IN': 'Asia/Kolkata',
  'BR': 'America/Sao_Paulo',
  'MX': 'America/Mexico_City',
  'RU': 'Europe/Moscow',
} as const;

// Locale configuration for common countries
export const COUNTRY_LOCALES = {
  'US': 'en-US',
  'GB': 'en-GB',
  'NO': 'no-NO',
  'DE': 'de-DE',
  'FR': 'fr-FR',
  'ES': 'es-ES',
  'IT': 'it-IT',
  'CA': 'en-CA',
  'AU': 'en-AU',
  'JP': 'ja-JP',
  'CN': 'zh-CN',
  'IN': 'en-IN',
  'BR': 'pt-BR',
  'MX': 'es-MX',
  'RU': 'ru-RU',
} as const;

// Default currency for countries
export const COUNTRY_CURRENCIES = {
  'US': 'USD',
  'GB': 'GBP',
  'NO': 'NOK',
  'DE': 'EUR',
  'FR': 'EUR',
  'ES': 'EUR',
  'IT': 'EUR',
  'CA': 'USD',
  'AU': 'USD',
  'JP': 'USD', // Could be JPY if we add it later
  'CN': 'USD', // Could be CNY if we add it later
  'IN': 'USD', // Could be INR if we add it later
  'BR': 'USD', // Could be BRL if we add it later
  'MX': 'USD', // Could be MXN if we add it later
  'RU': 'USD', // Could be RUB if we add it later
} as const;

/**
 * Format currency amount based on user preferences
 */
export function formatCurrency(amount: number, preferences: UserPreferences, fromCurrency: string = 'USD'): string {
  const currency = CURRENCY_CONFIG[preferences.currency as keyof typeof CURRENCY_CONFIG];
  if (!currency) {
    return `${amount} ${preferences.currency}`;
  }

  // Convert amount to user's preferred currency
  const convertedAmount = convertCurrency(amount, fromCurrency, preferences.currency);

  // Format number with appropriate decimal places
  const formattedAmount = new Intl.NumberFormat(preferences.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(convertedAmount);

  // Add currency symbol
  if (preferences.currency === 'NOK') {
    return `${formattedAmount} ${currency.symbol}`;
  } else {
    return `${currency.symbol}${formattedAmount}`;
  }
}

/**
 * Format date based on user preferences
 */
export function formatDate(date: Date | string, preferences: UserPreferences): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Convert to user's timezone
  const timezoneDate = new Date(dateObj.toLocaleString("en-US", {timeZone: preferences.timezone}));
  
  const options: Intl.DateTimeFormatOptions = {
    timeZone: preferences.timezone,
  };

  // Apply date format preference
  switch (preferences.dateFormat) {
    case 'MM/DD/YYYY':
      options.year = 'numeric';
      options.month = '2-digit';
      options.day = '2-digit';
      break;
    case 'DD/MM/YYYY':
      options.year = 'numeric';
      options.month = '2-digit';
      options.day = '2-digit';
      break;
    case 'YYYY-MM-DD':
      options.year = 'numeric';
      options.month = '2-digit';
      options.day = '2-digit';
      break;
    default:
      options.year = 'numeric';
      options.month = '2-digit';
      options.day = '2-digit';
  }

  let formatted = new Intl.DateTimeFormat(preferences.locale, options).format(timezoneDate);
  
  // Apply custom formatting for specific patterns
  if (preferences.dateFormat === 'DD/MM/YYYY') {
    // Swap month and day for DD/MM/YYYY format
    const parts = formatted.split('/');
    if (parts.length === 3) {
      formatted = `${parts[1]}/${parts[0]}/${parts[2]}`;
    }
  } else if (preferences.dateFormat === 'YYYY-MM-DD') {
    // Convert to YYYY-MM-DD format
    const parts = formatted.split('/');
    if (parts.length === 3) {
      formatted = `${parts[2]}-${parts[0]}-${parts[1]}`;
    }
  }

  return formatted;
}

/**
 * Format time based on user preferences
 */
export function formatTime(date: Date | string, preferences: UserPreferences): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    timeZone: preferences.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: preferences.timeFormat === '12',
  };

  return new Intl.DateTimeFormat(preferences.locale, options).format(dateObj);
}

/**
 * Format date and time together
 */
export function formatDateTime(date: Date | string, preferences: UserPreferences): string {
  const formattedDate = formatDate(date, preferences);
  const formattedTime = formatTime(date, preferences);
  return `${formattedDate} ${formattedTime}`;
}

/**
 * Get user preferences based on country detection
 */
export function getDefaultPreferences(countryCode?: string): Partial<UserPreferences> {
  if (!countryCode || !COUNTRY_TIMEZONES[countryCode as keyof typeof COUNTRY_TIMEZONES]) {
    return {
      currency: 'USD',
      timezone: 'UTC',
      locale: 'en-US',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12',
      language: 'en',
    };
  }

  return {
    currency: COUNTRY_CURRENCIES[countryCode as keyof typeof COUNTRY_CURRENCIES] || 'USD',
    timezone: COUNTRY_TIMEZONES[countryCode as keyof typeof COUNTRY_TIMEZONES] || 'UTC',
    locale: COUNTRY_LOCALES[countryCode as keyof typeof COUNTRY_LOCALES] || 'en-US',
    dateFormat: countryCode === 'US' ? 'MM/DD/YYYY' : 'DD/MM/YYYY',
    timeFormat: countryCode === 'US' ? '12' : '24',
    country: countryCode,
    language: countryCode === 'NO' ? 'no' : 'en',
  };
}

/**
 * Detect country from IP address (simplified - in real app, use a service like ipapi.co)
 */
export async function detectCountry(): Promise<string | null> {
  try {
    // In a real application, you would call an IP geolocation service
    // For now, we'll return null to use default preferences
    return null;
  } catch (error) {
    console.error('Failed to detect country:', error);
    return null;
  }
}

/**
 * Convert amount between currencies (simplified - in real app, use a currency API)
 */
export function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
  // Simplified conversion rates (in real app, fetch from API)
  const rates: Record<string, Record<string, number>> = {
    USD: { EUR: 0.85, GBP: 0.73, NOK: 8.5 },
    EUR: { USD: 1.18, GBP: 0.86, NOK: 10.0 },
    GBP: { USD: 1.37, EUR: 1.16, NOK: 11.6 },
    NOK: { USD: 0.12, EUR: 0.10, GBP: 0.09 },
  };

  if (fromCurrency === toCurrency) return amount;
  
  const rate = rates[fromCurrency]?.[toCurrency];
  if (!rate) return amount;
  
  return amount * rate;
}
