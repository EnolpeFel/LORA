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

const GET_LOAN_TRANSACTIONS_QUERY = gql`
  query GetLoanTransactions{
    getLoanTransactions{
      success
      message
      loanTransactions
    }
  }
`

export {  GET_LOANS_DATA_QUERY, GET_LOAN_TRANSACTIONS_QUERY };