import { prisma } from '../lib/prisma';

export async function assertCanAccessBusiness(userId: string, businessId: string) {
  const business = await prisma.business.findFirst({
    where: { id: businessId, deletedAt: null },
  });

  if (!business) {
    return { ok: false as const, status: 404 as const, message: 'Negocio no encontrado' };
  }

  const allowed =
    business.ownerId === userId || (Array.isArray(business.guests) && business.guests.includes(userId));

  if (!allowed) {
    return { ok: false as const, status: 403 as const, message: 'No autorizado para este negocio' };
  }

  return { ok: true as const, business };
}
