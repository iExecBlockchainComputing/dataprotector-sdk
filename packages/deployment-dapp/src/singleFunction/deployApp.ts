import { IExec } from 'iexec';
import {
  APP_NAME,
  APP_TYPE,
  DOCKER_IMAGE_NAMESPACE,
  DOCKER_IMAGE_REPOSITORY,
} from '../config/config.js';
import {
  getDockerImageChecksum,
  loadSconeFingerprint,
} from '../utils/utils.js';

const deployApp = async ({
  iexec,
  dockerNamespace = DOCKER_IMAGE_NAMESPACE,
  dockerRepository = DOCKER_IMAGE_REPOSITORY,
  dockerTag,
}: {
  iexec: IExec;
  dockerNamespace?: string;
  dockerRepository?: string;
  dockerTag: string;
}): Promise<string> => {
  const name = APP_NAME;
  const type = APP_TYPE;
  const checksum = await getDockerImageChecksum(
    dockerNamespace,
    dockerRepository,
    dockerTag
  );
  const fingerprint = await loadSconeFingerprint();
  const mrenclave = {
    framework: 'SCONE' as any, // workaround framework not auto capitalized
    version: 'v5',
    entrypoint: 'tsx /app/app.ts',
    heapSize: 1073741824,
    fingerprint: fingerprint,
  };
  const app = {
    owner: await iexec.wallet.getAddress(),
    name,
    type,
    multiaddr: `${dockerNamespace}/${dockerRepository}:${dockerTag}`,
    checksum,
    mrenclave,
  };
  console.log(`Deploying app:\n${JSON.stringify(app, undefined, 2)}`);
  const { address, txHash } = await iexec.app.deployApp(app);
  console.log(`Deployed app at ${address} (tx: ${txHash})`);
  return address;
};

export default deployApp;
