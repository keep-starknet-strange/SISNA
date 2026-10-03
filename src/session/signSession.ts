import { DfnsAdapter } from '../signer/dfnsAdapter';
import { SESSION_SIGNATURE_MODE } from '../config';
import pino from 'pino';

const logger = pino();

export async function signSession(sessionRequest: {
  requestId: string;
  chainId: string | number;
  sessionId: string;
  expiresAt: number;
  nonce: string;
  permissions?: Array<{ selector: string; allow: boolean }>;
}) {
  const adapter = new DfnsAdapter(process.env.DFNS_API_KEY ?? '', process.env.DFNS_KEY_ID ?? '');

  const policyChecks = runPolicyChecks(sessionRequest);
  if (!policyChecks.ok) {
    logger.warn({ request_id: sessionRequest.requestId }, 'Policy check failed');
    throw new Error('Policy check failed');
  }

  const result = await adapter.signSession(sessionRequest);

  logger.info({
    signature_mode: result.signature_mode,
    request_id: sessionRequest.requestId,
  }, 'Session signed');

  return result;
}

function runPolicyChecks(req: any) {
  return { ok: true };
}
