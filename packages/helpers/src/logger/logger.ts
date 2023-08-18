import {AnnotationProperties} from '@actions/core'
import {LogContext, LogLevel, Output} from './types'
import {LOG_LEVELS} from './static'
import {CoreOutput} from './outputs'

export class Logger {
  static OUTPUTS = {
    CoreOutput
  }

  static LOG_LEVELS = {
    [LOG_LEVELS[0]]: 0,
    [LOG_LEVELS[1]]: 1,
    [LOG_LEVELS[2]]: 2,
    [LOG_LEVELS[3]]: 3
  } as const

  private logLevel: LogLevel = Logger.LOG_LEVELS.INFO
  private contexts: LogContext[] = []
  private outputs: Output[] = []

  private activeGroup = -1
  private lockedContexts: number[] = []
  private groupLocked = false

  constructor(options: {level: LogLevel; outputs: Output[]}) {
    this.logLevel = options.level
    this.outputs = options.outputs
  }

  startContext = (title: string): void => {
    this.contexts.push({value: title, isGroup: false})

    for (const output of this.outputs) {
      output.update({
        contexts: this.contexts,
        activeGroup: this.activeGroup,
        type: 'context-start',
        title
      })
    }
  }

  startGroup = (title: string): void => {
    if (this.groupLocked) return

    if (this.activeGroup !== -1) {
      this.contexts.splice(this.activeGroup)
    }

    this.contexts.push({value: title, isGroup: true})
    this.activeGroup = this.contexts.length - 1

    for (const output of this.outputs) {
      output.update({
        contexts: this.contexts,
        activeGroup: this.activeGroup,
        type: 'group-start',
        title
      })
    }
  }

  endContext = (): void => {
    const lockedContext = this.lockedContexts.at(-1)

    if (
      lockedContext !== undefined &&
      this.contexts.length - 1 <= lockedContext
    ) {
      return
    }

    const latestContext = this.contexts.at(-1)

    if (latestContext === undefined) return
    if (latestContext.isGroup) return

    this.contexts.pop()

    for (const output of this.outputs) {
      output.update({
        contexts: this.contexts,
        activeGroup: this.activeGroup,
        type: 'context-end'
      })
    }
  }

  endGroup = (): void => {
    if (this.groupLocked) return
    if (this.activeGroup === -1) return

    this.contexts.splice(this.activeGroup)
    this.activeGroup = -1

    for (const output of this.outputs) {
      output.update({
        contexts: this.contexts,
        activeGroup: this.activeGroup,
        type: 'group-end'
      })
    }
  }

  async withContext<T>(title: string, fn: () => T): Promise<T> {
    this.startContext(title)
    this.lockedContexts.push(this.contexts.length - 1)

    try {
      return await new Promise(resolve => resolve(fn()))
    } finally {
      this.contexts.splice((this.lockedContexts.pop() ?? -1) + 1)
      this.endContext()
    }
  }

  withContextSync<T>(title: string, fn: () => T): T {
    this.startContext(title)
    this.lockedContexts.push(this.contexts.length - 1)

    try {
      return fn()
    } finally {
      this.contexts.splice((this.lockedContexts.pop() ?? -1) + 1)
      this.endContext()
    }
  }

  async withGroup<T>(title: string, fn: () => T): Promise<T> {
    if (this.groupLocked) return await new Promise(() => fn())

    this.startGroup(title)
    this.groupLocked = true

    try {
      return await new Promise(resolve => resolve(fn()))
    } finally {
      this.groupLocked = false
      this.endGroup()
    }
  }

  withGroupSync<T>(title: string, fn: () => T): T {
    if (this.groupLocked) return fn()

    this.startGroup(title)
    this.groupLocked = true

    try {
      return fn()
    } finally {
      this.groupLocked = false
      this.endGroup()
    }
  }

  log = (
    level: LogLevel,
    message: string | Error,
    properties?: AnnotationProperties
  ): void => {
    if (level > this.logLevel) return

    for (const output of this.outputs) {
      output.message({
        contexts: this.contexts,
        activeGroup: this.activeGroup,
        level,
        payload: message,
        properties
      })
    }
  }

  debug = (message: string): void => {
    for (const output of this.outputs) {
      output.message({
        contexts: this.contexts,
        activeGroup: this.activeGroup,
        level: 0,
        payload: message,
        isDebug: true
      })
    }
  }

  error = (
    message: string | Error,
    properties?: AnnotationProperties
  ): void => {
    this.log(Logger.LOG_LEVELS.ERROR, message, properties)
  }

  warning = (
    message: string | Error,
    properties?: AnnotationProperties
  ): void => {
    this.log(Logger.LOG_LEVELS.WARNING, message, properties)
  }

  notice = (message: string): void => {
    this.log(Logger.LOG_LEVELS.NOTICE, message)
  }

  info = (message: string): void => {
    this.log(Logger.LOG_LEVELS.INFO, message)
  }
}
