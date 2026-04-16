import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { prisma } from '../lib/prisma';

/** Lista logs del usuario autenticado (o ADMIN ve todos con query userId) */
export class AuditLogsController {
  static async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'No autenticado' });
        return;
      }
      const { page = '1', limit = '50', targetUserId } = req.query as Record<string, string>;
      const actor = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      const filterUserId = actor?.role === 'ADMIN' && targetUserId ? targetUserId : userId;

      const skip = (Number(page) - 1) * Number(limit);
      const [items, total] = await Promise.all([
        prisma.auditLog.findMany({
          where: { userId: filterUserId },
          skip,
          take: Number(limit),
          orderBy: { timestamp: 'desc' },
        }),
        prisma.auditLog.count({ where: { userId: filterUserId } }),
      ]);
      res.status(200).json({
        success: true,
        data: items,
        pagination: {
          currentPage: Number(page),
          totalPages: total === 0 ? 0 : Math.ceil(total / Number(limit)),
          totalItems: total,
          itemsPerPage: Number(limit),
        },
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, error: 'Error al listar auditoría' });
    }
  }
}
