import { Response } from 'express';
import { MovementType, SupplyOrderStatus } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';
import { prisma } from '../lib/prisma';
import { assertCanAccessBusiness } from '../utils/businessAccess';
import { writeAuditLog } from '../utils/auditLog';

export class SupplyOrdersController {
  static async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { businessId, page = '1', limit = '20', status } = req.query as Record<string, string>;
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
      const where = {
        businessId,
        ...(status && Object.values(SupplyOrderStatus).includes(status as SupplyOrderStatus)
          ? { status: status as SupplyOrderStatus }
          : {}),
      };
      const [items, total] = await Promise.all([
        prisma.supplyOrder.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            supplier: { select: { id: true, name: true } },
            items: { include: { product: { select: { id: true, name: true, sku: true } } } },
          },
        }),
        prisma.supplyOrder.count({ where }),
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
      res.status(500).json({ success: false, error: 'Error al listar pedidos de compra' });
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
      const row = await prisma.supplyOrder.findUnique({
        where: { id },
        include: {
          supplier: true,
          items: { include: { product: true } },
        },
      });
      if (!row) {
        res.status(404).json({ success: false, error: 'Pedido de compra no encontrado' });
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
      res.status(500).json({ success: false, error: 'Error al obtener pedido' });
    }
  }

  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'No autenticado' });
        return;
      }
      const { businessId, supplierId, items } = req.body as {
        businessId?: string;
        supplierId?: string;
        items?: { productId: string; quantity: number; price: number }[];
      };
      if (!businessId || !supplierId || !items?.length) {
        res.status(400).json({
          success: false,
          error: 'businessId, supplierId e items[] son requeridos',
        });
        return;
      }

      const gate = await assertCanAccessBusiness(userId, businessId);
      if (!gate.ok) {
        res.status(gate.status).json({ success: false, error: gate.message });
        return;
      }

      const supplier = await prisma.supplier.findFirst({
        where: { id: supplierId, businessId },
      });
      if (!supplier) {
        res.status(404).json({ success: false, error: 'Proveedor no encontrado' });
        return;
      }

      let total = 0;
      const lines: { productId: string; quantity: number; price: number }[] = [];
      for (const line of items) {
        const product = await prisma.product.findFirst({
          where: { id: line.productId, businessId, deletedAt: null },
        });
        if (!product) {
          res.status(400).json({ success: false, error: `Producto inválido: ${line.productId}` });
          return;
        }
        const qty = Number(line.quantity);
        const price = Number(line.price);
        if (qty < 1 || price < 0) {
          res.status(400).json({ success: false, error: 'Cantidad o precio inválidos' });
          return;
        }
        total += qty * price;
        lines.push({ productId: product.id, quantity: qty, price });
      }

      const order = await prisma.supplyOrder.create({
        data: {
          businessId,
          supplierId,
          total,
          status: SupplyOrderStatus.PENDING,
          items: {
            create: lines.map((l) => ({
              productId: l.productId,
              quantity: l.quantity,
              price: l.price,
            })),
          },
        },
        include: { items: true },
      });

      await writeAuditLog(userId, 'SUPPLY_ORDER_CREATE', JSON.stringify({ supplyOrderId: order.id }));
      res.status(201).json({ success: true, message: 'Pedido de compra creado', data: order });
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, error: 'Error al crear pedido de compra' });
    }
  }

  static async updateStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      if (!userId) {
        res.status(401).json({ success: false, error: 'No autenticado' });
        return;
      }
      const { status } = req.body as { status?: SupplyOrderStatus };
      if (!status || !Object.values(SupplyOrderStatus).includes(status)) {
        res.status(400).json({
          success: false,
          error: 'status inválido (PENDING, RECEIVED, CANCELED)',
        });
        return;
      }

      const existing = await prisma.supplyOrder.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!existing) {
        res.status(404).json({ success: false, error: 'Pedido no encontrado' });
        return;
      }

      const gate = await assertCanAccessBusiness(userId, existing.businessId);
      if (!gate.ok) {
        res.status(gate.status).json({ success: false, error: gate.message });
        return;
      }

      if (existing.status === SupplyOrderStatus.RECEIVED && status !== SupplyOrderStatus.RECEIVED) {
        res.status(400).json({ success: false, error: 'Pedido ya recibido' });
        return;
      }

      if (status === SupplyOrderStatus.RECEIVED) {
        if (existing.status === SupplyOrderStatus.CANCELED) {
          res.status(400).json({ success: false, error: 'Pedido cancelado' });
          return;
        }
        if (existing.status === SupplyOrderStatus.RECEIVED) {
          res.status(400).json({ success: false, error: 'Ya estaba recibido' });
          return;
        }

        await prisma.$transaction(async (tx) => {
          for (const line of existing.items) {
            let inv = await tx.inventory.findFirst({
              where: { productId: line.productId, businessId: existing.businessId },
            });
            if (!inv) {
              inv = await tx.inventory.create({
                data: {
                  businessId: existing.businessId,
                  productId: line.productId,
                  quantity: 0,
                  minStock: 0,
                },
              });
            }
            await tx.inventory.update({
              where: { id: inv.id },
              data: { quantity: inv.quantity + line.quantity },
            });
            await tx.stockMovement.create({
              data: {
                productId: line.productId,
                quantity: line.quantity,
                type: MovementType.PURCHASE,
                reason: `Compra supply order ${existing.id}`,
              },
            });
          }
          await tx.supplyOrder.update({
            where: { id },
            data: { status: SupplyOrderStatus.RECEIVED },
          });
        });

        await writeAuditLog(userId, 'SUPPLY_ORDER_RECEIVED', JSON.stringify({ supplyOrderId: id }));
        const done = await prisma.supplyOrder.findUnique({
          where: { id },
          include: { items: true, supplier: true },
        });
        res.status(200).json({ success: true, message: 'Compra recibida e inventario actualizado', data: done });
        return;
      }

      const updated = await prisma.supplyOrder.update({
        where: { id },
        data: { status },
      });
      res.status(200).json({ success: true, message: 'Estado actualizado', data: updated });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ success: false, error: 'Error al actualizar pedido' });
    }
  }
}
