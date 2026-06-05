import express, { Request, Response } from 'express';
import { getGlobalBrokerManager, SUPPORTED_BROKERS, BrokerConfig } from '../services/broker-manager';

const router = express.Router();
const brokerManager = getGlobalBrokerManager();

/**
 * GET /api/brokers - List all registered brokers
 */
router.get('/brokers', (req: Request, res: Response) => {
  try {
    const brokers = brokerManager.listBrokers();
    res.json({
      success: true,
      brokers: brokers.map(b => ({
        brokerId: b.name,
        brokerName: b.brokerName,
        displayName: b.displayName,
        accountNumber: b.accountNumber,
        accountType: b.accountType,
        isActive: b.isActive,
        createdAt: b.createdAt,
        lastConnected: b.lastConnected,
      })),
      count: brokers.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/brokers/supported - List supported brokers
 */
router.get('/brokers/supported', (req: Request, res: Response) => {
  try {
    const supported = Object.entries(SUPPORTED_BROKERS).map(([key, value]) => ({
      brokerCode: key,
      ...value,
    }));

    res.json({
      success: true,
      brokers: supported,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/brokers/connect - Register and connect to a broker
 */
router.post('/brokers/connect', async (req: Request, res: Response) => {
  try {
    const { brokerId, brokerCode, username, password, accountNumber, apiKey, apiSecret, accountType } = req.body;

    // Validate input
    if (!brokerId || !brokerCode || !username || !password || !accountNumber) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: brokerId, brokerCode, username, password, accountNumber',
      });
    }

    // Get broker template
    const brokerTemplate = SUPPORTED_BROKERS[brokerCode as keyof typeof SUPPORTED_BROKERS];
    if (!brokerTemplate) {
      return res.status(400).json({
        success: false,
        error: `Broker code '${brokerCode}' not supported`,
      });
    }

    // Create broker config
    const brokerConfig: Omit<BrokerConfig, 'createdAt' | 'lastConnected'> = {
      brokerName: brokerTemplate.name,
      displayName: req.body.displayName || brokerTemplate.name,
      serverAddress: brokerTemplate.serverAddress,
      serverPort: brokerTemplate.serverPort,
      protocolVersion: brokerTemplate.protocolVersion,
      accountNumber,
      username,
      password,
      accountType: accountType || 'real',
      apiKey,
      apiSecret,
      isActive: true,
    };

    // Register broker
    const success = await brokerManager.registerBroker(brokerId, brokerConfig);

    if (success) {
      res.json({
        success: true,
        message: `Connected to ${brokerTemplate.name}`,
        brokerId,
      });
    } else {
      res.status(400).json({
        success: false,
        error: `Failed to connect to broker ${brokerCode}`,
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/brokers/:brokerId/status - Get broker connection status
 */
router.get('/brokers/:brokerId/status', (req: Request, res: Response) => {
  try {
    const { brokerId } = req.params;
    const connection = brokerManager.getBrokerConnection(brokerId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: `Broker ${brokerId} not found`,
      });
    }

    const status = connection.getConnectionStatus();

    res.json({
      success: true,
      brokerId,
      status: {
        isConnected: status.isConnected,
        accountBalance: status.accountBalance,
        equity: status.equity,
        margin: status.margin,
        freeMargin: status.freeMargin,
        marginLevel: status.marginLevel,
        lastUpdate: status.lastUpdate,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/brokers/:brokerId/withdraw - Submit real withdrawal
 */
router.post('/brokers/:brokerId/withdraw', async (req: Request, res: Response) => {
  try {
    const { brokerId } = req.params;
    const { amount, currency, destinationAccount, metadata } = req.body;

    // Validate input
    if (!amount || !currency || !destinationAccount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: amount, currency, destinationAccount',
      });
    }

    // Submit withdrawal
    const withdrawal = await brokerManager.requestWithdrawalMultiBroker(
      amount,
      currency,
      brokerId,
      destinationAccount
    );

    res.json({
      success: true,
      withdrawal: {
        withdrawalId: withdrawal.withdrawalId,
        amount: withdrawal.amount,
        currency: withdrawal.currency,
        status: withdrawal.status,
        createdAt: withdrawal.createdAt,
        transactionId: withdrawal.transactionId,
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/brokers/:brokerId/withdrawals - Get withdrawal history
 */
router.get('/brokers/:brokerId/withdrawals', (req: Request, res: Response) => {
  try {
    const { brokerId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const withdrawalManager = brokerManager.getWithdrawalManager(brokerId);

    if (!withdrawalManager) {
      return res.status(404).json({
        success: false,
        error: `Broker ${brokerId} not found`,
      });
    }

    const history = withdrawalManager.getWithdrawalHistory(limit);
    const stats = withdrawalManager.getWithdrawalStats();

    res.json({
      success: true,
      brokerId,
      stats,
      withdrawals: history.map(w => ({
        withdrawalId: w.withdrawalId,
        amount: w.amount,
        currency: w.currency,
        status: w.status,
        createdAt: w.createdAt,
        completedAt: w.completedAt,
        destinationAccount: w.destinationAccount,
        retryAttempts: w.retryAttempts,
      })),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/brokers/stats/global - Get global withdrawal statistics
 */
router.get('/stats/global', (req: Request, res: Response) => {
  try {
    const stats = brokerManager.getGlobalWithdrawalStats();

    res.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/brokers/:brokerId/disconnect - Disconnect from broker
 */
router.post('/brokers/:brokerId/disconnect', async (req: Request, res: Response) => {
  try {
    const { brokerId } = req.params;

    await brokerManager.disconnectBroker(brokerId);

    res.json({
      success: true,
      message: `Disconnected from broker ${brokerId}`,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/brokers/audit/export - Export all withdrawal audits
 */
router.get('/audit/export', (req: Request, res: Response) => {
  try {
    const audits = brokerManager.exportAllAudits();

    res.json({
      success: true,
      exportedAt: new Date().toISOString(),
      audits,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
