# File Hub

Windows 本地下载文件发现、标记和文件库管理工具。

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

普通客户端当前依赖用户配置的保存目录。添加 EXE 路径不等于能够发现它在任意路径的所有写入；进程级 ETW 监控尚未实现。浏览器扩展需要安装并在设置中启用相应浏览器。

见 [技术方案](docs/technical-implementation.md)、[实施计划](PLAN.md)、[页面设计](docs/design/README.md)。

## 浏览器扩展安装（开发/试用）

1. 先安装并启动 File Hub 一次，安装程序会注册 Native Messaging Host。
2. 在 Edge 打开 `edge://extensions`，或在 Chrome 打开 `chrome://extensions`，启用“开发人员模式”。
3. 选择“加载解压缩的扩展”，指向安装目录中的 `resources/extension`（开发环境可直接选择仓库中的 `extension` 目录）。
4. 在 File Hub 设置中添加对应的 Edge/Chrome EXE 并启用浏览器下载监听。
5. 下载一个小文件，确认“下载监听”和“待标记”中出现记录。

扩展使用固定公钥标识，Native Messaging Host 的允许来源与该扩展 ID 对应。正式企业部署时建议通过组织策略分发扩展；手动加载仅用于开发与试用。若浏览器显示 Native Host 不可用，请检查安装目录、注册表清单路径和扩展 ID。
