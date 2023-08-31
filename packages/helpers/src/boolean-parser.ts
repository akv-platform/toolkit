/**
 * Parses a boolean value from a string
 * @param value string or boolean
 * @param strict if true will act according to YAML 1.2 "Core Schema" specification
 * throwing error on invalid values, if false will evaluate any string or number to boolean:
 * number is converted directly to boolean, string is converted to number (if possible) and then to boolean
 * otherwise converts string directly to boolean
 * @returns boolean
 */
export const parseBoolean = (
  value: string | boolean | number,
  strict = true
): boolean => {
  if (typeof value === 'boolean') {
    return value
  }

  const trueValue = ['true', 'True', 'TRUE']
  const falseValue = ['false', 'False', 'FALSE']

  if (trueValue.includes(String(value))) return true
  if (falseValue.includes(String(value))) return false

  if (strict) {
    throw new TypeError(
      `Value does not meet YAML 1.2 "Core Schema" specification: ${value}\n` +
        "Support boolean string list: `'true' | 'True' | 'TRUE' | 'false' | 'False' | 'FALSE'`"
    )
  }

  if (typeof value === 'string') {
    if (/^-?0+(\.?0+)?$/.test(value)) return false
  }

  return !!value
}
