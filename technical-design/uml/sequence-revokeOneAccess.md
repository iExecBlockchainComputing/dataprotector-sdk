# revokeOneAccess

```mermaid
sequenceDiagram
    title revokeOneAccess

    box Client environment
        actor User
        participant SDK as @iexec/dataprotector
    end

    box iExec Protocol
        participant POCO as PoCo SC
        participant Market as Marketplace API
    end

    Market --) POCO : observe and clear revoked orders

    User -) SDK: revokeOneAccess(grantedAccess)

    SDK ->> POCO: revoke datasetorder

    POCO -->> Market: clear order

    SDK ->> User: revoked GrantedAccess
```

## resources

- **dataset**: iExec's protocol NFT (Non-Fungible Token) providing governance over a confidential data, the dataset is the backbone of a protected data
- **datasetorder**: iExec's protocol document expressing a subset of governance rules signed by the owner of a dataset, datasetorders are referred as GrantedAccess by DataProtector
- [iExec protocol documentation](https://protocol.docs.iex.ec)

[<-- back](../index.md)
