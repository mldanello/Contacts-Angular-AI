export interface ContactAddress {
  id: number;
  contactId: number;
  street1: string;
  street2: string;
  city: string;
  county: string;
  state: string;
  zip: string;
  isActive: boolean;
  createdAt: string;
  modifiedAt: string;
}

export interface ContactPhone {
  id: number;
  contactId: number;
  number: string;
  type: string;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  modifiedAt: string;
}

export interface ContactSearchTag {
  id: number;
  contactId: number;
  tagText: string | null;
  isActive: boolean;
  createdAt: string;
  modifiedAt: string;
}

export interface ContactDetail {
  id: number;
  tenantId: number;
  firstName: string;
  middleName: string;
  lastName: string;
  companyName: string;
  email: string;
  web: string;
  notes: string;
  isActive: boolean;
  createdAt: string;
  modifiedAt: string;
  contactAddresses: ContactAddress[];
  contactPhones: ContactPhone[];
  contactSearchTags: ContactSearchTag[];
}
