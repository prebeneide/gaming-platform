/**
 * Geolocation service for IP-based country detection
 * Uses free tier of ipapi.co (1,000 requests/day)
 * Falls back to alternative services if needed
 */

interface GeolocationResult {
  countryCode: string | null;
  countryName: string | null;
  region?: string | null; // State/province code (e.g., "CA" for California, "ON" for Ontario)
  regionName?: string | null; // Full region name
  error?: string;
}

/**
 * Get country code and region from IP address using ipapi.co (free tier)
 * @param ip - IP address to check
 * @returns Country code (ISO 3166-1 alpha-2) or null if error
 */
export async function getCountryFromIP(ip: string): Promise<string | null> {
  // Skip geolocation for localhost and private IPs
  if (isLocalIP(ip)) {
    return null;
  }

  try {
    // Primary: ipapi.co (free tier: 1,000 requests/day)
    const response = await fetch(`https://ipapi.co/${ip}/country_code/`, {
      headers: {
        'User-Agent': 'GameChallenger/1.0'
      },
      // Timeout after 5 seconds
      signal: AbortSignal.timeout(5000)
    });
    
    if (response.ok) {
      const countryCode = (await response.text()).trim();
      // Validate it's a 2-letter country code
      if (countryCode && countryCode.length === 2 && /^[A-Z]{2}$/.test(countryCode)) {
        return countryCode;
      }
    }
    
    // Fallback: ip-api.com (free tier: 45 requests/minute)
    return await getCountryFromIPFallback(ip);
  } catch (error) {
    console.error('[Geolocation] Error fetching country from ipapi.co:', error);
    // Try fallback
    return await getCountryFromIPFallback(ip);
  }
}

/**
 * Get full geolocation data (country + region/state) from IP
 * @param ip - IP address to check
 * @returns GeolocationResult with country and region info
 */
export async function getGeolocationFromIP(ip: string): Promise<GeolocationResult> {
  // Skip geolocation for localhost and private IPs
  if (isLocalIP(ip)) {
    return {
      countryCode: null,
      countryName: null,
      region: null,
      regionName: null,
    };
  }

  try {
    // Primary: ipapi.co - get full JSON response
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: {
        'User-Agent': 'GameChallenger/1.0'
      },
      signal: AbortSignal.timeout(5000)
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.country_code && data.country_code.length === 2) {
        return {
          countryCode: data.country_code.toUpperCase(),
          countryName: data.country_name || null,
          region: data.region_code || data.state_code || null, // e.g., "CA" for California
          regionName: data.region || data.state || null, // e.g., "California"
        };
      }
    }
    
    // Fallback: ip-api.com
    return await getGeolocationFallback(ip);
  } catch (error) {
    console.error('[Geolocation] Error fetching geolocation from ipapi.co:', error);
    return await getGeolocationFallback(ip);
  }
}

/**
 * Fallback geolocation using ip-api.com
 */
async function getCountryFromIPFallback(ip: string): Promise<string | null> {
  const result = await getGeolocationFallback(ip);
  return result.countryCode;
}

/**
 * Fallback geolocation using ip-api.com (full data)
 */
async function getGeolocationFallback(ip: string): Promise<GeolocationResult> {
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,countryCode,region,regionName`, {
      signal: AbortSignal.timeout(5000)
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.status === 'success' && data.countryCode) {
        return {
          countryCode: data.countryCode.toUpperCase(),
          countryName: null,
          region: data.region || null,
          regionName: data.regionName || null,
        };
      }
    }
  } catch (error) {
    console.error('[Geolocation] Error fetching geolocation from ip-api.com:', error);
  }
  
  return {
    countryCode: null,
    countryName: null,
    region: null,
    regionName: null,
  };
}

/**
 * Check if IP is localhost or private
 */
function isLocalIP(ip: string): boolean {
  return (
    ip === '127.0.0.1' ||
    ip === 'localhost' ||
    ip === '::1' ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.16.') ||
    ip.startsWith('172.17.') ||
    ip.startsWith('172.18.') ||
    ip.startsWith('172.19.') ||
    ip.startsWith('172.20.') ||
    ip.startsWith('172.21.') ||
    ip.startsWith('172.22.') ||
    ip.startsWith('172.23.') ||
    ip.startsWith('172.24.') ||
    ip.startsWith('172.25.') ||
    ip.startsWith('172.26.') ||
    ip.startsWith('172.27.') ||
    ip.startsWith('172.28.') ||
    ip.startsWith('172.29.') ||
    ip.startsWith('172.30.') ||
    ip.startsWith('172.31.')
  );
}

/**
 * Get country name from country code
 */
export function getCountryName(countryCode: string): string {
  const countryNames: Record<string, string> = {
    'NO': 'Norway',
    'SE': 'Sweden',
    'DK': 'Denmark',
    'FI': 'Finland',
    'US': 'United States',
    'GB': 'United Kingdom',
    'CA': 'Canada',
    'AU': 'Australia',
    'DE': 'Germany',
    'FR': 'France',
    'ES': 'Spain',
    'IT': 'Italy',
    'NL': 'Netherlands',
    'BE': 'Belgium',
    'PL': 'Poland',
    // Add more as needed
  };
  
  return countryNames[countryCode] || countryCode;
}

/**
 * Extract IP address from request headers
 */
export function getClientIP(request: Request | any): string | null {
  // Try various headers (order matters - most trustworthy first)
  if (request instanceof Request) {
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
      // x-forwarded-for can contain multiple IPs, take the first one
      return forwardedFor.split(',')[0].trim();
    }
    
    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
      return realIP.trim();
    }
    
    const cfConnectingIP = request.headers.get('cf-connecting-ip'); // Cloudflare
    if (cfConnectingIP) {
      return cfConnectingIP.trim();
    }
  }
  
  // For Next.js API routes
  if (request.headers) {
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }
    
    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
      return realIP.trim();
    }
  }
  
  return null;
}

