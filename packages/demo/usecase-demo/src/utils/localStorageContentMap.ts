import { Address } from 'wagmi';
import { LOCAL_STORAGE_PREFIX } from '@/utils/localStorage.ts';

type TaskData = {
  wallet_id: Address;
  protected_data_address: string;
  completed_task_id: string;
};

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
  const storedDataName = 'savedTaskId';
  const key = `${LOCAL_STORAGE_PREFIX}_${storedDataName}`;

  const storedData = localStorage.getItem(key);
  const data: TaskData[] = storedData ? JSON.parse(storedData) : [];

  const newData = {
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

  localStorage.setItem(key, JSON.stringify(data));
}

export function getCompletedTaskId({
  walletId,
  protectedDataAddress,
}: {
  walletId: Address;
  protectedDataAddress: string;
}) {
  const storedDataName = 'savedTaskId';
  const key = `${LOCAL_STORAGE_PREFIX}_${storedDataName}`;

  const storedData = localStorage.getItem(key);
  const data: TaskData[] = storedData ? JSON.parse(storedData) : [];

  const entry = data.find(
    (item) =>
      item.wallet_id === walletId &&
      item.protected_data_address === protectedDataAddress
  );
  console.log(entry);

  if (!entry || !entry.completed_task_id) {
    return null;
  }

  return entry.completed_task_id;
}

export function resetCompletedTaskIdsCache() {
  const storedDataName = 'savedTaskId';
  const key = `${LOCAL_STORAGE_PREFIX}_${storedDataName}`;
  localStorage.removeItem(key);
}
