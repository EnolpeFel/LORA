import { gql } from "@apollo/client";

const UPDATE_NOTIFICATIONS_QUERY = gql`
  mutation UpdateNotifications($notifId: Int) {
    updateNotifications(notifId: $notifId) {
      success
      message
    }
  }
`

export { UPDATE_NOTIFICATIONS_QUERY };