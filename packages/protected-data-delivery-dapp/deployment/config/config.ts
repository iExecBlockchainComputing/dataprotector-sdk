export const DEFAULT_SHARING_CONTRACT_ADDRESS =
  '0xeE60c6E6583D0ECc8087Ce6f1Edc7964fD4dB808'.toLowerCase();

//hosting url
export const HOST = 'https://bellecour.iex.ec';

//deployment parameters
export const APP_NAME = 'content-consumer-dev-test';
export const APP_TYPE = 'DOCKER';
export const FRAMEWORK = 'scone';

//publish sell order parameters
export const DEFAULT_APP_PRICE = 0;
export const DEFAULT_APP_VOLUME = 1000000;
export const APP_TAG = ['tee', 'scone'];

//ENS name
export const SUBDOMAIN_DEV = 'content-consumer-dev-test';
export const SUBDOMAIN_PROD = 'protected-data-delivery';
export const IEXEC_ENS_DOMAINE = 'apps.iexec.eth';

export const DAPP_ENS_NAME_DEV = `${SUBDOMAIN_DEV}.${IEXEC_ENS_DOMAINE}`;
export const DAPP_ENS_NAME_PROD = `${SUBDOMAIN_PROD}.${IEXEC_ENS_DOMAINE}`;

//const SCONIFIER_VERSION = '5.7.5-v14';

export const DOCKER_IMAGE_NAMESPACE = 'iexechub';
export const DOCKER_IMAGE_REPOSITORY = 'content-creator-dapp';
//export const DOCKER_IMAGE_DEV_TAG = `dev-${process.env.DRONE_COMMIT}-sconify-${SCONIFIER_VERSION}-dev`;
export const DOCKER_IMAGE_DEV_TAG = `0.0.0-sconify-5.7.5-v12-production`;
export const DOCKER_IMAGE_PROD_TAG = ``;

//drone target
export const DRONE_TARGET_DEPLOY_DEV = 'deploy-dapp-dev';
export const DRONE_TARGET_DEPLOY_PROD = 'deploy-dapp-prod';
export const DRONE_TARGET_DEPLOY_APP_WHITELIST_DEV = 'deploy-app-whitelist-dev';
export const DRONE_TARGET_DEPLOY_APP_WHITELIST_PROD =
  'deploy-app-whitelist-prod';

// CI files
export const APP_ADDRESS_FILE = '.app-address';
export const APP_WHITELIST_ADDRESS_FILE = '.app-whitelist-address';
