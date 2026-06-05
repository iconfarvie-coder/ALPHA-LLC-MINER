import axios, { AxiosInstance } from 'axios';

/**
 * MT5BrokerConfig - Configuration for MetaTrader 5 Broker Connection
 */
export interface MT5BrokerConfig {
  brokerName: string;
  accountNumber: string;
  serverAddress: string;
  serverPort: number;
  apiKey?: string;
  apiSecret?: string;
  username: string;
  password: string;
  accountType: 'real' | 'demo';
  protocolVersion: string;
}

/**
 * MT5ConnectionStatus - Real-time connection state
 */
export interface MT5ConnectionStatus {
  isConnected: boolean;
  accountBalance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  lastUpdate: Date;
  connectionError?: string;
}

/**
 * MT5WithdrawalRequest - Real withdrawal transaction
 */
export interface MT5WithdrawalRequest {
  transactionId: string;
  amount: number;
  currency: string;
  destinationAccount: string;
  brokerName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  metadata?: Record<string, any>;
}

/**
 * MetaTrader5Integration - Main MT5 Integration Service
 * Handles real connections to MT5 brokers and manages account operations
 */
export class MetaTrader5Integration {
  private config: MT5BrokerConfig;
  private httpClient: AxiosInstance;
  private connectionStatus: MT5ConnectionStatus;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectInterval: NodeJS.Timer | null = null;

  constructor(config: MT5BrokerConfig) {
    this.config = config;
    this.connectionStatus = {
      isConnected: false,
      accountBalance: 0,
      equity: 0,
      margin: 0,
      freeMargin: 0,
      marginLevel: 0,
      lastUpdate: new Date(),
    };

    // Initialize HTTP client with broker server
    this.httpClient = axios.create({
      baseURL: `${this.config.serverAddress}:${this.config.serverPort}`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ALPHA-LLC-MINER/1.0',
        ...(this.config.apiKey && { 'X-API-Key': this.config.apiKey }),
        ...(this.config.apiSecret && { 'X-API-Secret': this.config.apiSecret }),
      },
    });
  }

  /**
   * Authenticate with MT5 broker and establish connection
   */
  async authenticate(): Promise<boolean> {
    try {
      console.log(`[MT5] Authenticating with ${this.config.brokerName}...`);

      const authPayload = {
        username: this.config.username,
        password: this.config.password,
        accountNumber: this.config.accountNumber,
        accountType: this.config.accountType,
        protocolVersion: this.config.protocolVersion,
      };

      const response = await this.httpClient.post('/auth/login', authPayload);

      if (response.data.token) {
        // Store auth token for future requests
        this.httpClient.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        this.connectionStatus.isConnected = true;
        this.reconnectAttempts = 0;

        console.log(`[MT5] Successfully authenticated with ${this.config.brokerName}`);
        await this.syncAccountStatus();
        return true;
      }

      throw new Error('No authentication token received');
    } catch (error: any) {
      this.connectionStatus.isConnected = false;
      this.connectionStatus.connectionError = error.message;
      console.error(`[MT5] Authentication failed: ${error.message}`);
      this.attemptReconnect();
      return false;
    }
  }

  /**
   * Sync account balance and status from broker
   */
  async syncAccountStatus(): Promise<MT5ConnectionStatus> {
    try {
      const response = await this.httpClient.get('/account/info');

      if (response.data) {
        this.connectionStatus = {
          isConnected: true,
          accountBalance: response.data.balance || 0,
          equity: response.data.equity || 0,
          margin: response.data.margin || 0,
          freeMargin: response.data.freeMargin || 0,
          marginLevel: response.data.marginLevel || 0,
          lastUpdate: new Date(),
        };

        console.log(`[MT5] Account synced - Balance: ${this.connectionStatus.accountBalance}`);
      }

      return this.connectionStatus;
    } catch (error: any) {
      console.error(`[MT5] Failed to sync account status: ${error.message}`);
      this.connectionStatus.isConnected = false;
      this.connectionStatus.connectionError = error.message;
      this.attemptReconnect();
      return this.connectionStatus;
    }
  }

  /**
   * Execute real withdrawal from mined assets to MT5 account
   */
  async requestWithdrawal(withdrawal: Omit<MT5WithdrawalRequest, 'transactionId' | 'createdAt' | 'status'>): Promise<MT5WithdrawalRequest> {
    if (!this.connectionStatus.isConnected) {
      throw new Error('Not connected to MT5 broker. Cannot process withdrawal.');
    }

    const withdrawalRequest: MT5WithdrawalRequest = {
      transactionId: this.generateTransactionId(),
      ...withdrawal,
      status: 'pending',
      createdAt: new Date(),
    };

    try {
      console.log(`[MT5] Processing withdrawal: ${withdrawalRequest.transactionId}`);

      const response = await this.httpClient.post('/transactions/withdraw', {
        amount: withdrawalRequest.amount,
        currency: withdrawalRequest.currency,
        destinationAccount: withdrawalRequest.destinationAccount,
        transactionId: withdrawalRequest.transactionId,
        metadata: withdrawalRequest.metadata,
      });

      if (response.data.status) {
        withdrawalRequest.status = response.data.status;
        withdrawalRequest.metadata = response.data.metadata || {};

        console.log(`[MT5] Withdrawal initiated - Status: ${withdrawalRequest.status}`);
        return withdrawalRequest;
      }

      throw new Error('Invalid response from broker');
    } catch (error: any) {
      withdrawalRequest.status = 'failed';
      withdrawalRequest.metadata = { error: error.message };
      console.error(`[MT5] Withdrawal failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check withdrawal status
   */
  async checkWithdrawalStatus(transactionId: string): Promise<string> {
    try {
      const response = await this.httpClient.get(`/transactions/${transactionId}/status`);
      return response.data.status || 'unknown';
    } catch (error: any) {
      console.error(`[MT5] Failed to check withdrawal status: ${error.message}`);
      return 'error';
    }
  }

  /**
   * Get real-time account positions and open trades
   */
  async getOpenPositions(): Promise<any[]> {
    try {
      const response = await this.httpClient.get('/positions/open');
      return response.data.positions || [];
    } catch (error: any) {
      console.error(`[MT5] Failed to fetch open positions: ${error.message}`);
      return [];
    }
  }

  /**
   * Place a real trade on the connected MT5 account
   */
  async placeTrade(tradeDetails: any): Promise<any> {
    if (!this.connectionStatus.isConnected) {
      throw new Error('Not connected to MT5 broker. Cannot place trade.');
    }

    try {
      const response = await this.httpClient.post('/trades/place', tradeDetails);
      console.log(`[MT5] Trade placed successfully: ${response.data.ticketNumber}`);
      return response.data;
    } catch (error: any) {
      console.error(`[MT5] Failed to place trade: ${error.message}`);
      throw error;
    }
  }

  /**
   * Disconnect from broker and cleanup
   */
  async disconnect(): Promise<void> {
    try {
      await this.httpClient.post('/auth/logout', {});
      this.connectionStatus.isConnected = false;
      if (this.reconnectInterval) {
        clearInterval(this.reconnectInterval);
      }
      console.log(`[MT5] Disconnected from ${this.config.brokerName}`);
    } catch (error) {
      console.error('[MT5] Error during disconnect:', error);
    }
  }

  /**
   * Attempt automatic reconnection
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`[MT5] Max reconnection attempts reached`);
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff

    console.log(`[MT5] Attempting reconnection in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectInterval = setTimeout(() => {
      this.authenticate();
    }, delay);
  }

  /**
   * Generate unique transaction ID
   */
  private generateTransactionId(): string {
    return `${this.config.accountNumber}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): MT5ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    return this.connectionStatus.isConnected;
  }
}

/**
 * Factory function to create MT5 integration instance
 */
export function createMT5Integration(config: MT5BrokerConfig): MetaTrader5Integration {
  return new MetaTrader5Integration(config);
}

export default MetaTrader5Integration;
