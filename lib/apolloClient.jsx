import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";
import fetch from "cross-fetch";

const client = new ApolloClient({
  link: new HttpLink({
    uri: "http://localhost:5000/graphql", // TO DO: Change this graphql endpoint into a .env variable
    fetch
  }),
  cache: new InMemoryCache()
})

export default client;