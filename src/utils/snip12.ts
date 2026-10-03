import { getSelectorFromName, hash } from 'starknet';

export type Snip12Domain = {
  name: string;
  version: string;
  chainId: string;
  revision: string;
};

export type Snip12TypedData = {
  types: Record<string, Array<{ name: string; type: string }>>;
  primaryType: string;
  domain: Snip12Domain;
  message: Record<string, any>;
};

export function normalizeChainId(chainId: string | number): string {
  if (typeof chainId === 'number') return chainId.toString();
  if (chainId.startsWith('0x')) return chainId.toLowerCase();
  try {
    return '0x' + BigInt(chainId).toString(16);
  } catch {
    return chainId;
  }
}

export function buildSnip12TypedData(sessionRequest: {
  chainId: string | number;
  sessionId: string;
  expiresAt: number | string;
  nonce: string;
  permissions?: Array<{ selector: string; allow: boolean }>;
}): Snip12TypedData {
  const domain: Snip12Domain = {
    name: 'SISNA',
    version: '1',
    chainId: normalizeChainId(sessionRequest.chainId),
    revision: '1',
  };

  const message = {
    session_id: sessionRequest.sessionId,
    expires_at: String(sessionRequest.expiresAt),
    nonce: sessionRequest.nonce,
    permissions: sessionRequest.permissions ?? [],
  };

  const types = {
    StarkNetDomain: [
      { name: 'name', type: 'shortstring' },
      { name: 'version', type: 'shortstring' },
      { name: 'chainId', type: 'felt' },
      { name: 'revision', type: 'shortstring' },
    ],
    SessionAuthorization: [
      { name: 'session_id', type: 'felt' },
      { name: 'expires_at', type: 'u64' },
      { name: 'nonce', type: 'felt' },
      { name: 'permissions', type: 'Permissions' },
    ],
    Permissions: [
      { name: 'selector', type: 'felt' },
      { name: 'allow', type: 'bool' },
    ],
  };

  return {
    types,
    primaryType: 'SessionAuthorization',
    domain,
    message,
  };
}

export function computeDomainHash(domain: Snip12Domain): string {
  const nameHash = hash.getSelectorFromName(domain.name);
  const versionHash = hash.getSelectorFromName(domain.version);
  const revisionHash = hash.getSelectorFromName(domain.revision);
  return hash.computeHashOnElements([
    nameHash,
    versionHash,
    domain.chainId,
    revisionHash,
  ]);
}

export function computeMessageHash(typedData: Snip12TypedData): string {
  return hash.computeHashOnElements([
    hash.getSelectorFromName(typedData.primaryType),
    hash.getSelectorFromName(JSON.stringify(typedData.message)),
  ]);
}
