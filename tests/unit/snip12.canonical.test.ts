import { buildSnip12TypedData, normalizeChainId, computeDomainHash } from '../../src/utils/snip12';

describe('SNIP-12 canonicalization', () => {
  test('normalizeChainId handles number and hex', () => {
    expect(normalizeChainId(1)).toBe('1');
    expect(normalizeChainId('0x1')).toBe('0x1');
    expect(normalizeChainId('1')).toBe('0x1');
  });

  test('buildSnip12TypedData domain fields', () => {
    const req = {
      chainId: 1,
      sessionId: '0x1',
      expiresAt: 123456,
      nonce: '0xabc',
      permissions: [{ selector: '0x1', allow: true }],
    };
    const typed = buildSnip12TypedData(req);
    expect(typed.domain.name).toBe('SISNA');
    expect(typed.domain.version).toBe('1');
    expect(typed.domain.chainId).toBe('1');
    expect(typed.primaryType).toBe('SessionAuthorization');
    expect(typed.message.session_id).toBe('0x1');
  });

  test('domain hash is deterministic', () => {
    const domain = { name: 'SISNA', version: '1', chainId: '0x1', revision: '1' };
    const h1 = computeDomainHash(domain);
    const h2 = computeDomainHash(domain);
    expect(h1).toBe(h2);
  });

  test('field ordering preserved', () => {
    const req = {
      chainId: '0x534e49504b4e',
      sessionId: '0x2',
      expiresAt: 999,
      nonce: '0x1',
    };
    const typed = buildSnip12TypedData(req);
    const keys = Object.keys(typed.message);
    expect(keys).toEqual(['session_id', 'expires_at', 'nonce', 'permissions']);
  });
});
