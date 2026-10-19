# File Hub

Windows 本地下载文件发现、标记和文件库管理工具。

## 第一阶段

- Electron + React + TypeScript 桌面界面，五个页面：首页概览、下载监听、待标记、文件库、设置。
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
