# Promote

Deployments are triggered via `promote` actions.

In this project, promote targets follow the naming convention `<package>-<action>-<environment>`.

## Targets

### smart-contract

#### smart-contract-deploy-dev

deploy and verify the DataProtector contract with the dev deployer

#### smart-contract-deploy-staging

deploy and verify the DataProtector contract with the dev deployer and commit the staging environment update

**impacts:**

- staging subgraph must be redeployed [subgraph-deploy-staging](#subgraph-deploy-staging)
- staging env will change
- staging protected data will be lost

#### smart-contract-deploy-prod

deploy and verify the DataProtector contract with the prod deployer and commit the prod environment update

**impacts:**

- prod subgraph must be redeployed [subgraph-deploy-prod](#subgraph-deploy-prod)
- prod env will change
- prod protected data will be lost

### sharing-smart-contract

#### sharing-smart-contract-deploy-dev

deploy and verify the AddOnlyAppWhitelistRegistry and DataProtectorSharing contracts with the dev deployer

#### sharing-smart-contract-deploy-staging

deploy and verify the AddOnlyAppWhitelistRegistry and DataProtectorSharing contracts with the dev deployer, configure DataProtectorSharing for staging and commit the staging environment update

**impacts:**

- staging subgraph must be redeployed [subgraph-deploy-staging](#subgraph-deploy-staging)
- staging env will change
- staging collections will be lost

#### sharing-smart-contract-deploy-prod

deploy and verify the AddOnlyAppWhitelistRegistry and DataProtectorSharing contracts with the prod deployer and commit the prod environment update

**impacts:**

- prod subgraph must be redeployed [subgraph-deploy-prod](#subgraph-deploy-prod)
- prod env will change
- prod collections will be lost

#### sharing-smart-contract-upgrade-staging

upgrade the staging DataProtectorSharing contract with the new implementation

**impacts:**

- staging DataProtectorSharing implementation will change

#### sharing-smart-contract-upgrade-prod (disabled)

upgrade the staging DataProtectorSharing contract with the new implementation

**impacts:**

- prod DataProtectorSharing implementation will change

#### sharing-smart-contract-update-env-staging

configure the staging DataProtectorSharing contract to use the staging environment

#### sharing-smart-contract-update-env-prod

configure the prod DataProtectorSharing contract to use the prod environment

### subgraph

#### subgraph-deploy-dev

deploy the dataprotector subgraph

#### subgraph-deploy-staging

deploy the dataprotector subgraph for the staging environment

**impacts:**

- query the staging subgraph will return an outdated state until full synchronization

#### subgraph-deploy-prod

deploy the dataprotector subgraph for the prod environment

**impacts:**

- query the prod subgraph will return an outdated state until full synchronization

### sdk

#### sdk-publish-beta

publish the package @iexec/dataprotector on npm with the tag beta (require sdk version to be [version]-beta.[b])

#### sdk-publish-latest

publish the package @iexec/dataprotector on npm with the tag latest

#### sdk-deprecate-package

deprecates a version of @iexec/dataprotector

#### sdk-undeprecate-package

remove the deprecation of a version of @iexec/dataprotector

### dataprotector-deserializer

#### dataprotector-deserializer-publish-nightly

publish the package @iexec/dataprotector-deserializer on npm with the tag nightly

#### dataprotector-deserializer-publish-latest

publish the package @iexec/dataprotector-deserializer on npm with the tag latest

### protected-data-delivery-dapp

#### protected-data-delivery-dapp-deploy-app-whitelist-staging

deploy a whitelist for the protected-data-delivery-dapp on the staging env

**impacts:**

- staging env will change
- dapp must be added to the whitelist

#### protected-data-delivery-dapp-deploy-app-whitelist-prod

deploy a whitelist for the protected-data-delivery-dapp on the prod env

**impacts:**

- prod env will change
- dapp must be added to the whitelist

#### protected-data-delivery-dapp-docker-non-tee-dev

build the protected-data-delivery-dapp non-tee docker image for dev

#### protected-data-delivery-dapp-docker-non-tee-staging

build the protected-data-delivery-dapp non-tee docker image for staging

#### protected-data-delivery-dapp-docker-non-tee-prod

build the protected-data-delivery-dapp non-tee docker image for prod

#### protected-data-delivery-dapp-deploy-staging

deploy the tee protected-data-delivery-dapp add it to the staging app whitelist and register the ENS for staging environment

**promote params:**

- `DOCKER_IMAGE_TAG` (optional): deploy from an existing sconified image (ex: `staging-0ae6997bc7443eca30dd888003efc2ecd8cf2e20-sconify-5.7.5-v12-production`, default use the commit)

**impacts:**

- staging env will change
- ENS will move to the new app

#### protected-data-delivery-dapp-deploy-prod

deploy the tee protected-data-delivery-dapp add it to the prod app whitelist and register the ENS for prod environment

**impacts:**

- prod env will change
- ENS will move to the new app
