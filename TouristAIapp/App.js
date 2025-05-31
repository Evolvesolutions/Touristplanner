// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { SafeAreaView, StatusBar } from 'react-native';
import TouristRecommendationScreen from './src/screen/HomeScreen';
import WelcomeScreen from './src/screen/welcome';
// import TouristRecommendationScreen from '.screens/TouristRecommendationScreen';
const Stack = createNativeStackNavigator();


const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Welcome">
        <Stack.Screen
          name="Welcome"
          component={WelcomeScreen} />
        <Stack.Screen
          name="TouristPlanner"
          component={TouristRecommendationScreen}
          options={{ title: 'Tourist Route Planner' }}
        />
      </Stack.Navigator>
    </NavigationContainer>

  );
};

export default App;



