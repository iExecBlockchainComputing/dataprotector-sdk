import { readFileSync } from 'fs';

//hosting url
export const HOST =
  process.env.ENV === 'bubble'
    ? 'http://chain.wp-throughput.az1.internal:8545'
    : 'https://bellecour.iex.ec';

export const CHAIN_CONFIG = {
  prod: {
    hubAddress: '0x3eca1B216A7DF1C7689aEb259fFB83ADFB894E7f',
    ensRegistryAddress: '0x5f5B93fca68c9C79318d1F3868A354EE67D8c006',
    ensPublicResolverAddress: '0x1347d8a1840A810B990d0B774A6b7Bb8A1bd62BB',
    resultProxyURL: 'https://result.prod.iex.ec',
    ipfsGatewayURL: 'https://ipfs-gateway.v8-bellecour.iex.ec',
    iexecGatewayURL: 'https://api.market.prod.iex.ec',
    smsURL: 'https://sms.scone-prod.v8-bellecour.iex.ec',
  },
  staging: {
    hubAddress: '0x3eca1B216A7DF1C7689aEb259fFB83ADFB894E7f',
    ensRegistryAddress: '0x5f5B93fca68c9C79318d1F3868A354EE67D8c006',
    ensPublicResolverAddress: '0x1347d8a1840A810B990d0B774A6b7Bb8A1bd62BB',
    resultProxyURL: 'https://result.stagingv8.iex.ec',
    ipfsGatewayURL: 'https://ipfs-gateway.stagingv8.iex.ec',
    iexecGatewayURL: 'https://api.market.stagingv8.iex.ec',
    smsURL: 'https://sms.scone-prod.stagingv8.iex.ec',
  },
  bubble: {
    hubAddress: '0xc4b11f41746D3Ad8504da5B383E1aB9aa969AbC7',
    ensRegistryAddress: '0x9d4454B023096f34B160D6B654540c56A1F81688',
    ensPublicResolverAddress: '0x5eb3Bc0a489C5A8288765d2336659EbCA68FCd00',
    resultProxyURL: 'http://result.wp-throughput.az1.internal:13200',
    ipfsGatewayURL: 'http://result.wp-throughput.az1.internal:8080',
    iexecGatewayURL: 'http://market.wp-throughput.az1.internal:3000',
    smsURL: 'http://teeservices.wp-throughput.az1.internal:13300',
  },
};

//deployment parameters
export const APP_NAME = 'protected-data-delivery-dapp';
export const APP_TYPE = 'DOCKER';
export const FRAMEWORK = 'scone';

//publish sell order parameters
export const DEFAULT_APP_PRICE = 0;
export const DEFAULT_APP_VOLUME = 1000000;
export const APP_TAG = ['tee', 'scone'];

//scone image
export const SCONIFIER_VERSION = '5.7.5-v12';
const dappVersion = JSON.parse(
  readFileSync('../package.json', 'utf-8')
).version;

// docker
export const DOCKER_IMAGE_NAMESPACE = 'iexechub';
export const DOCKER_IMAGE_REPOSITORY = 'protected-data-delivery-dapp';

export const DOCKER_IMAGE_NON_TEE_PROD_TAG = `${dappVersion}`;
export const DOCKER_IMAGE_NON_TEE_STAGING_TAG = `staging-${process.env.DRONE_COMMIT}`;
export const DOCKER_IMAGE_NON_TEE_BUBBLE_TAG = `bubble-${process.env.DRONE_COMMIT}`;

// export const DOCKER_IMAGE_NON_TEE_DEV_TAG = `dev-${process.env.DRONE_COMMIT}`;

export const DOCKER_IMAGE_TEE_PROD_TAG = `${DOCKER_IMAGE_NON_TEE_PROD_TAG}-sconify-${SCONIFIER_VERSION}-production`;
export const DOCKER_IMAGE_TEE_BUBBLE_TAG = `${DOCKER_IMAGE_NON_TEE_PROD_TAG}-sconify-${SCONIFIER_VERSION}-production`; // TODO replace by `${DOCKER_IMAGE_NON_TEE_BUBBLE_TAG}-sconify-${SCONIFIER_VERSION}-production`;
export const DOCKER_IMAGE_TEE_STAGING_TAG = `${DOCKER_IMAGE_NON_TEE_STAGING_TAG}-sconify-${SCONIFIER_VERSION}-production`;
// export const DOCKER_IMAGE_TEE_DEV_TAG = `${DOCKER_IMAGE_NON_TEE_DEV_TAG}-sconify-${SCONIFIER_VERSION}-production`;

// CI files
export const APP_ADDRESS_FILE = '.app-address';
export const APP_WHITELIST_ADDRESS_FILE = '.app-whitelist-address';
