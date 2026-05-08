import { FilterQuery } from 'mongoose';
import { Market } from '../models/Market.js';
import { BaseRepository } from './BaseRepository.js';
import type { IMarket } from '../models/Market.js';

export interface MarketFilter {
  marketId?: string;
  eventName?: string;
  status?: 'OPEN' | 'SUSPENDED' | 'CLOSED' | 'SETTLED';
  startTimeFrom?: Date;
  startTimeTo?: Date;
  search?: string;
}

export class MarketRepository extends BaseRepository<IMarket> {
  constructor() {
    super(Market);
  }

  /**
   * Find market by marketId (unique identifier)
   */
  async findByMarketId(marketId: string): Promise<IMarket | null> {
    return this.findOne({ marketId });
  }

  /**
   * Find markets with advanced filtering
   */
  async findMarkets(filter: MarketFilter = {}): Promise<IMarket[]> {
    const query: FilterQuery<IMarket> = {};

    if (filter.marketId) {
      query.marketId = filter.marketId;
    }

    if (filter.status) {
      query.status = filter.status;
    }

    if (filter.eventName) {
      query.eventName = { $regex: filter.eventName, $options: 'i' };
    }

    if (filter.startTimeFrom || filter.startTimeTo) {
      query.startTime = {};
      if (filter.startTimeFrom) {
        query.startTime.$gte = filter.startTimeFrom;
      }
      if (filter.startTimeTo) {
        query.startTime.$lte = filter.startTimeTo;
      }
    }

    if (filter.search) {
      query.$or = [
        { marketId: { $regex: filter.search, $options: 'i' } },
        { eventName: { $regex: filter.search, $options: 'i' } },
        { marketName: { $regex: filter.search, $options: 'i' } }
      ];
    }

    return this.findAll(query, { sort: { startTime: 1 } });
  }

  /**
   * Find active markets (OPEN status)
   */
  async findActiveMarkets(): Promise<IMarket[]> {
    return this.findMarkets({ status: 'OPEN' });
  }

  /**
   * Update market status
   */
  async updateStatus(marketId: string, status: 'OPEN' | 'SUSPENDED' | 'CLOSED' | 'SETTLED'): Promise<IMarket | null> {
    return this.updateByMarketId(marketId, { status });
  }

  /**
   * Update market by marketId
   */
  async updateByMarketId(marketId: string, updates: any): Promise<IMarket | null> {
    return this.model.findOneAndUpdate({ marketId }, updates, { new: true }).exec();
  }

  /**
   * Delete market by marketId
   */
  async deleteByMarketId(marketId: string): Promise<boolean> {
    const result = await this.model.deleteOne({ marketId }).exec();
    return result.deletedCount > 0;
  }

  /**
   * Check if market exists by marketId
   */
  async existsByMarketId(marketId: string): Promise<boolean> {
    return this.exists({ marketId });
  }

  /**
   * Update runner status within a market
   */
  async updateRunnerStatus(marketId: string, selectionId: string, status: 'ACTIVE' | 'SUSPENDED'): Promise<IMarket | null> {
    return this.model.findOneAndUpdate(
      { marketId, 'runners.selectionId': selectionId },
      { $set: { 'runners.$.status': status } },
      { new: true }
    ).exec();
  }

  /**
   * Set runner result (WINNER/LOSER)
   */
  async setRunnerResult(marketId: string, selectionId: string, result: 'WINNER' | 'LOSER' | null): Promise<IMarket | null> {
    return this.model.findOneAndUpdate(
      { marketId, 'runners.selectionId': selectionId },
      { $set: { 'runners.$.result': result } },
      { new: true }
    ).exec();
  }

  /**
   * Increment market version
   */
  async incrementVersion(marketId: string): Promise<IMarket | null> {
    return this.model.findOneAndUpdate(
      { marketId },
      { $inc: { version: 1 } },
      { new: true }
    ).exec();
  }
}

// Singleton instance for dependency injection
export const marketRepository = new MarketRepository();