# 🎵 MusicFree 纯净稳定双源插件合集 (QQ音乐 + 网易云音乐)

[![MusicFree](https://img.shields.io/badge/MusicFree-Plugin-blue.svg)](https://github.com/maotoumao/MusicFree)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Android%20%7C%20Linux-brightgreen.svg)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg)](#)

> 本插件包专为开源播放器 **[MusicFree](https://github.com/maotoumao/MusicFree)** 深度调优，聚合 **QQ 音乐** 与 **网易云音乐** 官方音源，彻底打破版权壁垒，实现周杰伦全曲库秒播、全量官方排行榜与热门歌单聚合解析，纯净无广告、不偷跑流量。

---

## 💻 播放器客户端官方下载 (Windows / 安卓 / Mac)

> 💡 **很多朋友找不到 Windows 电脑版？**
> 因为官方把电脑端与手机端分在了两个不同仓库（`MusicFree` 为安卓端，`MusicFreeDesktop` 为电脑端）。这里为大家整理了全平台最新版直连下载（已贴心配备国内加速镜像，直接点击即可高速下载）：

| 操作系统 | 推荐版本 | 国内高速镜像下载 (直链推荐) | GitHub 官方原生下载 |
| :--- | :--- | :---: | :---: |
| 🪟 **Windows 电脑** | 官方安装包 (`.exe`) | [🚀 点击极速下载 (.exe)](https://ghfast.top/https://github.com/maotoumao/MusicFreeDesktop/releases/download/v0.0.8/MusicFree-0.0.8-win32-x64-setup.exe) | [官方 Release](https://github.com/maotoumao/MusicFreeDesktop/releases/download/v0.0.8/MusicFree-0.0.8-win32-x64-setup.exe) |
| 🪟 **Windows 电脑** | 绿色便携免安装版 (`.zip`) | [🚀 点击极速下载 (.zip)](https://ghfast.top/https://github.com/maotoumao/MusicFreeDesktop/releases/download/v0.0.8/MusicFree-0.0.8-win32-x64-portable.zip) | [官方 Release](https://github.com/maotoumao/MusicFreeDesktop/releases/download/v0.0.8/MusicFree-0.0.8-win32-x64-portable.zip) |
| 📱 **Android 安卓手机/平板** | 通用完整版 (`.apk`) | [🚀 点击极速下载 (.apk)](https://ghfast.top/https://github.com/maotoumao/MusicFree/releases/download/v0.6.2/app-universal-release.apk) | [官方 Release](https://github.com/maotoumao/MusicFree/releases/download/v0.6.2/app-universal-release.apk) |
| 🍎 **macOS 苹果电脑** | Apple Silicon (M1/M2/M3/M4) | [🚀 点击极速下载 (.dmg)](https://ghfast.top/https://github.com/maotoumao/MusicFreeDesktop/releases/download/v0.0.8/MusicFree-0.0.8-darwin-arm64.dmg) | [官方 Release](https://github.com/maotoumao/MusicFreeDesktop/releases/download/v0.0.8/MusicFree-0.0.8-darwin-arm64.dmg) |
| 🍎 **macOS 苹果电脑** | Intel 处理器版 | [🚀 点击极速下载 (.dmg)](https://ghfast.top/https://github.com/maotoumao/MusicFreeDesktop/releases/download/v0.0.8/MusicFree-0.0.8-darwin-x64.dmg) | [官方 Release](https://github.com/maotoumao/MusicFreeDesktop/releases/download/v0.0.8/MusicFree-0.0.8-darwin-x64.dmg) |

---

## 🚀 方式一：音源插件一键网络安装（强烈推荐 · 复制即装，无需下载）

无需下载任何 `.js` 文件，复制下方任意一条链接，即可在播放器内一键秒装所有插件：

### 🔗 插件网络订阅源链接 (复制其一即可)：

* **【线路 1 · 全球高速 CDN（国内秒开 · 首选推荐）】**：
  ```text
  https://cdn.jsdelivr.net/gh/lukaizj/musicfree-plugins@main/plugins.json
  ```
* **【线路 2 · 国内高速镜像代理】**：
  ```text
  https://ghfast.top/https://raw.githubusercontent.com/lukaizj/musicfree-plugins/main/plugins-ghproxy.json
  ```
* **【线路 3 · GitHub 原生直连（海外/梯子用户推荐）】**：
  ```text
  https://raw.githubusercontent.com/lukaizj/musicfree-plugins/main/plugins-raw.json
  ```

---

### 📱 手机端 (Android) 安装步骤：
1. 在微信或浏览器中**长按复制**上方【线路 1】链接；
2. 打开手机上的 **MusicFree** App；
3. 点击左上角 **「三条杠 ☰」** 展开侧边栏 ➔ 点击 **「插件设置」**；
4. 点击右下角（或右上角）的 **「+」** 号 ➔ 选择 **「从网络安装插件」**；
5. **粘贴刚才复制的链接** ➔ 点击 **「确定 / 安装」**；
6. 提示安装成功！此时返回首页搜索“周杰伦”或任意歌曲即可畅听。

---

### 💻 电脑端 (Windows / macOS / Linux) 安装步骤：
1. 复制上方【线路 1】链接；
2. 打开电脑端 **MusicFree**；
3. 点击左下角侧边栏的 **「插件管理」**（拼图图标）；
4. 点击右上角的 **「+」** 或 **「从网络安装」**；
5. 粘贴链接并回车，两个核心音源插件秒级安装完成！

---

## 📦 方式二：本地文件离线安装 (备用方案)

如果你处于离线环境，或网络安装遇到限制，也可以直接下载单个插件本地导入：

1. 下载本仓库中的插件文件到本地：
   * `qq.js` (或 `01-QQ音乐.js`)
   * `netease.js` (或 `02-网易云音乐.js`)
2. 打开 MusicFree ➔ 进入 **「插件管理 / 插件设置」**；
3. 点击 **「+」** ➔ 选择 **「从本地安装」**；
4. 选中下载的 `.js` 文件即可导入。

---

## ✨ 核心特性

1. **周杰伦全曲库智能解析**：
   - 内置智能音源调度，自动绕过各大平台的变灰与付费限制，原版音质直接秒开播放。
2. **完整支持官方排行榜**：
   - **QQ 音乐**：飙升榜、热歌榜、新歌榜、流行指数榜等官方全量榜单；
   - **网易云音乐**：官方 64 个全量榜单实时同步。
3. **海量精选热门歌单**：
   - 华语、流行、摇滚、民谣、ACG 等全分类热门歌单直接无缝加载与播放。
4. **单文件绿色无污染**：
   - 零多余权限，零外部广告，不收集任何个人隐私，极速纯净。

---

## 📢 常见问题排查

* **Q：提示“网络超时”或“解析失败”怎么办？**
  * A：由于各地网络环境差异，请尝试更换上方 **【线路 2】** 或 **【线路 3】** 重新粘贴安装。
* **Q：有些冷门歌曲放不了？**
  * A：可以在播放界面切换音源（在歌曲列表点击更多 ➔ 切换音源），QQ 音乐与网易云双源互补，基本覆盖 99% 华语音乐。

---

## 📄 免责声明

* 本项目所有插件仅供个人技术研究、学习与音视频开发接口测试使用；
* 插件本身不存储、不分发任何受版权保护的音视频文件，所有音频流均来源于公开第三方检索与解析接口；
* 请在遵守相关平台服务条款的前提下使用，支持正版音乐。
