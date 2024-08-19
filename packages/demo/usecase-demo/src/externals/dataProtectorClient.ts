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

  const iexecOptions = {
    smsURL: import.meta.env.VITE_SMS_URL || undefined,
    iexecGatewayURL: import.meta.env.VITE_IEXEC_GATEWAY_URL || undefined,
    // Where user-specific encrypted data are uploaded (consumeProtectedData())
    resultProxyURL: import.meta.env.VITE_RESULT_PROXY_URL || undefined,
  };

  const dataProtectorOptions = {
    dataprotectorContractAddress: import.meta.env.VITE_DATAPROTECTOR_ADDRESS,
    sharingContractAddress: import.meta.env.VITE_DATAPROTECTOR_SHARING_ADDRESS,
    subgraphUrl: import.meta.env.VITE_DATAPROTECTOR_SUBGRAPH_URL,

    // With default IPFS gateway
    // ipfsGateway: import.meta.env.VITE_IPFS_GATEWAY_URL,

    // With dedicated IPFS gateway for Content Creator
    ipfsGateway: 'https://contentcreator-ipfs.iex.ec',

    // With default IPFS node (500ko max)
    // ipfsNode: import.meta.env.VITE_IPFS_NODE_URL,

    // With dedicated IPFS node for Content Creator (10Mo max)
    ipfsNode: 'https://contentcreator-upload.iex.ec',

    iexecOptions,
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
