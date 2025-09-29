import client from "../lib/apolloClient";
import { getToken } from "../lib/cookies";
import { GET_LENDING_COMPANIES_QUERY } from "../graphql/queries/fetchCompanies";

const GET_LENDING_COMPANIES = async () => {
  try {
    const token = await getToken();
  
    const { data } = await client.query({
      query: GET_LENDING_COMPANIES_QUERY,
      context: {
        headers: {
          Authorization: token
        }
      }
    })
  
    const { success, message, companies } = data.getLendingCompanies;

    if (!success) {
      return {
        success: false,
        message
      };
    };

    // Organize companies data 
    const formattedCompanies = companies.map((company) => {
      return {
        id: company.id,
        name: company.name,
        logo: company.logo,
        interestType: company.interestType,
        interestRate: company.interestRate,
        requirements: company.requirements.map(requirement => requirement.name),
        physicalVisitation: company.isRequiredVisit,
        minAmount: company.loanMinAmount,
        maxAmount: company.loanMaxAmount,
        minTerm: company.loanMinTerm,
        maxTerm: company.loanMaxTerm,
        processingFee: company.processingFee,
        info: company.about,
        processingTime: company.processingTime,
        contact: company.contact,
        address: company.address,
        rating: company.stars,
        reviews: company.reviews
      }
    });

    return {
      success,
      message,
      companies: formattedCompanies
    };

  } catch (err) {
    return {
      success: false,
      message: err.message
    };
  };
};

export { GET_LENDING_COMPANIES };