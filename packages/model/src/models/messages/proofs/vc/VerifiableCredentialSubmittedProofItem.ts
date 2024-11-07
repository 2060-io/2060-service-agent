import { v4 as uuid } from 'uuid'

import { Claim } from '../../CredentialIssuanceMessage'
import { SubmittedProofItem } from '../../IdentityProofSubmitMessage'

export interface VerifiableCredentialSubmittedProofItemOptions {
  id: string
  proofExchangeId: string
  claims?: Claim[]
  errorCode?: string
  verified?: boolean
}

export class VerifiableCredentialSubmittedProofItem extends SubmittedProofItem {
  public readonly type = VerifiableCredentialSubmittedProofItem.type
  public static readonly type = 'verifiable-credential'

  public proofExchangeId!: string

  public verified!: boolean

  public claims?: Claim[]

  public errorCode?: string

  public constructor(options: VerifiableCredentialSubmittedProofItemOptions) {
    super()
    if (options) {
      this.id = options.id ?? uuid()
      this.proofExchangeId = options.proofExchangeId
      this.claims = options.claims
      this.verified = options.verified ?? false
      this.errorCode = options.errorCode
    }
  }
}