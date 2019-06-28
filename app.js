const express = require('express');
const bodyParser = require('body-parser');
const graphqlHttp = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const morgan = require('morgan');

// Models
const Event = require('./models/event');
const User = require('./models/user');

const app = express(); // Servidor Express
const port = process.env.PORT; // Porta

app.use(bodyParser.json());
app.use(morgan('dev')); // Logs de request

/**
 * Configuração do GraphQL
 * Rota para acessar e schemas
 */
app.use(
  '/graphql',
  graphqlHttp({
    schema: buildSchema(`
    type Event {
      _id: ID!
      title: String!
      description: String!
      price: Float!
      date: String!
    }

    type User {
      _id: ID!
      email: String!
      password: String
    }

    input EventInput {
      title: String!
      description: String!
      price: Float!
      date: String!
    }

    input UserInput {
      email: String!
      password: String!
    }

    type RootQuery {
      events: [Event!]!
    }

    type RootMutation {
      createEvent(eventInput: EventInput): Event
      createUser(userInput: UserInput): User
    }

    schema {
      query: RootQuery
      mutation: RootMutation
    }
  `),
    rootValue: {
      // Query para listar todos os eventos
      events: async () => {
        let data;
        try {
          data = await Event.find();
          return data;
        } catch (error) {
          console.error(error);
          throw error;
        }
      },
      // Mutation para adicionar evento
      createEvent: async args => {
        // Instancia um novo evento
        const event = new Event({
          title: args.eventInput.title,
          description: args.eventInput.description,
          price: +args.eventInput.price,
          date: new Date(args.eventInput.date)
        });
        try {
          await event.save();
          return event;
        } catch (error) {
          console.error(error);
          throw error;
        }
      },
      createUser: async args => {
        try {
          // Verifica se existe usuário com o mesmo email
          const user = await User.findOne({ email: args.userInput.email });
          if (user) {
            throw new Error('User exists already');
          } else {
            let hash;
            try {
              // Criptografa a senha
              hash = await bcrypt.hash(args.userInput.password, 12);

              // Instancia um novo usuário
              const newUser = new User({
                email: args.userInput.email,
                password: hash
              });
              // Salva usuário no banco e retorna-o;
              newUser.save();
              return newUser;
            } catch (error) {
              throw error;
            }
          }
        } catch (error) {
          throw error;
        }
      }
    },
    // Ativa interface gráfica para testar API GraphQL
    graphiql: true
  })
);

// Conectando ao MongoDB
mongoose
  .connect(`${process.env.DATABASE_URL}/${process.env.DB}`, {
    useNewUrlParser: true
  })
  .then(() => {
    console.log('\n------------------------------------------------');
    console.log('Database connected.');
    // Caso a conexão funcione, sobe o servidor Express
    app.listen(port, '', () => {
      console.log(`Server running on http://localhost/${port}`);
      console.log('------------------------------------------------\n');
    });
  })
  .catch(err => {
    console.error('Error ->', err);
  });
