"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

interface TimeFormatterProps {
  date: Date | string;
  format?: "full" | "date" | "time" | "relative";
  className?: string;
}

interface UserPreferences {
  timeFormat: string;
  dateFormat: string;
  timezone: string;
  locale: string;
}

export default function TimeFormatter({ date, format = "full", className = "" }: TimeFormatterProps) {
  const { data: session } = useSession();
  const [preferences, setPreferences] = useState<UserPreferences>({
    timeFormat: "12",
    dateFormat: "MM/DD/YYYY",
    timezone: "UTC",
    locale: "en-US"
  });

  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/user/preferences?userId=${session.user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.preferences) {
            setPreferences({
              timeFormat: data.preferences.timeFormat || "12",
              dateFormat: data.preferences.dateFormat || "MM/DD/YYYY",
              timezone: data.preferences.timezone || "UTC",
              locale: data.preferences.locale || "en-US"
            });
          }
        })
        .catch(err => console.error("Error loading preferences:", err));
    }
  }, [session]);

  const formatDate = () => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const matchDate = dateObj;
    const timeDiff = now.getTime() - matchDate.getTime();
    const daysAgo = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    const hour12 = preferences.timeFormat === "12";

    if (format === "relative") {
      if (daysAgo === 0) {
        return { date: "Today", time: matchDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12 }) };
      } else if (daysAgo === 1) {
        return { date: "Yesterday", time: matchDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12 }) };
      } else if (daysAgo < 7) {
        return { date: `${daysAgo} days ago`, time: matchDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12 }) };
      }
    }

    if (format === "date") {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: preferences.timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      };
      let formatted = new Intl.DateTimeFormat(preferences.locale, options).format(dateObj);
      
      // Apply custom date format
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

    if (format === "time") {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: preferences.timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12
      };
      return new Intl.DateTimeFormat(preferences.locale, options).format(dateObj);
    }

    // Default: full datetime
    const dateOptions: Intl.DateTimeFormatOptions = {
      timeZone: preferences.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    };
    const timeOptions: Intl.DateTimeFormatOptions = {
      timeZone: preferences.timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12
    };
    let formattedDate = new Intl.DateTimeFormat(preferences.locale, dateOptions).format(dateObj);
    
    // Apply custom date format
    if (preferences.dateFormat === 'DD/MM/YYYY') {
      // Swap month and day for DD/MM/YYYY format
      const parts = formattedDate.split('/');
      if (parts.length === 3) {
        formattedDate = `${parts[1]}/${parts[0]}/${parts[2]}`;
      }
    } else if (preferences.dateFormat === 'YYYY-MM-DD') {
      // Convert to YYYY-MM-DD format
      const parts = formattedDate.split('/');
      if (parts.length === 3) {
        formattedDate = `${parts[2]}-${parts[0]}-${parts[1]}`;
      }
    }
    
    const formattedTime = new Intl.DateTimeFormat(preferences.locale, timeOptions).format(dateObj);
    return `${formattedDate} ${formattedTime}`;
  };

  const result = formatDate();

  if (format === "relative" && typeof result === 'object') {
    return (
      <span className={className}>
        <span>{result.date}</span>
        {result.time && <span className="ml-1">{result.time}</span>}
      </span>
    );
  }

  return <span className={className}>{String(result)}</span>;
}

