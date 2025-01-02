import { ApiClient, ApiVersion } from '@2060.io/service-agent-client'
import {
  CredentialReceptionMessage,
  CredentialState,
  MessageReceived,
  ReceiptsMessage,
} from '@2060.io/service-agent-model'
import { Inject, Injectable, Logger, Optional } from '@nestjs/common'
import { MessageState } from 'credo-ts-receipts'

import { CredentialEventService } from '../credentials'
import { EventHandler } from '../interfaces'
import { MessageEventOptions } from '../types'

@Injectable()
export class MessageEventService {
  private readonly logger = new Logger(MessageEventService.name)
  private readonly url: string
  private readonly version: ApiVersion
  private readonly apiClient: ApiClient

  constructor(
    @Inject('EVENT_MODULE_OPTIONS') private options: MessageEventOptions,
    @Optional() @Inject('MESSAGE_EVENT') private eventHandler?: EventHandler,
    @Optional() @Inject() private credentialEvent?: CredentialEventService,
  ) {
    if (!options.url) throw new Error(`For this module to be used the value url must be added`)
    this.url = options.url
    this.version = options.version ?? ApiVersion.V1

    if (!credentialEvent)
      this.logger.warn(
        `To handle credential events and their revocation, make sure to initialize the CredentialEventModule.`,
      )

    this.apiClient = new ApiClient(this.url, this.version)

    this.logger.debug(`Initialized with url: ${this.url}, version: ${this.version}`)
  }

  async received(event: MessageReceived): Promise<void> {
    const message = event.message
    const body = new ReceiptsMessage({
      connectionId: message.connectionId,
      receipts: [
        {
          messageId: message.id,
          state: MessageState.Viewed,
          timestamp: new Date(),
        },
      ],
    })
    this.logger.debug(`messageReceived: sent receipts: ${JSON.stringify(body)}`)

    await this.apiClient.messages.send(body)

    if (this.eventHandler) {
      if (message instanceof CredentialReceptionMessage) {
        try {
          const isCredentialDone = message.state === CredentialState.Done
          if (this.credentialEvent && message.threadId) {
            if (isCredentialDone) this.credentialEvent.accept(message.connectionId, message.threadId)
            else this.credentialEvent.reject(message.connectionId, message.threadId)
          }
        } catch (error) {
          this.logger.error(`Cannot create the registry: ${error}`)
        }
      }

      await this.eventHandler.inputMessage(message)
    }
  }

  async updated(): Promise<void> {}
}
