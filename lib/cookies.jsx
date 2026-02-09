import * as SecureStore from 'expo-secure-store';

// Saves the token to the secure store
const saveToken = async (token) => {
  await SecureStore.setItemAsync('token', token, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED, // iOS option
  });
}

// Retrieves the token from the secure store
const getToken = async () => {
  const token = await SecureStore.getItemAsync('token');
  return token;
}

export { saveToken, getToken };