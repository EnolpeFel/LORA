import { gql } from "@apollo/client"

const EXTRACT_PHONE_FROM_TOKEN = gql`
  query ExtractPhoneFromToken {
    extractPhoneFromToken {
      success
      message
      phone
    }
  }
`

export { EXTRACT_PHONE_FROM_TOKEN };