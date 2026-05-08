/**
 * Custom hook for order-related operations
 */

import { useEffect, useCallback, useState } from 'react';
import { useExchangeStore } from '../store/exchange';
import { apiClient } from '../services/api-client';
import { OrderDto } from '../types';

export function useOrders() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { orders, openOrders, matchedOrders, addOrder, updateOrder, removeOrder } = useExchangeStore();

  // Fetch all orders
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getOpenOrders();
      // Assuming response is an array of orders
      response.forEach((order: OrderDto) => {
        addOrder(order);
      });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch orders');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  }, [addOrder]);

  // Place a new order
  const placeOrder = useCallback(async (orderData: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.placeOrder(orderData);
      addOrder(response);
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to place order');
      console.error('Error placing order:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addOrder]);

  // Cancel an order
  const cancelOrder = useCallback(async (orderId: string) => {
    try {
      setLoading(true);
      setError(null);
      await apiClient.cancelOrder(orderId);
      removeOrder(orderId);
    } catch (err: any) {
      setError(err.message || 'Failed to cancel order');
      console.error('Error canceling order:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [removeOrder]);

  // Get open orders from store
  const getOpenOrders = useCallback(() => {
    return openOrders.map(id => orders[id]).filter(Boolean);
  }, [openOrders, orders]);

  // Get matched orders from store
  const getMatchedOrders = useCallback(() => {
    return matchedOrders.map(id => orders[id]).filter(Boolean);
  }, [matchedOrders, orders]);

  // Get order by ID
  const getOrder = useCallback((orderId: string) => {
    return orders[orderId];
  }, [orders]);

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    // Data
    orders,
    openOrders: getOpenOrders(),
    matchedOrders: getMatchedOrders(),
    
    // State
    loading,
    error,
    
    // Actions
    placeOrder,
    cancelOrder,
    getOrder,
    refresh: fetchOrders,
    
    // Utilities
    hasOpenOrders: openOrders.length > 0,
    hasMatchedOrders: matchedOrders.length > 0,
    totalOrders: Object.keys(orders).length,
  };
}

export function useOrder(orderId?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { orders, updateOrder } = useExchangeStore();
  
  const order = orderId ? orders[orderId] : null;

  const fetchOrder = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/orders/${id}`);
      updateOrder(id, response);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch order');
      console.error('Error fetching order:', err);
    } finally {
      setLoading(false);
    }
  }, [updateOrder]);

  useEffect(() => {
    if (orderId && !order) {
      fetchOrder(orderId);
    }
  }, [orderId, order, fetchOrder]);

  return {
    order,
    loading,
    error,
    refresh: orderId ? () => fetchOrder(orderId) : () => {},
  };
}