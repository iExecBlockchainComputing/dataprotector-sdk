import { time } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import pkg from 'hardhat';
import { createWorkerpool, createWorkerpoolOrder } from '../../../scripts/singleFunction/workerpool.js';
import { addEligibleAssetToVoucherType, createVoucher, createVoucherType } from '../utils/voucher.utils.js';

const rpcURL = pkg.network.config.url;

export async function createVoucherWithWorkerpoolOrderSponsorable() {
  const { iexecWorkerpoolOwner, workerpoolAddress } = await createWorkerpool(rpcURL);
  const workerpoolOrder = await createWorkerpoolOrder({ iexecWorkerpoolOwner, workerpoolAddress, workerpoolprice: 1 });
  const voucherTypeId = await createVoucherType({ duration: 1_200 });
  await addEligibleAssetToVoucherType({ voucherTypeId, eligibleAsset: workerpoolAddress });
  const { voucherOwner, voucherAddress } = await createVoucher({ voucherTypeId, value: 1 });
  return {
    voucherOwner,
    workerpoolOrder,
    voucherAddress,
  };
}

export async function createVoucherWithWorkerpoolOrderTooExpensive() {
  const { iexecWorkerpoolOwner, workerpoolAddress } = await createWorkerpool(rpcURL);
  const workerpoolOrder = await createWorkerpoolOrder({ iexecWorkerpoolOwner, workerpoolAddress, workerpoolprice: 2 });
  const voucherTypeId = await createVoucherType({ duration: 1_200 });
  await addEligibleAssetToVoucherType({ voucherTypeId, eligibleAsset: workerpoolAddress });
  const { voucherOwner, voucherAddress } = await createVoucher({ voucherTypeId, value: 1 });
  return {
    voucherOwner,
    workerpoolOrder,
    voucherAddress,
  };
}

export async function createVoucherExpired() {
  const { iexecWorkerpoolOwner, workerpoolAddress } = await createWorkerpool(rpcURL);
  const workerpoolOrder = await createWorkerpoolOrder({ iexecWorkerpoolOwner, workerpoolAddress, workerpoolprice: 0 });
  const voucherDuration = 1_200;
  const voucherTypeId = await createVoucherType({ duration: voucherDuration });
  await addEligibleAssetToVoucherType({ voucherTypeId, eligibleAsset: workerpoolAddress });
  const { voucherOwner, voucherAddress } = await createVoucher({ voucherTypeId, value: 1 });
  await time.increase(voucherDuration);
  return {
    voucherOwner,
    workerpoolOrder,
    voucherAddress,
  };
}
