import client from "../lib/apolloClient";
import { getToken } from "../lib/cookies";
import { GET_ACCOUNT_DATA_QUERY, GET_NOTIFICATIONS_QUERY } from "../graphql/queries/fetchAccount";

const GET_ACCOUNT_DATA = async () => {
  try {
    const token = await getToken();

    const { data } = await client.query({
      query: GET_ACCOUNT_DATA_QUERY,
      fetchPolicy: "no-cache",
      context: {
        headers: {
          Authorization: token
        }
      }
    });

    const { success, message, account } = data.getProfileData;

    if (!success) {
      return {
        success,
        message,
        account: null
      };
    };
  
    return {
      success,
      message,
      account
    };

  } catch (err) {
    return {
      success: false,
      message: err.message
    };
  };
};

const GET_NOTIFICATIONS = async () => {
  try {
    const token = await getToken();

    const { data } = await client.query({
      query: GET_NOTIFICATIONS_QUERY,
      fetchPolicy: "no-cache",
      context: {
        headers: {
          Authorization: token
        }
      }
    });

    const { success, message, notifications } = data.getUserNotifications;

    if(!success) {
      return {
        success,
        message,
        notifications: []
      }
    };

    if(notifications.length === 0) {
      return {
        success,
        message,
        notifications: []
      }
    };

    return {
      success: true,
      message: "Notifications fetched successfully",
      notifications
    }

  } catch (err) {
    return {
      success: false,
      message: err.message
    };
  };
}

export {  
  GET_ACCOUNT_DATA,
  GET_NOTIFICATIONS
};