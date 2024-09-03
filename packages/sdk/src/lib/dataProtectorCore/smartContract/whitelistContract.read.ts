import { zeroPadValue } from 'ethers';
import { Address } from 'iexec';
import { ERC734 } from '../../../../generated/typechain/sharing/registry/ERC734.js';
import { GROUP_MEMBER_PURPOSE } from '../../../config/config.js';

export const isAddressInWhitelist = async ({
  whitelistContract,
  address,
}: {
  whitelistContract: ERC734;
  address: Address;
}): Promise<boolean> => {
  return whitelistContract.keyHasPurpose(
    zeroPadValue(address, 32),
    GROUP_MEMBER_PURPOSE
  );
};
