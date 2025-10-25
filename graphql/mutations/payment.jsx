import { gql } from "@apollo/client";

const CREATE_PAYMENT_MUTATION = gql`
  mutation CreatePayment($method: String, $amount: Float, $card: CardInput, $loanId: Int) {
    createPayment(method: $method, amount: $amount, card: $card, loanId: $loanId) {
      success
      message
      nextActionUrls
      status
    }
  }
`

export { CREATE_PAYMENT_MUTATION };