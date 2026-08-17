# 한걸음 · 韩语入门

一个面向初学者的韩语学习应用，同时支持 **Web**、**iOS** 与 **Android**。项目以 React + TypeScript + Vite 编写，iOS/Android 端通过 Capacitor 将同一套 Web 界面打包为原生 App。

## 功能概览

- 韩文字母、元音、辅音与拼读练习
- 250 个高频韩语单词与 160 条常用短语
- Karina(Aespa) 语音音频播放与可调发音速度（默认 `1.0x`）
- 每日学习、复习测验、学习进度与连续学习统计
- 浅色、深色、跟随系统三种外观
- iPhone 安全区域适配、底部 Tab 导航与原生学习进度持久化

## 技术栈

- React 19、TypeScript、Vite
- Motion、Lucide React
- Capacitor 8（iOS、Android）
- `@capacitor/preferences`：iOS/Android 端使用原生 Preferences / UserDefaults 保存进度、主题和语速；Web 端使用 `IndexedDB`（并保留 `localStorage` 作为兼容缓存）

## 环境要求

### Web

- Node.js 20 或更高版本
- npm

### iOS

- macOS
- Xcode（已安装 iOS SDK）
- 可用的 Apple 开发者签名团队
- 连接并信任的 iPhone，且已开启**开发者模式**（如需真机安装）

### Android

- Windows / macOS / Linux
- Java 21（JDK 21）
- Android SDK（API 36）
- Android 手机需开启**开发者选项**和 **USB 调试**（如需 USB 安装）

## 安装依赖

```bash
npm install
```

## Web 开发与构建

启动本地开发服务器：

```bash
npm run dev
```

构建生产版本：

```bash
npm run build
```

预览已构建的 Web 版本：

```bash
npm run preview
```

构建产物会生成在 `dist/`，该目录是可再生构建产物，不会提交到仓库。

## iOS 构建与安装

### 1. 同步 Web 构建产物至 iOS 工程

```bash
npm run ios:sync
```

该命令会先执行 Web 构建，再把 `dist/` 同步到 Capacitor iOS 工程。

### 2. 使用 Xcode 构建

```bash
npm run ios:open
```

在 Xcode 中：

1. 选择 `App` target；
2. 在 **Signing & Capabilities** 中选择自己的 Development Team；
3. 选择模拟器或已连接的 iPhone；
4. 点击 Run（`⌘R`）构建并安装。

### 命令行真机构建（可选）

将以下设备 ID 替换为自己的设备 UDID：

```bash
npm run ios:sync

xcodebuild \
  -project ios/App/App.xcodeproj \
  -scheme App \
  -configuration Debug \
  -destination 'platform=iOS,id=YOUR_DEVICE_UDID' \
  -allowProvisioningUpdates \
  -derivedDataPath build/ios-device \
  build
```

构建完成后安装：

```bash
xcrun devicectl device install app \
  --device YOUR_COREDEVICE_ID \
  build/ios-device/Build/Products/Debug-iphoneos/App.app
```

启动：

```bash
xcrun devicectl device process launch \
  --device YOUR_COREDEVICE_ID \
  com.brian.korealearn
```

> `build/`、`dist/` 和 `ios/App/App/public/` 都是构建或同步产物，不需要提交。

## Android 构建与安装

### 一键构建（推荐）

修改代码后，一条命令完成构建、打包并启动下载服务：

```bash
npm run android:build
```

手机和电脑连接同一 WiFi，用手机浏览器打开终端输出的地址（如 `http://192.168.x.x:8888/app-debug.apk`）下载安装即可。

### 分步操作

#### 1. 同步 Web 构建产物至 Android 工程

```bash
npm run android:sync
```

#### 2. 构建 APK

```bash
cd android
.\gradlew assembleDebug
```

APK 文件位于 `android/app/build/outputs/apk/debug/app-debug.apk`。

#### 3. 安装到手机

**方式一：通过 ADB 安装**

```bash
adb install android\app\build\outputs\apk\debug\app-debug.apk
```

**方式二：传输文件安装**

将 APK 文件通过 USB 传输或文件共享发送到手机，直接点击安装。首次安装需允许「安装未知来源应用」。

### 更新应用

修改代码后重新执行 `npm run android:build` 即可。新版本会覆盖旧版本，学习进度和数据保留不变。

> `android/` 目录中的 `local.properties`、`build/` 等为构建产物或本地配置，不需要提交。

## 音频资源

`public/audio/` 内包含应用运行需要的已生成语音音频与音频索引，会提交到仓库，确保 Web 和 iOS 打包后可直接使用。

如需重新生成音频，在项目根目录创建 `.env.local` 并配置所需密钥。`.env.local` 仅存放本机私密配置，已被 Git 忽略，**绝不能提交**。

```bash
npm run generate-audio -- --scope=words --concurrency=4
npm run generate-audio -- --scope=phrases --concurrency=4
```

## 持久化说明

- **Web**：学习进度、主题和语速保存在浏览器 `IndexedDB`，`localStorage` 仅作为同步缓存与旧版本数据迁移来源。
- **iOS / Android**：同一数据还会保存到 Capacitor Preferences（原生 UserDefaults / SharedPreferences），因此 App 正常关闭、重新打开或覆盖更新后仍会保留。
- 卸载 App、换设备或清除浏览器网站数据会清除本地数据。跨设备同步需要后续接入账号与云端存储。

## 版本控制约定

仓库会提交源码、iOS 工程、图标和应用音频资源；下列可再生或私密文件不提交：

- `node_modules/`
- `dist/`
- `build/`
- `ios/App/App/public/`
- `*.tsbuildinfo`
- `.env.local`
- `.DS_Store`
