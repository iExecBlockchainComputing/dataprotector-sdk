export const DEFAULT_SHARING_CONTRACT_ADDRESS =
  '0xeE60c6E6583D0ECc8087Ce6f1Edc7964fD4dB808'.toLowerCase();

//hosting url
export const HOST = 'https://bellecour.iex.ec';

//deployment parameters
export const APP_NAME = 'test-content-creator-delivery-dapp';
export const APP_TYPE = 'DOCKER';
export const FRAMEWORK = 'scone';

//publish sell order parameters
export const DEFAULT_APP_PRICE = 0;
export const DEFAULT_APP_VOLUME = 1000000;
export const APP_TAG = ['tee', 'scone'];

//ENS name
export const SUBDOMAIN_DEV = 'test-content-creator-delivery-dev';
export const SUBDOMAIN_PROD = 'protected-data-delivery';
export const IEXEC_ENS_DOMAINE = 'apps.iexec.eth';

export const DAPP_ENS_NAME_DEV = `${SUBDOMAIN_DEV}.${IEXEC_ENS_DOMAINE}`;
export const DAPP_ENS_NAME_PROD = `${SUBDOMAIN_PROD}.${IEXEC_ENS_DOMAINE}`;

//scone image
//const SCONIFIER_VERSION = '5.7.5-v12';

//
//const dappVersion = JSON.parse(
//  readFileSync('../dapp/package.json', 'utf-8')
//).version;

export const DOCKER_IMAGE_NAMESPACE = 'iexechub';
export const DOCKER_IMAGE_REPOSITORY = 'content-creator-dapp';
//export const DOCKER_IMAGE_PROD_TAG = `${dappVersion}-sconify-${SCONIFIER_VERSION}-production`;
export const DOCKER_IMAGE_PROD_TAG = `dev-2c1faec111fabd9f5c2f99a3bb8d10a8011d805e-sconify-5.7.5-v12-debug`;

//export const DOCKER_IMAGE_DEV_TAG = `dev-${process.env.DRONE_COMMIT}-sconify-${SCONIFIER_VERSION}-production`;
export const DOCKER_IMAGE_DEV_TAG = `dev-2c1faec111fabd9f5c2f99a3bb8d10a8011d805e-sconify-5.7.5-v12-debug`;

//drone target
export const DRONE_TARGET_DEPLOY_DEV = 'deploy-dapp-dev';
export const DRONE_TARGET_DEPLOY_PROD = 'deploy-dapp-prod';
/*
export const DRONE_TARGET_APP_WHITELIST_DEPLOY_DEV =
  'create-dapp-whitelist-dev';
export const DRONE_TARGET_APP_WHITELIST_DEPLOY_PROD =
  'create-dapp-whitelist-prod';
export const DRONE_TARGET_SELL_ORDER_DEV = 'dapp-publish-sell-order-dev';
export const DRONE_TARGET_SELL_ORDER_PROD = 'dapp-publish-sell-order-prod';
export const DRONE_TARGET_REVOKE_SELL_ORDER_DEV = 'dapp-revoke-sell-order-dev';
export const DRONE_TARGET_REVOKE_SELL_ORDER_PROD =
  'dapp-revoke-sell-order-prod';
export const DRONE_TARGET_TRANSFER_OWNERSHIP_DEV =
  'dapp-transfer-ownership-dev';
export const DRONE_TARGET_TRANSFER_OWNERSHIP_PROD =
  'dapp-transfer-ownership-prod';
*/
// CI files
export const APP_ADDRESS_FILE = '.app-address';
export const APP_WHITELIST_ADDRESS_FILE = '.app-whitelist-address';
