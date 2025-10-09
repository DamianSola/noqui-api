export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: string;
      email: string;
      name: string | null;
      role: string;
    };
    token?: string;
  };
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}