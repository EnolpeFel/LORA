import client from "../lib/apolloClient";
import { CREATE_PAYMENT_MUTATION } from "../graphql/mutations/payment";
import { getToken } from "../lib/cookies";

const CREATE_PAYMENT = async (method, amount, card = null, loanId) => {
  try {
    const token = await getToken();

    const { data } = await client.mutate({
      mutation: CREATE_PAYMENT_MUTATION,
      fetchPolicy: "no-cache",
      variables: {
        method,
        amount,
        card,
        loanId
      },
      context: {
        headers: {
          Authorization: token
        }
      }
    });

    const { success, message, nextActionUrls, status } = data.createPayment;

    if(!success) {
      return {
        success: false,
        message
      }
    };

    return {
      success,
      message,
      nextActionUrls,
      status
    };

  } catch (err) {
    return {
      success: false,
      message: err
    };
  };
};

export { CREATE_PAYMENT };