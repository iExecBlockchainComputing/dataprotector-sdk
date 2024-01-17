# protectData

```mermaid
sequenceDiagram
    title protectData

    box Client environment
        actor User
        participant SDK as @iexec/dataprotector
    end
    participant IPFS
    participant DPSC as DataProtector SC
    participant DPSG as DataProtector Subgraph
    box iExec Protocol
        participant DRSC as DatasetRegistry SC
        participant SMS as Secret Management Service
    end

    DPSG --) DPSC: observe and index<br>protected data

    User -) SDK: protectData<br>(data, name optional)

    SDK ->> SDK: extract data schema

    SDK ->> SDK: generate encryption key

    SDK ->> SDK: encrypt data

    SDK ->> IPFS: upload encrypted data

    SDK ->> DPSC: createDatasetWithSchema<br>(encrypted data uri, data schema)

    DPSC ->> DRSC: createDataset()

    DPSC -->> DPSG: index protected data

    SDK ->> SMS: push encryption key

    SDK ->> User: ProtectedData and metadata
```

## resources

- **dataset**: iExec's protocol NFT (Non-Fungible Token) providing governance over a confidential data, the dataset is the backbone of a protected data
- **datasetorder**: iExec's protocol document expressing a subset of governance rules signed by the owner of a dataset, datasetorders are referred as GrantedAccess by DataProtector
- [iExec protocol documentation](https://protocol.docs.iex.ec)

[<-- back](../index.md)
