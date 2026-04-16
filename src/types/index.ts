export interface User {
  id: string;
  email?: string;
  fullName?: string;
  role?: string;
}

export interface UserAccount {
  id: string;
  email?: string;
  fullName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  country?: string | null;
  institution?: string | null;
  role: string;
  league: string;
  level: number;
  experiencePoints: number;
  totalProfitLoss: string;
  totalTrades: number;
  winRate: string;
  analysisHistory: HistoryItem[];
  alerts: Alert[];
  createdAt: string;
  // Champs supplémentaires de la base de données réelle
  isSuspended?: boolean;
  isVerified?: boolean;
  followingCount?: number;
  followersCount?: number;
  cashBalance?: string;
  initialCapital?: string;
}

export interface HistoryItem {
  id: string;
  userId: string;
  companyIdentifier: string;
  comparisonIdentifier?: string;
  currency?: string;
  analysisData: any;
  newsData: any;
  timestamp: string;
}

export interface Alert {
  id: string;
  userId: string;
  symbol: string;
  type: string;
  targetPrice: string;
  status: string;
  createdAt: string;
}
