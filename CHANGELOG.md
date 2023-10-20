# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] (2023-09-20)

### Changed

- Added `dataprotectorContract` in the constructor options to customize the `CONTRACT_ADDRESS`

- Added `dataprotectorSubgraph` in the constructor options to customize the `DATAPROTECTOR_SUBGRAPH_ENDPOINT`

- Moved `ipfsNode` and `ipfsGateway` options to constructor (breaking change)

- Example constructor:

```
const dataProtector = new IExecDataProtector(
      [web3provider],
      {
        subgraphUrl: [customSubgraphUrl],
        contractAddress: [customSContractAddress],
        ipfsGateway: [customIpfsGateway],
        ipfsNode: [customIpfsNode],
        iexecOptions: {
          [smsURL],
          [iexecGatewayURL],
        },
      }
    );
```

- Added method `processProtectedData` to the sdk that triggers the execution of an iExec dapp to process a created data.
  Input types of the method:

```
 /**
   * Address or ENS (Ethereum Name Service) of the protected data.
   */
  protectedData: AddressOrENS;

  /**
   * Address or ENS of the authorized application to process the protected data.
   */
  app: AddressOrENS;

  /**
   * The maximum price per task for processing the protected data.
   * It is the sum of the application price, dataset price and workerpool price per task.
  @default = 0
  */
  maxPrice?: number;

  /**
   * Arguments to pass to the application during execution.
   */
  args?: string;

  /**
   * The input file required for the application's execution (direct download URL).
   */
  inputFiles?: string[];

  /**
   * Requester secrets necessary for the application's execution.
   * It is represented as a mapping of numerical identifiers to corresponding secrets.
   */
  secrets?: Record<number, string>;
```

## [0.1.2] (2023-09-20)

### Changed

- Improved error handling
- The `protectedData` param in `fetchGrantedAccess` is no longer required and now accepts `"any"`, when not specified the method will fetch granted access for any protectedData
- Removed bundle
- Updated iexec to version 8.2.1
- Updated supported MIME types (not supported will fallback to `application/octet-stream`):
  - application/octet-stream
  - application/pdf
  - application/xml
  - application/zip
  - audio/midi
  - audio/mpeg
  - audio/x-wav
  - image/bmp
  - image/gif
  - image/jpeg
  - image/png
  - image/webp
  - video/mp4
  - video/mpeg
  - video/x-msvideo

## [0.1.1]

### Changed

- fixed installation issue for Windows users
- changed the default IPFS node

## [0.1.0] Initial release
