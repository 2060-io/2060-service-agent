import { DynamicModule, Module } from '@nestjs/common'

import { AgentController } from './controllers/agent/AgentController'
import { ConnectionController } from './controllers/connections/ConnectionController'
import { CredentialTypesController } from './controllers/credentials/CredentialTypeController'
import { InvitationController } from './controllers/invitation/InvitationController'
import { QrController } from './controllers/invitation/QrController'
import { MessageController } from './controllers/message/MessageController'
import { PresentationsController } from './controllers/presentations/PresentationsController'
import { VCAuthNController } from './controllers/vcauthn/VCAuthNController'
import { AgentService } from './services/AgentService'
import { UrlShorteningService } from './services/UrlShorteningService'
import { ServiceAgent } from './utils/ServiceAgent'

@Module({})
export class ServiceAgentModule {
  static register(agent: ServiceAgent): DynamicModule {
    return {
      module: ServiceAgentModule,
      controllers: [
        AgentController,
        ConnectionController,
        CredentialTypesController,
        MessageController,
        PresentationsController,
        InvitationController,
        QrController,
        VCAuthNController,
      ],
      providers: [
        {
          provide: 'AGENT',
          useValue: agent,
        },
        AgentService,
        UrlShorteningService,
      ],
      exports: [AgentService],
    }
  }
}

export class AppModule {}
