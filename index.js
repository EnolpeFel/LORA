import { registerRootComponent } from 'expo';
import { ApolloProvider } from "@apollo/client/react";
import client from "./lib/apolloClient";

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
const Root = () => (
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>
)

registerRootComponent(Root);
