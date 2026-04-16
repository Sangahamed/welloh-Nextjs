import { db, profilesTable, portfoliosTable, analysesTable } from '@workspace/db';
import { eq, desc } from 'drizzle-orm';
import { UserAccount, HistoryItem, Alert } from '../types';
import { User as SupabaseUser } from '@supabase/supabase-js';

export async function getUserAccount(userId: string): Promise<UserAccount | null> {
  const profile = await db.query.profilesTable.findFirst({
    where: eq(profilesTable.id, userId),
  });

  if (!profile) return null;

  // Fetch analysis history
  const history = await db.query.analysesTable.findMany({
    where: eq(analysesTable.userId, userId),
    orderBy: [desc(analysesTable.createdAt)],
    limit: 20
  });

  // Map to UserAccount interface
  return {
    ...profile,
    fullName: profile.displayName || 'Trader',
    totalProfitLoss: profile.totalProfitLoss || "0",
    winRate: profile.winRate || "0",
    analysisHistory: history.map(h => ({
      id: h.id,
      userId: h.userId,
      companyIdentifier: h.companyIdentifier,
      comparisonIdentifier: h.comparisonIdentifier || undefined,
      currency: h.currency || undefined,
      analysisData: h.analysisData,
      newsData: h.newsData,
      timestamp: h.createdAt?.toISOString() || new Date().toISOString()
    })),
    alerts: [], // Placeholder for now
    createdAt: profile.createdAt?.toISOString() || new Date().toISOString()
  } as UserAccount;
}

export async function ensureUserProfileAndPortfolio(supabaseUser: SupabaseUser) {
  const userId = supabaseUser.id;
  console.log(`[DB] Ensuring profile/portfolio for ${userId}`);
  
  return await db.transaction(async (tx) => {
    // 1. Ensure Profile
    let profile = await tx.query.profilesTable.findFirst({
      where: eq(profilesTable.id, userId)
    });

    if (!profile) {
      console.log(`[DB] Profile missing for ${userId}, creating...`);
      const [newProfile] = await tx.insert(profilesTable).values({
        id: userId,
        username: (supabaseUser.email?.split('@')[0] || `user`) + `_${userId.slice(0, 4)}_${Math.floor(Math.random() * 1000)}`,
        displayName: (supabaseUser.user_metadata as any)?.full_name || 'Trader',
        role: 'user',
        league: 'bronze',
        level: 1,
        experiencePoints: 0
      }).returning();
      profile = newProfile;
      console.log(`[DB] Created profile: ${profile.id}`);
    } else {
      console.log(`[DB] Profile already exists for ${userId}`);
    }

    // 2. Ensure Portfolio
    const portfolio = await tx.query.portfoliosTable.findFirst({
      where: eq(portfoliosTable.userId, userId)
    });

    if (!portfolio) {
      console.log(`[DB] Portfolio missing for ${userId}, creating...`);
      await tx.insert(portfoliosTable).values({
        userId,
        name: 'Main Portfolio',
        initialBalance: '100000',
        currentBalance: '100000'
      });
      console.log(`[DB] Created portfolio for ${userId}`);
    } else {
      console.log(`[DB] Portfolio already exists for ${userId}`);
    }

    return profile;
  });
}

export async function updateUserAccount(userId: string, updates: Partial<UserAccount>) {
  const { fullName, ...rest } = updates;
  const dbUpdates: any = { ...rest };
  if (fullName) dbUpdates.displayName = fullName;

  const [updated] = await db.update(profilesTable)
    .set(dbUpdates)
    .where(eq(profilesTable.id, userId))
    .returning();
    
  return getUserAccount(userId);
}

export async function getAllUsers(): Promise<UserAccount[]> {
  const profiles = await db.query.profilesTable.findMany();
  const accounts = await Promise.all(profiles.map(p => getUserAccount(p.id)));
  return accounts.filter(a => a !== null) as UserAccount[];
}

export async function addAnalysisHistory(userId: string, item: Omit<HistoryItem, 'id' | 'timestamp'>) {
  const [newItem] = await db.insert(analysesTable).values({
    userId,
    companyIdentifier: item.companyIdentifier,
    comparisonIdentifier: item.comparisonIdentifier,
    currency: item.currency,
    analysisData: item.analysisData,
    newsData: item.newsData
  }).returning();

  return {
    ...newItem,
    timestamp: newItem.createdAt?.toISOString() || new Date().toISOString()
  };
}

export async function clearAnalysisHistory(userId: string) {
  await db.delete(analysesTable).where(eq(analysesTable.userId, userId));
  return true;
}

// Alerts - Placeholder implementations
export async function addAlert(userId: string, alertData: Omit<Alert, 'id'>) {
  return null; 
}

export async function removeAlert(alertId: string) {
  return true;
}
