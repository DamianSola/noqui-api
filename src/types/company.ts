// types/company.ts
export interface CreateCompanyInput {
  name: string;
}

export interface UpdateCompanyInput {
  name?: string;
  guests?: string[]; // Array de user IDs
}



export interface ICompany {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  guests: string[];
}

export interface CreateCompanyInput {
  name: string;
  ownerId: string;
  guests?: string[];
}

export interface UpdateCompanyInput {
  name?: string;
  guests?: string[];
}

export interface CompanyResponse {
  success: boolean;
  message?: string;
  data?: ICompany | ICompany[];
  error?: string;
}