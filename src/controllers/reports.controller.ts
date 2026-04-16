import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { prisma } from '../lib/prisma';
import { assertCanAccessBusiness } from '../utils/businessAccess';

export class ReportsController {
  static async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { businessId, page = '1', limit = '10' } = req.query as Record<string, string>;
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
        prisma.report.findMany({
          where: { businessId },
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.report.count({ where: { businessId } }),
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
      res.status(500).json({ success: false, error: 'Error al listar reportes' });
    }
  }

  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'No autenticado' });
        return;
      }
      const { businessId, title, content } = req.body as {
        businessId?: string;
        title?: string;
        content?: string;
      };
      if (!businessId || !title || !content) {
        res.status(400).json({ success: false, error: 'businessId, title y content son requeridos' });
        return;
      }
      const gate = await assertCanAccessBusiness(userId, businessId);
      if (!gate.ok) {
        res.status(gate.status).json({ success: false, error: gate.message });
        return;
      }
      const row = await prisma.report.create({
        data: { businessId, title, content },
      });
      res.status(201).json({ success: true, message: 'Reporte guardado', data: row });
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, error: 'Error al crear reporte' });
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
      const row = await prisma.report.findUnique({ where: { id } });
      if (!row) {
        res.status(404).json({ success: false, error: 'Reporte no encontrado' });
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
      res.status(500).json({ success: false, error: 'Error al obtener reporte' });
    }
  }
}
