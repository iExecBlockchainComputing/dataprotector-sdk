const { GraphQLClient, gql } = require('graphql-request');

const ENDPOINT = 'http://localhost:8000/subgraphs/name/DataProtector';

const graphQLClient = new GraphQLClient(ENDPOINT);
const query = gql`
  query MyQuery($restrictedSchema: String!) {
    protectedDatas(where: { schema_: { id: $restrictedSchema } }) {
      id
      jsonSchema
    }
  }
`;

const variables = { restrictedSchema: '' };
graphQLClient
  .request(query, variables)
  .then((data) => console.log(data))
  .catch((error) => console.error(error));
