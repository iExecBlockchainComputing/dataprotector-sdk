import {
  IExecDataProtector,
  IExecDataProtectorCore,
  IExecDataProtectorSharing,
} from '@iexec/dataprotector';
import { type Connector } from 'wagmi';
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

  // FOR TESTS ONLY
  // iexecOptions for staging
  const iexecOptions = {
    smsURL: 'https://sms.scone-prod.stagingv8.iex.ec',
    ipfsGatewayURL: 'https://ipfs-gateway.stagingv8.iex.ec',
    iexecGatewayURL: 'https://api.market.stagingv8.iex.ec',
    // Where user-specific encrypted data are uploaded (consumeProtectedData())
    resultProxyURL: 'https://result.stagingv8.iex.ec',
  };

  const dataProtectorOptions = {
    iexecOptions,
    ipfsGateway: 'https://ipfs-gateway.stagingv8.iex.ec',
    // ipfsGateway: 'https://contentcreator-upload.iex.ec',
    // Where protected data are uploaded (protectData())
    ipfsNode: 'https://ipfs-upload.stagingv8.iex.ec',
    // ipfsNode: 'https://contentcreator-upload.iex.ec',
    subgraphUrl:
      'https://thegraph-product.iex.ec/subgraphs/name/bellecour/dev-dataprotector-v2',
  };

  const dataProtectorParent = new IExecDataProtector(
    provider,
    dataProtectorOptions
  );

  dataProtector = dataProtectorParent.core;
  dataProtectorSharing = dataProtectorParent.sharing;
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
