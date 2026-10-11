/**
 * The web app's command-line provider: it parses the `dsh --profile web` flag
 * family (`--host`, `--port`, `--public-url`, `--trusted-host`, `--no-open`, TLS)
 * and its `--help` text, then provides the immutable values as
 * {@link WEB_STARTUP_SERVICE}. Ordinary rows inject that service before
 * reading it from lazy config.
 * @module @deepseek-ai/dsh-web-app/startup
 */

import { Command, Option } from 'commander'
import type { Context } from '@deepseek-ai/cordis'
import { parseCmdline } from '@deepseek-ai/dsh-cmdline'
import { isWildcardHost, type TlsConfig } from '@deepseek-ai/dsh-host-webserver'
import { parsePublicUrl } from './public-url.ts'

/** Stable Cordis plugin name. */
export const name = 'web-startup'

/** Services required before the flags can be resolved. */
export const inject = ['cmdlineArgs']

/** Service provided by this ordinary plugin and injected by flag-configured rows. */
export const WEB_STARTUP_SERVICE = 'webStartup'

/** What the web rows read from {@link WEB_STARTUP_SERVICE}. */
export interface WebStartupValues {
  /** Whether this invocation opens the default browser after startup. */
  openBrowser: boolean
  /** `--host` or `DSH_WEB_HOST`, absent when neither names one. */
  host?: string
  /** `--port` or `DSH_WEB_PORT`, absent when neither names one. */
  port?: number
  /**
   * `--public-url` or `DSH_WEB_PUBLIC_URL`: the advertised HTTP(S) root.
   * See [public deployments](../README.md#public-deployments).
   */
  publicUrl?: string
  /** `--trusted-host` authorities or the comma-separated `DSH_WEB_TRUSTED_HOSTS` list. */
  trustedHosts: string[]
  /** Server certificate chain and unencrypted private key supplied together. */
  tls?: TlsConfig
}

/** The web flag family, as commander parsed it. */
interface WebOptions {
  host?: string
  open: boolean
  port?: string
  publicUrl?: string
  trustedHost?: string[]
  tlsCert?: string
  tlsKey?: string
}

/**
 * This app's command: its flags, its description, and its help text.
 * @returns a fresh program, so one process can parse more than once (tests).
 */
function webCommand(): Command {
  return new Command()
    .name('dsh --profile web')
    .description('Serve the DeepSeek Harness browser UI.')
    .helpOption('-h, --help', 'show this help')
    .addOption(new Option('--host <host>', 'bind address: one concrete IPv4 or IPv6 literal of a local interface; wildcard addresses are rejected').env('DSH_WEB_HOST'))
    .option('--no-open', 'do not open the Web UI in the default browser')
    .addOption(new Option('--port <port>', 'listen port; pass 0 to let the OS pick a free one').env('DSH_WEB_PORT'))
    .addOption(new Option('--public-url <url>', 'advertise this HTTP(S) root in the printed, opened, web-surface, and DSH_WEB_URL forms; grants no trust').env('DSH_WEB_PUBLIC_URL'))
    .addOption(new Option('--trusted-host <authority...>', 'extra authority the /api browser-trust fence accepts (host[:port] or *.suffix[:port]; repeatable)')
      .env('DSH_WEB_TRUSTED_HOSTS')
      .argParser((value: string, previous: string[] | undefined) => [...previous ?? [], ...value.split(',').map(entry => entry.trim())]))
    .addOption(new Option('--tls-cert <file>', 'PEM server certificate chain; requires --tls-key').env('DSH_WEB_TLS_CERT'))
    .addOption(new Option('--tls-key <file>', 'unencrypted PEM private key; requires --tls-cert').env('DSH_WEB_TLS_KEY'))
    .addHelpText('after', `
Examples:
  dsh --profile web                          serve on the composed host and port
  dsh --profile web --no-open                serve without opening a browser
  dsh --profile web --port 8080              serve on another port
  dsh --profile web --host 10.0.0.7          bind one local interface address
  dsh --profile web --public-url https://app.example/ui/ --trusted-host app.example
                                             advertise a prefix-stripping HTTPS proxy entry and admit its authority
  dsh --profile web --tls-cert ./server-chain.pem --tls-key ./server-key.pem
                                              serve HTTPS with an existing certificate and key

Environment:
  DSH_WEB_OPEN_BROWSER=true|false             open the browser unless --no-open is supplied
  DSH_WEB_TRUSTED_HOSTS=*.trycloudflare.com    admit changing tunnel subdomains; authentication remains required
`)
}

/**
 * Parse and provide the Web invocation as an ordinary Cordis service. The
 * command's action publishes the flags this invocation named. Invalid flags,
 * including an unpaired TLS certificate or key, are usage errors; rejection
 * and `--help` provide no service.
 * @param ctx - plugin context carrying the command line.
 */
export function apply(ctx: Context): void {
  const program = webCommand()
  program.action(() => {
    const options = program.opts<WebOptions>()
    if (options.host !== undefined && isWildcardHost(options.host)) {
      program.error(`error: --host ${options.host} is an unspecified (wildcard) address, which is not supported: binding every interface would expose remote code execution to the network; bind one concrete IPv4 or IPv6 address instead`)
    }
    if (options.port !== undefined && (!/^\d+$/.test(options.port) || Number(options.port) > 65535)) {
      program.error(`error: --port must be a number from 0 through 65535, got ${JSON.stringify(options.port)}`)
    }
    const openBrowserEnv = process.env.DSH_WEB_OPEN_BROWSER
    if (openBrowserEnv !== undefined && openBrowserEnv !== 'true' && openBrowserEnv !== 'false') {
      program.error('error: DSH_WEB_OPEN_BROWSER must be true or false')
    }
    let tls: TlsConfig | undefined
    if (options.tlsCert !== undefined && options.tlsKey !== undefined) {
      tls = { certFile: options.tlsCert, keyFile: options.tlsKey }
    } else if (options.tlsCert !== undefined || options.tlsKey !== undefined) {
      program.error('error: --tls-cert and --tls-key must be supplied together')
    }
    if (options.publicUrl !== undefined) {
      try {
        parsePublicUrl(options.publicUrl, '--public-url')
      } catch (error) {
        program.error(`error: ${(error as Error).message}`)
      }
    }
    ctx.provide(WEB_STARTUP_SERVICE, {
      openBrowser: options.open && openBrowserEnv !== 'false',
      ...options.host !== undefined && { host: options.host },
      ...options.port !== undefined && { port: Number(options.port) },
      ...options.publicUrl !== undefined && { publicUrl: options.publicUrl },
      ...tls !== undefined && { tls },
      trustedHosts: options.trustedHost ?? [],
    } satisfies WebStartupValues)
  })
  parseCmdline(ctx, program)
}
