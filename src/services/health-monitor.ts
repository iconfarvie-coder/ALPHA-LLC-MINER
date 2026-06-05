/**
 * ALPHA LLC MINER - Automated Broker Health Monitor
 * Continuously monitors connected brokers and auto-reconnects on failure
 */

import { getGlobalBrokerManager } from '../services/broker-manager';

interface HealthCheckResult {
  brokerId: string;
  status: 'healthy' | 'unhealthy' | 'reconnecting';
  lastCheck: Date;
  connectionStatus: boolean;
  accountBalance: number;
  errorMessage?: string;
  consecutiveFailures: number;
}

class BrokerHealthMonitor {
  private brokerManager = getGlobalBrokerManager();
  private healthChecks: Map<string, HealthCheckResult> = new Map();
  private checkInterval: NodeJS.Timer | null = null;
  private checkIntervalMs: number = 30000; // Check every 30 seconds
  private maxConsecutiveFailures: number = 3;

  /**
   * Start health monitoring
   */
  startMonitoring(): void {
    if (this.checkInterval) {
      console.warn('[HealthMonitor] Monitoring already active');
      return;
    }

    console.log('[HealthMonitor] Starting broker health monitoring');

    this.checkInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, this.checkIntervalMs);

    // Perform initial check
    this.performHealthCheck();
  }

  /**
   * Stop health monitoring
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('[HealthMonitor] Stopped broker health monitoring');
    }
  }

  /**
   * Perform health check on all brokers
   */
  private async performHealthCheck(): Promise<void> {
    const brokers = this.brokerManager.listBrokers();

    for (const broker of brokers) {
      const brokerId = broker.name;
      const connection = this.brokerManager.getBrokerConnection(brokerId);

      if (!connection) {
        this.recordFailure(brokerId, 'Connection not found');
        continue;
      }

      try {
        const status = connection.getConnectionStatus();

        if (status.isConnected) {
          this.recordSuccess(brokerId, status.accountBalance);
        } else {
          this.recordFailure(brokerId, status.connectionError || 'Not connected');
        }
      } catch (error: any) {
        this.recordFailure(brokerId, error.message);
      }
    }
  }

  /**
   * Record successful health check
   */
  private recordSuccess(brokerId: string, balance: number): void {
    const result: HealthCheckResult = {
      brokerId,
      status: 'healthy',
      lastCheck: new Date(),
      connectionStatus: true,
      accountBalance: balance,
      consecutiveFailures: 0,
    };

    this.healthChecks.set(brokerId, result);
    console.log(`[HealthMonitor] ✅ ${brokerId}: Healthy | Balance: ${balance}`);
  }

  /**
   * Record failed health check
   */
  private recordFailure(brokerId: string, errorMessage: string): void {
    const existing = this.healthChecks.get(brokerId);
    const consecutiveFailures = (existing?.consecutiveFailures || 0) + 1;

    const result: HealthCheckResult = {
      brokerId,
      status: consecutiveFailures >= this.maxConsecutiveFailures ? 'unhealthy' : 'reconnecting',
      lastCheck: new Date(),
      connectionStatus: false,
      accountBalance: existing?.accountBalance || 0,
      errorMessage,
      consecutiveFailures,
    };

    this.healthChecks.set(brokerId, result);

    console.warn(
      `[HealthMonitor] ⚠️  ${brokerId}: Failed (${consecutiveFailures}/${this.maxConsecutiveFailures}) - ${errorMessage}`
    );

    // Attempt auto-reconnect
    if (consecutiveFailures < this.maxConsecutiveFailures) {
      this.attemptAutoReconnect(brokerId);
    }
  }

  /**
   * Attempt automatic reconnection
   */
  private async attemptAutoReconnect(brokerId: string): Promise<void> {
    console.log(`[HealthMonitor] 🔄 Attempting auto-reconnect for ${brokerId}...`);

    const connection = this.brokerManager.getBrokerConnection(brokerId);
    if (connection) {
      const connected = await connection.authenticate();
      if (connected) {
        console.log(`[HealthMonitor] ✅ Auto-reconnect successful for ${brokerId}`);
        const status = connection.getConnectionStatus();
        this.recordSuccess(brokerId, status.accountBalance);
      }
    }
  }

  /**
   * Get health status of all brokers
   */
  getHealthStatus(): HealthCheckResult[] {
    return Array.from(this.healthChecks.values());
  }

  /**
   * Get overall system health
   */
  getSystemHealth(): {
    healthy: number;
    unhealthy: number;
    reconnecting: number;
    timestamp: Date;
  } {
    const checks = Array.from(this.healthChecks.values());

    return {
      healthy: checks.filter(c => c.status === 'healthy').length,
      unhealthy: checks.filter(c => c.status === 'unhealthy').length,
      reconnecting: checks.filter(c => c.status === 'reconnecting').length,
      timestamp: new Date(),
    };
  }

  /**
   * Export health report
   */
  exportHealthReport(): any {
    return {
      exportedAt: new Date().toISOString(),
      summary: this.getSystemHealth(),
      brokers: this.getHealthStatus().map(check => ({
        brokerId: check.brokerId,
        status: check.status,
        lastCheck: check.lastCheck,
        connected: check.connectionStatus,
        balance: check.accountBalance,
        failures: check.consecutiveFailures,
        error: check.errorMessage,
      })),
    };
  }
}

export default BrokerHealthMonitor;
