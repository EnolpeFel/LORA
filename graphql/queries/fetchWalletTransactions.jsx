import { gql } from "@apollo/client";

const GET_WALLET_TRANSACTIONS_QUERY = gql`
  query GetWalletTransactions {
    getWalletTransactions {
      success
      message
      transactions
    }
  }
`

export { GET_WALLET_TRANSACTIONS_QUERY };