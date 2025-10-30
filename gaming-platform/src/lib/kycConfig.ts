export type KycProvider = 'manual' | 'onfido' | 'veriff' | 'persona' | 'disabled';

export interface KycSettings {
  enabled: boolean;
  provider: KycProvider;
  storage: 'local' | 's3';
  retentionDays: number; // auto-delete evidence after N days
}

export function getKycSettings(): KycSettings {
  const enabled = process.env.FEATURE_KYC === 'true';
  const providerEnv = (process.env.KYC_PROVIDER || 'disabled').toLowerCase();
  const provider: KycProvider = ['manual', 'onfido', 'veriff', 'persona'].includes(providerEnv)
    ? (providerEnv as KycProvider)
    : 'disabled';

  const storage = (process.env.KYC_STORAGE || 'local') === 's3' ? 's3' : 'local';
  const retentionDays = Number(process.env.KYC_RETENTION_DAYS || '30') || 30;

  return { enabled, provider, storage, retentionDays };
}

export function isKycEnabled(): boolean {
  return getKycSettings().enabled && getKycSettings().provider !== 'disabled';
}


