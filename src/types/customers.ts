// types/customer.ts
import { Customer } from '@prisma/client';

export interface ICustomer extends Customer {}

export interface CreateCustomerInput {
  name: string;
  email: string;
  phone?: string;
  businessId: string;
}

export interface UpdateCustomerInput {
  name?: string;
  email?: string;
  phone?: string;
}

export interface CustomerResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: ICustomer | ICustomer[] | null;
}
