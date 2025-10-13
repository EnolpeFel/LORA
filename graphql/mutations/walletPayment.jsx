import { gql } from "@apollo/client";

const WALLET_PAYMENT_QUERY = gql`
  mutation WalletPayment($loanId: Int) {
    walletPayment(loanId: $loanId) {
      success
      message
      transactionId
      referenceNumber
    }
  }
`

export {  WALLET_PAYMENT_QUERY };