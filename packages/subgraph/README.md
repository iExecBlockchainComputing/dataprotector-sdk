# Subgraph

This repository contains the code for the DataProtector subgraph, which indexes blockchain events to make them queryable through a GraphQL API.

## Build the Subgraph

After editing the schema.graphql & subgraph.yaml files, build the subgraph with:

```bash
npm run codegen
npm run build
```

Then implement event handlers in the ./src files to keep the graph updated when new events occur on the blockchain.

## Deployment Options

### Local Development

To deploy on a local Graph Node:

```bash
npm run create-local
npm run deploy-local
```

The subgraph will be available at: <http://localhost:8000/subgraphs/name/DataProtector/graphql>

### Thegraph network

To deploy this subgraph on Thegraph network:

1. Set up your environment variables in `.env` file:

   ```bash
   SUBGRAPH_SLUG=your-subgraph-slug
   SUBGRAPH_DEPLOY_KEY=your-deploy-key
   SUBGRAPH_NETWORK_NAME=your-network-name
   VERSION_LABEL=your-version-label
   ```

2. Deploy using the npm script:

   ```bash
   npm run deploy-studio
   ```

   This will run: `graph deploy ${SUBGRAPH_SLUG} --deploy-key ${SUBGRAPH_DEPLOY_KEY} --network ${SUBGRAPH_NETWORK_NAME} --version-label ${VERSION_LABEL}`

### Self-Hosted Subgraph Deployment Process

We use CI/CD pipelines to deploy our subgraphs to hosted environments.
For zero-downtime updates to the production subgraph:

1. **Index the New Version (Temporary Deployment)**

   - Trigger deployment with target: `subgraph-deploy-tmp`
   - This creates a separate instance for indexing

2. **Wait for Indexing Completion**

   - Monitor the temporary deployment until it's fully synced

3. **Deploy to Production (Zero Downtime)**

   - Once temporary deployment is ready, trigger: `subgraph-deploy-prod`
   - This swaps the deployments with no service interruption

4. **Verify the Deployment**
   - Access the production subgraph at: <https://thegraph.iex.ec/subgraphs/name/bellecour/dataprotector-v2/graphql>

## Query Examples

### Sample GraphQL Query

```graphql
query MyQuery($requiredSchema: [String!]!, $start: Int!, $range: Int!) {
  protectedDatas(
    where: { transactionHash_not: "0x", schema_contains: $requiredSchema }
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

### Query Variables

```json
{
  "start": 0,
  "range": 1000,
  "requiredSchema": []
}
```

## Development Workflow

1. Update schema.graphql and subgraph.yaml as needed
2. Run codegen to generate TypeScript types: `npm run codegen`
3. Implement mapping handlers in `src/` files
4. Build the subgraph: `npm run build`
5. Test locally before deploying to production environments

## CI/CD Integration

Our repository uses automated workflows to build, test, and deploy the subgraph:

- **ABI Validation**: Ensures contract ABIs are up-to-date across all packages
- **Testing**: Unit and integration tests validate subgraph functionality (TODO)
- **Zero-Downtime Deployment**: Staged deployment process ensures continuous service availability
