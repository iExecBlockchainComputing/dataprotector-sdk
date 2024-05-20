export * from './lib/types/index.js';
export { getWeb3Provider } from './utils/getWeb3Provider.js';
export * from './utils/index.js';

// -------------------------------------------------------
//For READ & WRITE
// -------------------------------------------------------
// umbrella
export { IExecDataProtector } from './lib/IExecDataProtector.js';

// submodules only
export { IExecDataProtectorSharing } from './lib/dataProtectorSharing/IExecDataProtectorSharing.js';
export { IExecDataProtectorCore } from './lib/dataProtectorCore/IExecDataProtectorCore.js';

// -------------------------------------------------------
//For READ only
// -------------------------------------------------------
// umbrella
export { IExecDataProtectorReader } from './lib/IExecDataProtectorReader.js';

// submodules only
export { IExecDataProtectorSharingReader } from './lib/dataProtectorSharing/IExecDataProtectorSharingReader.js';
export { IExecDataProtectorCoreReader } from './lib/dataProtectorCore/IExecDataProtectorCoreReader.js';
