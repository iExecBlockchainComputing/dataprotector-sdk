# processProtectedData

```mermaid
sequenceDiagram
    title processProtectedData

    box Client environment
        actor User
        participant SDK as @iexec/dataprotector
    end

    box iExec Protocol
        participant Market as Marketplace API
        participant POCO as PoCo SC
    end

    User -) SDK: processProtectedData

    SDK ->> Market : query orders matching filters

    SDK ->> POCO : make a matchOrders()

    POCO -->> SDK : return dealId

    SDK -->> SDK : watch TaskId execution

    SDK ->> User: protectedData Processed
```

## resources

- **dataset**: iExec's protocol NFT (Non-Fungible Token) providing governance over a confidential data, the dataset is the backbone of a protected data
- **datasetorder**: iExec's protocol document expressing a subset of governance rules signed by the owner of a dataset, datasetorders are referred as GrantedAccess by DataProtector
- [iExec protocol documentation](https://protocol.docs.iex.ec)

[<-- back](../index.md)
