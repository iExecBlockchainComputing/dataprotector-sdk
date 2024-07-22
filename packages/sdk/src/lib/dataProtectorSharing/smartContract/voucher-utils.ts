import { Contract } from 'ethers';
import { throwIfMissing } from '../../../utils/validators.js';
import { Address } from 'iexec';
import { ABI as VOUCHER_HUB_ABI } from '../../../../generated/abis/sharing/interfaces/IVoucherHub.sol/IVoucherHub.js';
import { ABI as VOUCHER_ABI } from '../../../../generated/abis/sharing/interfaces/IVoucher.sol/IVoucher.js';

export const getVoucherHubContract = (
  contracts: any = throwIfMissing(),
  voucherHubAddress: Address = throwIfMissing()
) => {
  return new Contract(voucherHubAddress, VOUCHER_HUB_ABI, contracts.provider);
};

export const getVoucherContract = (
  contracts: any = throwIfMissing(),
  voucherAddress: Address = throwIfMissing()
) => new Contract(voucherAddress, VOUCHER_ABI, contracts.provider);
