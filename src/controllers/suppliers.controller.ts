import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { prisma } from '../lib/prisma';
import { assertCanAccessBusiness } from '../utils/businessAccess';

export class SuppliersController {
  static async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { businessId, page = '1', limit = '30', search } = req.query as Record<string, string>;
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
        ...(search?.trim()
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { email: { contains: search, mode: 'insensitive' as const } },
                { contactName: { contains: search, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      };
      const [items, total] = await Promise.all([
        prisma.supplier.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { updatedAt: 'desc' },
        }),
        prisma.supplier.count({ where }),
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
      res.status(500).json({ success: false, error: 'Error al listar proveedores' });
    }
  }

  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'No autenticado' });
        return;
      }
      const { businessId, name, contactName, email, phone } = req.body as Record<string, string | undefined>;
      if (!businessId || !name) {
        res.status(400).json({ success: false, error: 'businessId y name son requeridos' });
        return;
      }
      const gate = await assertCanAccessBusiness(userId, businessId);
      if (!gate.ok) {
        res.status(gate.status).json({ success: false, error: gate.message });
        return;
      }
      const row = await prisma.supplier.create({
        data: {
          businessId,
          name,
          contactName: contactName ?? null,
          email: email ?? null,
          phone: phone ?? null,
        },
      });
      res.status(201).json({ success: true, message: 'Proveedor creado', data: row });
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, error: 'Error al crear proveedor' });
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
      const row = await prisma.supplier.findUnique({ where: { id } });
      if (!row) {
        res.status(404).json({ success: false, error: 'Proveedor no encontrado' });
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
      res.status(500).json({ success: false, error: 'Error al obtener proveedor' });
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
      const row = await prisma.supplier.findUnique({ where: { id } });
      if (!row) {
        res.status(404).json({ success: false, error: 'Proveedor no encontrado' });
        return;
      }
      const gate = await assertCanAccessBusiness(userId, row.businessId);
      if (!gate.ok) {
        res.status(gate.status).json({ success: false, error: gate.message });
        return;
      }
      const { name, contactName, email, phone } = req.body as Record<string, unknown>;
      const updated = await prisma.supplier.update({
        where: { id },
        data: {
          ...(name !== undefined ? { name: String(name) } : {}),
          ...(contactName !== undefined ? { contactName: contactName ? String(contactName) : null } : {}),
          ...(email !== undefined ? { email: email ? String(email) : null } : {}),
          ...(phone !== undefined ? { phone: phone ? String(phone) : null } : {}),
        },
      });
      res.status(200).json({ success: true, message: 'Proveedor actualizado', data: updated });
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, error: 'Error al actualizar proveedor' });
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
      const row = await prisma.supplier.findUnique({ where: { id } });
      if (!row) {
        res.status(404).json({ success: false, error: 'Proveedor no encontrado' });
        return;
      }
      const gate = await assertCanAccessBusiness(userId, row.businessId);
      if (!gate.ok) {
        res.status(gate.status).json({ success: false, error: gate.message });
        return;
      }
      await prisma.supplier.delete({ where: { id } });
      res.status(200).json({ success: true, message: 'Proveedor eliminado' });
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, error: 'Error al eliminar proveedor' });
    }
  }
}
