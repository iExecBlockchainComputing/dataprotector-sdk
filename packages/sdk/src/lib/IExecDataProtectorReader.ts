import { IExecDataProtectorCoreReader } from './dataProtectorCore/IExecDataProtectorCoreReader.js';
import { IExecDataProtectorSharingReader } from './dataProtectorSharing/IExecDataProtectorSharingReader.js';
import { IExecDataProtectorModule } from './IExecDataProtectorModule.js';
import type { DataProtectorConfigOptions } from './types/commonTypes.js';

class IExecDataProtectorReader extends IExecDataProtectorModule {
  public core: IExecDataProtectorCoreReader;

  public sharing: IExecDataProtectorSharingReader;

  constructor(options?: DataProtectorConfigOptions) {
    super(ethProvider, options);

    this.core = new IExecDataProtectorCoreReader(ethProvider, options);
    this.sharing = new IExecDataProtectorSharingReader(ethProvider, options);
  }
}

export { IExecDataProtectorReader };
