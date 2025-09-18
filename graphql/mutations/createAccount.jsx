import { gql } from '@apollo/client';

const CREATE_ACCOUNT = gql`
  mutation CreateAccount($data: CreateAccountInput) {
    createAccount(data: $data) {
      success
      message
      token
    }
  }
`

export { CREATE_ACCOUNT };