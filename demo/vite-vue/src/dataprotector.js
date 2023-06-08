import { IExecDataProtector } from '@iexec/dataprotector';

export const test = async () => {
  if (!window.ethereum) {
    throw Error('missing injected ethereum provider in page');
  }

  await window.ethereum.request({
    method: 'eth_requestAccounts',
  });

  const dataProtector = new IExecDataProtector(window.ethereum);

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
