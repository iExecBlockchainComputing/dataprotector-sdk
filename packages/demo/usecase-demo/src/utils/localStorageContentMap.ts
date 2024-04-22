import { LOCAL_STORAGE_PREFIX } from '@/utils/localStorage.ts';

/**
 * localStorage cache for completed iExec tasks.
 * ie. Content is available on IPFS *but* the key needs not to have been re-generated in the meantime!
 */

export function saveCompletedTaskId({
  protectedDataAddress,
  completedTaskId,
}: {
  protectedDataAddress: string;
  completedTaskId: string;
}) {
  localStorage.setItem(
    `${LOCAL_STORAGE_PREFIX}_${protectedDataAddress}`,
    completedTaskId
  );
}

export function getCompletedTaskId({
  protectedDataAddress,
}: {
  protectedDataAddress: string;
}) {
  return localStorage.getItem(
    `${LOCAL_STORAGE_PREFIX}_${protectedDataAddress}`
  );
}

export function resetCompletedTaskIdsCache() {
  for (const key in localStorage) {
    if (key.startsWith(`${LOCAL_STORAGE_PREFIX}_0x`)) {
      localStorage.removeItem(key);
    }
  }
}
