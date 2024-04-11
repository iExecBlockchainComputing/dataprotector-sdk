import { IExecDataProtectorDeserializer } from '@iexec/dataprotector-deserializer';

const main = async () => {
  const deserializer = new IExecDataProtectorDeserializer();
  const value = await deserializer.getValue('stringFoo', 'string');
  console.log(value);
};

main();
