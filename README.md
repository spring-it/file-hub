# File Hub

Windows 本地下载文件发现、标记和文件库管理工具。

## 当前开发版本

当前开发分支版本为 0.2.0（尚未发布）。已发布的基线版本请见 [v0.1.0 Release](https://github.com/spring-it/file-hub/releases/tag/v0.1.0)。

## 第一阶段

- Electron + React + TypeScript 桌面界面，四个页面：首页概览、下载监听与标记、文件库、设置。
- SQLite 本地台账，记录文件来源、哈希、业务版本、预计发送对象和时间。
- 多目录监听、文件稳定性检查、临时文件过滤、SHA-256 和手动扫描。
- Edge/Chrome 下载扩展与 Native Messaging 桥接原型。
- 内部网页外发集成暂不在第一阶段实现。

## 开发

```bash
npm install
npm test
npm run dev
npm run build
npm run package:win
```

打包 Windows 安装程序还需要安装 .NET 10 SDK，以构建自包含的 ETW 代理。`npm run dev` 不要求 ETW 代理已构建；若要试用进程级监听，请先运行 `npm run build:agent`。

普通客户端可配置保存目录；也可在设置中选择“进程 I/O + 目录”启用可选 ETW 监听。ETW 启用或重新启动进程监听时会请求 Windows 管理员授权，只跟踪所选 EXE 及其子进程；请先在目标 Windows 电脑上验证权限、客户端与网络盘兼容性。浏览器扩展需要安装并在设置中启用相应浏览器。

见 [技术方案](docs/technical-implementation.md)、[实施计划](PLAN.md)、[页面设计](docs/design/README.md)。

## 浏览器扩展安装（开发/试用）

1. 先安装并启动 File Hub 一次，安装程序会注册 Native Messaging Host。
2. 在 Edge 打开 `edge://extensions`，或在 Chrome 打开 `chrome://extensions`，启用“开发人员模式”。
3. 选择“加载解压缩的扩展”，指向安装目录中的 `resources/extension`（开发环境可直接选择仓库中的 `extension` 目录）。
4. 在 File Hub 设置中添加对应的 Edge/Chrome EXE 并启用浏览器下载监听。
5. 下载一个小文件，确认“下载监听与标记”中出现记录。

扩展使用固定公钥标识，Native Messaging Host 的允许来源与该扩展 ID 对应。正式企业部署时建议通过组织策略分发扩展；手动加载仅用于开发与试用。若浏览器显示 Native Host 不可用，请检查安装目录、注册表清单路径和扩展 ID。
