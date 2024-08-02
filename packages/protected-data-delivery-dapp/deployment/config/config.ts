import { readFileSync } from 'fs';

//hosting url
export const HOST =
  process.env.ENV === 'bubble'
    ? 'http://chain.wp-throughput.az1.internal:8545'
    : 'https://bellecour.iex.ec';

export const iexecOptions = {
  isNative: true,
  useGas: false,
  hubAddress: '0xc4b11f41746D3Ad8504da5B383E1aB9aa969AbC7',
  ensRegistryAddress: '0x9d4454B023096f34B160D6B654540c56A1F81688',
  resultProxyURL: 'http://result.wp-throughput.az1.internal:13200',
  ipfsGatewayURL: 'http://result.wp-throughput.az1.internal:8080',
  iexecGatewayURL: 'http://market.wp-throughput.az1.internal:3000',
  smsURL: 'http://teeservices.wp-throughput.az1.internal:13300',
  bridgedNetworkConf: {
    chainId: '65535',
    rpcURL: 'http://chain.wp-throughput.az1.internal:8545',
  },
};
// TODO: dynamically fetch the checksum for the scone docker image used in the bubble environment
export const sconeVerifiedBubbleImageChecksum =
  '0xc6605e669aa48e5b5fc70c50ff1c42c725a8141bbb493d12162bd6e2344cacfb';

//deployment parameters
export const APP_NAME = 'protected-data-delivery-dapp';
export const APP_TYPE = 'DOCKER';
export const FRAMEWORK = 'scone';

//publish sell order parameters
export const DEFAULT_APP_PRICE = 0;
export const DEFAULT_APP_VOLUME = 1000000;
export const APP_TAG = ['tee', 'scone'];

//scone image
export const SCONIFIER_VERSION = '5.7.6';
const dappVersion = JSON.parse(
  readFileSync('../package.json', 'utf-8')
).version;

// docker
export const DOCKER_IMAGE_NAMESPACE =
  process.env.ENV === 'bubble'
    ? 'https://docker-regis-adm.iex.ec/repository/docker-private/v2/product/'
    : 'https://hub.docker.com/v2/namespaces/iexechub/repositories';
export const DOCKER_IMAGE_REPOSITORY =
  process.env.ENV === 'bubble'
    ? 'protected-data-delivery-dapp-unlocked'
    : 'protected-data-delivery-dapp';

export const DOCKER_IMAGE_NON_TEE_PROD_TAG = `${dappVersion}`;
export const DOCKER_IMAGE_NON_TEE_STAGING_TAG = `staging-${process.env.DRONE_COMMIT}`;
// export const DOCKER_IMAGE_NON_TEE_DEV_TAG = `dev-${process.env.DRONE_COMMIT}`;

export const DOCKER_IMAGE_TEE_PROD_TAG = `${DOCKER_IMAGE_NON_TEE_PROD_TAG}-sconify-${SCONIFIER_VERSION}-production`;
export const DOCKER_IMAGE_TEE_STAGING_TAG = `${DOCKER_IMAGE_NON_TEE_STAGING_TAG}-sconify-${SCONIFIER_VERSION}-production`;
export const DOCKER_IMAGE_TEE_BUBBLE_TAG = `${DOCKER_IMAGE_NON_TEE_PROD_TAG}-sconify-${SCONIFIER_VERSION}-debug`;
// export const DOCKER_IMAGE_TEE_DEV_TAG = `${DOCKER_IMAGE_NON_TEE_DEV_TAG}-sconify-${SCONIFIER_VERSION}-production`;

// CI files
export const APP_ADDRESS_FILE = '.app-address';
export const APP_WHITELIST_ADDRESS_FILE = '.app-whitelist-address';
