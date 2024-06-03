import { IExec } from 'iexec';
import { ValidationError } from 'yup';
import { isEnsTest } from './validators.js';

export const resolveENS = async (
  iexec: IExec,
  address: string | undefined
): Promise<string | undefined> => {
  if (address && isEnsTest(address)) {
    const resolved = await iexec.ens.resolveName(address);
    if (!resolved) {
      throw new ValidationError(`ENS name is not valid: ${address}`);
    }
    return resolved.toLowerCase();
  }
  return address;
};
