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
    name: 'test-from-next',
    data: {
      email: 'test-from-next@example.com',
    },
    onStatusUpdate: ({ title, isDone }) => {
      console.log(title, isDone);
    },
  });
};
