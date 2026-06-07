type User @table {
  displayName: String!
  email: String!
  createdAt: Timestamp!
  photoUrl: String
}

type MiningRig @table {
  user: User
  name: String!
  hashRateGHs: Float!
  powerConsumptionWatts: Int!
  status: String!
  createdAt: Timestamp!
  location: String
  temperatureCelsius: Float
  lastStatusUpdate: Timestamp
  associatedPool: MiningPool
}

type MiningPool @table {
  user: User
  name: String!
  poolUrl: String!
  apiKey: String!
  cryptocurrency: String!
  createdAt: Timestamp!
  description: String
  walletAddress: String
}

type RigStatistic @table {
  miningRig: MiningRig
  timestamp: Timestamp!
  currentHashRateGHs: Float!
  currentPowerConsumptionWatts: Int!
  temperatureCelsius: Float!
  fanSpeedPercentage: Int
  uptimeSeconds: Int64
  powerEfficiencyGHsPerWatt: Float
}

type Wallet @table {
  user: User
  currency: String!
  address: String!
  createdAt: Timestamp!
  name: String
}
