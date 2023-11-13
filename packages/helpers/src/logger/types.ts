import {AnnotationProperties} from '@actions/core'

export type LogLevel = 0 | 1 | 2 | 3

export type LogContext = {
  value: string | Error
  isGroup: boolean
}

export interface Output {
  message: (messageData: {
    contexts: LogContext[]
    activeGroup: number
    level: LogLevel
    payload: string | Error
    properties?: AnnotationProperties
    isDebug?: boolean
  }) => void

  update: (updateData: {
    contexts: LogContext[]
    activeGroup: number
    type: 'context-start' | 'group-start' | 'context-end' | 'group-end'
    title?: string
  }) => void
}
