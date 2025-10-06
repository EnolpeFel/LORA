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
const GET_CURRENT_LOAN_DATA_QUERY = gql`
  query GetUserCurrentLoan {
    getUserCurrentLoan {
      success
      message
      currentLoan
    }
  }
`

export {  
  GET_LOANS_DATA_QUERY, 
  GET_LOAN_TRANSACTIONS_QUERY,
  GET_CURRENT_LOAN_DATA_QUERY
 };