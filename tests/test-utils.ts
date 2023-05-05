import { Wallet } from 'ethers';
import { getSignerFromPrivateKey } from 'iexec/utils';

export const getEthProvider = (privateKey) =>
  getSignerFromPrivateKey('bellecour', privateKey);

export const getRequiredFieldMessage = (field: string = 'this') =>
  `${field} is a required field`;

export const getRandomAddress = () => Wallet.createRandom().address;
