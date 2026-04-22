import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { useTheme } from '../hooks/useTheme'

const LoadingOverlay = ({ label = 'Loading...' }) => {
  const { colors } = useTheme()

  return (
    <View style={[styles.container, { backgroundColor: colors.screenBg }]}>
      <ActivityIndicator size="large" color="#0f766e" />
      <Text style={[styles.text, { color: colors.labelText }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    gap: 10,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
})

export default LoadingOverlay
