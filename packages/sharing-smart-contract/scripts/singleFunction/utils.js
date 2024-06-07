export const impersonate = async ({ rpcUrl, address }) => {
  await fetch(rpcUrl, {
    method: 'POST',
    body: JSON.stringify({
      method: 'hardhat_impersonateAccount',
      params: [address],
      id: 1,
      jsonrpc: '2.0',
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const stopImpersonate = async ({ rpcUrl, address }) => {
  await fetch(rpcUrl, {
    method: 'POST',
    body: JSON.stringify({
      method: 'hardhat_stopImpersonatingAccount',
      params: [address],
      id: 1,
      jsonrpc: '2.0',
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
