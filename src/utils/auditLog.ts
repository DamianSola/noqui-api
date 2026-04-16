import { prisma } from '../lib/prisma';

export async function writeAuditLog(userId: string, action: string, details?: string): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: { userId, action, details: details ?? undefined },
    });
  } catch {
    // No bloquear flujo por fallo de auditoría
  }
}
