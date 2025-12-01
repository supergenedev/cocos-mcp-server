# Cocos Creator 2.x MCP Server Plugin

**[📖 English](README.2X.EN.md)** **[📖 中文](README.2X.md)**

This is the **Cocos Creator 2.x compatible version** of the Cocos MCP Server.

## ⚠️ Important Notice

**This version is designed for Cocos Creator 2.4.x and above in the 2.x series.**

- ✅ Supports Cocos Creator 2.4.x - latest 2.x series versions
- ❌ NOT compatible with Cocos Creator 3.x (use the original version)

### Key Differences from 3.x Version

1. **Editor API**: Uses 2.x `Editor.Ipc` and `Editor.assetdb`(lowercase!) instead of 3.x `Editor.Message` system
   - ⚠️ **Important**: In 2.x it's `Editor.assetdb` (lowercase), NOT `Editor.AssetDB`
   - ⚠️ `Editor.App.path` → `Editor.appPath` (direct property)
2. **Runtime API**: Uses global `cc` namespace instead of modular imports
3. **Vue Version**: Uses Vue 2 instead of Vue 3
4. **Extension System**: `package_version: 1` (2.x extension system)
5. **Scene Format**: 2.x scene file format is incompatible with 3.x

## Features

Provides 50 powerful tools for comprehensive control of the Cocos Creator 2.x editor:

### 🎯 Scene Operations (scene_*)
- Scene management, hierarchy queries, execution control

### 🎮 Node Operations (node_*)
- Node queries, lifecycle management, transform operations, hierarchy management

### 🔧 Component Operations (component_*)
- Component management, script mounting, property setting

### 📦 Prefab Operations (prefab_*)
- Prefab browsing, lifecycle, instantiation, editing

### 📁 Asset Management (asset_*)
- Asset management, analysis, system queries, batch operations

### 🚀 Project Control (project_*)
- Project management, build system

### 🔍 Debug Tools (debug_*)
- Console management, log analysis, system debugging

### ⚙️ Other Features
- Preferences management
- Server information
- Message broadcasting
- Scene view control
- Reference image management
- Asset validation

## System Requirements

- **Cocos Creator 2.4.0 or higher** (2.x series only)
- Node.js (bundled with Cocos Creator)
- Does NOT support Cocos Creator 3.x

## Installation

### 1. Copy Plugin Files

Copy the entire `cocos-mcp-server` folder to your Cocos Creator 2.x project's `extensions` directory:

```
YourProject/
├── assets/
├── extensions/
│   └── cocos-mcp-server/          <- Place plugin here
│       ├── source/
│       ├── dist/
│       ├── package.json
│       └── ...
├── settings/
└── ...
```

### 2. Install Dependencies

```bash
cd extensions/cocos-mcp-server
npm install
```

### 3. Build the Plugin

```bash
npm run build
```

### 4. Enable Plugin

1. Restart Cocos Creator 2.x or refresh extensions
2. The plugin will appear in the Extension menu
3. Click `Extension > Cocos MCP Server` to open the control panel

## Usage

### Starting the Server

1. Open the MCP Server panel from `Extension > Cocos MCP Server`
2. Configure settings:
   - **Port**: HTTP server port (default: 3000)
   - **Auto Start**: Automatically start server when editor opens
   - **Debug Logging**: Enable detailed logging
   - **Max Connections**: Maximum concurrent connections allowed

3. Click "Start Server" to begin accepting connections

### Connecting AI Assistants

The server provides an HTTP endpoint at `http://localhost:3000/mcp` (or your configured port).

**Claude CLI configuration:**

```bash
claude mcp add --transport http cocos-creator http://127.0.0.1:3000/mcp
```

**Claude client configuration:**

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

**Cursor or VS Code MCP configuration:**

```json
{
  "mcpServers": {
    "cocos-creator": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

## Migration Notes

### Migrating from 3.x Version

If you previously used the 3.x version of the MCP server:

1. **Do NOT replace directly**: 3.x and 2.x versions are incompatible
2. **Install separately**: Use different versions in different projects
3. **API differences**: Tool calling methods are the same, but implementations differ

### Upgrading to 3.x

If you want to upgrade to Cocos Creator 3.x:

1. Use the original MCP server (non-2.x version)
2. Follow the official Cocos Creator upgrade guide to migrate your project
3. Reinstall the 3.x version of the MCP server

## Known Limitations

1. **Type Definitions**: 2.x lacks official TypeScript type definitions
2. **Performance**: Some operations may be slower than the 3.x version
3. **Feature Differences**: Some advanced features may not be available in 2.x
4. **Scene Format**: 2.x and 3.x scene file formats are completely incompatible
5. **API Limitations**: 2.x Editor API has relatively limited functionality

## Troubleshooting

### Common Issues

1. **Server won't start**: Check port availability and firewall settings
2. **Tools not working**: Ensure you're using Cocos Creator 2.x, not 3.x
3. **Build errors**: Run `npm run build` to check for TypeScript errors
4. **Connection issues**: Verify HTTP URL and server status
5. **Extension won't load**: Confirm `package_version` is 1

### Debug Mode

Enable debug logging in the plugin panel for detailed operation logs.

## Development

### Project Structure

```
cocos-mcp-server/
├── source/                    # TypeScript source files
│   ├── main.ts               # Plugin entry point
│   ├── mcp-server.ts         # MCP server implementation
│   ├── scene.ts              # Scene script (2.x API)
│   ├── types/                # TypeScript type definitions
│   │   ├── editor-2x.d.ts   # 2.x Editor API types
│   │   └── cc-2x.d.ts       # 2.x cc runtime types
│   ├── tools/                # Tool implementations (migrated to 2.x)
│   └── panels/               # UI panels (Vue 2)
├── dist/                     # Compiled JavaScript output
├── MIGRATION_GUIDE_2X.md     # Detailed migration guide
└── package.json              # 2.x extension configuration
```

### Building from Source

```bash
# Install dependencies
npm install

# Build for development with watch mode
npm run watch

# Build for production
npm run build
```

## Reference Documentation

- [Cocos Creator 2.x Documentation](https://docs.cocos.com/creator/2.4/manual/en/)
- [Cocos Creator 2.x API](https://docs.cocos.com/creator/2.4/api/)
- [2.x Extension Development](https://docs.cocos.com/creator/2.4/manual/en/extension/)
- [Migration Guide](MIGRATION_GUIDE_2X.md)

## License

This plugin is for Cocos Creator project use with open source code for learning and communication. It cannot be used for any commercial purposes or resale. For commercial use, please contact the author.

## Version Information

- **Version**: 2.0.0-2x
- **Based on**: Cocos MCP Server 1.4.0
- **Target Platform**: Cocos Creator 2.4+ (2.x series)
- **Maintenance Status**: Active

## Contact

For questions or suggestions, contact:

- Original Author: LiDaxian
- 2.x Adaptation: Community Contribution

