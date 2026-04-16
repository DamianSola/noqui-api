import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { prisma } from '../lib/prisma';
import { assertCanAccessBusiness } from '../utils/businessAccess';
import { writeAuditLog } from '../utils/auditLog';

export class ProductsController {
  static async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { businessId, page = '1', limit = '20', search } = req.query as Record<string, string>;
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
        deletedAt: null,
        ...(search?.trim()
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { sku: { contains: search, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      };
      const [items, total] = await Promise.all([
        prisma.product.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { updatedAt: 'desc' },
          include: { inventory: true },
        }),
        prisma.product.count({ where }),
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
      res.status(500).json({ success: false, error: 'Error al listar productos' });
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
      const product = await prisma.product.findFirst({
        where: { id, deletedAt: null },
        include: { inventory: true, productTags: { include: { tag: true } } },
      });
      if (!product) {
        res.status(404).json({ success: false, error: 'Producto no encontrado' });
        return;
      }
      const gate = await assertCanAccessBusiness(userId, product.businessId);
      if (!gate.ok) {
        res.status(gate.status).json({ success: false, error: gate.message });
        return;
      }
      res.status(200).json({ success: true, data: product });
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, error: 'Error al obtener producto' });
    }
  }

  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'No autenticado' });
        return;
      }
      const { businessId, name, price, taxRate, description, sku, minStock } = req.body as {
        businessId?: string;
        name?: string;
        price?: number;
        taxRate?: number;
        description?: string | null;
        sku?: string | null;
        minStock?: number;
      };
      if (!businessId || !name || price === undefined || price === null) {
        res.status(400).json({ success: false, error: 'businessId, name y price son requeridos' });
        return;
      }
      const gate = await assertCanAccessBusiness(userId, businessId);
      if (!gate.ok) {
        res.status(gate.status).json({ success: false, error: gate.message });
        return;
      }

      const result = await prisma.$transaction(async (tx) => {
        const product = await tx.product.create({
          data: {
            businessId,
            name,
            price: Number(price),
            taxRate: taxRate !== undefined ? Number(taxRate) : 0,
            description: description ?? null,
            sku: sku ?? null,
          },
        });
        await tx.inventory.create({
          data: {
            businessId,
            productId: product.id,
            quantity: 0,
            minStock: minStock !== undefined ? Number(minStock) : 0,
          },
        });
        return product;
      });

      await writeAuditLog(userId, 'PRODUCT_CREATE', JSON.stringify({ productId: result.id, businessId }));

      res.status(201).json({ success: true, message: 'Producto creado', data: result });
    } catch (e: any) {
      console.error(e);
      if (e.code === 'P2002') {
        res.status(400).json({ success: false, error: 'SKU duplicado' });
        return;
      }
      res.status(500).json({ success: false, error: 'Error al crear producto' });
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
      const existing = await prisma.product.findFirst({ where: { id, deletedAt: null } });
      if (!existing) {
        res.status(404).json({ success: false, error: 'Producto no encontrado' });
        return;
      }
      const gate = await assertCanAccessBusiness(userId, existing.businessId);
      if (!gate.ok) {
        res.status(gate.status).json({ success: false, error: gate.message });
        return;
      }
      const { name, price, taxRate, description, sku } = req.body as Record<string, unknown>;

      const updated = await prisma.product.update({
        where: { id },
        data: {
          ...(name !== undefined ? { name: String(name) } : {}),
          ...(price !== undefined ? { price: Number(price) } : {}),
          ...(taxRate !== undefined ? { taxRate: Number(taxRate) } : {}),
          ...(description !== undefined ? { description: description as string | null } : {}),
          ...(sku !== undefined ? { sku: sku as string | null } : {}),
        },
      });
      res.status(200).json({ success: true, message: 'Producto actualizado', data: updated });
    } catch (e: any) {
      console.error(e);
      if (e.code === 'P2002') {
        res.status(400).json({ success: false, error: 'SKU duplicado' });
        return;
      }
      res.status(500).json({ success: false, error: 'Error al actualizar producto' });
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
      const existing = await prisma.product.findFirst({ where: { id, deletedAt: null } });
      if (!existing) {
        res.status(404).json({ success: false, error: 'Producto no encontrado' });
        return;
      }
      const gate = await assertCanAccessBusiness(userId, existing.businessId);
      if (!gate.ok) {
        res.status(gate.status).json({ success: false, error: gate.message });
        return;
      }
      await prisma.product.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      await writeAuditLog(userId, 'PRODUCT_SOFT_DELETE', JSON.stringify({ productId: id }));
      res.status(200).json({ success: true, message: 'Producto eliminado' });
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, error: 'Error al eliminar producto' });
    }
  }
}
