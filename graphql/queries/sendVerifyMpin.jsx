import { gql } from '@apollo/client';

const SEND_MPIN = gql`
  query SendMPIN($phone: String) {
    sendMPIN(phone: $phone) {
      success
      message
    }
  } 
`;

const VERIFY_MPIN = gql`
  query VerifyMPIN($phone: String, $code: String) {
    verifyMPIN(phone: $phone, code: $code) {
      success
      message
    }
  }
`

export { SEND_MPIN, VERIFY_MPIN };