# DeepSeek Harness

English | [中文](README.zh.md)

DeepSeek Harness (`dsh`) is an open-source agent harness developed by [DeepSeek AI](https://deepseek.com).

It is built on an **everything-is-a-plugin** architecture and powered by [Cordis](https://github.com/cordiverse/cordis), whose design is described in [_A Programming Paradigm for Spatiotemporal Composability_](https://arxiv.org/abs/2608.25512).

Documentation: [https://deepseek-harness.github.io/deepseek-harness/](https://deepseek-harness.github.io/deepseek-harness/)

## Developer preview

DeepSeek Harness is in _developer preview_ and iterating rapidly. **THERE WILL BE COMPATIBILITY-BREAKING CHANGES.**

Review the [safety notice](SAFETY.md) before running the project.

## Run

### Run from `npm`

Install `Node.js`, then run:

```sh
npx @deepseek-ai/dsh web
```

The command starts the Web UI at `http://127.0.0.1:3080` by default and opens it in the default browser for a local launch. An SSH launch only prints the host URL because the SSH client or editor owns the local forwarded address. Pass `--no-open` to run the server without opening a browser. See [Web UI guide](docs/user/guide/index.md).

### Run from source

To run from a repository checkout:

```sh
git clone https://github.com/deepseek-ai/deepseek-harness.git
cd deepseek-harness
pnpm install
pnpm run build
pnpm dsh web
```

`pnpm run build` prepares the repository artifacts. `pnpm dsh web` uses those built artifacts without rebuilding.

## Cloudflare Tunnel extension

This repository extends the original DeepSeek Harness Web profile for remote browser access through an external reverse proxy or tunnel. DSH still runs on the host machine; the tunnel only exposes the Web UI and does not move workspaces, Sessions, model credentials, or filesystem operations to the browser device.

### Supported

- Configure Web startup defaults from `.env` in the launch directory or `$DSH_HOME/.env`: host, port, public URL, trusted hosts, browser opening, and listener TLS files.
- Accept changing Cloudflare Quick Tunnel subdomains with `DSH_WEB_TRUSTED_HOSTS=*.trycloudflare.com`.
- Accept exact hostnames or other DNS suffixes with `--trusted-host` or `DSH_WEB_TRUSTED_HOSTS`.
- Keep launch-token authentication, signed host-bound cookies, Host/Origin checks, and WebSocket protection active for remote requests.
- Use the in-page directory picker and create workspaces on the machine running DSH. Remote access does not enable the native directory picker on the browser device.
- Advertise a public `http://` or `https://` root with `--public-url`, including a path prefix managed by a reverse proxy.
- Terminate TLS on the proxy or on the DSH listener with `--tls-cert` and `--tls-key`.

The proxy must preserve the public `Host`, strip any public path prefix before forwarding, forward WebSocket upgrades, rewrite cookie paths when a prefix is used, and redirect the bare public mount to its trailing-slash form. See [Publish the Web UI behind a reverse proxy](docs/user/guide/public-deployments.md) for the complete setup and security requirements.

Example `.env` for a Cloudflare Quick Tunnel:

```dotenv
DSH_WEB_HOST=127.0.0.1
DSH_WEB_PORT=3080
DSH_WEB_OPEN_BROWSER=false
DSH_WEB_TRUSTED_HOSTS=*.trycloudflare.com
```

Start DSH separately from the tunnel:

```sh
pnpm dsh web --no-open
```

Point the externally managed tunnel at `http://127.0.0.1:3080`, preserve the public `Host`, and open the current tunnel URL with the `?token=...` printed by DSH. A new tunnel hostname requires a new login because cookies are bound to the hostname and port.

### Current limitations and TODOs

- [ ] Fix the startup URL announcement when `DSH_WEB_TRUSTED_HOSTS` contains a wildcard. It currently prints an invalid authority such as `https://*.trycloudflare.com/?token=...`; until fixed, replace that URL's origin with the current tunnel origin or configure the exact hostname.
- [ ] Repair the tunnel profile e2e smoke. Its readiness matcher still expects placeholder text instead of the actual `dsh web:` output, so the test times out before exercising the tunnel flow.
- [ ] Add automatic tunnel lifecycle management, public URL discovery, and URL refresh so users do not need to start the tunnel separately or restart DSH after a hostname rotation.
- [ ] Add documented and tested examples for Cloudflare named tunnels, stable custom domains, and other reverse proxies such as Caddy or Nginx.
- [ ] Add a real proxy or tunnel integration lane that verifies Host preservation, WebSocket upgrades, path-prefix stripping, cookie rewriting, and HTTPS behavior.
- [ ] Add a safe option for revoking all remote browser sessions without deleting the complete local credential store.

## Community and support

- Submit feedback or bug reports through [GitHub Discussions](https://github.com/deepseek-ai/deepseek-harness/discussions).
- Add the [`dsh-plugin`](https://github.com/topics/dsh-plugin) topic to your plugin repository for discoverability.
- Join <a href="https://discord.gg/4MrtZUhpxg">DeepSeek Harness Discord community</a>.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Development

Start with the [development guide](docs/development.md) and [architecture documentation](docs/architecture.md).

`pnpm run dev:web` builds, serves, and rebuilds client bundles on source edits in one terminal, and `make help` lists the matching Make targets for Web and Desktop; the guide's application commands section owns the full table.

For agents, follow [AGENTS.md](AGENTS.md).

## Citation

```bibtex
@misc{deepseek-harness2026,
  title={DeepSeek Harness: Everything is a Plugin},
  author={DeepSeek-AI},
  year={2026},
  publisher={GitHub},
  howpublished={\url{https://github.com/deepseek-ai/deepseek-harness}},
}
```

## License

[MIT](LICENSE)

Third-party dependencies and their licenses are disclosed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
