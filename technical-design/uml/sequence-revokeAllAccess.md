# revokeAllAccess

```mermaid
sequenceDiagram
    title revokeAllAccess

    box Client environment
        actor User
        participant SDK as @iexec/dataprotector
    end

    box iExec Protocol
        participant POCO as PoCo SC
        participant Market as Marketplace API
    end

    Market --) POCO : observe and clear revoked orders

    User -) SDK: revokeAllAccess<br>(protectedData,<br>authorizedApp optional filter,<br>authorizedUser optional filter)

    SDK ->> Market: query datasetorders matching filters

    loop For each datasetorder
        SDK ->> POCO: revoke datasetorder
    end

    SDK ->> User: revoked access
```

## resources

- **dataset**: Exec's protocol NFT providing governance over a confidential data, the dataset is the backbone of a protected data
- **datasetorder**: iExec's protocol document expressing a subset of governance rules signed by the owner of a dataset, datasetorders are referred as GrantedAccess by DataProtector
- [iExec protocol documentation](https://protocol.docs.iex.ec)

[<-- back](../index.md)
