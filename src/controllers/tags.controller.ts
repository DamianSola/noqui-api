import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { prisma } from '../lib/prisma';
import { assertCanAccessBusiness } from '../utils/businessAccess';

export class TagsController {
  static async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { businessId } = req.query as Record<string, string>;
      if (!userId || !businessId) {
        res.status(400).json({ success: false, error: 'businessId requerido' });
        return;
      }
      const gate = await assertCanAccessBusiness(userId, businessId);
      if (!gate.ok) {
        res.status(gate.status).json({ success: false, error: gate.message });
        return;
      }
      const tags = await prisma.tag.findMany({
        where: { businessId },
        orderBy: { name: 'asc' },
      });
      res.status(200).json({ success: true, data: tags });
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, error: 'Error al listar etiquetas' });
    }
  }

  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'No autenticado' });
        return;
      }
      const { businessId, name } = req.body as { businessId?: string; name?: string };
      if (!businessId || !name?.trim()) {
        res.status(400).json({ success: false, error: 'businessId y name son requeridos' });
        return;
      }
      const gate = await assertCanAccessBusiness(userId, businessId);
      if (!gate.ok) {
        res.status(gate.status).json({ success: false, error: gate.message });
        return;
      }
      const tag = await prisma.tag.create({
        data: { businessId, name: name.trim() },
      });
      res.status(201).json({ success: true, message: 'Etiqueta creada', data: tag });
    } catch (e: any) {
      console.error(e);
      if (e.code === 'P2002') {
        res.status(400).json({ success: false, error: 'Ya existe esa etiqueta en el negocio' });
        return;
      }
      res.status(500).json({ success: false, error: 'Error al crear etiqueta' });
    }
  }

  static async attachProduct(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const tagId = req.params.tagId as string;
      if (!userId) {
        res.status(401).json({ success: false, error: 'No autenticado' });
        return;
      }
      if (!tagId) {
        res.status(400).json({ success: false, error: 'tagId requerido' });
        return;
      }
      const { productId } = req.body as { productId?: string };
      if (!productId) {
        res.status(400).json({ success: false, error: 'productId requerido' });
        return;
      }
      const tag = await prisma.tag.findUnique({ where: { id: tagId } });
      if (!tag) {
        res.status(404).json({ success: false, error: 'Etiqueta no encontrada' });
        return;
      }
      const gate = await assertCanAccessBusiness(userId, tag.businessId);
      if (!gate.ok) {
        res.status(gate.status).json({ success: false, error: gate.message });
        return;
      }
      const product = await prisma.product.findFirst({
        where: { id: productId, businessId: tag.businessId, deletedAt: null },
      });
      if (!product) {
        res.status(404).json({ success: false, error: 'Producto no encontrado en el negocio' });
        return;
      }
      const link = await prisma.productTag.create({
        data: { productId, tagId },
        include: { tag: true, product: { select: { id: true, name: true } } },
      });
      res.status(201).json({ success: true, message: 'Etiqueta asignada', data: link });
    } catch (e: any) {
      console.error(e);
      if (e.code === 'P2002') {
        res.status(400).json({ success: false, error: 'El producto ya tiene esta etiqueta' });
        return;
      }
      res.status(500).json({ success: false, error: 'Error al asignar etiqueta' });
    }
  }

  static async detachProduct(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { tagId, productId } = req.params;
      if (!userId) {
        res.status(401).json({ success: false, error: 'No autenticado' });
        return;
      }
      const tag = await prisma.tag.findUnique({ where: { id: tagId } });
      if (!tag) {
        res.status(404).json({ success: false, error: 'Etiqueta no encontrada' });
        return;
      }
      const gate = await assertCanAccessBusiness(userId, tag.businessId);
      if (!gate.ok) {
        res.status(gate.status).json({ success: false, error: gate.message });
        return;
      }
      await prisma.productTag.deleteMany({
        where: { tagId, productId },
      });
      res.status(200).json({ success: true, message: 'Etiqueta quitada del producto' });
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, error: 'Error al quitar etiqueta' });
    }
  }
}
