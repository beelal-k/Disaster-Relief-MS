export interface User {
  _id: string;
  email: string;
  role: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Need {
  _id: string;
  type: string;
  description: string;
  urgency: 'high' | 'medium' | 'low';
  location: {
    lat: number;
    lng: number;
  };
  status: 'pending' | 'in-progress' | 'resolved';
  createdBy: User;
  assignedTo?: Organization;
  eta?: number;
  createdAt: string;
}

export interface Resource {
  _id: string;
  type: string;
  quantity: number;
  location: {
    lat: number;
    lng: number;
  };
  status: 'available' | 'in-transit' | 'depleted';
  organization: Organization;
  createdAt: string;
}

export interface Organization {
  _id: string;
  name: string;
  description: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  website?: string;
  admin: User;
  members: User[];
}
