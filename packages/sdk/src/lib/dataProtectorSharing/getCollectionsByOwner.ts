import { WorkflowError } from '../../utils/errors.js';
import {
  addressSchema,
  booleanSchema,
  throwIfMissing,
} from '../../utils/validators.js';
import {
  GetCollectionsByOwnerResponse,
  GetCollectionsByOwnerParams,
} from '../types/index.js';
import { SubgraphConsumer } from '../types/internalTypes.js';
import { getCollectionsByOwnerQuery } from './subgraph/getCollectionsByOwnerQuery.js';

export async function getCollectionsByOwner({
  graphQLClient = throwIfMissing(),
  owner,
  includeHiddenProtectedDatas = false,
}: SubgraphConsumer &
  GetCollectionsByOwnerParams): Promise<GetCollectionsByOwnerResponse> {
  try {
    const vOwner = addressSchema()
      .required()
      .label('owner')
      .validateSync(owner);

    const vIncludeHiddenProtectedDatas = booleanSchema()
      .required()
      .label('includeHiddenProtectedDatas')
      .validateSync(includeHiddenProtectedDatas);

    return await getCollectionsByOwnerQuery({
      graphQLClient,
      owner: vOwner,
      includeHiddenProtectedDatas: vIncludeHiddenProtectedDatas,
    });
  } catch (e) {
    console.log('[getCollectionsByOwner] ERROR', e);
    throw new WorkflowError({
      message: 'Failed to get collections by owner',
      errorCause: e,
    });
  }
}
