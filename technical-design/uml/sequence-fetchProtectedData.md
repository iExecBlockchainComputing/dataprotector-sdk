# fetchProtectedData

```mermaid
sequenceDiagram
    title fetchProtectedData

    box Client environment
        actor User
        participant SDK as @iexec/dataprotector
    end

    participant DPSG as DataProtector Subgraph
    participant CCSC as ContentCreator SC
    participant DPSC as DataProtector SC

    DPSG --) DPSC: observe and index events

    DPSG --) CCSC: observe and index events

    User -) SDK: fetchProtectedData<br>(owner optional filter,<br>dataSchema optional filter)

    SDK ->> SDK: check if the CC_Contract <br> owns the protectedData


    SDK ->> DPSG: query protected data owns by the user himself and the CC_Contract

    SDK ->> User: array of ProtectedData
```

## resources

- **dataset**: iExec's protocol NFT (Non-Fungible Token) providing governance over a confidential data, the dataset is the backbone of a protected data
- **datasetorder**: iExec's protocol document expressing a subset of governance rules signed by the owner of a dataset, datasetorders are referred as GrantedAccess by DataProtector
- [iExec protocol documentation](https://protocol.docs.iex.ec)

[<-- back](../index.md)
