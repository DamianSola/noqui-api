import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { prisma } from '../lib/prisma';
import { assertCanAccessBusiness } from '../utils/businessAccess';
import { writeAuditLog } from '../utils/auditLog';

export class ProductsController {
  static async list(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    const { page = '1', limit = '20', search } = req.query as Record<string, string>;
    
    // Validar usuario autenticado
    if (!userId) {
      res.status(401).json({ success: false, error: 'Usuario no autenticado' });
      return;
    }

    // Obtener TODOS los negocios que posee el usuario
    const userWithBusinesses = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        ownedBusiness: {
          select: { id: true }
        }
      }
    });


    if (!userWithBusinesses || userWithBusinesses.ownedBusiness.length === 0) {
      res.status(404).json({ 
        success: false, 
        error: 'El usuario no posee ningún negocio' 
      });
      return;
    }

    const businessIds = userWithBusinesses.ownedBusiness.map(b => b.id);


        console.log(businessIds)
    
    // Paginación
    const pageNumber = Math.max(1, Number(page));
    const limitNumber = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNumber - 1) * limitNumber;

    // Construir filtro WHERE
    const where = {
      businessId: { in: businessIds }, // ← Productos de TODOS los negocios del usuario
      deletedAt: null,
      ...(search?.trim() && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { sku: { contains: search, mode: 'insensitive' as const } },
        ]
      })
    };

    // Ejecutar consultas en paralelo
    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limitNumber,
        orderBy: { updatedAt: 'desc' },
        include: { 
          inventory: true,
          business: {  // Incluir info del negocio (opcional)
            select: { id: true, name: true }
          }
        },
      }),
      prisma.product.count({ where }),
    ]);



    // Enviar respuesta con metadata adicional
    res.status(200).json({
      success: true,
      data: items,
      pagination: {
        currentPage: pageNumber,
        totalPages: total === 0 ? 0 : Math.ceil(total / limitNumber),
        totalItems: total,
        itemsPerPage: limitNumber,
      },
      metadata: {
        businessesCount: businessIds.length,
        businesses: businessIds, // Opcional: enviar IDs de negocios consultados
      }
    });
  } catch (error) {
    console.error('Error al listar productos:', error);
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
      console.error("el error esta aqui", e);
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

  static async getStats(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Usuario no autenticado' });
      return;
    }

    // Mismo patrón que list(): obtener todos los negocios del usuario
    const userWithBusinesses = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        ownedBusiness: { select: { id: true } }
      }
    });

    if (!userWithBusinesses || userWithBusinesses.ownedBusiness.length === 0) {
      res.status(404).json({ success: false, error: 'El usuario no posee ningún negocio' });
      return;
    }

    const businessIds = userWithBusinesses.ownedBusiness.map(b => b.id);

    const LOW_STOCK_THRESHOLD = 5;

    const [total, active, deleted, inventory] = await Promise.all([
      prisma.product.count({
        where: { businessId: { in: businessIds } },
      }),
      prisma.product.count({
        where: { businessId: { in: businessIds }, deletedAt: null },
      }),
      prisma.product.count({
        where: { businessId: { in: businessIds }, deletedAt: { not: null } },
      }),
      prisma.inventory.findMany({
        where: {
          product: { businessId: { in: businessIds }, deletedAt: null },
        },
        select: {
          productId: true,
          quantity: true,
          product: { select: { price: true } },
        },
      }),
    ]);

    const totalInventoryValue = inventory.reduce(
      (sum, item) => sum + item.quantity * item.product.price,
      0
    );

    // Agrupar por producto (puede tener stock en múltiples ubicaciones)
    const stockByProduct = inventory.reduce<Record<string, number>>((acc, item) => {
      acc[item.productId] = (acc[item.productId] ?? 0) + item.quantity;
      return acc;
    }, {});

    const lowStockCount = Object.values(stockByProduct).filter(
      (qty) => qty < LOW_STOCK_THRESHOLD
    ).length;

    console.log({ total, active, deleted, totalInventoryValue, lowStockCount });

    res.status(200).json({
      success: true,
      data: {
        total,
        active,
        deleted,
        totalInventoryValue,
        lowStockCount,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'Error al obtener estadísticas' });
  }
}
}
