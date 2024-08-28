import { AbstractProvider, AbstractSigner, Eip1193Provider } from 'ethers';
import { IExecDataProtectorCore } from './dataProtectorCore/IExecDataProtectorCore.js';
import { IExecDataProtectorSharing } from './dataProtectorSharing/IExecDataProtectorSharing.js';
import { IExecDataProtectorModule } from './IExecDataProtectorModule.js';
import type {
  DataProtectorConfigOptions,
  Web3SignerProvider,
} from './types/commonTypes.js';

class IExecDataProtector extends IExecDataProtectorModule {
  public core: IExecDataProtectorCore;

  public sharing: IExecDataProtectorSharing;

  constructor(
    ethProvider?:
      | AbstractProvider
      | AbstractSigner
      | Eip1193Provider
      | Web3SignerProvider
      | string,
    options?: DataProtectorConfigOptions
  ) {
    super(ethProvider, options);

    this.core = new IExecDataProtectorCore(ethProvider, options);
    this.sharing = new IExecDataProtectorSharing(ethProvider, options);
  }
}

export { IExecDataProtector };
