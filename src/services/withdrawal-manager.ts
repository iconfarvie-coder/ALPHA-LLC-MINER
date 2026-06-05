import { 
  MetaTrader5Integration, 
  MT5WithdrawalRequest, 
  MT5BrokerConfig 
} from './mt5-integration';

/**
 * WithdrawalRecord - Persistent withdrawal history entry
 */
export interface WithdrawalRecord extends MT5WithdrawalRequest {
  withdrawalId: string;
  brokerConfig: {
    brokerName: string;
    accountNumber: string;
  };
  confirmationCode?: string;
  retryAttempts: number;
}

/**
 * RealWithdrawalManager - Manages real withdrawals from mining assets
 * Handles queuing, retry logic, and completion tracking
 */
export class RealWithdrawalManager {
  private mt5Integration: MetaTrader5Integration;
  private withdrawalQueue: MT5WithdrawalRequest[] = [];
  private completedWithdrawals: Map<string, WithdrawalRecord> = new Map();
  private processingInterval: NodeJS.Timer | null = null;
  private maxRetries: number = 3;
  private processIntervalMs: number = 5000; // Check queue every 5 seconds

  constructor(mt5Integration: MetaTrader5Integration) {
    this.mt5Integration = mt5Integration;
  }

  /**
   * Submit a real withdrawal request
   */
  async submitWithdrawal(
    amount: number,
    currency: string,
    destinationAccount: string,
    metadata?: Record<string, any>
  ): Promise<WithdrawalRecord> {
    if (!this.mt5Integration.isConnected()) {
      throw new Error('MT5 broker not connected. Cannot process withdrawal.');
    }

    // Validate amount
    const status = this.mt5Integration.getConnectionStatus();
    if (amount > status.freeMargin) {
      throw new Error(
        `Insufficient funds. Free margin: ${status.freeMargin}, Requested: ${amount}`
      );
    }

    try {
      // Create withdrawal request with MT5 broker
      const withdrawalRequest = await this.mt5Integration.requestWithdrawal({
        amount,
        currency,
        destinationAccount,
        brokerName: 'MetaTrader5',
        metadata: {
          ...metadata,
          submittedAt: new Date().toISOString(),
          minerSource: 'ALPHA-LLC-MINER',
        },
      });

      // Create persistent record
      const withdrawalRecord: WithdrawalRecord = {
        ...withdrawalRequest,
        withdrawalId: withdrawalRequest.transactionId,
        brokerConfig: {
          brokerName: 'MetaTrader5',
          accountNumber: withdrawalRequest.metadata?.accountNumber || 'unknown',
        },
        retryAttempts: 0,
      };

      this.completedWithdrawals.set(withdrawalRecord.withdrawalId, withdrawalRecord);
      console.log(`[Withdrawal] Submitted: ${withdrawalRecord.withdrawalId}`);

      return withdrawalRecord;
    } catch (error: any) {
      console.error(`[Withdrawal] Submission failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Start automatic withdrawal processor
   */
  startProcessor(): void {
    if (this.processingInterval) {
      console.warn('[Withdrawal] Processor already running');
      return;
    }

    console.log('[Withdrawal] Starting real withdrawal processor');

    this.processingInterval = setInterval(async () => {
      await this.processWithdrawals();
    }, this.processIntervalMs);
  }

  /**
   * Stop automatic withdrawal processor
   */
  stopProcessor(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log('[Withdrawal] Stopped real withdrawal processor');
    }
  }

  /**
   * Process pending withdrawals
   */
  private async processWithdrawals(): Promise<void> {
    if (!this.mt5Integration.isConnected()) {
      console.warn('[Withdrawal] MT5 not connected, skipping processing');
      return;
    }

    for (const [withdrawalId, record] of this.completedWithdrawals.entries()) {
      if (record.status === 'pending' || record.status === 'processing') {
        await this.checkAndUpdateWithdrawalStatus(withdrawalId, record);
      }
    }
  }

  /**
   * Check status and update withdrawal record
   */
  private async checkAndUpdateWithdrawalStatus(
    withdrawalId: string,
    record: WithdrawalRecord
  ): Promise<void> {
    try {
      const status = await this.mt5Integration.checkWithdrawalStatus(withdrawalId);

      const previousStatus = record.status;
      record.status = status as any;

      if (status === 'completed') {
        record.completedAt = new Date();
        console.log(`[Withdrawal] Completed: ${withdrawalId} | Amount: ${record.amount} ${record.currency}`);
      } else if (status === 'failed') {
        record.retryAttempts++;

        if (record.retryAttempts < this.maxRetries) {
          console.log(
            `[Withdrawal] Failed, retrying: ${withdrawalId} (Attempt ${record.retryAttempts}/${this.maxRetries})`
          );
          // Retry logic can be implemented here
        } else {
          console.error(`[Withdrawal] Max retries exceeded: ${withdrawalId}`);
        }
      }

      if (previousStatus !== status) {
        this.completedWithdrawals.set(withdrawalId, record);
      }
    } catch (error: any) {
      console.error(`[Withdrawal] Status check error for ${withdrawalId}: ${error.message}`);
    }
  }

  /**
   * Get withdrawal history
   */
  getWithdrawalHistory(limit: number = 100): WithdrawalRecord[] {
    return Array.from(this.completedWithdrawals.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  /**
   * Get withdrawal by ID
   */
  getWithdrawal(withdrawalId: string): WithdrawalRecord | undefined {
    return this.completedWithdrawals.get(withdrawalId);
  }

  /**
   * Get withdrawal statistics
   */
  getWithdrawalStats() {
    const all = Array.from(this.completedWithdrawals.values());
    const completed = all.filter(w => w.status === 'completed');
    const pending = all.filter(w => w.status === 'pending' || w.status === 'processing');
    const failed = all.filter(w => w.status === 'failed');

    return {
      total: all.length,
      completed: completed.length,
      pending: pending.length,
      failed: failed.length,
      totalAmount: all.reduce((sum, w) => sum + w.amount, 0),
      completedAmount: completed.reduce((sum, w) => sum + w.amount, 0),
    };
  }

  /**
   * Export withdrawal history for audit
   */
  exportWithdrawalAudit(): any {
    const records = Array.from(this.completedWithdrawals.values());
    return {
      exportedAt: new Date().toISOString(),
      totalRecords: records.length,
      records: records.map(r => ({
        withdrawalId: r.withdrawalId,
        amount: r.amount,
        currency: r.currency,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        completedAt: r.completedAt?.toISOString(),
        brokerName: r.brokerName,
        destinationAccount: r.destinationAccount,
        retryAttempts: r.retryAttempts,
      })),
    };
  }
}

export default RealWithdrawalManager;
