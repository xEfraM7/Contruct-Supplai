import { useState, useEffect } from 'react';

interface DashboardMetrics {
  activeContracts: number;
  totalBudget: number;
  onTimeDelivery: number;
  isLoading: boolean;
  error: string | null;
}

export function useDashboardMetrics() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    activeContracts: 0,
    totalBudget: 0,
    onTimeDelivery: 0,
    isLoading: true,
    error: null,
  });

  const fetchMetrics = async () => {
    try {
      setMetrics(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await fetch('/api/dashboard/metrics');
      
      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }
      
      const data = await response.json();
      
      setMetrics({
        activeContracts: data.activeContracts || 0,
        totalBudget: data.totalBudget || 0,
        onTimeDelivery: data.onTimeDelivery || 0,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      setMetrics(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return { ...metrics, refetch: fetchMetrics };
}