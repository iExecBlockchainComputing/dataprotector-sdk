import { type Connector } from 'wagmi';
import { IExecDataProtector } from '@iexec/dataprotector';
import { useUserStore } from '../stores/user.store.ts';

let iExecDataProtector: IExecDataProtector | null = null;

export function cleanDataProtectorSDK() {
  iExecDataProtector = null;
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
  iExecDataProtector = new IExecDataProtector(provider);
}

export async function getDataProtectorClient(): Promise<IExecDataProtector> {
  if (!iExecDataProtector) {
    const connector = useUserStore.getState().connector;
    await initDataProtectorSDK({ connector });
  }
  if (!iExecDataProtector) {
    throw new Error('iExecDataProtector is not initialized');
  }
  return iExecDataProtector;
}
