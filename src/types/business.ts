export interface IBusiness {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  guests: string[];
}

export interface CreateBusinessInput {
  name: string;
  ownerId: string;
  guests?: string[];
  /** Opcional; si no se envía, se genera a partir del nombre */
  slug?: string;
}

export interface UpdateBusinessInput {
  name?: string;
  slug?: string;
  guests?: string[];
}

export interface BusinessResponse {
  success: boolean;
  message?: string;
  data?: IBusiness | IBusiness[];
  error?: string;
}