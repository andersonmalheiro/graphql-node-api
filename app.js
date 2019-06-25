const express = require("express");
const bodyParser = require("body-parser");
const graphqlHttp = require("express-graphql");
const { buildSchema } = require("graphql");
const mongoose = require("mongoose");

const Event = require("./models/event");

const app = express();
const port = 3000;

app.use(bodyParser.json());

const events = [];

app.use(
  "/graphql",
  graphqlHttp({
    schema: buildSchema(`
    type Event {
      _id: ID!
      title: String!
      description: String!
      price: Float!
      date: String!
    }

    input EventInput {
      title: String!
      description: String!
      price: Float!
      date: String!
    }

    type RootQuery {
      events: [Event!]!
    }

    type RootMutation {
      createEvent(eventInput: EventInput): Event
    }

    schema {
      query: RootQuery
      mutation: RootMutation
    }
  `),
    rootValue: {
      events: () => {
        return Event.find()
          .then(res => {
            res.map(event => {
              return { ...event._doc, _id: event._doc._id.toString() };
            });
          })
          .catch(err => {
            console.error(err);
            throw err;
          });
      },
      createEvent: args => {
        const event = new Event({
          title: args.eventInput.title,
          description: args.eventInput.description,
          price: +args.eventInput.price,
          date: new Date(args.eventInput.date)
        });
        return event
          .save()
          .then(res => {
            console.log(res);
            return { ...event._doc };
          })
          .catch(err => {
            console.error(err);
            throw err;
          });
      }
    },
    graphiql: true
  })
);

mongoose
  .connect(`mongodb://127.0.0.1:27017/${process.env.DB}`, {
    useNewUrlParser: true
  })
  .then(() => {
    console.log("MongoDB connected!\n");
    app.listen(port, "", () => {
      console.log(`Server running on http://localhost/${port}`);
    });
  })
  .catch(err => {
    console.error("Error ->", err);
  });
