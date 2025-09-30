import { gql } from "@apollo/client";

const GET_LOANS_DATA_QUERY = gql`
  query GetLoansData{
    getUserLoans{
      success
      message
      loans
    }
  }
`

export {  GET_LOANS_DATA_QUERY };