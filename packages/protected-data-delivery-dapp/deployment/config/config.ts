import { readFileSync } from 'fs';

//hosting url
export const HOST = 'https://bellecour.iex.ec';

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
const dappVersion = JSON.parse(readFileSync('../package.json', 'utf-8')).version;

// docker
export const DOCKER_IMAGE_NAMESPACE = 'iexechub';
export const DOCKER_IMAGE_REPOSITORY = 'protected-data-delivery-dapp';

export const DOCKER_IMAGE_NON_TEE_PROD_TAG = `${dappVersion}`;
export const DOCKER_IMAGE_NON_TEE_STAGING_TAG = `staging-${process.env.DRONE_COMMIT}`;
// export const DOCKER_IMAGE_NON_TEE_DEV_TAG = `dev-${process.env.DRONE_COMMIT}`;

export const DOCKER_IMAGE_TEE_PROD_TAG = `${DOCKER_IMAGE_NON_TEE_PROD_TAG}-sconify-${SCONIFIER_VERSION}-production`;
export const DOCKER_IMAGE_TEE_STAGING_TAG = `${DOCKER_IMAGE_NON_TEE_STAGING_TAG}-sconify-${SCONIFIER_VERSION}-production`;
// export const DOCKER_IMAGE_TEE_DEV_TAG = `${DOCKER_IMAGE_NON_TEE_DEV_TAG}-sconify-${SCONIFIER_VERSION}-production`;

// CI files
export const APP_ADDRESS_FILE = '.app-address';
export const APP_WHITELIST_ADDRESS_FILE = '.app-whitelist-address';
