import fs from 'fs/promises';

// eslint-disable-next-line import/prefer-default-export
export const saveDeployment =
  (contractName: string) =>
  async ({
    address,
    args,
    block,
  }: {
    address: string;
    args: string;
    block: number;
  }) => {
    await fs.mkdir(`deployments/${contractName}`, { recursive: true });
    await Promise.all([
      fs.writeFile(`deployments/${contractName}/address`, `${address}`),
      fs.writeFile(`deployments/${contractName}/args`, `${args}`),
      fs.writeFile(`deployments/${contractName}/block`, `${block}`),
    ]);
  };
