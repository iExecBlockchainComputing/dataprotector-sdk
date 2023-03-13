import Debug from 'debug';

const debug = Debug('iexec-cNFT-builder');

const getLogger = (namespace: string) => debug.extend(namespace);

export { getLogger };
