const express = require('express');
const bodyParser = require('body-parser');
const graphqlHttp = require('express-graphql');
const { buildSchema } = require('graphql');

const app = express();
const port = 3000;

app.use(bodyParser,json());

/**
 * TODO: Continuar 12:02 min
 */

app.use('/graphql', graphqlHttp({
  schema: buildSchema(``),
  rootValue: {}
}));

app.listen(port);