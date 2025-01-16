import { ApiVersion } from '@2060.io/service-agent-client'
import { DynamicModule, Type } from '@nestjs/common'

import { EventHandler } from './interfaces'

export interface MessageEventOptions {
  eventHandler?: Type<EventHandler>
  imports?: DynamicModule[]
  url?: string
  version?: ApiVersion
}

export interface ConnectionEventOptions {
  eventHandler?: Type<EventHandler>
  imports?: DynamicModule[]
}

export interface StatEventOptions {
  imports?: DynamicModule[]
  jmsOptions?: {
    host?: string
    port?: number
    queue?: string
    username?: string
    password?: string
    reconnectLimit?: number
    threads?: number
    delay?: number
  }
}

export interface CredentialOptions {
  imports?: DynamicModule[]
  url?: string
  version?: ApiVersion
}

export interface ModulesConfig {
  messages?: boolean
  connections?: boolean
  credentials?: boolean
  stats?: boolean
}

export interface EventsModuleOptions {
  modules: ModulesConfig
  options: {
    eventHandler?: Type<EventHandler>
    imports?: DynamicModule[]
    url?: string
    version?: ApiVersion
    jmsOptions?: {
      host?: string
      port?: number
      queue?: string
      username?: string
      password?: string
      reconnectLimit?: number
      threads?: number
      delay?: number
    }
  }
}
