import client from "../lib/apolloClient";
import { SUBMIT_LOAN_APPLICATION as SUBMIT_LOAN_APPLICATION_MUTATE } from "../graphql/mutations/loanApplications";
import { GET_LOANS_DATA_QUERY } from "../graphql/queries/fetchLoans";
import { getToken } from "../lib/cookies";

const SUBMIT_LOAN_APPLICATION = async (loanData) => {
  try {    
      const token = await getToken();
    
      const { data } = await client.mutate({
        mutation: SUBMIT_LOAN_APPLICATION_MUTATE,
        variables: { data: loanData },
        fetchPolicy: 'no-cache',
        context: {
          headers: {
            Authorization: token
          }
        }
      })
    
      const { success, message, company, loan, numberOfDocs } = data.submitLoanApplication;

      if(!success) {
        return {
          success: false,
          message
        }
      }

      return {
        success: true,
        message,
        companyDetails: company,
        loan,
        numberOfDocs
      }
  } catch (err) {
    return {
      success: false,
      message: err.message
    }
  }
}

const GET_LOANS_DATA = async () => {
  try {
    const token = await getToken();

    const { data } = await client.query({
      query: GET_LOANS_DATA_QUERY,
      fetchPolicy: 'no-cache',
      context: {
        headers: {
          Authorization: token
        }
      }
    });

    const { success, message, loans } = data.getUserLoans;

    if(!success) {
      return {
        success: false,
        message
      }
    };

    return {
      success: true,
      message,
      loans
    };

  } catch(err) {
    return {
      success: false,
      message: err.message
    };
  };
};

export { SUBMIT_LOAN_APPLICATION, GET_LOANS_DATA };