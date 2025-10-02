import { gql } from "@apollo/client";

const WALLET_CASH_IN_QUERY = gql`
  mutation WalletCashIn($amount: Float, $method: CashInMethodType) {
    walletCashIn(amount: $amount, method: $method) {
      success
      message
    }
  }
`

export { WALLET_CASH_IN_QUERY };