import fs from 'fs/promises';

// eslint-disable-next-line import/prefer-default-export
export const saveDeployment =
  (contractName) =>
  async ({ address, args, block }) => {
    await fs.mkdir(`deployments/${contractName}`, { recursive: true });
    await Promise.all([
      fs.writeFile(`deployments/${contractName}/address`, `${address}`),
      fs.writeFile(`deployments/${contractName}/args`, `${args}`),
      fs.writeFile(`deployments/${contractName}/block`, `${block}`),
    ]);
  };
