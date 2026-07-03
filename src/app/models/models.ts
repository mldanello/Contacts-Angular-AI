export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  notes?: string;
}

export interface AuthToken {
  accessToken: string;
  expiresIn: number;
}
