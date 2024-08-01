import { Address } from 'wagmi';
import { LOCAL_STORAGE_PREFIX } from '@/utils/localStorage.ts';

type TaskData = {
  wallet_id: Address;
  protected_data_address: string;
  completed_task_id: string;
};

const STORED_DATA_KEY = `${LOCAL_STORAGE_PREFIX}_savedTaskId`;

/**
 * localStorage cache for completed iExec tasks.
 * ie. Content is available on IPFS *but* the key needs not to have been re-generated in the meantime!
 */

export function saveCompletedTaskId({
  walletId,
  protectedDataAddress,
  completedTaskId,
}: {
  walletId: Address;
  protectedDataAddress: string;
  completedTaskId: string;
}) {
  const storedData = localStorage.getItem(STORED_DATA_KEY);
  const data: TaskData[] = storedData ? JSON.parse(storedData) : [];

  const newData: TaskData = {
    wallet_id: walletId,
    protected_data_address: protectedDataAddress,
    completed_task_id: completedTaskId,
  };

  const index = data.findIndex(
    (item) =>
      item.wallet_id === walletId &&
      item.protected_data_address === protectedDataAddress
  );

  if (index > -1) {
    data[index] = newData;
  } else {
    data.push(newData);
  }

  localStorage.setItem(STORED_DATA_KEY, JSON.stringify(data));
}

export function getCompletedTaskId({
  walletId,
  protectedDataAddress,
}: {
  walletId: Address;
  protectedDataAddress: string;
}): string | null {
  const storedData = localStorage.getItem(STORED_DATA_KEY);
  const data: TaskData[] = storedData ? JSON.parse(storedData) : [];

  const entry = data.find(
    (item) =>
      item.wallet_id === walletId &&
      item.protected_data_address === protectedDataAddress
  );

  if (!entry || !entry.completed_task_id) {
    return null;
  }

  return entry.completed_task_id;
}

/**
 * Réinitialise le cache des IDs de tâches complétées dans le localStorage.
 */
export function resetCompletedTaskIdsCache() {
  localStorage.removeItem(STORED_DATA_KEY);
}
