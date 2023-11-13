import * as core from '@actions/core'
import {Logger} from '../src/logger'
import os from 'os'

const logSpy = jest.spyOn(core, 'info')
const cnSpy = jest.spyOn(process.stdout, 'write')
const isDebugSpy = jest.spyOn(core, 'isDebug')

const createCounter =
  (initial = 0) =>
  () =>
    initial++

let count = createCounter(1)

describe('logger', () => {
  beforeEach(() => {
    jest.resetModules()
    count = createCounter(1)

    cnSpy.mockImplementation(() => {
      // uncomment to debug
      // process.stderr.write('write:' + line + '\n');
      return false
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should log a message', () => {
    const logger = new Logger({
      level: Logger.LOG_LEVELS.INFO,
      outputs: [new Logger.OUTPUTS.CoreOutput()]
    })

    logger.info('test')

    logger.startContext('test')

    logger.info('test')

    logger.endContext()

    expect(logSpy).toHaveBeenCalledTimes(2)

    expect(logSpy).toHaveBeenNthCalledWith(count(), 'test')
    expect(logSpy).toHaveBeenNthCalledWith(count(), '[test] test')
  })

  it('should log different levels', () => {
    const logger = new Logger({
      level: Logger.LOG_LEVELS.INFO,
      outputs: [new Logger.OUTPUTS.CoreOutput()]
    })

    logger.error('test')
    logger.warning('test')
    logger.notice('test')
    logger.info('test')

    expect(cnSpy).toHaveBeenCalledTimes(4)

    expect(cnSpy).toHaveBeenNthCalledWith(count(), `::error::test${os.EOL}`)
    expect(cnSpy).toHaveBeenNthCalledWith(count(), `::warning::test${os.EOL}`)
    expect(cnSpy).toHaveBeenNthCalledWith(count(), `::notice::test${os.EOL}`)
    expect(cnSpy).toHaveBeenNthCalledWith(count(), `test${os.EOL}`)

    isDebugSpy.mockReturnValue(true)

    logger.debug('test')
    expect(cnSpy).toHaveBeenNthCalledWith(count(), `::debug::test${os.EOL}`)

    isDebugSpy.mockReturnValue(false)
    expect(cnSpy).toHaveBeenCalledTimes(5)
  })

  it('should not log messages above the log level', () => {
    const logger = new Logger({
      level: Logger.LOG_LEVELS.WARNING,
      outputs: [new Logger.OUTPUTS.CoreOutput()]
    })

    logger.error('test')
    logger.warning('test')
    logger.notice('test')
    logger.info('test')

    expect(cnSpy).toHaveBeenCalledTimes(2)

    expect(cnSpy).toHaveBeenNthCalledWith(count(), `::error::test${os.EOL}`)
    expect(cnSpy).toHaveBeenNthCalledWith(count(), `::warning::test${os.EOL}`)
  })

  it('should group messages', () => {
    const logger = new Logger({
      level: Logger.LOG_LEVELS.INFO,
      outputs: [new Logger.OUTPUTS.CoreOutput()]
    })

    logger.info('outside group')
    logger.startGroup('group')
    logger.info('within group')
    logger.endGroup()
    logger.info('outside group')

    expect(cnSpy).toHaveBeenNthCalledWith(count(), `outside group${os.EOL}`)
    expect(cnSpy).toHaveBeenNthCalledWith(count(), `::group::group${os.EOL}`)
    expect(cnSpy).toHaveBeenNthCalledWith(count(), `within group${os.EOL}`)
    expect(cnSpy).toHaveBeenNthCalledWith(count(), `::endgroup::${os.EOL}`)
    expect(cnSpy).toHaveBeenNthCalledWith(count(), `outside group${os.EOL}`)
  })

  it('should group messages without group support', () => {
    const logger = new Logger({
      level: Logger.LOG_LEVELS.INFO,
      outputs: [new Logger.OUTPUTS.CoreOutput(false)]
    })

    logger.info('outside group')
    logger.startGroup('group')
    logger.info('within group')
    logger.endGroup()
    logger.info('outside group')

    expect(cnSpy).toHaveBeenNthCalledWith(count(), `outside group${os.EOL}`)
    expect(cnSpy).toHaveBeenNthCalledWith(
      count(),
      `[group] within group${os.EOL}`
    )
    expect(cnSpy).toHaveBeenNthCalledWith(count(), `outside group${os.EOL}`)
  })

  it('supports complex grouping', () => {
    const logger = new Logger({
      level: Logger.LOG_LEVELS.INFO,
      outputs: [new Logger.OUTPUTS.CoreOutput()]
    })

    logger.startGroup('Hello group')
    logger.info('Hello, world!')
    logger.endGroup()

    logger.startContext('Outside context')
    logger.info('Hello, world!')

    logger.startGroup('Group')
    logger.startContext('Inside context')
    logger.info('Hello, world!')
    logger.startContext('Inside context 2')
    logger.info('Hello, world!')
    logger.endContext()
    logger.info('Hello, world!')
    logger.endGroup()

    logger.info('Hello, world!')
    logger.endContext()
    logger.info('Hello, world!')

    expect(cnSpy).toHaveBeenNthCalledWith(
      count(),
      `::group::Hello group${os.EOL}`
    )
    expect(cnSpy).toHaveBeenNthCalledWith(count(), `Hello, world!${os.EOL}`)
    expect(cnSpy).toHaveBeenNthCalledWith(count(), `::endgroup::${os.EOL}`)
    expect(cnSpy).toHaveBeenNthCalledWith(
      count(),
      `[Outside context] Hello, world!${os.EOL}`
    )
    expect(cnSpy).toHaveBeenNthCalledWith(
      count(),
      `::group::[Outside context] Group${os.EOL}`
    )
    expect(cnSpy).toHaveBeenNthCalledWith(
      count(),
      `[Inside context] Hello, world!${os.EOL}`
    )
    expect(cnSpy).toHaveBeenNthCalledWith(
      count(),
      `[Inside context] [Inside context 2] Hello, world!${os.EOL}`
    )
    expect(cnSpy).toHaveBeenNthCalledWith(
      count(),
      `[Inside context] Hello, world!${os.EOL}`
    )
    expect(cnSpy).toHaveBeenNthCalledWith(count(), `::endgroup::${os.EOL}`)
    expect(cnSpy).toHaveBeenNthCalledWith(
      count(),
      `[Outside context] Hello, world!${os.EOL}`
    )
    expect(cnSpy).toHaveBeenNthCalledWith(count(), `Hello, world!${os.EOL}`)
  })

  it('supports locking contexts', () => {
    const logger = new Logger({
      level: Logger.LOG_LEVELS.INFO,
      outputs: [new Logger.OUTPUTS.CoreOutput()]
    })

    logger.info('Hello, world!')

    logger.withContextSync('Locked context', () => {
      logger.info('Hello, world!')

      logger.startContext('Not locked context')

      logger.info('Hello, world!')

      // removes second context
      logger.endContext()

      // has no effect
      logger.endContext()

      logger.info('Hello, world!')

      logger.withContextSync('Locked context 2', () => {
        logger.info('Hello, world!')
      })

      logger.info('Hello, world!')
    })

    logger.info('Hello, world!')

    expect(cnSpy).toHaveBeenNthCalledWith(count(), `Hello, world!${os.EOL}`)
    expect(cnSpy).toHaveBeenNthCalledWith(
      count(),
      `[Locked context] Hello, world!${os.EOL}`
    )
    expect(cnSpy).toHaveBeenNthCalledWith(
      count(),
      `[Locked context] [Not locked context] Hello, world!${os.EOL}`
    )
    expect(cnSpy).toHaveBeenNthCalledWith(
      count(),
      `[Locked context] Hello, world!${os.EOL}`
    )
    expect(cnSpy).toHaveBeenNthCalledWith(
      count(),
      `[Locked context] [Locked context 2] Hello, world!${os.EOL}`
    )
    expect(cnSpy).toHaveBeenNthCalledWith(
      count(),
      `[Locked context] Hello, world!${os.EOL}`
    )
    expect(cnSpy).toHaveBeenNthCalledWith(count(), `Hello, world!${os.EOL}`)
  })

  it('supports locking contexts in async functions', async () => {
    const logger = new Logger({
      level: Logger.LOG_LEVELS.INFO,
      outputs: [new Logger.OUTPUTS.CoreOutput()]
    })

    logger.info('Hello, world!')

    await logger.withContext('Locked context', async () => {
      logger.info('Hello, world!')

      logger.startContext('Not locked context')

      logger.info('Hello, world!')

      // removes second context
      logger.endContext()

      // has no effect
      logger.endContext()

      logger.info('Hello, world!')

      await logger.withContext('Locked context 2', () => {
        logger.info('Hello, world!')
      })

      logger.info('Hello, world!')
    })

    logger.withGroupSync('Locked group', () => {
      logger.info('Message in locked group')
    })

    expect(cnSpy).toHaveBeenNthCalledWith(count(), `Hello, world!${os.EOL}`)
    expect(cnSpy).toHaveBeenNthCalledWith(
      count(),
      `[Locked context] Hello, world!${os.EOL}`
    )
    expect(cnSpy).toHaveBeenNthCalledWith(
      count(),
      `[Locked context] [Not locked context] Hello, world!${os.EOL}`
    )
    expect(cnSpy).toHaveBeenNthCalledWith(
      count(),
      `[Locked context] Hello, world!${os.EOL}`
    )
    expect(cnSpy).toHaveBeenNthCalledWith(
      count(),
      `[Locked context] [Locked context 2] Hello, world!${os.EOL}`
    )
    expect(cnSpy).toHaveBeenNthCalledWith(
      count(),
      `[Locked context] Hello, world!${os.EOL}`
    )
    expect(cnSpy).toHaveBeenNthCalledWith(
      count(),
      `::group::Locked group${os.EOL}`
    )
    expect(cnSpy).toHaveBeenNthCalledWith(
      count(),
      `Message in locked group${os.EOL}`
    )
    expect(cnSpy).toHaveBeenNthCalledWith(count(), `::endgroup::${os.EOL}`)
  })

  it('supports locking groups', async () => {
    const logger = new Logger({
      level: Logger.LOG_LEVELS.INFO,
      outputs: [new Logger.OUTPUTS.CoreOutput()]
    })

    await logger.withGroup('Locked group', async () => {
      logger.info('Message in locked group')

      await logger.withContext('Locked context', async () => {
        logger.info('Message in locked group in locked context')

        await logger.withContext('Locked context 2', () => {
          logger.info('Message in locked group in locked context 2')
        })

        // has no effect
        logger.endContext()

        logger.info('Message in locked group in locked context')
      })

      // has no effect
      logger.endGroup()

      logger.info('Message in locked group')
    })

    logger.info('Message outside locked group')

    expect(cnSpy).toHaveBeenNthCalledWith(
      count(),
      `::group::Locked group${os.EOL}`
    )
    expect(cnSpy).toHaveBeenNthCalledWith(
      count(),
      `Message in locked group${os.EOL}`
    )
    expect(cnSpy).toHaveBeenNthCalledWith(
      count(),
      `[Locked context] Message in locked group in locked context${os.EOL}`
    )
    expect(cnSpy).toHaveBeenNthCalledWith(
      count(),
      `[Locked context] [Locked context 2] Message in locked group in locked context 2${os.EOL}`
    )
    expect(cnSpy).toHaveBeenNthCalledWith(
      count(),
      `[Locked context] Message in locked group in locked context${os.EOL}`
    )
    expect(cnSpy).toHaveBeenNthCalledWith(
      count(),
      `Message in locked group${os.EOL}`
    )
    expect(cnSpy).toHaveBeenNthCalledWith(count(), `::endgroup::${os.EOL}`)
    expect(cnSpy).toHaveBeenNthCalledWith(
      count(),
      `Message outside locked group${os.EOL}`
    )
  })

  it('supports sequential group declaration', () => {
    const logger = new Logger({
      level: Logger.LOG_LEVELS.INFO,
      outputs: [new Logger.OUTPUTS.CoreOutput(false)]
    })

    logger.startGroup('group 1')

    logger.startContext('context 1')

    logger.startGroup('group 2')

    logger.info('Hello, world!')

    expect(cnSpy).toHaveBeenNthCalledWith(
      count(),
      `[group 2] Hello, world!${os.EOL}`
    )
  })
})
