// types/company.ts
export interface CreateBusinessInput {
  name: string;
}

export interface UpdateBusinessInput {
  name?: string;
  guests?: string[]; // Array de user IDs
}



export interface IBusiness {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  guests: string[];
}

export interface CreateBusinessInput {
  name: string;
  ownerId: string;
  guests?: string[];
}

export interface UpdateBusinessInput {
  name?: string;
  guests?: string[];
}

export interface BusinessResponse {
  success: boolean;
  message?: string;
  data?: IBusiness | IBusiness[];
  error?: string;
}