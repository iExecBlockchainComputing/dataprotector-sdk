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

Deployed to : <http://localhost:8000/subgraphs/name/DataProtector/graphql>

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

You can trigger a deployment using the promote action on the CI.

### Self Hosted Subgraph

To deploy a new version of a subgraph on the iExec self-hosted service, follow these steps:

1. Index the New Subgraph

First, index the new version of the subgraph using the temporary subgraph deployment.
Trigger its deployment with the target:

```sh
subgraph-deploy-tmp
```

2. Wait for Indexing Completion

Once the temporary subgraph has finished indexing, you can proceed to the production deployment.

3. Deploy to Production (No Downtime)

Trigger the production deployment with :

```sh
subgraph-deploy-prod
```

This ensures a seamless transition with no downtime.

4. Verify the Deployment

Visit the following URL to check the new version of the subgraph:
<https://thegraph.iex.ec/subgraphs/name/bellecour/dataprotector-v2/graphql>
