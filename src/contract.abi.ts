const ABI = [
  {
    type: 'constructor',
    stateMutability: 'nonpayable',
    inputs: [
      {
        type: 'address',
        name: '_registry',
        internalType: 'contract DatasetRegistry',
      },
    ],
  },
  {
    type: 'event',
    name: 'DatasetSchema',
    inputs: [
      {
        type: 'address',
        name: 'dataset',
        internalType: 'contract Dataset',
        indexed: true,
      },
      {
        type: 'string',
        name: 'schema',
        internalType: 'string',
        indexed: false,
      },
    ],
    anonymous: false,
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    outputs: [{ type: 'address', name: '', internalType: 'contract Dataset' }],
    name: 'createDatasetWithSchema',
    inputs: [
      { type: 'address', name: '_datasetOwner', internalType: 'address' },
      { type: 'string', name: '_datasetName', internalType: 'string' },
      { type: 'string', name: '_datasetSchema', internalType: 'string' },
      { type: 'bytes', name: '_datasetMultiaddr', internalType: 'bytes' },
      { type: 'bytes32', name: '_datasetChecksum', internalType: 'bytes32' },
    ],
  },
  {
    type: 'function',
    stateMutability: 'view',
    outputs: [
      { type: 'address', name: '', internalType: 'contract DatasetRegistry' },
    ],
    name: 'registry',
    inputs: [],
  },
];
export { ABI };
