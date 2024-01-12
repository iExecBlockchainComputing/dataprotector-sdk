# Subgraph

## Build the Subgraph

And you have finishing editing the schema.graphql & subgraph.yaml files. Type the following command

```bash
npm run codegen
npm run build
```

Then you have to write ./src/bays.ts files in order to update the graph when new events appear. In this way, it will always be up to date.

## Local

### Deploy on Local Graph node

```bash
npm run create-local
npm run deploy-local
```

### Test Subgrah API

Deployed to : http://localhost:8000/subgraphs/name/DataProtector/graphql

Request Example on GraphiQL :

Query for GraphiQL API
```graphql
query MyQuery($requiredSchema: [String!]!, $start: Int!, $range: Int!) {
  protectedDatas(
    where: {transactionHash_not: "0x", schema_contains: $requiredSchema}
    skip: $start
    first: $range
    orderBy: creationTimestamp
    orderDirection: desc
  ) {
    id
    name
    owner {
      id
    }
    jsonSchema
    creationTimestamp
    checksum
    blockNumber
    multiaddr
    transactionHash
    schema {
      id
      path
      type
    }
  }
}
```

```graphql
Query Variables :

{
  "start": 0,
  "range": 1000,
  "requiredSchema": []
}
```

## Hosted

Trigger deployment via promote action on CI.

### Hosted dev subgraph

Promote with target `dev-subgraph` to deploy on https://thegraph-product.iex.ec/subgraphs/name/bellecour/dev-dataprotector

### Subgraph API on Production