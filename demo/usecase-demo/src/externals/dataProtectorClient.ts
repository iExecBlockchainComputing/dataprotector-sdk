import { type Connector } from 'wagmi';
import { IExecDataProtector } from '@iexec/dataprotector';

let iExecDataProtector: IExecDataProtector | null = null;

async function initDataProtectorSDK({ connector }: { connector: Connector }) {
  const provider = await connector.getProvider();
  iExecDataProtector = new IExecDataProtector(provider);
}

export async function getDataProtectorClient({
  connector,
}: {
  connector: Connector;
}): Promise<IExecDataProtector> {
  if (!iExecDataProtector) {
    await initDataProtectorSDK({ connector });
  }
  if (!iExecDataProtector) {
    throw new Error('iExecDataProtector is not initialized');
  }
  return iExecDataProtector;
}
