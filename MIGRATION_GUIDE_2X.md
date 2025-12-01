# Cocos Creator 2.x Migration Guide

This guide explains how to migrate the remaining tool files from 3.x to 2.x API.

## Completed Migrations

### ✅ Phase 1: Extension System
- [x] package.json updated for 2.x (package_version: 1, editor: ">=2.4.0 <3.0.0")
- [x] Dependencies updated (Vue 2, removed @cocos/creator-types)
- [x] Type definitions created (editor-2x.d.ts, cc-2x.d.ts)
- [x] tsconfig.json updated

### ✅ Phase 2: Editor API
- [x] main.ts updated with type references
- [x] Message system structure compatible

### ✅ Phase 3: Runtime & Tools
- [x] scene.ts completely rewritten for 2.x cc API
- [x] scene-tools.ts migrated to 2.x Editor API

## API Migration Reference

### Editor.Message.request() → 2.x Alternatives

#### Scene Operations
```typescript
// 3.x
Editor.Message.request('scene', 'query-node-tree')
Editor.Message.request('scene', 'execute-scene-script', options)

// 2.x
Editor.Scene.callSceneScript('package-name', 'method-name', ...args)
```

#### Asset Database Operations
```typescript
// 3.x
Editor.Message.request('asset-db', 'query-assets', { pattern: '...' })
Editor.Message.request('asset-db', 'create-asset', path, content)

// 2.x (Note: 'assetdb' is lowercase in 2.x!)
Editor.assetdb.queryAssets(pattern, type, callback)
Editor.assetdb.create(path, content, callback)
Editor.assetdb.refresh(url, callback)
// Note: queryMetas, import, delete functions do NOT exist in 2.x
```

#### Scene Management
```typescript
// 3.x
Editor.Message.request('scene', 'open-scene', uuid)
Editor.Message.request('scene', 'save-scene')
Editor.Message.request('scene', 'close-scene')

// 2.x
Editor.Ipc.sendToMain('scene:open-scene', path, callback)
Editor.Ipc.sendToMain('scene:save-scene', callback)
Editor.Ipc.sendToMain('scene:close-scene', callback)
```

### cc Runtime API Changes

#### Accessing cc namespace
```typescript
// 3.x
const { director, Scene, Node } = require('cc');

// 2.x
// cc is global, no require needed
cc.director.getScene();
new cc.Node();
new cc.Scene();
```

#### Position/Transform
```typescript
// 3.x
node.position // Vec3 object
node.setPosition(x, y, z)

// 2.x
node.x, node.y // Direct properties for 2D
node.position // Can be Vec2 or Vec3
node.setPosition(x, y) // For 2D nodes
```

#### Scale/Rotation
```typescript
// 3.x
node.scale // Vec3 object
node.setScale(x, y, z)

// 2.x
node.scaleX, node.scaleY // Direct properties
node.setScale(x, y) // For 2D nodes
node.rotation // Single number (degrees) for 2D
```

#### Component Access
```typescript
// 3.x
node.components // Array of components
comp.constructor.name // Get component type

// 2.x
node._components // Internal array (use with caution)
cc.js.getClassName(comp) // Get component name
```

#### Asset Loading
```typescript
// 3.x
const { assetManager } = require('cc');
assetManager.loadAny({ uuid: value }, callback);
assetManager.resources.load(path, type, callback);

// 2.x
cc.loader.loadRes(path, type, callback);
cc.loader.load(url, callback);
```

## Remaining Tool Files to Migrate

### node-tools.ts
- Update any Editor.Message.request() calls
- Add type references: `/// <reference path="../types/editor-2x.d.ts" />`
- Ensure scene script calls use Editor.Scene.callSceneScript()

### component-tools.ts
- Update Editor API calls
- Use cc.js.getClassByName() for component types
- Handle component property setting for 2.x

### prefab-tools.ts
- Update Editor.AssetDB calls for prefab operations
- Use 2.x prefab format (different from 3.x)
- Update cc.instantiate() usage

### asset-advanced-tools.ts
- Migrate all Editor.Message.request('asset-db', ...) calls
- Use Editor.AssetDB methods directly
- Update callbacks to match 2.x API

### project-tools.ts
- Update Editor.Project API usage
- Use Editor.Ipc for project operations
- Update build and run commands

### debug-tools.ts
- Update console and logging APIs
- Use Editor logging methods

### preferences-tools.ts
- Update Editor preference APIs
- Use Editor.Profile for 2.x

### broadcast-tools.ts
- Update message broadcasting
- Use Editor.Ipc.sendToAll() for broadcasts

## Tool Files That May Not Need Changes

These tool files likely don't directly use Editor or cc APIs:
- validation-tools.ts (may only do data validation)
- server-tools.ts (MCP server info)
- tool-manager.ts (internal tool management)

## Testing Checklist

After migration, test these operations in 2.x:
- [ ] Scene opening/saving/closing
- [ ] Node creation/deletion/property changes
- [ ] Component add/remove
- [ ] Prefab instantiation
- [ ] Asset queries and creation
- [ ] Project build and run
- [ ] Console logging

## Known Limitations in 2.x

1. **No TypeScript types**: Official @cocos/creator-types only for 3.x
2. **Different scene format**: 2.x and 3.x scene files are incompatible
3. **API differences**: Many Editor APIs have different signatures
4. **Message system**: IPC system works differently
5. **Performance**: Some operations may be slower in 2.x

## Quick Reference

### Add to all tool files:
```typescript
/// <reference path="../types/editor-2x.d.ts" />
/// <reference path="../types/cc-2x.d.ts" />
```

### Pattern replacement:
1. Find: `Editor.Message.request('scene'`
   Replace with: `Editor.Scene.callSceneScript(` or `Editor.Ipc.sendToMain('scene:`

2. Find: `Editor.Message.request('asset-db'`
   Replace with: `Editor.AssetDB.`

3. Find: `require('cc')`
   Replace with: `cc` (use global)

4. Find: `const { ... } = require('cc');`
   Remove and use `cc.` prefix

## Next Steps

1. Complete remaining tool file migrations following patterns in scene-tools.ts
2. Update UI panels to use Vue 2 (Phase 4)
3. Test all functionality in Cocos Creator 2.x environment
4. Update documentation (README, etc.)

## Support

For 2.x API documentation:
- https://docs.cocos.com/creator/2.4/manual/en/
- https://docs.cocos.com/creator/2.4/api/

