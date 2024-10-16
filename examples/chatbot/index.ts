import cors from 'cors'
import { randomUUID } from 'crypto'
import express from 'express'
import fetch from 'node-fetch'
import path from 'path'
import { Logger } from 'tslog'

import { helpMessage, rockyQuotes, rootContextMenu, rootMenuAsQA, welcomeMessage, worldCupPoll } from './data'
import phoneCredDefData from './phone-cred-def-dev.json'

const logger = new Logger()

const PORT = Number(process.env.PORT || 5000)
const SERVICE_AGENT_BASE_URL = process.env.SERVICE_AGENT_ADMIN_BASE_URL || 'http://localhost:3000/v1'
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'http://localhost:5000'
const VISION_SERVICE_BASE_URL =
  process.env.VISION_SERVICE_BASE_URL || 'https://webrtc-pymediasoup-client-demo.dev.2060.io'
const WEBRTC_SERVER_BASE_URL = process.env.WEBRTC_SERVER_BASE_URL || 'https://dts-webrtc.dev.2060.io'
const app = express()

const staticDir = path.join(__dirname, 'public')
app.use(express.static(staticDir))

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.set('json spaces', 2)

let phoneNumberCredentialDefinitionId: string | undefined

type OngoingCall = {
  wsUrl: string
  roomId: string
  connectionId: string
}

const ongoingCalls: OngoingCall[] = []

export interface CredentialTypeInfo {
  id: string
  name: string
  version: string
  attributes: string[]
  schemaId?: string
}

export const getCredentialTypes = async () => {
  const response = await fetch(`${SERVICE_AGENT_BASE_URL}/credential-types`, {
    method: 'GET',
    headers: { accept: 'application/json', 'Content-Type': 'application/json' },
  })

  const types = await response.json()

  if (!Array.isArray(types)) {
    throw new Error('Invalid response from Service Agent')
  }
  return types.map(value => value as CredentialTypeInfo)
}

export const importCredentialType = async (importData: Record<string, unknown>) => {
  logger.info(`Importing credential type ${importData.id}`)

  const response = await fetch(`${SERVICE_AGENT_BASE_URL}/credential-types/import`, {
    method: 'POST',
    body: JSON.stringify(importData),
    headers: { accept: 'application/json', 'Content-Type': 'application/json' },
  })

  if (!response.ok) throw new Error(`Cannot import credential type: status ${response.status}`)

  return (await response.json()).id
}

const server = app.listen(PORT, async () => {
  logger.info(`Demo chatbot started on port ${PORT}`)

  // Ensure that phone credential type is created. If it does not exist, import it from
  // JSON (Note: This is only for dev purposes. Should not be done in production)
  const credentialTypes = await getCredentialTypes()

  if (credentialTypes.length === 0) {
    logger.info('No credential types have been found')
  }

  const phoneNumberCredentialType = credentialTypes.find(
    type => type.name === 'phoneNumber' && type.version === '1.0',
  )

  try {
    phoneNumberCredentialDefinitionId =
      phoneNumberCredentialType?.id ?? (await importCredentialType(phoneCredDefData))
    logger.info(`phoneNumberCredentialDefinitionId: ${phoneNumberCredentialDefinitionId}`)
  } catch (error) {
    logger.error(`Could not create or retrieve phone number credential type: ${error}`)
  }
})

export const submitMessage = async (body: unknown) => {
  logger.info(`submitMessage: ${JSON.stringify(body)}`)
  const response = await fetch(`${SERVICE_AGENT_BASE_URL}/message`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
  logger.info(`response: ${await response.text()}`)
}

const submitMessageReceipt = async (receivedMessage: any, messageState: 'received' | 'viewed') => {
  const body = {
    type: 'receipts',
    connectionId: receivedMessage.connectionId,
    receipts: [
      {
        messageId: receivedMessage.id,
        state: messageState,
        timestamp: new Date().toISOString(),
      },
    ],
  }
  await submitMessage(body)
}

const sendRootMenu = async (connectionId: string) => {
  const body = {
    type: 'contextual-menu-update',
    connectionId,
    ...rootContextMenu,
  }
  await submitMessage(body)
}

const sendTextMessage = async (options: { connectionId: string; content: string }) => {
  const body = {
    type: 'text',
    connectionId: options.connectionId,
    content: options.content,
  }

  await submitMessage(body)
}

const sendQuestion = async (options: {
  connectionId: string
  question: { prompt: string; menuItems: { id: string; text: string }[] }
}) => {
  const body = {
    type: 'menu-display',
    connectionId: options.connectionId,
    ...options.question,
  }
  await submitMessage(body)
}

const handleMenuSelection = async (options: { connectionId: string; item: string }) => {
  logger.info(`handleMenuSelection: ${options.item}`)
  const selectedItem = options.item
  const connectionId = options.connectionId

  if (selectedItem === 'poll' || selectedItem === 'Sure!' || selectedItem === '⚽ World Cup poll') {
    await sendQuestion({ connectionId, question: worldCupPoll })
  }

  // Home
  if (selectedItem === 'home' || selectedItem === '🏡 Home') {
    await sendTextMessage({ connectionId, content: welcomeMessage })
  }

  // Issue credential
  if (selectedItem === 'issue' || selectedItem === 'Issue credential') {
    if (!phoneNumberCredentialDefinitionId || phoneNumberCredentialDefinitionId === '') {
      await sendTextMessage({
        connectionId,
        content: 'Service not available',
      })
    } else {
      const body = {
        type: 'credential-issuance',
        connectionId,
        credentialDefinitionId: phoneNumberCredentialDefinitionId,
        claims: [
          {
            name: 'phoneNumber',
            mimeType: 'text/plain',
            value: '+5712345678',
          },
        ],
      }
      await submitMessage(body)
    }
  }

  // Proof
  if (selectedItem === 'proof' || selectedItem === 'Request proof') {
    if (!phoneNumberCredentialDefinitionId || phoneNumberCredentialDefinitionId === '') {
      await sendTextMessage({
        connectionId,
        content: 'Service not available',
      })
    } else {
      await sendTextMessage({
        connectionId,
        content: 'In order to start a new chat, we need some verifiable information from you',
      })
      const body = {
        type: 'identity-proof-request',
        connectionId,
        requestedProofItems: [
          {
            id: '1',
            type: 'verifiable-credential',
            credentialDefinitionId: phoneNumberCredentialDefinitionId,
            attributes: ['phoneNumber'],
          },
        ],
      }
      await submitMessage(body)
    }
  }

  // Help
  if (selectedItem === 'help' || selectedItem === '🆘 Help') {
    await sendTextMessage({ connectionId, content: helpMessage })
  }

  // Rocky quotes
  if (selectedItem === 'rocky' || selectedItem === '💪 Rocky quotes' || selectedItem === 'Inspire me!') {
    // send random Rocky quote
    await sendTextMessage({
      connectionId,
      content: rockyQuotes[Math.floor(Math.random() * rockyQuotes.length)],
    })
    await sendQuestion({
      connectionId,
      question: {
        prompt: 'Another inspiring Rocky quote?',
        menuItems: [
          {
            id: 'rocky',
            text: 'Inspire me!',
          },
          {
            id: 'idle',
            text: 'No',
          },
        ],
      },
    })
    return
  }

  // World Cup poll responses
  const worldCupResponses = worldCupPoll.menuItems.map((item: { id: string; text: string }) => item.id)
  if (worldCupResponses.includes(selectedItem)) {
    if (selectedItem === 'argentina') {
      // Yes!
      await sendTextMessage({ connectionId, content: 'Correct! Vamos Argentina!' })
    } else {
      // No way!
      await sendTextMessage({ connectionId, content: 'No way...' })
      await sendQuestion({
        connectionId,
        question: {
          prompt: 'Do you want to try again?',
          menuItems: [
            {
              id: 'poll',
              text: 'Sure!',
            },
            {
              id: 'idle',
              text: 'No',
            },
          ],
        },
      })
    }
    return
  }
}

app.post('/connection-state-updated', async (req, res) => {
  const obj = req.body
  logger.info(`connection state updated: ${JSON.stringify(obj)}`)
  if (obj.state === 'completed') {
    await sendRootMenu(obj.connectionId)
    await sendTextMessage({
      connectionId: obj.connectionId,
      content: welcomeMessage,
    })
  }
  res.json({ message: 'ok' })
})

app.post('/message-state-updated', async (req, res) => {
  const obj = req.body
  logger.info(`message state updated: ${JSON.stringify(obj)}`)
  res.json({ message: 'ok' })
})

app.post('/message-received', async (req, res) => {
  const obj = req.body.message
  logger.info(`received message: ${JSON.stringify(obj)}`)
  res.json({ message: 'ok' }).send()

  if (obj.type === 'text') {
    await submitMessageReceipt(obj, 'viewed')
    const connectionId = obj.connectionId
    const content = obj.content as string
    logger.info(`Content: ${content}`)
    if (content.startsWith('/echo')) {
      await sendTextMessage({ connectionId, content: `${content.substring(5)}` })
    } else if (content.startsWith('/context')) {
      sendRootMenu(obj.connectionId)
    } else if (content.startsWith('/menu')) {
      await sendQuestion({ connectionId: obj.connectionId, question: rootMenuAsQA })
    } else if (content.startsWith('/media')) {
      const mediaParametersRegExp = /"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'|[^\s]+/g
      const parsedContents = content.substring(7).match(mediaParametersRegExp)
      const body = {
        type: 'media',
        connectionId: obj.connectionId,
        description: parsedContents?.slice(1).join(' ') ?? 'An image',
        items: [
          {
            description: parsedContents?.slice(1).join(' ') ?? 'Bunny',
            uri: parsedContents ? `${parsedContents[0]}` : `${PUBLIC_BASE_URL}/bunny.jpeg`,
            mimeType: 'image/jpeg', // TODO: take mime type from actual media
            filename: `${randomUUID()}.jpg`,
            byteCount: 6576,
          },
        ],
      }
      await submitMessage(body)
      // Format: /link URL (opt)title (opt)description (opt)iconUrl (opt)openingMode
    } else if (content.startsWith('/link')) {
      const linkParametersRegExp = /"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'|[^\s]+/g
      const parsedContents = content.substring(6).match(linkParametersRegExp)

      if (parsedContents) {
        const body = {
          type: 'media',
          connectionId: obj.connectionId,
          description: parsedContents[2],
          items: [
            {
              uri: parsedContents[0] || 'https://2060.io',
              mimeType: 'text/html',
              title: parsedContents[1] || 'Title',
              icon: parsedContents[3] || '',
              openingMode: parsedContents[4] || 'normal',
            },
          ],
        }
        await submitMessage(body)
      }
    } else if (content.startsWith('/invitation')) {
      const parsedContents = content.split(' ')
      const body = {
        type: 'invitation',
        connectionId: obj.connectionId,
        label: parsedContents[1],
        imageUrl: parsedContents[2],
        did: parsedContents[3],
      }
      await submitMessage(body)
    } else if (content.startsWith('/profile')) {
      const parsedContents = content.split(' ')
      const body = {
        type: 'profile',
        connectionId: obj.connectionId,
        displayName: parsedContents[1],
        displayImageUrl: parsedContents[2],
        displayIconUrl: parsedContents[3],
      }
      await submitMessage(body)
    } else if (content.startsWith('/call')) {
      const parsedContents = content.split(' ')
      let wsUrl = parsedContents[1]
      let roomId = parsedContents[2]

      try {
        if (!wsUrl || !roomId) {
          // Create a room if not given as argument
          const result = await fetch(`${WEBRTC_SERVER_BASE_URL}/rooms`, {
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            method: 'POST',
            body: JSON.stringify({ maxPeerCount: 2, eventNotificationUri: `${PUBLIC_BASE_URL}/call-events` }),
          })

          const response = await result.json()

          wsUrl = response.wsUrl
          roomId = response.roomId
        }

        const peerId = obj.connectionId // We re-use connection id to simplify

        ongoingCalls.push({ wsUrl, roomId, connectionId: obj.connectionId })
        const body = {
          type: 'call-offer',
          connectionId: obj.connectionId,
          parameters: { wsUrl, roomId, peerId },
        }
        await submitMessage(body)
      } catch (reason) {
        logger.error(`Cannot create call: ${reason}`)
        sendTextMessage({
          connectionId: obj.connectionId,
          content: 'An error has occurred while creating a call',
        })
      }
    } else if (content.startsWith('/mrz')) {
      const body = {
        type: 'mrz-data-request',
        connectionId,
      }
      await submitMessage(body)
    } else if (content.startsWith('/emrtd')) {
      const body = {
        type: 'emrtd-data-request',
        connectionId,
      }
      await submitMessage(body)
    } else if (content.startsWith('/proof')) {
      const body = {
        type: 'identity-proof-request',
        connectionId,
        requestedProofItems: [
          {
            id: '1',
            type: 'verifiable-credential',
            credentialDefinitionId: phoneNumberCredentialDefinitionId,
          },
        ],
      }
      await submitMessage(body)
    } else if (content.startsWith('/rocky')) {
      await sendTextMessage({
        connectionId,
        content: rockyQuotes[Math.floor(Math.random() * rockyQuotes.length)],
      })
    } else if (content.startsWith('/help')) {
      await sendTextMessage({ connectionId, content: helpMessage })
    } else if (content.startsWith('/terminate')) {
      const body = {
        type: 'terminate-connection',
        connectionId,
      }
      await submitMessage(body)
    } else {
      // Text message received but not understood
      await sendTextMessage({
        connectionId,
        content: 'I do not understand what you say. Write /help to get available commands',
      })
    }
  } else if (obj.type === 'menu-select') {
    await submitMessageReceipt(obj, 'viewed')
    await handleMenuSelection({ connectionId: obj.connectionId, item: obj.menuItems[0]?.id ?? 'nothing' })
  } else if (obj.type === 'contextual-menu-select') {
    await submitMessageReceipt(obj, 'viewed')
    // Refresh context menu
    await sendRootMenu(obj.connectionId)

    await handleMenuSelection({ connectionId: obj.connectionId, item: obj.selectionId ?? 'nothing' })
  } else if (obj.type === 'identity-proof-submit') {
    await submitMessageReceipt(obj, 'viewed')
    const errorCode = obj.submittedProofItems[0].errorCode
    if (errorCode) {
      await sendTextMessage({ connectionId: obj.connectionId, content: `Error code received: ${errorCode}` })
    } else {
      await sendTextMessage({
        connectionId: obj.connectionId,
        content: 'We have successfully received your proof submission. Enjoy the service!',
      })
    }
  } else if (obj.type === 'media') {
    logger.info('media received')
    await submitMessageReceipt(obj, 'viewed')
  } else if (obj.type === 'mrz-data-submit') {
    logger.info(`MRZ Data submit: ${JSON.stringify(obj.mrzData)}`)
    await submitMessageReceipt(obj, 'viewed')

    // Request eEMRTD data to continue the flow
    const body = {
      type: 'emrtd-data-request',
      connectionId: obj.connectionId,
      threadId: obj.threadId,
    }
    await submitMessage(body)
  } else if (obj.type === 'emrtd-data-submit') {
    logger.info(`eMRTD Data submit: ${JSON.stringify(obj.dataGroups)}`)
    await submitMessageReceipt(obj, 'viewed')
  }
})

app.post('/call-events', async (req, res) => {
  logger.info(`Event received: ${JSON.stringify(req.body)}`)
  const event = req.body.event
  // find call
  const call = ongoingCalls.find(item => item.connectionId === req.body.peerId)

  if (!call) {
    logger.warn('No call matching the event')
    res.end()
    return
  }

  if (event === 'peer-joined') {
    // Ask Vision service to join the call
    const body = JSON.stringify({
      ws_url: `${call.wsUrl}/?roomId=${call.roomId}&peerId=${randomUUID()}`,
      success_url: `${PUBLIC_BASE_URL}/call-success/${call.connectionId}`,
      failure_url: `${PUBLIC_BASE_URL}/call-failure/${call.connectionId}`,
    })
    logger.info(`join-call parameters: ${body}`)
    await fetch(`${VISION_SERVICE_BASE_URL}/join-call`, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body,
    })
  } else if (event === 'peer-left') {
    ongoingCalls.splice(ongoingCalls.indexOf(call), 1)
  }
  res.end()
})

app.put('/call-success/:connectionId', (req, res) => {
  logger.info(`Call success for ${req.params.connectionId}: ${JSON.stringify(req.body)}`)
  res.end()
  sendTextMessage({ connectionId: req.params.connectionId, content: 'Call was succesful' }).catch(error =>
    logger.error(`Cannot send message: ${error}`),
  )
})

app.put('/call-failure/:connectionId', (req, res) => {
  logger.info(`Call success for ${req.params.connectionId}: ${JSON.stringify(req.body)}`)
  res.end()
  sendTextMessage({ connectionId: req.params.connectionId, content: 'Call failed' }).catch(error =>
    logger.error(`Cannot send message: ${error}`),
  )
})

export { app, server }
