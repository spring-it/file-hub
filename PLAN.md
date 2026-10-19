# File Hub 实施计划

- [x] 定义状态机和标记字段校验。
- [x] SQLite 本地台账、监控程序/目录设置和操作记录。
- [x] Electron 主窗口、IPC 安全隔离和托盘框架。
- [x] 首页概览、下载监听、待标记、文件库、设置五个页面。
- [x] 标记、入库、忽略、恢复、编辑标记等业务流程。
- [x] 目录监听、文件稳定检查、临时文件过滤、SHA-256、补偿扫描。
- [x] Edge/Chrome 扩展与 Native Messaging 协议代码。
- [x] 为状态机、SQLite、文件监听和 Native Messaging 编写自动化测试。
- [x] Windows CI 安装依赖并运行自动化测试、TypeScript 检查和 Vite 构建；自动化测试已扩充，最新结果以 GitHub Actions 为准。
- [ ] 在真实 Windows 用户环境验证浏览器扩展安装、Native Messaging 注册、托盘行为和安装/卸载流程（CI 已成功生成 NSIS 安装包，但未做交互式实机验收）。
- [ ] 实现并验证普通客户端进程 I/O / ETW 监控。
- [x] 为哈希计算设置并发上限，限制扫描候选数和扫描深度，避免批量下载导致无界 I/O。
- [ ] 针对大文件、网络盘、辅助进程、临时文件重命名和高频下载做真实环境性能与兼容性测试。

## 限制

普通客户端目前依赖用户配置目录；ETW 进程级监控未完成。浏览器监控需要安装扩展并在设置中添加对应浏览器。Windows CI 已验证自动化测试、TypeScript 检查、Vite 构建和 NSIS 打包。CI 成功不等于真实浏览器扩展、托盘和安装/卸载行为已完成用户环境验收。

## Windows Release 发布门槛

- [x] 自动生成有效 PNG/ICO 图标，修复图标解码失败。
- [x] 修复应用入口未引入启动参数与浏览器 Native Messaging 检测模块的问题。
- [x] 为本机入口和图标加入回归测试。
- [x] 增加主分支的 Windows 发布工作流，执行测试、构建、安装包校验和 GitHub Release 上传。
- [x] 已将 CI 验证通过的代码合并至 main，并确认 [v0.1.0 Release](https://github.com/spring-it/file-hub/releases/tag/v0.1.0) 已上传 [FileHub-Setup-0.1.0.exe](https://github.com/spring-it/file-hub/releases/download/v0.1.0/FileHub-Setup-0.1.0.exe)。
- [ ] 在真实 Windows 桌面电脑执行首次安装、浏览器扩展联动与长时间运行验收。

## 发布记录

- 版本：**v0.1.0 Windows MVP 预览版**。
- 自动化发布结果：[Publish Windows Release — 成功](https://github.com/spring-it/file-hub/actions/runs/39275606725)。
- Windows 安装包：`FileHub-Setup-0.1.0.exe`，95,849,206 字节，已上传到 GitHub Releases。
- 仍待验收：真实 Windows 用户桌面的安装/卸载、浏览器扩展连通性、客户端兼容性和长时间运行性能；普通客户端未知目录的 ETW 监控尚未实现。
