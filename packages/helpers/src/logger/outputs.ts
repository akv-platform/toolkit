import * as core from '@actions/core'
import {Output} from './types'
import {Logger} from './logger'

export class CoreOutput implements Output {
  constructor(private enableGrouping = true) {}

  message: Output['message'] = ({
    contexts,
    activeGroup,
    level,
    payload,
    properties,
    isDebug
  }) => {
    let prefix = ''

    if (this.enableGrouping) {
      for (let i = activeGroup + 1; i < contexts.length; i++) {
        prefix += `[${contexts[i].value.toString()}] `
      }
    } else {
      for (const context of contexts) {
        prefix += `[${context.value.toString()}] `
      }
    }

    const output = `${prefix}${payload.toString()}`.trim()

    if (isDebug) {
      core.debug(output)

      return
    }

    if (level === Logger.LOG_LEVELS.INFO) {
      core.info(output)

      return
    }

    if (level === Logger.LOG_LEVELS.NOTICE) {
      core.notice(output)

      return
    }

    if (level === Logger.LOG_LEVELS.WARNING) {
      core.warning(output, properties)

      return
    }

    if (level === Logger.LOG_LEVELS.ERROR) {
      core.error(output, properties)

      return
    }
  }

  update: Output['update'] = ({contexts, type, title}) => {
    if (type === 'group-start' && this.enableGrouping) {
      let prefix = ''

      for (const context of contexts) {
        if (context.isGroup) {
          break
        }

        prefix += `[${context.value.toString()}] `
      }

      core.startGroup((prefix + (title ?? '')).trim())

      return
    }

    if (type === 'group-end' && this.enableGrouping) {
      core.endGroup()

      return
    }
  }
}
