// src/services/RevocationRegistryService.ts

import { RevocationRegistryInfo } from '@2060.io/service-agent-model'
import { Logger } from 'tslog'

import { ApiVersion } from '../types/enums'

const logger = new Logger({
  name: 'RevocationRegistryService',
  type: 'pretty',
  prettyLogTemplate: '{{logLevelName}} [{{name}}]: ',
})

/**
 * `RevocationRegistryService` class for managing credential types and interacting with
 * the available endpoints related to credential types in the Agent Service.
 *
 * This class provides methods for querying, creating, and managing revocation registry on credential types.
 * For a list of available endpoints and functionality, refer to the methods within this class.
 */
export class RevocationRegistryService {
  private url: string

  constructor(
    private baseURL: string,
    private version: ApiVersion,
  ) {
    this.url = `${this.baseURL.replace(/\/$/, '')}/${this.version}/credential-types`
  }

  public async create(options: RevocationRegistryInfo): Promise<string> {
    logger.info(`Creating revocation registry with credentialDefinitionId: ${JSON.stringify(options)}`)
    const response = await fetch(`${this.url}/revocationRegistry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ options }),
    })
    return response.text()
  }

  public async get(credentialDefinitionId: string): Promise<string[]> {
    logger.info(`Searching revocation registry with credentialDefinitionId: ${credentialDefinitionId}`)
    const response = await fetch(`${this.url}/revocationRegistry`, {
      method: 'GET',
      headers: { accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ credentialDefinitionId }),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch revocation definitions: ${response.statusText}`)
    }

    return (await response.json()) as string[]
  }

  public async getAll(): Promise<string[]> {
    logger.info(`Searching all revocation registry`)
    const response = await fetch(`${this.url}/revocationRegistry`, {
      method: 'GET',
      headers: { accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ credentialDefinitionId: '' }),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch revocation definitions: ${response.statusText}`)
    }

    return (await response.json()) as string[]
  }
}