import { type Connector } from 'wagmi';
import {
  IExecDataProtectorCore,
  IExecDataProtectorSharing,
} from '@iexec/dataprotector';
import { useUserStore } from '../stores/user.store.ts';

let dataProtector: IExecDataProtectorCore | null = null;
let dataProtectorSharing: IExecDataProtectorSharing | null = null;

export function cleanDataProtectorSDK() {
  dataProtector = null;
}

export async function initDataProtectorSDK({
  connector,
}: {
  connector?: Connector;
}) {
  const provider = await connector?.getProvider();
  if (!provider) {
    cleanDataProtectorSDK();
    return;
  }
  dataProtector = new IExecDataProtectorCore(provider);
  dataProtectorSharing = new IExecDataProtectorSharing(provider);
}

export async function getDataProtectorClient(): Promise<{
  dataProtector: IExecDataProtectorCore;
  dataProtectorSharing: IExecDataProtectorSharing;
}> {
  if (!dataProtector) {
    const connector = useUserStore.getState().connector;
    await initDataProtectorSDK({ connector });
  }
  if (!dataProtector || !dataProtectorSharing) {
    throw new Error('iExecDataProtector is not initialized');
  }
  return { dataProtector, dataProtectorSharing };
}
