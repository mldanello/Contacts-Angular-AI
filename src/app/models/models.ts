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
  accessToken?: string;
  access_token?: string;
  token?: string;
  expiresIn?: number;
  expires_at?: string;
}
