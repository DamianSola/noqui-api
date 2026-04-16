// controllers/customer.controller.ts
import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import {
  ICustomer,
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerResponse,
} from '../types/customers';
import { prisma } from '../lib/prisma';
import { assertCanAccessBusiness } from '../utils/businessAccess';

export class CustomerController {
  // Crear un nuevo cliente
  static async createCustomer(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'No autenticado' });
        return;
      }

      const { name, email, phone, businessId }: CreateCustomerInput = req.body;

      if (!name || !email || !businessId) {
        const response: CustomerResponse = {
          success: false,
          error: 'Nombre, email y businessId son requeridos',
        };
        res.status(400).json(response);
        return;
      }

      // Verificar si el negocio existe
      const businessExists = await prisma.business.findFirst({
        where: { id: businessId, deletedAt: null },
      });

      if (!businessExists) {
        const response: CustomerResponse = {
          success: false,
          error: 'El negocio no existe',
        };
        res.status(404).json(response);
        return;
      }

      const access = await assertCanAccessBusiness(userId, businessId);
      if (!access.ok) {
        res.status(access.status).json({ success: false, error: access.message });
        return;
      }

      const customer = await prisma.customer.create({
        data: {
          name,
          email,
          phone,
          businessId,
          ownerId: businessExists.ownerId
        },
      });

      const response: CustomerResponse = {
        success: true,
        message: 'Cliente creado exitosamente',
        data: customer,
      };

      res.status(201).json(response);
    } catch (error: any) {
      console.error('Error creating customer:', error);

      if (error.code === 'P2002') {
        const response: CustomerResponse = {
          success: false,
          error: 'Ya existe un cliente con ese email',
        };
        res.status(400).json(response);
        return;
      }

      const response: CustomerResponse = {
        success: false,
        error: 'Error interno del servidor',
      };
      res.status(500).json(response);
    }
  }

  // Obtener todos los clientes por negocio (con paginación y búsqueda)
  static async getAllCustomers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'No autenticado' });
        return;
      }

      const {
        businessId,
        page = 1,
        limit = 10,
        search,
      } = req.query as {
        businessId?: string;
        page?: string | number;
        limit?: string | number;
        search?: string;
      };

      if (!businessId) {
        const response: CustomerResponse = {
          success: false,
          error: 'businessId es requerido para listar clientes',
        };
        res.status(400).json(response);
        return;
      }

      const access = await assertCanAccessBusiness(userId, businessId as string);
      if (!access.ok) {
        res.status(access.status).json({ success: false, error: access.message });
        return;
      }

      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;
      const skip = (pageNumber - 1) * limitNumber;

      const where: any = {
        businessId,
        deletedAt: null,
      };

      if (search && search.trim() !== '') {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [customers, total] = await Promise.all([
        prisma.customer.findMany({
          where,
          skip,
          take: limitNumber,
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.customer.count({ where }),
      ]);

      const response: CustomerResponse = {
        success: true,
        data: customers,
        message: `Se encontraron ${customers.length} clientes para este negocio`,
      };

      res.status(200).json({
        ...response,
        pagination: {
          currentPage: pageNumber,
          totalPages: total === 0 ? 0 : Math.ceil(total / limitNumber),
          totalItems: total,
          itemsPerPage: limitNumber,
        },
      });
    } catch (error) {
      console.error('Error getting customers:', error);
      const response: CustomerResponse = {
        success: false,
        error: 'Error al obtener los clientes',
      };
      res.status(500).json(response);
    }
  }

  static async getCustomersByOwner(req: AuthRequest, res: Response): Promise<void> {
      try {
        const userId = req.user?.userId;
        if (!userId) {
          res.status(401).json({ success: false, error: 'No autenticado' });
          return;
        }

        const { ownerId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        if (ownerId !== userId) {
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
          });
          if (user?.role !== 'ADMIN') {
            res.status(403).json({ success: false, error: 'No autorizado' });
            return;
          }
        }
        const skip = (Number(page) - 1) * Number(limit);
  
        const [customers, total] = await Promise.all([
          prisma.customer.findMany({
            where: { ownerId, deletedAt: null },
            skip,
            take: Number(limit),
            include: {
              business: {
                select: {
                  id: true,
                  name: true,
                  ownerId : true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          }),
          prisma.customer.count({
            where: { ownerId, deletedAt: null }
          })
        ]);
  
        const response: CustomerResponse = {
          success: true,
          data: customers,
          message: `Se encontraron ${customers.length} compañías para este propietario`
        };
  
        res.status(200).json({
          ...response,
          pagination: {
            currentPage: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
            totalItems: total,
            itemsPerPage: Number(limit)
          }
        });
      } catch (error) {
        console.error('Error getting companies by owner:', error);
        const response: CustomerResponse = {
          success: false,
          error: 'Error al obtener los clientes del propietario'
        };
        res.status(500).json(response);
      }
    }

  // Obtener cliente por ID
  static async getCustomerById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'No autenticado' });
        return;
      }

      const { id } = req.params;

      const customer = await prisma.customer.findFirst({
        where: { id, deletedAt: null },
        include: {
          business: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!customer) {
        const response: CustomerResponse = {
          success: false,
          error: 'Cliente no encontrado',
        };
        res.status(404).json(response);
        return;
      }

      const access = await assertCanAccessBusiness(userId, customer.businessId);
      if (!access.ok) {
        res.status(access.status).json({ success: false, error: access.message });
        return;
      }

      const response: CustomerResponse = {
        success: true,
        data: customer,
        message: 'Cliente encontrado',
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error getting customer:', error);
      const response: CustomerResponse = {
        success: false,
        error: 'Error al obtener el cliente',
      };
      res.status(500).json(response);
    }
  }

  // Actualizar cliente
  static async updateCustomer(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'No autenticado' });
        return;
      }

      const { id } = req.params;
      const updateData: UpdateCustomerInput = req.body;

      const existingCustomer = await prisma.customer.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existingCustomer) {
        const response: CustomerResponse = {
          success: false,
          error: 'Cliente no encontrado',
        };
        res.status(404).json(response);
        return;
      }

      const access = await assertCanAccessBusiness(userId, existingCustomer.businessId);
      if (!access.ok) {
        res.status(access.status).json({ success: false, error: access.message });
        return;
      }

      const updatedCustomer = await prisma.customer.update({
        where: { id },
        data: updateData,
      });

      const response: CustomerResponse = {
        success: true,
        message: 'Cliente actualizado exitosamente',
        data: updatedCustomer,
      };

      res.status(200).json(response);
    } catch (error: any) {
      console.error('Error updating customer:', error);

      if (error.code === 'P2002') {
        const response: CustomerResponse = {
          success: false,
          error: 'Ya existe un cliente con ese email',
        };
        res.status(400).json(response);
        return;
      }

      const response: CustomerResponse = {
        success: false,
        error: 'Error al actualizar el cliente',
      };
      res.status(500).json(response);
    }
  }

  // Eliminar cliente
  static async deleteCustomer(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'No autenticado' });
        return;
      }

      const { id } = req.params;

      const existingCustomer = await prisma.customer.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existingCustomer) {
        const response: CustomerResponse = {
          success: false,
          error: 'Cliente no encontrado',
        };
        res.status(404).json(response);
        return;
      }

      const access = await assertCanAccessBusiness(userId, existingCustomer.businessId);
      if (!access.ok) {
        res.status(access.status).json({ success: false, error: access.message });
        return;
      }

      await prisma.customer.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      const response: CustomerResponse = {
        success: true,
        message: 'Cliente eliminado exitosamente',
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error deleting customer:', error);
      const response: CustomerResponse = {
        success: false,
        error: 'Error al eliminar el cliente',
      };
      res.status(500).json(response);
    }
  }
}

export default new CustomerController();
