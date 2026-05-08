/**
 * Custom hook for wallet-related operations
 */

import { useEffect, useCallback, useState } from 'react';
import { useExchangeStore } from '../store/exchange';
import { apiClient } from '../services/api-client';
import { BalanceDto } from '../types';

export function useWallet() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const { wallet, setWallet, updateWallet } = useExchangeStore();

  // Fetch wallet balance
  const fetchWallet = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getWallet();
      setWallet(response);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch wallet');
      console.error('Error fetching wallet:', err);
    } finally {
      setLoading(false);
    }
  }, [setWallet]);

  // Fetch transactions
  const fetchTransactions = useCallback(async (params?: {
    page?: number;
    limit?: number;
    type?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.type) queryParams.append('type', params.type);
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);

      const response = await apiClient.get<any[]>(`/wallet/transactions?${queryParams.toString()}`);
      setTransactions(response);
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Deposit funds
  const deposit = useCallback(async (amount: number, method: string = 'bank_transfer') => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.post('/wallet/deposit', { amount, method });
      
      // Update wallet balance
      if (wallet) {
        updateWallet({
          balance: wallet.balance + amount,
          available: wallet.available + amount,
        });
      }
      
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to deposit funds');
      console.error('Error depositing funds:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [wallet, updateWallet]);

  // Withdraw funds
  const withdraw = useCallback(async (amount: number, method: string = 'bank_transfer') => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.post('/wallet/withdraw', { amount, method });
      
      // Update wallet balance
      if (wallet) {
        updateWallet({
          balance: wallet.balance - amount,
          available: wallet.available - amount,
        });
      }
      
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to withdraw funds');
      console.error('Error withdrawing funds:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [wallet, updateWallet]);

  // Check if user has sufficient balance
  const hasSufficientBalance = useCallback((amount: number): boolean => {
    if (!wallet) return false;
    return wallet.available >= amount;
  }, [wallet]);

  // Calculate total exposure
  const calculateExposure = useCallback((): number => {
    if (!wallet) return 0;
    return wallet.exposure;
  }, [wallet]);

  // Initial fetch
  useEffect(() => {
    fetchWallet();
    fetchTransactions();
  }, [fetchWallet, fetchTransactions]);

  return {
    // Data
    wallet,
    transactions,
    
    // State
    loading,
    error,
    
    // Actions
    deposit,
    withdraw,
    refresh: fetchWallet,
    refreshTransactions: fetchTransactions,
    
    // Utilities
    hasSufficientBalance,
    calculateExposure,
    exposure: calculateExposure(),
    isBalancePositive: wallet ? wallet.balance > 0 : false,
    isAvailablePositive: wallet ? wallet.available > 0 : false,
    
    // Formatted values
    formattedBalance: wallet ? `₹${wallet.balance.toFixed(2)}` : '₹0.00',
    formattedAvailable: wallet ? `₹${wallet.available.toFixed(2)}` : '₹0.00',
  };
}