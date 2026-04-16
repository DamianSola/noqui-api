import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';
import { prisma } from '../lib/prisma';
import { assertCanAccessBusiness } from '../utils/businessAccess';

export class StockMovementsController {
  static async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { businessId, productId, page = '1', limit = '50' } = req.query as Record<string, string>;
      if (!userId || !businessId) {
        res.status(400).json({ success: false, error: 'businessId requerido' });
        return;
      }
      const gate = await assertCanAccessBusiness(userId, businessId);
      if (!gate.ok) {
        res.status(gate.status).json({ success: false, error: gate.message });
        return;
      }
      const skip = (Number(page) - 1) * Number(limit);
      const where: Prisma.StockMovementWhereInput = {
        product: {
          businessId,
          deletedAt: null,
        },
      };
      if (productId) {
        where.productId = productId;
      }
      const [items, total] = await Promise.all([
        prisma.stockMovement.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        }),
        prisma.stockMovement.count({ where }),
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
      res.status(500).json({ success: false, error: 'Error al listar movimientos' });
    }
  }
}
