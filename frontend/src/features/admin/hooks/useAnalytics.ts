import { useState, useEffect } from 'react';
import { apiUrl } from '@/shared/lib/api';

// Types
export type Period = '7d' | '30d' | '90d' | '1y' | 'all';
export type Interval = 'day' | 'week' | 'month';

export interface OverviewData {
  revenue: {
    total: number;
    change: number;
    avgOrderValue: number;
  };
  profit: {
    total: number;
    change: number;
  };
  orders: {
    total: number;
    change: number;
  };
  users: {
    total: number;
    newUsers: number;
    growth: number;
  };
  inventory: {
    totalValue: number;
    totalProducts: number;
    totalStock: number;
  };
}

export interface SalesTrendData {
  date: string;
  revenue: number;
  orders: number;
}

export interface UserGrowthData {
  date: string;
  newUsers: number;
}

export interface InventoryStats {
  total: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  totalValue: number;
}

export interface BestSellerData {
  productId: string;
  name: string;
  sold: number;
  revenue: number;
}

interface UseAnalyticsOptions {
  salesPeriod?: Period;
  userPeriod?: Period;
  bestSellersPeriod?: Period;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

interface UseAnalyticsReturn {
  overview: OverviewData | null;
  salesTrends: SalesTrendData[];
  userGrowth: UserGrowthData[];
  inventory: InventoryStats | null;
  bestSellers: BestSellerData[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useAnalytics = ({
  salesPeriod = '30d',
  userPeriod = '30d',
  bestSellersPeriod = '30d',
  autoRefresh = false,
  refreshInterval = 60000, // 1 minute default
}: UseAnalyticsOptions = {}): UseAnalyticsReturn => {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [salesTrends, setSalesTrends] = useState<SalesTrendData[]>([]);
  const [userGrowth, setUserGrowth] = useState<UserGrowthData[]>([]);
  const [inventory, setInventory] = useState<InventoryStats | null>(null);
  const [bestSellers, setBestSellers] = useState<BestSellerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Fetch all analytics data in parallel
      const [
        overviewRes,
        salesRes,
        usersRes,
        inventoryRes,
        sellersRes,
      ] = await Promise.all([
        fetch(apiUrl('/api/analytics/overview'), { headers }),
        fetch(apiUrl(`/api/analytics/sales-trends?period=${salesPeriod}`), { headers }),
        fetch(apiUrl(`/api/analytics/user-growth?period=${userPeriod}`), { headers }),
        fetch(apiUrl('/api/analytics/inventory'), { headers }),
        fetch(apiUrl(`/api/analytics/best-sellers?period=${bestSellersPeriod}&limit=5`), { headers }),
      ]);

      // Check for errors
      if (!overviewRes.ok) {
        const errorData = await overviewRes.json();
        throw new Error(errorData.message || 'Failed to fetch overview data');
      }
      if (!salesRes.ok) {
        const errorData = await salesRes.json();
        throw new Error(errorData.message || 'Failed to fetch sales trends');
      }
      if (!usersRes.ok) {
        const errorData = await usersRes.json();
        throw new Error(errorData.message || 'Failed to fetch user growth');
      }
      if (!inventoryRes.ok) {
        const errorData = await inventoryRes.json();
        throw new Error(errorData.message || 'Failed to fetch inventory');
      }
      if (!sellersRes.ok) {
        const errorData = await sellersRes.json();
        throw new Error(errorData.message || 'Failed to fetch best sellers');
      }

      // Parse JSON responses
      const [
        overviewData,
        salesData,
        usersData,
        inventoryData,
        sellersData,
      ] = await Promise.all([
        overviewRes.json(),
        salesRes.json(),
        usersRes.json(),
        inventoryRes.json(),
        sellersRes.json(),
      ]);

      // Update state with fetched data
      setOverview(overviewData.data);
      setSalesTrends(salesData.data || []);
      setUserGrowth(usersData.data || []);
      setInventory(inventoryData.data);
      setBestSellers(sellersData.data || []);

    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAnalytics();
  }, [salesPeriod, userPeriod, bestSellersPeriod]);

  // Auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(() => {
      fetchAnalytics();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, salesPeriod, userPeriod, bestSellersPeriod]);

  return {
    overview,
    salesTrends,
    userGrowth,
    inventory,
    bestSellers,
    loading,
    error,
    refetch: fetchAnalytics,
  };
};
