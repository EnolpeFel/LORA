import { gql } from "@apollo/client";

const FORGET_PASSWORD_QUERY = gql`
  mutation ForgetPassword($newPassword: String) {
    forgetPasswordMobile(newPassword: $newPassword) {
      success
      message
    }
  }
`
export { FORGET_PASSWORD_QUERY };