import { gql } from "@apollo/client";

const LOGIN_ACCOUNT = gql`
  mutation LoginAccount($phone: String, $pinCode: String) {
    loginAccount(phone: $phone, pinCode: $pinCode) {
      success
      message
    }
  }
`;

export { LOGIN_ACCOUNT };