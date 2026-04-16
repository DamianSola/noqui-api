import { Response } from 'express';
import { MovementType } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';
import { prisma } from '../lib/prisma';
import { assertCanAccessBusiness } from '../utils/businessAccess';
import { writeAuditLog } from '../utils/auditLog';

export class InventoryController {
  static async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { businessId, page = '1', limit = '50' } = req.query as Record<string, string>;
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
      const where = { businessId };
      const [items, total] = await Promise.all([
        prisma.inventory.findMany({
          where,
          skip,
          take: Number(limit),
          include: { product: { select: { id: true, name: true, sku: true, deletedAt: true } } },
          orderBy: { updatedAt: 'desc' },
        }),
        prisma.inventory.count({ where }),
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
      res.status(500).json({ success: false, error: 'Error al listar inventario' });
    }
  }

  static async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      if (!userId) {
        res.status(401).json({ success: false, error: 'No autenticado' });
        return;
      }
      const row = await prisma.inventory.findUnique({
        where: { id },
        include: { product: true, business: true },
      });
      if (!row) {
        res.status(404).json({ success: false, error: 'Registro no encontrado' });
        return;
      }
      const gate = await assertCanAccessBusiness(userId, row.businessId);
      if (!gate.ok) {
        res.status(gate.status).json({ success: false, error: gate.message });
        return;
      }
      res.status(200).json({ success: true, data: row });
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, error: 'Error al obtener inventario' });
    }
  }

  /** Ajustar cantidad y opcionalmente minStock; registra movimiento ADJUSTMENT si cambia quantity */
  static async patch(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      if (!userId) {
        res.status(401).json({ success: false, error: 'No autenticado' });
        return;
      }
      const { quantity, minStock, reason } = req.body as {
        quantity?: number;
        minStock?: number;
        reason?: string;
      };
      if (quantity === undefined && minStock === undefined) {
        res.status(400).json({ success: false, error: 'quantity o minStock requerido' });
        return;
      }

      const row = await prisma.inventory.findUnique({ where: { id } });
      if (!row) {
        res.status(404).json({ success: false, error: 'Registro no encontrado' });
        return;
      }
      const gate = await assertCanAccessBusiness(userId, row.businessId);
      if (!gate.ok) {
        res.status(gate.status).json({ success: false, error: gate.message });
        return;
      }

      const product = await prisma.product.findFirst({
        where: { id: row.productId, deletedAt: null },
      });
      if (!product) {
        res.status(400).json({ success: false, error: 'Producto inválido' });
        return;
      }

      const newQty = quantity !== undefined ? Number(quantity) : row.quantity;
      const delta = newQty - row.quantity;

      const updated = await prisma.$transaction(async (tx) => {
        const inv = await tx.inventory.update({
          where: { id },
          data: {
            ...(quantity !== undefined ? { quantity: newQty } : {}),
            ...(minStock !== undefined ? { minStock: Number(minStock) } : {}),
          },
        });
        if (delta !== 0) {
          await tx.stockMovement.create({
            data: {
              productId: row.productId,
              quantity: delta,
              type: MovementType.ADJUSTMENT,
              reason: reason ?? 'Ajuste manual',
            },
          });
        }
        return inv;
      });

      await writeAuditLog(
        userId,
        'INVENTORY_ADJUST',
        JSON.stringify({ inventoryId: id, delta, reason: reason ?? null }),
      );

      res.status(200).json({ success: true, message: 'Inventario actualizado', data: updated });
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, error: 'Error al actualizar inventario' });
    }
  }
}
