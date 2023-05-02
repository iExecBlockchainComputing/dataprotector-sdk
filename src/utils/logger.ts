import Debug from 'debug';

const debug = Debug('@iexec/dataprotector');

export const getLogger = (namespace: string) => {
  const namespaceLogger = debug.extend(namespace);
  return {
    log: namespaceLogger.extend('info'),
    error: namespaceLogger.extend('error'),
  };
};
