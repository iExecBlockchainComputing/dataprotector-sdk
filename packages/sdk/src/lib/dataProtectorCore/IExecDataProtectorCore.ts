import { isValidProvider } from '../../utils/validators.js';
import { IExecDataProtectorModule } from '../IExecDataProtectorModule.js';
import {
  GetGrantedAccessParams,
  GetProtectedDataParams,
  GrantAccessParams,
  GrantedAccess,
  GrantedAccessResponse,
  ProcessProtectedDataParams,
  ProcessProtectedDataResponse,
  ProtectDataParams,
  ProtectedData,
  GetResultFromCompletedTaskParams,
  GetResultFromCompletedTaskResponse,
  ProtectedDataWithSecretProps,
  RevokeAllAccessParams,
  RevokedAccess,
  TransferParams,
  TransferResponse,
} from '../types/index.js';
import { getGrantedAccess } from './getGrantedAccess.js';
import { getProtectedData } from './getProtectedData.js';
import { getResultFromCompletedTask } from './getResultFromCompletedTask.js';
import { grantAccess } from './grantAccess.js';
import { processProtectedData } from './processProtectedData.js';
import { protectData } from './protectData.js';
import { revokeAllAccess } from './revokeAllAccess.js';
import { revokeOneAccess } from './revokeOneAccess.js';
import { transferOwnership } from './transferOwnership.js';

class IExecDataProtectorCore extends IExecDataProtectorModule {
  async protectData(
    args: ProtectDataParams
  ): Promise<ProtectedDataWithSecretProps> {
    await this.init();
    await isValidProvider(this.iexec);
    return protectData({
      ...args,
      dataprotectorContractAddress: this.dataprotectorContractAddress,
      ipfsNode: this.ipfsNode,
      ipfsGateway: this.ipfsGateway,
      arweaveUploadApi: this.arweaveUploadApi,
      iexec: this.iexec,
      iexecDebug: this.iexecDebug,
    });
  }

  async grantAccess(args: GrantAccessParams): Promise<GrantedAccess> {
    await this.init();
    await isValidProvider(this.iexec);
    return grantAccess({ ...args, iexec: this.iexec });
  }

  async revokeOneAccess(args: GrantedAccess): Promise<RevokedAccess> {
    await this.init();
    await isValidProvider(this.iexec);
    return revokeOneAccess({ ...args, iexec: this.iexec });
  }

  async revokeAllAccess(args: RevokeAllAccessParams): Promise<RevokedAccess[]> {
    await this.init();
    await isValidProvider(this.iexec);
    return revokeAllAccess({ ...args, iexec: this.iexec });
  }

  async transferOwnership(args: TransferParams): Promise<TransferResponse> {
    await this.init();
    await isValidProvider(this.iexec);
    return transferOwnership({ ...args, iexec: this.iexec });
  }

  async processProtectedData(
    args: ProcessProtectedDataParams
  ): Promise<ProcessProtectedDataResponse> {
    await this.init();
    await isValidProvider(this.iexec);
    return processProtectedData({
      ...args,
      iexec: this.iexec,
      defaultWorkerpool: this.defaultWorkerpool,
    });
  }

  // ----- READ METHODS -----
  async getProtectedData(
    args?: GetProtectedDataParams
  ): Promise<ProtectedData[]> {
    await this.init();
    return getProtectedData({
      ...args,
      iexec: this.iexec,
      graphQLClient: this.graphQLClient,
    });
  }

  async getGrantedAccess(
    args: GetGrantedAccessParams
  ): Promise<GrantedAccessResponse> {
    await this.init();
    return getGrantedAccess({ ...args, iexec: this.iexec });
  }

  async getResultFromCompletedTask(
    args: GetResultFromCompletedTaskParams
  ): Promise<GetResultFromCompletedTaskResponse> {
    await this.init();
    await isValidProvider(this.iexec);
    return getResultFromCompletedTask({
      ...args,
      iexec: this.iexec,
    });
  }
}

export { IExecDataProtectorCore };
