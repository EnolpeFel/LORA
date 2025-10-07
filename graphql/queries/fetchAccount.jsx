import { gql } from "@apollo/client";

const GET_ACCOUNT_DATA_QUERY = gql`
  query GetAccountData {
    getProfileData {
      success
      message
      account
    }
  }
`

export { GET_ACCOUNT_DATA_QUERY };