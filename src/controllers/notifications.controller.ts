import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { prisma } from '../lib/prisma';

export class NotificationsController {
  static async myList(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'No autenticado' });
        return;
      }
      const { page = '1', limit = '20', unreadOnly } = req.query as Record<string, string>;
      const skip = (Number(page) - 1) * Number(limit);
      const where = {
        userId,
        ...(unreadOnly === 'true' ? { read: false } : {}),
      };
      const [items, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.notification.count({ where }),
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
      res.status(500).json({ success: false, error: 'Error al listar notificaciones' });
    }
  }

  static async createForUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const actorId = req.user?.userId;
      if (!actorId) {
        res.status(401).json({ success: false, error: 'No autenticado' });
        return;
      }
      const { userId, message } = req.body as { userId?: string; message?: string };
      if (!userId || !message?.trim()) {
        res.status(400).json({ success: false, error: 'userId y message son requeridos' });
        return;
      }
      // Solo el propio usuario o ADMIN podría crear para otros — simplificado: cualquier usuario solo para sí mismo
      if (userId !== actorId) {
        const actor = await prisma.user.findUnique({ where: { id: actorId }, select: { role: true } });
        if (actor?.role !== 'ADMIN') {
          res.status(403).json({ success: false, error: 'Solo puedes crear notificaciones para tu usuario' });
          return;
        }
      }
      const n = await prisma.notification.create({
        data: { userId, message: message.trim() },
      });
      res.status(201).json({ success: true, data: n });
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, error: 'Error al crear notificación' });
    }
  }

  static async markRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      if (!userId) {
        res.status(401).json({ success: false, error: 'No autenticado' });
        return;
      }
      const row = await prisma.notification.findUnique({ where: { id } });
      if (!row || row.userId !== userId) {
        res.status(404).json({ success: false, error: 'Notificación no encontrada' });
        return;
      }
      const updated = await prisma.notification.update({
        where: { id },
        data: { read: true },
      });
      res.status(200).json({ success: true, data: updated });
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, error: 'Error al actualizar' });
    }
  }
}
