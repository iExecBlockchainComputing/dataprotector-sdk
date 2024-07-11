import { Contract } from 'ethers';
import { throwIfMissing } from '../../../utils/validators.js';
import { Address } from 'iexec';
import { ABI } from './../../../../generated/abis/sharing/interfaces/IVoucherHub.sol/IVoucherHub.js';
export const getVoucherContract = (
  contracts: any = throwIfMissing(),
  voucherAddress: Address = throwIfMissing()
) => new Contract(voucherAddress, ABI, contracts.provider);
