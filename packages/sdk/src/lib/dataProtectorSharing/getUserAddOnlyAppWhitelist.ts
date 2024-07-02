import { WorkflowError } from '../../utils/errors.js';
import { resolveENS } from '../../utils/resolveENS.js';
import { addressOrEnsSchema, throwIfMissing } from '../../utils/validators.js';
import { IExecConsumer, SubgraphConsumer } from '../types/internalTypes.js';
import {
  GetUserAppWhitelistParams,
  GetUserAppWhitelistResponse,
} from '../types/sharingTypes.js';
import { getUserAddOnlyAppWhitelistQuery } from './subgraph/getUserAddOnlyAppWhitelistQuery.js';

export const getUserAddOnlyAppWhitelist = async ({
  iexec = throwIfMissing(),
  graphQLClient = throwIfMissing(),
  user,
}: IExecConsumer &
  SubgraphConsumer &
  GetUserAppWhitelistParams): Promise<GetUserAppWhitelistResponse> => {
  let vUser = addressOrEnsSchema().label('userAddress').validateSync(user);
  if (vUser) {
    // ENS resolution if needed
    vUser = await resolveENS(iexec, vUser);
  } else {
    vUser = await iexec.wallet.getAddress();
    vUser = vUser.toLowerCase();
  }

  try {
    const getUserAppWhitelistQueryResponse =
      await getUserAddOnlyAppWhitelistQuery({
        graphQLClient,
        user: vUser,
      });

    const addOnlyAppWhitelists =
      getUserAppWhitelistQueryResponse.addOnlyAppWhitelists.map(
        (addOnlyAppWhitelist) => ({
          address: addOnlyAppWhitelist.id,
          owner: addOnlyAppWhitelist.owner.id,
          apps: addOnlyAppWhitelist.apps.map((app) => ({
            address: app.id,
          })),
        })
      );

    return {
      addOnlyAppWhitelists,
    };
  } catch (e) {
    throw new WorkflowError({
      message: 'Failed to get user addOnlyAppWhitelists information',
      errorCause: e,
    });
  }
};
