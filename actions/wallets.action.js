import client from "../lib/apolloClient";
import { GET_WALLET_BALANCE_QUERY } from "../graphql/queries/fetchWalletBalance";
import { WALLET_CASH_IN_QUERY } from "../graphql/mutations/cashIn";
import { WALLET_PAYMENT_QUERY } from "../graphql/mutations/walletPayment";
import { getToken } from "../lib/cookies";

const GET_WALLET_BALANCE = async () => {
  try {
    const token = await getToken();

    const { data } = await client.query({
      query: GET_WALLET_BALANCE_QUERY,
      fetchPolicy: 'no-cache',
      context: {
        headers: {
          Authorization: token
        }
      }
    });

    const { success, message, balance } = data.getWalletBalance;

    if(!success) {
      return {
        success: false,
        message
      }
    };

    return {
      success,
      message,
      balance
    }

  } catch (err) {
    return {
      success: false,
      message: err.message
    }
  }; 
}

const WALLET_CASH_IN = async (amount, method) => {
  try {
    const token = await getToken();

    const  { data } = await client.mutate({
      mutation: WALLET_CASH_IN_QUERY,
      fetchPolicy: 'no-cache',
      variables: {
        amount,
        method
      },
      context: {
        headers: {
          Authorization: token
        }
      }
    });

    const { success, message } = data.walletCashIn;

    if(!success) {
      return {
        success: false,
        message
      }
    };

    return {
      success: true,
      message
    }
  } catch (err) {
    return {
      success: false,
      message: err.message
    }
  }
};

const WALLET_PAYMENT = async (loanId) => {
  try {
    const token = await getToken();

    const  { data } = await client.mutate({
      mutation: WALLET_PAYMENT_QUERY,
      fetchPolicy: 'no-cache',
      variables: {
        loanId
      },
      context: {
        headers: {
          Authorization: token
        }
      }
    });

    const { success, message } = data.walletPayment;

    if(!success) {
      return {
        success: false,
        message
      }
    };

    return {
      success: true,
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
  GET_WALLET_BALANCE, 
  WALLET_CASH_IN, 
  WALLET_PAYMENT 
};