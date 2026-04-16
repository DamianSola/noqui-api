import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { prisma } from '../lib/prisma';
import { assertCanAccessBusiness } from '../utils/businessAccess';

export class CalendarController {
  static async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { businessId, from, to } = req.query as Record<string, string>;
      if (!userId || !businessId) {
        res.status(400).json({ success: false, error: 'businessId requerido' });
        return;
      }
      const gate = await assertCanAccessBusiness(userId, businessId);
      if (!gate.ok) {
        res.status(gate.status).json({ success: false, error: gate.message });
        return;
      }
      const where: { businessId: string; startTime?: { gte: Date; lte: Date } } = { businessId };
      if (from && to) {
        where.startTime = { gte: new Date(from), lte: new Date(to) };
      }
      const events = await prisma.calendarEvent.findMany({
        where,
        orderBy: { startTime: 'asc' },
      });
      res.status(200).json({ success: true, data: events });
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, error: 'Error al listar eventos' });
    }
  }

  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'No autenticado' });
        return;
      }
      const { businessId, title, description, startTime, endTime } = req.body as {
        businessId?: string;
        title?: string;
        description?: string | null;
        startTime?: string;
        endTime?: string;
      };
      if (!businessId || !title || !startTime || !endTime) {
        res.status(400).json({
          success: false,
          error: 'businessId, title, startTime y endTime son requeridos',
        });
        return;
      }
      const gate = await assertCanAccessBusiness(userId, businessId);
      if (!gate.ok) {
        res.status(gate.status).json({ success: false, error: gate.message });
        return;
      }
      const start = new Date(startTime);
      const end = new Date(endTime);
      if (end <= start) {
        res.status(400).json({ success: false, error: 'endTime debe ser posterior a startTime' });
        return;
      }
      const row = await prisma.calendarEvent.create({
        data: {
          businessId,
          title,
          description: description ?? null,
          startTime: start,
          endTime: end,
        },
      });
      res.status(201).json({ success: true, message: 'Evento creado', data: row });
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, error: 'Error al crear evento' });
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
      const row = await prisma.calendarEvent.findUnique({ where: { id } });
      if (!row) {
        res.status(404).json({ success: false, error: 'Evento no encontrado' });
        return;
      }
      const gate = await assertCanAccessBusiness(userId, row.businessId);
      if (!gate.ok) {
        res.status(gate.status).json({ success: false, error: gate.message });
        return;
      }
      const { title, description, startTime, endTime } = req.body as Record<string, string | undefined>;
      const updated = await prisma.calendarEvent.update({
        where: { id },
        data: {
          ...(title !== undefined ? { title } : {}),
          ...(description !== undefined ? { description: description || null } : {}),
          ...(startTime !== undefined ? { startTime: new Date(startTime) } : {}),
          ...(endTime !== undefined ? { endTime: new Date(endTime) } : {}),
        },
      });
      res.status(200).json({ success: true, message: 'Evento actualizado', data: updated });
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, error: 'Error al actualizar evento' });
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
      const row = await prisma.calendarEvent.findUnique({ where: { id } });
      if (!row) {
        res.status(404).json({ success: false, error: 'Evento no encontrado' });
        return;
      }
      const gate = await assertCanAccessBusiness(userId, row.businessId);
      if (!gate.ok) {
        res.status(gate.status).json({ success: false, error: gate.message });
        return;
      }
      await prisma.calendarEvent.delete({ where: { id } });
      res.status(200).json({ success: true, message: 'Evento eliminado' });
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, error: 'Error al eliminar evento' });
    }
  }
}
