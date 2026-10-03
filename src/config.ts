export type SessionSignatureMode = 'v1_hash' | 'v2_snip12';

const rawMode = process.env.SESSION_SIGNATURE_MODE ?? 'v1_hash';

if (rawMode !== 'v1_hash' && rawMode !== 'v2_snip12') {
  throw new Error(`Invalid SESSION_SIGNATURE_MODE: ${rawMode}. Allowed values: v1_hash, v2_snip12`);
}

export const SESSION_SIGNATURE_MODE: SessionSignatureMode = rawMode as SessionSignatureMode;

export const DFNS_API_KEY = process.env.DFNS_API_KEY ?? '';
export const DFNS_KEY_ID = process.env.DFNS_KEY_ID ?? '';
export const VERIFICATION_KEY = process.env.VERIFICATION_KEY ?? '';

export const SISNA_DOMAIN = {
  name: 'SISNA',
  version: '1',
  revision: '1',
};
