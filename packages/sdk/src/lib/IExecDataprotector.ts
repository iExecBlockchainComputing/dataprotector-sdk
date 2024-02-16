import { DataProtector } from './dataprotector/DataProtector.js';
import { DataProtectorSharing } from './dataProtectorSharing/DataProtectorSharing.js';
import { IExecDataProtectorModule } from './IExecDataProtectorModule.js';

class IExecDataprotector extends IExecDataProtectorModule {
  private dataProtector: DataProtector;

  private dataProtectorSharing: DataProtectorSharing;

  constructor(args) {
    super(args);

    this.dataProtector = DataProtector(args);
    this.dataProtectorSharing = DataProtectorSharing(args);
  }
}

export { IExecDataprotector };
