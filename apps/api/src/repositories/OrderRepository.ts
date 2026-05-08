import { FilterQuery } from 'mongoose';
import { Order } from '../models/Order.js';
import { BaseRepository } from './BaseRepository.js';
import type { IOrder } from '../models/Order.js';

export interface OrderFilter {
  userId?: string;
  marketId?: string;
  selectionId?: string;
  side?: 'BACK' | 'LAY';
  status?: string | string[];
  priceFrom?: number;
  priceTo?: number;
  createdAtFrom?: Date;
  createdAtTo?: Date;
  clientOrderId?: string;
}

export class OrderRepository extends BaseRepository<IOrder> {
  constructor() {
    super(Order);
  }

  /**
   * Find orders with advanced filtering
   */
  async findOrders(filter: OrderFilter = {}): Promise<IOrder[]> {
    const query: FilterQuery<IOrder> = {};

    if (filter.userId) {
      query.userId = filter.userId;
    }

    if (filter.marketId) {
      query.marketId = filter.marketId;
    }

    if (filter.selectionId) {
      query.selectionId = filter.selectionId;
    }

    if (filter.side) {
      query.side = filter.side;
    }

    if (filter.status) {
      if (Array.isArray(filter.status)) {
        query.status = { $in: filter.status };
      } else {
        query.status = filter.status;
      }
    }

    if (filter.priceFrom || filter.priceTo) {
      query.price = {};
      if (filter.priceFrom) {
        query.price.$gte = filter.priceFrom;
      }
      if (filter.priceTo) {
        query.price.$lte = filter.priceTo;
      }
    }

    if (filter.createdAtFrom || filter.createdAtTo) {
      query.createdAt = {};
      if (filter.createdAtFrom) {
        query.createdAt.$gte = filter.createdAtFrom;
      }
      if (filter.createdAtTo) {
        query.createdAt.$lte = filter.createdAtTo;
      }
    }

    if (filter.clientOrderId) {
      query.clientOrderId = filter.clientOrderId;
    }

    return this.findAll(query, { sort: { createdAt: -1 } });
  }

  /**
   * Find open orders for a user
   */
  async findOpenOrders(userId: string, marketId?: string): Promise<IOrder[]> {
    const filter: OrderFilter = {
      userId,
      status: ['OPEN', 'PARTIALLY_MATCHED']
    };

    if (marketId) {
      filter.marketId = marketId;
    }

    return this.findOrders(filter);
  }

  /**
   * Find matched orders for a user
   */
  async findMatchedOrders(userId: string, marketId?: string): Promise<IOrder[]> {
    const filter: OrderFilter = {
      userId,
      status: 'MATCHED'
    };

    if (marketId) {
      filter.marketId = marketId;
    }

    return this.findOrders(filter);
  }

  /**
   * Find orders by clientOrderId
   */
  async findByClientOrderId(userId: string, clientOrderId: string): Promise<IOrder | null> {
    return this.findOne({ userId, clientOrderId });
  }

  /**
   * Update order status
   */
  async updateStatus(orderId: string, status: 'OPEN' | 'PARTIALLY_MATCHED' | 'MATCHED' | 'CANCELLED' | 'REJECTED'): Promise<IOrder | null> {
    return this.update(orderId, { status });
  }

  /**
   * Update matched stake and average price
   */
  async updateMatchedStake(orderId: string, matchedAmount: number, matchedPrice: number): Promise<IOrder | null> {
    const order = await this.findById(orderId);
    if (!order) return null;

    const newMatchedStake = order.matchedStake + matchedAmount;
    const newRemainingStake = order.stake - newMatchedStake;
    
    // Calculate new average price
    const totalValue = (order.averageMatchedPrice || 0) * order.matchedStake + matchedPrice * matchedAmount;
    const newAveragePrice = totalValue / newMatchedStake;

    const updates = {
      matchedStake: newMatchedStake,
      remainingStake: newRemainingStake,
      averageMatchedPrice: newAveragePrice,
      status: newRemainingStake === 0 ? 'MATCHED' : 'PARTIALLY_MATCHED'
    };

    return this.update(orderId, updates);
  }

  /**
   * Cancel order and release remaining stake
   */
  async cancelOrder(orderId: string): Promise<IOrder | null> {
    return this.update(orderId, {
      status: 'CANCELLED',
      remainingStake: 0
    });
  }

  /**
   * Get total exposure for a user in a market
   */
  async getUserMarketExposure(userId: string, marketId: string): Promise<number> {
    const orders = await this.findOrders({
      userId,
      marketId,
      status: ['OPEN', 'PARTIALLY_MATCHED']
    });

    return orders.reduce((total, order) => total + order.liability, 0);
  }

  /**
   * Get best prices for a selection
   */
  async getBestPrices(marketId: string, selectionId: string): Promise<{ bestBack: number | null; bestLay: number | null }> {
    const backOrders = await this.model
      .find({
        marketId,
        selectionId,
        side: 'BACK',
        status: { $in: ['OPEN', 'PARTIALLY_MATCHED'] }
      })
      .sort({ price: -1 })
      .limit(1)
      .exec();

    const layOrders = await this.model
      .find({
        marketId,
        selectionId,
        side: 'LAY',
        status: { $in: ['OPEN', 'PARTIALLY_MATCHED'] }
      })
      .sort({ price: 1 })
      .limit(1)
      .exec();

    return {
      bestBack: backOrders[0]?.price || null,
      bestLay: layOrders[0]?.price || null
    };
  }

  /**
   * Get order book for a selection
   */
  async getOrderBook(marketId: string, selectionId: string): Promise<{
    back: Array<{ price: number; totalStake: number }>;
    lay: Array<{ price: number; totalStake: number }>;
  }> {
    const orders = await this.model
      .find({
        marketId,
        selectionId,
        status: { $in: ['OPEN', 'PARTIALLY_MATCHED'] }
      })
      .exec();

    const backMap = new Map<number, number>();
    const layMap = new Map<number, number>();

    orders.forEach(order => {
      const map = order.side === 'BACK' ? backMap : layMap;
      const current = map.get(order.price) || 0;
      map.set(order.price, current + order.remainingStake);
    });

    const back = Array.from(backMap.entries())
      .map(([price, totalStake]) => ({ price, totalStake }))
      .sort((a, b) => b.price - a.price);

    const lay = Array.from(layMap.entries())
      .map(([price, totalStake]) => ({ price, totalStake }))
      .sort((a, b) => a.price - b.price);

    return { back, lay };
  }
}

// Singleton instance for dependency injection
export const orderRepository = new OrderRepository();