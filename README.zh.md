# DeepSeek Harness

[English](README.md) | 中文

DeepSeek Harness（`dsh`）是由 [DeepSeek AI](https://deepseek.com) 开发的开源 agent harness（智能体框架）。

它构建于**一切皆插件**的架构之上，由 [Cordis](https://github.com/cordiverse/cordis) 驱动，其设计参见论文 [_A Programming Paradigm for Spatiotemporal Composability_](https://arxiv.org/abs/2608.25512)。

文档：[https://deepseek-harness.github.io/deepseek-harness/](https://deepseek-harness.github.io/deepseek-harness/)

## 开发者预览

DeepSeek Harness 处于 _开发者预览_ 阶段，正在快速迭代。**未来将出现破坏兼容性的变更。**

运行本项目前，请阅读[安全说明](SAFETY.zh.md)。

<a id="run"></a>

## 运行

### 通过 `npm` 运行

安装 `Node.js`，然后运行：

```sh
npx @deepseek-ai/dsh web
```

该命令默认会在 `http://127.0.0.1:3080` 启动 Web UI，本机启动时还会用默认浏览器打开页面。通过 SSH 启动时只打印宿主机 URL，因为本地转发地址由 SSH 客户端或编辑器持有。传入 `--no-open` 可仅运行服务器而不打开浏览器。详见 [Web UI 指南](docs/user/guide/index.zh.md)。

<a id="run-from-source"></a>

### 从源码运行

如需从仓库源码运行：

```sh
git clone https://github.com/deepseek-ai/deepseek-harness.git
cd deepseek-harness
pnpm install
pnpm run build
pnpm dsh web
```

`pnpm run build` 会准备仓库产物。`pnpm dsh web` 会直接使用这些已构建产物，不会重新构建。

## Cloudflare Tunnel 扩展

本仓库在原版 DeepSeek Harness Web profile 之上增加了通过外部反向代理或 tunnel 进行远程浏览器访问的能力。DSH 仍然运行在主机上；tunnel 只公开 Web UI，不会把工作区、Session、模型凭据或文件系统操作迁移到浏览器所在的设备。

### 已支持的能力

- 从启动目录的 `.env` 或 `$DSH_HOME/.env` 读取 Web 启动默认值，包括 host、端口、公开 URL、可信 host、浏览器打开行为和监听器 TLS 文件。
- 使用 `DSH_WEB_TRUSTED_HOSTS=*.trycloudflare.com` 接受会变化的 Cloudflare Quick Tunnel 子域名。
- 通过 `--trusted-host` 或 `DSH_WEB_TRUSTED_HOSTS` 接受精确 host 或其他 DNS 后缀。
- 对远程请求继续执行启动 token 认证、绑定 host 的签名 cookie、Host/Origin 检查和 WebSocket 保护。
- 使用页面内目录选择器，在运行 DSH 的主机上创建工作区。远程访问不会在浏览器所在设备上启用原生目录选择器。
- 使用 `--public-url` 公告公开的 `http://` 或 `https://` 根地址，包括由反向代理处理的路径前缀。
- 在代理或 DSH 监听器上终止 TLS；监听器 TLS 使用 `--tls-cert` 与 `--tls-key`。

代理必须保留公开的 `Host`，转发前去除公开路径前缀，转发 WebSocket upgrade，使用路径前缀时重写 cookie 路径，并把公开 mount 的无斜杠形式重定向到带结尾斜杠的形式。完整的配置与安全要求见[通过反向代理发布 Web UI](docs/user/guide/public-deployments.zh.md)。

Cloudflare Quick Tunnel 的 `.env` 示例：

```dotenv
DSH_WEB_HOST=127.0.0.1
DSH_WEB_PORT=3080
DSH_WEB_OPEN_BROWSER=false
DSH_WEB_TRUSTED_HOSTS=*.trycloudflare.com
```

让 DSH 与 tunnel 分别启动：

```sh
pnpm dsh web --no-open
```

将外部管理的 tunnel 指向 `http://127.0.0.1:3080`，保留公开的 `Host`，然后使用 DSH 输出的 `?token=...` 打开当前 tunnel URL。新的 tunnel host 需要重新登录，因为 cookie 绑定 host 和端口。

### 当前限制与 TODO

- [ ] 修复 `DSH_WEB_TRUSTED_HOSTS` 包含通配符时的启动 URL 公告。目前会输出类似 `https://*.trycloudflare.com/?token=...` 的无效 authority；修复前请将该 URL 的 origin 替换为当前 tunnel origin，或配置精确 host。
- [ ] 修复 tunnel profile 的 e2e smoke。就绪匹配器仍然等待占位文本，而不是实际的 `dsh web:` 输出，因此测试会在执行 tunnel 流程前超时。
- [ ] 增加 tunnel 生命周期管理、公开 URL 发现和 URL 刷新，避免用户单独启动 tunnel，或在 host 轮换后重启 DSH。
- [ ] 增加并测试 Cloudflare named tunnel、稳定自定义域名以及 Caddy 或 Nginx 等其他反向代理的示例。
- [ ] 增加真实代理或 tunnel 集成测试，覆盖 Host 保留、WebSocket upgrade、路径前缀去除、cookie 重写和 HTTPS 行为。
- [ ] 增加不删除完整本地凭据存储即可撤销所有远程浏览器 Session 的安全选项。

## 社区与支持

- 通过 [GitHub Discussions](https://github.com/deepseek-ai/deepseek-harness/discussions) 提交反馈或 bug 报告。
- 为你的插件仓库添加 [`dsh-plugin`](https://github.com/topics/dsh-plugin) 话题，便于被发现。
- 欢迎加入 DeepSeek Harness 企微群！扫描下方二维码填写入群问卷，小助手会定期发送入群邀请。

<table>
  <thead>
    <tr>
      <th align="center">入群问卷</th>
      <th align="center">微信公众号</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="center"><a href="https://trtgsjkv6r.feishu.cn/share/base/form/shrcnIt5twSVdLGD52KJBckGCgg"><img src="https://cdn.deepseek.com/harness/readme/community-wecom-survey.png" alt="DeepSeek Harness 入群问卷二维码" width="180" height="180"></a></td>
      <td align="center"><img src="https://cdn.deepseek.com/harness/readme/community-wechat-official-account.png" alt="DeepSeek Harness 团队微信公众号二维码" width="180" height="180"></td>
    </tr>
  </tbody>
</table>

## 参与贡献

参见 [CONTRIBUTING.md](CONTRIBUTING.zh.md)。

## 开发

请先阅读[开发指南](docs/development.zh.md)与[架构文档](docs/architecture.zh.md)。

`pnpm run dev:web` 会在一个终端里完成构建、启动，并在源码修改时重建 client bundle；`make help` 列出 Web 与 Desktop 对应的 Make target。完整表格见开发指南的「应用命令」一节。

面向 agent：请遵循 [AGENTS.md](AGENTS.md)。

## 引用

```bibtex
@misc{deepseek-harness2026,
  title={DeepSeek Harness: Everything is a Plugin},
  author={DeepSeek-AI},
  year={2026},
  publisher={GitHub},
  howpublished={\url{https://github.com/deepseek-ai/deepseek-harness}},
}
```

## 许可证

[MIT](LICENSE)

第三方依赖及其许可证见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
