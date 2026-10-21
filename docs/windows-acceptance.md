# File Hub v0.2.0 — Windows 桌面验收清单

以下项目必须由能操作真实 Windows 桌面的测试人员执行。GitHub Actions 已完成自动化测试、实际 ETW I/O 管道冒烟测试、NSIS 静默安装/卸载与 Native Messaging 注册校验；**自动化成功不等于桌面通知、UAC 或第三方客户端兼容性验收完成**。

## 1. 测试前准备

记录 Windows 版本（Windows 10/11）、登录账户是否具备管理员授权能力、Edge/Chrome 版本、要监听的客户端 EXE 路径及测试日期。

从 [feature 分支 Windows CI](https://github.com/spring-it/file-hub/actions/workflows/ci.yml) 选择最新通过的运行，在 Artifacts 下载 `file-hub-windows-installer`，取得 `FileHub-Setup-0.2.0.exe`。不要使用正式 Release 中的 v0.1.0 作为 v0.2.0 测试包。

## 2. 可视化安装与启动

- [ ] 运行安装程序，选择安装目录，安装结束后确认“文件中转站”能正常启动。
- [ ] 确认导航仅有“首页概览 / 下载监听与标记 / 文件库 / 设置”四个页面。
- [ ] 确认安装目录 `resources\agent\FileHub.EtwAgent.exe`、`resources\extension\manifest.json` 均存在。
- [ ] 确认 Windows 系统通知允许 File Hub，勿启用“请勿打扰”（否则通知可能被系统延后或屏蔽）。
- [ ] 关闭主窗口后确认托盘图标与重新打开行为，使用托盘“退出”确认进程正常退出。

## 3. Chrome / Edge 下载联动

- [ ] Edge 打开 `edge://extensions`，Chrome 打开 `chrome://extensions`；开启开发人员模式，从安装目录的 `resources\extension` 加载扩展。
- [ ] 在 File Hub 设置中选择浏览器 EXE，启用“浏览器下载事件”。
- [ ] 检查 Native Messaging 注册表：`HKCU\Software\Google\Chrome\NativeMessagingHosts\com.springit.filehub`、`HKCU\Software\Microsoft\Edge\NativeMessagingHosts\com.springit.filehub`，其值应指向 `%LOCALAPPDATA%\FileHub\com.springit.filehub.json`。
- [ ] 将浏览器下载目录改为一个未添加到目录监听的文件夹，下载 PDF、ZIP 各一个，验证 File Hub 能看到真实路径、来源为浏览器且不重复。
- [ ] 文件写入完成后确认 Windows 原生通知出现；点击通知，File Hub 应聚焦并选中对应文件，右侧显示标记表单。
- [ ] 连续下载多个文件，确认通知会合并提示数量，但每个文件都有独立台账。
- [ ] 停用扩展、重启浏览器、重新启用扩展并再次下载，确认恢复后仍可工作。

## 4. 标记与文件库

- [ ] 在合并页填写项目、文件版本、预计发送对象、预计发送时间、标签和备注，点击“保存标记”；确认状态变为“待入库”，文件未被复制到文件库。
- [ ] 点击“保存并入库”，确认文件副本存在，状态变为“已入库”；从文件库能定位到这一个文件，而不是其他文件。
- [ ] 对另一文件点击“稍后处理”，确认文件仍保留；对另一文件执行“忽略”和“恢复”，确认状态及操作历史准确。
- [ ] 在多于 200 条记录的情况下点击历史通知，确认不会打开错误文件，并能通过“加载更早记录”继续分页。

## 5. 普通客户端与 ETW

- [ ] 添加一个实际业务客户端 EXE，配置已知下载目录，先验证“目录监听”模式正常发现新文件。
- [ ] 修改为“进程 I/O + 目录”，允许 Windows 管理员 UAC，确认 Agent 启动且没有 ETW 会话/管道错误。
- [ ] 使用该客户端把文件下载到未配置目录，确认 ETW 能发现至少一次有效文件 I/O，并在稳定性判断后进入台账；若漏报，记录具体客户端及辅助进程路径。
- [ ] 测试临时扩展名（`.part`/`.tmp`/`.crdownload`）写入并重命名为最终文件，确认不将临时文件当作下载完成。
- [ ] 测试客户端使用子进程下载、删除/关闭程序和停用组合监听后的行为。
- [ ] 记录 ETW 误报（例如普通文档编辑触发的文件写入）；**ETW 文件 I/O 不等于下载完成**，如无法可靠归因，应退回目录模式。

## 6. 性能与卸载

- [ ] 测试不少于 100 个连续下载项、一个大于 1 GB 的文件及一个网络盘/同步目录样本，记录发现数量、漏报、误报、CPU、内存与处理延迟。
- [ ] 连续运行 2 小时以上，重启 File Hub，确认 SQLite 数据保留且补偿扫描能补记遗漏文件。
- [ ] 通过 Windows 设置的“已安装的应用”执行卸载，确认应用 EXE 删除且 Chrome/Edge Native Messaging 注册项被清理；根据项目数据保留策略核对本地数据。

## 7. 验收记录

将测试日期、Windows 版本、测试 EXE 和版本、每条失败项的复现步骤、截图/日志、实际结果及责任人写入测试报告。完成后再逐项勾选 [PLAN.md](../PLAN.md) 的“必须在真实 Windows 桌面完成的验收”，最后评估是否合并到 main 并发布 v0.2.0。
