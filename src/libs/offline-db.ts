import type { DBSchema } from 'idb';
import { openDB } from 'idb';

type EcofinOfflineDB = {
  transactions_queue: {
    key: string; // uuid
    value: {
      id: string; // uuid_local
      text: string; // kalimat transaksi original
      timestamp: number;
    };
  };
} & DBSchema;

const DB_NAME = 'ecofin-offline';
const DB_VERSION = 1;

/** Inisialisasi IndexedDB sebagai Local-First storage */
export async function initOfflineDB() {
  if (typeof window === 'undefined') {
    return null;
  } // Prevent execution on server

  return openDB<EcofinOfflineDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('transactions_queue')) {
        db.createObjectStore('transactions_queue', { keyPath: 'id' });
      }
    },
  });
}

/** Menyimpan catatan transaksi baru ke antrean (Queue) lokal ketika tidak ada internet */
export async function saveTransactionOffline(text: string) {
  const db = await initOfflineDB();
  if (!db) {
    return;
  }

  const txId = crypto.randomUUID();
  await db.add('transactions_queue', {
    id: txId,
    text,
    timestamp: Date.now(),
  });

  return txId;
}

/** Mengambil seluruh antrean transaksi yang tertunda dari DB Lokal */
export async function getPendingTransactions() {
  const db = await initOfflineDB();
  if (!db) {
    return [];
  }

  return db.getAll('transactions_queue');
}

/** Menghapus record transaksi yang sudah disinkronkan ke Cloud dari DB lokal */
export async function deleteTransactionOffline(id: string) {
  const db = await initOfflineDB();
  if (!db) {
    return;
  }

  await db.delete('transactions_queue', id);
}
