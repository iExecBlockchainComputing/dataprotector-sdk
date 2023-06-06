# grantAccess

```mermaid
sequenceDiagram
    title grantAccess

    box Client environment
        actor User
        participant SDK as @iexec/dataprotector
    end
    box iExec Protocol
        participant Market as Marketplace API
    end

    User -) SDK: grantAccess<br>(protectedData,<br>authorizedApp,<br>authorizedUser)

    SDK ->> SDK: create a datasetorder

    SDK ->> Market: publish datasetorder

    SDK ->> User: GrantedAccess
```

## resources

- **dataset**: Exec's protocol NFT providing governance over a confidential data, the dataset is the backbone of a protected data
- **datasetorder**: iExec's protocol document expressing a subset of governance rules signed by the owner of a dataset, datasetorders are referred as GrantedAccess by DataProtector
- [iExec protocol documentation](https://protocol.docs.iex.ec)

[<-- back](../index.md)
