import {
  Agent,
  AgentDependencies,
  AutoAcceptCredential,
  AutoAcceptProof,
  ConnectionsModule,
  CredentialsModule,
  DependencyManager,
  InitConfig,
  ProofsModule,
  V2CredentialProtocol,
  V2ProofProtocol,
} from '@credo-ts/core'
import { ActionMenuModule } from '@credo-ts/action-menu'
import { QuestionAnswerModule } from '@credo-ts/question-answer'
import { MediaSharingModule } from 'credo-ts-media-sharing'
import { ReceiptsModule } from 'credo-ts-receipts'
import { UserProfileModule } from 'credo-ts-user-profile'
import { AskarModule } from '@credo-ts/askar'
import {
  AnonCredsCredentialFormatService,
  AnonCredsModule,
  AnonCredsProofFormatService,
  LegacyIndyCredentialFormatService,
  LegacyIndyProofFormatService,
} from '@credo-ts/anoncreds'
import { DidWebAnonCredsRegistry } from 'credo-ts-didweb-anoncreds'
import '@hyperledger/anoncreds-nodejs'
import '@hyperledger/aries-askar-nodejs'
import { ariesAskar } from '@hyperledger/aries-askar-nodejs'
import { anoncreds } from '@hyperledger/anoncreds-nodejs'

type ServiceAgentModules = {
  askar: AskarModule
  anoncreds: AnonCredsModule
  actionMenu: ActionMenuModule
  connections: ConnectionsModule
  credentials: CredentialsModule<[V2CredentialProtocol<[LegacyIndyCredentialFormatService, AnonCredsCredentialFormatService]>]>
  proofs: ProofsModule<[V2ProofProtocol<[LegacyIndyProofFormatService, AnonCredsProofFormatService]>]>
  media: MediaSharingModule
  questionAnswer: QuestionAnswerModule
  receipts: ReceiptsModule
  userProfile: UserProfileModule
}

interface AgentOptions<ServiceAgentModules> {
  config: InitConfig
  modules?: ServiceAgentModules
  dependencies: AgentDependencies
}

export class ServiceAgent extends Agent<ServiceAgentModules> {
  public did?: string

  public constructor(options: AgentOptions<ServiceAgentModules>, did?: string, dependencyManager?: DependencyManager) {
    super(options)
    this.did = did
  }
}

export interface ServiceAgentOptions {
  config: InitConfig
  did?: string
  dependencies: AgentDependencies
}

export const createServiceAgent = (
  options: ServiceAgentOptions,
  dependencyManager?: DependencyManager
): ServiceAgent => {
  return new ServiceAgent(
    {
      config: options.config,
      dependencies: options.dependencies,
      modules: {
        askar: new AskarModule({ ariesAskar }),
        anoncreds: new AnonCredsModule({ anoncreds, registries: [new DidWebAnonCredsRegistry({ cacheOptions: { allowCaching: true, cacheDurationInSeconds: 24*60*60 }})] }),
        actionMenu: new ActionMenuModule(),
        connections: new ConnectionsModule({ autoAcceptConnections: true }),
        credentials: new CredentialsModule({
          autoAcceptCredentials: AutoAcceptCredential.ContentApproved,
          credentialProtocols: [
            new V2CredentialProtocol({ credentialFormats: [new LegacyIndyCredentialFormatService(), new AnonCredsCredentialFormatService()] }),
          ],
        }),
        proofs: new ProofsModule({
          autoAcceptProofs: AutoAcceptProof.ContentApproved,
          proofProtocols: [new V2ProofProtocol({ proofFormats: [new LegacyIndyProofFormatService(), new AnonCredsProofFormatService()] })],
        }),
        media: new MediaSharingModule(),
        questionAnswer: new QuestionAnswerModule(),
        receipts: new ReceiptsModule(),
        userProfile: new UserProfileModule(),
      },
    },
    options.did,
    dependencyManager
  )
}
