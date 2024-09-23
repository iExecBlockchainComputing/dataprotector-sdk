import { Address } from '@/types';
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

function getCompletedTasksCache(): TaskData[] {
  const tasksCache = localStorage.getItem(STORED_DATA_KEY);
  try {
    return tasksCache ? JSON.parse(tasksCache) : [];
  } catch (err) {
    console.error('[getCompletedTasksCache] ERROR', err);
    localStorage.removeItem(STORED_DATA_KEY);
    return [];
  }
}

export function saveCompletedTaskId({
  walletId,
  protectedDataAddress,
  completedTaskId,
}: {
  walletId: Address;
  protectedDataAddress: string;
  completedTaskId: string;
}) {
  const tasks = getCompletedTasksCache();

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
  const tasks = getCompletedTasksCache();

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
 * Reset the cache of completed task IDs in localStorage.
 */
export function resetCompletedTaskIdsCache() {
  localStorage.removeItem(STORED_DATA_KEY);
}
