import { IExecDataProtector } from '@iexec/dataprotector';

export const createProtectedData = async () => {
  if (!window.ethereum) {
    throw Error('Missing Ethereum provider. Please install Metamask.');
  }

  await window.ethereum.request({
    method: 'eth_requestAccounts',
  });

  const dataProtector = new IExecDataProtector(window.ethereum);

  await dataProtector.core.protectData({
    name: 'my personal data',
    data: {
      firstName: 'John',
      familyName: 'Doe',
      birthYear: 1971,
      usCitizen: true,
      avatar: new TextEncoder().encode(
        '<?xml version="1.0" standalone="no"?><svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" /></svg>'
      ),
    },
    onStatusUpdate: ({ title, isDone }) => {
      console.log(title, { isDone });
    },
  });
};
