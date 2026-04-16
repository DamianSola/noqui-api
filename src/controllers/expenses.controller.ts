import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { prisma } from '../lib/prisma';
import { assertCanAccessBusiness } from '../utils/businessAccess';

export class ExpensesController {
  static async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { businessId, page = '1', limit = '20' } = req.query as Record<string, string>;
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
      const [items, total] = await Promise.all([
        prisma.expense.findMany({
          where: { businessId },
          skip,
          take: Number(limit),
          orderBy: { date: 'desc' },
        }),
        prisma.expense.count({ where: { businessId } }),
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
      res.status(500).json({ success: false, error: 'Error al listar gastos' });
    }
  }

  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'No autenticado' });
        return;
      }
      const { businessId, description, amount, category, date } = req.body as {
        businessId?: string;
        description?: string;
        amount?: number;
        category?: string;
        date?: string;
      };
      if (!businessId || !description || amount === undefined || !category) {
        res.status(400).json({
          success: false,
          error: 'businessId, description, amount y category son requeridos',
        });
        return;
      }
      const gate = await assertCanAccessBusiness(userId, businessId);
      if (!gate.ok) {
        res.status(gate.status).json({ success: false, error: gate.message });
        return;
      }
      const row = await prisma.expense.create({
        data: {
          businessId,
          description,
          amount: Number(amount),
          category,
          date: date ? new Date(date) : new Date(),
        },
      });
      res.status(201).json({ success: true, message: 'Gasto creado', data: row });
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, error: 'Error al crear gasto' });
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
      const row = await prisma.expense.findUnique({ where: { id } });
      if (!row) {
        res.status(404).json({ success: false, error: 'Gasto no encontrado' });
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
      res.status(500).json({ success: false, error: 'Error al obtener gasto' });
    }
  }

  static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      if (!userId) {
        res.status(401).json({ success: false, error: 'No autenticado' });
        return;
      }
      const row = await prisma.expense.findUnique({ where: { id } });
      if (!row) {
        res.status(404).json({ success: false, error: 'Gasto no encontrado' });
        return;
      }
      const gate = await assertCanAccessBusiness(userId, row.businessId);
      if (!gate.ok) {
        res.status(gate.status).json({ success: false, error: gate.message });
        return;
      }
      const { description, amount, category, date } = req.body as Record<string, unknown>;
      const updated = await prisma.expense.update({
        where: { id },
        data: {
          ...(description !== undefined ? { description: String(description) } : {}),
          ...(amount !== undefined ? { amount: Number(amount) } : {}),
          ...(category !== undefined ? { category: String(category) } : {}),
          ...(date !== undefined ? { date: new Date(String(date)) } : {}),
        },
      });
      res.status(200).json({ success: true, message: 'Gasto actualizado', data: updated });
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, error: 'Error al actualizar gasto' });
    }
  }

  static async remove(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      if (!userId) {
        res.status(401).json({ success: false, error: 'No autenticado' });
        return;
      }
      const row = await prisma.expense.findUnique({ where: { id } });
      if (!row) {
        res.status(404).json({ success: false, error: 'Gasto no encontrado' });
        return;
      }
      const gate = await assertCanAccessBusiness(userId, row.businessId);
      if (!gate.ok) {
        res.status(gate.status).json({ success: false, error: gate.message });
        return;
      }
      await prisma.expense.delete({ where: { id } });
      res.status(200).json({ success: true, message: 'Gasto eliminado' });
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, error: 'Error al eliminar gasto' });
    }
  }
}
