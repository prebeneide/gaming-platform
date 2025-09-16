"use client";

import { useUserPreferences } from '@/hooks/useUserPreferences';
import { formatCurrency, formatDate, formatTime, formatDateTime } from '@/lib/formatting';

interface FormattedValueProps {
  value: number | Date | string;
  type: 'currency' | 'date' | 'time' | 'datetime';
  userId?: string;
  className?: string;
  fromCurrency?: string; // Currency to convert from (defaults to USD)
}

export default function FormattedValue({ 
  value, 
  type, 
  userId, 
  className = '',
  fromCurrency = 'USD'
}: FormattedValueProps) {
  const { preferences, loading } = useUserPreferences(userId);

  if (loading) {
    return <span className={className}>Loading...</span>;
  }

  let formattedValue: string;

  try {
    switch (type) {
      case 'currency':
        formattedValue = formatCurrency(Number(value), preferences, fromCurrency);
        break;
      case 'date':
        formattedValue = formatDate(value, preferences);
        break;
      case 'time':
        formattedValue = formatTime(value, preferences);
        break;
      case 'datetime':
        formattedValue = formatDateTime(value, preferences);
        break;
      default:
        formattedValue = String(value);
    }
  } catch (error) {
    console.error('Error formatting value:', error);
    formattedValue = String(value);
  }

  return <span className={className}>{formattedValue}</span>;
}
