import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import LoginScreen from '../screens/LoginScreen'
import DashboardScreen from '../screens/DashboardScreen'
import PatientsScreen from '../screens/PatientsScreen'
import AppointmentsScreen from '../screens/AppointmentsScreen'
import ProfileScreen from '../screens/ProfileScreen'
import TermsScreen from '../screens/TermsScreen'
import DentistDashboardScreen from '../screens/dentist/DentistDashboardScreen'
import DentistAppointmentsScreen from '../screens/dentist/DentistAppointmentsScreen'
import DentistPatientsScreen from '../screens/dentist/DentistPatientsScreen'
import DentistProfileScreen from '../screens/dentist/DentistProfileScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

const LoadingScreen = () => {
  const { colors } = useTheme()

	return (
		<View style={[styles.loadingScreen, { backgroundColor: colors.screenBg }]}>
			<ActivityIndicator size="large" color="#0f766e" />
		</View>
	)
}

const StaffTabs = () => {
	const { colors } = useTheme()

	return (
		<Tab.Navigator
			screenOptions={({ route }) => ({
				tabBarActiveTintColor: '#0f766e',
				tabBarInactiveTintColor: colors.tabInactive,
				tabBarStyle: {
					backgroundColor: colors.panelBg,
					borderTopColor: colors.line,
				},
				tabBarLabelStyle: styles.tabLabel,
				headerShown: false,
				tabBarIcon: ({ color, size }) => {
					let iconName = 'grid-outline'

					if (route.name === 'Dashboard') {
						iconName = 'grid-outline'
					} else if (route.name === 'Patients') {
						iconName = 'people-outline'
					} else if (route.name === 'Appointments') {
						iconName = 'calendar-outline'
					} else if (route.name === 'Profile') {
						iconName = 'person-circle-outline'
					}

					return <Ionicons name={iconName} size={size} color={color} />
				},
			})}
		>
			<Tab.Screen name="Dashboard" component={DashboardScreen} />
			<Tab.Screen name="Patients" component={PatientsScreen} />
			<Tab.Screen name="Appointments" component={AppointmentsScreen} />
			<Tab.Screen name="Profile" component={ProfileScreen} />
		</Tab.Navigator>
	)
}

const DentistTabs = () => {
	const { colors } = useTheme()

	return (
		<Tab.Navigator
			screenOptions={({ route }) => ({
				tabBarActiveTintColor: '#0f766e',
				tabBarInactiveTintColor: colors.tabInactive,
				tabBarStyle: {
					backgroundColor: colors.panelBg,
					borderTopColor: colors.line,
				},
				tabBarLabelStyle: styles.tabLabel,
				headerShown: false,
				tabBarIcon: ({ color, size }) => {
					let iconName = 'grid-outline'

					if (route.name === 'Dashboard') {
						iconName = 'grid-outline'
					} else if (route.name === 'Appointments') {
						iconName = 'calendar-outline'
					} else if (route.name === 'Patients') {
						iconName = 'people-outline'
					} else if (route.name === 'Profile') {
						iconName = 'person-circle-outline'
					}

					return <Ionicons name={iconName} size={size} color={color} />
				},
			})}
		>
			<Tab.Screen name="Dashboard" component={DentistDashboardScreen} />
			<Tab.Screen name="Appointments" component={DentistAppointmentsScreen} />
			<Tab.Screen name="Patients" component={DentistPatientsScreen} />
			<Tab.Screen name="Profile" component={DentistProfileScreen} />
		</Tab.Navigator>
	)
}

const AppNavigator = () => {
	const { isAuthenticated, isLoading, profile, requiresTermsAcceptance } = useAuth()
	const { navigationTheme } = useTheme()
	const role = profile?.role || 'staff'

	if (isLoading) {
		return <LoadingScreen />
	}

	return (
		<NavigationContainer theme={navigationTheme}>
			<Stack.Navigator screenOptions={{ headerShown: false }}>
				{isAuthenticated ? (
					requiresTermsAcceptance ? (
						<Stack.Screen
							name="TermsGate"
							component={TermsScreen}
							initialParams={{ docType: 'terms', requireAcceptance: true }}
						/>
					) : role === 'dentist' ? (
						<Stack.Screen name="DentistTabs" component={DentistTabs} />
					) : (
						<Stack.Screen name="StaffTabs" component={StaffTabs} />
					)
				) : (
					<Stack.Screen name="Login" component={LoginScreen} />
				)}
				<Stack.Screen name="TermsScreen" component={TermsScreen} />
			</Stack.Navigator>
		</NavigationContainer>
	)
}

const styles = StyleSheet.create({
	loadingScreen: {
		alignItems: 'center',
		flex: 1,
		justifyContent: 'center',
	},
	tabLabel: {
		fontSize: 12,
		fontWeight: '700',
	},
})

export default AppNavigator
