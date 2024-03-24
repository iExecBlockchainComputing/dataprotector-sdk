import { WorkflowError } from '../../utils/errors.js';
import { resolveENS } from '../../utils/resolveENS.js';
import { addressOrEnsSchema, throwIfMissing } from '../../utils/validators.js';
import { GetUserAppWhitelistGraphQLResponse } from '../types/graphQLTypes.js';
import { IExecConsumer, SubgraphConsumer } from '../types/internalTypes.js';
import {
  GetUserAppWhitelistParams,
  GetUserAppWhitelistResponse,
} from '../types/sharingTypes.js';
import { getUserAppWhitelistQuery } from './subgraph/getUserAppWhitelistQuery.js';

export const getUserAppWhitelist = async ({
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
    const getUserAppWhitelistQueryResponse: GetUserAppWhitelistGraphQLResponse =
      await getUserAppWhitelistQuery({
        graphQLClient,
        user: vUser,
      });

    const appWhitelists = getUserAppWhitelistQueryResponse.appWhitelists.map(
      (appWhitelist) => ({
        address: appWhitelist.id,
        owner: appWhitelist.owner,
        app: appWhitelist.app.map((app) => ({
          address: app.id,
        })),
      })
    );

    return {
      appWhitelists,
    };
  } catch (e) {
    console.log(e);
    throw new WorkflowError(
      'Failed to get user app appWhitelist information',
      e
    );
  }
};
