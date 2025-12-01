# Cocos Creator 2.x MCP 服务器插件

**[📖 English](README.2X.EN.md)** **[📖 中文](README.2X.md)**

这是 Cocos MCP Server 的 **Cocos Creator 2.x 兼容版本**。

## ⚠️ 重要说明

**此版本专为 Cocos Creator 2.4.x 及以上版本设计。**

- ✅ 支持 Cocos Creator 2.4.x - 2.x 系列最新版本
- ❌ 不兼容 Cocos Creator 3.x（请使用原版本）

### 与 3.x 版本的主要区别

1. **编辑器 API**: 使用 2.x 的 `Editor.Ipc` 和 `Editor.assetdb`(小写!) 代替 3.x 的 `Editor.Message` 系统
   - ⚠️ **注意**: 2.x 中是 `Editor.assetdb` (小写), 不是 `Editor.AssetDB`
   - ⚠️ `Editor.App.path` → `Editor.appPath` (直接属性)
2. **运行时 API**: 使用全局 `cc` 命名空间而非模块化导入
3. **Vue 版本**: 使用 Vue 2 而非 Vue 3
4. **扩展系统**: `package_version: 1` (2.x 扩展系统)
5. **场景格式**: 2.x 场景文件格式与 3.x 不兼容

## 功能特性

提供 50 个强大的工具，实现对 Cocos Creator 2.x 编辑器的全面控制：

### 🎯 场景操作 (scene_*)
- 场景管理、层级查询、执行控制

### 🎮 节点操作 (node_*)
- 节点查询、生命周期管理、变换操作、层级管理

### 🔧 组件操作 (component_*)
- 组件管理、脚本挂载、属性设置

### 📦 预制体操作 (prefab_*)
- 预制体浏览、生命周期、实例化、编辑

### 📁 资源管理 (asset_*)
- 资源管理、分析、系统查询、批量操作

### 🚀 项目控制 (project_*)
- 项目管理、构建系统

### 🔍 调试工具 (debug_*)
- 控制台管理、日志分析、系统调试

### ⚙️ 其他功能
- 偏好设置管理
- 服务器信息
- 消息广播
- 场景视图控制
- 参考图片管理
- 资源验证

## 系统要求

- **Cocos Creator 2.4.0 或更高版本** (2.x 系列)
- Node.js (Cocos Creator 自带)
- 不支持 Cocos Creator 3.x

## 安装说明

### 1. 复制插件文件

将整个 `cocos-mcp-server` 文件夹复制到您的 Cocos Creator 2.x 项目的 `extensions` 目录中：

```
您的项目/
├── assets/
├── extensions/
│   └── cocos-mcp-server/          <- 将插件放在这里
│       ├── source/
│       ├── dist/
│       ├── package.json
│       └── ...
├── settings/
└── ...
```

### 2. 安装依赖

```bash
cd extensions/cocos-mcp-server
npm install
```

### 3. 构建插件

```bash
npm run build
```

### 4. 启用插件

1. 重启 Cocos Creator 2.x 或刷新扩展
2. 插件将出现在扩展菜单中
3. 点击 `扩展 > Cocos MCP Server` 打开控制面板

## 使用方法

### 启动服务器

1. 从 `扩展 > Cocos MCP Server` 打开 MCP 服务器面板
2. 配置设置：
   - **端口**: HTTP 服务器端口（默认：3000）
   - **自动启动**: 编辑器启动时自动启动服务器
   - **调试日志**: 启用详细日志
   - **最大连接数**: 允许的最大并发连接数

3. 点击"启动服务器"开始接受连接

### 连接 AI 助手

服务器在 `http://localhost:3000/mcp`（或您配置的端口）上提供 HTTP 端点。

**Claude CLI 配置：**

```bash
claude mcp add --transport http cocos-creator http://127.0.0.1:3000/mcp
```

**Claude 客户端配置：**

```json
{
  "mcpServers": {
    "cocos-creator": {
      "type": "http",
      "url": "http://127.0.0.1:3000/mcp"
    }
  }
}
```

**Cursor 或 VS Code MCP 配置：**

```json
{
  "mcpServers": {
    "cocos-creator": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

## 迁移说明

### 从 3.x 版本迁移

如果您之前使用 3.x 版本的 MCP 服务器：

1. **不要直接替换**: 3.x 和 2.x 版本不兼容
2. **单独安装**: 在不同的项目中使用不同版本
3. **API 差异**: 工具调用方式相同，但底层实现不同

### 升级到 3.x

如果您想升级到 Cocos Creator 3.x：

1. 使用原版 MCP 服务器（非 2.x 版本）
2. 按照 Cocos Creator 官方升级指南迁移项目
3. 重新安装 3.x 版本的 MCP 服务器

## 已知限制

1. **类型定义**: 2.x 没有官方 TypeScript 类型定义
2. **性能**: 某些操作可能比 3.x 版本慢
3. **功能差异**: 部分高级功能可能在 2.x 中不可用
4. **场景格式**: 2.x 和 3.x 的场景文件格式完全不兼容
5. **API 限制**: 2.x Editor API 功能相对有限

## 故障排除

### 常见问题

1. **服务器无法启动**: 检查端口可用性和防火墙设置
2. **工具不工作**: 确保使用 Cocos Creator 2.x 而非 3.x
3. **构建错误**: 运行 `npm run build` 检查 TypeScript 错误
4. **连接问题**: 验证 HTTP URL 和服务器状态
5. **扩展无法加载**: 确认 `package_version` 为 1

### 调试模式

在插件面板中启用调试日志以获取详细的操作日志。

## 开发

### 项目结构

```
cocos-mcp-server/
├── source/                    # TypeScript 源文件
│   ├── main.ts               # 插件入口点
│   ├── mcp-server.ts         # MCP 服务器实现
│   ├── scene.ts              # 场景脚本 (2.x API)
│   ├── types/                # TypeScript 类型定义
│   │   ├── editor-2x.d.ts   # 2.x Editor API 类型
│   │   └── cc-2x.d.ts       # 2.x cc 运行时类型
│   ├── tools/                # 工具实现 (已迁移到 2.x)
│   └── panels/               # UI 面板 (Vue 2)
├── dist/                     # 编译后的 JavaScript 输出
├── MIGRATION_GUIDE_2X.md     # 详细迁移指南
└── package.json              # 2.x 扩展配置
```

### 从源码构建

```bash
# 安装依赖
npm install

# 开发构建（监视模式）
npm run watch

# 生产构建
npm run build
```

## 参考文档

- [Cocos Creator 2.x 文档](https://docs.cocos.com/creator/2.4/manual/zh/)
- [Cocos Creator 2.x API](https://docs.cocos.com/creator/2.4/api/)
- [2.x 扩展开发文档](https://docs.cocos.com/creator/2.4/manual/zh/extension/)
- [迁移指南](MIGRATION_GUIDE_2X.md)

## 许可证

本插件供 Cocos Creator 项目使用，源代码开放，可用于学习和交流。不得用于任何商用或转售。如需商用，请联系作者。

## 版本信息

- **版本**: 2.0.0-2x
- **基于**: Cocos MCP Server 1.4.0
- **目标平台**: Cocos Creator 2.4+ (2.x 系列)
- **维护状态**: 活跃

## 联系方式

如有问题或建议，请通过以下方式联系：

- 原作者: LiDaxian
- 2.x 适配: Community Contribution

