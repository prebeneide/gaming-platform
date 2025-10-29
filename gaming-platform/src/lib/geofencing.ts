/**
 * Geofencing service - checks if a country/region is allowed or blocked
 */

import { prisma } from "./prisma";

/**
 * Check if a country/region is allowed (not blocked)
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @param regionCode - Optional region/state code (e.g., "CA" for California)
 * @returns Object with isAllowed, reason, and restriction level
 */
export async function checkCountryAllowed(
  countryCode: string,
  regionCode?: string | null
): Promise<{
  isAllowed: boolean;
  reason?: string;
  restrictionLevel: 'allowed' | 'restricted' | 'blocked';
}> {
  if (!countryCode || countryCode.length !== 2) {
    return {
      isAllowed: false,
      reason: 'Invalid country code',
      restrictionLevel: 'blocked'
    };
  }

  // Check if country is explicitly blocked
  const blockedCountry = await prisma.blockedCountry.findUnique({
    where: { countryCode: countryCode.toUpperCase() },
  });

  if (blockedCountry && blockedCountry.isActive) {
    // If country is blocked, check if specific states might be allowed
    // (via allowed countries list with state restrictions)
    if (regionCode && countryCode.toUpperCase() === 'US') {
      // Check if there's an allowed country entry with state exceptions
      const allowedCountry = await prisma.allowedCountry.findUnique({
        where: { countryCode: countryCode.toUpperCase() },
        select: { restrictions: true, isActive: true }
      });

      if (allowedCountry && allowedCountry.isActive && allowedCountry.restrictions) {
        const restrictions = allowedCountry.restrictions as { blockedStates?: string[]; allowedStates?: string[] };
        
        // If specific states are allowed, check if this state is in the list
        if (restrictions.allowedStates && restrictions.allowedStates.length > 0) {
          const allowedStates = restrictions.allowedStates.map(s => s.toUpperCase());
          if (allowedStates.includes(regionCode.toUpperCase())) {
            // This specific state is allowed despite country being blocked
            return {
              isAllowed: true,
              restrictionLevel: 'allowed'
            };
          }
        }

        // If specific states are blocked, check if this state is in the blocked list
        if (restrictions.blockedStates) {
          const blockedStates = restrictions.blockedStates.map(s => s.toUpperCase());
          if (blockedStates.includes(regionCode.toUpperCase())) {
            return {
              isAllowed: false,
              reason: `State ${regionCode} is explicitly blocked in ${blockedCountry.countryName}`,
              restrictionLevel: 'blocked'
            };
          }
        }
      }
    }

    // Country is blocked (no state-level override)
    return {
      isAllowed: false,
      reason: blockedCountry.reason || 'Country is blocked by administrator',
      restrictionLevel: 'blocked'
    };
  }

  // Check if we have an allowlist (if yes, only listed countries are allowed)
  const allowedCountries = await prisma.allowedCountry.findMany({
    where: { isActive: true },
  });

  // If allowlist exists and is not empty, check if country is in it
  if (allowedCountries.length > 0) {
    const isInAllowlist = allowedCountries.some(
      ac => ac.countryCode.toUpperCase() === countryCode.toUpperCase()
    );

    if (!isInAllowlist) {
      return {
        isAllowed: false,
        reason: 'Country is not in the allowed list',
        restrictionLevel: 'blocked'
      };
    }
  }

  // Country is allowed (not blocked, and either no allowlist or in allowlist)
  return {
    isAllowed: true,
    restrictionLevel: 'allowed'
  };
}

/**
 * Check if a user's location is allowed
 * @param userId - User ID
 * @returns Object with isAllowed, reason, and user's country
 */
export async function checkUserLocation(userId: string): Promise<{
  isAllowed: boolean;
  reason?: string;
  country?: string;
  region?: string;
  restrictionLevel: 'allowed' | 'restricted' | 'blocked';
}> {
  // Get user's geographic restriction record
  const restriction = await prisma.geographicRestriction.findUnique({
    where: { userId },
  });

  if (!restriction) {
    // No restriction record - allow by default but log for future check
    return {
      isAllowed: true,
      restrictionLevel: 'allowed'
    };
  }

  // Re-check country/region in case rules have changed
  const currentCheck = await checkCountryAllowed(restriction.country, restriction.region || null);
  
  // If restriction level has changed, update it
  if (currentCheck.restrictionLevel !== restriction.restrictionLevel) {
    await prisma.geographicRestriction.update({
      where: { userId },
      data: {
        restrictionLevel: currentCheck.restrictionLevel,
        reason: currentCheck.reason || restriction.reason || undefined,
      }
    });
  }

  // Check based on restriction level
  if (currentCheck.restrictionLevel === 'blocked') {
    return {
      isAllowed: false,
      reason: currentCheck.reason || restriction.reason || 'Your location is not allowed',
      country: restriction.country,
      region: restriction.region || undefined,
      restrictionLevel: 'blocked'
    };
  }

  if (currentCheck.restrictionLevel === 'restricted') {
    return {
      isAllowed: false,
      reason: currentCheck.reason || restriction.reason || 'Limited access from your location',
      country: restriction.country,
      region: restriction.region || undefined,
      restrictionLevel: 'restricted'
    };
  }

  // Allowed
  return {
    isAllowed: true,
    country: restriction.country,
    region: restriction.region || undefined,
    restrictionLevel: 'allowed'
  };
}

/**
 * Create or update user's geographic restriction
 * @param userId - User ID
 * @param countryCode - Detected country code
 * @param ipAddress - User's IP address
 * @param detectedBy - How location was detected
 */
export async function setUserLocation(
  userId: string,
  countryCode: string,
  ipAddress: string | null,
  detectedBy: 'ip_geolocation' | 'user_input' | 'payment_method' | 'admin_override' = 'ip_geolocation',
  regionCode?: string | null
): Promise<void> {
  // Check if country/region is allowed
  const countryCheck = await checkCountryAllowed(countryCode, regionCode);

  await prisma.geographicRestriction.upsert({
    where: { userId },
    create: {
      userId,
      country: countryCode.toUpperCase(),
      region: regionCode || null,
      ipAddress: ipAddress || null,
      detectedBy,
      restrictionLevel: countryCheck.isAllowed ? 'allowed' : 'blocked',
      reason: countryCheck.isAllowed ? undefined : countryCheck.reason,
    },
    update: {
      country: countryCode.toUpperCase(),
      region: regionCode || undefined,
      ipAddress: ipAddress || undefined,
      detectedBy,
      restrictionLevel: countryCheck.isAllowed ? 'allowed' : 'blocked',
      reason: countryCheck.isAllowed ? undefined : countryCheck.reason,
      updatedAt: new Date(),
    },
  });
}

/**
 * Admin: Override user's geographic restriction
 * @param userId - User ID
 * @param restrictionLevel - New restriction level
 * @param reason - Reason for override
 */
export async function adminOverrideLocation(
  userId: string,
  restrictionLevel: 'allowed' | 'restricted' | 'blocked',
  reason?: string
): Promise<void> {
  await prisma.geographicRestriction.upsert({
    where: { userId },
    create: {
      userId,
      country: 'OVERRIDE',
      detectedBy: 'admin_override',
      restrictionLevel,
      reason,
    },
    update: {
      detectedBy: 'admin_override',
      restrictionLevel,
      reason,
      updatedAt: new Date(),
    },
  });
}

/**
 * Get list of all allowed countries
 */
export async function getAllowedCountries() {
  return await prisma.allowedCountry.findMany({
    where: { isActive: true },
    orderBy: { countryName: 'asc' },
  });
}

/**
 * Get list of all blocked countries
 */
export async function getBlockedCountries() {
  return await prisma.blockedCountry.findMany({
    where: { isActive: true },
    orderBy: { countryName: 'asc' },
  });
}

