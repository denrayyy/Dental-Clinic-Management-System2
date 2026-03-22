import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'

const LoadingOverlay = ({ label = 'Loading...' }) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0f766e" />
      <Text style={styles.text}>{label}</Text>
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
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
  },
})

export default LoadingOverlay
