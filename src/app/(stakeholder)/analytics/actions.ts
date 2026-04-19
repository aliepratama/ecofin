'use server';

import { and, desc, eq, inArray, gte } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { db } from '@/libs/DB';
import { createClient } from '@/libs/supabase/server';
import {
  businesses,
  creditScores,
  stakeholderBusinesses,
  stakeholders,
  transactions,
} from '@/models/Schema';

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

type BusinessAggregate = {
  businessId: string;
  businessName: string;
  totalRevenue: number;
  totalExpense: number;
  netCashflow: number;
  transactionCount: number;
  aiValidationRatio: number;
  trustScore: number | null;
  monthlyTrend: MonthlyAggregate[];
};

type MonthlyAggregate = {
  month: string;
  revenue: number;
  expense: number;
};

export type StakeholderPortfolioAnalytics = {
  institutionName: string;
  minMediumTrustScore: number;
  minHighTrustScore: number;
  linkedBusinesses: BusinessAggregate[];
  portfolioRevenue: number;
  portfolioExpense: number;
  portfolioNetCashflow: number;
  averageTrustScore: number | null;
  averageAiValidationRatio: number;
  monthlyTrend: MonthlyAggregate[];
};

async function getAuthenticatedUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user.id;
}

export async function updateTrustScoreSettingsAction(formData: FormData) {
  const userId = await getAuthenticatedUserId();
  const minMedium = Number.parseInt(formData.get('minMedium') as string, 10);
  const minHigh = Number.parseInt(formData.get('minHigh') as string, 10);

  if (isNaN(minMedium) || isNaN(minHigh) || minMedium >= minHigh) {
    throw new Error('Range nilai tidak valid.');
  }

  await db
    .update(stakeholders)
    .set({ minMediumTrustScore: minMedium, minHighTrustScore: minHigh })
    .where(eq(stakeholders.userId, userId));
}

export async function updateInstitutionNameAction(formData: FormData) {
  const userId = await getAuthenticatedUserId();
  const institutionName = formData.get('institutionName')?.toString().trim();

  if (!institutionName || institutionName.length < 3) {
    throw new Error('Nama institusi minimal 3 karakter');
  }

  await db
    .update(stakeholders)
    .set({ institutionName })
    .where(eq(stakeholders.userId, userId));
}

export async function getStakeholderPortfolioAnalyticsAction(): Promise<StakeholderPortfolioAnalytics> {
  const userId = await getAuthenticatedUserId();

  const stakeholder = await db.query.stakeholders.findFirst({
    where: eq(stakeholders.userId, userId),
  });

  if (!stakeholder) {
    return {
      institutionName: '',
      minMediumTrustScore: 40,
      minHighTrustScore: 70,
      linkedBusinesses: [],
      portfolioRevenue: 0,
      portfolioExpense: 0,
      portfolioNetCashflow: 0,
      averageTrustScore: null,
      averageAiValidationRatio: 0,
      monthlyTrend: [],
    };
  }

  const links = await db.query.stakeholderBusinesses.findMany({
    where: eq(stakeholderBusinesses.stakeholderId, stakeholder.id),
  });

  if (links.length === 0) {
    return {
      institutionName: stakeholder.institutionName,
      minMediumTrustScore: stakeholder.minMediumTrustScore,
      minHighTrustScore: stakeholder.minHighTrustScore,
      linkedBusinesses: [],
      portfolioRevenue: 0,
      portfolioExpense: 0,
      portfolioNetCashflow: 0,
      averageTrustScore: null,
      averageAiValidationRatio: 0,
      monthlyTrend: [],
    };
  }

  const businessIds = links.map((link) => link.businessId);

  const linkedBusinessRows = await db.query.businesses.findMany({
    where: inArray(businesses.id, businessIds),
  });

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const recentTransactions = await db.query.transactions.findMany({
    where: and(
      inArray(transactions.businessId, businessIds),
      gte(transactions.date, sixMonthsAgo)
    ),
    orderBy: [desc(transactions.date)],
  });

  const businessScoreRows = await db.query.creditScores.findMany({
    where: inArray(creditScores.businessId, businessIds),
    orderBy: [desc(creditScores.calculatedAt)],
  });

  const latestScoreMap = new Map<string, number>();
  for (const score of businessScoreRows) {
    if (!latestScoreMap.has(score.businessId)) {
      latestScoreMap.set(score.businessId, score.scoreValue);
    }
  }

  const linkedBusinesses: BusinessAggregate[] = linkedBusinessRows.map(
    (business) => {
      const items = recentTransactions.filter(
        (transaction) => transaction.businessId === business.id
      );

      const totalRevenue = items
        .filter((transaction) => transaction.type === 'INCOME')
        .reduce((sum, transaction) => sum + Number(transaction.totalAmount), 0);

      const totalExpense = items
        .filter((transaction) => transaction.type === 'EXPENSE')
        .reduce((sum, transaction) => sum + Number(transaction.totalAmount), 0);

      const aiValidatedCount = items.filter(
        (transaction) =>
          transaction.inputMethod === 'VOICE' ||
          transaction.inputMethod === 'OCR'
      ).length;

      const transactionCount = items.length;
      const aiValidationRatio =
        transactionCount > 0
          ? Math.round((aiValidatedCount / transactionCount) * 100)
          : 0;

      const itemMonthlyMap = new Map<string, MonthlyAggregate>();
      for (const transaction of items) {
        const monthKey = transaction.date.toLocaleDateString('id-ID', {
          month: 'short',
          year: 'numeric',
        });

        if (!itemMonthlyMap.has(monthKey)) {
          itemMonthlyMap.set(monthKey, {
            month: monthKey,
            revenue: 0,
            expense: 0,
          });
        }
        const row = itemMonthlyMap.get(monthKey);
        if (row) {
          if (transaction.type === 'INCOME') {
            row.revenue += Number(transaction.totalAmount);
          } else {
            row.expense += Number(transaction.totalAmount);
          }
        }
      }
      const monthlyTrend = [...itemMonthlyMap.values()].toReversed();

      return {
        businessId: business.id,
        businessName: business.name,
        totalRevenue,
        totalExpense,
        netCashflow: totalRevenue - totalExpense,
        transactionCount,
        aiValidationRatio,
        trustScore: latestScoreMap.get(business.id) ?? null,
        monthlyTrend,
      };
    }
  );

  const monthlyMap = new Map<string, MonthlyAggregate>();

  for (const transaction of recentTransactions) {
    const monthKey = transaction.date.toLocaleDateString('id-ID', {
      month: 'short',
      year: 'numeric',
    });

    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, {
        month: monthKey,
        revenue: 0,
        expense: 0,
      });
    }

    const row = monthlyMap.get(monthKey);
    if (!row) {
      continue;
    }

    if (transaction.type === 'INCOME') {
      row.revenue += Number(transaction.totalAmount);
    } else {
      row.expense += Number(transaction.totalAmount);
    }
  }

  const monthlyTrend = [...monthlyMap.values()].toReversed();

  const portfolioRevenue = linkedBusinesses.reduce(
    (sum, item) => sum + item.totalRevenue,
    0
  );
  const portfolioExpense = linkedBusinesses.reduce(
    (sum, item) => sum + item.totalExpense,
    0
  );
  const portfolioNetCashflow = portfolioRevenue - portfolioExpense;

  const trustScoreValues = linkedBusinesses
    .map((item) => item.trustScore)
    .filter((value): value is number => value !== null);

  const averageTrustScore =
    trustScoreValues.length > 0
      ? Math.round(
          trustScoreValues.reduce((sum, value) => sum + value, 0) /
            trustScoreValues.length
        )
      : null;

  const averageAiValidationRatio =
    linkedBusinesses.length > 0
      ? Math.round(
          linkedBusinesses.reduce(
            (sum, item) => sum + item.aiValidationRatio,
            0
          ) / linkedBusinesses.length
        )
      : 0;

  return {
    institutionName: stakeholder.institutionName,
    minMediumTrustScore: stakeholder.minMediumTrustScore,
    minHighTrustScore: stakeholder.minHighTrustScore,
    linkedBusinesses,
    portfolioRevenue,
    portfolioExpense,
    portfolioNetCashflow,
    averageTrustScore,
    averageAiValidationRatio,
    monthlyTrend,
  };
}
