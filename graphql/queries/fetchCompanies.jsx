import { gql } from "@apollo/client";

const GET_LENDING_COMPANIES_QUERY = gql`
  query GetLendingCompanies {
    getLendingCompanies {
      success
      message
      companies
    }
  }
`

export { GET_LENDING_COMPANIES_QUERY };