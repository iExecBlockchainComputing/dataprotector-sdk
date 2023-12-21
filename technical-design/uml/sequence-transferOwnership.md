# transferOwnership

```mermaid
sequenceDiagram
    title transferOwnership

    box Client environment
        actor User
        participant SDK as @iexec/dataprotector
    end

    box iExec Protocol
        participant POCO as PoCo SC
        participant Market as Marketplace API
    end

    participant CCSC as ContentCreator

    Market --) POCO : observe and clear orders <br> when access is transferred

    User -) SDK: transferOwnership

    SDK ->> SDK: check if the CC_Contract <br> owns the protectedData

    alt CC_Contract does not own the protectedData
        SDK ->> POCO: transfer protectedData
    else CC_Contract owns the protectedData
        SDK ->> CCSC: Ask CC_contract to transfer the ownership <br> (modifier onlyProtectedDataOwner)
        Market ->> POCOSC: Report orders in the Market API BDD
    end

    SDK ->> POCO: revoke datasetorder

    SDK ->> User: Access transferred
```

## resources

- **dataset**: iExec's protocol NFT (Non-Fungible Token) providing governance over a confidential data, the dataset is the backbone of a protected data
- **datasetorder**: iExec's protocol document expressing a subset of governance rules signed by the owner of a dataset, datasetorders are referred as GrantedAccess by DataProtector
- [iExec protocol documentation](https://protocol.docs.iex.ec)

[<-- back](../index.md)
