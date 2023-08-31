import {parseBoolean} from '../src/helpers'

describe('parseBoolean', () => {
  it('Passes real boolean along', () => {
    expect(parseBoolean(true)).toEqual(true)
    expect(parseBoolean(false)).toEqual(false)
  })

  it('Parses boolean according to YAML 1.2 "Core Schema" specification', () => {
    expect(parseBoolean('true')).toEqual(true)
    expect(parseBoolean('True')).toEqual(true)
    expect(parseBoolean('TRUE')).toEqual(true)
    expect(parseBoolean('false')).toEqual(false)
    expect(parseBoolean('False')).toEqual(false)
    expect(parseBoolean('FALSE')).toEqual(false)

    expect(() => parseBoolean('0')).toThrowError(
      'Value does not meet YAML 1.2 "Core Schema" specification: 0\n' +
        "Support boolean string list: `'true' | 'True' | 'TRUE' | 'false' | 'False' | 'FALSE'`"
    )

    expect(() => parseBoolean(0)).toThrowError(
      'Value does not meet YAML 1.2 "Core Schema" specification: 0\n' +
        "Support boolean string list: `'true' | 'True' | 'TRUE' | 'false' | 'False' | 'FALSE'`"
    )
  })

  it('Parses boolean according to YAML 1.2 "Core Schema" specification in non-strict mode', () => {
    expect(parseBoolean('true', false)).toEqual(true)
    expect(parseBoolean('True', false)).toEqual(true)
    expect(parseBoolean('TRUE', false)).toEqual(true)
    expect(parseBoolean('false', false)).toEqual(false)
    expect(parseBoolean('False', false)).toEqual(false)
    expect(parseBoolean('FALSE', false)).toEqual(false)
  })

  it('Parses boolean from any string or number', () => {
    expect(parseBoolean('1', false)).toEqual(true)
    expect(parseBoolean('0', false)).toEqual(false)
    expect(parseBoolean('-0', false)).toEqual(false)
    expect(parseBoolean('0.0', false)).toEqual(false)
    expect(parseBoolean('-0.0', false)).toEqual(false)
    expect(parseBoolean('00', false)).toEqual(false)
    expect(parseBoolean('0.000', false)).toEqual(false)
    expect(parseBoolean('0.1', false)).toEqual(true)
    expect(parseBoolean('1.0', false)).toEqual(true)
    expect(parseBoolean('1.1', false)).toEqual(true)
    expect(parseBoolean((999).toString(16), false)).toEqual(true)
    expect(parseBoolean((0).toString(32), false)).toEqual(false)
  })
})
