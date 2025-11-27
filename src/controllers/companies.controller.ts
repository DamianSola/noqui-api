// controllers/company.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

import { 
  ICompany, 
  CreateCompanyInput, 
  UpdateCompanyInput, 
  CompanyResponse 
} from '../types/company';

const prisma = new PrismaClient();


export class CompanyController {
  
  // Crear una nueva compañía
  async createCompany(req: Request, res: Response): Promise<void> {
    try {
      const { name, ownerId, guests = [] }: CreateCompanyInput = req.body;

      // Validaciones básicas
      if (!name || !ownerId) {
        const response: CompanyResponse = {
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
        const response: CompanyResponse = {
          success: false,
          error: 'El usuario propietario no existe'
        };
        res.status(404).json(response);
        return;
      }

      const company = await prisma.company.create({
        data: {
          name,
          ownerId,
          guests
        }
      });

      const response: CompanyResponse = {
        success: true,
        message: 'Compañía creada exitosamente',
        data: company
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Error creating company:', error);
      const response: CompanyResponse = {
        success: false,
        error: 'Error interno del servidor'
      };
      res.status(500).json(response);
    }
  }

  // Obtener todas las compañías
  async getAllCompanies(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const [companies, total] = await Promise.all([
        prisma.company.findMany({
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
        prisma.company.count()
      ]);

      const response: CompanyResponse = {
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
      const response: CompanyResponse = {
        success: false,
        error: 'Error al obtener las compañías'
      };
      res.status(500).json(response);
    }
  }

  // Obtener compañía por ID
  async getCompanyById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const company = await prisma.company.findUnique({
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
        const response: CompanyResponse = {
          success: false,
          error: 'Compañía no encontrada'
        };
        res.status(404).json(response);
        return;
      }

      const response: CompanyResponse = {
        success: true,
        data: company
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error getting company:', error);
      const response: CompanyResponse = {
        success: false,
        error: 'Error al obtener la compañía'
      };
      res.status(500).json(response);
    }
  }

  // Actualizar compañía
  async updateCompany(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdateCompanyInput = req.body;

      // Verificar si la compañía existe
      const existingCompany = await prisma.company.findUnique({
        where: { id }
      });

      if (!existingCompany) {
        const response: CompanyResponse = {
          success: false,
          error: 'Compañía no encontrada'
        };
        res.status(404).json(response);
        return;
      }

      const updatedCompany = await prisma.company.update({
        where: { id },
        data: updateData
      });

      const response: CompanyResponse = {
        success: true,
        message: 'Compañía actualizada exitosamente',
        data: updatedCompany
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error updating company:', error);
      const response: CompanyResponse = {
        success: false,
        error: 'Error al actualizar la compañía'
      };
      res.status(500).json(response);
    }
  }

  // Eliminar compañía
  async deleteCompany(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Verificar si la compañía existe
      const existingCompany = await prisma.company.findUnique({
        where: { id }
      });

      if (!existingCompany) {
        const response: CompanyResponse = {
          success: false,
          error: 'Compañía no encontrada'
        };
        res.status(404).json(response);
        return;
      }

      await prisma.company.delete({
        where: { id }
      });

      const response: CompanyResponse = {
        success: true,
        message: 'Compañía eliminada exitosamente'
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error deleting company:', error);
      const response: CompanyResponse = {
        success: false,
        error: 'Error al eliminar la compañía'
      };
      res.status(500).json(response);
    }
  }

  // Obtener compañías por owner
  async getCompaniesByOwner(req: Request, res: Response): Promise<void> {
    try {
      const { ownerId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const [companies, total] = await Promise.all([
        prisma.company.findMany({
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
        prisma.company.count({
          where: { ownerId }
        })
      ]);

      const response: CompanyResponse = {
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
      const response: CompanyResponse = {
        success: false,
        error: 'Error al obtener las compañías del propietario'
      };
      res.status(500).json(response);
    }
  }

  // Agregar guest a compañía
  async addGuestToCompany(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { guestId } = req.body;

      if (!guestId) {
        const response: CompanyResponse = {
          success: false,
          error: 'guestId es requerido'
        };
        res.status(400).json(response);
        return;
      }

      // Verificar si la compañía existe
      const existingCompany = await prisma.company.findUnique({
        where: { id }
      });

      if (!existingCompany) {
        const response: CompanyResponse = {
          success: false,
          error: 'Compañía no encontrada'
        };
        res.status(404).json(response);
        return;
      }

      // Verificar si el guest ya existe
      if (existingCompany.guests.includes(guestId)) {
        const response: CompanyResponse = {
          success: false,
          error: 'El usuario ya es un guest de esta compañía'
        };
        res.status(400).json(response);
        return;
      }

      const updatedCompany = await prisma.company.update({
        where: { id },
        data: {
          guests: {
            push: guestId
          }
        }
      });

      const response: CompanyResponse = {
        success: true,
        message: 'Guest agregado exitosamente',
        data: updatedCompany
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error adding guest to company:', error);
      const response: CompanyResponse = {
        success: false,
        error: 'Error al agregar el guest'
      };
      res.status(500).json(response);
    }
  }

  // Remover guest de compañía
  async removeGuestFromCompany(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { guestId } = req.body;

      if (!guestId) {
        const response: CompanyResponse = {
          success: false,
          error: 'guestId es requerido'
        };
        res.status(400).json(response);
        return;
      }

      // Verificar si la compañía existe
      const existingCompany = await prisma.company.findUnique({
        where: { id }
      });

      if (!existingCompany) {
        const response: CompanyResponse = {
          success: false,
          error: 'Compañía no encontrada'
        };
        res.status(404).json(response);
        return;
      }

      // Filtrar el guest a remover
      const updatedGuests = existingCompany.guests.filter((g:any) => g !== guestId);

      const updatedCompany = await prisma.company.update({
        where: { id },
        data: {
          guests: updatedGuests
        }
      });

      const response: CompanyResponse = {
        success: true,
        message: 'Guest removido exitosamente',
        data: updatedCompany
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error removing guest from company:', error);
      const response: CompanyResponse = {
        success: false,
        error: 'Error al remover el guest'
      };
      res.status(500).json(response);
    }
  }
}

export default new CompanyController();