import 'server-only';
import type { AuditAction, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/**
 * Record an important administrative or security-relevant action.
 * Audit logging must never break the primary flow, so failures are swallowed
 * after being surfaced to the server console.
 */
export async function recordAudit(params: {
  action: AuditAction;
  actorId?: string | null;
  target?: string | null;
  metadata?: Prisma.InputJsonValue;
  ipHash?: string | null;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        actorId: params.actorId ?? null,
        target: params.target ?? null,
        metadata: params.metadata,
        ipHash: params.ipHash ?? null,
      },
    });
  } catch (err) {
    console.error('[audit] failed to record audit log', params.action, err);
  }
}
