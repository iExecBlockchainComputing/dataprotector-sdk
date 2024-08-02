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
  const storeTasks = localStorage.getItem(STORED_DATA_KEY);
  const tasks: TaskData[] = storeTasks ? JSON.parse(storeTasks) : [];

  const newCompletedTask: TaskData = {
    wallet_id: walletId,
    protected_data_address: protectedDataAddress,
    completed_task_id: completedTaskId,
  };

  const existingTaskIndex = tasks.findIndex(
    (task) =>
      task.wallet_id === walletId &&
      task.protected_data_address === protectedDataAddress
  );

  if (existingTaskIndex > -1) {
    tasks[existingTaskIndex] = newCompletedTask;
  } else {
    tasks.push(newCompletedTask);
  }

  localStorage.setItem(STORED_DATA_KEY, JSON.stringify(tasks));
}

export function getCompletedTaskId({
  walletId,
  protectedDataAddress,
}: {
  walletId: Address;
  protectedDataAddress: string;
}): string | null {
  const storeTasks = localStorage.getItem(STORED_DATA_KEY);
  const tasks: TaskData[] = storeTasks ? JSON.parse(storeTasks) : [];

  const existingTask = tasks.find(
    (task) =>
      task.wallet_id === walletId &&
      task.protected_data_address === protectedDataAddress
  );

  if (!existingTask || !existingTask.completed_task_id) {
    return null;
  }

  return existingTask.completed_task_id;
}

/**
 * Réinitialise le cache des IDs de tâches complétées dans le localStorage.
 */
export function resetCompletedTaskIdsCache() {
  localStorage.removeItem(STORED_DATA_KEY);
}
