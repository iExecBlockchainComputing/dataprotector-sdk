import Debug from 'debug';

const debug = Debug('iexec-data-protector-builder');

export const getLogger = (namespace: string) => debug.extend(namespace);
