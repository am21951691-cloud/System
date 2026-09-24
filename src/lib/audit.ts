import { prisma } from '@/lib/db'

export async function logAudit(
  userId: number,
  action: string,
  details?: string,
  entityType?: string,
  entityId?: number
) {
  await prisma.auditLog.create({
    data: { userId, action, details, entityType, entityId },
  })
}
