export const ABI = [
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
    type: 'function',
    stateMutability: 'nonpayable',
    outputs: [{ type: 'address', name: '', internalType: 'contract Dataset' }],
    name: 'createCollection'
  }
];
