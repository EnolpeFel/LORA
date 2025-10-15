import client from "../lib/apolloClient";
import { getToken } from "../lib/cookies";
import { GET_ACCOUNT_DATA_QUERY, GET_NOTIFICATIONS_QUERY } from "../graphql/queries/fetchAccount";
import { UPDATE_NOTIFICATIONS_QUERY } from "../graphql/mutations/notifications";
import { SEND_MPIN as SEND_MPIN_QUERY, VERIFY_MPIN as VERIFY_MPIN_QUERY } from "../graphql/queries/sendVerifyMpin";
import { FORGET_PASSWORD_QUERY } from "../graphql/mutations/forgetPassword";

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

const UPDATE_NOTIFICATIONS = async (notifId) => {
  try {
    const token = await getToken();

    const { data } = await client.mutate({
      mutation: UPDATE_NOTIFICATIONS_QUERY,
      fetchPolicy: "no-cache",
      variables: {
        notifId
      },
      context: {
        headers: {
          Authorization: token
        }
      }
    });

    const { success, message } = data.updateNotifications;

    if(!success) {
      return {
        success,
        message
      }
    };

    return {
      success,
      message
    }

  } catch (err) {
    return {
      success: false,
      message: err.message
    };
  };
};

const SEND_MPIN = async (phone) => {
  try {
    const { data } = await client.query({
      query: SEND_MPIN_QUERY,
      fetchPolicy: "no-cache",
      variables: {
        phone
      }
    });

    const { success, message } = data.sendMPIN;

    if(!success) {
      return {
        success,
        message
      }
    };

    return {
      success,
      message
    };
  } catch (err) {
    return {
      success: false,
      message: err.message
    };
  }
};

const VERIFY_MPIN = async (phone, code) => {
  try {
    const { data } = await client.query({
      query: VERIFY_MPIN_QUERY,
      fetchPolicy: "no-cache",
      variables: {
        phone,
        code
      }
    });

    const { success, message, token } = data.verifyMPIN;

    if(!success) {
      return {
        success,
        message
      }
    };

    return {
      success,
      message,
      token
    };
  } catch (err) {
    return {
      success: false,
      message: err.message
    };
  }
};

const FORGET_PASSWORD = async (newPassword) => {
  try {
    const token = await getToken();

    const { data } = await client.mutate({
      mutation: FORGET_PASSWORD_QUERY,
      fetchPolicy: "no-cache",
      variables: {
        newPassword
      },
      context: {
        headers: {
          Authorization: token
        }
      }
    });

    const { success, message } = data.forgetPasswordMobile;

    if(!success) {
      return {
        success,
        message
      }
    };

    return {
      success,
      message 
    };

  } catch (err) {
    return {
      success: false,
      message: err.message
    }
  }
};

export {  
  GET_ACCOUNT_DATA,
  GET_NOTIFICATIONS,
  UPDATE_NOTIFICATIONS,
  SEND_MPIN,
  VERIFY_MPIN,
  FORGET_PASSWORD
};