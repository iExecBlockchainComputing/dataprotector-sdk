export const ABI = [
  {
    inputs: [
      {
        internalType: 'contract IExecPocoDelegate',
        name: '_proxy',
        type: 'address',
      },
      {
        internalType: 'contract IRegistry',
        name: 'appRegistry_',
        type: 'address',
      },
      {
        internalType: 'contract IRegistry',
        name: 'protectedDataRegistry_',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  { inputs: [], name: 'AccessControlBadConfirmation', type: 'error' },
  {
    inputs: [
      { internalType: 'address', name: 'account', type: 'address' },
      { internalType: 'bytes32', name: 'neededRole', type: 'bytes32' },
    ],
    name: 'AccessControlUnauthorizedAccount',
    type: 'error',
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'AddressInsufficientBalance',
    type: 'error',
  },
  {
    inputs: [{ internalType: 'address', name: 'appAddress', type: 'address' }],
    name: 'AppNotOwnByContract',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'collectionTokenId', type: 'uint256' },
    ],
    name: 'CollectionNotEmpty',
    type: 'error',
  },
  {
    inputs: [{ internalType: 'uint48', name: '_duration', type: 'uint48' }],
    name: 'DurationInvalide',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'address', name: 'sender', type: 'address' },
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { internalType: 'address', name: 'owner', type: 'address' },
    ],
    name: 'ERC721IncorrectOwner',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'address', name: 'operator', type: 'address' },
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
    ],
    name: 'ERC721InsufficientApproval',
    type: 'error',
  },
  {
    inputs: [{ internalType: 'address', name: 'approver', type: 'address' }],
    name: 'ERC721InvalidApprover',
    type: 'error',
  },
  {
    inputs: [{ internalType: 'address', name: 'operator', type: 'address' }],
    name: 'ERC721InvalidOperator',
    type: 'error',
  },
  {
    inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
    name: 'ERC721InvalidOwner',
    type: 'error',
  },
  {
    inputs: [{ internalType: 'address', name: 'receiver', type: 'address' }],
    name: 'ERC721InvalidReceiver',
    type: 'error',
  },
  {
    inputs: [{ internalType: 'address', name: 'sender', type: 'address' }],
    name: 'ERC721InvalidSender',
    type: 'error',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'ERC721NonexistentToken',
    type: 'error',
  },
  { inputs: [], name: 'FailedInnerCall', type: 'error' },
  { inputs: [], name: 'InvalidInitialization', type: 'error' },
  {
    inputs: [
      { internalType: 'uint256', name: 'collectionTokenId', type: 'uint256' },
      { internalType: 'address', name: 'protectedData', type: 'address' },
    ],
    name: 'NoProtectedDataInCollection',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'collectionTokenId', type: 'uint256' },
    ],
    name: 'NoSubscriptionParams',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'collectionTokenId', type: 'uint256' },
      { internalType: 'address', name: 'protectedDatas', type: 'address' },
    ],
    name: 'NoValidRentalOrSubscription',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'collectionTokenId', type: 'uint256' },
    ],
    name: 'NotCollectionOwner',
    type: 'error',
  },
  { inputs: [], name: 'NotInitializing', type: 'error' },
  {
    inputs: [
      { internalType: 'uint256', name: 'collectionTokenId', type: 'uint256' },
    ],
    name: 'OnGoingCollectionSubscriptions',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_collectionTokenId', type: 'uint256' },
      { internalType: 'address', name: '_protectedData', type: 'address' },
    ],
    name: 'ProctedDataInSubscription',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'collectionTokenId', type: 'uint256' },
      { internalType: 'address', name: 'protectedData', type: 'address' },
    ],
    name: 'ProtectedDataAvailableForRenting',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'collectionTokenId', type: 'uint256' },
      { internalType: 'address', name: 'protectedData', type: 'address' },
    ],
    name: 'ProtectedDataAvailableInSubscription',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'address', name: 'protectedData', type: 'address' },
    ],
    name: 'ProtectedDataCurrentlyBeingRented',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'address', name: 'protectedData', type: 'address' },
    ],
    name: 'ProtectedDataForSale',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'collectionTokenId', type: 'uint256' },
      { internalType: 'address', name: 'protectedData', type: 'address' },
    ],
    name: 'ProtectedDataNotAvailableForRenting',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'address', name: 'protectedData', type: 'address' },
    ],
    name: 'ProtectedDataNotForSale',
    type: 'error',
  },
  {
    inputs: [
      {
        components: [
          { internalType: 'address', name: 'workerpool', type: 'address' },
          { internalType: 'uint256', name: 'workerpoolprice', type: 'uint256' },
          { internalType: 'uint256', name: 'volume', type: 'uint256' },
          { internalType: 'bytes32', name: 'tag', type: 'bytes32' },
          { internalType: 'uint256', name: 'category', type: 'uint256' },
          { internalType: 'uint256', name: 'trust', type: 'uint256' },
          { internalType: 'address', name: 'apprestrict', type: 'address' },
          { internalType: 'address', name: 'datasetrestrict', type: 'address' },
          {
            internalType: 'address',
            name: 'requesterrestrict',
            type: 'address',
          },
          { internalType: 'bytes32', name: 'salt', type: 'bytes32' },
          { internalType: 'bytes', name: 'sign', type: 'bytes' },
        ],
        internalType: 'struct IexecLibOrders_v5.WorkerpoolOrder',
        name: 'workerpoolOrder',
        type: 'tuple',
      },
    ],
    name: 'WorkerpoolOrderNotFree',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'expectedAmount', type: 'uint256' },
      { internalType: 'uint256', name: 'receivedAmount', type: 'uint256' },
    ],
    name: 'WrongAmountSent',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'approved',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
    ],
    name: 'Approval',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'operator',
        type: 'address',
      },
      { indexed: false, internalType: 'bool', name: 'approved', type: 'bool' },
    ],
    name: 'ApprovalForAll',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint64',
        name: 'version',
        type: 'uint64',
      },
    ],
    name: 'Initialized',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'collectionTokenId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'protectedData',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'renter',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint48',
        name: 'endDate',
        type: 'uint48',
      },
    ],
    name: 'NewRental',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'collectionTokenId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'subscriber',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint48',
        name: 'endDate',
        type: 'uint48',
      },
    ],
    name: 'NewSubscription',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'collectionTokenId',
        type: 'uint256',
      },
      {
        components: [
          { internalType: 'uint112', name: 'price', type: 'uint112' },
          { internalType: 'uint48', name: 'duration', type: 'uint48' },
        ],
        indexed: false,
        internalType: 'struct ISubscription.SubscriptionParams',
        name: 'subscriptionParams',
        type: 'tuple',
      },
    ],
    name: 'NewSubscriptionParams',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'collectionTokenId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'protectedData',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint112',
        name: 'price',
        type: 'uint112',
      },
      {
        indexed: false,
        internalType: 'uint48',
        name: 'duration',
        type: 'uint48',
      },
    ],
    name: 'ProtectedDataAddedForRenting',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'collectionTokenId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'protectedData',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint112',
        name: 'price',
        type: 'uint112',
      },
    ],
    name: 'ProtectedDataAddedForSale',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'collectionTokenId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'protectedData',
        type: 'address',
      },
    ],
    name: 'ProtectedDataAddedForSubscription',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'dealId',
        type: 'bytes32',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'protectedData',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'enum IProtectedDataSharing.mode',
        name: 'mode',
        type: 'uint8',
      },
    ],
    name: 'ProtectedDataConsumed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'collectionTokenId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'protectedData',
        type: 'address',
      },
    ],
    name: 'ProtectedDataRemovedFromRenting',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'collectionTokenId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'protectedData',
        type: 'address',
      },
    ],
    name: 'ProtectedDataRemovedFromSale',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'collectionTokenId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'protectedData',
        type: 'address',
      },
    ],
    name: 'ProtectedDataRemovedFromSubscription',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'collectionTokenIdFrom',
        type: 'uint256',
      },
      { indexed: false, internalType: 'address', name: 'to', type: 'address' },
      {
        indexed: false,
        internalType: 'address',
        name: 'protectedData',
        type: 'address',
      },
    ],
    name: 'ProtectedDataSold',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'protectedData',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'newCollection',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'oldCollection',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'appAddress',
        type: 'address',
      },
    ],
    name: 'ProtectedDataTransfer',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'role', type: 'bytes32' },
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'previousAdminRole',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'newAdminRole',
        type: 'bytes32',
      },
    ],
    name: 'RoleAdminChanged',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'role', type: 'bytes32' },
      {
        indexed: true,
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'sender',
        type: 'address',
      },
    ],
    name: 'RoleGranted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'role', type: 'bytes32' },
      {
        indexed: true,
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'sender',
        type: 'address',
      },
    ],
    name: 'RoleRevoked',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'from', type: 'address' },
      { indexed: true, internalType: 'address', name: 'to', type: 'address' },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
    ],
    name: 'Transfer',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'user',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'Withdraw',
    type: 'event',
  },
  {
    inputs: [],
    name: 'DEFAULT_ADMIN_ROLE',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_collectionTokenId', type: 'uint256' },
      { internalType: 'address', name: '_protectedData', type: 'address' },
      { internalType: 'address', name: '_appAddress', type: 'address' },
    ],
    name: 'addProtectedDataToCollection',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_collectionTokenIdFrom',
        type: 'uint256',
      },
      { internalType: 'address', name: '_protectedData', type: 'address' },
      { internalType: 'address', name: '_to', type: 'address' },
    ],
    name: 'buyProtectedData',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_collectionTokenIdFrom',
        type: 'uint256',
      },
      { internalType: 'address', name: '_protectedData', type: 'address' },
      {
        internalType: 'uint256',
        name: '_collectionTokenIdTo',
        type: 'uint256',
      },
      { internalType: 'address', name: '_appAddress', type: 'address' },
    ],
    name: 'buyProtectedDataForCollection',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'collectionDetails',
    outputs: [
      { internalType: 'uint256', name: 'size', type: 'uint256' },
      {
        internalType: 'uint48',
        name: 'subscriptionExpiration',
        type: 'uint48',
      },
      {
        components: [
          { internalType: 'uint112', name: 'price', type: 'uint112' },
          { internalType: 'uint48', name: 'duration', type: 'uint48' },
        ],
        internalType: 'struct ISubscription.SubscriptionParams',
        name: 'subscriptionParams',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_collectionTokenId', type: 'uint256' },
      { internalType: 'address', name: '_protectedData', type: 'address' },
      {
        components: [
          { internalType: 'address', name: 'workerpool', type: 'address' },
          { internalType: 'uint256', name: 'workerpoolprice', type: 'uint256' },
          { internalType: 'uint256', name: 'volume', type: 'uint256' },
          { internalType: 'bytes32', name: 'tag', type: 'bytes32' },
          { internalType: 'uint256', name: 'category', type: 'uint256' },
          { internalType: 'uint256', name: 'trust', type: 'uint256' },
          { internalType: 'address', name: 'apprestrict', type: 'address' },
          { internalType: 'address', name: 'datasetrestrict', type: 'address' },
          {
            internalType: 'address',
            name: 'requesterrestrict',
            type: 'address',
          },
          { internalType: 'bytes32', name: 'salt', type: 'bytes32' },
          { internalType: 'bytes', name: 'sign', type: 'bytes' },
        ],
        internalType: 'struct IexecLibOrders_v5.WorkerpoolOrder',
        name: '_workerpoolOrder',
        type: 'tuple',
      },
      { internalType: 'string', name: '_contentPath', type: 'string' },
    ],
    name: 'consumeProtectedData',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_to', type: 'address' }],
    name: 'createCollection',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'earning',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'getApproved',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_collectionTokenId', type: 'uint256' },
      { internalType: 'address', name: '_subscriberAddress', type: 'address' },
    ],
    name: 'getCollectionSubscriber',
    outputs: [{ internalType: 'uint48', name: '', type: 'uint48' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '_protectedData', type: 'address' },
      { internalType: 'address', name: '_renterAddress', type: 'address' },
    ],
    name: 'getProtectedDataRenter',
    outputs: [{ internalType: 'uint48', name: '', type: 'uint48' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'role', type: 'bytes32' }],
    name: 'getRoleAdmin',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'role', type: 'bytes32' },
      { internalType: 'address', name: 'account', type: 'address' },
    ],
    name: 'grantRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'role', type: 'bytes32' },
      { internalType: 'address', name: 'account', type: 'address' },
    ],
    name: 'hasRole',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'defaultAdmin', type: 'address' },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address', name: 'operator', type: 'address' },
    ],
    name: 'isApprovedForAll',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '', type: 'address' },
      { internalType: 'address', name: '', type: 'address' },
      { internalType: 'uint256', name: '', type: 'uint256' },
      { internalType: 'bytes', name: '', type: 'bytes' },
    ],
    name: 'onERC721Received',
    outputs: [{ internalType: 'bytes4', name: '', type: 'bytes4' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'protectedDataDetails',
    outputs: [
      { internalType: 'uint256', name: 'collection', type: 'uint256' },
      { internalType: 'address', name: 'app', type: 'address' },
      { internalType: 'uint48', name: 'rentalExpiration', type: 'uint48' },
      { internalType: 'bool', name: 'inSubscription', type: 'bool' },
      {
        components: [
          { internalType: 'uint112', name: 'price', type: 'uint112' },
          { internalType: 'uint48', name: 'duration', type: 'uint48' },
        ],
        internalType: 'struct IRental.RentingParams',
        name: 'rentingParams',
        type: 'tuple',
      },
      {
        components: [
          { internalType: 'bool', name: 'isForSale', type: 'bool' },
          { internalType: 'uint112', name: 'price', type: 'uint112' },
        ],
        internalType: 'struct ISale.SellingParams',
        name: 'sellingParams',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_collectionTokenId', type: 'uint256' },
    ],
    name: 'removeCollection',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_collectionTokenId', type: 'uint256' },
      { internalType: 'address', name: '_protectedData', type: 'address' },
    ],
    name: 'removeProtectedDataForSale',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_collectionTokenId', type: 'uint256' },
      { internalType: 'address', name: '_protectedData', type: 'address' },
    ],
    name: 'removeProtectedDataFromCollection',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_collectionTokenId', type: 'uint256' },
      { internalType: 'address', name: '_protectedData', type: 'address' },
    ],
    name: 'removeProtectedDataFromRenting',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_collectionTokenId', type: 'uint256' },
      { internalType: 'address', name: '_protectedData', type: 'address' },
    ],
    name: 'removeProtectedDataFromSubscription',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'role', type: 'bytes32' },
      { internalType: 'address', name: 'callerConfirmation', type: 'address' },
    ],
    name: 'renounceRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_collectionTokenId', type: 'uint256' },
      { internalType: 'address', name: '_protectedData', type: 'address' },
    ],
    name: 'rentProtectedData',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'role', type: 'bytes32' },
      { internalType: 'address', name: 'account', type: 'address' },
    ],
    name: 'revokeRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'from', type: 'address' },
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'from', type: 'address' },
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { internalType: 'bytes', name: 'data', type: 'bytes' },
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'operator', type: 'address' },
      { internalType: 'bool', name: 'approved', type: 'bool' },
    ],
    name: 'setApprovalForAll',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_collectionTokenId', type: 'uint256' },
      { internalType: 'address', name: '_protectedData', type: 'address' },
      { internalType: 'uint112', name: '_price', type: 'uint112' },
    ],
    name: 'setProtectedDataForSale',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_collectionTokenId', type: 'uint256' },
      { internalType: 'address', name: '_protectedData', type: 'address' },
      { internalType: 'uint112', name: '_price', type: 'uint112' },
      { internalType: 'uint48', name: '_duration', type: 'uint48' },
    ],
    name: 'setProtectedDataToRenting',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_collectionTokenId', type: 'uint256' },
      { internalType: 'address', name: '_protectedData', type: 'address' },
    ],
    name: 'setProtectedDataToSubscription',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_collectionTokenId', type: 'uint256' },
      {
        components: [
          { internalType: 'uint112', name: 'price', type: 'uint112' },
          { internalType: 'uint48', name: 'duration', type: 'uint48' },
        ],
        internalType: 'struct ISubscription.SubscriptionParams',
        name: '_subscriptionParams',
        type: 'tuple',
      },
    ],
    name: 'setSubscriptionParams',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_collectionTokenId', type: 'uint256' },
    ],
    name: 'subscribeTo',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes4', name: 'interfaceId', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'from', type: 'address' },
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'iexec_result_storage_provider_',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'iexec_result_storage_proxy_',
        type: 'string',
      },
    ],
    name: 'updateEnv',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];