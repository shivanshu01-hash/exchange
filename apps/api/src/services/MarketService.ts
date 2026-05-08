import { marketRepository } from '../repositories/MarketRepository.js';
import type { MarketFilter } from '../repositories/MarketRepository.js';
import type { IMarket } from '../models/Market.js';

export class MarketService {
  /**
   * Get all markets with optional filtering
   */
  async getMarkets(filter: MarketFilter = {}): Promise<IMarket[]> {
    return marketRepository.findMarkets(filter);
  }

  /**
   * Get market by ID
   */
  async getMarketById(marketId: string): Promise<IMarket | null> {
    return marketRepository.findByMarketId(marketId);
  }

  /**
   * Create a new market
   */
  async createMarket(marketData: {
    marketId: string;
    eventName: string;
    marketName: string;
    startTime: Date;
    runners: Array<{ selectionId: string; name: string }>;
  }): Promise<IMarket> {
    // Validate market doesn't already exist
    const existingMarket = await marketRepository.existsByMarketId(marketData.marketId);
    if (existingMarket) {
      throw new Error(`Market with ID ${marketData.marketId} already exists`);
    }

    // Create market
    const market = await marketRepository.create({
      marketId: marketData.marketId,
      eventName: marketData.eventName,
      marketName: marketData.marketName,
      startTime: marketData.startTime,
      runners: marketData.runners.map(runner => ({
        selectionId: runner.selectionId,
        name: runner.name,
        status: 'ACTIVE' as const,
        result: null
      })),
      status: 'OPEN' as const,
      version: 1
    });

    return market;
  }

  /**
   * Update market status
   */
  async updateMarketStatus(marketId: string, status: 'OPEN' | 'SUSPENDED' | 'CLOSED' | 'SETTLED'): Promise<IMarket | null> {
    const market = await marketRepository.findByMarketId(marketId);
    if (!market) {
      throw new Error(`Market ${marketId} not found`);
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      OPEN: ['SUSPENDED', 'CLOSED'],
      SUSPENDED: ['OPEN', 'CLOSED'],
      CLOSED: ['SETTLED'],
      SETTLED: []
    };

    if (!validTransitions[market.status]?.includes(status)) {
      throw new Error(`Invalid status transition from ${market.status} to ${status}`);
    }

    return marketRepository.updateStatus(marketId, status);
  }

  /**
   * Suspend a market
   */
  async suspendMarket(marketId: string): Promise<IMarket | null> {
    return this.updateMarketStatus(marketId, 'SUSPENDED');
  }

  /**
   * Close a market
   */
  async closeMarket(marketId: string): Promise<IMarket | null> {
    return this.updateMarketStatus(marketId, 'CLOSED');
  }

  /**
   * Settle a market with winning selection
   */
  async settleMarket(marketId: string, winningSelectionId: string): Promise<IMarket | null> {
    const market = await marketRepository.findByMarketId(marketId);
    if (!market) {
      throw new Error(`Market ${marketId} not found`);
    }

    if (market.status !== 'CLOSED') {
      throw new Error(`Market must be CLOSED before settlement. Current status: ${market.status}`);
    }

    // Update all runners
    const updatedMarket = await marketRepository.updateByMarketId(marketId, {
      status: 'SETTLED',
      runners: market.runners.map((runner: any) => ({
        ...runner.toObject(),
        result: runner.selectionId === winningSelectionId ? 'WINNER' : 'LOSER'
      }))
    });

    return updatedMarket;
  }

  /**
   * Update runner status
   */
  async updateRunnerStatus(marketId: string, selectionId: string, status: 'ACTIVE' | 'SUSPENDED'): Promise<IMarket | null> {
    const market = await marketRepository.findByMarketId(marketId);
    if (!market) {
      throw new Error(`Market ${marketId} not found`);
    }

    const runner = market.runners.find((r: any) => r.selectionId === selectionId);
    if (!runner) {
      throw new Error(`Runner ${selectionId} not found in market ${marketId}`);
    }

    return marketRepository.updateRunnerStatus(marketId, selectionId, status);
  }

  /**
   * Get active markets
   */
  async getActiveMarkets(): Promise<IMarket[]> {
    return marketRepository.findActiveMarkets();
  }

  /**
   * Search markets
   */
  async searchMarkets(searchTerm: string): Promise<IMarket[]> {
    return marketRepository.findMarkets({ search: searchTerm });
  }

  /**
   * Get market statistics
   */
  async getMarketStats(): Promise<{
    total: number;
    open: number;
    suspended: number;
    closed: number;
    settled: number;
  }> {
    const markets = await marketRepository.findAll();
    
    const stats = {
      total: markets.length,
      open: markets.filter(m => m.status === 'OPEN').length,
      suspended: markets.filter(m => m.status === 'SUSPENDED').length,
      closed: markets.filter(m => m.status === 'CLOSED').length,
      settled: markets.filter(m => m.status === 'SETTLED').length
    };

    return stats;
  }

  /**
   * Validate market is open for trading
   */
  async validateMarketForTrading(marketId: string, selectionId?: string): Promise<IMarket> {
    const market = await marketRepository.findByMarketId(marketId);
    if (!market) {
      throw new Error(`Market ${marketId} not found`);
    }

    if (market.status !== 'OPEN') {
      throw new Error(`Market ${marketId} is not open for trading. Status: ${market.status}`);
    }

    if (selectionId) {
      const runner = market.runners.find((r: any) => r.selectionId === selectionId);
      if (!runner) {
        throw new Error(`Runner ${selectionId} not found in market ${marketId}`);
      }

      if (runner.status !== 'ACTIVE') {
        throw new Error(`Runner ${selectionId} is not active. Status: ${runner.status}`);
      }
    }

    return market;
  }
}

// Singleton instance for dependency injection
export const marketService = new MarketService();