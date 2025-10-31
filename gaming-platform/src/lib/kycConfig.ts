export type KycProvider = 'manual' | 'onfido' | 'veriff' | 'persona' | 'disabled';

export interface KycSettings {
  enabled: boolean;
  provider: KycProvider;
  storage: 'local' | 's3' | 'cloudinary';
  retentionDays: number; // auto-delete evidence after N days
}

export function getKycSettings(): KycSettings {
  const enabled = process.env.FEATURE_KYC === 'true';
  const providerEnv = (process.env.KYC_PROVIDER || 'disabled').toLowerCase();
  const provider: KycProvider = ['manual', 'onfido', 'veriff', 'persona'].includes(providerEnv)
    ? (providerEnv as KycProvider)
    : 'disabled';

  // Support 'cloudinary', 's3', or default to 'local'
  const storageEnv = (process.env.KYC_STORAGE || 'cloudinary').toLowerCase();
  const storage = storageEnv === 's3' ? 's3' : storageEnv === 'cloudinary' ? 'cloudinary' : 'local';
  const retentionDays = Number(process.env.KYC_RETENTION_DAYS || '30') || 30;

  return { enabled, provider, storage, retentionDays };
}

/**
 * ⚠️ PRODUCTION SECURITY WARNING:
 * 
 * Cloudinary should ONLY be used for testing/development.
 * 
 * WHY S3 IS REQUIRED FOR PRODUCTION:
 * 1. **Privacy & GDPR Compliance:**
 *    - KYC documents contain highly sensitive personal data (ID cards, passports)
 *    - S3 allows private storage with strict access controls
 *    - Cloudinary images are more accessible and less secure
 * 
 * 2. **Access Control:**
 *    - S3: You control who can access files (private buckets, IAM policies)
 *    - Cloudinary: URLs are harder to secure, even with signed URLs
 * 
 * 3. **Audit & Compliance:**
 *    - S3 provides better audit logs for who accessed what and when
 *    - Required for financial/regulatory compliance
 * 
 * 4. **Data Retention:**
 *    - S3 allows automated lifecycle policies for auto-deletion
 *    - Better control over data retention periods
 * 
 * 5. **Cost Control:**
 *    - S3 is typically cheaper for private storage of sensitive documents
 *    - Cloudinary is optimized for public image delivery
 * 
 * FOR TESTING: Cloudinary is fine, but MUST be switched to S3 before production!
 */

export function isKycEnabled(): boolean {
  return getKycSettings().enabled && getKycSettings().provider !== 'disabled';
}

export function isKycReviewer(user: { role?: string; email?: string | null }): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const allow = (process.env.KYC_REVIEWER_EMAILS || '').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
  if (user.email && allow.includes(user.email.toLowerCase())) return true;
  return false;
}


