import { IExecDataProtector, getWeb3Provider } from '@iexec/dataprotector';
import { Wallet } from 'ethers';

const test = async () => {
  const ethProvider = getWeb3Provider(Wallet.createRandom().privateKey);

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

test();
