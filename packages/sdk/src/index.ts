export * from './lib/types/index.js';
export { getWeb3Provider } from './utils/getWeb3Provider.js';
export { WorkflowError } from './utils/errors.js';

// umbrella
export { IExecDataProtectorCore } from './lib/dataProtectorCore/IExecDataProtectorCore.js';

// submodules only
export { IExecDataProtectorSharing } from './lib/dataProtectorSharing/IExecDataProtectorSharing.js';
export { IExecDataProtector } from './lib/IExecDataprotector.js';
