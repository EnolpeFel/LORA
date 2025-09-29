import { gql } from "@apollo/client";

const SUBMIT_LOAN_APPLICATION = gql`
  mutation SubmitLoanApplication($data: LoanApplicationDataInput) {
    submitLoanApplication(data: $data) {
      success
      message
      company
      loan
      numberOfDocs
    }
  }
`

export { SUBMIT_LOAN_APPLICATION };