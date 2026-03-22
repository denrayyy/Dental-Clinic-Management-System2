import { StyleSheet, Text, View } from 'react-native'

const StatCard = ({ label, value, color = '#0f766e' }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    minHeight: 96,
    padding: 14,
  },
  label: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  value: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 8,
  },
})

export default StatCard
