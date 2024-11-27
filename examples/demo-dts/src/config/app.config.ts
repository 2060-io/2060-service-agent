import { ApiVersion } from '@2060.io/service-agent-client'
import { registerAs } from '@nestjs/config'

/**
 * Configuration for the application, including ports, database URIs, and service URLs.
 *
 * @returns {object} - An object containing the configuration settings for the application.
 */
export default registerAs('appConfig', () => ({
  /**
   * The port number on which the application will run.
   * Defaults to 5000 if APP_PORT is not set in the environment variables.
   * @type {number}
   */
  appPort: parseInt(process.env.AGENT_PORT) || 5000,

  /**
   * Hostname or IP address for the PostgreSQL database.
   * Defaults 'postgres' string if POSTGRES_HOST is not set in the environment variables.
   * @type {string}
   */
  postgresHost: process.env.POSTGRES_HOST || 'postgres',

  /**
   * Username for the PostgreSQL database.
   * Defaults 'unicid' string if POSTGRES_USER is not set in the environment variables.
   * @type {string}
   */
  postgresUser: process.env.POSTGRES_USER || 'unicid',

  /**
   * Password for the PostgreSQL database.
   * Defaults 'demo' string if POSTGRES_PASSWORD is not set in the environment variables.
   * @type {string}
   */
  postgresPassword: process.env.POSTGRES_PASSWORD || 'demo',

  /**
   * Base URL for the Service Agent Admin.
   * Defaults to 'http://localhost:3000' if SERVICE_AGENT_ADMIN_BASE_URL is not set in the environment variables.
   * @type {string}
   */
  serviceAgentAdmin: process.env.SERVICE_AGENT_ADMIN_BASE_URL || 'http://localhost:3000',

  /**
   * API version for the application.
   * Defaults to '1.0' if API_VERSION is not set in the environment variables.
   * @type {ApiVersion}
   */
  apiVersion: (process.env.API_VERSION as ApiVersion) || ApiVersion.V1,

  /**
   * Base URL for the application.
   * Defaults to 'http://localhost:2902' if PUBLIC_BASE_URL is not set.
   * @type {string}
   */
  baseUrl: process.env.PUBLIC_BASE_URL || 'http://localhost:2902',
}))
