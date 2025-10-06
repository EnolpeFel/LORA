import { gql } from "@apollo/client";

const GET_WALLET_BALANCE_QUERY = gql`
  query GetWalletBalance {
    getWalletBalance {
      success
      message
      balance
    }
  }
`

export { GET_WALLET_BALANCE_QUERY };