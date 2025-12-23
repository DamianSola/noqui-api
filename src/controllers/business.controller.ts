// controllers/company.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

import { 
  IBusiness, 
  CreateBusinessInput, 
  UpdateBusinessInput, 
  BusinessResponse 
} from '../types/business';

const prisma = new PrismaClient();


export class BusinessController {
  
  // Crear una nueva compañía
  static async createBusiness(req: Request, res: Response): Promise<void> {
    try {
      const { name, ownerId, guests = [] }: CreateBusinessInput = req.body;

      // Validaciones básicas
      if (!name || !ownerId) {
        const response: BusinessResponse = {
          success: false,
          error: 'Nombre y ownerId son requeridos'
        };
        res.status(400).json(response);
        return;
      }

      // Verificar si el usuario existe
      const userExists = await prisma.user.findUnique({
        where: { id: ownerId }
      });

      if (!userExists) {
        const response: BusinessResponse = {
          success: false,
          error: 'El usuario propietario no existe'
        };
        res.status(404).json(response);
        return;
      }

      const business = await prisma.business.create({
        data: {
          name,
          ownerId,
          guests
        }
      });

      const response: BusinessResponse = {
        success: true,
        message: 'Compañía creada exitosamente',
        data: business
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Error creating company:', error);
      const response: BusinessResponse = {
        success: false,
        error: 'Error interno del servidor'
      };
      res.status(500).json(response);
    }
  }

  // Obtener todas las compañías
  static async getAllBusiness(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const [companies, total] = await Promise.all([
        prisma.business.findMany({
          skip,
          take: Number(limit),
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }),
        prisma.business.count()
      ]);

      const response: BusinessResponse = {
        success: true,
        data: companies,
        message: `Se encontraron ${companies.length} compañías`
      };

      // Agregar metadata de paginación
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
      console.error('Error getting companies:', error);
      const response: BusinessResponse = {
        success: false,
        error: 'Error al obtener los negocios'
      };
      res.status(500).json(response);
    }
  }

  // Obtener compañía por ID
  static async getBusinessById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const company = await prisma.business.findUnique({
        where: { id },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      if (!company) {
        const response: BusinessResponse = {
          success: false,
          error: 'Compañía no encontrada'
        };
        res.status(404).json(response);
        return;
      }

      const response: BusinessResponse = {
        success: true,
        data: company
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error getting company:', error);
      const response: BusinessResponse = {
        success: false,
        error: 'Error al obtener la compañía'
      };
      res.status(500).json(response);
    }
  }

  // Actualizar compañía
  static async updateBusiness(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdateBusinessInput = req.body;

      // Verificar si la compañía existe
      const existingCompany = await prisma.business.findUnique({
        where: { id }
      });

      if (!existingCompany) {
        const response: BusinessResponse = {
          success: false,
          error: 'Compañía no encontrada'
        };
        res.status(404).json(response);
        return;
      }

      const updatedCompany = await prisma.business.update({
        where: { id },
        data: updateData
      });

      const response: BusinessResponse = {
        success: true,
        message: 'Compañía actualizada exitosamente',
        data: updatedCompany
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error updating company:', error);
      const response: BusinessResponse = {
        success: false,
        error: 'Error al actualizar la compañía'
      };
      res.status(500).json(response);
    }
  }

  // Eliminar compañía
  static async deleteBusiness(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Verificar si la compañía existe
      const existingCompany = await prisma.business.findUnique({
        where: { id }
      });

      if (!existingCompany) {
        const response: BusinessResponse = {
          success: false,
          error: 'Compañía no encontrada'
        };
        res.status(404).json(response);
        return;
      }

      await prisma.business.delete({
        where: { id }
      });

      const response: BusinessResponse = {
        success: true,
        message: 'Compañía eliminada exitosamente'
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error deleting company:', error);
      const response: BusinessResponse = {
        success: false,
        error: 'Error al eliminar la compañía'
      };
      res.status(500).json(response);
    }
  }

  // Obtener compañías por owner
  static async getBusinessByOwner(req: Request, res: Response): Promise<void> {
    try {
      const { ownerId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const [companies, total] = await Promise.all([
        prisma.business.findMany({
          where: { ownerId },
          skip,
          take: Number(limit),
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }),
        prisma.business.count({
          where: { ownerId }
        })
      ]);

      const response: BusinessResponse = {
        success: true,
        data: companies,
        message: `Se encontraron ${companies.length} compañías para este propietario`
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
      const response: BusinessResponse = {
        success: false,
        error: 'Error al obtener las compañías del propietario'
      };
      res.status(500).json(response);
    }
  }

  // Agregar guest a compañía
  static async addGuestToBusiness(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { guestId } = req.body;

      if (!guestId) {
        const response: BusinessResponse = {
          success: false,
          error: 'guestId es requerido'
        };
        res.status(400).json(response);
        return;
      }

      // Verificar si la compañía existe
      const existingCompany = await prisma.business.findUnique({
        where: { id }
      });

      if (!existingCompany) {
        const response: BusinessResponse = {
          success: false,
          error: 'Compañía no encontrada'
        };
        res.status(404).json(response);
        return;
      }

      // Verificar si el guest ya existe
      if (existingCompany.guests.includes(guestId)) {
        const response: BusinessResponse = {
          success: false,
          error: 'El usuario ya es un guest de esta compañía'
        };
        res.status(400).json(response);
        return;
      }

      const updatedCompany = await prisma.business.update({
        where: { id },
        data: {
          guests: {
            push: guestId
          }
        }
      });

      const response: BusinessResponse = {
        success: true,
        message: 'Guest agregado exitosamente',
        data: updatedCompany
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error adding guest to company:', error);
      const response: BusinessResponse = {
        success: false,
        error: 'Error al agregar el guest'
      };
      res.status(500).json(response);
    }
  }

  // Remover guest de compañía
  static async removeGuestFromBusiness(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { guestId } = req.body;

      if (!guestId) {
        const response: BusinessResponse = {
          success: false,
          error: 'guestId es requerido'
        };
        res.status(400).json(response);
        return;
      }

      // Verificar si la compañía existe
      const existingCompany = await prisma.business.findUnique({
        where: { id }
      });

      if (!existingCompany) {
        const response: BusinessResponse = {
          success: false,
          error: 'Compañía no encontrada'
        };
        res.status(404).json(response);
        return;
      }

      // Filtrar el guest a remover
      const updatedGuests = existingCompany.guests.filter((g:any) => g !== guestId);

      const updatedCompany = await prisma.business.update({
        where: { id },
        data: {
          guests: updatedGuests
        }
      });

      const response: BusinessResponse = {
        success: true,
        message: 'Guest removido exitosamente',
        data: updatedCompany
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error removing guest from company:', error);
      const response: BusinessResponse = {
        success: false,
        error: 'Error al remover el guest'
      };
      res.status(500).json(response);
    }
  }
}

export default new BusinessController();