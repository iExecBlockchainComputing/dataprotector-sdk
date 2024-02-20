import { Eip1193Provider } from 'ethers';
import { EnhancedWallet } from 'iexec';
import { DataProtector } from './dataProtector/DataProtector.js';
import { DataProtectorSharing } from './dataProtectorSharing/DataProtectorSharing.js';
import { IExecDataProtectorModule } from './IExecDataProtectorModule.js';
import { DataProtectorConfigOptions } from './types/dataProtectorTypes.js';

class IExecDataProtector extends IExecDataProtectorModule {
  public dataProtector: DataProtector;

  public dataProtectorSharing: DataProtectorSharing;

  constructor(
    ethProvider: Eip1193Provider | EnhancedWallet,
    options?: DataProtectorConfigOptions
  ) {
    super(ethProvider, options);

    this.dataProtector = new DataProtector(ethProvider, options);
    this.dataProtectorSharing = new DataProtectorSharing(ethProvider, options);
  }
}

export { IExecDataProtector };
