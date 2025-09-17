import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from "./screens/WelcomeScreen.js";
import LoginScreen from "./screens/LoginScreen.js";
import CreateAccountScreen from "./screens/CreateAccountScreen.js";
import DashboardScreen from "./screens/DashboardScreen.js";
import LoanApplicationScreen from "./screens/LoanApplicationScreen.js";
import LoansScreen from "./screens/LoansScreen.js";
import MyLoanScreen from "./screens/MyLoanScreen.js";
import TransactionsScreen from "./screens/TransactionScreen.js";
import TransferScreen from "./screens/TransferScreen";
import QRPayScreen from "./screens/QRPayScreen";
import CashInScreen from "./screens/CashInScreen";
import PayNowScreen from "./screens/PayNowScreen";
import ProfileScreen from "./screens/ProfileScreen";

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
          name="Profile" 
          component={ProfileScreen} 
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
