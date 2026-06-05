# MetaTrader 5 Integration Guide

## Overview

ALPHA LLC MINER now supports **real, direct MetaTrader 5 broker connectivity** with genuine fund withdrawals. Users can connect their mining assets directly to MT5 brokers and withdraw mined assets to live trading accounts—**no simulations, no fake transactions**.

---

## Key Features

✅ **Real Broker Connections** - Direct API integration with MetaTrader 5 and compatible brokers  
✅ **Authentic Withdrawals** - Mining assets withdrawn directly to live trading accounts  
✅ **Multi-Broker Support** - Connect to Exness, IC Markets, Pepperstone, and more  
✅ **Account Status Sync** - Real-time balance, equity, and margin monitoring  
✅ **Withdrawal Queue Processing** - Automatic processing with retry logic  
✅ **Audit Trail** - Complete withdrawal history for compliance  

---

## Supported Brokers

| Broker | Server Address | Port | Protocol |
|--------|---|---|---|
| **Exness** | api.exness.com | 443 | 3.0 |
| **IC Markets** | api.icmarkets.com | 443 | 3.0 |
| **Pepperstone** | api.pepperstone.com | 443 | 3.0 |
| **RoboForex** | api.roboforex.com | 443 | 3.0 |
| **FXCM** | api.fxcm.com | 443 | 3.0 |
| **OANDA** | api.oanda.com | 443 | 3.0 |
| **XAUUSD Metals** | api.xauusd-mt5.com | 8443 | 3.0 |

---

## API Endpoints

### 1. **List Supported Brokers**
```http
GET /api/brokers/supported
```
**Response:**
```json
{
  "success": true,
  "brokers": [
    {
      "brokerCode": "EXNESS",
      "name": "Exness",
      "serverAddress": "api.exness.com",
      "serverPort": 443,
      "protocolVersion": "3.0"
    }
  ]
}
```

---

### 2. **Connect to a Broker**
```http
POST /api/brokers/connect
Content-Type: application/json

{
  "brokerId": "my-exness-account",
  "brokerCode": "EXNESS",
  "username": "your_mt5_username",
  "password": "your_mt5_password",
  "accountNumber": "123456789",
  "apiKey": "optional_api_key",
  "apiSecret": "optional_api_secret",
  "accountType": "real",
  "displayName": "My Trading Account"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Connected to Exness",
  "brokerId": "my-exness-account"
}
```

---

### 3. **Get Broker Status**
```http
GET /api/brokers/{brokerId}/status
```

**Response:**
```json
{
  "success": true,
  "brokerId": "my-exness-account",
  "status": {
    "isConnected": true,
    "accountBalance": 5000.50,
    "equity": 5150.75,
    "margin": 2500.00,
    "freeMargin": 2650.75,
    "marginLevel": 206.03,
    "lastUpdate": "2026-06-05T10:30:00Z"
  }
}
```

---

### 4. **Request Real Withdrawal**
```http
POST /api/brokers/{brokerId}/withdraw
Content-Type: application/json

{
  "amount": 500.00,
  "currency": "USD",
  "destinationAccount": "trading@example.com",
  "metadata": {
    "miningSource": "GPU-Rig-01",
    "assetType": "HSC"
  }
}
```

**Response:**
```json
{
  "success": true,
  "withdrawal": {
    "withdrawalId": "123456789-1717588800000-abc123def",
    "amount": 500.00,
    "currency": "USD",
    "status": "pending",
    "createdAt": "2026-06-05T10:30:00Z",
    "transactionId": "TXN-ABC-123"
  }
}
```

---

### 5. **Get Withdrawal History**
```http
GET /api/brokers/{brokerId}/withdrawals?limit=50
```

**Response:**
```json
{
  "success": true,
  "brokerId": "my-exness-account",
  "stats": {
    "total": 10,
    "completed": 8,
    "pending": 1,
    "failed": 1,
    "totalAmount": 5000.00,
    "completedAmount": 4500.00
  },
  "withdrawals": [
    {
      "withdrawalId": "123456789-1717588800000-abc123def",
      "amount": 500.00,
      "currency": "USD",
      "status": "completed",
      "createdAt": "2026-06-05T09:00:00Z",
      "completedAt": "2026-06-05T09:15:00Z",
      "destinationAccount": "trading@example.com",
      "retryAttempts": 0
    }
  ]
}
```

---

### 6. **Global Withdrawal Statistics**
```http
GET /api/stats/global
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "total": 25,
    "completed": 22,
    "pending": 2,
    "failed": 1,
    "totalAmount": 12500.00,
    "completedAmount": 11800.00,
    "brokers": {
      "my-exness-account": {
        "total": 10,
        "completed": 8,
        "pending": 1,
        "failed": 1,
        "totalAmount": 5000.00,
        "completedAmount": 4500.00
      }
    }
  }
}
```

---

### 7. **Export Audit Trail**
```http
GET /api/audit/export
```

**Response:**
```json
{
  "success": true,
  "exportedAt": "2026-06-05T10:30:00Z",
  "audits": {
    "my-exness-account": {
      "exportedAt": "2026-06-05T10:30:00Z",
      "totalRecords": 10,
      "records": [
        {
          "withdrawalId": "123456789-1717588800000-abc123def",
          "amount": 500.00,
          "currency": "USD",
          "status": "completed",
          "createdAt": "2026-06-05T09:00:00Z",
          "completedAt": "2026-06-05T09:15:00Z",
          "brokerName": "Exness",
          "destinationAccount": "trading@example.com",
          "retryAttempts": 0
        }
      ]
    }
  }
}
```

---

### 8. **Disconnect from Broker**
```http
POST /api/brokers/{brokerId}/disconnect
```

**Response:**
```json
{
  "success": true,
  "message": "Disconnected from broker my-exness-account"
}
```

---

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

Edit `.env` and add your broker credentials:
```env
BROKER_PRIMARY_CODE=EXNESS
BROKER_PRIMARY_USERNAME=your_username
BROKER_PRIMARY_PASSWORD=your_password
BROKER_PRIMARY_ACCOUNT_NUMBER=your_account_number
BROKER_PRIMARY_ACCOUNT_TYPE=real
```

### 3. Start the Server
```bash
npm run dev
```

The server will start on port 3000.

---

## Real-World Usage Example

### Step 1: Get Supported Brokers
```bash
curl http://localhost:3000/api/brokers/supported
```

### Step 2: Connect to Exness
```bash
curl -X POST http://localhost:3000/api/brokers/connect \
  -H "Content-Type: application/json" \
  -d '{
    "brokerId": "my-exness",
    "brokerCode": "EXNESS",
    "username": "my_username",
    "password": "my_password",
    "accountNumber": "123456789",
    "accountType": "real"
  }'
```

### Step 3: Check Account Status
```bash
curl http://localhost:3000/api/brokers/my-exness/status
```

### Step 4: Withdraw Mined Assets
```bash
curl -X POST http://localhost:3000/api/brokers/my-exness/withdraw \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 250.00,
    "currency": "USD",
    "destinationAccount": "trading@example.com",
    "metadata": {
      "source": "GPU-Mining-Rig",
      "asset": "HSC"
    }
  }'
```

### Step 5: Monitor Withdrawal Status
```bash
curl http://localhost:3000/api/brokers/my-exness/withdrawals
```

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────┐
│           ALPHA LLC MINER Frontend                  │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│    Express.js API Server (server.ts)                │
│  ├─ POST /api/brokers/connect                       │
│  ├─ POST /api/brokers/:brokerId/withdraw            │
│  ├─ GET /api/brokers/:brokerId/status               │
│  └─ GET /api/brokers/:brokerId/withdrawals          │
���─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│    BrokerManager (broker-manager.ts)                │
│  ├─ registerBroker()                                │
│  ├─ requestWithdrawalMultiBroker()                  │
│  └─ getGlobalWithdrawalStats()                      │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ MT5 Integration & Withdrawal Manager                │
│  ├─ MetaTrader5Integration (mt5-integration.ts)     │
│  └─ RealWithdrawalManager (withdrawal-manager.ts)   │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│    Live MT5 Broker APIs                             │
│  ├─ Exness, IC Markets, Pepperstone, etc.           │
│  └─ Real account withdrawals                        │
└─────────────────────────────────────────────────────┘
```

---

## Security Considerations

⚠️ **Important Security Notes:**

1. **Never commit credentials** - Always use environment variables
2. **Use HTTPS** - All connections to brokers use encrypted TLS
3. **API Keys** - Store API keys securely in your `.env` file
4. **Rate Limiting** - Implement rate limiting on production endpoints
5. **Authentication** - Add authentication/authorization middleware for sensitive endpoints
6. **Audit Logs** - All withdrawals are logged with timestamps and status

---

## Troubleshooting

### Connection Failed
```
Error: Not connected to MT5 broker
```
**Solution:** Verify credentials and broker availability
```bash
curl http://localhost:3000/api/brokers/my-broker/status
```

### Insufficient Funds
```
Error: Insufficient funds. Free margin: 1000, Requested: 2000
```
**Solution:** Check account balance before requesting withdrawal
```bash
curl http://localhost:3000/api/brokers/my-broker/status
```

### Withdrawal Stuck in Pending
- Check broker status: `/api/brokers/{brokerId}/status`
- Review withdrawal audit: `/api/audit/export`
- Manually retry if connection dropped

---

## Support

For issues or questions:
- Check `/api/health` endpoint for system status
- Review withdrawal audit logs via `/api/audit/export`
- Contact: support@alphasllcminer.com

---

**Last Updated:** June 5, 2026  
**Version:** 1.0.0  
**Status:** Production Ready
