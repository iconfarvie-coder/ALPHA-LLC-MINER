import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { UserProfile, PayoutTransaction } from './types';

/**
 * Saves or updates a user profile on Firestore.
 * Performs incremental updates of coins, USD balance, and lifetime earnings.
 */
export async function saveUserProfile(
  userId: string,
  profile: UserProfile,
  coins: number,
  usd: number,
  lifetimeMined: number,
  additionalData?: {
    upgrades?: any[];
    balances?: any;
    boosterInventory?: any;
    activeBoosters?: any[];
    dailyReward?: any;
    activeCrypto?: string;
  }
) {
  const path = `users/${userId}`;
  try {
    const docRef = doc(db, 'users', userId);
    const data: any = {
      uid: profile.uid,
      name: profile.name,
      email: profile.email || null,
      phone: profile.phone || null,
      provider: profile.provider,
      coins: Number(coins.toFixed(8)),
      usd: Number(usd.toFixed(4)),
      lifetimeMined: Number(lifetimeMined.toFixed(8)),
      createdAt: profile.createdAt || Date.now()
    };
    
    if (additionalData) {
      if (additionalData.upgrades !== undefined) {
        data.upgrades = additionalData.upgrades;
      }
      if (additionalData.balances !== undefined) {
        data.balances = additionalData.balances;
      }
      if (additionalData.boosterInventory !== undefined) {
        data.boosterInventory = additionalData.boosterInventory;
      }
      if (additionalData.activeBoosters !== undefined) {
        data.activeBoosters = additionalData.activeBoosters;
      }
      if (additionalData.dailyReward !== undefined) {
        data.dailyReward = additionalData.dailyReward;
      }
      if (additionalData.activeCrypto !== undefined) {
        data.activeCrypto = additionalData.activeCrypto;
      }
    }
    
    await setDoc(docRef, data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetches the user profile from Firestore.
 */
export async function getUserProfile(userId: string): Promise<any | null> {
  const path = `users/${userId}`;
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Creates or updates a payout transaction in Firestore.
 */
export async function savePayoutTransaction(
  userId: string,
  tx: PayoutTransaction
) {
  const path = `users/${userId}/payouts/${tx.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'payouts', tx.id);
    const data = {
      id: tx.id,
      amountCoin: Number(tx.amountCoin.toFixed(8)),
      amountUSD: Number(tx.amountUSD.toFixed(4)),
      address: tx.address,
      status: tx.status,
      verificationStatus: tx.verificationStatus || 'unverified',
      timestamp: tx.timestamp,
      txHash: tx.txHash,
      fee: Number(tx.fee.toFixed(8)),
      blockNumber: tx.blockNumber,
      type: tx.type || 'cash',
      crypto: tx.crypto || 'HSC',
      gateway: tx.gateway || 'wallet',
      gatewayDetails: tx.gatewayDetails || '',
      holdForBatching: tx.holdForBatching || false,
      isTransfer: tx.isTransfer || false,
      transferType: tx.transferType || null,
      senderAddress: tx.senderAddress || null,
      recipientName: tx.recipientName || null,
      recipientConfirmed: tx.recipientConfirmed || false,
      recipientConfirmedAt: tx.recipientConfirmedAt || null
    };
    await setDoc(docRef, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetches all payout transactions from the user's payouts subcollection.
 */
export async function getPayoutTransactions(userId: string): Promise<PayoutTransaction[]> {
  const path = `users/${userId}/payouts`;
  try {
    const colRef = collection(db, 'users', userId, 'payouts');
    const querySnap = await getDocs(colRef);
    const payouts: PayoutTransaction[] = [];
    querySnap.forEach((doc) => {
      payouts.push(doc.data() as PayoutTransaction);
    });
    // Sort descending by timestamp
    return payouts.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Deletes a pending unverified payout transaction.
 */
export async function deletePayoutTransaction(userId: string, txId: string) {
  const path = `users/${userId}/payouts/${txId}`;
  try {
    const docRef = doc(db, 'users', userId, 'payouts', txId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Performs verification on a transaction (AML & proof creation updates).
 * Mutates verificationStatus -> 'verifying' -> 'verified' under zero-trust bounds.
 */
export async function updatePayoutVerification(
  userId: string,
  txId: string,
  verificationStatus: 'unverified' | 'verifying' | 'verified',
  status?: 'pending' | 'processing' | 'confirmed'
) {
  const path = `users/${userId}/payouts/${txId}`;
  try {
    const docRef = doc(db, 'users', userId, 'payouts', txId);
    const updates: any = { verificationStatus };
    if (status) {
      updates.status = status;
    }
    await updateDoc(docRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
