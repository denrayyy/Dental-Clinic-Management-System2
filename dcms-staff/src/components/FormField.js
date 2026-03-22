import { StyleSheet, Text, TextInput, View } from 'react-native'

const FormField = ({ label, ...props }) => {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor="#94a3b8"
        style={styles.input}
        {...props}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#fff',
    borderColor: '#cbd5e1',
    borderRadius: 10,
    borderWidth: 1,
    color: '#0f172a',
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  label: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  wrapper: {
    marginBottom: 12,
  },
})

export default FormField
