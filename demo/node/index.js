import { Wallet } from 'ethers';
import { IExecDataProtector, getWeb3Provider } from '@iexec/dataprotector';

const test = async () => {
  const ethProvider = getWeb3Provider(Wallet.createRandom().privateKey);

  const dataProtector = new IExecDataProtector(ethProvider);

  console.log('-> Starting protectData()');
  dataProtector
    .protectDataObservable({
      data: {
        firstName: 'John',
        familyName: 'Doe',
        birthYear: 1971,
        usCitizen: true,
        avatar: Buffer.from(
          '<?xml version="1.0" standalone="no"?><svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" /></svg>'
        ),
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
