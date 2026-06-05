import { MetaTrader5Integration, MT5BrokerConfig, createMT5Integration } from './mt5-integration';
import RealWithdrawalManager from './withdrawal-manager';

/**
 * Supported brokers for MT5 integration
 */
export const SUPPORTED_BROKERS = {
  XAUUSD: {
    name: 'XAUUSD Metals',
    serverAddress: 'api.xauusd-mt5.com',
    serverPort: 8443,
    protocolVersion: '3.0',
  },
  IC_MARKETS: {
    name: 'IC Markets',
    serverAddress: 'api.icmarkets.com',
    serverPort: 443,
    protocolVersion: '3.0',
  },
  EXNESS: {
    name: 'Exness',
    serverAddress: 'api.exness.com',
    serverPort: 443,
    protocolVersion: '3.0',
  },
  PEPPERSTONE: {
    name: 'Pepperstone',
    serverAddress: 'api.pepperstone.com',
    serverPort: 443,
    protocolVersion: '3.0',
  },
  ROBOFOREX: {
    name: 'RoboForex',
    serverAddress: 'api.roboforex.com',
    serverPort: 443,
    protocolVersion: '3.0',
  },
  FXCM: {
    name: 'FXCM',
    serverAddress: 'api.fxcm.com',
    serverPort: 443,
    protocolVersion: '3.0',
  },
  OANDA: {
    name: 'OANDA',
    serverAddress: 'api.oanda.com',
    serverPort: 443,
    protocolVersion: '3.0',
  },
} as const;

/**
 * BrokerConfig - Extended configuration including credentials
 */
export interface BrokerConfig extends MT5BrokerConfig {
  displayName: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  lastConnected?: Date;
}

/**
 * BrokerManager - Manages multiple broker connections and withdrawals
 */
export class BrokerManager {
  private brokerConnections: Map<string, MetaTrader5Integration> = new Map();
  private withdrawalManagers: Map<string, RealWithdrawalManager> = new Map();
  private brokerConfigs: Map<string, BrokerConfig> = new Map();

  /**
   * Register and connect to a broker
   */
  async registerBroker(
    brokerId: string,
    config: Omit<BrokerConfig, 'createdAt' | 'lastConnected'>
  ): Promise<boolean> {
    try {
      console.log(`[BrokerManager] Registering broker: ${brokerId}`);

      const brokerConfig = config as BrokerConfig;
      brokerConfig.createdAt = new Date();

      // Create MT5 integration
      const mt5Integration = createMT5Integration(brokerConfig);

      // Attempt authentication
      const authenticated = await mt5Integration.authenticate();

      if (authenticated) {
        this.brokerConnections.set(brokerId, mt5Integration);
        this.brokerConfigs.set(brokerId, brokerConfig);

        // Create withdrawal manager for this broker
        const withdrawalManager = new RealWithdrawalManager(mt5Integration);
        withdrawalManager.startProcessor();
        this.withdrawalManagers.set(brokerId, withdrawalManager);

        brokerConfig.lastConnected = new Date();
        console.log(`[BrokerManager] Successfully registered: ${brokerId}`);
        return true;
      }

      console.error(`[BrokerManager] Authentication failed for: ${brokerId}`);
      return false;
    } catch (error: any) {
      console.error(`[BrokerManager] Error registering broker ${brokerId}: ${error.message}`);
      return false;
    }
  }

  /**
   * Get active broker connection
   */
  getBrokerConnection(brokerId: string): MetaTrader5Integration | undefined {
    return this.brokerConnections.get(brokerId);
  }

  /**
   * Get withdrawal manager for broker
   */
  getWithdrawalManager(brokerId: string): RealWithdrawalManager | undefined {
    return this.withdrawalManagers.get(brokerId);
  }

  /**
   * List all registered brokers
   */
  listBrokers(): BrokerConfig[] {
    return Array.from(this.brokerConfigs.values());
  }

  /**
   * Get broker config
   */
  getBrokerConfig(brokerId: string): BrokerConfig | undefined {
    return this.brokerConfigs.get(brokerId);
  }

  /**
   * Disconnect from a broker
   */
  async disconnectBroker(brokerId: string): Promise<void> {
    const connection = this.brokerConnections.get(brokerId);
    const withdrawalManager = this.withdrawalManagers.get(brokerId);

    if (withdrawalManager) {
      withdrawalManager.stopProcessor();
    }

    if (connection) {
      await connection.disconnect();
    }

    this.brokerConnections.delete(brokerId);
    this.withdrawalManagers.delete(brokerId);

    console.log(`[BrokerManager] Disconnected from: ${brokerId}`);
  }

  /**
   * Disconnect all brokers
   */
  async disconnectAll(): Promise<void> {
    for (const brokerId of this.brokerConnections.keys()) {
      await this.disconnectBroker(brokerId);
    }
  }

  /**
   * Get all active broker statuses
   */
  getActiveBrokerStatus(): Record<string, any> {
    const statuses: Record<string, any> = {};

    for (const [brokerId, connection] of this.brokerConnections.entries()) {
      statuses[brokerId] = {
        brokerName: connection.getConnectionStatus()?.accountBalance ? 'connected' : 'disconnected',
        ...connection.getConnectionStatus(),
      };
    }

    return statuses;
  }

  /**
   * Request real withdrawal across all active brokers
   */
  async requestWithdrawalMultiBroker(
    amount: number,
    currency: string,
    brokerId: string,
    destinationAccount: string
  ): Promise<any> {
    const withdrawalManager = this.withdrawalManagers.get(brokerId);

    if (!withdrawalManager) {
      throw new Error(`Broker ${brokerId} not found or not connected`);
    }

    return await withdrawalManager.submitWithdrawal(
      amount,
      currency,
      destinationAccount
    );
  }

  /**
   * Get total withdrawal statistics across all brokers
   */
  getGlobalWithdrawalStats(): any {
    let totalStats = {
      total: 0,
      completed: 0,
      pending: 0,
      failed: 0,
      totalAmount: 0,
      completedAmount: 0,
      brokers: {} as Record<string, any>,
    };

    for (const [brokerId, manager] of this.withdrawalManagers.entries()) {
      const stats = manager.getWithdrawalStats();
      totalStats.brokers[brokerId] = stats;
      totalStats.total += stats.total;
      totalStats.completed += stats.completed;
      totalStats.pending += stats.pending;
      totalStats.failed += stats.failed;
      totalStats.totalAmount += stats.totalAmount;
      totalStats.completedAmount += stats.completedAmount;
    }

    return totalStats;
  }

  /**
   * Export all withdrawal audits
   */
  exportAllAudits(): Record<string, any> {
    const audits: Record<string, any> = {};

    for (const [brokerId, manager] of this.withdrawalManagers.entries()) {
      audits[brokerId] = manager.exportWithdrawalAudit();
    }

    return audits;
  }
}

/**
 * Global broker manager instance
 */
let globalBrokerManager: BrokerManager | null = null;

/**
 * Get or create global broker manager
 */
export function getGlobalBrokerManager(): BrokerManager {
  if (!globalBrokerManager) {
    globalBrokerManager = new BrokerManager();
  }
  return globalBrokerManager;
}

export default BrokerManager;
