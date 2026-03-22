import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../hooks/useAuth'
import LoadingOverlay from '../components/LoadingOverlay'
import LoginScreen from '../screens/LoginScreen'
import DashboardScreen from '../screens/DashboardScreen'
import PatientsScreen from '../screens/PatientsScreen'
import AppointmentsScreen from '../screens/AppointmentsScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#0f766e',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          borderTopColor: '#e2e8f0',
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Dashboard: 'grid-outline',
            Patients: 'people-outline',
            Appointments: 'calendar-outline',
          }
          return <Ionicons name={icons[route.name]} size={size} color={color} />
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Patients" component={PatientsScreen} />
      <Tab.Screen name="Appointments" component={AppointmentsScreen} />
    </Tab.Navigator>
  )
}

const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingOverlay label="Restoring staff session..." />
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <Stack.Screen name="MainTabs" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default AppNavigator
