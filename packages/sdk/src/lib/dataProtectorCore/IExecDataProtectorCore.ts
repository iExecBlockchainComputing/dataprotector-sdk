import { IExecDataProtectorModule } from '../IExecDataProtectorModule.js';
import {
  GetGrantedAccessParams,
  GetProtectedDataParams,
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
import { getGrantedAccess } from './getGrantedAccess.js';
import { getProtectedData } from './getProtectedData.js';
import { grantAccess } from './grantAccess.js';
import { processProtectedData } from './processProtectedData.js';
import { protectData } from './protectData.js';
import { revokeAllAccess } from './revokeAllAccess.js';
import { revokeOneAccess } from './revokeOneAccess.js';
import { transferOwnership } from './transferOwnership.js';

class IExecDataProtectorCore extends IExecDataProtectorModule {
  protectData(args: ProtectDataParams): Promise<ProtectedDataWithSecretProps> {
    return protectData({
      ...args,
      dataprotectorContractAddress: this.dataprotectorContractAddress,
      ipfsNode: this.ipfsNode,
      ipfsGateway: this.ipfsGateway,
      iexec: this.iexec,
    });
  }

  grantAccess(args: GrantAccessParams): Promise<GrantedAccess> {
    return grantAccess({ ...args, iexec: this.iexec });
  }

  getGrantedAccess(
    args: GetGrantedAccessParams
  ): Promise<GrantedAccessResponse> {
    return getGrantedAccess({ ...args, iexec: this.iexec });
  }

  revokeAllAccess(args: RevokeAllAccessParams): Promise<RevokedAccess[]> {
    return revokeAllAccess({ ...args, iexec: this.iexec });
  }

  revokeOneAccess(args: GrantedAccess): Promise<RevokedAccess> {
    return revokeOneAccess({ ...args, iexec: this.iexec });
  }

  getProtectedData(args?: GetProtectedDataParams): Promise<ProtectedData[]> {
    return getProtectedData({
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

export { IExecDataProtectorCore };
