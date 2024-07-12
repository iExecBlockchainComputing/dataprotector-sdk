import { Contract } from 'ethers';
import { Address, IExecModule } from 'iexec';
import { ABI as VOUCHER_ABI } from '../../../../generated/abis/sharing/interfaces/IVoucher.sol/IVoucher.js';
import { ABI as VOUCHER_HUB_ABI } from '../../../../generated/abis/sharing/interfaces/IVoucherHub.sol/IVoucherHub.js';
import type {
  IVoucherHub,
  IVoucher,
} from '../../../../generated/typechain/index.js';

export const getVoucherHubContract = async (
  iexec: IExecModule,
  voucherHubAddress: Address
): Promise<IVoucherHub> => {
  const { signer } = await iexec.config.resolveContractsClient();

  return new Contract(voucherHubAddress, VOUCHER_HUB_ABI).connect(
    signer
  ) as IVoucherHub;
};

export const getVoucherContract = async (
  iexec: IExecModule,
  userAddress: Address
): Promise<IVoucher> => {
  const { signer } = await iexec.config.resolveContractsClient();
  const voucherInfo = await iexec.voucher.showUserVoucher(userAddress);
  return new Contract(voucherInfo.address, VOUCHER_ABI).connect(
    signer
  ) as IVoucher;
};
