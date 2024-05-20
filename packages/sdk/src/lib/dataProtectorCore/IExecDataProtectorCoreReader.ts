import { IExecDataProtectorModule } from '../IExecDataProtectorModule.js';
import {
  GetGrantedAccessParams,
  GetProtectedDataParams,
  GrantAccessParams,
  GrantedAccess,
  GrantedAccessResponse,
  ProtectedData,
} from '../types/index.js';
import { getGrantedAccess } from './getGrantedAccess.js';
import { getProtectedData } from './getProtectedData.js';
import { grantAccess } from './grantAccess.js';

class IExecDataProtectorCoreReader extends IExecDataProtectorModule {
  grantAccess(args: GrantAccessParams): Promise<GrantedAccess> {
    return grantAccess({ ...args, iexec: this.iexec });
  }

  getGrantedAccess(
    args: GetGrantedAccessParams
  ): Promise<GrantedAccessResponse> {
    return getGrantedAccess({ ...args, iexec: this.iexec });
  }

  getProtectedData(args?: GetProtectedDataParams): Promise<ProtectedData[]> {
    return getProtectedData({
      ...args,
      iexec: this.iexec,
      graphQLClient: this.graphQLClient,
    });
  }
}

export { IExecDataProtectorCoreReader };
