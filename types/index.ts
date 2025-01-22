type User = {
  _id: string;
  email: string;
  role: string;
};

type Need = {
  _id: string;
  type: string;
  description: string;
  urgency: string;
  location: { lat: number; lng: number };
  createdBy: User;
  createdAt: Date;
  updatedAt: Date;
};

type Resource = {
  _id: string;
  type: string;
  description: string;
  quantity: number;
  status: string;
  location: { lat: number; lng: number };
  createdBy: User;
  createdAt: Date;
  updatedAt: Date;
};

export type { Need, Resource, User };
