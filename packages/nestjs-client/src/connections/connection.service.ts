import { ConnectionStateUpdated, ExtendedDidExchangeState } from '@2060.io/service-agent-model'
import { Inject, Injectable, Logger, Optional } from '@nestjs/common'

import { EventHandler } from '../interfaces'

import { CONNECTIONS_EVENT } from './connection.config'
import { ConnectionEntity } from './connection.entity'
import { ConnectionsRepository } from './connection.repository'

@Injectable()
export class ConnectionsEventService {
  private readonly logger = new Logger(ConnectionsEventService.name)

  constructor(
    @Inject()
    private readonly repository: ConnectionsRepository,
    @Optional() @Inject(CONNECTIONS_EVENT) private eventHandler?: EventHandler,
  ) {}

  async update(event: ConnectionStateUpdated): Promise<any> {
    switch (event.state) {
      case ExtendedDidExchangeState.Completed:
        const newConnection = new ConnectionEntity()
        newConnection.id = event.connectionId
        newConnection.createdTs = event.timestamp
        newConnection.status = event.state
        await this.repository.create(newConnection)

        if (this.eventHandler) {
          await this.eventHandler.newConnection(event)
        }
        break
      case ExtendedDidExchangeState.Terminated:
        await this.repository.updateStatus(event.connectionId, event.state)

        if (this.eventHandler) {
          await this.eventHandler.closeConnection(event)
        }
        break
      default:
        break
    }

    return null
  }
}
