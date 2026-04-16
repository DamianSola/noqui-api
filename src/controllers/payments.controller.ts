import { Response } from 'express';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';
import { prisma } from '../lib/prisma';
import { assertCanAccessBusiness } from '../utils/businessAccess';

export class PaymentsController {
  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'No autenticado' });
        return;
      }
      const { orderId, amount, method, status } = req.body as {
        orderId?: string;
        amount?: number;
        method?: PaymentMethod;
        status?: PaymentStatus;
      };
      if (!orderId || amount === undefined || !method) {
        res.status(400).json({ success: false, error: 'orderId, amount y method son requeridos' });
        return;
      }
      if (!Object.values(PaymentMethod).includes(method)) {
        res.status(400).json({ success: false, error: 'method inválido' });
        return;
      }

      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) {
        res.status(404).json({ success: false, error: 'Pedido no encontrado' });
        return;
      }

      const gate = await assertCanAccessBusiness(userId, order.businessId);
      if (!gate.ok) {
        res.status(gate.status).json({ success: false, error: gate.message });
        return;
      }

      const existing = await prisma.payment.findUnique({ where: { orderId } });
      if (existing) {
        res.status(400).json({ success: false, error: 'Este pedido ya tiene un pago' });
        return;
      }

      const pay = await prisma.payment.create({
        data: {
          orderId,
          amount: Number(amount),
          method,
          status: status && Object.values(PaymentStatus).includes(status) ? status : PaymentStatus.COMPLETED,
        },
      });
      res.status(201).json({ success: true, message: 'Pago registrado', data: pay });
    } catch (e: any) {
      console.error(e);
      if (e.code === 'P2002') {
        res.status(400).json({ success: false, error: 'Pago duplicado' });
        return;
      }
      res.status(500).json({ success: false, error: 'Error al crear pago' });
    }
  }

  static async getByOrderId(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { orderId } = req.params;
      if (!userId) {
        res.status(401).json({ success: false, error: 'No autenticado' });
        return;
      }
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) {
        res.status(404).json({ success: false, error: 'Pedido no encontrado' });
        return;
      }
      const gate = await assertCanAccessBusiness(userId, order.businessId);
      if (!gate.ok) {
        res.status(gate.status).json({ success: false, error: gate.message });
        return;
      }
      const payment = await prisma.payment.findUnique({ where: { orderId } });
      if (!payment) {
        res.status(404).json({ success: false, error: 'Sin pago registrado' });
        return;
      }
      res.status(200).json({ success: true, data: payment });
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, error: 'Error al obtener pago' });
    }
  }
}
