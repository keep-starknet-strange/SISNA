import pino from 'pino';
import { SESSION_SIGNATURE_MODE, VERIFICATION_KEY } from '../config';
import { buildSnip12TypedData, computeDomainHash, computeMessageHash } from '../utils/snip12';
import { verifyTypedData } from 'starknet';

const logger = pino({ level: process.env.LOG_LEVEL ?? 'info' });

type DfnsSignRequest = {
  kind: 'Hash' | 'Snip12';
  payload: any;
};

export class DfnsAdapter {
  private apiKey: string;
  private keyId: string;

  constructor(apiKey: string, keyId: string) {
    this.apiKey = apiKey;
    this.keyId = keyId;
  }

  async signSession(request: {
    requestId: string;
    chainId: string | number;
    sessionId: string;
    expiresAt: number;
    nonce: string;
    permissions?: Array<{ selector: string; allow: boolean }>;
    verificationKey?: string;
  }): Promise<{ signature: string[]; signature_mode: string }> {
    const mode = SESSION_SIGNATURE_MODE;
    const requestId = request.requestId;
    const verificationKey = request.verificationKey ?? VERIFICATION_KEY;

    if (mode === 'v2_snip12') {
      const typedData = buildSnip12TypedData(request);
      const domainHash = computeDomainHash(typedData.domain);
      const messageHash = computeMessageHash(typedData);

      logger.info({
        signature_mode: 'v2_snip12',
        request_id: requestId,
        domain_hash: domainHash,
        message_hash: messageHash,
      }, 'SNIP-12 signing started');

      const dfnsResponse = await this.callDfns({
        kind: 'Snip12',
        payload: typedData,
      });

      const isValid = verifyTypedData({
        typedData,
        publicKey: verificationKey,
        signature: dfnsResponse.signature,
      });

      if (!isValid) {
        logger.error({ request_id: requestId }, 'SNIP-12 signature verification failed');
        throw new Error('Fail-closed: SNIP-12 signature verification failed');
      }

      logger.info({ signature_mode: 'v2_snip12', request_id: requestId }, 'SNIP-12 signing succeeded');
      return { signature: dfnsResponse.signature, signature_mode: 'v2_snip12' };
    }

    // v1 fallback
    logger.info({ signature_mode: 'v1_hash', request_id: requestId }, 'Hash signing started');
    const messageHash = hashMessage(request);
    const dfnsResponse = await this.callDfns({
      kind: 'Hash',
      payload: messageHash,
    });

    logger.info({ signature_mode: 'v1_hash', request_id: requestId }, 'Hash signing succeeded');
    return { signature: dfnsResponse.signature, signature_mode: 'v1_hash' };
  }

  private async callDfns(req: DfnsSignRequest): Promise<{ signature: string[] }> {
    if (!this.apiKey || !this.keyId) {
      throw new Error('Dfns credentials missing');
    }
    const res = await fetch('https://api.dfns.com/v1/sign', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keyId: this.keyId,
        kind: req.kind,
        payload: req.payload,
      }),
    });
    if (!res.ok) {
      throw new Error(`Dfns error: ${res.status}`);
    }
    return res.json();
  }
}

function hashMessage(req: any): string {
  return '0x' + Buffer.from(JSON.stringify(req)).toString('hex');
}
