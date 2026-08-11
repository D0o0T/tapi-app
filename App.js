import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SearchScreen from './SearchScreen';
import TaskDetailScreen from './TaskDetailScreen';
import BillDetailScreen from './BillDetailScreen';
import ChatDetailScreen from './ChatDetailScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator
          initialRouteName="Search"
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: '#F2F2F7' },
          }}
        >
          <Stack.Screen name="Search" component={SearchScreen} />
          <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
          <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
          <Stack.Screen name="BillDetail" component={BillDetailScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}