import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from "C:/Users/user/my-expo-app/screens/WelcomeScreen.js";
import LoginScreen from "C:/Users/user/my-expo-app/screens/LoginScreen.js";
import CreateAccountScreen from "C:/Users/user/my-expo-app/screens/CreateAccountScreen.js";
import DashboardScreen from "C:/Users/user/my-expo-app/screens/DashboardScreen.js";
import LoanApplicationScreen from "C:/Users/user/my-expo-app/screens/LoanApplicationScreen.js";
import LoansScreen from "C:/Users/user/my-expo-app/screens/LoansScreen.js";
import MyLoanScreen from "C:/Users/user/my-expo-app/screens/MyLoanScreen.js";
import TransactionsScreen from "C:/Users/user/my-expo-app/screens/TransactionScreen.js";
import TransferScreen from "C:/Users/user/my-expo-app/screens/TransferScreen";
import QRPayScreen from "C:/Users/user/my-expo-app/screens/QRPayScreen";
import CashInScreen from "C:/Users/user/my-expo-app/screens/CashInScreen";
import PayNowScreen from "C:/Users/user/my-expo-app/screens/PayNowScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Authentication */}
        <Stack.Screen 
          name="Welcome" 
          component={WelcomeScreen} 
        />
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
        />
        <Stack.Screen 
          name="CreateAccount" 
          component={CreateAccountScreen} 
        />

        {/* Main App Screens */}
        <Stack.Screen 
          name="Dashboard" 
          component={DashboardScreen} 
        />
        <Stack.Screen 
          name="Loans" 
          component={LoansScreen} 
        />
        <Stack.Screen 
          name="MyLoan" 
          component={MyLoanScreen} 
        />
        <Stack.Screen 
          name="LoanApplication" 
          component={LoanApplicationScreen} 
        />
        <Stack.Screen 
          name="Transactions" 
          component={TransactionsScreen} 
        />
        
        {/* Payment Related Screens */}
        <Stack.Screen 
          name="PayNow" 
          component={PayNowScreen} 
        />
        <Stack.Screen 
          name="Transfer" 
          component={TransferScreen} 
        />
        <Stack.Screen 
          name="PayQR" 
          component={QRPayScreen} 
        />
        <Stack.Screen 
          name="CashIn" 
          component={CashInScreen} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}