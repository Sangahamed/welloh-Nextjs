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
  avatarUrl?: string;
  bio?: string;
  country?: string;
  institution?: string;
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
