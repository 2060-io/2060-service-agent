// src/ApiClient.ts

import { CredentialTypeService } from './services/CredentialTypeService'
import { MessageService } from './services/MessageService'
import { ApiVersion } from './types/enums'

/**
 * `ApiClient` class for easy access to the available endpoints in the Agent Service.
 * This class simplifies the interaction with the service by providing methods
 * that map the required data and allow straightforward use of the endpoints.
 *
 * Each method corresponds to an HTTP POST endpoint with a specified route
 * within the Express structure. The `ApiClient` class is designed to handle
 * events and make requests efficiently.
 *
 * Usage:
 * Extend `ApiClient` in your project and implement specific handlers to
 * interact with the available services like message sending and credential management.
 *
 * Example:
 *
 * // Initialize ApiClient with the base URL and version
 * const apiClient = new ApiClient('http://localhost', ApiVersion.V1)
 *
 * // Example to query available credentials
 * await apiClient.credentialType.getAllCredentialTypes()
 *
 * // Example to send a message
 * apiClient.message.sendMessage(message: BaseMessage)
 *
 * The `ApiClient` class provides easy methods for interacting with:
 * - `message`: Send and manage messages.
 * - `credentialType`: Query and manage credential types.
 */
export class ApiClient {
  public readonly message: MessageService
  public readonly credentialType: CredentialTypeService

  constructor(
    private baseURL: string,
    private version: ApiVersion = ApiVersion.V1,
  ) {
    this.message = new MessageService(baseURL, version)
    this.credentialType = new CredentialTypeService(baseURL, version)
  }
}
