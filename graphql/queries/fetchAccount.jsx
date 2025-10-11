import { gql } from "@apollo/client";

const GET_ACCOUNT_DATA_QUERY = gql`
  query GetAccountData {
    getProfileData {
      success
      message
      account
    }
  }
`

const GET_NOTIFICATIONS_QUERY = gql`
  query GetUserNotifications {
    getUserNotifications {
      success
      message
      notifications
    }
  }
`

export { 
  GET_ACCOUNT_DATA_QUERY, 
  GET_NOTIFICATIONS_QUERY 
};