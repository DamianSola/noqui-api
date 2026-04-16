import { Response } from 'express';
import { MovementType, OrderStatus, Prisma } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';
import { prisma } from '../lib/prisma';
import { assertCanAccessBusiness } from '../utils/businessAccess';
import { writeAuditLog } from '../utils/auditLog';

export class OrdersController {
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
      const where: Prisma.OrderWhereInput = {
        businessId,
        ...(status && Object.values(OrderStatus).includes(status as OrderStatus)
          ? { status: status as OrderStatus }
          : {}),
      };
      const [items, total] = await Promise.all([
        prisma.order.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            customer: true,
            orderItems: { include: { product: { select: { id: true, name: true, sku: true } } } },
            payment: true,
          },
        }),
        prisma.order.count({ where }),
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
      res.status(500).json({ success: false, error: 'Error al listar pedidos' });
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
      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          customer: true,
          orderItems: { include: { product: true } },
          payment: true,
          business: { select: { id: true, name: true } },
        },
      });
      if (!order) {
        res.status(404).json({ success: false, error: 'Pedido no encontrado' });
        return;
      }
      const gate = await assertCanAccessBusiness(userId, order.businessId);
      if (!gate.ok) {
        res.status(gate.status).json({ success: false, error: gate.message });
        return;
      }
      res.status(200).json({ success: true, data: order });
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
      const { businessId, customerId, items } = req.body as {
        businessId?: string;
        customerId?: string;
        items?: { productId: string; quantity: number; price?: number }[];
      };
      if (!businessId || !customerId || !items?.length) {
        res.status(400).json({ success: false, error: 'businessId, customerId e items[] son requeridos' });
        return;
      }

      const gate = await assertCanAccessBusiness(userId, businessId);
      if (!gate.ok) {
        res.status(gate.status).json({ success: false, error: gate.message });
        return;
      }

      const customer = await prisma.customer.findFirst({
        where: { id: customerId, businessId, deletedAt: null },
      });
      if (!customer) {
        res.status(404).json({ success: false, error: 'Cliente no encontrado en el negocio' });
        return;
      }

      let subtotal = 0;
      let taxAmount = 0;
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
        if (qty < 1) {
          res.status(400).json({ success: false, error: 'Cantidad inválida' });
          return;
        }
        const unitPrice = line.price !== undefined ? Number(line.price) : product.price;
        const lineSub = unitPrice * qty;
        const lineTax = lineSub * (product.taxRate / 100);
        subtotal += lineSub;
        taxAmount += lineTax;
        lines.push({ productId: product.id, quantity: qty, price: unitPrice });
      }

      const total = subtotal + taxAmount;

      const order = await prisma.order.create({
        data: {
          businessId,
          customerId,
          subtotal,
          taxAmount,
          total,
          status: OrderStatus.PENDING,
          orderItems: {
            create: lines.map((l) => ({
              productId: l.productId,
              quantity: l.quantity,
              price: l.price,
            })),
          },
        },
        include: { orderItems: true },
      });

      await writeAuditLog(userId, 'ORDER_CREATE', JSON.stringify({ orderId: order.id, businessId }));

      res.status(201).json({ success: true, message: 'Pedido creado', data: order });
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, error: 'Error al crear pedido' });
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
      const { status } = req.body as { status?: OrderStatus };
      if (!status || !Object.values(OrderStatus).includes(status)) {
        res.status(400).json({ success: false, error: 'status inválido (PENDING, COMPLETED, CANCELED)' });
        return;
      }

      const order = await prisma.order.findUnique({
        where: { id },
        include: { orderItems: true, payment: true },
      });
      if (!order) {
        res.status(404).json({ success: false, error: 'Pedido no encontrado' });
        return;
      }

      const gate = await assertCanAccessBusiness(userId, order.businessId);
      if (!gate.ok) {
        res.status(gate.status).json({ success: false, error: gate.message });
        return;
      }

      if (order.status === OrderStatus.COMPLETED && status !== OrderStatus.COMPLETED) {
        res.status(400).json({ success: false, error: 'No se puede cambiar un pedido ya completado' });
        return;
      }

      if (status === OrderStatus.COMPLETED) {
        if (order.status === OrderStatus.CANCELED) {
          res.status(400).json({ success: false, error: 'Pedido cancelado' });
          return;
        }

        await prisma.$transaction(async (tx) => {
          for (const line of order.orderItems) {
            const inv = await tx.inventory.findFirst({
              where: { productId: line.productId, businessId: order.businessId },
            });
            if (!inv || inv.quantity < line.quantity) {
              throw Object.assign(new Error('INSUFFICIENT_STOCK'), { code: 'INSUFFICIENT_STOCK' });
            }
          }

          for (const line of order.orderItems) {
            const inv = await tx.inventory.findFirst({
              where: { productId: line.productId, businessId: order.businessId },
            });
            if (!inv) throw new Error('INV');
            await tx.inventory.update({
              where: { id: inv.id },
              data: { quantity: inv.quantity - line.quantity },
            });
            await tx.stockMovement.create({
              data: {
                productId: line.productId,
                quantity: -line.quantity,
                type: MovementType.SALE,
                reason: `Venta pedido ${order.id}`,
              },
            });
          }

          await tx.order.update({
            where: { id: order.id },
            data: { status: OrderStatus.COMPLETED },
          });
        });

        await writeAuditLog(userId, 'ORDER_COMPLETED', JSON.stringify({ orderId: id }));
        const done = await prisma.order.findUnique({ where: { id }, include: { orderItems: true, payment: true } });
        res.status(200).json({ success: true, message: 'Pedido completado', data: done });
        return;
      }

      if (status === OrderStatus.CANCELED) {
        await prisma.order.update({
          where: { id },
          data: { status: OrderStatus.CANCELED },
        });
        await writeAuditLog(userId, 'ORDER_CANCELED', JSON.stringify({ orderId: id }));
        const done = await prisma.order.findUnique({ where: { id }, include: { orderItems: true, payment: true } });
        res.status(200).json({ success: true, message: 'Pedido cancelado', data: done });
        return;
      }

      // PENDING desde otro estado no contemplado
      const updated = await prisma.order.update({
        where: { id },
        data: { status },
      });
      res.status(200).json({ success: true, message: 'Pedido actualizado', data: updated });
    } catch (e: any) {
      console.error(e);
      if (e.code === 'INSUFFICIENT_STOCK') {
        res.status(400).json({ success: false, error: 'Stock insuficiente para completar el pedido' });
        return;
      }
      res.status(500).json({ success: false, error: 'Error al actualizar pedido' });
    }
  }
}
