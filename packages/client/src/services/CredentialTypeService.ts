// src/services/CredentialTypeService.ts

import { CredentialTypeInfo, ImportCredentialTypeOptions } from '@2060.io/model'
import { ApiVersion } from '../types/enums'
import { Logger } from 'tslog'

const logger = new Logger()

export class CredentialTypeService {
  private url: string

  constructor(
    private baseURL: string,
    private version: ApiVersion,
  ) {
    this.url = `${this.baseURL.replace(/\/$/, '')}/${this.version}/credential-types`
  }

  public async importCredentialType(importData: ImportCredentialTypeOptions): Promise<CredentialTypeInfo> {
    logger.info(`Importing credential type ${importData.id}`)
    const response = await fetch(`${this.url}/import`, {
      method: 'POST',
      body: JSON.stringify(importData),
      headers: { accept: 'application/json', 'Content-Type': 'application/json' },
    })
    if (!response.ok) throw new Error(`Cannot import credential type: status ${response.status}`)
    
    return (await response.json() as CredentialTypeInfo)
  }

  public async createCredentialType(credentialType: CredentialTypeInfo): Promise<any> {
    const response = await fetch(`${this.url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentialType),
    })
    return response.json()
  }

  public async getAllCredentialTypes(): Promise<CredentialTypeInfo[]> {
    const response = await fetch(this.url, {
      method: 'GET',
      headers: { accept: 'application/json', 'Content-Type': 'application/json' },
    })

    const types = await response.json()
    
    if (!Array.isArray(types)) {
      throw new Error('Invalid response from Service Agent')
    }

    return types.map(value => value as CredentialTypeInfo)
  }
}
