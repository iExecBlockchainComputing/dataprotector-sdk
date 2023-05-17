import { IExecDataProtector } from '@iexec/dataprotector';
import { getSignerFromPrivateKey } from 'iexec/utils';
import { Wallet } from 'ethers';

const main = async () => {
  const ethProvider = getSignerFromPrivateKey(
    'https://bellecour.iex.ec',
    Wallet.createRandom().privateKey
  );

  const dataProtector = new IExecDataProtector(ethProvider);

  const res = await dataProtector.fetchProtectedData();
  console.log(res);
};

main();
