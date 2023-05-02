import { IExecDataProtector } from '@iexec/dataprotector';
import { getSignerFromPrivateKey } from 'iexec/utils';
import { Wallet } from 'ethers';

const main = async () => {
  const ethProvider = getSignerFromPrivateKey(
    'https://bellecour.iex.ec',
    Wallet.createRandom().privateKey
  );

  const dataProtector = new IExecDataProtector(ethProvider);

  dataProtector
    .protectDataObservable({
      data: {
        firstName: 'John',
        familyName: 'Doe',
        birthYear: 1971,
        usCitizen: true,
      },
      name: 'my personal data',
    })
    .subscribe(
      (data) => console.log(data),
      (e) => console.log(e),
      () => console.log('DONE')
    );
};

main();
