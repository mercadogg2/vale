
export type UserRole = 'client' | 'pro' | 'admin' | 'guest';

export enum SubscriptionPlan {
  GRATIS = 'GRATIS',
  PLUS = 'PLUS',
  PREMIUM = 'PREMIUM'
}

export interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  fee: string;
  color: string;
  buttonColor: string;
  features: string[];
  recommended: boolean;
}

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export type ReputationLevel = 'Novato' | 'Bronze' | 'Prata' | 'Ouro' | 'Diamante';

export interface Review {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Professional {
  id: string;
  name: string;
  photo: string;
  description: string;
  services: string[];
  cities: string[];
  verified: boolean; // Mantido para compatibilidade, reflete status === 'verified'
  verificationStatus: VerificationStatus;
  rating: number;
  reviewCount: number;
  plan: string; // Alterado de SubscriptionPlan (enum) para string para suportar planos dinâmicos
  basePrice: number;
  credits: number; // Novo: Saldo de créditos para desbloquear contatos
  pixKey?: string;
  reviews: Review[];
}

export interface Booking {
  id: string;
  proId: string;
  clientId: string;
  clientName: string;
  proName: string;
  service: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'paid';
  date: string;
  price: number;
}

export interface ServiceRequest {
  id: string;
  clientId: string;
  category: string;
  description: string;
  city: string;
  urgency: 'low' | 'medium' | 'high';
  status: 'open' | 'closed';
  createdAt: string;
  contactPhone?: string; // Novo: Telefone real do cliente (mascarado até desbloqueio)
  unlockedBy: string[]; // Novo: Lista de IDs de profissionais que desbloquearam este contato
}
