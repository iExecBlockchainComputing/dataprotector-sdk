import pkg from 'hardhat';
import { POCO_ADDRESS } from '../../../config/config.js';
import { VOUCHER_HUB_ADDRESS } from '../../bellecour-fork/voucher-config.js';
import { getEventFromLogs } from './utils.js';

const { ethers } = pkg;

// Default Wallet (the first one) is the Admin of the voucherHub
export async function createVoucherType({ duration }) {
  const voucherHubContract = await ethers.getContractAt('IVoucherHub', VOUCHER_HUB_ADDRESS);
  // Create VoucherType
  const txCreateVoucherType = await voucherHubContract.createVoucherType('Test Voucher type', duration);
  const transactionReceiptVoucherType = await txCreateVoucherType.wait();
  const voucherTypeIdEvent = getEventFromLogs('VoucherTypeCreated', transactionReceiptVoucherType.logs, {
    strict: true,
  });
  const voucherTypeId = voucherTypeIdEvent.args?.id;
  return voucherTypeId;
}

export async function addEligibleAssetToVoucherType({ voucherTypeId, eligibleAsset }) {
  const voucherHubContract = await ethers.getContractAt('IVoucherHub', VOUCHER_HUB_ADDRESS);
  const txAddEligibleAsset = await voucherHubContract.addEligibleAsset(voucherTypeId, eligibleAsset);
  await txAddEligibleAsset.wait();
}

export async function createVoucher({ voucherTypeId, value }) {
  const [owner] = await ethers.getSigners();

  // Need a random signer with funds because only one voucher can be minted by user
  const voucherOwner = ethers.Wallet.createRandom(ethers.provider);
  const tx = await owner.sendTransaction({
    to: voucherOwner.address,
    value: ethers.parseEther('1'), // Send 1 ETH
  });
  await tx.wait();

  const voucherHubContract = await ethers.getContractAt('IVoucherHub', VOUCHER_HUB_ADDRESS);

  // Mint a voucher with this type
  const pocoContract = await ethers.getContractAt('IExecPocoDelegate', POCO_ADDRESS);
  await pocoContract.depositFor(VOUCHER_HUB_ADDRESS, {
    value: ethers.parseUnits(`${value}`, 'gwei'),
  });
  const txCreateVoucher = await voucherHubContract.createVoucher(voucherOwner.address, voucherTypeId, value);
  const transactionReceiptCreateVoucher = await txCreateVoucher.wait();
  const createVoucherEvent = getEventFromLogs('VoucherCreated', transactionReceiptCreateVoucher.logs, {
    strict: true,
  });
  const voucherAddress = createVoucherEvent.args?.voucher;

  return {
    voucherOwner,
    voucherAddress,
  };
}

export async function voucherAuthorizeSharingContract({ dataProtectorSharingContract, voucherOwner, voucherAddress }) {
  // From user voucher authorized DataProtectorSharing Contract
  const dataProtectorSharingAddress = await dataProtectorSharingContract.getAddress();
  const voucherContract = await ethers.getContractAt('IVoucher', voucherAddress);
  const txAuthorizedVoucherContract = await voucherContract
    .connect(voucherOwner)
    .authorizeAccount(dataProtectorSharingAddress);
  await txAuthorizedVoucherContract.wait();
}
