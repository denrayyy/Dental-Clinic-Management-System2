import { StyleSheet, Text, TextInput, View } from 'react-native'
import { useTheme } from '../hooks/useTheme'

const FormField = ({
  label,
  inputStyle,
  labelStyle,
  inputTextColor,
  inputPlaceholderColor,
  ...props
}) => {
  const { colors } = useTheme()

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: colors.labelText }, labelStyle]}>{label}</Text>
      <TextInput
        placeholderTextColor={inputPlaceholderColor || colors.inputPlaceholder}
        style={[
          styles.input,
          {
            backgroundColor: colors.inputBg,
            borderColor: colors.inputBorder,
            color: colors.inputText,
          },
          inputStyle,
          inputTextColor ? { color: inputTextColor } : null,
        ]}
        {...props}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  input: {
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  wrapper: {
    marginBottom: 12,
  },
})

export default FormField
