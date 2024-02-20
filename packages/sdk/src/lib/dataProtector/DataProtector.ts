import { IExecDataProtectorModule } from '../IExecDataProtectorModule.js';
import {
  FetchGrantedAccessParams,
  FetchProtectedDataParams,
  GrantAccessParams,
  GrantedAccess,
  GrantedAccessResponse,
  ProcessProtectedDataParams,
  ProtectDataParams,
  ProtectedData,
  ProtectedDataWithSecretProps,
  RevokeAllAccessParams,
  RevokedAccess,
  Taskid,
  TransferParams,
  TransferResponse,
} from '../types/index.js';
import { fetchGrantedAccess } from './fetchGrantedAccess.js';
import { fetchProtectedData } from './fetchProtectedData.js';
import { grantAccess } from './grantAccess.js';
import { processProtectedData } from './processProtectedData.js';
import { protectData } from './protectData.js';
import { revokeAllAccess } from './revokeAllAccess.js';
import { revokeOneAccess } from './revokeOneAccess.js';
import { transferOwnership } from './transferOwnership.js';

class DataProtector extends IExecDataProtectorModule {
  protectData(args: ProtectDataParams): Promise<ProtectedDataWithSecretProps> {
    return protectData({
      ...args,
      contractAddress: this.contractAddress,
      ipfsNode: this.ipfsNode,
      ipfsGateway: this.ipfsGateway,
      iexec: this.iexec,
    });
  }

  grantAccess(args: GrantAccessParams): Promise<GrantedAccess> {
    return grantAccess({ ...args, iexec: this.iexec });
  }

  fetchGrantedAccess(
    args: FetchGrantedAccessParams
  ): Promise<GrantedAccessResponse> {
    return fetchGrantedAccess({ ...args, iexec: this.iexec });
  }

  revokeAllAccess(args: RevokeAllAccessParams): Promise<{ success: true }> {
    return revokeAllAccess({ ...args, iexec: this.iexec });
  }

  revokeOneAccess(args: GrantedAccess): Promise<RevokedAccess> {
    return revokeOneAccess({ ...args, iexec: this.iexec });
  }

  fetchProtectedData(
    args?: FetchProtectedDataParams
  ): Promise<ProtectedData[]> {
    return fetchProtectedData({
      ...args,
      iexec: this.iexec,
      graphQLClient: this.graphQLClient,
    });
  }

  transferOwnership(args: TransferParams): Promise<TransferResponse> {
    return transferOwnership({ ...args, iexec: this.iexec });
  }

  processProtectedData = (args: ProcessProtectedDataParams): Promise<Taskid> =>
    processProtectedData({
      ...args,
      iexec: this.iexec,
    });
}

export { DataProtector };
