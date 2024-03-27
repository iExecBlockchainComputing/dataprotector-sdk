import { Eip1193Provider } from 'ethers';
import { EnhancedWallet } from 'iexec';
import { IExecDataProtectorCore } from './dataProtectorCore/IExecDataProtectorCore.js';
import { IExecDataProtectorSharing } from './dataProtectorSharing/IExecDataProtectorSharing.js';
import { IExecDataProtectorModule } from './IExecDataProtectorModule.js';
import type { DataProtectorConfigOptions } from './types/commonTypes.js';

class IExecDataProtector extends IExecDataProtectorModule {
  public core: IExecDataProtectorCore;

  public sharing: IExecDataProtectorSharing;

  constructor(
    ethProvider: Eip1193Provider | EnhancedWallet,
    options?: DataProtectorConfigOptions
  ) {
    super(ethProvider, options);

    this.core = new IExecDataProtectorCore(ethProvider, options);
    this.sharing = new IExecDataProtectorSharing(ethProvider, options);
  }
}

export { IExecDataProtector };
