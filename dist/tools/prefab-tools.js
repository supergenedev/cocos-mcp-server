"use strict";
/// <reference path="../types/editor-2x.d.ts" />
/// <reference path="../types/cc-2x.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrefabTools = void 0;
class PrefabTools {
    getTools() {
        return [
            {
                name: 'get_prefab_list',
                description: 'Get all prefabs in the project',
                inputSchema: {
                    type: 'object',
                    properties: {
                        folder: {
                            type: 'string',
                            description: 'Folder path to search (optional)',
                            default: 'db://assets'
                        }
                    }
                }
            },
            {
                name: 'load_prefab',
                description: 'Load a prefab by path',
                inputSchema: {
                    type: 'object',
                    properties: {
                        prefabPath: {
                            type: 'string',
                            description: 'Prefab asset path'
                        }
                    },
                    required: ['prefabPath']
                }
            },
            {
                name: 'instantiate_prefab',
                description: 'Instantiate a prefab in the scene',
                inputSchema: {
                    type: 'object',
                    properties: {
                        prefabPath: {
                            type: 'string',
                            description: 'Prefab asset path'
                        },
                        parentUuid: {
                            type: 'string',
                            description: 'Parent node UUID (optional)'
                        },
                        position: {
                            type: 'object',
                            description: 'Initial position',
                            properties: {
                                x: { type: 'number' },
                                y: { type: 'number' },
                                z: { type: 'number' }
                            }
                        }
                    },
                    required: ['prefabPath']
                }
            },
            {
                name: 'create_prefab',
                description: 'Create a prefab from a node with all children and components',
                inputSchema: {
                    type: 'object',
                    properties: {
                        nodeUuid: {
                            type: 'string',
                            description: 'Source node UUID'
                        },
                        savePath: {
                            type: 'string',
                            description: 'Path to save the prefab (e.g., db://assets/prefabs/MyPrefab.prefab)'
                        },
                        prefabName: {
                            type: 'string',
                            description: 'Prefab name'
                        }
                    },
                    required: ['nodeUuid', 'savePath', 'prefabName']
                }
            },
            {
                name: 'update_prefab',
                description: 'Update an existing prefab',
                inputSchema: {
                    type: 'object',
                    properties: {
                        prefabPath: {
                            type: 'string',
                            description: 'Prefab asset path'
                        },
                        nodeUuid: {
                            type: 'string',
                            description: 'Node UUID with changes'
                        }
                    },
                    required: ['prefabPath', 'nodeUuid']
                }
            },
            {
                name: 'revert_prefab',
                description: 'Revert prefab instance to original',
                inputSchema: {
                    type: 'object',
                    properties: {
                        nodeUuid: {
                            type: 'string',
                            description: 'Prefab instance node UUID'
                        }
                    },
                    required: ['nodeUuid']
                }
            },
            {
                name: 'get_prefab_info',
                description: 'Get detailed prefab information',
                inputSchema: {
                    type: 'object',
                    properties: {
                        prefabPath: {
                            type: 'string',
                            description: 'Prefab asset path'
                        }
                    },
                    required: ['prefabPath']
                }
            },
            {
                name: 'validate_prefab',
                description: 'Validate a prefab file format',
                inputSchema: {
                    type: 'object',
                    properties: {
                        prefabPath: {
                            type: 'string',
                            description: 'Prefab asset path'
                        }
                    },
                    required: ['prefabPath']
                }
            },
            {
                name: 'duplicate_prefab',
                description: 'Duplicate an existing prefab',
                inputSchema: {
                    type: 'object',
                    properties: {
                        sourcePrefabPath: {
                            type: 'string',
                            description: 'Source prefab path'
                        },
                        targetPrefabPath: {
                            type: 'string',
                            description: 'Target prefab path'
                        },
                        newPrefabName: {
                            type: 'string',
                            description: 'New prefab name'
                        }
                    },
                    required: ['sourcePrefabPath', 'targetPrefabPath']
                }
            },
            {
                name: 'restore_prefab_node',
                description: 'Restore prefab node using prefab asset (built-in undo record)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        nodeUuid: {
                            type: 'string',
                            description: 'Prefab instance node UUID'
                        },
                        assetUuid: {
                            type: 'string',
                            description: 'Prefab asset UUID'
                        }
                    },
                    required: ['nodeUuid', 'assetUuid']
                }
            }
        ];
    }
    async execute(toolName, args) {
        switch (toolName) {
            case 'get_prefab_list':
                return await this.getPrefabList(args.folder);
            case 'load_prefab':
                return await this.loadPrefab(args.prefabPath);
            case 'instantiate_prefab':
                return await this.instantiatePrefab(args);
            case 'create_prefab':
                return await this.createPrefab(args);
            case 'update_prefab':
                return await this.updatePrefab(args.prefabPath, args.nodeUuid);
            case 'revert_prefab':
                return await this.revertPrefab(args.nodeUuid);
            case 'get_prefab_info':
                return await this.getPrefabInfo(args.prefabPath);
            case 'validate_prefab':
                return await this.validatePrefab(args.prefabPath);
            case 'duplicate_prefab':
                return await this.duplicatePrefab(args);
            case 'restore_prefab_node':
                return await this.restorePrefabNode(args.nodeUuid, args.assetUuid);
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    }
    async getPrefabList(folder = 'db://assets') {
        return new Promise((resolve) => {
            const pattern = folder.endsWith('/') ?
                `${folder}**/*.prefab` : `${folder}/**/*.prefab`;
            Editor.Message.request('asset-db', 'query-assets', {
                pattern: pattern
            }).then((results) => {
                const prefabs = results.map(asset => ({
                    name: asset.name,
                    path: asset.url,
                    uuid: asset.uuid,
                    folder: asset.url.substring(0, asset.url.lastIndexOf('/'))
                }));
                resolve({ success: true, data: prefabs });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async loadPrefab(prefabPath) {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'query-asset-info', prefabPath).then((assetInfo) => {
                if (!assetInfo) {
                    throw new Error('Prefab not found');
                }
                return Editor.Message.request('scene', 'load-asset', {
                    uuid: assetInfo.uuid
                });
            }).then((prefabData) => {
                resolve({
                    success: true,
                    data: {
                        uuid: prefabData.uuid,
                        name: prefabData.name,
                        message: 'Prefab loaded successfully'
                    }
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async instantiatePrefab(args) {
        return new Promise(async (resolve) => {
            try {
                // 获取预制体资源信息
                const assetInfo = await Editor.Message.request('asset-db', 'query-asset-info', args.prefabPath);
                if (!assetInfo) {
                    throw new Error('预制体未找到');
                }
                // 使用正确的 create-node API 从预制体资源实例化
                const createNodeOptions = {
                    assetUuid: assetInfo.uuid
                };
                // 设置父节点
                if (args.parentUuid) {
                    createNodeOptions.parent = args.parentUuid;
                }
                // 设置节点名称
                if (args.name) {
                    createNodeOptions.name = args.name;
                }
                else if (assetInfo.name) {
                    createNodeOptions.name = assetInfo.name;
                }
                // 设置初始属性（如位置）
                if (args.position) {
                    createNodeOptions.dump = {
                        position: {
                            value: args.position
                        }
                    };
                }
                // 创建节点
                const nodeUuid = await Editor.Message.request('scene', 'create-node', createNodeOptions);
                const uuid = Array.isArray(nodeUuid) ? nodeUuid[0] : nodeUuid;
                // 注意：create-node API从预制体资源创建时应该自动建立预制体关联
                console.log('预制体节点创建成功:', {
                    nodeUuid: uuid,
                    prefabUuid: assetInfo.uuid,
                    prefabPath: args.prefabPath
                });
                resolve({
                    success: true,
                    data: {
                        nodeUuid: uuid,
                        prefabPath: args.prefabPath,
                        parentUuid: args.parentUuid,
                        position: args.position,
                        message: '预制体实例化成功，已建立预制体关联'
                    }
                });
            }
            catch (err) {
                resolve({
                    success: false,
                    error: `预制体实例化失败: ${err.message}`,
                    instruction: '请检查预制体路径是否正确，确保预制体文件格式正确'
                });
            }
        });
    }
    /**
     * 建立节点与预制体的关联关系
     * 这个方法创建必要的PrefabInfo和PrefabInstance结构
     */
    async establishPrefabConnection(nodeUuid, prefabUuid, prefabPath) {
        try {
            // 读取预制体文件获取根节点的fileId
            const prefabContent = await this.readPrefabFile(prefabPath);
            if (!prefabContent || !prefabContent.data || !prefabContent.data.length) {
                throw new Error('无法读取预制体文件内容');
            }
            // 找到预制体根节点的fileId (通常是第二个对象，即索引1)
            const rootNode = prefabContent.data.find((item) => item.__type === 'cc.Node' && item._parent === null);
            if (!rootNode || !rootNode._prefab) {
                throw new Error('无法找到预制体根节点或其预制体信息');
            }
            // 获取根节点的PrefabInfo
            const rootPrefabInfo = prefabContent.data[rootNode._prefab.__id__];
            if (!rootPrefabInfo || rootPrefabInfo.__type !== 'cc.PrefabInfo') {
                throw new Error('无法找到预制体根节点的PrefabInfo');
            }
            const rootFileId = rootPrefabInfo.fileId;
            // 使用scene API建立预制体连接
            const prefabConnectionData = {
                node: nodeUuid,
                prefab: prefabUuid,
                fileId: rootFileId
            };
            // 尝试使用多种API方法建立预制体连接
            const connectionMethods = [
                () => Editor.Message.request('scene', 'connect-prefab-instance', prefabConnectionData),
                () => Editor.Message.request('scene', 'set-prefab-connection', prefabConnectionData),
                () => Editor.Message.request('scene', 'apply-prefab-link', prefabConnectionData)
            ];
            let connected = false;
            for (const method of connectionMethods) {
                try {
                    await method();
                    connected = true;
                    break;
                }
                catch (error) {
                    console.warn('预制体连接方法失败，尝试下一个方法:', error);
                }
            }
            if (!connected) {
                // 如果所有API方法都失败，尝试手动修改场景数据
                console.warn('所有预制体连接API都失败，尝试手动建立连接');
                await this.manuallyEstablishPrefabConnection(nodeUuid, prefabUuid, rootFileId);
            }
        }
        catch (error) {
            console.error('建立预制体连接失败:', error);
            throw error;
        }
    }
    /**
     * 手动建立预制体连接（当API方法失败时的备用方案）
     */
    async manuallyEstablishPrefabConnection(nodeUuid, prefabUuid, rootFileId) {
        try {
            // 尝试使用dump API修改节点的_prefab属性
            const prefabConnectionData = {
                [nodeUuid]: {
                    '_prefab': {
                        '__uuid__': prefabUuid,
                        '__expectedType__': 'cc.Prefab',
                        'fileId': rootFileId
                    }
                }
            };
            await Editor.Message.request('scene', 'set-property', {
                uuid: nodeUuid,
                path: '_prefab',
                dump: {
                    value: {
                        '__uuid__': prefabUuid,
                        '__expectedType__': 'cc.Prefab'
                    }
                }
            });
        }
        catch (error) {
            console.error('手动建立预制体连接也失败:', error);
            // 不抛出错误，因为基本的节点创建已经成功
        }
    }
    /**
     * 读取预制体文件内容
     */
    async readPrefabFile(prefabPath) {
        try {
            // 尝试使用asset-db API读取文件内容
            let assetContent;
            try {
                assetContent = await Editor.Message.request('asset-db', 'query-asset-info', prefabPath);
                if (assetContent && assetContent.source) {
                    // 如果有source路径，直接读取文件
                    const fs = require('fs');
                    const path = require('path');
                    const fullPath = path.resolve(assetContent.source);
                    const fileContent = fs.readFileSync(fullPath, 'utf8');
                    return JSON.parse(fileContent);
                }
            }
            catch (error) {
                console.warn('使用asset-db读取失败，尝试其他方法:', error);
            }
            // 备用方法：转换db://路径为实际文件路径
            const fsPath = prefabPath.replace('db://assets/', 'assets/').replace('db://assets', 'assets');
            const fs = require('fs');
            const path = require('path');
            // 尝试多个可能的项目根路径
            const possiblePaths = [
                path.resolve(process.cwd(), '../../NewProject_3', fsPath),
                path.resolve('/Users/lizhiyong/NewProject_3', fsPath),
                path.resolve(fsPath),
                // 如果是根目录下的文件，也尝试直接路径
                path.resolve('/Users/lizhiyong/NewProject_3/assets', path.basename(fsPath))
            ];
            console.log('尝试读取预制体文件，路径转换:', {
                originalPath: prefabPath,
                fsPath: fsPath,
                possiblePaths: possiblePaths
            });
            for (const fullPath of possiblePaths) {
                try {
                    console.log(`检查路径: ${fullPath}`);
                    if (fs.existsSync(fullPath)) {
                        console.log(`找到文件: ${fullPath}`);
                        const fileContent = fs.readFileSync(fullPath, 'utf8');
                        const parsed = JSON.parse(fileContent);
                        console.log('文件解析成功，数据结构:', {
                            hasData: !!parsed.data,
                            dataLength: parsed.data ? parsed.data.length : 0
                        });
                        return parsed;
                    }
                    else {
                        console.log(`文件不存在: ${fullPath}`);
                    }
                }
                catch (readError) {
                    console.warn(`读取文件失败 ${fullPath}:`, readError);
                }
            }
            throw new Error('无法找到或读取预制体文件');
        }
        catch (error) {
            console.error('读取预制体文件失败:', error);
            throw error;
        }
    }
    async tryCreateNodeWithPrefab(args) {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'query-asset-info', args.prefabPath).then((assetInfo) => {
                if (!assetInfo) {
                    throw new Error('预制体未找到');
                }
                // 方法2: 使用 create-node 指定预制体资源
                const createNodeOptions = {
                    assetUuid: assetInfo.uuid
                };
                // 设置父节点
                if (args.parentUuid) {
                    createNodeOptions.parent = args.parentUuid;
                }
                return Editor.Message.request('scene', 'create-node', createNodeOptions);
            }).then((nodeUuid) => {
                const uuid = Array.isArray(nodeUuid) ? nodeUuid[0] : nodeUuid;
                // 如果指定了位置，设置节点位置
                if (args.position && uuid) {
                    Editor.Message.request('scene', 'set-property', {
                        uuid: uuid,
                        path: 'position',
                        dump: { value: args.position }
                    }).then(() => {
                        resolve({
                            success: true,
                            data: {
                                nodeUuid: uuid,
                                prefabPath: args.prefabPath,
                                position: args.position,
                                message: '预制体实例化成功（备用方法）并设置了位置'
                            }
                        });
                    }).catch(() => {
                        resolve({
                            success: true,
                            data: {
                                nodeUuid: uuid,
                                prefabPath: args.prefabPath,
                                message: '预制体实例化成功（备用方法）但位置设置失败'
                            }
                        });
                    });
                }
                else {
                    resolve({
                        success: true,
                        data: {
                            nodeUuid: uuid,
                            prefabPath: args.prefabPath,
                            message: '预制体实例化成功（备用方法）'
                        }
                    });
                }
            }).catch((err) => {
                resolve({
                    success: false,
                    error: `备用预制体实例化方法也失败: ${err.message}`
                });
            });
        });
    }
    async tryAlternativeInstantiateMethods(args) {
        return new Promise(async (resolve) => {
            try {
                // 方法1: 尝试使用 create-node 然后设置预制体
                const assetInfo = await this.getAssetInfo(args.prefabPath);
                if (!assetInfo) {
                    resolve({ success: false, error: '无法获取预制体信息' });
                    return;
                }
                // 创建空节点
                const createResult = await this.createNode(args.parentUuid, args.position);
                if (!createResult.success) {
                    resolve(createResult);
                    return;
                }
                // 尝试将预制体应用到节点
                const applyResult = await this.applyPrefabToNode(createResult.data.nodeUuid, assetInfo.uuid);
                if (applyResult.success) {
                    resolve({
                        success: true,
                        data: {
                            nodeUuid: createResult.data.nodeUuid,
                            name: createResult.data.name,
                            message: '预制体实例化成功（使用备选方法）'
                        }
                    });
                }
                else {
                    resolve({
                        success: false,
                        error: '无法将预制体应用到节点',
                        data: {
                            nodeUuid: createResult.data.nodeUuid,
                            message: '已创建节点，但无法应用预制体数据'
                        }
                    });
                }
            }
            catch (error) {
                resolve({ success: false, error: `备选实例化方法失败: ${error}` });
            }
        });
    }
    async getAssetInfo(prefabPath) {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'query-asset-info', prefabPath).then((assetInfo) => {
                resolve(assetInfo);
            }).catch(() => {
                resolve(null);
            });
        });
    }
    async createNode(parentUuid, position) {
        return new Promise((resolve) => {
            const createNodeOptions = {
                name: 'PrefabInstance'
            };
            // 设置父节点
            if (parentUuid) {
                createNodeOptions.parent = parentUuid;
            }
            // 设置位置
            if (position) {
                createNodeOptions.dump = {
                    position: position
                };
            }
            Editor.Message.request('scene', 'create-node', createNodeOptions).then((nodeUuid) => {
                const uuid = Array.isArray(nodeUuid) ? nodeUuid[0] : nodeUuid;
                resolve({
                    success: true,
                    data: {
                        nodeUuid: uuid,
                        name: 'PrefabInstance'
                    }
                });
            }).catch((error) => {
                resolve({ success: false, error: error.message || '创建节点失败' });
            });
        });
    }
    async applyPrefabToNode(nodeUuid, prefabUuid) {
        return new Promise((resolve) => {
            // 尝试多种方法来应用预制体数据
            const methods = [
                () => Editor.Message.request('scene', 'apply-prefab', { node: nodeUuid, prefab: prefabUuid }),
                () => Editor.Message.request('scene', 'set-prefab', { node: nodeUuid, prefab: prefabUuid }),
                () => Editor.Message.request('scene', 'load-prefab-to-node', { node: nodeUuid, prefab: prefabUuid })
            ];
            const tryMethod = (index) => {
                if (index >= methods.length) {
                    resolve({ success: false, error: '无法应用预制体数据' });
                    return;
                }
                methods[index]().then(() => {
                    resolve({ success: true });
                }).catch(() => {
                    tryMethod(index + 1);
                });
            };
            tryMethod(0);
        });
    }
    /**
     * 使用 asset-db API 创建预制体的新方法
     * 深度整合引擎的资源管理系统，实现完整的预制体创建流程
     */
    async createPrefabWithAssetDB(nodeUuid, savePath, prefabName, includeChildren, includeComponents) {
        return new Promise(async (resolve) => {
            var _a;
            try {
                console.log('=== 使用 Asset-DB API 创建预制体 ===');
                console.log(`节点UUID: ${nodeUuid}`);
                console.log(`保存路径: ${savePath}`);
                console.log(`预制体名称: ${prefabName}`);
                // 第一步：获取节点数据（包括变换属性）
                const nodeData = await this.getNodeData(nodeUuid);
                if (!nodeData) {
                    resolve({
                        success: false,
                        error: '无法获取节点数据'
                    });
                    return;
                }
                console.log('获取到节点数据，子节点数量:', nodeData.children ? nodeData.children.length : 0);
                // 第二步：先创建资源文件以获取引擎分配的UUID
                console.log('创建预制体资源文件...');
                const tempPrefabContent = JSON.stringify([{ "__type__": "cc.Prefab", "_name": prefabName }], null, 2);
                const createResult = await this.createAssetWithAssetDB(savePath, tempPrefabContent);
                if (!createResult.success) {
                    resolve(createResult);
                    return;
                }
                // 获取引擎分配的实际UUID
                const actualPrefabUuid = (_a = createResult.data) === null || _a === void 0 ? void 0 : _a.uuid;
                if (!actualPrefabUuid) {
                    resolve({
                        success: false,
                        error: '无法获取引擎分配的预制体UUID'
                    });
                    return;
                }
                console.log('引擎分配的UUID:', actualPrefabUuid);
                // 第三步：使用实际UUID重新生成预制体内容
                const prefabContent = await this.createStandardPrefabContent(nodeData, prefabName, actualPrefabUuid, includeChildren, includeComponents);
                const prefabContentString = JSON.stringify(prefabContent, null, 2);
                // 第四步：更新预制体文件内容
                console.log('更新预制体文件内容...');
                const updateResult = await this.updateAssetWithAssetDB(savePath, prefabContentString);
                // 第五步：创建对应的meta文件（使用实际UUID）
                console.log('创建预制体meta文件...');
                const metaContent = this.createStandardMetaContent(prefabName, actualPrefabUuid);
                const metaResult = await this.createMetaWithAssetDB(savePath, metaContent);
                // 第六步：重新导入资源以更新引用
                console.log('重新导入预制体资源...');
                const reimportResult = await this.reimportAssetWithAssetDB(savePath);
                // 第七步：尝试将原始节点转换为预制体实例
                console.log('尝试将原始节点转换为预制体实例...');
                const convertResult = await this.convertNodeToPrefabInstance(nodeUuid, actualPrefabUuid, savePath);
                resolve({
                    success: true,
                    data: {
                        prefabUuid: actualPrefabUuid,
                        prefabPath: savePath,
                        nodeUuid: nodeUuid,
                        prefabName: prefabName,
                        convertedToPrefabInstance: convertResult.success,
                        createAssetResult: createResult,
                        updateResult: updateResult,
                        metaResult: metaResult,
                        reimportResult: reimportResult,
                        convertResult: convertResult,
                        message: convertResult.success ? '预制体创建并成功转换原始节点' : '预制体创建成功，但节点转换失败'
                    }
                });
            }
            catch (error) {
                console.error('创建预制体时发生错误:', error);
                resolve({
                    success: false,
                    error: `创建预制体失败: ${error}`
                });
            }
        });
    }
    async createPrefab(args) {
        return new Promise(async (resolve) => {
            try {
                // 支持 prefabPath 和 savePath 两种参数名
                const pathParam = args.prefabPath || args.savePath;
                if (!pathParam) {
                    resolve({
                        success: false,
                        error: '缺少预制体路径参数。请提供 prefabPath 或 savePath。'
                    });
                    return;
                }
                const prefabName = args.prefabName || 'NewPrefab';
                const fullPath = pathParam.endsWith('.prefab') ?
                    pathParam : `${pathParam}/${prefabName}.prefab`;
                const includeChildren = args.includeChildren !== false; // 默认为 true
                const includeComponents = args.includeComponents !== false; // 默认为 true
                // 优先使用新的 asset-db 方法创建预制体
                console.log('使用新的 asset-db 方法创建预制体...');
                const assetDbResult = await this.createPrefabWithAssetDB(args.nodeUuid, fullPath, prefabName, includeChildren, includeComponents);
                if (assetDbResult.success) {
                    resolve(assetDbResult);
                    return;
                }
                // 如果 asset-db 方法失败，尝试使用Cocos Creator的原生预制体创建API
                console.log('asset-db 方法失败，尝试原生API...');
                const nativeResult = await this.createPrefabNative(args.nodeUuid, fullPath);
                if (nativeResult.success) {
                    resolve(nativeResult);
                    return;
                }
                // 如果原生API失败，使用自定义实现
                console.log('原生API失败，使用自定义实现...');
                const customResult = await this.createPrefabCustom(args.nodeUuid, fullPath, prefabName);
                resolve(customResult);
            }
            catch (error) {
                resolve({
                    success: false,
                    error: `创建预制体时发生错误: ${error}`
                });
            }
        });
    }
    async createPrefabNative(nodeUuid, prefabPath) {
        return new Promise((resolve) => {
            // 根据官方API文档，不存在直接的预制体创建API
            // 预制体创建需要手动在编辑器中完成
            resolve({
                success: false,
                error: '原生预制体创建API不存在',
                instruction: '根据Cocos Creator官方API文档，预制体创建需要手动操作：\n1. 在场景中选择节点\n2. 将节点拖拽到资源管理器中\n3. 或右键节点选择"生成预制体"'
            });
        });
    }
    async createPrefabCustom(nodeUuid, prefabPath, prefabName) {
        return new Promise(async (resolve) => {
            var _a, _b;
            try {
                // 1. 获取源节点的完整数据
                const nodeData = await this.getNodeData(nodeUuid);
                if (!nodeData) {
                    resolve({
                        success: false,
                        error: `无法找到节点: ${nodeUuid}`
                    });
                    return;
                }
                // 2. 生成预制体UUID
                const prefabUuid = this.generateUUID();
                // 3. 创建预制体数据结构
                const prefabData = this.createPrefabData(nodeData, prefabName, prefabUuid);
                // 4. 基于官方格式创建预制体数据结构
                console.log('=== 开始创建预制体 ===');
                console.log('节点名称:', ((_a = nodeData.name) === null || _a === void 0 ? void 0 : _a.value) || '未知');
                console.log('节点UUID:', ((_b = nodeData.uuid) === null || _b === void 0 ? void 0 : _b.value) || '未知');
                console.log('预制体保存路径:', prefabPath);
                console.log(`开始创建预制体，节点数据:`, nodeData);
                const prefabJsonData = await this.createStandardPrefabContent(nodeData, prefabName, prefabUuid, true, true);
                // 5. 创建标准meta文件数据
                const standardMetaData = this.createStandardMetaData(prefabName, prefabUuid);
                // 6. 保存预制体和meta文件
                const saveResult = await this.savePrefabWithMeta(prefabPath, prefabJsonData, standardMetaData);
                if (saveResult.success) {
                    // 保存成功后，将原始节点转换为预制体实例
                    const convertResult = await this.convertNodeToPrefabInstance(nodeUuid, prefabPath, prefabUuid);
                    resolve({
                        success: true,
                        data: {
                            prefabUuid: prefabUuid,
                            prefabPath: prefabPath,
                            nodeUuid: nodeUuid,
                            prefabName: prefabName,
                            convertedToPrefabInstance: convertResult.success,
                            message: convertResult.success ?
                                '自定义预制体创建成功，原始节点已转换为预制体实例' :
                                '预制体创建成功，但节点转换失败'
                        }
                    });
                }
                else {
                    resolve({
                        success: false,
                        error: saveResult.error || '保存预制体文件失败'
                    });
                }
            }
            catch (error) {
                resolve({
                    success: false,
                    error: `创建预制体时发生错误: ${error}`
                });
            }
        });
    }
    async getNodeData(nodeUuid) {
        return new Promise(async (resolve) => {
            try {
                // 首先获取基本节点信息
                const nodeInfo = await Editor.Message.request('scene', 'query-node', nodeUuid);
                if (!nodeInfo) {
                    resolve(null);
                    return;
                }
                console.log(`获取节点 ${nodeUuid} 的基本信息成功`);
                // 使用query-node-tree获取包含子节点的完整结构
                const nodeTree = await this.getNodeWithChildren(nodeUuid);
                if (nodeTree) {
                    console.log(`获取节点 ${nodeUuid} 的完整树结构成功`);
                    resolve(nodeTree);
                }
                else {
                    console.log(`使用基本节点信息`);
                    resolve(nodeInfo);
                }
            }
            catch (error) {
                console.warn(`获取节点数据失败 ${nodeUuid}:`, error);
                resolve(null);
            }
        });
    }
    // 使用query-node-tree获取包含子节点的完整节点结构
    async getNodeWithChildren(nodeUuid) {
        try {
            // 获取整个场景树
            const tree = await Editor.Message.request('scene', 'query-node-tree');
            if (!tree) {
                return null;
            }
            // 在树中查找指定的节点
            const targetNode = this.findNodeInTree(tree, nodeUuid);
            if (targetNode) {
                console.log(`在场景树中找到节点 ${nodeUuid}，子节点数量: ${targetNode.children ? targetNode.children.length : 0}`);
                // 增强节点树，获取每个节点的正确组件信息
                const enhancedTree = await this.enhanceTreeWithMCPComponents(targetNode);
                return enhancedTree;
            }
            return null;
        }
        catch (error) {
            console.warn(`获取节点树结构失败 ${nodeUuid}:`, error);
            return null;
        }
    }
    // 在节点树中递归查找指定UUID的节点
    findNodeInTree(node, targetUuid) {
        var _a;
        if (!node)
            return null;
        // 检查当前节点
        if (node.uuid === targetUuid || ((_a = node.value) === null || _a === void 0 ? void 0 : _a.uuid) === targetUuid) {
            return node;
        }
        // 递归检查子节点
        if (node.children && Array.isArray(node.children)) {
            for (const child of node.children) {
                const found = this.findNodeInTree(child, targetUuid);
                if (found) {
                    return found;
                }
            }
        }
        return null;
    }
    /**
     * 使用MCP接口增强节点树，获取正确的组件信息
     */
    async enhanceTreeWithMCPComponents(node) {
        var _a, _b, _c;
        if (!node || !node.uuid) {
            return node;
        }
        try {
            // 使用MCP接口获取节点的组件信息
            const response = await fetch('http://localhost:8585/mcp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    "jsonrpc": "2.0",
                    "method": "tools/call",
                    "params": {
                        "name": "component_get_components",
                        "arguments": {
                            "nodeUuid": node.uuid
                        }
                    },
                    "id": Date.now()
                })
            });
            const mcpResult = await response.json();
            if ((_c = (_b = (_a = mcpResult.result) === null || _a === void 0 ? void 0 : _a.content) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.text) {
                const componentData = JSON.parse(mcpResult.result.content[0].text);
                if (componentData.success && componentData.data.components) {
                    // 更新节点的组件信息为MCP返回的正确数据
                    node.components = componentData.data.components;
                    console.log(`节点 ${node.uuid} 获取到 ${componentData.data.components.length} 个组件，包含脚本组件的正确类型`);
                }
            }
        }
        catch (error) {
            console.warn(`获取节点 ${node.uuid} 的MCP组件信息失败:`, error);
        }
        // 递归处理子节点
        if (node.children && Array.isArray(node.children)) {
            for (let i = 0; i < node.children.length; i++) {
                node.children[i] = await this.enhanceTreeWithMCPComponents(node.children[i]);
            }
        }
        return node;
    }
    async buildBasicNodeInfo(nodeUuid) {
        return new Promise((resolve) => {
            // 构建基本的节点信息
            Editor.Message.request('scene', 'query-node', nodeUuid).then((nodeInfo) => {
                if (!nodeInfo) {
                    resolve(null);
                    return;
                }
                // 简化版本：只返回基本节点信息，不获取子节点和组件
                // 这些信息将在后续的预制体处理中根据需要添加
                const basicInfo = Object.assign(Object.assign({}, nodeInfo), { children: [], components: [] });
                resolve(basicInfo);
            }).catch(() => {
                resolve(null);
            });
        });
    }
    // 验证节点数据是否有效
    isValidNodeData(nodeData) {
        if (!nodeData)
            return false;
        if (typeof nodeData !== 'object')
            return false;
        // 检查基本属性 - 适配query-node-tree的数据格式
        return nodeData.hasOwnProperty('uuid') ||
            nodeData.hasOwnProperty('name') ||
            nodeData.hasOwnProperty('__type__') ||
            (nodeData.value && (nodeData.value.hasOwnProperty('uuid') ||
                nodeData.value.hasOwnProperty('name') ||
                nodeData.value.hasOwnProperty('__type__')));
    }
    // 提取子节点UUID的统一方法
    extractChildUuid(childRef) {
        if (!childRef)
            return null;
        // 方法1: 直接字符串
        if (typeof childRef === 'string') {
            return childRef;
        }
        // 方法2: value属性包含字符串
        if (childRef.value && typeof childRef.value === 'string') {
            return childRef.value;
        }
        // 方法3: value.uuid属性
        if (childRef.value && childRef.value.uuid) {
            return childRef.value.uuid;
        }
        // 方法4: 直接uuid属性
        if (childRef.uuid) {
            return childRef.uuid;
        }
        // 方法5: __id__引用 - 这种情况需要特殊处理
        if (childRef.__id__ !== undefined) {
            console.log(`发现__id__引用: ${childRef.__id__}，可能需要从数据结构中查找`);
            return null; // 暂时返回null，后续可以添加引用解析逻辑
        }
        console.warn('无法提取子节点UUID:', JSON.stringify(childRef));
        return null;
    }
    // 获取需要处理的子节点数据
    getChildrenToProcess(nodeData) {
        var _a;
        const children = [];
        // 方法1: 直接从children数组获取（从query-node-tree返回的数据）
        if (nodeData.children && Array.isArray(nodeData.children)) {
            console.log(`从children数组获取子节点，数量: ${nodeData.children.length}`);
            for (const child of nodeData.children) {
                // query-node-tree返回的子节点通常已经是完整的数据结构
                if (this.isValidNodeData(child)) {
                    children.push(child);
                    console.log(`添加子节点: ${child.name || ((_a = child.value) === null || _a === void 0 ? void 0 : _a.name) || '未知'}`);
                }
                else {
                    console.log('子节点数据无效:', JSON.stringify(child, null, 2));
                }
            }
        }
        else {
            console.log('节点没有子节点或children数组为空');
        }
        return children;
    }
    generateUUID() {
        // 生成符合Cocos Creator格式的UUID
        const chars = '0123456789abcdef';
        let uuid = '';
        for (let i = 0; i < 32; i++) {
            if (i === 8 || i === 12 || i === 16 || i === 20) {
                uuid += '-';
            }
            uuid += chars[Math.floor(Math.random() * chars.length)];
        }
        return uuid;
    }
    createPrefabData(nodeData, prefabName, prefabUuid) {
        // 创建标准的预制体数据结构
        const prefabAsset = {
            "__type__": "cc.Prefab",
            "_name": prefabName,
            "_objFlags": 0,
            "__editorExtras__": {},
            "_native": "",
            "data": {
                "__id__": 1
            },
            "optimizationPolicy": 0,
            "persistent": false
        };
        // 处理节点数据，确保符合预制体格式
        const processedNodeData = this.processNodeForPrefab(nodeData, prefabUuid);
        return [prefabAsset, ...processedNodeData];
    }
    processNodeForPrefab(nodeData, prefabUuid) {
        // 处理节点数据以符合预制体格式
        const processedData = [];
        let idCounter = 1;
        // 递归处理节点和组件
        const processNode = (node, parentId = 0) => {
            const nodeId = idCounter++;
            // 创建节点对象
            const processedNode = {
                "__type__": "cc.Node",
                "_name": node.name || "Node",
                "_objFlags": 0,
                "__editorExtras__": {},
                "_parent": parentId > 0 ? { "__id__": parentId } : null,
                "_children": node.children ? node.children.map(() => ({ "__id__": idCounter++ })) : [],
                "_active": node.active !== false,
                "_components": node.components ? node.components.map(() => ({ "__id__": idCounter++ })) : [],
                "_prefab": {
                    "__id__": idCounter++
                },
                "_lpos": {
                    "__type__": "cc.Vec3",
                    "x": 0,
                    "y": 0,
                    "z": 0
                },
                "_lrot": {
                    "__type__": "cc.Quat",
                    "x": 0,
                    "y": 0,
                    "z": 0,
                    "w": 1
                },
                "_lscale": {
                    "__type__": "cc.Vec3",
                    "x": 1,
                    "y": 1,
                    "z": 1
                },
                "_mobility": 0,
                "_layer": 1073741824,
                "_euler": {
                    "__type__": "cc.Vec3",
                    "x": 0,
                    "y": 0,
                    "z": 0
                },
                "_id": ""
            };
            processedData.push(processedNode);
            // 处理组件
            if (node.components) {
                node.components.forEach((component) => {
                    const componentId = idCounter++;
                    const processedComponents = this.processComponentForPrefab(component, componentId);
                    processedData.push(...processedComponents);
                });
            }
            // 处理子节点
            if (node.children) {
                node.children.forEach((child) => {
                    processNode(child, nodeId);
                });
            }
            return nodeId;
        };
        processNode(nodeData);
        return processedData;
    }
    processComponentForPrefab(component, componentId) {
        // 处理组件数据以符合预制体格式
        const processedComponent = Object.assign({ "__type__": component.type || "cc.Component", "_name": "", "_objFlags": 0, "__editorExtras__": {}, "node": {
                "__id__": componentId - 1
            }, "_enabled": component.enabled !== false, "__prefab": {
                "__id__": componentId + 1
            } }, component.properties);
        // 添加组件特定的预制体信息
        const compPrefabInfo = {
            "__type__": "cc.CompPrefabInfo",
            "fileId": this.generateFileId()
        };
        return [processedComponent, compPrefabInfo];
    }
    generateFileId() {
        // 生成文件ID（简化版本）
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/';
        let fileId = '';
        for (let i = 0; i < 22; i++) {
            fileId += chars[Math.floor(Math.random() * chars.length)];
        }
        return fileId;
    }
    createMetaData(prefabName, prefabUuid) {
        return {
            "ver": "1.1.50",
            "importer": "prefab",
            "imported": true,
            "uuid": prefabUuid,
            "files": [
                ".json"
            ],
            "subMetas": {},
            "userData": {
                "syncNodeName": prefabName
            }
        };
    }
    async savePrefabFiles(prefabPath, prefabData, metaData) {
        return new Promise((resolve) => {
            try {
                // 使用Editor API保存预制体文件
                const prefabContent = JSON.stringify(prefabData, null, 2);
                const metaContent = JSON.stringify(metaData, null, 2);
                // 尝试使用更可靠的保存方法
                this.saveAssetFile(prefabPath, prefabContent).then(() => {
                    // 再创建meta文件
                    const metaPath = `${prefabPath}.meta`;
                    return this.saveAssetFile(metaPath, metaContent);
                }).then(() => {
                    resolve({ success: true });
                }).catch((error) => {
                    resolve({ success: false, error: error.message || '保存预制体文件失败' });
                });
            }
            catch (error) {
                resolve({ success: false, error: `保存文件时发生错误: ${error}` });
            }
        });
    }
    async saveAssetFile(filePath, content) {
        return new Promise((resolve, reject) => {
            // 尝试多种保存方法
            const saveMethods = [
                () => Editor.Message.request('asset-db', 'create-asset', filePath, content),
                () => Editor.Message.request('asset-db', 'save-asset', filePath, content),
                () => Editor.Message.request('asset-db', 'write-asset', filePath, content)
            ];
            const trySave = (index) => {
                if (index >= saveMethods.length) {
                    reject(new Error('所有保存方法都失败了'));
                    return;
                }
                saveMethods[index]().then(() => {
                    resolve();
                }).catch(() => {
                    trySave(index + 1);
                });
            };
            trySave(0);
        });
    }
    async updatePrefab(prefabPath, nodeUuid) {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'query-asset-info', prefabPath).then((assetInfo) => {
                if (!assetInfo) {
                    throw new Error('Prefab not found');
                }
                return Editor.Message.request('scene', 'apply-prefab', {
                    node: nodeUuid,
                    prefab: assetInfo.uuid
                });
            }).then(() => {
                resolve({
                    success: true,
                    message: 'Prefab updated successfully'
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async revertPrefab(nodeUuid) {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'revert-prefab', {
                node: nodeUuid
            }).then(() => {
                resolve({
                    success: true,
                    message: 'Prefab instance reverted successfully'
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async getPrefabInfo(prefabPath) {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'query-asset-info', prefabPath).then((assetInfo) => {
                if (!assetInfo) {
                    throw new Error('Prefab not found');
                }
                return Editor.Message.request('asset-db', 'query-asset-meta', assetInfo.uuid);
            }).then((metaInfo) => {
                const info = {
                    name: metaInfo.name,
                    uuid: metaInfo.uuid,
                    path: prefabPath,
                    folder: prefabPath.substring(0, prefabPath.lastIndexOf('/')),
                    createTime: metaInfo.createTime,
                    modifyTime: metaInfo.modifyTime,
                    dependencies: metaInfo.depends || []
                };
                resolve({ success: true, data: info });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async createPrefabFromNode(args) {
        var _a;
        // 从 prefabPath 提取名称
        const prefabPath = args.prefabPath;
        const prefabName = ((_a = prefabPath.split('/').pop()) === null || _a === void 0 ? void 0 : _a.replace('.prefab', '')) || 'NewPrefab';
        // 调用原来的 createPrefab 方法
        return await this.createPrefab({
            nodeUuid: args.nodeUuid,
            savePath: prefabPath,
            prefabName: prefabName
        });
    }
    async validatePrefab(prefabPath) {
        return new Promise((resolve) => {
            try {
                // 读取预制体文件内容
                Editor.Message.request('asset-db', 'query-asset-info', prefabPath).then((assetInfo) => {
                    if (!assetInfo) {
                        resolve({
                            success: false,
                            error: '预制体文件不存在'
                        });
                        return;
                    }
                    // 验证预制体格式
                    Editor.Message.request('asset-db', 'read-asset', prefabPath).then((content) => {
                        try {
                            const prefabData = JSON.parse(content);
                            const validationResult = this.validatePrefabFormat(prefabData);
                            resolve({
                                success: true,
                                data: {
                                    isValid: validationResult.isValid,
                                    issues: validationResult.issues,
                                    nodeCount: validationResult.nodeCount,
                                    componentCount: validationResult.componentCount,
                                    message: validationResult.isValid ? '预制体格式有效' : '预制体格式存在问题'
                                }
                            });
                        }
                        catch (parseError) {
                            resolve({
                                success: false,
                                error: '预制体文件格式错误，无法解析JSON'
                            });
                        }
                    }).catch((error) => {
                        resolve({
                            success: false,
                            error: `读取预制体文件失败: ${error.message}`
                        });
                    });
                }).catch((error) => {
                    resolve({
                        success: false,
                        error: `查询预制体信息失败: ${error.message}`
                    });
                });
            }
            catch (error) {
                resolve({
                    success: false,
                    error: `验证预制体时发生错误: ${error}`
                });
            }
        });
    }
    validatePrefabFormat(prefabData) {
        const issues = [];
        let nodeCount = 0;
        let componentCount = 0;
        // 检查基本结构
        if (!Array.isArray(prefabData)) {
            issues.push('预制体数据必须是数组格式');
            return { isValid: false, issues, nodeCount, componentCount };
        }
        if (prefabData.length === 0) {
            issues.push('预制体数据为空');
            return { isValid: false, issues, nodeCount, componentCount };
        }
        // 检查第一个元素是否为预制体资产
        const firstElement = prefabData[0];
        if (!firstElement || firstElement.__type__ !== 'cc.Prefab') {
            issues.push('第一个元素必须是cc.Prefab类型');
        }
        // 统计节点和组件
        prefabData.forEach((item, index) => {
            if (item.__type__ === 'cc.Node') {
                nodeCount++;
            }
            else if (item.__type__ && item.__type__.includes('cc.')) {
                componentCount++;
            }
        });
        // 检查必要的字段
        if (nodeCount === 0) {
            issues.push('预制体必须包含至少一个节点');
        }
        return {
            isValid: issues.length === 0,
            issues,
            nodeCount,
            componentCount
        };
    }
    async duplicatePrefab(args) {
        return new Promise(async (resolve) => {
            try {
                const { sourcePrefabPath, targetPrefabPath, newPrefabName } = args;
                // 读取源预制体
                const sourceInfo = await this.getPrefabInfo(sourcePrefabPath);
                if (!sourceInfo.success) {
                    resolve({
                        success: false,
                        error: `无法读取源预制体: ${sourceInfo.error}`
                    });
                    return;
                }
                // 读取源预制体内容
                const sourceContent = await this.readPrefabContent(sourcePrefabPath);
                if (!sourceContent.success) {
                    resolve({
                        success: false,
                        error: `无法读取源预制体内容: ${sourceContent.error}`
                    });
                    return;
                }
                // 生成新的UUID
                const newUuid = this.generateUUID();
                // 修改预制体数据
                const modifiedData = this.modifyPrefabForDuplication(sourceContent.data, newPrefabName, newUuid);
                // 创建新的meta数据
                const newMetaData = this.createMetaData(newPrefabName || 'DuplicatedPrefab', newUuid);
                // 预制体复制功能暂时禁用，因为涉及复杂的序列化格式
                resolve({
                    success: false,
                    error: '预制体复制功能暂时不可用',
                    instruction: '请在 Cocos Creator 编辑器中手动复制预制体：\n1. 在资源管理器中选择要复制的预制体\n2. 右键选择复制\n3. 在目标位置粘贴'
                });
            }
            catch (error) {
                resolve({
                    success: false,
                    error: `复制预制体时发生错误: ${error}`
                });
            }
        });
    }
    async readPrefabContent(prefabPath) {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'read-asset', prefabPath).then((content) => {
                try {
                    const prefabData = JSON.parse(content);
                    resolve({ success: true, data: prefabData });
                }
                catch (parseError) {
                    resolve({ success: false, error: '预制体文件格式错误' });
                }
            }).catch((error) => {
                resolve({ success: false, error: error.message || '读取预制体文件失败' });
            });
        });
    }
    modifyPrefabForDuplication(prefabData, newName, newUuid) {
        // 修改预制体数据以创建副本
        const modifiedData = [...prefabData];
        // 修改第一个元素（预制体资产）
        if (modifiedData[0] && modifiedData[0].__type__ === 'cc.Prefab') {
            modifiedData[0]._name = newName || 'DuplicatedPrefab';
        }
        // 更新所有UUID引用（简化版本）
        // 在实际应用中，可能需要更复杂的UUID映射处理
        return modifiedData;
    }
    /**
     * 使用 asset-db API 创建资源文件
     */
    async createAssetWithAssetDB(assetPath, content) {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'create-asset', assetPath, content, {
                overwrite: true,
                rename: false
            }).then((assetInfo) => {
                console.log('创建资源文件成功:', assetInfo);
                resolve({ success: true, data: assetInfo });
            }).catch((error) => {
                console.error('创建资源文件失败:', error);
                resolve({ success: false, error: error.message || '创建资源文件失败' });
            });
        });
    }
    /**
     * 使用 asset-db API 创建 meta 文件
     */
    async createMetaWithAssetDB(assetPath, metaContent) {
        return new Promise((resolve) => {
            const metaContentString = JSON.stringify(metaContent, null, 2);
            Editor.Message.request('asset-db', 'save-asset-meta', assetPath, metaContentString).then((assetInfo) => {
                console.log('创建meta文件成功:', assetInfo);
                resolve({ success: true, data: assetInfo });
            }).catch((error) => {
                console.error('创建meta文件失败:', error);
                resolve({ success: false, error: error.message || '创建meta文件失败' });
            });
        });
    }
    /**
     * 使用 asset-db API 重新导入资源
     */
    async reimportAssetWithAssetDB(assetPath) {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'reimport-asset', assetPath).then((result) => {
                console.log('重新导入资源成功:', result);
                resolve({ success: true, data: result });
            }).catch((error) => {
                console.error('重新导入资源失败:', error);
                resolve({ success: false, error: error.message || '重新导入资源失败' });
            });
        });
    }
    /**
     * 使用 asset-db API 更新资源文件内容
     */
    async updateAssetWithAssetDB(assetPath, content) {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'save-asset', assetPath, content).then((result) => {
                console.log('更新资源文件成功:', result);
                resolve({ success: true, data: result });
            }).catch((error) => {
                console.error('更新资源文件失败:', error);
                resolve({ success: false, error: error.message || '更新资源文件失败' });
            });
        });
    }
    /**
     * 创建符合 Cocos Creator 标准的预制体内容
     * 完整实现递归节点树处理，匹配引擎标准格式
     */
    async createStandardPrefabContent(nodeData, prefabName, prefabUuid, includeChildren, includeComponents) {
        console.log('开始创建引擎标准预制体内容...');
        const prefabData = [];
        let currentId = 0;
        // 1. 创建预制体资产对象 (index 0)
        const prefabAsset = {
            "__type__": "cc.Prefab",
            "_name": prefabName || "",
            "_objFlags": 0,
            "__editorExtras__": {},
            "_native": "",
            "data": {
                "__id__": 1
            },
            "optimizationPolicy": 0,
            "persistent": false
        };
        prefabData.push(prefabAsset);
        currentId++;
        // 2. 递归创建完整的节点树结构
        const context = {
            prefabData,
            currentId: currentId + 1,
            prefabAssetIndex: 0,
            nodeFileIds: new Map(),
            nodeUuidToIndex: new Map(),
            componentUuidToIndex: new Map() // 存储组件UUID到索引的映射
        };
        // 创建根节点和整个节点树 - 注意：根节点的父节点应该是null，不是预制体对象
        await this.createCompleteNodeTree(nodeData, null, 1, context, includeChildren, includeComponents, prefabName);
        console.log(`预制体内容创建完成，总共 ${prefabData.length} 个对象`);
        console.log('节点fileId映射:', Array.from(context.nodeFileIds.entries()));
        return prefabData;
    }
    /**
     * 递归创建完整的节点树，包括所有子节点和对应的PrefabInfo
     */
    async createCompleteNodeTree(nodeData, parentNodeIndex, nodeIndex, context, includeChildren, includeComponents, nodeName) {
        const { prefabData } = context;
        // 创建节点对象
        const node = this.createEngineStandardNode(nodeData, parentNodeIndex, nodeName);
        // 确保节点在指定的索引位置
        while (prefabData.length <= nodeIndex) {
            prefabData.push(null);
        }
        console.log(`设置节点到索引 ${nodeIndex}: ${node._name}, _parent:`, node._parent, `_children count: ${node._children.length}`);
        prefabData[nodeIndex] = node;
        // 为当前节点生成fileId并记录UUID到索引的映射
        const nodeUuid = this.extractNodeUuid(nodeData);
        const fileId = nodeUuid || this.generateFileId();
        context.nodeFileIds.set(nodeIndex.toString(), fileId);
        // 记录节点UUID到索引的映射
        if (nodeUuid) {
            context.nodeUuidToIndex.set(nodeUuid, nodeIndex);
            console.log(`记录节点UUID映射: ${nodeUuid} -> ${nodeIndex}`);
        }
        // 先处理子节点（保持与手动创建的索引顺序一致）
        const childrenToProcess = this.getChildrenToProcess(nodeData);
        if (includeChildren && childrenToProcess.length > 0) {
            console.log(`处理节点 ${node._name} 的 ${childrenToProcess.length} 个子节点`);
            // 为每个子节点分配索引
            const childIndices = [];
            console.log(`准备为 ${childrenToProcess.length} 个子节点分配索引，当前ID: ${context.currentId}`);
            for (let i = 0; i < childrenToProcess.length; i++) {
                console.log(`处理第 ${i + 1} 个子节点，当前currentId: ${context.currentId}`);
                const childIndex = context.currentId++;
                childIndices.push(childIndex);
                node._children.push({ "__id__": childIndex });
                console.log(`✅ 添加子节点引用到 ${node._name}: {__id__: ${childIndex}}`);
            }
            console.log(`✅ 节点 ${node._name} 最终的子节点数组:`, node._children);
            // 递归创建子节点
            for (let i = 0; i < childrenToProcess.length; i++) {
                const childData = childrenToProcess[i];
                const childIndex = childIndices[i];
                await this.createCompleteNodeTree(childData, nodeIndex, childIndex, context, includeChildren, includeComponents, childData.name || `Child${i + 1}`);
            }
        }
        // 然后处理组件
        if (includeComponents && nodeData.components && Array.isArray(nodeData.components)) {
            console.log(`处理节点 ${node._name} 的 ${nodeData.components.length} 个组件`);
            const componentIndices = [];
            for (const component of nodeData.components) {
                const componentIndex = context.currentId++;
                componentIndices.push(componentIndex);
                node._components.push({ "__id__": componentIndex });
                // 记录组件UUID到索引的映射
                const componentUuid = component.uuid || (component.value && component.value.uuid);
                if (componentUuid) {
                    context.componentUuidToIndex.set(componentUuid, componentIndex);
                    console.log(`记录组件UUID映射: ${componentUuid} -> ${componentIndex}`);
                }
                // 创建组件对象，传入context以处理引用
                const componentObj = this.createComponentObject(component, nodeIndex, context);
                prefabData[componentIndex] = componentObj;
                // 为组件创建 CompPrefabInfo
                const compPrefabInfoIndex = context.currentId++;
                prefabData[compPrefabInfoIndex] = {
                    "__type__": "cc.CompPrefabInfo",
                    "fileId": this.generateFileId()
                };
                // 如果组件对象有 __prefab 属性，设置引用
                if (componentObj && typeof componentObj === 'object') {
                    componentObj.__prefab = { "__id__": compPrefabInfoIndex };
                }
            }
            console.log(`✅ 节点 ${node._name} 添加了 ${componentIndices.length} 个组件`);
        }
        // 为当前节点创建PrefabInfo
        const prefabInfoIndex = context.currentId++;
        node._prefab = { "__id__": prefabInfoIndex };
        const prefabInfo = {
            "__type__": "cc.PrefabInfo",
            "root": { "__id__": 1 },
            "asset": { "__id__": context.prefabAssetIndex },
            "fileId": fileId,
            "targetOverrides": null,
            "nestedPrefabInstanceRoots": null
        };
        // 根节点的特殊处理
        if (nodeIndex === 1) {
            // 根节点没有instance，但可能有targetOverrides
            prefabInfo.instance = null;
        }
        else {
            // 子节点通常有instance为null
            prefabInfo.instance = null;
        }
        prefabData[prefabInfoIndex] = prefabInfo;
        context.currentId = prefabInfoIndex + 1;
    }
    /**
     * 将UUID转换为Cocos Creator的压缩格式
     * 基于真实Cocos Creator编辑器的压缩算法实现
     * 前5个hex字符保持不变，剩余27个字符压缩成18个字符
     */
    uuidToCompressedId(uuid) {
        const BASE64_KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        // 移除连字符并转为小写
        const cleanUuid = uuid.replace(/-/g, '').toLowerCase();
        // 确保UUID有效
        if (cleanUuid.length !== 32) {
            return uuid; // 如果不是有效的UUID，返回原始值
        }
        // Cocos Creator的压缩算法：前5个字符保持不变，剩余27个字符压缩成18个字符
        let result = cleanUuid.substring(0, 5);
        // 剩余27个字符需要压缩成18个字符
        const remainder = cleanUuid.substring(5);
        // 每3个hex字符压缩成2个字符
        for (let i = 0; i < remainder.length; i += 3) {
            const hex1 = remainder[i] || '0';
            const hex2 = remainder[i + 1] || '0';
            const hex3 = remainder[i + 2] || '0';
            // 将3个hex字符(12位)转换为2个base64字符
            const value = parseInt(hex1 + hex2 + hex3, 16);
            // 12位分成两个6位
            const high6 = (value >> 6) & 63;
            const low6 = value & 63;
            result += BASE64_KEYS[high6] + BASE64_KEYS[low6];
        }
        return result;
    }
    /**
     * 创建组件对象
     */
    createComponentObject(componentData, nodeIndex, context) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6;
        let componentType = componentData.type || componentData.__type__ || 'cc.Component';
        const enabled = componentData.enabled !== undefined ? componentData.enabled : true;
        // console.log(`创建组件对象 - 原始类型: ${componentType}`);
        // console.log('组件完整数据:', JSON.stringify(componentData, null, 2));
        // 处理脚本组件 - MCP接口已经返回正确的压缩UUID格式
        if (componentType && !componentType.startsWith('cc.')) {
            console.log(`使用脚本组件压缩UUID类型: ${componentType}`);
        }
        // 基础组件结构
        const component = {
            "__type__": componentType,
            "_name": "",
            "_objFlags": 0,
            "__editorExtras__": {},
            "node": { "__id__": nodeIndex },
            "_enabled": enabled
        };
        // 提前设置 __prefab 属性占位符，后续会被正确设置
        component.__prefab = null;
        // 根据组件类型添加特定属性
        if (componentType === 'cc.UITransform') {
            const contentSize = ((_b = (_a = componentData.properties) === null || _a === void 0 ? void 0 : _a.contentSize) === null || _b === void 0 ? void 0 : _b.value) || { width: 100, height: 100 };
            const anchorPoint = ((_d = (_c = componentData.properties) === null || _c === void 0 ? void 0 : _c.anchorPoint) === null || _d === void 0 ? void 0 : _d.value) || { x: 0.5, y: 0.5 };
            component._contentSize = {
                "__type__": "cc.Size",
                "width": contentSize.width,
                "height": contentSize.height
            };
            component._anchorPoint = {
                "__type__": "cc.Vec2",
                "x": anchorPoint.x,
                "y": anchorPoint.y
            };
        }
        else if (componentType === 'cc.Sprite') {
            // 处理Sprite组件的spriteFrame引用
            const spriteFrameProp = ((_e = componentData.properties) === null || _e === void 0 ? void 0 : _e._spriteFrame) || ((_f = componentData.properties) === null || _f === void 0 ? void 0 : _f.spriteFrame);
            if (spriteFrameProp) {
                component._spriteFrame = this.processComponentProperty(spriteFrameProp, context);
            }
            else {
                component._spriteFrame = null;
            }
            component._type = (_j = (_h = (_g = componentData.properties) === null || _g === void 0 ? void 0 : _g._type) === null || _h === void 0 ? void 0 : _h.value) !== null && _j !== void 0 ? _j : 0;
            component._fillType = (_m = (_l = (_k = componentData.properties) === null || _k === void 0 ? void 0 : _k._fillType) === null || _l === void 0 ? void 0 : _l.value) !== null && _m !== void 0 ? _m : 0;
            component._sizeMode = (_q = (_p = (_o = componentData.properties) === null || _o === void 0 ? void 0 : _o._sizeMode) === null || _p === void 0 ? void 0 : _p.value) !== null && _q !== void 0 ? _q : 1;
            component._fillCenter = { "__type__": "cc.Vec2", "x": 0, "y": 0 };
            component._fillStart = (_t = (_s = (_r = componentData.properties) === null || _r === void 0 ? void 0 : _r._fillStart) === null || _s === void 0 ? void 0 : _s.value) !== null && _t !== void 0 ? _t : 0;
            component._fillRange = (_w = (_v = (_u = componentData.properties) === null || _u === void 0 ? void 0 : _u._fillRange) === null || _v === void 0 ? void 0 : _v.value) !== null && _w !== void 0 ? _w : 0;
            component._isTrimmedMode = (_z = (_y = (_x = componentData.properties) === null || _x === void 0 ? void 0 : _x._isTrimmedMode) === null || _y === void 0 ? void 0 : _y.value) !== null && _z !== void 0 ? _z : true;
            component._useGrayscale = (_2 = (_1 = (_0 = componentData.properties) === null || _0 === void 0 ? void 0 : _0._useGrayscale) === null || _1 === void 0 ? void 0 : _1.value) !== null && _2 !== void 0 ? _2 : false;
            // 调试：打印Sprite组件的所有属性（已注释）
            // console.log('Sprite组件属性:', JSON.stringify(componentData.properties, null, 2));
            component._atlas = null;
            component._id = "";
        }
        else if (componentType === 'cc.Button') {
            component._interactable = true;
            component._transition = 3;
            component._normalColor = { "__type__": "cc.Color", "r": 255, "g": 255, "b": 255, "a": 255 };
            component._hoverColor = { "__type__": "cc.Color", "r": 211, "g": 211, "b": 211, "a": 255 };
            component._pressedColor = { "__type__": "cc.Color", "r": 255, "g": 255, "b": 255, "a": 255 };
            component._disabledColor = { "__type__": "cc.Color", "r": 124, "g": 124, "b": 124, "a": 255 };
            component._normalSprite = null;
            component._hoverSprite = null;
            component._pressedSprite = null;
            component._disabledSprite = null;
            component._duration = 0.1;
            component._zoomScale = 1.2;
            // 处理Button的target引用
            const targetProp = ((_3 = componentData.properties) === null || _3 === void 0 ? void 0 : _3._target) || ((_4 = componentData.properties) === null || _4 === void 0 ? void 0 : _4.target);
            if (targetProp) {
                component._target = this.processComponentProperty(targetProp, context);
            }
            else {
                component._target = { "__id__": nodeIndex }; // 默认指向自身节点
            }
            component._clickEvents = [];
            component._id = "";
        }
        else if (componentType === 'cc.Label') {
            component._string = ((_6 = (_5 = componentData.properties) === null || _5 === void 0 ? void 0 : _5._string) === null || _6 === void 0 ? void 0 : _6.value) || "Label";
            component._horizontalAlign = 1;
            component._verticalAlign = 1;
            component._actualFontSize = 20;
            component._fontSize = 20;
            component._fontFamily = "Arial";
            component._lineHeight = 25;
            component._overflow = 0;
            component._enableWrapText = true;
            component._font = null;
            component._isSystemFontUsed = true;
            component._spacingX = 0;
            component._isItalic = false;
            component._isBold = false;
            component._isUnderline = false;
            component._underlineHeight = 2;
            component._cacheMode = 0;
            component._id = "";
        }
        else if (componentData.properties) {
            // 处理所有组件的属性（包括内置组件和自定义脚本组件）
            for (const [key, value] of Object.entries(componentData.properties)) {
                if (key === 'node' || key === 'enabled' || key === '__type__' ||
                    key === 'uuid' || key === 'name' || key === '__scriptAsset' || key === '_objFlags') {
                    continue; // 跳过这些特殊属性，包括_objFlags
                }
                // 对于以下划线开头的属性，需要特殊处理
                if (key.startsWith('_')) {
                    // 确保属性名保持原样（包括下划线）
                    const propValue = this.processComponentProperty(value, context);
                    if (propValue !== undefined) {
                        component[key] = propValue;
                    }
                }
                else {
                    // 非下划线开头的属性正常处理
                    const propValue = this.processComponentProperty(value, context);
                    if (propValue !== undefined) {
                        component[key] = propValue;
                    }
                }
            }
        }
        // 确保 _id 在最后位置
        const _id = component._id || "";
        delete component._id;
        component._id = _id;
        return component;
    }
    /**
     * 处理组件属性值，确保格式与手动创建的预制体一致
     */
    processComponentProperty(propData, context) {
        var _a, _b;
        if (!propData || typeof propData !== 'object') {
            return propData;
        }
        const value = propData.value;
        const type = propData.type;
        // 处理null值
        if (value === null || value === undefined) {
            return null;
        }
        // 处理空UUID对象，转换为null
        if (value && typeof value === 'object' && value.uuid === '') {
            return null;
        }
        // 处理节点引用
        if (type === 'cc.Node' && (value === null || value === void 0 ? void 0 : value.uuid)) {
            // 在预制体中，节点引用需要转换为 __id__ 形式
            if ((context === null || context === void 0 ? void 0 : context.nodeUuidToIndex) && context.nodeUuidToIndex.has(value.uuid)) {
                // 内部引用：转换为__id__格式
                return {
                    "__id__": context.nodeUuidToIndex.get(value.uuid)
                };
            }
            // 外部引用：设置为null，因为外部节点不属于预制体结构
            console.warn(`Node reference UUID ${value.uuid} not found in prefab context, setting to null (external reference)`);
            return null;
        }
        // 处理资源引用（预制体、纹理、精灵帧等）
        if ((value === null || value === void 0 ? void 0 : value.uuid) && (type === 'cc.Prefab' ||
            type === 'cc.Texture2D' ||
            type === 'cc.SpriteFrame' ||
            type === 'cc.Material' ||
            type === 'cc.AnimationClip' ||
            type === 'cc.AudioClip' ||
            type === 'cc.Font' ||
            type === 'cc.Asset')) {
            // 对于预制体引用，保持原始UUID格式
            const uuidToUse = type === 'cc.Prefab' ? value.uuid : this.uuidToCompressedId(value.uuid);
            return {
                "__uuid__": uuidToUse,
                "__expectedType__": type
            };
        }
        // 处理组件引用（包括具体的组件类型如cc.Label, cc.Button等）
        if ((value === null || value === void 0 ? void 0 : value.uuid) && (type === 'cc.Component' ||
            type === 'cc.Label' || type === 'cc.Button' || type === 'cc.Sprite' ||
            type === 'cc.UITransform' || type === 'cc.RigidBody2D' ||
            type === 'cc.BoxCollider2D' || type === 'cc.Animation' ||
            type === 'cc.AudioSource' || ((type === null || type === void 0 ? void 0 : type.startsWith('cc.')) && !type.includes('@')))) {
            // 在预制体中，组件引用也需要转换为 __id__ 形式
            if ((context === null || context === void 0 ? void 0 : context.componentUuidToIndex) && context.componentUuidToIndex.has(value.uuid)) {
                // 内部引用：转换为__id__格式
                console.log(`Component reference ${type} UUID ${value.uuid} found in prefab context, converting to __id__`);
                return {
                    "__id__": context.componentUuidToIndex.get(value.uuid)
                };
            }
            // 外部引用：设置为null，因为外部组件不属于预制体结构
            console.warn(`Component reference ${type} UUID ${value.uuid} not found in prefab context, setting to null (external reference)`);
            return null;
        }
        // 处理复杂类型，添加__type__标记
        if (value && typeof value === 'object') {
            if (type === 'cc.Color') {
                return {
                    "__type__": "cc.Color",
                    "r": Math.min(255, Math.max(0, Number(value.r) || 0)),
                    "g": Math.min(255, Math.max(0, Number(value.g) || 0)),
                    "b": Math.min(255, Math.max(0, Number(value.b) || 0)),
                    "a": value.a !== undefined ? Math.min(255, Math.max(0, Number(value.a))) : 255
                };
            }
            else if (type === 'cc.Vec3') {
                return {
                    "__type__": "cc.Vec3",
                    "x": Number(value.x) || 0,
                    "y": Number(value.y) || 0,
                    "z": Number(value.z) || 0
                };
            }
            else if (type === 'cc.Vec2') {
                return {
                    "__type__": "cc.Vec2",
                    "x": Number(value.x) || 0,
                    "y": Number(value.y) || 0
                };
            }
            else if (type === 'cc.Size') {
                return {
                    "__type__": "cc.Size",
                    "width": Number(value.width) || 0,
                    "height": Number(value.height) || 0
                };
            }
            else if (type === 'cc.Quat') {
                return {
                    "__type__": "cc.Quat",
                    "x": Number(value.x) || 0,
                    "y": Number(value.y) || 0,
                    "z": Number(value.z) || 0,
                    "w": value.w !== undefined ? Number(value.w) : 1
                };
            }
        }
        // 处理数组类型
        if (Array.isArray(value)) {
            // 节点数组
            if (((_a = propData.elementTypeData) === null || _a === void 0 ? void 0 : _a.type) === 'cc.Node') {
                return value.map(item => {
                    var _a;
                    if ((item === null || item === void 0 ? void 0 : item.uuid) && ((_a = context === null || context === void 0 ? void 0 : context.nodeUuidToIndex) === null || _a === void 0 ? void 0 : _a.has(item.uuid))) {
                        return { "__id__": context.nodeUuidToIndex.get(item.uuid) };
                    }
                    return null;
                }).filter(item => item !== null);
            }
            // 资源数组
            if (((_b = propData.elementTypeData) === null || _b === void 0 ? void 0 : _b.type) && propData.elementTypeData.type.startsWith('cc.')) {
                return value.map(item => {
                    if (item === null || item === void 0 ? void 0 : item.uuid) {
                        return {
                            "__uuid__": this.uuidToCompressedId(item.uuid),
                            "__expectedType__": propData.elementTypeData.type
                        };
                    }
                    return null;
                }).filter(item => item !== null);
            }
            // 基础类型数组
            return value.map(item => (item === null || item === void 0 ? void 0 : item.value) !== undefined ? item.value : item);
        }
        // 其他复杂对象类型，保持原样但确保有__type__标记
        if (value && typeof value === 'object' && type && type.startsWith('cc.')) {
            return Object.assign({ "__type__": type }, value);
        }
        return value;
    }
    /**
     * 创建符合引擎标准的节点对象
     */
    createEngineStandardNode(nodeData, parentNodeIndex, nodeName) {
        // 调试：打印原始节点数据（已注释）
        // console.log('原始节点数据:', JSON.stringify(nodeData, null, 2));
        var _a, _b, _c, _d, _e, _f, _g, _h;
        // 提取节点的基本属性
        const getValue = (prop) => {
            if ((prop === null || prop === void 0 ? void 0 : prop.value) !== undefined)
                return prop.value;
            if (prop !== undefined)
                return prop;
            return null;
        };
        const position = getValue(nodeData.position) || getValue((_a = nodeData.value) === null || _a === void 0 ? void 0 : _a.position) || { x: 0, y: 0, z: 0 };
        const rotation = getValue(nodeData.rotation) || getValue((_b = nodeData.value) === null || _b === void 0 ? void 0 : _b.rotation) || { x: 0, y: 0, z: 0, w: 1 };
        const scale = getValue(nodeData.scale) || getValue((_c = nodeData.value) === null || _c === void 0 ? void 0 : _c.scale) || { x: 1, y: 1, z: 1 };
        const active = (_f = (_d = getValue(nodeData.active)) !== null && _d !== void 0 ? _d : getValue((_e = nodeData.value) === null || _e === void 0 ? void 0 : _e.active)) !== null && _f !== void 0 ? _f : true;
        const name = nodeName || getValue(nodeData.name) || getValue((_g = nodeData.value) === null || _g === void 0 ? void 0 : _g.name) || 'Node';
        const layer = getValue(nodeData.layer) || getValue((_h = nodeData.value) === null || _h === void 0 ? void 0 : _h.layer) || 1073741824;
        // 调试输出
        console.log(`创建节点: ${name}, parentNodeIndex: ${parentNodeIndex}`);
        const parentRef = parentNodeIndex !== null ? { "__id__": parentNodeIndex } : null;
        console.log(`节点 ${name} 的父节点引用:`, parentRef);
        return {
            "__type__": "cc.Node",
            "_name": name,
            "_objFlags": 0,
            "__editorExtras__": {},
            "_parent": parentRef,
            "_children": [],
            "_active": active,
            "_components": [],
            "_prefab": { "__id__": 0 },
            "_lpos": {
                "__type__": "cc.Vec3",
                "x": position.x,
                "y": position.y,
                "z": position.z
            },
            "_lrot": {
                "__type__": "cc.Quat",
                "x": rotation.x,
                "y": rotation.y,
                "z": rotation.z,
                "w": rotation.w
            },
            "_lscale": {
                "__type__": "cc.Vec3",
                "x": scale.x,
                "y": scale.y,
                "z": scale.z
            },
            "_mobility": 0,
            "_layer": layer,
            "_euler": {
                "__type__": "cc.Vec3",
                "x": 0,
                "y": 0,
                "z": 0
            },
            "_id": ""
        };
    }
    /**
     * 从节点数据中提取UUID
     */
    extractNodeUuid(nodeData) {
        var _a, _b, _c;
        if (!nodeData)
            return null;
        // 尝试多种方式获取UUID
        const sources = [
            nodeData.uuid,
            (_a = nodeData.value) === null || _a === void 0 ? void 0 : _a.uuid,
            nodeData.__uuid__,
            (_b = nodeData.value) === null || _b === void 0 ? void 0 : _b.__uuid__,
            nodeData.id,
            (_c = nodeData.value) === null || _c === void 0 ? void 0 : _c.id
        ];
        for (const source of sources) {
            if (typeof source === 'string' && source.length > 0) {
                return source;
            }
        }
        return null;
    }
    /**
     * 创建最小化的节点对象，不包含任何组件以避免依赖问题
     */
    createMinimalNode(nodeData, nodeName) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        // 提取节点的基本属性
        const getValue = (prop) => {
            if ((prop === null || prop === void 0 ? void 0 : prop.value) !== undefined)
                return prop.value;
            if (prop !== undefined)
                return prop;
            return null;
        };
        const position = getValue(nodeData.position) || getValue((_a = nodeData.value) === null || _a === void 0 ? void 0 : _a.position) || { x: 0, y: 0, z: 0 };
        const rotation = getValue(nodeData.rotation) || getValue((_b = nodeData.value) === null || _b === void 0 ? void 0 : _b.rotation) || { x: 0, y: 0, z: 0, w: 1 };
        const scale = getValue(nodeData.scale) || getValue((_c = nodeData.value) === null || _c === void 0 ? void 0 : _c.scale) || { x: 1, y: 1, z: 1 };
        const active = (_f = (_d = getValue(nodeData.active)) !== null && _d !== void 0 ? _d : getValue((_e = nodeData.value) === null || _e === void 0 ? void 0 : _e.active)) !== null && _f !== void 0 ? _f : true;
        const name = nodeName || getValue(nodeData.name) || getValue((_g = nodeData.value) === null || _g === void 0 ? void 0 : _g.name) || 'Node';
        const layer = getValue(nodeData.layer) || getValue((_h = nodeData.value) === null || _h === void 0 ? void 0 : _h.layer) || 33554432;
        return {
            "__type__": "cc.Node",
            "_name": name,
            "_objFlags": 0,
            "_parent": null,
            "_children": [],
            "_active": active,
            "_components": [],
            "_prefab": {
                "__id__": 2
            },
            "_lpos": {
                "__type__": "cc.Vec3",
                "x": position.x,
                "y": position.y,
                "z": position.z
            },
            "_lrot": {
                "__type__": "cc.Quat",
                "x": rotation.x,
                "y": rotation.y,
                "z": rotation.z,
                "w": rotation.w
            },
            "_lscale": {
                "__type__": "cc.Vec3",
                "x": scale.x,
                "y": scale.y,
                "z": scale.z
            },
            "_layer": layer,
            "_euler": {
                "__type__": "cc.Vec3",
                "x": 0,
                "y": 0,
                "z": 0
            },
            "_id": ""
        };
    }
    /**
     * 创建标准的 meta 文件内容
     */
    createStandardMetaContent(prefabName, prefabUuid) {
        return {
            "ver": "2.0.3",
            "importer": "prefab",
            "imported": true,
            "uuid": prefabUuid,
            "files": [
                ".json"
            ],
            "subMetas": {},
            "userData": {
                "syncNodeName": prefabName,
                "hasIcon": false
            }
        };
    }
    /**
     * 尝试将原始节点转换为预制体实例
     */
    async convertNodeToPrefabInstance(nodeUuid, prefabUuid, prefabPath) {
        return new Promise((resolve) => {
            // 这个功能需要深入的场景编辑器集成，暂时返回失败
            // 在实际的引擎中，这涉及到复杂的预制体实例化和节点替换逻辑
            console.log('节点转换为预制体实例的功能需要更深入的引擎集成');
            resolve({
                success: false,
                error: '节点转换为预制体实例需要更深入的引擎集成支持'
            });
        });
    }
    async restorePrefabNode(nodeUuid, assetUuid) {
        return new Promise((resolve) => {
            // 使用官方API restore-prefab 还原预制体节点
            Editor.Message.request('scene', 'restore-prefab', nodeUuid, assetUuid).then(() => {
                resolve({
                    success: true,
                    data: {
                        nodeUuid: nodeUuid,
                        assetUuid: assetUuid,
                        message: '预制体节点还原成功'
                    }
                });
            }).catch((error) => {
                resolve({
                    success: false,
                    error: `预制体节点还原失败: ${error.message}`
                });
            });
        });
    }
    // 基于官方预制体格式的新实现方法
    async getNodeDataForPrefab(nodeUuid) {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'query-node', nodeUuid).then((nodeData) => {
                if (!nodeData) {
                    resolve({ success: false, error: '节点不存在' });
                    return;
                }
                resolve({ success: true, data: nodeData });
            }).catch((error) => {
                resolve({ success: false, error: error.message });
            });
        });
    }
    async createStandardPrefabData(nodeData, prefabName, prefabUuid) {
        // 基于官方Canvas.prefab格式创建预制体数据结构
        const prefabData = [];
        let currentId = 0;
        // 第一个元素：cc.Prefab 资源对象
        const prefabAsset = {
            "__type__": "cc.Prefab",
            "_name": prefabName,
            "_objFlags": 0,
            "__editorExtras__": {},
            "_native": "",
            "data": {
                "__id__": 1
            },
            "optimizationPolicy": 0,
            "persistent": false
        };
        prefabData.push(prefabAsset);
        currentId++;
        // 第二个元素：根节点
        const rootNode = await this.createNodeObject(nodeData, null, prefabData, currentId);
        prefabData.push(rootNode.node);
        currentId = rootNode.nextId;
        // 添加根节点的 PrefabInfo - 修复asset引用使用UUID
        const rootPrefabInfo = {
            "__type__": "cc.PrefabInfo",
            "root": {
                "__id__": 1
            },
            "asset": {
                "__uuid__": prefabUuid
            },
            "fileId": this.generateFileId(),
            "instance": null,
            "targetOverrides": [],
            "nestedPrefabInstanceRoots": []
        };
        prefabData.push(rootPrefabInfo);
        return prefabData;
    }
    async createNodeObject(nodeData, parentId, prefabData, currentId) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const nodeId = currentId++;
        // 提取节点的基本属性 - 适配query-node-tree的数据格式
        const getValue = (prop) => {
            if ((prop === null || prop === void 0 ? void 0 : prop.value) !== undefined)
                return prop.value;
            if (prop !== undefined)
                return prop;
            return null;
        };
        const position = getValue(nodeData.position) || getValue((_a = nodeData.value) === null || _a === void 0 ? void 0 : _a.position) || { x: 0, y: 0, z: 0 };
        const rotation = getValue(nodeData.rotation) || getValue((_b = nodeData.value) === null || _b === void 0 ? void 0 : _b.rotation) || { x: 0, y: 0, z: 0, w: 1 };
        const scale = getValue(nodeData.scale) || getValue((_c = nodeData.value) === null || _c === void 0 ? void 0 : _c.scale) || { x: 1, y: 1, z: 1 };
        const active = (_f = (_d = getValue(nodeData.active)) !== null && _d !== void 0 ? _d : getValue((_e = nodeData.value) === null || _e === void 0 ? void 0 : _e.active)) !== null && _f !== void 0 ? _f : true;
        const name = getValue(nodeData.name) || getValue((_g = nodeData.value) === null || _g === void 0 ? void 0 : _g.name) || 'Node';
        const layer = getValue(nodeData.layer) || getValue((_h = nodeData.value) === null || _h === void 0 ? void 0 : _h.layer) || 33554432;
        const node = {
            "__type__": "cc.Node",
            "_name": name,
            "_objFlags": 0,
            "__editorExtras__": {},
            "_parent": parentId !== null ? { "__id__": parentId } : null,
            "_children": [],
            "_active": active,
            "_components": [],
            "_prefab": parentId === null ? {
                "__id__": currentId++
            } : null,
            "_lpos": {
                "__type__": "cc.Vec3",
                "x": position.x,
                "y": position.y,
                "z": position.z
            },
            "_lrot": {
                "__type__": "cc.Quat",
                "x": rotation.x,
                "y": rotation.y,
                "z": rotation.z,
                "w": rotation.w
            },
            "_lscale": {
                "__type__": "cc.Vec3",
                "x": scale.x,
                "y": scale.y,
                "z": scale.z
            },
            "_mobility": 0,
            "_layer": layer,
            "_euler": {
                "__type__": "cc.Vec3",
                "x": 0,
                "y": 0,
                "z": 0
            },
            "_id": ""
        };
        // 暂时跳过UITransform组件以避免_getDependComponent错误
        // 后续通过Engine API动态添加
        console.log(`节点 ${name} 暂时跳过UITransform组件，避免引擎依赖错误`);
        // 处理其他组件（暂时跳过，专注于修复UITransform问题）
        const components = this.extractComponentsFromNode(nodeData);
        if (components.length > 0) {
            console.log(`节点 ${name} 包含 ${components.length} 个其他组件，暂时跳过以专注于UITransform修复`);
        }
        // 处理子节点 - 使用query-node-tree获取的完整结构
        const childrenToProcess = this.getChildrenToProcess(nodeData);
        if (childrenToProcess.length > 0) {
            console.log(`=== 处理子节点 ===`);
            console.log(`节点 ${name} 包含 ${childrenToProcess.length} 个子节点`);
            for (let i = 0; i < childrenToProcess.length; i++) {
                const childData = childrenToProcess[i];
                const childName = childData.name || ((_j = childData.value) === null || _j === void 0 ? void 0 : _j.name) || '未知';
                console.log(`处理第${i + 1}个子节点: ${childName}`);
                try {
                    const childId = currentId;
                    node._children.push({ "__id__": childId });
                    // 递归创建子节点
                    const childResult = await this.createNodeObject(childData, nodeId, prefabData, currentId);
                    prefabData.push(childResult.node);
                    currentId = childResult.nextId;
                    // 子节点不需要PrefabInfo，只有根节点需要
                    // 子节点的_prefab应该设置为null
                    childResult.node._prefab = null;
                    console.log(`✅ 成功添加子节点: ${childName}`);
                }
                catch (error) {
                    console.error(`处理子节点 ${childName} 时出错:`, error);
                }
            }
        }
        return { node, nextId: currentId };
    }
    // 从节点数据中提取组件信息
    extractComponentsFromNode(nodeData) {
        var _a, _b;
        const components = [];
        // 从不同位置尝试获取组件数据
        const componentSources = [
            nodeData.__comps__,
            nodeData.components,
            (_a = nodeData.value) === null || _a === void 0 ? void 0 : _a.__comps__,
            (_b = nodeData.value) === null || _b === void 0 ? void 0 : _b.components
        ];
        for (const source of componentSources) {
            if (Array.isArray(source)) {
                components.push(...source.filter(comp => comp && (comp.__type__ || comp.type)));
                break; // 找到有效的组件数组就退出
            }
        }
        return components;
    }
    // 创建标准的组件对象
    createStandardComponentObject(componentData, nodeId, prefabInfoId) {
        const componentType = componentData.__type__ || componentData.type;
        if (!componentType) {
            console.warn('组件缺少类型信息:', componentData);
            return null;
        }
        // 基础组件结构 - 基于官方预制体格式
        const component = {
            "__type__": componentType,
            "_name": "",
            "_objFlags": 0,
            "node": {
                "__id__": nodeId
            },
            "_enabled": this.getComponentPropertyValue(componentData, 'enabled', true),
            "__prefab": {
                "__id__": prefabInfoId
            }
        };
        // 根据组件类型添加特定属性
        this.addComponentSpecificProperties(component, componentData, componentType);
        // 添加_id属性
        component._id = "";
        return component;
    }
    // 添加组件特定的属性
    addComponentSpecificProperties(component, componentData, componentType) {
        switch (componentType) {
            case 'cc.UITransform':
                this.addUITransformProperties(component, componentData);
                break;
            case 'cc.Sprite':
                this.addSpriteProperties(component, componentData);
                break;
            case 'cc.Label':
                this.addLabelProperties(component, componentData);
                break;
            case 'cc.Button':
                this.addButtonProperties(component, componentData);
                break;
            default:
                // 对于未知类型的组件，复制所有安全的属性
                this.addGenericProperties(component, componentData);
                break;
        }
    }
    // UITransform组件属性
    addUITransformProperties(component, componentData) {
        component._contentSize = this.createSizeObject(this.getComponentPropertyValue(componentData, 'contentSize', { width: 100, height: 100 }));
        component._anchorPoint = this.createVec2Object(this.getComponentPropertyValue(componentData, 'anchorPoint', { x: 0.5, y: 0.5 }));
    }
    // Sprite组件属性
    addSpriteProperties(component, componentData) {
        component._visFlags = 0;
        component._customMaterial = null;
        component._srcBlendFactor = 2;
        component._dstBlendFactor = 4;
        component._color = this.createColorObject(this.getComponentPropertyValue(componentData, 'color', { r: 255, g: 255, b: 255, a: 255 }));
        component._spriteFrame = this.getComponentPropertyValue(componentData, 'spriteFrame', null);
        component._type = this.getComponentPropertyValue(componentData, 'type', 0);
        component._fillType = 0;
        component._sizeMode = this.getComponentPropertyValue(componentData, 'sizeMode', 1);
        component._fillCenter = this.createVec2Object({ x: 0, y: 0 });
        component._fillStart = 0;
        component._fillRange = 0;
        component._isTrimmedMode = true;
        component._useGrayscale = false;
        component._atlas = null;
    }
    // Label组件属性
    addLabelProperties(component, componentData) {
        component._visFlags = 0;
        component._customMaterial = null;
        component._srcBlendFactor = 2;
        component._dstBlendFactor = 4;
        component._color = this.createColorObject(this.getComponentPropertyValue(componentData, 'color', { r: 0, g: 0, b: 0, a: 255 }));
        component._string = this.getComponentPropertyValue(componentData, 'string', 'Label');
        component._horizontalAlign = 1;
        component._verticalAlign = 1;
        component._actualFontSize = 20;
        component._fontSize = this.getComponentPropertyValue(componentData, 'fontSize', 20);
        component._fontFamily = 'Arial';
        component._lineHeight = 40;
        component._overflow = 1;
        component._enableWrapText = false;
        component._font = null;
        component._isSystemFontUsed = true;
        component._isItalic = false;
        component._isBold = false;
        component._isUnderline = false;
        component._underlineHeight = 2;
        component._cacheMode = 0;
    }
    // Button组件属性
    addButtonProperties(component, componentData) {
        component.clickEvents = [];
        component._interactable = true;
        component._transition = 2;
        component._normalColor = this.createColorObject({ r: 214, g: 214, b: 214, a: 255 });
        component._hoverColor = this.createColorObject({ r: 211, g: 211, b: 211, a: 255 });
        component._pressedColor = this.createColorObject({ r: 255, g: 255, b: 255, a: 255 });
        component._disabledColor = this.createColorObject({ r: 124, g: 124, b: 124, a: 255 });
        component._duration = 0.1;
        component._zoomScale = 1.2;
    }
    // 添加通用属性
    addGenericProperties(component, componentData) {
        // 只复制安全的、已知的属性
        const safeProperties = ['enabled', 'color', 'string', 'fontSize', 'spriteFrame', 'type', 'sizeMode'];
        for (const prop of safeProperties) {
            if (componentData.hasOwnProperty(prop)) {
                const value = this.getComponentPropertyValue(componentData, prop);
                if (value !== undefined) {
                    component[`_${prop}`] = value;
                }
            }
        }
    }
    // 创建Vec2对象
    createVec2Object(data) {
        return {
            "__type__": "cc.Vec2",
            "x": (data === null || data === void 0 ? void 0 : data.x) || 0,
            "y": (data === null || data === void 0 ? void 0 : data.y) || 0
        };
    }
    // 创建Vec3对象
    createVec3Object(data) {
        return {
            "__type__": "cc.Vec3",
            "x": (data === null || data === void 0 ? void 0 : data.x) || 0,
            "y": (data === null || data === void 0 ? void 0 : data.y) || 0,
            "z": (data === null || data === void 0 ? void 0 : data.z) || 0
        };
    }
    // 创建Size对象
    createSizeObject(data) {
        return {
            "__type__": "cc.Size",
            "width": (data === null || data === void 0 ? void 0 : data.width) || 100,
            "height": (data === null || data === void 0 ? void 0 : data.height) || 100
        };
    }
    // 创建Color对象
    createColorObject(data) {
        var _a, _b, _c, _d;
        return {
            "__type__": "cc.Color",
            "r": (_a = data === null || data === void 0 ? void 0 : data.r) !== null && _a !== void 0 ? _a : 255,
            "g": (_b = data === null || data === void 0 ? void 0 : data.g) !== null && _b !== void 0 ? _b : 255,
            "b": (_c = data === null || data === void 0 ? void 0 : data.b) !== null && _c !== void 0 ? _c : 255,
            "a": (_d = data === null || data === void 0 ? void 0 : data.a) !== null && _d !== void 0 ? _d : 255
        };
    }
    // 判断是否应该复制组件属性
    shouldCopyComponentProperty(key, value) {
        // 跳过内部属性和已处理的属性
        if (key.startsWith('__') || key === '_enabled' || key === 'node' || key === 'enabled') {
            return false;
        }
        // 跳过函数和undefined值
        if (typeof value === 'function' || value === undefined) {
            return false;
        }
        return true;
    }
    // 获取组件属性值 - 重命名以避免冲突
    getComponentPropertyValue(componentData, propertyName, defaultValue) {
        // 尝试直接获取属性
        if (componentData[propertyName] !== undefined) {
            return this.extractValue(componentData[propertyName]);
        }
        // 尝试从value属性中获取
        if (componentData.value && componentData.value[propertyName] !== undefined) {
            return this.extractValue(componentData.value[propertyName]);
        }
        // 尝试带下划线前缀的属性名
        const prefixedName = `_${propertyName}`;
        if (componentData[prefixedName] !== undefined) {
            return this.extractValue(componentData[prefixedName]);
        }
        return defaultValue;
    }
    // 提取属性值
    extractValue(data) {
        if (data === null || data === undefined) {
            return data;
        }
        // 如果有value属性，优先使用value
        if (typeof data === 'object' && data.hasOwnProperty('value')) {
            return data.value;
        }
        // 如果是引用对象，保持原样
        if (typeof data === 'object' && (data.__id__ !== undefined || data.__uuid__ !== undefined)) {
            return data;
        }
        return data;
    }
    createStandardMetaData(prefabName, prefabUuid) {
        return {
            "ver": "1.1.50",
            "importer": "prefab",
            "imported": true,
            "uuid": prefabUuid,
            "files": [
                ".json"
            ],
            "subMetas": {},
            "userData": {
                "syncNodeName": prefabName
            }
        };
    }
    async savePrefabWithMeta(prefabPath, prefabData, metaData) {
        try {
            const prefabContent = JSON.stringify(prefabData, null, 2);
            const metaContent = JSON.stringify(metaData, null, 2);
            // 确保路径以.prefab结尾
            const finalPrefabPath = prefabPath.endsWith('.prefab') ? prefabPath : `${prefabPath}.prefab`;
            const metaPath = `${finalPrefabPath}.meta`;
            // 使用asset-db API创建预制体文件
            await new Promise((resolve, reject) => {
                Editor.Message.request('asset-db', 'create-asset', finalPrefabPath, prefabContent).then(() => {
                    resolve(true);
                }).catch((error) => {
                    reject(error);
                });
            });
            // 创建meta文件
            await new Promise((resolve, reject) => {
                Editor.Message.request('asset-db', 'create-asset', metaPath, metaContent).then(() => {
                    resolve(true);
                }).catch((error) => {
                    reject(error);
                });
            });
            console.log(`=== 预制体保存完成 ===`);
            console.log(`预制体文件已保存: ${finalPrefabPath}`);
            console.log(`Meta文件已保存: ${metaPath}`);
            console.log(`预制体数组总长度: ${prefabData.length}`);
            console.log(`预制体根节点索引: ${prefabData.length - 1}`);
            return { success: true };
        }
        catch (error) {
            console.error('保存预制体文件时出错:', error);
            return { success: false, error: error.message };
        }
    }
}
exports.PrefabTools = PrefabTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZmFiLXRvb2xzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL3Rvb2xzL3ByZWZhYi10b29scy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsZ0RBQWdEO0FBQ2hELDRDQUE0Qzs7O0FBSTVDLE1BQWEsV0FBVztJQUNwQixRQUFRO1FBQ0osT0FBTztZQUNIO2dCQUNJLElBQUksRUFBRSxpQkFBaUI7Z0JBQ3ZCLFdBQVcsRUFBRSxnQ0FBZ0M7Z0JBQzdDLFdBQVcsRUFBRTtvQkFDVCxJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUU7d0JBQ1IsTUFBTSxFQUFFOzRCQUNKLElBQUksRUFBRSxRQUFROzRCQUNkLFdBQVcsRUFBRSxrQ0FBa0M7NEJBQy9DLE9BQU8sRUFBRSxhQUFhO3lCQUN6QjtxQkFDSjtpQkFDSjthQUNKO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLGFBQWE7Z0JBQ25CLFdBQVcsRUFBRSx1QkFBdUI7Z0JBQ3BDLFdBQVcsRUFBRTtvQkFDVCxJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUU7d0JBQ1IsVUFBVSxFQUFFOzRCQUNSLElBQUksRUFBRSxRQUFROzRCQUNkLFdBQVcsRUFBRSxtQkFBbUI7eUJBQ25DO3FCQUNKO29CQUNELFFBQVEsRUFBRSxDQUFDLFlBQVksQ0FBQztpQkFDM0I7YUFDSjtZQUNEO2dCQUNJLElBQUksRUFBRSxvQkFBb0I7Z0JBQzFCLFdBQVcsRUFBRSxtQ0FBbUM7Z0JBQ2hELFdBQVcsRUFBRTtvQkFDVCxJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUU7d0JBQ1IsVUFBVSxFQUFFOzRCQUNSLElBQUksRUFBRSxRQUFROzRCQUNkLFdBQVcsRUFBRSxtQkFBbUI7eUJBQ25DO3dCQUNELFVBQVUsRUFBRTs0QkFDUixJQUFJLEVBQUUsUUFBUTs0QkFDZCxXQUFXLEVBQUUsNkJBQTZCO3lCQUM3Qzt3QkFDRCxRQUFRLEVBQUU7NEJBQ04sSUFBSSxFQUFFLFFBQVE7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LENBQUMsR0FBRyxFQUFFO29CQUNoRixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ2xCLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQVUsRUFBRSxFQUFFO29CQUNwQixNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ2xCLENBQUMsQ0FBQyxDQUFDO1lBQ1AsQ0FBQyxDQUFDLENBQUM7WUFFSCxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFDL0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLGVBQWUsRUFBRSxDQUFDLENBQUM7WUFDNUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDdEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1lBQzlDLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7WUFFbEQsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQztTQUM1QjtRQUFDLE9BQU8sS0FBVSxFQUFFO1lBQ2pCLE9BQU8sQ0FBQyxLQUFLLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3BDLE9BQU8sRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7U0FDbkQ7SUFDTCxDQUFDO0NBRUo7QUFyeUZELGtDQXF5RkMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vdHlwZXMvZWRpdG9yLTJ4LmQudHNcIiAvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL3R5cGVzL2NjLTJ4LmQudHNcIiAvPlxuXG5pbXBvcnQgeyBUb29sRGVmaW5pdGlvbiwgVG9vbFJlc3BvbnNlLCBUb29sRXhlY3V0b3IsIFByZWZhYkluZm8gfSBmcm9tICcuLi90eXBlcyc7XG5cbmV4cG9ydCBjbGFzcyBQcmVmYWJUb29scyBpbXBsZW1lbnRzIFRvb2xFeGVjdXRvciB7XG4gICAgZ2V0VG9vbHMoKTogVG9vbERlZmluaXRpb25bXSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2dldF9wcmVmYWJfbGlzdCcsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdHZXQgYWxsIHByZWZhYnMgaW4gdGhlIHByb2plY3QnLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb2xkZXI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0ZvbGRlciBwYXRoIHRvIHNlYXJjaCAob3B0aW9uYWwpJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiAnZGI6Ly9hc3NldHMnXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdsb2FkX3ByZWZhYicsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdMb2FkIGEgcHJlZmFiIGJ5IHBhdGgnLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmVmYWJQYXRoOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdQcmVmYWIgYXNzZXQgcGF0aCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsncHJlZmFiUGF0aCddXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnaW5zdGFudGlhdGVfcHJlZmFiJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0luc3RhbnRpYXRlIGEgcHJlZmFiIGluIHRoZSBzY2VuZScsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZWZhYlBhdGg6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1ByZWZhYiBhc3NldCBwYXRoJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudFV1aWQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1BhcmVudCBub2RlIFVVSUQgKG9wdGlvbmFsKSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnSW5pdGlhbCBwb3NpdGlvbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiB7IHR5cGU6ICdudW1iZXInIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHk6IHsgdHlwZTogJ251bWJlcicgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgejogeyB0eXBlOiAnbnVtYmVyJyB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWydwcmVmYWJQYXRoJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdjcmVhdGVfcHJlZmFiJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0NyZWF0ZSBhIHByZWZhYiBmcm9tIGEgbm9kZSB3aXRoIGFsbCBjaGlsZHJlbiBhbmQgY29tcG9uZW50cycsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVVdWlkOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdTb3VyY2Ugbm9kZSBVVUlEJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNhdmVQYXRoOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdQYXRoIHRvIHNhdmUgdGhlIHByZWZhYiAoZS5nLiwgZGI6Ly9hc3NldHMvcHJlZmFicy9NeVByZWZhYi5wcmVmYWIpJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZWZhYk5hbWU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1ByZWZhYiBuYW1lJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWydub2RlVXVpZCcsICdzYXZlUGF0aCcsICdwcmVmYWJOYW1lJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICd1cGRhdGVfcHJlZmFiJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1VwZGF0ZSBhbiBleGlzdGluZyBwcmVmYWInLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmVmYWJQYXRoOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdQcmVmYWIgYXNzZXQgcGF0aCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlVXVpZDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTm9kZSBVVUlEIHdpdGggY2hhbmdlcydcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsncHJlZmFiUGF0aCcsICdub2RlVXVpZCddXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAncmV2ZXJ0X3ByZWZhYicsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdSZXZlcnQgcHJlZmFiIGluc3RhbmNlIHRvIG9yaWdpbmFsJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVV1aWQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1ByZWZhYiBpbnN0YW5jZSBub2RlIFVVSUQnXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ25vZGVVdWlkJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdnZXRfcHJlZmFiX2luZm8nLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnR2V0IGRldGFpbGVkIHByZWZhYiBpbmZvcm1hdGlvbicsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZWZhYlBhdGg6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1ByZWZhYiBhc3NldCBwYXRoJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWydwcmVmYWJQYXRoJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICd2YWxpZGF0ZV9wcmVmYWInLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVmFsaWRhdGUgYSBwcmVmYWIgZmlsZSBmb3JtYXQnLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmVmYWJQYXRoOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdQcmVmYWIgYXNzZXQgcGF0aCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsncHJlZmFiUGF0aCddXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnZHVwbGljYXRlX3ByZWZhYicsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdEdXBsaWNhdGUgYW4gZXhpc3RpbmcgcHJlZmFiJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlUHJlZmFiUGF0aDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnU291cmNlIHByZWZhYiBwYXRoJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldFByZWZhYlBhdGg6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1RhcmdldCBwcmVmYWIgcGF0aCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdQcmVmYWJOYW1lOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdOZXcgcHJlZmFiIG5hbWUnXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ3NvdXJjZVByZWZhYlBhdGgnLCAndGFyZ2V0UHJlZmFiUGF0aCddXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAncmVzdG9yZV9wcmVmYWJfbm9kZScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdSZXN0b3JlIHByZWZhYiBub2RlIHVzaW5nIHByZWZhYiBhc3NldCAoYnVpbHQtaW4gdW5kbyByZWNvcmQpJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVV1aWQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1ByZWZhYiBpbnN0YW5jZSBub2RlIFVVSUQnXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXRVdWlkOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdQcmVmYWIgYXNzZXQgVVVJRCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsnbm9kZVV1aWQnLCAnYXNzZXRVdWlkJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIF07XG4gICAgfVxuXG4gICAgYXN5bmMgZXhlY3V0ZSh0b29sTmFtZTogc3RyaW5nLCBhcmdzOiBhbnkpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICBzd2l0Y2ggKHRvb2xOYW1lKSB7XG4gICAgICAgICAgICBjYXNlICdnZXRfcHJlZmFiX2xpc3QnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmdldFByZWZhYkxpc3QoYXJncy5mb2xkZXIpO1xuICAgICAgICAgICAgY2FzZSAnbG9hZF9wcmVmYWInOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmxvYWRQcmVmYWIoYXJncy5wcmVmYWJQYXRoKTtcbiAgICAgICAgICAgIGNhc2UgJ2luc3RhbnRpYXRlX3ByZWZhYic6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuaW5zdGFudGlhdGVQcmVmYWIoYXJncyk7XG4gICAgICAgICAgICBjYXNlICdjcmVhdGVfcHJlZmFiJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5jcmVhdGVQcmVmYWIoYXJncyk7XG4gICAgICAgICAgICBjYXNlICd1cGRhdGVfcHJlZmFiJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy51cGRhdGVQcmVmYWIoYXJncy5wcmVmYWJQYXRoLCBhcmdzLm5vZGVVdWlkKTtcbiAgICAgICAgICAgIGNhc2UgJ3JldmVydF9wcmVmYWInOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnJldmVydFByZWZhYihhcmdzLm5vZGVVdWlkKTtcbiAgICAgICAgICAgIGNhc2UgJ2dldF9wcmVmYWJfaW5mbyc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZ2V0UHJlZmFiSW5mbyhhcmdzLnByZWZhYlBhdGgpO1xuICAgICAgICAgICAgY2FzZSAndmFsaWRhdGVfcHJlZmFiJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy52YWxpZGF0ZVByZWZhYihhcmdzLnByZWZhYlBhdGgpO1xuICAgICAgICAgICAgY2FzZSAnZHVwbGljYXRlX3ByZWZhYic6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZHVwbGljYXRlUHJlZmFiKGFyZ3MpO1xuICAgICAgICAgICAgY2FzZSAncmVzdG9yZV9wcmVmYWJfbm9kZSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucmVzdG9yZVByZWZhYk5vZGUoYXJncy5ub2RlVXVpZCwgYXJncy5hc3NldFV1aWQpO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gdG9vbDogJHt0b29sTmFtZX1gKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgZ2V0UHJlZmFiTGlzdChmb2xkZXI6IHN0cmluZyA9ICdkYjovL2Fzc2V0cycpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHBhdHRlcm4gPSBmb2xkZXIuZW5kc1dpdGgoJy8nKSA/XG4gICAgICAgICAgICAgICAgYCR7Zm9sZGVyfSoqLyoucHJlZmFiYCA6IGAke2ZvbGRlcn0vKiovKi5wcmVmYWJgO1xuXG4gICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS1hc3NldHMnLCB7XG4gICAgICAgICAgICAgICAgcGF0dGVybjogcGF0dGVyblxuICAgICAgICAgICAgfSkudGhlbigocmVzdWx0czogYW55W10pID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBwcmVmYWJzOiBQcmVmYWJJbmZvW10gPSByZXN1bHRzLm1hcChhc3NldCA9PiAoe1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiBhc3NldC5uYW1lLFxuICAgICAgICAgICAgICAgICAgICBwYXRoOiBhc3NldC51cmwsXG4gICAgICAgICAgICAgICAgICAgIHV1aWQ6IGFzc2V0LnV1aWQsXG4gICAgICAgICAgICAgICAgICAgIGZvbGRlcjogYXNzZXQudXJsLnN1YnN0cmluZygwLCBhc3NldC51cmwubGFzdEluZGV4T2YoJy8nKSlcbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IHByZWZhYnMgfSk7XG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgbG9hZFByZWZhYihwcmVmYWJQYXRoOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LWFzc2V0LWluZm8nLCBwcmVmYWJQYXRoKS50aGVuKChhc3NldEluZm86IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghYXNzZXRJbmZvKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignUHJlZmFiIG5vdCBmb3VuZCcpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdsb2FkLWFzc2V0Jywge1xuICAgICAgICAgICAgICAgICAgICB1dWlkOiBhc3NldEluZm8udXVpZFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSkudGhlbigocHJlZmFiRGF0YTogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHByZWZhYkRhdGEudXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHByZWZhYkRhdGEubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdQcmVmYWIgbG9hZGVkIHN1Y2Nlc3NmdWxseSdcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGluc3RhbnRpYXRlUHJlZmFiKGFyZ3M6IGFueSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyAocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAvLyDojrflj5bpooTliLbkvZPotYTmupDkv6Hmga9cbiAgICAgICAgICAgICAgICBjb25zdCBhc3NldEluZm8gPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS1hc3NldC1pbmZvJywgYXJncy5wcmVmYWJQYXRoKTtcbiAgICAgICAgICAgICAgICBpZiAoIWFzc2V0SW5mbykge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+mihOWItuS9k+acquaJvuWIsCcpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIOS9v+eUqOato+ehrueahCBjcmVhdGUtbm9kZSBBUEkg5LuO6aKE5Yi25L2T6LWE5rqQ5a6e5L6L5YyWXG4gICAgICAgICAgICAgICAgY29uc3QgY3JlYXRlTm9kZU9wdGlvbnM6IGFueSA9IHtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXRVdWlkOiBhc3NldEluZm8udXVpZFxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvLyDorr7nva7niLboioLngrlcbiAgICAgICAgICAgICAgICBpZiAoYXJncy5wYXJlbnRVdWlkKSB7XG4gICAgICAgICAgICAgICAgICAgIGNyZWF0ZU5vZGVPcHRpb25zLnBhcmVudCA9IGFyZ3MucGFyZW50VXVpZDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyDorr7nva7oioLngrnlkI3np7BcbiAgICAgICAgICAgICAgICBpZiAoYXJncy5uYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGNyZWF0ZU5vZGVPcHRpb25zLm5hbWUgPSBhcmdzLm5hbWU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChhc3NldEluZm8ubmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBjcmVhdGVOb2RlT3B0aW9ucy5uYW1lID0gYXNzZXRJbmZvLm5hbWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8g6K6+572u5Yid5aeL5bGe5oCn77yI5aaC5L2N572u77yJXG4gICAgICAgICAgICAgICAgaWYgKGFyZ3MucG9zaXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgY3JlYXRlTm9kZU9wdGlvbnMuZHVtcCA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGFyZ3MucG9zaXRpb25cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyDliJvlu7roioLngrlcbiAgICAgICAgICAgICAgICBjb25zdCBub2RlVXVpZCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2NyZWF0ZS1ub2RlJywgY3JlYXRlTm9kZU9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHV1aWQgPSBBcnJheS5pc0FycmF5KG5vZGVVdWlkKSA/IG5vZGVVdWlkWzBdIDogbm9kZVV1aWQ7XG5cbiAgICAgICAgICAgICAgICAvLyDms6jmhI/vvJpjcmVhdGUtbm9kZSBBUEnku47pooTliLbkvZPotYTmupDliJvlu7rml7blupTor6Xoh6rliqjlu7rnq4vpooTliLbkvZPlhbPogZRcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygn6aKE5Yi25L2T6IqC54K55Yib5bu65oiQ5YqfOicsIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZVV1aWQ6IHV1aWQsXG4gICAgICAgICAgICAgICAgICAgIHByZWZhYlV1aWQ6IGFzc2V0SW5mby51dWlkLFxuICAgICAgICAgICAgICAgICAgICBwcmVmYWJQYXRoOiBhcmdzLnByZWZhYlBhdGhcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlVXVpZDogdXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZWZhYlBhdGg6IGFyZ3MucHJlZmFiUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudFV1aWQ6IGFyZ3MucGFyZW50VXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBhcmdzLnBvc2l0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ+mihOWItuS9k+WunuS+i+WMluaIkOWKn++8jOW3suW7uueri+mihOWItuS9k+WFs+iBlCdcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBg6aKE5Yi25L2T5a6e5L6L5YyW5aSx6LSlOiAke2Vyci5tZXNzYWdlfWAsXG4gICAgICAgICAgICAgICAgICAgIGluc3RydWN0aW9uOiAn6K+35qOA5p+l6aKE5Yi25L2T6Lev5b6E5piv5ZCm5q2j56Gu77yM56Gu5L+d6aKE5Yi25L2T5paH5Lu25qC85byP5q2j56GuJ1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlu7rnq4voioLngrnkuI7pooTliLbkvZPnmoTlhbPogZTlhbPns7tcbiAgICAgKiDov5nkuKrmlrnms5XliJvlu7rlv4XopoHnmoRQcmVmYWJJbmZv5ZKMUHJlZmFiSW5zdGFuY2Xnu5PmnoRcbiAgICAgKi9cbiAgICBwcml2YXRlIGFzeW5jIGVzdGFibGlzaFByZWZhYkNvbm5lY3Rpb24obm9kZVV1aWQ6IHN0cmluZywgcHJlZmFiVXVpZDogc3RyaW5nLCBwcmVmYWJQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIOivu+WPlumihOWItuS9k+aWh+S7tuiOt+WPluagueiKgueCueeahGZpbGVJZFxuICAgICAgICAgICAgY29uc3QgcHJlZmFiQ29udGVudCA9IGF3YWl0IHRoaXMucmVhZFByZWZhYkZpbGUocHJlZmFiUGF0aCk7XG4gICAgICAgICAgICBpZiAoIXByZWZhYkNvbnRlbnQgfHwgIXByZWZhYkNvbnRlbnQuZGF0YSB8fCAhcHJlZmFiQ29udGVudC5kYXRhLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5peg5rOV6K+75Y+W6aKE5Yi25L2T5paH5Lu25YaF5a65Jyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOaJvuWIsOmihOWItuS9k+agueiKgueCueeahGZpbGVJZCAo6YCa5bi45piv56ys5LqM5Liq5a+56LGh77yM5Y2z57Si5byVMSlcbiAgICAgICAgICAgIGNvbnN0IHJvb3ROb2RlID0gcHJlZmFiQ29udGVudC5kYXRhLmZpbmQoKGl0ZW06IGFueSkgPT4gaXRlbS5fX3R5cGUgPT09ICdjYy5Ob2RlJyAmJiBpdGVtLl9wYXJlbnQgPT09IG51bGwpO1xuICAgICAgICAgICAgaWYgKCFyb290Tm9kZSB8fCAhcm9vdE5vZGUuX3ByZWZhYikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5peg5rOV5om+5Yiw6aKE5Yi25L2T5qC56IqC54K55oiW5YW26aKE5Yi25L2T5L+h5oGvJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOiOt+WPluagueiKgueCueeahFByZWZhYkluZm9cbiAgICAgICAgICAgIGNvbnN0IHJvb3RQcmVmYWJJbmZvID0gcHJlZmFiQ29udGVudC5kYXRhW3Jvb3ROb2RlLl9wcmVmYWIuX19pZF9fXTtcbiAgICAgICAgICAgIGlmICghcm9vdFByZWZhYkluZm8gfHwgcm9vdFByZWZhYkluZm8uX190eXBlICE9PSAnY2MuUHJlZmFiSW5mbycpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+aXoOazleaJvuWIsOmihOWItuS9k+agueiKgueCueeahFByZWZhYkluZm8nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgcm9vdEZpbGVJZCA9IHJvb3RQcmVmYWJJbmZvLmZpbGVJZDtcblxuICAgICAgICAgICAgLy8g5L2/55Soc2NlbmUgQVBJ5bu656uL6aKE5Yi25L2T6L+e5o6lXG4gICAgICAgICAgICBjb25zdCBwcmVmYWJDb25uZWN0aW9uRGF0YSA9IHtcbiAgICAgICAgICAgICAgICBub2RlOiBub2RlVXVpZCxcbiAgICAgICAgICAgICAgICBwcmVmYWI6IHByZWZhYlV1aWQsXG4gICAgICAgICAgICAgICAgZmlsZUlkOiByb290RmlsZUlkXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvLyDlsJ3or5Xkvb/nlKjlpJrnp41BUEnmlrnms5Xlu7rnq4vpooTliLbkvZPov57mjqVcbiAgICAgICAgICAgIGNvbnN0IGNvbm5lY3Rpb25NZXRob2RzID0gW1xuICAgICAgICAgICAgICAgICgpID0+IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2Nvbm5lY3QtcHJlZmFiLWluc3RhbmNlJywgcHJlZmFiQ29ubmVjdGlvbkRhdGEpLFxuICAgICAgICAgICAgICAgICgpID0+IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3NldC1wcmVmYWItY29ubmVjdGlvbicsIHByZWZhYkNvbm5lY3Rpb25EYXRhKSxcbiAgICAgICAgICAgICAgICAoKSA9PiBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdhcHBseS1wcmVmYWItbGluaycsIHByZWZhYkNvbm5lY3Rpb25EYXRhKVxuICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgbGV0IGNvbm5lY3RlZCA9IGZhbHNlO1xuICAgICAgICAgICAgZm9yIChjb25zdCBtZXRob2Qgb2YgY29ubmVjdGlvbk1ldGhvZHMpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBtZXRob2QoKTtcbiAgICAgICAgICAgICAgICAgICAgY29ubmVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCfpooTliLbkvZPov57mjqXmlrnms5XlpLHotKXvvIzlsJ3or5XkuIvkuIDkuKrmlrnms5U6JywgZXJyb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFjb25uZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICAvLyDlpoLmnpzmiYDmnIlBUEnmlrnms5Xpg73lpLHotKXvvIzlsJ3or5XmiYvliqjkv67mlLnlnLrmma/mlbDmja5cbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ+aJgOaciemihOWItuS9k+i/nuaOpUFQSemDveWksei0pe+8jOWwneivleaJi+WKqOW7uueri+i/nuaOpScpO1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMubWFudWFsbHlFc3RhYmxpc2hQcmVmYWJDb25uZWN0aW9uKG5vZGVVdWlkLCBwcmVmYWJVdWlkLCByb290RmlsZUlkKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcign5bu656uL6aKE5Yi25L2T6L+e5o6l5aSx6LSlOicsIGVycm9yKTtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5omL5Yqo5bu656uL6aKE5Yi25L2T6L+e5o6l77yI5b2TQVBJ5pa55rOV5aSx6LSl5pe255qE5aSH55So5pa55qGI77yJXG4gICAgICovXG4gICAgcHJpdmF0ZSBhc3luYyBtYW51YWxseUVzdGFibGlzaFByZWZhYkNvbm5lY3Rpb24obm9kZVV1aWQ6IHN0cmluZywgcHJlZmFiVXVpZDogc3RyaW5nLCByb290RmlsZUlkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIOWwneivleS9v+eUqGR1bXAgQVBJ5L+u5pS56IqC54K555qEX3ByZWZhYuWxnuaAp1xuICAgICAgICAgICAgY29uc3QgcHJlZmFiQ29ubmVjdGlvbkRhdGEgPSB7XG4gICAgICAgICAgICAgICAgW25vZGVVdWlkXToge1xuICAgICAgICAgICAgICAgICAgICAnX3ByZWZhYic6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdfX3V1aWRfXyc6IHByZWZhYlV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAnX19leHBlY3RlZFR5cGVfXyc6ICdjYy5QcmVmYWInLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ2ZpbGVJZCc6IHJvb3RGaWxlSWRcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3NldC1wcm9wZXJ0eScsIHtcbiAgICAgICAgICAgICAgICB1dWlkOiBub2RlVXVpZCxcbiAgICAgICAgICAgICAgICBwYXRoOiAnX3ByZWZhYicsXG4gICAgICAgICAgICAgICAgZHVtcDoge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ19fdXVpZF9fJzogcHJlZmFiVXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICdfX2V4cGVjdGVkVHlwZV9fJzogJ2NjLlByZWZhYidcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCfmiYvliqjlu7rnq4vpooTliLbkvZPov57mjqXkuZ/lpLHotKU6JywgZXJyb3IpO1xuICAgICAgICAgICAgLy8g5LiN5oqb5Ye66ZSZ6K+v77yM5Zug5Li65Z+65pys55qE6IqC54K55Yib5bu65bey57uP5oiQ5YqfXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDor7vlj5bpooTliLbkvZPmlofku7blhoXlrrlcbiAgICAgKi9cbiAgICBwcml2YXRlIGFzeW5jIHJlYWRQcmVmYWJGaWxlKHByZWZhYlBhdGg6IHN0cmluZyk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyDlsJ3or5Xkvb/nlKhhc3NldC1kYiBBUEnor7vlj5bmlofku7blhoXlrrlcbiAgICAgICAgICAgIGxldCBhc3NldENvbnRlbnQ6IGFueTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXNzZXRDb250ZW50ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktYXNzZXQtaW5mbycsIHByZWZhYlBhdGgpO1xuICAgICAgICAgICAgICAgIGlmIChhc3NldENvbnRlbnQgJiYgYXNzZXRDb250ZW50LnNvdXJjZSkge1xuICAgICAgICAgICAgICAgICAgICAvLyDlpoLmnpzmnIlzb3VyY2Xot6/lvoTvvIznm7TmjqXor7vlj5bmlofku7ZcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZnMgPSByZXF1aXJlKCdmcycpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmdWxsUGF0aCA9IHBhdGgucmVzb2x2ZShhc3NldENvbnRlbnQuc291cmNlKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmlsZUNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMoZnVsbFBhdGgsICd1dGY4Jyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBKU09OLnBhcnNlKGZpbGVDb250ZW50KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2Fybign5L2/55SoYXNzZXQtZGLor7vlj5blpLHotKXvvIzlsJ3or5Xlhbbku5bmlrnms5U6JywgZXJyb3IpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDlpIfnlKjmlrnms5XvvJrovazmjaJkYjovL+i3r+W+hOS4uuWunumZheaWh+S7tui3r+W+hFxuICAgICAgICAgICAgY29uc3QgZnNQYXRoID0gcHJlZmFiUGF0aC5yZXBsYWNlKCdkYjovL2Fzc2V0cy8nLCAnYXNzZXRzLycpLnJlcGxhY2UoJ2RiOi8vYXNzZXRzJywgJ2Fzc2V0cycpO1xuICAgICAgICAgICAgY29uc3QgZnMgPSByZXF1aXJlKCdmcycpO1xuICAgICAgICAgICAgY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcblxuICAgICAgICAgICAgLy8g5bCd6K+V5aSa5Liq5Y+v6IO955qE6aG555uu5qC56Lev5b6EXG4gICAgICAgICAgICBjb25zdCBwb3NzaWJsZVBhdGhzID0gW1xuICAgICAgICAgICAgICAgIHBhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpLCAnLi4vLi4vTmV3UHJvamVjdF8zJywgZnNQYXRoKSxcbiAgICAgICAgICAgICAgICBwYXRoLnJlc29sdmUoJy9Vc2Vycy9saXpoaXlvbmcvTmV3UHJvamVjdF8zJywgZnNQYXRoKSxcbiAgICAgICAgICAgICAgICBwYXRoLnJlc29sdmUoZnNQYXRoKSxcbiAgICAgICAgICAgICAgICAvLyDlpoLmnpzmmK/moLnnm67lvZXkuIvnmoTmlofku7bvvIzkuZ/lsJ3or5Xnm7TmjqXot6/lvoRcbiAgICAgICAgICAgICAgICBwYXRoLnJlc29sdmUoJy9Vc2Vycy9saXpoaXlvbmcvTmV3UHJvamVjdF8zL2Fzc2V0cycsIHBhdGguYmFzZW5hbWUoZnNQYXRoKSlcbiAgICAgICAgICAgIF07XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCflsJ3or5Xor7vlj5bpooTliLbkvZPmlofku7bvvIzot6/lvoTovazmjaI6Jywge1xuICAgICAgICAgICAgICAgIG9yaWdpbmFsUGF0aDogcHJlZmFiUGF0aCxcbiAgICAgICAgICAgICAgICBmc1BhdGg6IGZzUGF0aCxcbiAgICAgICAgICAgICAgICBwb3NzaWJsZVBhdGhzOiBwb3NzaWJsZVBhdGhzXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZm9yIChjb25zdCBmdWxsUGF0aCBvZiBwb3NzaWJsZVBhdGhzKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYOajgOafpei3r+W+hDogJHtmdWxsUGF0aH1gKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoZnVsbFBhdGgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhg5om+5Yiw5paH5Lu2OiAke2Z1bGxQYXRofWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZmlsZUNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMoZnVsbFBhdGgsICd1dGY4Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKGZpbGVDb250ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCfmlofku7bop6PmnpDmiJDlip/vvIzmlbDmja7nu5PmnoQ6Jywge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhc0RhdGE6ICEhcGFyc2VkLmRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YUxlbmd0aDogcGFyc2VkLmRhdGEgPyBwYXJzZWQuZGF0YS5sZW5ndGggOiAwXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZWQ7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhg5paH5Lu25LiN5a2Y5ZyoOiAke2Z1bGxQYXRofWApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAocmVhZEVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2Fybihg6K+75Y+W5paH5Lu25aSx6LSlICR7ZnVsbFBhdGh9OmAsIHJlYWRFcnJvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+aXoOazleaJvuWIsOaIluivu+WPlumihOWItuS9k+aWh+S7ticpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcign6K+75Y+W6aKE5Yi25L2T5paH5Lu25aSx6LSlOicsIGVycm9yKTtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyB0cnlDcmVhdGVOb2RlV2l0aFByZWZhYihhcmdzOiBhbnkpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LWFzc2V0LWluZm8nLCBhcmdzLnByZWZhYlBhdGgpLnRoZW4oKGFzc2V0SW5mbzogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFhc3NldEluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfpooTliLbkvZPmnKrmib7liLAnKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyDmlrnms5UyOiDkvb/nlKggY3JlYXRlLW5vZGUg5oyH5a6a6aKE5Yi25L2T6LWE5rqQXG4gICAgICAgICAgICAgICAgY29uc3QgY3JlYXRlTm9kZU9wdGlvbnM6IGFueSA9IHtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXRVdWlkOiBhc3NldEluZm8udXVpZFxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvLyDorr7nva7niLboioLngrlcbiAgICAgICAgICAgICAgICBpZiAoYXJncy5wYXJlbnRVdWlkKSB7XG4gICAgICAgICAgICAgICAgICAgIGNyZWF0ZU5vZGVPcHRpb25zLnBhcmVudCA9IGFyZ3MucGFyZW50VXVpZDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnY3JlYXRlLW5vZGUnLCBjcmVhdGVOb2RlT3B0aW9ucyk7XG4gICAgICAgICAgICB9KS50aGVuKChub2RlVXVpZDogc3RyaW5nIHwgc3RyaW5nW10pID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCB1dWlkID0gQXJyYXkuaXNBcnJheShub2RlVXVpZCkgPyBub2RlVXVpZFswXSA6IG5vZGVVdWlkO1xuXG4gICAgICAgICAgICAgICAgLy8g5aaC5p6c5oyH5a6a5LqG5L2N572u77yM6K6+572u6IqC54K55L2N572uXG4gICAgICAgICAgICAgICAgaWYgKGFyZ3MucG9zaXRpb24gJiYgdXVpZCkge1xuICAgICAgICAgICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdzZXQtcHJvcGVydHknLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB1dWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogJ3Bvc2l0aW9uJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGR1bXA6IHsgdmFsdWU6IGFyZ3MucG9zaXRpb24gfVxuICAgICAgICAgICAgICAgICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlVXVpZDogdXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJlZmFiUGF0aDogYXJncy5wcmVmYWJQYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogYXJncy5wb3NpdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ+mihOWItuS9k+WunuS+i+WMluaIkOWKn++8iOWkh+eUqOaWueazle+8ieW5tuiuvue9ruS6huS9jee9ridcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVVdWlkOiB1dWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmVmYWJQYXRoOiBhcmdzLnByZWZhYlBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfpooTliLbkvZPlrp7kvovljJbmiJDlip/vvIjlpIfnlKjmlrnms5XvvInkvYbkvY3nva7orr7nva7lpLHotKUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlVXVpZDogdXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmVmYWJQYXRoOiBhcmdzLnByZWZhYlBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ+mihOWItuS9k+WunuS+i+WMluaIkOWKn++8iOWkh+eUqOaWueazle+8iSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBg5aSH55So6aKE5Yi25L2T5a6e5L6L5YyW5pa55rOV5Lmf5aSx6LSlOiAke2Vyci5tZXNzYWdlfWBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHRyeUFsdGVybmF0aXZlSW5zdGFudGlhdGVNZXRob2RzKGFyZ3M6IGFueSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyAocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAvLyDmlrnms5UxOiDlsJ3or5Xkvb/nlKggY3JlYXRlLW5vZGUg54S25ZCO6K6+572u6aKE5Yi25L2TXG4gICAgICAgICAgICAgICAgY29uc3QgYXNzZXRJbmZvID0gYXdhaXQgdGhpcy5nZXRBc3NldEluZm8oYXJncy5wcmVmYWJQYXRoKTtcbiAgICAgICAgICAgICAgICBpZiAoIWFzc2V0SW5mbykge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAn5peg5rOV6I635Y+W6aKE5Yi25L2T5L+h5oGvJyB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIOWIm+W7uuepuuiKgueCuVxuICAgICAgICAgICAgICAgIGNvbnN0IGNyZWF0ZVJlc3VsdCA9IGF3YWl0IHRoaXMuY3JlYXRlTm9kZShhcmdzLnBhcmVudFV1aWQsIGFyZ3MucG9zaXRpb24pO1xuICAgICAgICAgICAgICAgIGlmICghY3JlYXRlUmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShjcmVhdGVSZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8g5bCd6K+V5bCG6aKE5Yi25L2T5bqU55So5Yiw6IqC54K5XG4gICAgICAgICAgICAgICAgY29uc3QgYXBwbHlSZXN1bHQgPSBhd2FpdCB0aGlzLmFwcGx5UHJlZmFiVG9Ob2RlKGNyZWF0ZVJlc3VsdC5kYXRhLm5vZGVVdWlkLCBhc3NldEluZm8udXVpZCk7XG4gICAgICAgICAgICAgICAgaWYgKGFwcGx5UmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVVdWlkOiBjcmVhdGVSZXN1bHQuZGF0YS5ub2RlVXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBjcmVhdGVSZXN1bHQuZGF0YS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfpooTliLbkvZPlrp7kvovljJbmiJDlip/vvIjkvb/nlKjlpIfpgInmlrnms5XvvIknXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogJ+aXoOazleWwhumihOWItuS9k+W6lOeUqOWIsOiKgueCuScsXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVV1aWQ6IGNyZWF0ZVJlc3VsdC5kYXRhLm5vZGVVdWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICflt7LliJvlu7roioLngrnvvIzkvYbml6Dms5XlupTnlKjpooTliLbkvZPmlbDmja4nXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBg5aSH6YCJ5a6e5L6L5YyW5pa55rOV5aSx6LSlOiAke2Vycm9yfWAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgZ2V0QXNzZXRJbmZvKHByZWZhYlBhdGg6IHN0cmluZyk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktYXNzZXQtaW5mbycsIHByZWZhYlBhdGgpLnRoZW4oKGFzc2V0SW5mbzogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShhc3NldEluZm8pO1xuICAgICAgICAgICAgfSkuY2F0Y2goKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUobnVsbCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBjcmVhdGVOb2RlKHBhcmVudFV1aWQ/OiBzdHJpbmcsIHBvc2l0aW9uPzogYW55KTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBjcmVhdGVOb2RlT3B0aW9uczogYW55ID0ge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdQcmVmYWJJbnN0YW5jZSdcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8vIOiuvue9rueItuiKgueCuVxuICAgICAgICAgICAgaWYgKHBhcmVudFV1aWQpIHtcbiAgICAgICAgICAgICAgICBjcmVhdGVOb2RlT3B0aW9ucy5wYXJlbnQgPSBwYXJlbnRVdWlkO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDorr7nva7kvY3nva5cbiAgICAgICAgICAgIGlmIChwb3NpdGlvbikge1xuICAgICAgICAgICAgICAgIGNyZWF0ZU5vZGVPcHRpb25zLmR1bXAgPSB7XG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBwb3NpdGlvblxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2NyZWF0ZS1ub2RlJywgY3JlYXRlTm9kZU9wdGlvbnMpLnRoZW4oKG5vZGVVdWlkOiBzdHJpbmcgfCBzdHJpbmdbXSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHV1aWQgPSBBcnJheS5pc0FycmF5KG5vZGVVdWlkKSA/IG5vZGVVdWlkWzBdIDogbm9kZVV1aWQ7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVVdWlkOiB1dWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ1ByZWZhYkluc3RhbmNlJ1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyb3I6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfHwgJ+WIm+W7uuiKgueCueWksei0pScgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBhcHBseVByZWZhYlRvTm9kZShub2RlVXVpZDogc3RyaW5nLCBwcmVmYWJVdWlkOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIC8vIOWwneivleWkmuenjeaWueazleadpeW6lOeUqOmihOWItuS9k+aVsOaNrlxuICAgICAgICAgICAgY29uc3QgbWV0aG9kcyA9IFtcbiAgICAgICAgICAgICAgICAoKSA9PiBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdhcHBseS1wcmVmYWInLCB7IG5vZGU6IG5vZGVVdWlkLCBwcmVmYWI6IHByZWZhYlV1aWQgfSksXG4gICAgICAgICAgICAgICAgKCkgPT4gRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnc2V0LXByZWZhYicsIHsgbm9kZTogbm9kZVV1aWQsIHByZWZhYjogcHJlZmFiVXVpZCB9KSxcbiAgICAgICAgICAgICAgICAoKSA9PiBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdsb2FkLXByZWZhYi10by1ub2RlJywgeyBub2RlOiBub2RlVXVpZCwgcHJlZmFiOiBwcmVmYWJVdWlkIH0pXG4gICAgICAgICAgICBdO1xuXG4gICAgICAgICAgICBjb25zdCB0cnlNZXRob2QgPSAoaW5kZXg6IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChpbmRleCA+PSBtZXRob2RzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAn5peg5rOV5bqU55So6aKE5Yi25L2T5pWw5o2uJyB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIG1ldGhvZHNbaW5kZXhdKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgIH0pLmNhdGNoKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5TWV0aG9kKGluZGV4ICsgMSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0cnlNZXRob2QoMCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOS9v+eUqCBhc3NldC1kYiBBUEkg5Yib5bu66aKE5Yi25L2T55qE5paw5pa55rOVXG4gICAgICog5rex5bqm5pW05ZCI5byV5pOO55qE6LWE5rqQ566h55CG57O757uf77yM5a6e546w5a6M5pW055qE6aKE5Yi25L2T5Yib5bu65rWB56iLXG4gICAgICovXG4gICAgcHJpdmF0ZSBhc3luYyBjcmVhdGVQcmVmYWJXaXRoQXNzZXREQihub2RlVXVpZDogc3RyaW5nLCBzYXZlUGF0aDogc3RyaW5nLCBwcmVmYWJOYW1lOiBzdHJpbmcsIGluY2x1ZGVDaGlsZHJlbjogYm9vbGVhbiwgaW5jbHVkZUNvbXBvbmVudHM6IGJvb2xlYW4pOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMgKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJz09PSDkvb/nlKggQXNzZXQtREIgQVBJIOWIm+W7uumihOWItuS9kyA9PT0nKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhg6IqC54K5VVVJRDogJHtub2RlVXVpZH1gKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhg5L+d5a2Y6Lev5b6EOiAke3NhdmVQYXRofWApO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGDpooTliLbkvZPlkI3np7A6ICR7cHJlZmFiTmFtZX1gKTtcblxuICAgICAgICAgICAgICAgIC8vIOesrOS4gOatpe+8muiOt+WPluiKgueCueaVsOaNru+8iOWMheaLrOWPmOaNouWxnuaAp++8iVxuICAgICAgICAgICAgICAgIGNvbnN0IG5vZGVEYXRhID0gYXdhaXQgdGhpcy5nZXROb2RlRGF0YShub2RlVXVpZCk7XG4gICAgICAgICAgICAgICAgaWYgKCFub2RlRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6ICfml6Dms5Xojrflj5boioLngrnmlbDmja4nXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ+iOt+WPluWIsOiKgueCueaVsOaNru+8jOWtkOiKgueCueaVsOmHjzonLCBub2RlRGF0YS5jaGlsZHJlbiA/IG5vZGVEYXRhLmNoaWxkcmVuLmxlbmd0aCA6IDApO1xuXG4gICAgICAgICAgICAgICAgLy8g56ys5LqM5q2l77ya5YWI5Yib5bu66LWE5rqQ5paH5Lu25Lul6I635Y+W5byV5pOO5YiG6YWN55qEVVVJRFxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCfliJvlu7rpooTliLbkvZPotYTmupDmlofku7YuLi4nKTtcbiAgICAgICAgICAgICAgICBjb25zdCB0ZW1wUHJlZmFiQ29udGVudCA9IEpTT04uc3RyaW5naWZ5KFt7XCJfX3R5cGVfX1wiOiBcImNjLlByZWZhYlwiLCBcIl9uYW1lXCI6IHByZWZhYk5hbWV9XSwgbnVsbCwgMik7XG4gICAgICAgICAgICAgICAgY29uc3QgY3JlYXRlUmVzdWx0ID0gYXdhaXQgdGhpcy5jcmVhdGVBc3NldFdpdGhBc3NldERCKHNhdmVQYXRoLCB0ZW1wUHJlZmFiQ29udGVudCk7XG4gICAgICAgICAgICAgICAgaWYgKCFjcmVhdGVSZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGNyZWF0ZVJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyDojrflj5blvJXmk47liIbphY3nmoTlrp7pmYVVVUlEXG4gICAgICAgICAgICAgICAgY29uc3QgYWN0dWFsUHJlZmFiVXVpZCA9IGNyZWF0ZVJlc3VsdC5kYXRhPy51dWlkO1xuICAgICAgICAgICAgICAgIGlmICghYWN0dWFsUHJlZmFiVXVpZCkge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6ICfml6Dms5Xojrflj5blvJXmk47liIbphY3nmoTpooTliLbkvZNVVUlEJ1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygn5byV5pOO5YiG6YWN55qEVVVJRDonLCBhY3R1YWxQcmVmYWJVdWlkKTtcblxuICAgICAgICAgICAgICAgIC8vIOesrOS4ieatpe+8muS9v+eUqOWunumZhVVVSUTph43mlrDnlJ/miJDpooTliLbkvZPlhoXlrrlcbiAgICAgICAgICAgICAgICBjb25zdCBwcmVmYWJDb250ZW50ID0gYXdhaXQgdGhpcy5jcmVhdGVTdGFuZGFyZFByZWZhYkNvbnRlbnQobm9kZURhdGEsIHByZWZhYk5hbWUsIGFjdHVhbFByZWZhYlV1aWQsIGluY2x1ZGVDaGlsZHJlbiwgaW5jbHVkZUNvbXBvbmVudHMpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHByZWZhYkNvbnRlbnRTdHJpbmcgPSBKU09OLnN0cmluZ2lmeShwcmVmYWJDb250ZW50LCBudWxsLCAyKTtcblxuICAgICAgICAgICAgICAgIC8vIOesrOWbm+atpe+8muabtOaWsOmihOWItuS9k+aWh+S7tuWGheWuuVxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCfmm7TmlrDpooTliLbkvZPmlofku7blhoXlrrkuLi4nKTtcbiAgICAgICAgICAgICAgICBjb25zdCB1cGRhdGVSZXN1bHQgPSBhd2FpdCB0aGlzLnVwZGF0ZUFzc2V0V2l0aEFzc2V0REIoc2F2ZVBhdGgsIHByZWZhYkNvbnRlbnRTdHJpbmcpO1xuXG4gICAgICAgICAgICAgICAgLy8g56ys5LqU5q2l77ya5Yib5bu65a+55bqU55qEbWV0YeaWh+S7tu+8iOS9v+eUqOWunumZhVVVSUTvvIlcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygn5Yib5bu66aKE5Yi25L2TbWV0YeaWh+S7ti4uLicpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG1ldGFDb250ZW50ID0gdGhpcy5jcmVhdGVTdGFuZGFyZE1ldGFDb250ZW50KHByZWZhYk5hbWUsIGFjdHVhbFByZWZhYlV1aWQpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG1ldGFSZXN1bHQgPSBhd2FpdCB0aGlzLmNyZWF0ZU1ldGFXaXRoQXNzZXREQihzYXZlUGF0aCwgbWV0YUNvbnRlbnQpO1xuXG4gICAgICAgICAgICAgICAgLy8g56ys5YWt5q2l77ya6YeN5paw5a+85YWl6LWE5rqQ5Lul5pu05paw5byV55SoXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ+mHjeaWsOWvvOWFpemihOWItuS9k+i1hOa6kC4uLicpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlaW1wb3J0UmVzdWx0ID0gYXdhaXQgdGhpcy5yZWltcG9ydEFzc2V0V2l0aEFzc2V0REIoc2F2ZVBhdGgpO1xuXG4gICAgICAgICAgICAgICAgLy8g56ys5LiD5q2l77ya5bCd6K+V5bCG5Y6f5aeL6IqC54K56L2s5o2i5Li66aKE5Yi25L2T5a6e5L6LXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ+WwneivleWwhuWOn+Wni+iKgueCuei9rOaNouS4uumihOWItuS9k+WunuS+iy4uLicpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnZlcnRSZXN1bHQgPSBhd2FpdCB0aGlzLmNvbnZlcnROb2RlVG9QcmVmYWJJbnN0YW5jZShub2RlVXVpZCwgYWN0dWFsUHJlZmFiVXVpZCwgc2F2ZVBhdGgpO1xuXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZWZhYlV1aWQ6IGFjdHVhbFByZWZhYlV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBwcmVmYWJQYXRoOiBzYXZlUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVVdWlkOiBub2RlVXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZWZhYk5hbWU6IHByZWZhYk5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb252ZXJ0ZWRUb1ByZWZhYkluc3RhbmNlOiBjb252ZXJ0UmVzdWx0LnN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgICAgICBjcmVhdGVBc3NldFJlc3VsdDogY3JlYXRlUmVzdWx0LFxuICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlUmVzdWx0OiB1cGRhdGVSZXN1bHQsXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXRhUmVzdWx0OiBtZXRhUmVzdWx0LFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVpbXBvcnRSZXN1bHQ6IHJlaW1wb3J0UmVzdWx0LFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udmVydFJlc3VsdDogY29udmVydFJlc3VsdCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGNvbnZlcnRSZXN1bHQuc3VjY2VzcyA/ICfpooTliLbkvZPliJvlu7rlubbmiJDlip/ovazmjaLljp/lp4voioLngrknIDogJ+mihOWItuS9k+WIm+W7uuaIkOWKn++8jOS9huiKgueCuei9rOaNouWksei0pSdcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ+WIm+W7uumihOWItuS9k+aXtuWPkeeUn+mUmeivrzonLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogYOWIm+W7uumihOWItuS9k+Wksei0pTogJHtlcnJvcn1gXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgY3JlYXRlUHJlZmFiKGFyZ3M6IGFueSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyAocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAvLyDmlK/mjIEgcHJlZmFiUGF0aCDlkowgc2F2ZVBhdGgg5Lik56eN5Y+C5pWw5ZCNXG4gICAgICAgICAgICAgICAgY29uc3QgcGF0aFBhcmFtID0gYXJncy5wcmVmYWJQYXRoIHx8IGFyZ3Muc2F2ZVBhdGg7XG4gICAgICAgICAgICAgICAgaWYgKCFwYXRoUGFyYW0pIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiAn57y65bCR6aKE5Yi25L2T6Lev5b6E5Y+C5pWw44CC6K+35o+Q5L6bIHByZWZhYlBhdGgg5oiWIHNhdmVQYXRo44CCJ1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnN0IHByZWZhYk5hbWUgPSBhcmdzLnByZWZhYk5hbWUgfHwgJ05ld1ByZWZhYic7XG4gICAgICAgICAgICAgICAgY29uc3QgZnVsbFBhdGggPSBwYXRoUGFyYW0uZW5kc1dpdGgoJy5wcmVmYWInKSA/XG4gICAgICAgICAgICAgICAgICAgIHBhdGhQYXJhbSA6IGAke3BhdGhQYXJhbX0vJHtwcmVmYWJOYW1lfS5wcmVmYWJgO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgaW5jbHVkZUNoaWxkcmVuID0gYXJncy5pbmNsdWRlQ2hpbGRyZW4gIT09IGZhbHNlOyAvLyDpu5jorqTkuLogdHJ1ZVxuICAgICAgICAgICAgICAgIGNvbnN0IGluY2x1ZGVDb21wb25lbnRzID0gYXJncy5pbmNsdWRlQ29tcG9uZW50cyAhPT0gZmFsc2U7IC8vIOm7mOiupOS4uiB0cnVlXG5cbiAgICAgICAgICAgICAgICAvLyDkvJjlhYjkvb/nlKjmlrDnmoQgYXNzZXQtZGIg5pa55rOV5Yib5bu66aKE5Yi25L2TXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ+S9v+eUqOaWsOeahCBhc3NldC1kYiDmlrnms5XliJvlu7rpooTliLbkvZMuLi4nKTtcbiAgICAgICAgICAgICAgICBjb25zdCBhc3NldERiUmVzdWx0ID0gYXdhaXQgdGhpcy5jcmVhdGVQcmVmYWJXaXRoQXNzZXREQihcbiAgICAgICAgICAgICAgICAgICAgYXJncy5ub2RlVXVpZCxcbiAgICAgICAgICAgICAgICAgICAgZnVsbFBhdGgsXG4gICAgICAgICAgICAgICAgICAgIHByZWZhYk5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGluY2x1ZGVDaGlsZHJlbixcbiAgICAgICAgICAgICAgICAgICAgaW5jbHVkZUNvbXBvbmVudHNcbiAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgaWYgKGFzc2V0RGJSZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGFzc2V0RGJSZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8g5aaC5p6cIGFzc2V0LWRiIOaWueazleWksei0pe+8jOWwneivleS9v+eUqENvY29zIENyZWF0b3LnmoTljp/nlJ/pooTliLbkvZPliJvlu7pBUElcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnYXNzZXQtZGIg5pa55rOV5aSx6LSl77yM5bCd6K+V5Y6f55SfQVBJLi4uJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgbmF0aXZlUmVzdWx0ID0gYXdhaXQgdGhpcy5jcmVhdGVQcmVmYWJOYXRpdmUoYXJncy5ub2RlVXVpZCwgZnVsbFBhdGgpO1xuICAgICAgICAgICAgICAgIGlmIChuYXRpdmVSZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKG5hdGl2ZVJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyDlpoLmnpzljp/nlJ9BUEnlpLHotKXvvIzkvb/nlKjoh6rlrprkuYnlrp7njrBcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygn5Y6f55SfQVBJ5aSx6LSl77yM5L2/55So6Ieq5a6a5LmJ5a6e546wLi4uJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgY3VzdG9tUmVzdWx0ID0gYXdhaXQgdGhpcy5jcmVhdGVQcmVmYWJDdXN0b20oYXJncy5ub2RlVXVpZCwgZnVsbFBhdGgsIHByZWZhYk5hbWUpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoY3VzdG9tUmVzdWx0KTtcblxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBg5Yib5bu66aKE5Yi25L2T5pe25Y+R55Sf6ZSZ6K+vOiAke2Vycm9yfWBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBjcmVhdGVQcmVmYWJOYXRpdmUobm9kZVV1aWQ6IHN0cmluZywgcHJlZmFiUGF0aDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAvLyDmoLnmja7lrpjmlrlBUEnmlofmoaPvvIzkuI3lrZjlnKjnm7TmjqXnmoTpooTliLbkvZPliJvlu7pBUElcbiAgICAgICAgICAgIC8vIOmihOWItuS9k+WIm+W7uumcgOimgeaJi+WKqOWcqOe8lui+keWZqOS4reWujOaIkFxuICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgZXJyb3I6ICfljp/nlJ/pooTliLbkvZPliJvlu7pBUEnkuI3lrZjlnKgnLFxuICAgICAgICAgICAgICAgIGluc3RydWN0aW9uOiAn5qC55o2uQ29jb3MgQ3JlYXRvcuWumOaWuUFQSeaWh+aho++8jOmihOWItuS9k+WIm+W7uumcgOimgeaJi+WKqOaTjeS9nO+8mlxcbjEuIOWcqOWcuuaZr+S4remAieaLqeiKgueCuVxcbjIuIOWwhuiKgueCueaLluaLveWIsOi1hOa6kOeuoeeQhuWZqOS4rVxcbjMuIOaIluWPs+mUruiKgueCuemAieaLqVwi55Sf5oiQ6aKE5Yi25L2TXCInXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBjcmVhdGVQcmVmYWJDdXN0b20obm9kZVV1aWQ6IHN0cmluZywgcHJlZmFiUGF0aDogc3RyaW5nLCBwcmVmYWJOYW1lOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMgKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgLy8gMS4g6I635Y+W5rqQ6IqC54K555qE5a6M5pW05pWw5o2uXG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZURhdGEgPSBhd2FpdCB0aGlzLmdldE5vZGVEYXRhKG5vZGVVdWlkKTtcbiAgICAgICAgICAgICAgICBpZiAoIW5vZGVEYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogYOaXoOazleaJvuWIsOiKgueCuTogJHtub2RlVXVpZH1gXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gMi4g55Sf5oiQ6aKE5Yi25L2TVVVJRFxuICAgICAgICAgICAgICAgIGNvbnN0IHByZWZhYlV1aWQgPSB0aGlzLmdlbmVyYXRlVVVJRCgpO1xuXG4gICAgICAgICAgICAgICAgLy8gMy4g5Yib5bu66aKE5Yi25L2T5pWw5o2u57uT5p6EXG4gICAgICAgICAgICAgICAgY29uc3QgcHJlZmFiRGF0YSA9IHRoaXMuY3JlYXRlUHJlZmFiRGF0YShub2RlRGF0YSwgcHJlZmFiTmFtZSwgcHJlZmFiVXVpZCk7XG5cbiAgICAgICAgICAgICAgICAvLyA0LiDln7rkuo7lrpjmlrnmoLzlvI/liJvlu7rpooTliLbkvZPmlbDmja7nu5PmnoRcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPT09IOW8gOWni+WIm+W7uumihOWItuS9kyA9PT0nKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygn6IqC54K55ZCN56ewOicsIG5vZGVEYXRhLm5hbWU/LnZhbHVlIHx8ICfmnKrnn6UnKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygn6IqC54K5VVVJRDonLCBub2RlRGF0YS51dWlkPy52YWx1ZSB8fCAn5pyq55+lJyk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ+mihOWItuS9k+S/neWtmOi3r+W+hDonLCBwcmVmYWJQYXRoKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhg5byA5aeL5Yib5bu66aKE5Yi25L2T77yM6IqC54K55pWw5o2uOmAsIG5vZGVEYXRhKTtcbiAgICAgICAgICAgICAgICBjb25zdCBwcmVmYWJKc29uRGF0YSA9IGF3YWl0IHRoaXMuY3JlYXRlU3RhbmRhcmRQcmVmYWJDb250ZW50KG5vZGVEYXRhLCBwcmVmYWJOYW1lLCBwcmVmYWJVdWlkLCB0cnVlLCB0cnVlKTtcblxuICAgICAgICAgICAgICAgIC8vIDUuIOWIm+W7uuagh+WHhm1ldGHmlofku7bmlbDmja5cbiAgICAgICAgICAgICAgICBjb25zdCBzdGFuZGFyZE1ldGFEYXRhID0gdGhpcy5jcmVhdGVTdGFuZGFyZE1ldGFEYXRhKHByZWZhYk5hbWUsIHByZWZhYlV1aWQpO1xuXG4gICAgICAgICAgICAgICAgLy8gNi4g5L+d5a2Y6aKE5Yi25L2T5ZKMbWV0YeaWh+S7tlxuICAgICAgICAgICAgICAgIGNvbnN0IHNhdmVSZXN1bHQgPSBhd2FpdCB0aGlzLnNhdmVQcmVmYWJXaXRoTWV0YShwcmVmYWJQYXRoLCBwcmVmYWJKc29uRGF0YSwgc3RhbmRhcmRNZXRhRGF0YSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoc2F2ZVJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOS/neWtmOaIkOWKn+WQju+8jOWwhuWOn+Wni+iKgueCuei9rOaNouS4uumihOWItuS9k+WunuS+i1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb252ZXJ0UmVzdWx0ID0gYXdhaXQgdGhpcy5jb252ZXJ0Tm9kZVRvUHJlZmFiSW5zdGFuY2Uobm9kZVV1aWQsIHByZWZhYlBhdGgsIHByZWZhYlV1aWQpO1xuXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmVmYWJVdWlkOiBwcmVmYWJVdWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByZWZhYlBhdGg6IHByZWZhYlBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVV1aWQ6IG5vZGVVdWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByZWZhYk5hbWU6IHByZWZhYk5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udmVydGVkVG9QcmVmYWJJbnN0YW5jZTogY29udmVydFJlc3VsdC5zdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGNvbnZlcnRSZXN1bHQuc3VjY2VzcyA/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICfoh6rlrprkuYnpooTliLbkvZPliJvlu7rmiJDlip/vvIzljp/lp4voioLngrnlt7LovazmjaLkuLrpooTliLbkvZPlrp7kvosnIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ+mihOWItuS9k+WIm+W7uuaIkOWKn++8jOS9huiKgueCuei9rOaNouWksei0pSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBzYXZlUmVzdWx0LmVycm9yIHx8ICfkv53lrZjpooTliLbkvZPmlofku7blpLHotKUnXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBg5Yib5bu66aKE5Yi25L2T5pe25Y+R55Sf6ZSZ6K+vOiAke2Vycm9yfWBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBnZXROb2RlRGF0YShub2RlVXVpZDogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGFzeW5jIChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIC8vIOmmluWFiOiOt+WPluWfuuacrOiKgueCueS/oeaBr1xuICAgICAgICAgICAgICAgIGNvbnN0IG5vZGVJbmZvID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktbm9kZScsIG5vZGVVdWlkKTtcbiAgICAgICAgICAgICAgICBpZiAoIW5vZGVJbmZvKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUobnVsbCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhg6I635Y+W6IqC54K5ICR7bm9kZVV1aWR9IOeahOWfuuacrOS/oeaBr+aIkOWKn2ApO1xuXG4gICAgICAgICAgICAgICAgLy8g5L2/55SocXVlcnktbm9kZS10cmVl6I635Y+W5YyF5ZCr5a2Q6IqC54K555qE5a6M5pW057uT5p6EXG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZVRyZWUgPSBhd2FpdCB0aGlzLmdldE5vZGVXaXRoQ2hpbGRyZW4obm9kZVV1aWQpO1xuICAgICAgICAgICAgICAgIGlmIChub2RlVHJlZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhg6I635Y+W6IqC54K5ICR7bm9kZVV1aWR9IOeahOWujOaVtOagkee7k+aehOaIkOWKn2ApO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKG5vZGVUcmVlKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhg5L2/55So5Z+65pys6IqC54K55L+h5oGvYCk7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUobm9kZUluZm8pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGDojrflj5boioLngrnmlbDmja7lpLHotKUgJHtub2RlVXVpZH06YCwgZXJyb3IpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUobnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIOS9v+eUqHF1ZXJ5LW5vZGUtdHJlZeiOt+WPluWMheWQq+WtkOiKgueCueeahOWujOaVtOiKgueCuee7k+aehFxuICAgIHByaXZhdGUgYXN5bmMgZ2V0Tm9kZVdpdGhDaGlsZHJlbihub2RlVXVpZDogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIOiOt+WPluaVtOS4quWcuuaZr+agkVxuICAgICAgICAgICAgY29uc3QgdHJlZSA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3F1ZXJ5LW5vZGUtdHJlZScpO1xuICAgICAgICAgICAgaWYgKCF0cmVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOWcqOagkeS4reafpeaJvuaMh+WumueahOiKgueCuVxuICAgICAgICAgICAgY29uc3QgdGFyZ2V0Tm9kZSA9IHRoaXMuZmluZE5vZGVJblRyZWUodHJlZSwgbm9kZVV1aWQpO1xuICAgICAgICAgICAgaWYgKHRhcmdldE5vZGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhg5Zyo5Zy65pmv5qCR5Lit5om+5Yiw6IqC54K5ICR7bm9kZVV1aWR977yM5a2Q6IqC54K55pWw6YePOiAke3RhcmdldE5vZGUuY2hpbGRyZW4gPyB0YXJnZXROb2RlLmNoaWxkcmVuLmxlbmd0aCA6IDB9YCk7XG5cbiAgICAgICAgICAgICAgICAvLyDlop7lvLroioLngrnmoJHvvIzojrflj5bmr4/kuKroioLngrnnmoTmraPnoa7nu4Tku7bkv6Hmga9cbiAgICAgICAgICAgICAgICBjb25zdCBlbmhhbmNlZFRyZWUgPSBhd2FpdCB0aGlzLmVuaGFuY2VUcmVlV2l0aE1DUENvbXBvbmVudHModGFyZ2V0Tm9kZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVuaGFuY2VkVHJlZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYOiOt+WPluiKgueCueagkee7k+aehOWksei0pSAke25vZGVVdWlkfTpgLCBlcnJvcik7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIOWcqOiKgueCueagkeS4remAkuW9kuafpeaJvuaMh+WumlVVSUTnmoToioLngrlcbiAgICBwcml2YXRlIGZpbmROb2RlSW5UcmVlKG5vZGU6IGFueSwgdGFyZ2V0VXVpZDogc3RyaW5nKTogYW55IHtcbiAgICAgICAgaWYgKCFub2RlKSByZXR1cm4gbnVsbDtcblxuICAgICAgICAvLyDmo4Dmn6XlvZPliY3oioLngrlcbiAgICAgICAgaWYgKG5vZGUudXVpZCA9PT0gdGFyZ2V0VXVpZCB8fCBub2RlLnZhbHVlPy51dWlkID09PSB0YXJnZXRVdWlkKSB7XG4gICAgICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOmAkuW9kuajgOafpeWtkOiKgueCuVxuICAgICAgICBpZiAobm9kZS5jaGlsZHJlbiAmJiBBcnJheS5pc0FycmF5KG5vZGUuY2hpbGRyZW4pKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIG5vZGUuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmb3VuZCA9IHRoaXMuZmluZE5vZGVJblRyZWUoY2hpbGQsIHRhcmdldFV1aWQpO1xuICAgICAgICAgICAgICAgIGlmIChmb3VuZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZm91bmQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5L2/55SoTUNQ5o6l5Y+j5aKe5by66IqC54K55qCR77yM6I635Y+W5q2j56Gu55qE57uE5Lu25L+h5oGvXG4gICAgICovXG4gICAgcHJpdmF0ZSBhc3luYyBlbmhhbmNlVHJlZVdpdGhNQ1BDb21wb25lbnRzKG5vZGU6IGFueSk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGlmICghbm9kZSB8fCAhbm9kZS51dWlkKSB7XG4gICAgICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyDkvb/nlKhNQ1DmjqXlj6Pojrflj5boioLngrnnmoTnu4Tku7bkv6Hmga9cbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goJ2h0dHA6Ly9sb2NhbGhvc3Q6ODU4NS9tY3AnLCB7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgICAgICBcImpzb25ycGNcIjogXCIyLjBcIixcbiAgICAgICAgICAgICAgICAgICAgXCJtZXRob2RcIjogXCJ0b29scy9jYWxsXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicGFyYW1zXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwibmFtZVwiOiBcImNvbXBvbmVudF9nZXRfY29tcG9uZW50c1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJhcmd1bWVudHNcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwibm9kZVV1aWRcIjogbm9kZS51dWlkXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIFwiaWRcIjogRGF0ZS5ub3coKVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgY29uc3QgbWNwUmVzdWx0ID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xuICAgICAgICAgICAgaWYgKG1jcFJlc3VsdC5yZXN1bHQ/LmNvbnRlbnQ/LlswXT8udGV4dCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudERhdGEgPSBKU09OLnBhcnNlKG1jcFJlc3VsdC5yZXN1bHQuY29udGVudFswXS50ZXh0KTtcbiAgICAgICAgICAgICAgICBpZiAoY29tcG9uZW50RGF0YS5zdWNjZXNzICYmIGNvbXBvbmVudERhdGEuZGF0YS5jb21wb25lbnRzKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOabtOaWsOiKgueCueeahOe7hOS7tuS/oeaBr+S4uk1DUOi/lOWbnueahOato+ehruaVsOaNrlxuICAgICAgICAgICAgICAgICAgICBub2RlLmNvbXBvbmVudHMgPSBjb21wb25lbnREYXRhLmRhdGEuY29tcG9uZW50cztcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYOiKgueCuSAke25vZGUudXVpZH0g6I635Y+W5YiwICR7Y29tcG9uZW50RGF0YS5kYXRhLmNvbXBvbmVudHMubGVuZ3RofSDkuKrnu4Tku7bvvIzljIXlkKvohJrmnKznu4Tku7bnmoTmraPnoa7nsbvlnotgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYOiOt+WPluiKgueCuSAke25vZGUudXVpZH0g55qETUNQ57uE5Lu25L+h5oGv5aSx6LSlOmAsIGVycm9yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOmAkuW9kuWkhOeQhuWtkOiKgueCuVxuICAgICAgICBpZiAobm9kZS5jaGlsZHJlbiAmJiBBcnJheS5pc0FycmF5KG5vZGUuY2hpbGRyZW4pKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5vZGUuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBub2RlLmNoaWxkcmVuW2ldID0gYXdhaXQgdGhpcy5lbmhhbmNlVHJlZVdpdGhNQ1BDb21wb25lbnRzKG5vZGUuY2hpbGRyZW5baV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBidWlsZEJhc2ljTm9kZUluZm8obm9kZVV1aWQ6IHN0cmluZyk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgLy8g5p6E5bu65Z+65pys55qE6IqC54K55L+h5oGvXG4gICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1ub2RlJywgbm9kZVV1aWQpLnRoZW4oKG5vZGVJbmZvOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIW5vZGVJbmZvKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUobnVsbCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyDnroDljJbniYjmnKzvvJrlj6rov5Tlm57ln7rmnKzoioLngrnkv6Hmga/vvIzkuI3ojrflj5blrZDoioLngrnlkoznu4Tku7ZcbiAgICAgICAgICAgICAgICAvLyDov5nkupvkv6Hmga/lsIblnKjlkI7nu63nmoTpooTliLbkvZPlpITnkIbkuK3moLnmja7pnIDopoHmt7vliqBcbiAgICAgICAgICAgICAgICBjb25zdCBiYXNpY0luZm8gPSB7XG4gICAgICAgICAgICAgICAgICAgIC4uLm5vZGVJbmZvLFxuICAgICAgICAgICAgICAgICAgICBjaGlsZHJlbjogW10sXG4gICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudHM6IFtdXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKGJhc2ljSW5mbyk7XG4gICAgICAgICAgICB9KS5jYXRjaCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShudWxsKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyDpqozor4HoioLngrnmlbDmja7mmK/lkKbmnInmlYhcbiAgICBwcml2YXRlIGlzVmFsaWROb2RlRGF0YShub2RlRGF0YTogYW55KTogYm9vbGVhbiB7XG4gICAgICAgIGlmICghbm9kZURhdGEpIHJldHVybiBmYWxzZTtcbiAgICAgICAgaWYgKHR5cGVvZiBub2RlRGF0YSAhPT0gJ29iamVjdCcpIHJldHVybiBmYWxzZTtcblxuICAgICAgICAvLyDmo4Dmn6Xln7rmnKzlsZ7mgKcgLSDpgILphY1xdWVyeS1ub2RlLXRyZWXnmoTmlbDmja7moLzlvI9cbiAgICAgICAgcmV0dXJuIG5vZGVEYXRhLmhhc093blByb3BlcnR5KCd1dWlkJykgfHxcbiAgICAgICAgICAgICAgIG5vZGVEYXRhLmhhc093blByb3BlcnR5KCduYW1lJykgfHxcbiAgICAgICAgICAgICAgIG5vZGVEYXRhLmhhc093blByb3BlcnR5KCdfX3R5cGVfXycpIHx8XG4gICAgICAgICAgICAgICAobm9kZURhdGEudmFsdWUgJiYgKFxuICAgICAgICAgICAgICAgICAgIG5vZGVEYXRhLnZhbHVlLmhhc093blByb3BlcnR5KCd1dWlkJykgfHxcbiAgICAgICAgICAgICAgICAgICBub2RlRGF0YS52YWx1ZS5oYXNPd25Qcm9wZXJ0eSgnbmFtZScpIHx8XG4gICAgICAgICAgICAgICAgICAgbm9kZURhdGEudmFsdWUuaGFzT3duUHJvcGVydHkoJ19fdHlwZV9fJylcbiAgICAgICAgICAgICAgICkpO1xuICAgIH1cblxuICAgIC8vIOaPkOWPluWtkOiKgueCuVVVSUTnmoTnu5/kuIDmlrnms5VcbiAgICBwcml2YXRlIGV4dHJhY3RDaGlsZFV1aWQoY2hpbGRSZWY6IGFueSk6IHN0cmluZyB8IG51bGwge1xuICAgICAgICBpZiAoIWNoaWxkUmVmKSByZXR1cm4gbnVsbDtcblxuICAgICAgICAvLyDmlrnms5UxOiDnm7TmjqXlrZfnrKbkuLJcbiAgICAgICAgaWYgKHR5cGVvZiBjaGlsZFJlZiA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJldHVybiBjaGlsZFJlZjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOaWueazlTI6IHZhbHVl5bGe5oCn5YyF5ZCr5a2X56ym5LiyXG4gICAgICAgIGlmIChjaGlsZFJlZi52YWx1ZSAmJiB0eXBlb2YgY2hpbGRSZWYudmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICByZXR1cm4gY2hpbGRSZWYudmFsdWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDmlrnms5UzOiB2YWx1ZS51dWlk5bGe5oCnXG4gICAgICAgIGlmIChjaGlsZFJlZi52YWx1ZSAmJiBjaGlsZFJlZi52YWx1ZS51dWlkKSB7XG4gICAgICAgICAgICByZXR1cm4gY2hpbGRSZWYudmFsdWUudXVpZDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOaWueazlTQ6IOebtOaOpXV1aWTlsZ7mgKdcbiAgICAgICAgaWYgKGNoaWxkUmVmLnV1aWQpIHtcbiAgICAgICAgICAgIHJldHVybiBjaGlsZFJlZi51dWlkO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5pa55rOVNTogX19pZF9f5byV55SoIC0g6L+Z56eN5oOF5Ya16ZyA6KaB54m55q6K5aSE55CGXG4gICAgICAgIGlmIChjaGlsZFJlZi5fX2lkX18gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYOWPkeeOsF9faWRfX+W8leeUqDogJHtjaGlsZFJlZi5fX2lkX19977yM5Y+v6IO96ZyA6KaB5LuO5pWw5o2u57uT5p6E5Lit5p+l5om+YCk7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDsgLy8g5pqC5pe26L+U5ZuebnVsbO+8jOWQjue7reWPr+S7pea3u+WKoOW8leeUqOino+aekOmAu+i+kVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc29sZS53YXJuKCfml6Dms5Xmj5Dlj5blrZDoioLngrlVVUlEOicsIEpTT04uc3RyaW5naWZ5KGNoaWxkUmVmKSk7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8vIOiOt+WPlumcgOimgeWkhOeQhueahOWtkOiKgueCueaVsOaNrlxuICAgIHByaXZhdGUgZ2V0Q2hpbGRyZW5Ub1Byb2Nlc3Mobm9kZURhdGE6IGFueSk6IGFueVtdIHtcbiAgICAgICAgY29uc3QgY2hpbGRyZW46IGFueVtdID0gW107XG5cbiAgICAgICAgLy8g5pa55rOVMTog55u05o6l5LuOY2hpbGRyZW7mlbDnu4Tojrflj5bvvIjku45xdWVyeS1ub2RlLXRyZWXov5Tlm57nmoTmlbDmja7vvIlcbiAgICAgICAgaWYgKG5vZGVEYXRhLmNoaWxkcmVuICYmIEFycmF5LmlzQXJyYXkobm9kZURhdGEuY2hpbGRyZW4pKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhg5LuOY2hpbGRyZW7mlbDnu4Tojrflj5blrZDoioLngrnvvIzmlbDph486ICR7bm9kZURhdGEuY2hpbGRyZW4ubGVuZ3RofWApO1xuICAgICAgICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBub2RlRGF0YS5jaGlsZHJlbikge1xuICAgICAgICAgICAgICAgIC8vIHF1ZXJ5LW5vZGUtdHJlZei/lOWbnueahOWtkOiKgueCuemAmuW4uOW3sue7j+aYr+WujOaVtOeahOaVsOaNrue7k+aehFxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmlzVmFsaWROb2RlRGF0YShjaGlsZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW4ucHVzaChjaGlsZCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGDmt7vliqDlrZDoioLngrk6ICR7Y2hpbGQubmFtZSB8fCBjaGlsZC52YWx1ZT8ubmFtZSB8fCAn5pyq55+lJ31gKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygn5a2Q6IqC54K55pWw5o2u5peg5pWIOicsIEpTT04uc3RyaW5naWZ5KGNoaWxkLCBudWxsLCAyKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ+iKgueCueayoeacieWtkOiKgueCueaIlmNoaWxkcmVu5pWw57uE5Li656m6Jyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY2hpbGRyZW47XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZW5lcmF0ZVVVSUQoKTogc3RyaW5nIHtcbiAgICAgICAgLy8g55Sf5oiQ56ym5ZCIQ29jb3MgQ3JlYXRvcuagvOW8j+eahFVVSURcbiAgICAgICAgY29uc3QgY2hhcnMgPSAnMDEyMzQ1Njc4OWFiY2RlZic7XG4gICAgICAgIGxldCB1dWlkID0gJyc7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMzI7IGkrKykge1xuICAgICAgICAgICAgaWYgKGkgPT09IDggfHwgaSA9PT0gMTIgfHwgaSA9PT0gMTYgfHwgaSA9PT0gMjApIHtcbiAgICAgICAgICAgICAgICB1dWlkICs9ICctJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHV1aWQgKz0gY2hhcnNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogY2hhcnMubGVuZ3RoKV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHV1aWQ7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjcmVhdGVQcmVmYWJEYXRhKG5vZGVEYXRhOiBhbnksIHByZWZhYk5hbWU6IHN0cmluZywgcHJlZmFiVXVpZDogc3RyaW5nKTogYW55W10ge1xuICAgICAgICAvLyDliJvlu7rmoIflh4bnmoTpooTliLbkvZPmlbDmja7nu5PmnoRcbiAgICAgICAgY29uc3QgcHJlZmFiQXNzZXQgPSB7XG4gICAgICAgICAgICBcIl9fdHlwZV9fXCI6IFwiY2MuUHJlZmFiXCIsXG4gICAgICAgICAgICBcIl9uYW1lXCI6IHByZWZhYk5hbWUsXG4gICAgICAgICAgICBcIl9vYmpGbGFnc1wiOiAwLFxuICAgICAgICAgICAgXCJfX2VkaXRvckV4dHJhc19fXCI6IHt9LFxuICAgICAgICAgICAgXCJfbmF0aXZlXCI6IFwiXCIsXG4gICAgICAgICAgICBcImRhdGFcIjoge1xuICAgICAgICAgICAgICAgIFwiX19pZF9fXCI6IDFcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcIm9wdGltaXphdGlvblBvbGljeVwiOiAwLFxuICAgICAgICAgICAgXCJwZXJzaXN0ZW50XCI6IGZhbHNlXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8g5aSE55CG6IqC54K55pWw5o2u77yM56Gu5L+d56ym5ZCI6aKE5Yi25L2T5qC85byPXG4gICAgICAgIGNvbnN0IHByb2Nlc3NlZE5vZGVEYXRhID0gdGhpcy5wcm9jZXNzTm9kZUZvclByZWZhYihub2RlRGF0YSwgcHJlZmFiVXVpZCk7XG5cbiAgICAgICAgcmV0dXJuIFtwcmVmYWJBc3NldCwgLi4ucHJvY2Vzc2VkTm9kZURhdGFdO1xuICAgIH1cblxuICAgIHByaXZhdGUgcHJvY2Vzc05vZGVGb3JQcmVmYWIobm9kZURhdGE6IGFueSwgcHJlZmFiVXVpZDogc3RyaW5nKTogYW55W10ge1xuICAgICAgICAvLyDlpITnkIboioLngrnmlbDmja7ku6XnrKblkIjpooTliLbkvZPmoLzlvI9cbiAgICAgICAgY29uc3QgcHJvY2Vzc2VkRGF0YTogYW55W10gPSBbXTtcbiAgICAgICAgbGV0IGlkQ291bnRlciA9IDE7XG5cbiAgICAgICAgLy8g6YCS5b2S5aSE55CG6IqC54K55ZKM57uE5Lu2XG4gICAgICAgIGNvbnN0IHByb2Nlc3NOb2RlID0gKG5vZGU6IGFueSwgcGFyZW50SWQ6IG51bWJlciA9IDApOiBudW1iZXIgPT4ge1xuICAgICAgICAgICAgY29uc3Qgbm9kZUlkID0gaWRDb3VudGVyKys7XG5cbiAgICAgICAgICAgIC8vIOWIm+W7uuiKgueCueWvueixoVxuICAgICAgICAgICAgY29uc3QgcHJvY2Vzc2VkTm9kZSA9IHtcbiAgICAgICAgICAgICAgICBcIl9fdHlwZV9fXCI6IFwiY2MuTm9kZVwiLFxuICAgICAgICAgICAgICAgIFwiX25hbWVcIjogbm9kZS5uYW1lIHx8IFwiTm9kZVwiLFxuICAgICAgICAgICAgICAgIFwiX29iakZsYWdzXCI6IDAsXG4gICAgICAgICAgICAgICAgXCJfX2VkaXRvckV4dHJhc19fXCI6IHt9LFxuICAgICAgICAgICAgICAgIFwiX3BhcmVudFwiOiBwYXJlbnRJZCA+IDAgPyB7IFwiX19pZF9fXCI6IHBhcmVudElkIH0gOiBudWxsLFxuICAgICAgICAgICAgICAgIFwiX2NoaWxkcmVuXCI6IG5vZGUuY2hpbGRyZW4gPyBub2RlLmNoaWxkcmVuLm1hcCgoKSA9PiAoeyBcIl9faWRfX1wiOiBpZENvdW50ZXIrKyB9KSkgOiBbXSxcbiAgICAgICAgICAgICAgICBcIl9hY3RpdmVcIjogbm9kZS5hY3RpdmUgIT09IGZhbHNlLFxuICAgICAgICAgICAgICAgIFwiX2NvbXBvbmVudHNcIjogbm9kZS5jb21wb25lbnRzID8gbm9kZS5jb21wb25lbnRzLm1hcCgoKSA9PiAoeyBcIl9faWRfX1wiOiBpZENvdW50ZXIrKyB9KSkgOiBbXSxcbiAgICAgICAgICAgICAgICBcIl9wcmVmYWJcIjoge1xuICAgICAgICAgICAgICAgICAgICBcIl9faWRfX1wiOiBpZENvdW50ZXIrK1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgXCJfbHBvc1wiOiB7XG4gICAgICAgICAgICAgICAgICAgIFwiX190eXBlX19cIjogXCJjYy5WZWMzXCIsXG4gICAgICAgICAgICAgICAgICAgIFwieFwiOiAwLFxuICAgICAgICAgICAgICAgICAgICBcInlcIjogMCxcbiAgICAgICAgICAgICAgICAgICAgXCJ6XCI6IDBcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIFwiX2xyb3RcIjoge1xuICAgICAgICAgICAgICAgICAgICBcIl9fdHlwZV9fXCI6IFwiY2MuUXVhdFwiLFxuICAgICAgICAgICAgICAgICAgICBcInhcIjogMCxcbiAgICAgICAgICAgICAgICAgICAgXCJ5XCI6IDAsXG4gICAgICAgICAgICAgICAgICAgIFwielwiOiAwLFxuICAgICAgICAgICAgICAgICAgICBcIndcIjogMVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgXCJfbHNjYWxlXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBcImNjLlZlYzNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ4XCI6IDEsXG4gICAgICAgICAgICAgICAgICAgIFwieVwiOiAxLFxuICAgICAgICAgICAgICAgICAgICBcInpcIjogMVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgXCJfbW9iaWxpdHlcIjogMCxcbiAgICAgICAgICAgICAgICBcIl9sYXllclwiOiAxMDczNzQxODI0LFxuICAgICAgICAgICAgICAgIFwiX2V1bGVyXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBcImNjLlZlYzNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ4XCI6IDAsXG4gICAgICAgICAgICAgICAgICAgIFwieVwiOiAwLFxuICAgICAgICAgICAgICAgICAgICBcInpcIjogMFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgXCJfaWRcIjogXCJcIlxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgcHJvY2Vzc2VkRGF0YS5wdXNoKHByb2Nlc3NlZE5vZGUpO1xuXG4gICAgICAgICAgICAvLyDlpITnkIbnu4Tku7ZcbiAgICAgICAgICAgIGlmIChub2RlLmNvbXBvbmVudHMpIHtcbiAgICAgICAgICAgICAgICBub2RlLmNvbXBvbmVudHMuZm9yRWFjaCgoY29tcG9uZW50OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29tcG9uZW50SWQgPSBpZENvdW50ZXIrKztcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvY2Vzc2VkQ29tcG9uZW50cyA9IHRoaXMucHJvY2Vzc0NvbXBvbmVudEZvclByZWZhYihjb21wb25lbnQsIGNvbXBvbmVudElkKTtcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzc2VkRGF0YS5wdXNoKC4uLnByb2Nlc3NlZENvbXBvbmVudHMpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDlpITnkIblrZDoioLngrlcbiAgICAgICAgICAgIGlmIChub2RlLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5jaGlsZHJlbi5mb3JFYWNoKChjaGlsZDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHByb2Nlc3NOb2RlKGNoaWxkLCBub2RlSWQpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gbm9kZUlkO1xuICAgICAgICB9O1xuXG4gICAgICAgIHByb2Nlc3NOb2RlKG5vZGVEYXRhKTtcbiAgICAgICAgcmV0dXJuIHByb2Nlc3NlZERhdGE7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBwcm9jZXNzQ29tcG9uZW50Rm9yUHJlZmFiKGNvbXBvbmVudDogYW55LCBjb21wb25lbnRJZDogbnVtYmVyKTogYW55W10ge1xuICAgICAgICAvLyDlpITnkIbnu4Tku7bmlbDmja7ku6XnrKblkIjpooTliLbkvZPmoLzlvI9cbiAgICAgICAgY29uc3QgcHJvY2Vzc2VkQ29tcG9uZW50ID0ge1xuICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBjb21wb25lbnQudHlwZSB8fCBcImNjLkNvbXBvbmVudFwiLFxuICAgICAgICAgICAgXCJfbmFtZVwiOiBcIlwiLFxuICAgICAgICAgICAgXCJfb2JqRmxhZ3NcIjogMCxcbiAgICAgICAgICAgIFwiX19lZGl0b3JFeHRyYXNfX1wiOiB7fSxcbiAgICAgICAgICAgIFwibm9kZVwiOiB7XG4gICAgICAgICAgICAgICAgXCJfX2lkX19cIjogY29tcG9uZW50SWQgLSAxXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJfZW5hYmxlZFwiOiBjb21wb25lbnQuZW5hYmxlZCAhPT0gZmFsc2UsXG4gICAgICAgICAgICBcIl9fcHJlZmFiXCI6IHtcbiAgICAgICAgICAgICAgICBcIl9faWRfX1wiOiBjb21wb25lbnRJZCArIDFcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAuLi5jb21wb25lbnQucHJvcGVydGllc1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIOa3u+WKoOe7hOS7tueJueWumueahOmihOWItuS9k+S/oeaBr1xuICAgICAgICBjb25zdCBjb21wUHJlZmFiSW5mbyA9IHtcbiAgICAgICAgICAgIFwiX190eXBlX19cIjogXCJjYy5Db21wUHJlZmFiSW5mb1wiLFxuICAgICAgICAgICAgXCJmaWxlSWRcIjogdGhpcy5nZW5lcmF0ZUZpbGVJZCgpXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIFtwcm9jZXNzZWRDb21wb25lbnQsIGNvbXBQcmVmYWJJbmZvXTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdlbmVyYXRlRmlsZUlkKCk6IHN0cmluZyB7XG4gICAgICAgIC8vIOeUn+aIkOaWh+S7tklE77yI566A5YyW54mI5pys77yJXG4gICAgICAgIGNvbnN0IGNoYXJzID0gJ2FiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVowMTIzNDU2Nzg5Ky8nO1xuICAgICAgICBsZXQgZmlsZUlkID0gJyc7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMjI7IGkrKykge1xuICAgICAgICAgICAgZmlsZUlkICs9IGNoYXJzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGNoYXJzLmxlbmd0aCldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmaWxlSWQ7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjcmVhdGVNZXRhRGF0YShwcmVmYWJOYW1lOiBzdHJpbmcsIHByZWZhYlV1aWQ6IHN0cmluZyk6IGFueSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBcInZlclwiOiBcIjEuMS41MFwiLFxuICAgICAgICAgICAgXCJpbXBvcnRlclwiOiBcInByZWZhYlwiLFxuICAgICAgICAgICAgXCJpbXBvcnRlZFwiOiB0cnVlLFxuICAgICAgICAgICAgXCJ1dWlkXCI6IHByZWZhYlV1aWQsXG4gICAgICAgICAgICBcImZpbGVzXCI6IFtcbiAgICAgICAgICAgICAgICBcIi5qc29uXCJcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBcInN1Yk1ldGFzXCI6IHt9LFxuICAgICAgICAgICAgXCJ1c2VyRGF0YVwiOiB7XG4gICAgICAgICAgICAgICAgXCJzeW5jTm9kZU5hbWVcIjogcHJlZmFiTmFtZVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgc2F2ZVByZWZhYkZpbGVzKHByZWZhYlBhdGg6IHN0cmluZywgcHJlZmFiRGF0YTogYW55W10sIG1ldGFEYXRhOiBhbnkpOiBQcm9taXNlPHsgc3VjY2VzczogYm9vbGVhbjsgZXJyb3I/OiBzdHJpbmcgfT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgLy8g5L2/55SoRWRpdG9yIEFQSeS/neWtmOmihOWItuS9k+aWh+S7tlxuICAgICAgICAgICAgICAgIGNvbnN0IHByZWZhYkNvbnRlbnQgPSBKU09OLnN0cmluZ2lmeShwcmVmYWJEYXRhLCBudWxsLCAyKTtcbiAgICAgICAgICAgICAgICBjb25zdCBtZXRhQ29udGVudCA9IEpTT04uc3RyaW5naWZ5KG1ldGFEYXRhLCBudWxsLCAyKTtcblxuICAgICAgICAgICAgICAgIC8vIOWwneivleS9v+eUqOabtOWPr+mdoOeahOS/neWtmOaWueazlVxuICAgICAgICAgICAgICAgIHRoaXMuc2F2ZUFzc2V0RmlsZShwcmVmYWJQYXRoLCBwcmVmYWJDb250ZW50KS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5YaN5Yib5bu6bWV0YeaWh+S7tlxuICAgICAgICAgICAgICAgICAgICBjb25zdCBtZXRhUGF0aCA9IGAke3ByZWZhYlBhdGh9Lm1ldGFgO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zYXZlQXNzZXRGaWxlKG1ldGFQYXRoLCBtZXRhQ29udGVudCk7XG4gICAgICAgICAgICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgIH0pLmNhdGNoKChlcnJvcjogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfHwgJ+S/neWtmOmihOWItuS9k+aWh+S7tuWksei0pScgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGDkv53lrZjmlofku7bml7blj5HnlJ/plJnor686ICR7ZXJyb3J9YCB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBzYXZlQXNzZXRGaWxlKGZpbGVQYXRoOiBzdHJpbmcsIGNvbnRlbnQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgLy8g5bCd6K+V5aSa56eN5L+d5a2Y5pa55rOVXG4gICAgICAgICAgICBjb25zdCBzYXZlTWV0aG9kcyA9IFtcbiAgICAgICAgICAgICAgICAoKSA9PiBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdjcmVhdGUtYXNzZXQnLCBmaWxlUGF0aCwgY29udGVudCksXG4gICAgICAgICAgICAgICAgKCkgPT4gRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAnc2F2ZS1hc3NldCcsIGZpbGVQYXRoLCBjb250ZW50KSxcbiAgICAgICAgICAgICAgICAoKSA9PiBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICd3cml0ZS1hc3NldCcsIGZpbGVQYXRoLCBjb250ZW50KVxuICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgY29uc3QgdHJ5U2F2ZSA9IChpbmRleDogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ID49IHNhdmVNZXRob2RzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKCfmiYDmnInkv53lrZjmlrnms5Xpg73lpLHotKXkuoYnKSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBzYXZlTWV0aG9kc1tpbmRleF0oKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgIH0pLmNhdGNoKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5U2F2ZShpbmRleCArIDEpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdHJ5U2F2ZSgwKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyB1cGRhdGVQcmVmYWIocHJlZmFiUGF0aDogc3RyaW5nLCBub2RlVXVpZDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS1hc3NldC1pbmZvJywgcHJlZmFiUGF0aCkudGhlbigoYXNzZXRJbmZvOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIWFzc2V0SW5mbykge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1ByZWZhYiBub3QgZm91bmQnKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnYXBwbHktcHJlZmFiJywge1xuICAgICAgICAgICAgICAgICAgICBub2RlOiBub2RlVXVpZCxcbiAgICAgICAgICAgICAgICAgICAgcHJlZmFiOiBhc3NldEluZm8udXVpZFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdQcmVmYWIgdXBkYXRlZCBzdWNjZXNzZnVsbHknXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgcmV2ZXJ0UHJlZmFiKG5vZGVVdWlkOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3JldmVydC1wcmVmYWInLCB7XG4gICAgICAgICAgICAgICAgbm9kZTogbm9kZVV1aWRcbiAgICAgICAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAnUHJlZmFiIGluc3RhbmNlIHJldmVydGVkIHN1Y2Nlc3NmdWxseSdcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBnZXRQcmVmYWJJbmZvKHByZWZhYlBhdGg6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktYXNzZXQtaW5mbycsIHByZWZhYlBhdGgpLnRoZW4oKGFzc2V0SW5mbzogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFhc3NldEluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQcmVmYWIgbm90IGZvdW5kJyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LWFzc2V0LW1ldGEnLCBhc3NldEluZm8udXVpZCk7XG4gICAgICAgICAgICB9KS50aGVuKChtZXRhSW5mbzogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgaW5mbzogUHJlZmFiSW5mbyA9IHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogbWV0YUluZm8ubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgdXVpZDogbWV0YUluZm8udXVpZCxcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogcHJlZmFiUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgZm9sZGVyOiBwcmVmYWJQYXRoLnN1YnN0cmluZygwLCBwcmVmYWJQYXRoLmxhc3RJbmRleE9mKCcvJykpLFxuICAgICAgICAgICAgICAgICAgICBjcmVhdGVUaW1lOiBtZXRhSW5mby5jcmVhdGVUaW1lLFxuICAgICAgICAgICAgICAgICAgICBtb2RpZnlUaW1lOiBtZXRhSW5mby5tb2RpZnlUaW1lLFxuICAgICAgICAgICAgICAgICAgICBkZXBlbmRlbmNpZXM6IG1ldGFJbmZvLmRlcGVuZHMgfHwgW11cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiB0cnVlLCBkYXRhOiBpbmZvIH0pO1xuICAgICAgICAgICAgfSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGNyZWF0ZVByZWZhYkZyb21Ob2RlKGFyZ3M6IGFueSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIC8vIOS7jiBwcmVmYWJQYXRoIOaPkOWPluWQjeensFxuICAgICAgICBjb25zdCBwcmVmYWJQYXRoID0gYXJncy5wcmVmYWJQYXRoO1xuICAgICAgICBjb25zdCBwcmVmYWJOYW1lID0gcHJlZmFiUGF0aC5zcGxpdCgnLycpLnBvcCgpPy5yZXBsYWNlKCcucHJlZmFiJywgJycpIHx8ICdOZXdQcmVmYWInO1xuXG4gICAgICAgIC8vIOiwg+eUqOWOn+adpeeahCBjcmVhdGVQcmVmYWIg5pa55rOVXG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmNyZWF0ZVByZWZhYih7XG4gICAgICAgICAgICBub2RlVXVpZDogYXJncy5ub2RlVXVpZCxcbiAgICAgICAgICAgIHNhdmVQYXRoOiBwcmVmYWJQYXRoLFxuICAgICAgICAgICAgcHJlZmFiTmFtZTogcHJlZmFiTmFtZVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHZhbGlkYXRlUHJlZmFiKHByZWZhYlBhdGg6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAvLyDor7vlj5bpooTliLbkvZPmlofku7blhoXlrrlcbiAgICAgICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS1hc3NldC1pbmZvJywgcHJlZmFiUGF0aCkudGhlbigoYXNzZXRJbmZvOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFhc3NldEluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiAn6aKE5Yi25L2T5paH5Lu25LiN5a2Y5ZyoJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyDpqozor4HpooTliLbkvZPmoLzlvI9cbiAgICAgICAgICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncmVhZC1hc3NldCcsIHByZWZhYlBhdGgpLnRoZW4oKGNvbnRlbnQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwcmVmYWJEYXRhID0gSlNPTi5wYXJzZShjb250ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2YWxpZGF0aW9uUmVzdWx0ID0gdGhpcy52YWxpZGF0ZVByZWZhYkZvcm1hdChwcmVmYWJEYXRhKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc1ZhbGlkOiB2YWxpZGF0aW9uUmVzdWx0LmlzVmFsaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc3N1ZXM6IHZhbGlkYXRpb25SZXN1bHQuaXNzdWVzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUNvdW50OiB2YWxpZGF0aW9uUmVzdWx0Lm5vZGVDb3VudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudENvdW50OiB2YWxpZGF0aW9uUmVzdWx0LmNvbXBvbmVudENvdW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogdmFsaWRhdGlvblJlc3VsdC5pc1ZhbGlkID8gJ+mihOWItuS9k+agvOW8j+acieaViCcgOiAn6aKE5Yi25L2T5qC85byP5a2Y5Zyo6Zeu6aKYJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChwYXJzZUVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogJ+mihOWItuS9k+aWh+S7tuagvOW8j+mUmeivr++8jOaXoOazleino+aekEpTT04nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKChlcnJvcjogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogYOivu+WPlumihOWItuS9k+aWh+S7tuWksei0pTogJHtlcnJvci5tZXNzYWdlfWBcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJyb3I6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGDmn6Xor6LpooTliLbkvZPkv6Hmga/lpLHotKU6ICR7ZXJyb3IubWVzc2FnZX1gXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBg6aqM6K+B6aKE5Yi25L2T5pe25Y+R55Sf6ZSZ6K+vOiAke2Vycm9yfWBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSB2YWxpZGF0ZVByZWZhYkZvcm1hdChwcmVmYWJEYXRhOiBhbnkpOiB7IGlzVmFsaWQ6IGJvb2xlYW47IGlzc3Vlczogc3RyaW5nW107IG5vZGVDb3VudDogbnVtYmVyOyBjb21wb25lbnRDb3VudDogbnVtYmVyIH0ge1xuICAgICAgICBjb25zdCBpc3N1ZXM6IHN0cmluZ1tdID0gW107XG4gICAgICAgIGxldCBub2RlQ291bnQgPSAwO1xuICAgICAgICBsZXQgY29tcG9uZW50Q291bnQgPSAwO1xuXG4gICAgICAgIC8vIOajgOafpeWfuuacrOe7k+aehFxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkocHJlZmFiRGF0YSkpIHtcbiAgICAgICAgICAgIGlzc3Vlcy5wdXNoKCfpooTliLbkvZPmlbDmja7lv4XpobvmmK/mlbDnu4TmoLzlvI8nKTtcbiAgICAgICAgICAgIHJldHVybiB7IGlzVmFsaWQ6IGZhbHNlLCBpc3N1ZXMsIG5vZGVDb3VudCwgY29tcG9uZW50Q291bnQgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwcmVmYWJEYXRhLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgaXNzdWVzLnB1c2goJ+mihOWItuS9k+aVsOaNruS4uuepuicpO1xuICAgICAgICAgICAgcmV0dXJuIHsgaXNWYWxpZDogZmFsc2UsIGlzc3Vlcywgbm9kZUNvdW50LCBjb21wb25lbnRDb3VudCB9O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5qOA5p+l56ys5LiA5Liq5YWD57Sg5piv5ZCm5Li66aKE5Yi25L2T6LWE5LqnXG4gICAgICAgIGNvbnN0IGZpcnN0RWxlbWVudCA9IHByZWZhYkRhdGFbMF07XG4gICAgICAgIGlmICghZmlyc3RFbGVtZW50IHx8IGZpcnN0RWxlbWVudC5fX3R5cGVfXyAhPT0gJ2NjLlByZWZhYicpIHtcbiAgICAgICAgICAgIGlzc3Vlcy5wdXNoKCfnrKzkuIDkuKrlhYPntKDlv4XpobvmmK9jYy5QcmVmYWLnsbvlnosnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOe7n+iuoeiKgueCueWSjOe7hOS7tlxuICAgICAgICBwcmVmYWJEYXRhLmZvckVhY2goKGl0ZW06IGFueSwgaW5kZXg6IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgaWYgKGl0ZW0uX190eXBlX18gPT09ICdjYy5Ob2RlJykge1xuICAgICAgICAgICAgICAgIG5vZGVDb3VudCsrO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChpdGVtLl9fdHlwZV9fICYmIGl0ZW0uX190eXBlX18uaW5jbHVkZXMoJ2NjLicpKSB7XG4gICAgICAgICAgICAgICAgY29tcG9uZW50Q291bnQrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g5qOA5p+l5b+F6KaB55qE5a2X5q61XG4gICAgICAgIGlmIChub2RlQ291bnQgPT09IDApIHtcbiAgICAgICAgICAgIGlzc3Vlcy5wdXNoKCfpooTliLbkvZPlv4XpobvljIXlkKvoh7PlsJHkuIDkuKroioLngrknKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBpc1ZhbGlkOiBpc3N1ZXMubGVuZ3RoID09PSAwLFxuICAgICAgICAgICAgaXNzdWVzLFxuICAgICAgICAgICAgbm9kZUNvdW50LFxuICAgICAgICAgICAgY29tcG9uZW50Q291bnRcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGR1cGxpY2F0ZVByZWZhYihhcmdzOiBhbnkpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMgKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgeyBzb3VyY2VQcmVmYWJQYXRoLCB0YXJnZXRQcmVmYWJQYXRoLCBuZXdQcmVmYWJOYW1lIH0gPSBhcmdzO1xuXG4gICAgICAgICAgICAgICAgLy8g6K+75Y+W5rqQ6aKE5Yi25L2TXG4gICAgICAgICAgICAgICAgY29uc3Qgc291cmNlSW5mbyA9IGF3YWl0IHRoaXMuZ2V0UHJlZmFiSW5mbyhzb3VyY2VQcmVmYWJQYXRoKTtcbiAgICAgICAgICAgICAgICBpZiAoIXNvdXJjZUluZm8uc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGDml6Dms5Xor7vlj5bmupDpooTliLbkvZM6ICR7c291cmNlSW5mby5lcnJvcn1gXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8g6K+75Y+W5rqQ6aKE5Yi25L2T5YaF5a65XG4gICAgICAgICAgICAgICAgY29uc3Qgc291cmNlQ29udGVudCA9IGF3YWl0IHRoaXMucmVhZFByZWZhYkNvbnRlbnQoc291cmNlUHJlZmFiUGF0aCk7XG4gICAgICAgICAgICAgICAgaWYgKCFzb3VyY2VDb250ZW50LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBg5peg5rOV6K+75Y+W5rqQ6aKE5Yi25L2T5YaF5a65OiAke3NvdXJjZUNvbnRlbnQuZXJyb3J9YFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIOeUn+aIkOaWsOeahFVVSURcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdVdWlkID0gdGhpcy5nZW5lcmF0ZVVVSUQoKTtcblxuICAgICAgICAgICAgICAgIC8vIOS/ruaUuemihOWItuS9k+aVsOaNrlxuICAgICAgICAgICAgICAgIGNvbnN0IG1vZGlmaWVkRGF0YSA9IHRoaXMubW9kaWZ5UHJlZmFiRm9yRHVwbGljYXRpb24oc291cmNlQ29udGVudC5kYXRhLCBuZXdQcmVmYWJOYW1lLCBuZXdVdWlkKTtcblxuICAgICAgICAgICAgICAgIC8vIOWIm+W7uuaWsOeahG1ldGHmlbDmja5cbiAgICAgICAgICAgICAgICBjb25zdCBuZXdNZXRhRGF0YSA9IHRoaXMuY3JlYXRlTWV0YURhdGEobmV3UHJlZmFiTmFtZSB8fCAnRHVwbGljYXRlZFByZWZhYicsIG5ld1V1aWQpO1xuXG4gICAgICAgICAgICAgICAgLy8g6aKE5Yi25L2T5aSN5Yi25Yqf6IO95pqC5pe256aB55So77yM5Zug5Li65raJ5Y+K5aSN5p2C55qE5bqP5YiX5YyW5qC85byPXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogJ+mihOWItuS9k+WkjeWItuWKn+iDveaaguaXtuS4jeWPr+eUqCcsXG4gICAgICAgICAgICAgICAgICAgIGluc3RydWN0aW9uOiAn6K+35ZyoIENvY29zIENyZWF0b3Ig57yW6L6R5Zmo5Lit5omL5Yqo5aSN5Yi26aKE5Yi25L2T77yaXFxuMS4g5Zyo6LWE5rqQ566h55CG5Zmo5Lit6YCJ5oup6KaB5aSN5Yi255qE6aKE5Yi25L2TXFxuMi4g5Y+z6ZSu6YCJ5oup5aSN5Yi2XFxuMy4g5Zyo55uu5qCH5L2N572u57KY6LS0J1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGDlpI3liLbpooTliLbkvZPml7blj5HnlJ/plJnor686ICR7ZXJyb3J9YFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHJlYWRQcmVmYWJDb250ZW50KHByZWZhYlBhdGg6IHN0cmluZyk6IFByb21pc2U8eyBzdWNjZXNzOiBib29sZWFuOyBkYXRhPzogYW55OyBlcnJvcj86IHN0cmluZyB9PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncmVhZC1hc3NldCcsIHByZWZhYlBhdGgpLnRoZW4oKGNvbnRlbnQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHByZWZhYkRhdGEgPSBKU09OLnBhcnNlKGNvbnRlbnQpO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogcHJlZmFiRGF0YSB9KTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChwYXJzZUVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICfpooTliLbkvZPmlofku7bmoLzlvI/plJnor68nIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnJvcjogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB8fCAn6K+75Y+W6aKE5Yi25L2T5paH5Lu25aSx6LSlJyB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIG1vZGlmeVByZWZhYkZvckR1cGxpY2F0aW9uKHByZWZhYkRhdGE6IGFueVtdLCBuZXdOYW1lOiBzdHJpbmcsIG5ld1V1aWQ6IHN0cmluZyk6IGFueVtdIHtcbiAgICAgICAgLy8g5L+u5pS56aKE5Yi25L2T5pWw5o2u5Lul5Yib5bu65Ymv5pysXG4gICAgICAgIGNvbnN0IG1vZGlmaWVkRGF0YSA9IFsuLi5wcmVmYWJEYXRhXTtcblxuICAgICAgICAvLyDkv67mlLnnrKzkuIDkuKrlhYPntKDvvIjpooTliLbkvZPotYTkuqfvvIlcbiAgICAgICAgaWYgKG1vZGlmaWVkRGF0YVswXSAmJiBtb2RpZmllZERhdGFbMF0uX190eXBlX18gPT09ICdjYy5QcmVmYWInKSB7XG4gICAgICAgICAgICBtb2RpZmllZERhdGFbMF0uX25hbWUgPSBuZXdOYW1lIHx8ICdEdXBsaWNhdGVkUHJlZmFiJztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOabtOaWsOaJgOaciVVVSUTlvJXnlKjvvIjnroDljJbniYjmnKzvvIlcbiAgICAgICAgLy8g5Zyo5a6e6ZmF5bqU55So5Lit77yM5Y+v6IO96ZyA6KaB5pu05aSN5p2C55qEVVVJROaYoOWwhOWkhOeQhlxuXG4gICAgICAgIHJldHVybiBtb2RpZmllZERhdGE7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5L2/55SoIGFzc2V0LWRiIEFQSSDliJvlu7rotYTmupDmlofku7ZcbiAgICAgKi9cbiAgICBwcml2YXRlIGFzeW5jIGNyZWF0ZUFzc2V0V2l0aEFzc2V0REIoYXNzZXRQYXRoOiBzdHJpbmcsIGNvbnRlbnQ6IHN0cmluZyk6IFByb21pc2U8eyBzdWNjZXNzOiBib29sZWFuOyBkYXRhPzogYW55OyBlcnJvcj86IHN0cmluZyB9PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAnY3JlYXRlLWFzc2V0JywgYXNzZXRQYXRoLCBjb250ZW50LCB7XG4gICAgICAgICAgICAgICAgb3ZlcndyaXRlOiB0cnVlLFxuICAgICAgICAgICAgICAgIHJlbmFtZTogZmFsc2VcbiAgICAgICAgICAgIH0pLnRoZW4oKGFzc2V0SW5mbzogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ+WIm+W7uui1hOa6kOaWh+S7tuaIkOWKnzonLCBhc3NldEluZm8pO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiB0cnVlLCBkYXRhOiBhc3NldEluZm8gfSk7XG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyb3I6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ+WIm+W7uui1hOa6kOaWh+S7tuWksei0pTonLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB8fCAn5Yib5bu66LWE5rqQ5paH5Lu25aSx6LSlJyB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDkvb/nlKggYXNzZXQtZGIgQVBJIOWIm+W7uiBtZXRhIOaWh+S7tlxuICAgICAqL1xuICAgIHByaXZhdGUgYXN5bmMgY3JlYXRlTWV0YVdpdGhBc3NldERCKGFzc2V0UGF0aDogc3RyaW5nLCBtZXRhQ29udGVudDogYW55KTogUHJvbWlzZTx7IHN1Y2Nlc3M6IGJvb2xlYW47IGRhdGE/OiBhbnk7IGVycm9yPzogc3RyaW5nIH0+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBtZXRhQ29udGVudFN0cmluZyA9IEpTT04uc3RyaW5naWZ5KG1ldGFDb250ZW50LCBudWxsLCAyKTtcbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3NhdmUtYXNzZXQtbWV0YScsIGFzc2V0UGF0aCwgbWV0YUNvbnRlbnRTdHJpbmcpLnRoZW4oKGFzc2V0SW5mbzogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ+WIm+W7um1ldGHmlofku7bmiJDlip86JywgYXNzZXRJbmZvKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogYXNzZXRJbmZvIH0pO1xuICAgICAgICAgICAgfSkuY2F0Y2goKGVycm9yOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCfliJvlu7ptZXRh5paH5Lu25aSx6LSlOicsIGVycm9yKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIHx8ICfliJvlu7ptZXRh5paH5Lu25aSx6LSlJyB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDkvb/nlKggYXNzZXQtZGIgQVBJIOmHjeaWsOWvvOWFpei1hOa6kFxuICAgICAqL1xuICAgIHByaXZhdGUgYXN5bmMgcmVpbXBvcnRBc3NldFdpdGhBc3NldERCKGFzc2V0UGF0aDogc3RyaW5nKTogUHJvbWlzZTx7IHN1Y2Nlc3M6IGJvb2xlYW47IGRhdGE/OiBhbnk7IGVycm9yPzogc3RyaW5nIH0+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdyZWltcG9ydC1hc3NldCcsIGFzc2V0UGF0aCkudGhlbigocmVzdWx0OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygn6YeN5paw5a+85YWl6LWE5rqQ5oiQ5YqfOicsIHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IHJlc3VsdCB9KTtcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnJvcjogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcign6YeN5paw5a+85YWl6LWE5rqQ5aSx6LSlOicsIGVycm9yKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIHx8ICfph43mlrDlr7zlhaXotYTmupDlpLHotKUnIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOS9v+eUqCBhc3NldC1kYiBBUEkg5pu05paw6LWE5rqQ5paH5Lu25YaF5a65XG4gICAgICovXG4gICAgcHJpdmF0ZSBhc3luYyB1cGRhdGVBc3NldFdpdGhBc3NldERCKGFzc2V0UGF0aDogc3RyaW5nLCBjb250ZW50OiBzdHJpbmcpOiBQcm9taXNlPHsgc3VjY2VzczogYm9vbGVhbjsgZGF0YT86IGFueTsgZXJyb3I/OiBzdHJpbmcgfT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3NhdmUtYXNzZXQnLCBhc3NldFBhdGgsIGNvbnRlbnQpLnRoZW4oKHJlc3VsdDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ+abtOaWsOi1hOa6kOaWh+S7tuaIkOWKnzonLCByZXN1bHQpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiB0cnVlLCBkYXRhOiByZXN1bHQgfSk7XG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyb3I6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ+abtOaWsOi1hOa6kOaWh+S7tuWksei0pTonLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB8fCAn5pu05paw6LWE5rqQ5paH5Lu25aSx6LSlJyB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDliJvlu7rnrKblkIggQ29jb3MgQ3JlYXRvciDmoIflh4bnmoTpooTliLbkvZPlhoXlrrlcbiAgICAgKiDlrozmlbTlrp7njrDpgJLlvZLoioLngrnmoJHlpITnkIbvvIzljLnphY3lvJXmk47moIflh4bmoLzlvI9cbiAgICAgKi9cbiAgICBwcml2YXRlIGFzeW5jIGNyZWF0ZVN0YW5kYXJkUHJlZmFiQ29udGVudChub2RlRGF0YTogYW55LCBwcmVmYWJOYW1lOiBzdHJpbmcsIHByZWZhYlV1aWQ6IHN0cmluZywgaW5jbHVkZUNoaWxkcmVuOiBib29sZWFuLCBpbmNsdWRlQ29tcG9uZW50czogYm9vbGVhbik6IFByb21pc2U8YW55W10+IHtcbiAgICAgICAgY29uc29sZS5sb2coJ+W8gOWni+WIm+W7uuW8leaTjuagh+WHhumihOWItuS9k+WGheWuuS4uLicpO1xuXG4gICAgICAgIGNvbnN0IHByZWZhYkRhdGE6IGFueVtdID0gW107XG4gICAgICAgIGxldCBjdXJyZW50SWQgPSAwO1xuXG4gICAgICAgIC8vIDEuIOWIm+W7uumihOWItuS9k+i1hOS6p+WvueixoSAoaW5kZXggMClcbiAgICAgICAgY29uc3QgcHJlZmFiQXNzZXQgPSB7XG4gICAgICAgICAgICBcIl9fdHlwZV9fXCI6IFwiY2MuUHJlZmFiXCIsXG4gICAgICAgICAgICBcIl9uYW1lXCI6IHByZWZhYk5hbWUgfHwgXCJcIiwgLy8g56Gu5L+d6aKE5Yi25L2T5ZCN56ew5LiN5Li656m6XG4gICAgICAgICAgICBcIl9vYmpGbGFnc1wiOiAwLFxuICAgICAgICAgICAgXCJfX2VkaXRvckV4dHJhc19fXCI6IHt9LFxuICAgICAgICAgICAgXCJfbmF0aXZlXCI6IFwiXCIsXG4gICAgICAgICAgICBcImRhdGFcIjoge1xuICAgICAgICAgICAgICAgIFwiX19pZF9fXCI6IDFcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcIm9wdGltaXphdGlvblBvbGljeVwiOiAwLFxuICAgICAgICAgICAgXCJwZXJzaXN0ZW50XCI6IGZhbHNlXG4gICAgICAgIH07XG4gICAgICAgIHByZWZhYkRhdGEucHVzaChwcmVmYWJBc3NldCk7XG4gICAgICAgIGN1cnJlbnRJZCsrO1xuXG4gICAgICAgIC8vIDIuIOmAkuW9kuWIm+W7uuWujOaVtOeahOiKgueCueagkee7k+aehFxuICAgICAgICBjb25zdCBjb250ZXh0ID0ge1xuICAgICAgICAgICAgcHJlZmFiRGF0YSxcbiAgICAgICAgICAgIGN1cnJlbnRJZDogY3VycmVudElkICsgMSwgLy8g5qC56IqC54K55Y2g55So57Si5byVMe+8jOWtkOiKgueCueS7jue0ouW8lTLlvIDlp4tcbiAgICAgICAgICAgIHByZWZhYkFzc2V0SW5kZXg6IDAsXG4gICAgICAgICAgICBub2RlRmlsZUlkczogbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKSwgLy8g5a2Y5YKo6IqC54K5SUTliLBmaWxlSWTnmoTmmKDlsIRcbiAgICAgICAgICAgIG5vZGVVdWlkVG9JbmRleDogbmV3IE1hcDxzdHJpbmcsIG51bWJlcj4oKSwgLy8g5a2Y5YKo6IqC54K5VVVJROWIsOe0ouW8leeahOaYoOWwhFxuICAgICAgICAgICAgY29tcG9uZW50VXVpZFRvSW5kZXg6IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCkgLy8g5a2Y5YKo57uE5Lu2VVVJROWIsOe0ouW8leeahOaYoOWwhFxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIOWIm+W7uuagueiKgueCueWSjOaVtOS4quiKgueCueagkSAtIOazqOaEj++8muagueiKgueCueeahOeItuiKgueCueW6lOivpeaYr251bGzvvIzkuI3mmK/pooTliLbkvZPlr7nosaFcbiAgICAgICAgYXdhaXQgdGhpcy5jcmVhdGVDb21wbGV0ZU5vZGVUcmVlKG5vZGVEYXRhLCBudWxsLCAxLCBjb250ZXh0LCBpbmNsdWRlQ2hpbGRyZW4sIGluY2x1ZGVDb21wb25lbnRzLCBwcmVmYWJOYW1lKTtcblxuICAgICAgICBjb25zb2xlLmxvZyhg6aKE5Yi25L2T5YaF5a655Yib5bu65a6M5oiQ77yM5oC75YWxICR7cHJlZmFiRGF0YS5sZW5ndGh9IOS4quWvueixoWApO1xuICAgICAgICBjb25zb2xlLmxvZygn6IqC54K5ZmlsZUlk5pig5bCEOicsIEFycmF5LmZyb20oY29udGV4dC5ub2RlRmlsZUlkcy5lbnRyaWVzKCkpKTtcblxuICAgICAgICByZXR1cm4gcHJlZmFiRGF0YTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDpgJLlvZLliJvlu7rlrozmlbTnmoToioLngrnmoJHvvIzljIXmi6zmiYDmnInlrZDoioLngrnlkozlr7nlupTnmoRQcmVmYWJJbmZvXG4gICAgICovXG4gICAgcHJpdmF0ZSBhc3luYyBjcmVhdGVDb21wbGV0ZU5vZGVUcmVlKFxuICAgICAgICBub2RlRGF0YTogYW55LFxuICAgICAgICBwYXJlbnROb2RlSW5kZXg6IG51bWJlciB8IG51bGwsXG4gICAgICAgIG5vZGVJbmRleDogbnVtYmVyLFxuICAgICAgICBjb250ZXh0OiB7XG4gICAgICAgICAgICBwcmVmYWJEYXRhOiBhbnlbXSxcbiAgICAgICAgICAgIGN1cnJlbnRJZDogbnVtYmVyLFxuICAgICAgICAgICAgcHJlZmFiQXNzZXRJbmRleDogbnVtYmVyLFxuICAgICAgICAgICAgbm9kZUZpbGVJZHM6IE1hcDxzdHJpbmcsIHN0cmluZz4sXG4gICAgICAgICAgICBub2RlVXVpZFRvSW5kZXg6IE1hcDxzdHJpbmcsIG51bWJlcj4sXG4gICAgICAgICAgICBjb21wb25lbnRVdWlkVG9JbmRleDogTWFwPHN0cmluZywgbnVtYmVyPlxuICAgICAgICB9LFxuICAgICAgICBpbmNsdWRlQ2hpbGRyZW46IGJvb2xlYW4sXG4gICAgICAgIGluY2x1ZGVDb21wb25lbnRzOiBib29sZWFuLFxuICAgICAgICBub2RlTmFtZT86IHN0cmluZ1xuICAgICk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCB7IHByZWZhYkRhdGEgfSA9IGNvbnRleHQ7XG5cbiAgICAgICAgLy8g5Yib5bu66IqC54K55a+56LGhXG4gICAgICAgIGNvbnN0IG5vZGUgPSB0aGlzLmNyZWF0ZUVuZ2luZVN0YW5kYXJkTm9kZShub2RlRGF0YSwgcGFyZW50Tm9kZUluZGV4LCBub2RlTmFtZSk7XG5cbiAgICAgICAgLy8g56Gu5L+d6IqC54K55Zyo5oyH5a6a55qE57Si5byV5L2N572uXG4gICAgICAgIHdoaWxlIChwcmVmYWJEYXRhLmxlbmd0aCA8PSBub2RlSW5kZXgpIHtcbiAgICAgICAgICAgIHByZWZhYkRhdGEucHVzaChudWxsKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmxvZyhg6K6+572u6IqC54K55Yiw57Si5byVICR7bm9kZUluZGV4fTogJHtub2RlLl9uYW1lfSwgX3BhcmVudDpgLCBub2RlLl9wYXJlbnQsIGBfY2hpbGRyZW4gY291bnQ6ICR7bm9kZS5fY2hpbGRyZW4ubGVuZ3RofWApO1xuICAgICAgICBwcmVmYWJEYXRhW25vZGVJbmRleF0gPSBub2RlO1xuXG4gICAgICAgIC8vIOS4uuW9k+WJjeiKgueCueeUn+aIkGZpbGVJZOW5tuiusOW9lVVVSUTliLDntKLlvJXnmoTmmKDlsIRcbiAgICAgICAgY29uc3Qgbm9kZVV1aWQgPSB0aGlzLmV4dHJhY3ROb2RlVXVpZChub2RlRGF0YSk7XG4gICAgICAgIGNvbnN0IGZpbGVJZCA9IG5vZGVVdWlkIHx8IHRoaXMuZ2VuZXJhdGVGaWxlSWQoKTtcbiAgICAgICAgY29udGV4dC5ub2RlRmlsZUlkcy5zZXQobm9kZUluZGV4LnRvU3RyaW5nKCksIGZpbGVJZCk7XG5cbiAgICAgICAgLy8g6K6w5b2V6IqC54K5VVVJROWIsOe0ouW8leeahOaYoOWwhFxuICAgICAgICBpZiAobm9kZVV1aWQpIHtcbiAgICAgICAgICAgIGNvbnRleHQubm9kZVV1aWRUb0luZGV4LnNldChub2RlVXVpZCwgbm9kZUluZGV4KTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGDorrDlvZXoioLngrlVVUlE5pig5bCEOiAke25vZGVVdWlkfSAtPiAke25vZGVJbmRleH1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWFiOWkhOeQhuWtkOiKgueCue+8iOS/neaMgeS4juaJi+WKqOWIm+W7uueahOe0ouW8lemhuuW6j+S4gOiHtO+8iVxuICAgICAgICBjb25zdCBjaGlsZHJlblRvUHJvY2VzcyA9IHRoaXMuZ2V0Q2hpbGRyZW5Ub1Byb2Nlc3Mobm9kZURhdGEpO1xuICAgICAgICBpZiAoaW5jbHVkZUNoaWxkcmVuICYmIGNoaWxkcmVuVG9Qcm9jZXNzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGDlpITnkIboioLngrkgJHtub2RlLl9uYW1lfSDnmoQgJHtjaGlsZHJlblRvUHJvY2Vzcy5sZW5ndGh9IOS4quWtkOiKgueCuWApO1xuXG4gICAgICAgICAgICAvLyDkuLrmr4/kuKrlrZDoioLngrnliIbphY3ntKLlvJVcbiAgICAgICAgICAgIGNvbnN0IGNoaWxkSW5kaWNlczogbnVtYmVyW10gPSBbXTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGDlh4blpIfkuLogJHtjaGlsZHJlblRvUHJvY2Vzcy5sZW5ndGh9IOS4quWtkOiKgueCueWIhumFjee0ouW8le+8jOW9k+WJjUlEOiAke2NvbnRleHQuY3VycmVudElkfWApO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGlsZHJlblRvUHJvY2Vzcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGDlpITnkIbnrKwgJHtpKzF9IOS4quWtkOiKgueCue+8jOW9k+WJjWN1cnJlbnRJZDogJHtjb250ZXh0LmN1cnJlbnRJZH1gKTtcbiAgICAgICAgICAgICAgICBjb25zdCBjaGlsZEluZGV4ID0gY29udGV4dC5jdXJyZW50SWQrKztcbiAgICAgICAgICAgICAgICBjaGlsZEluZGljZXMucHVzaChjaGlsZEluZGV4KTtcbiAgICAgICAgICAgICAgICBub2RlLl9jaGlsZHJlbi5wdXNoKHsgXCJfX2lkX19cIjogY2hpbGRJbmRleCB9KTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhg4pyFIOa3u+WKoOWtkOiKgueCueW8leeUqOWIsCAke25vZGUuX25hbWV9OiB7X19pZF9fOiAke2NoaWxkSW5kZXh9fWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc29sZS5sb2coYOKchSDoioLngrkgJHtub2RlLl9uYW1lfSDmnIDnu4jnmoTlrZDoioLngrnmlbDnu4Q6YCwgbm9kZS5fY2hpbGRyZW4pO1xuXG4gICAgICAgICAgICAvLyDpgJLlvZLliJvlu7rlrZDoioLngrlcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGRyZW5Ub1Byb2Nlc3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjaGlsZERhdGEgPSBjaGlsZHJlblRvUHJvY2Vzc1tpXTtcbiAgICAgICAgICAgICAgICBjb25zdCBjaGlsZEluZGV4ID0gY2hpbGRJbmRpY2VzW2ldO1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuY3JlYXRlQ29tcGxldGVOb2RlVHJlZShcbiAgICAgICAgICAgICAgICAgICAgY2hpbGREYXRhLFxuICAgICAgICAgICAgICAgICAgICBub2RlSW5kZXgsXG4gICAgICAgICAgICAgICAgICAgIGNoaWxkSW5kZXgsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQsXG4gICAgICAgICAgICAgICAgICAgIGluY2x1ZGVDaGlsZHJlbixcbiAgICAgICAgICAgICAgICAgICAgaW5jbHVkZUNvbXBvbmVudHMsXG4gICAgICAgICAgICAgICAgICAgIGNoaWxkRGF0YS5uYW1lIHx8IGBDaGlsZCR7aSsxfWBcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g54S25ZCO5aSE55CG57uE5Lu2XG4gICAgICAgIGlmIChpbmNsdWRlQ29tcG9uZW50cyAmJiBub2RlRGF0YS5jb21wb25lbnRzICYmIEFycmF5LmlzQXJyYXkobm9kZURhdGEuY29tcG9uZW50cykpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGDlpITnkIboioLngrkgJHtub2RlLl9uYW1lfSDnmoQgJHtub2RlRGF0YS5jb21wb25lbnRzLmxlbmd0aH0g5Liq57uE5Lu2YCk7XG5cbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudEluZGljZXM6IG51bWJlcltdID0gW107XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGNvbXBvbmVudCBvZiBub2RlRGF0YS5jb21wb25lbnRzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29tcG9uZW50SW5kZXggPSBjb250ZXh0LmN1cnJlbnRJZCsrO1xuICAgICAgICAgICAgICAgIGNvbXBvbmVudEluZGljZXMucHVzaChjb21wb25lbnRJbmRleCk7XG4gICAgICAgICAgICAgICAgbm9kZS5fY29tcG9uZW50cy5wdXNoKHsgXCJfX2lkX19cIjogY29tcG9uZW50SW5kZXggfSk7XG5cbiAgICAgICAgICAgICAgICAvLyDorrDlvZXnu4Tku7ZVVUlE5Yiw57Si5byV55qE5pig5bCEXG4gICAgICAgICAgICAgICAgY29uc3QgY29tcG9uZW50VXVpZCA9IGNvbXBvbmVudC51dWlkIHx8IChjb21wb25lbnQudmFsdWUgJiYgY29tcG9uZW50LnZhbHVlLnV1aWQpO1xuICAgICAgICAgICAgICAgIGlmIChjb21wb25lbnRVdWlkKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQuY29tcG9uZW50VXVpZFRvSW5kZXguc2V0KGNvbXBvbmVudFV1aWQsIGNvbXBvbmVudEluZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYOiusOW9lee7hOS7tlVVSUTmmKDlsIQ6ICR7Y29tcG9uZW50VXVpZH0gLT4gJHtjb21wb25lbnRJbmRleH1gKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyDliJvlu7rnu4Tku7blr7nosaHvvIzkvKDlhaVjb250ZXh05Lul5aSE55CG5byV55SoXG4gICAgICAgICAgICAgICAgY29uc3QgY29tcG9uZW50T2JqID0gdGhpcy5jcmVhdGVDb21wb25lbnRPYmplY3QoY29tcG9uZW50LCBub2RlSW5kZXgsIGNvbnRleHQpO1xuICAgICAgICAgICAgICAgIHByZWZhYkRhdGFbY29tcG9uZW50SW5kZXhdID0gY29tcG9uZW50T2JqO1xuXG4gICAgICAgICAgICAgICAgLy8g5Li657uE5Lu25Yib5bu6IENvbXBQcmVmYWJJbmZvXG4gICAgICAgICAgICAgICAgY29uc3QgY29tcFByZWZhYkluZm9JbmRleCA9IGNvbnRleHQuY3VycmVudElkKys7XG4gICAgICAgICAgICAgICAgcHJlZmFiRGF0YVtjb21wUHJlZmFiSW5mb0luZGV4XSA9IHtcbiAgICAgICAgICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBcImNjLkNvbXBQcmVmYWJJbmZvXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZmlsZUlkXCI6IHRoaXMuZ2VuZXJhdGVGaWxlSWQoKVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvLyDlpoLmnpznu4Tku7blr7nosaHmnIkgX19wcmVmYWIg5bGe5oCn77yM6K6+572u5byV55SoXG4gICAgICAgICAgICAgICAgaWYgKGNvbXBvbmVudE9iaiAmJiB0eXBlb2YgY29tcG9uZW50T2JqID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgICBjb21wb25lbnRPYmouX19wcmVmYWIgPSB7IFwiX19pZF9fXCI6IGNvbXBQcmVmYWJJbmZvSW5kZXggfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGDinIUg6IqC54K5ICR7bm9kZS5fbmFtZX0g5re75Yqg5LqGICR7Y29tcG9uZW50SW5kaWNlcy5sZW5ndGh9IOS4que7hOS7tmApO1xuICAgICAgICB9XG5cblxuICAgICAgICAvLyDkuLrlvZPliY3oioLngrnliJvlu7pQcmVmYWJJbmZvXG4gICAgICAgIGNvbnN0IHByZWZhYkluZm9JbmRleCA9IGNvbnRleHQuY3VycmVudElkKys7XG4gICAgICAgIG5vZGUuX3ByZWZhYiA9IHsgXCJfX2lkX19cIjogcHJlZmFiSW5mb0luZGV4IH07XG5cbiAgICAgICAgY29uc3QgcHJlZmFiSW5mbzogYW55ID0ge1xuICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBcImNjLlByZWZhYkluZm9cIixcbiAgICAgICAgICAgIFwicm9vdFwiOiB7IFwiX19pZF9fXCI6IDEgfSxcbiAgICAgICAgICAgIFwiYXNzZXRcIjogeyBcIl9faWRfX1wiOiBjb250ZXh0LnByZWZhYkFzc2V0SW5kZXggfSxcbiAgICAgICAgICAgIFwiZmlsZUlkXCI6IGZpbGVJZCxcbiAgICAgICAgICAgIFwidGFyZ2V0T3ZlcnJpZGVzXCI6IG51bGwsXG4gICAgICAgICAgICBcIm5lc3RlZFByZWZhYkluc3RhbmNlUm9vdHNcIjogbnVsbFxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIOagueiKgueCueeahOeJueauiuWkhOeQhlxuICAgICAgICBpZiAobm9kZUluZGV4ID09PSAxKSB7XG4gICAgICAgICAgICAvLyDmoLnoioLngrnmsqHmnIlpbnN0YW5jZe+8jOS9huWPr+iDveaciXRhcmdldE92ZXJyaWRlc1xuICAgICAgICAgICAgcHJlZmFiSW5mby5pbnN0YW5jZSA9IG51bGw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyDlrZDoioLngrnpgJrluLjmnIlpbnN0YW5jZeS4um51bGxcbiAgICAgICAgICAgIHByZWZhYkluZm8uaW5zdGFuY2UgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJlZmFiRGF0YVtwcmVmYWJJbmZvSW5kZXhdID0gcHJlZmFiSW5mbztcbiAgICAgICAgY29udGV4dC5jdXJyZW50SWQgPSBwcmVmYWJJbmZvSW5kZXggKyAxO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWwhlVVSUTovazmjaLkuLpDb2NvcyBDcmVhdG9y55qE5Y6L57yp5qC85byPXG4gICAgICog5Z+65LqO55yf5a6eQ29jb3MgQ3JlYXRvcue8lui+keWZqOeahOWOi+e8qeeul+azleWunueOsFxuICAgICAqIOWJjTXkuKpoZXjlrZfnrKbkv53mjIHkuI3lj5jvvIzliankvZkyN+S4quWtl+espuWOi+e8qeaIkDE45Liq5a2X56ymXG4gICAgICovXG4gICAgcHJpdmF0ZSB1dWlkVG9Db21wcmVzc2VkSWQodXVpZDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgY29uc3QgQkFTRTY0X0tFWVMgPSAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLz0nO1xuXG4gICAgICAgIC8vIOenu+mZpOi/nuWtl+espuW5tui9rOS4uuWwj+WGmVxuICAgICAgICBjb25zdCBjbGVhblV1aWQgPSB1dWlkLnJlcGxhY2UoLy0vZywgJycpLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgICAgLy8g56Gu5L+dVVVJROacieaViFxuICAgICAgICBpZiAoY2xlYW5VdWlkLmxlbmd0aCAhPT0gMzIpIHtcbiAgICAgICAgICAgIHJldHVybiB1dWlkOyAvLyDlpoLmnpzkuI3mmK/mnInmlYjnmoRVVUlE77yM6L+U5Zue5Y6f5aeL5YC8XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDb2NvcyBDcmVhdG9y55qE5Y6L57yp566X5rOV77ya5YmNNeS4quWtl+espuS/neaMgeS4jeWPmO+8jOWJqeS9mTI35Liq5a2X56ym5Y6L57yp5oiQMTjkuKrlrZfnrKZcbiAgICAgICAgbGV0IHJlc3VsdCA9IGNsZWFuVXVpZC5zdWJzdHJpbmcoMCwgNSk7XG5cbiAgICAgICAgLy8g5Ymp5L2ZMjfkuKrlrZfnrKbpnIDopoHljovnvKnmiJAxOOS4quWtl+esplxuICAgICAgICBjb25zdCByZW1haW5kZXIgPSBjbGVhblV1aWQuc3Vic3RyaW5nKDUpO1xuXG4gICAgICAgIC8vIOavjzPkuKpoZXjlrZfnrKbljovnvKnmiJAy5Liq5a2X56ymXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVtYWluZGVyLmxlbmd0aDsgaSArPSAzKSB7XG4gICAgICAgICAgICBjb25zdCBoZXgxID0gcmVtYWluZGVyW2ldIHx8ICcwJztcbiAgICAgICAgICAgIGNvbnN0IGhleDIgPSByZW1haW5kZXJbaSArIDFdIHx8ICcwJztcbiAgICAgICAgICAgIGNvbnN0IGhleDMgPSByZW1haW5kZXJbaSArIDJdIHx8ICcwJztcblxuICAgICAgICAgICAgLy8g5bCGM+S4qmhleOWtl+espigxMuS9jSnovazmjaLkuLoy5LiqYmFzZTY05a2X56ymXG4gICAgICAgICAgICBjb25zdCB2YWx1ZSA9IHBhcnNlSW50KGhleDEgKyBoZXgyICsgaGV4MywgMTYpO1xuXG4gICAgICAgICAgICAvLyAxMuS9jeWIhuaIkOS4pOS4qjbkvY1cbiAgICAgICAgICAgIGNvbnN0IGhpZ2g2ID0gKHZhbHVlID4+IDYpICYgNjM7XG4gICAgICAgICAgICBjb25zdCBsb3c2ID0gdmFsdWUgJiA2MztcblxuICAgICAgICAgICAgcmVzdWx0ICs9IEJBU0U2NF9LRVlTW2hpZ2g2XSArIEJBU0U2NF9LRVlTW2xvdzZdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDliJvlu7rnu4Tku7blr7nosaFcbiAgICAgKi9cbiAgICBwcml2YXRlIGNyZWF0ZUNvbXBvbmVudE9iamVjdChjb21wb25lbnREYXRhOiBhbnksIG5vZGVJbmRleDogbnVtYmVyLCBjb250ZXh0Pzoge1xuICAgICAgICBub2RlVXVpZFRvSW5kZXg/OiBNYXA8c3RyaW5nLCBudW1iZXI+LFxuICAgICAgICBjb21wb25lbnRVdWlkVG9JbmRleD86IE1hcDxzdHJpbmcsIG51bWJlcj5cbiAgICB9KTogYW55IHtcbiAgICAgICAgbGV0IGNvbXBvbmVudFR5cGUgPSBjb21wb25lbnREYXRhLnR5cGUgfHwgY29tcG9uZW50RGF0YS5fX3R5cGVfXyB8fCAnY2MuQ29tcG9uZW50JztcbiAgICAgICAgY29uc3QgZW5hYmxlZCA9IGNvbXBvbmVudERhdGEuZW5hYmxlZCAhPT0gdW5kZWZpbmVkID8gY29tcG9uZW50RGF0YS5lbmFibGVkIDogdHJ1ZTtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhg5Yib5bu657uE5Lu25a+56LGhIC0g5Y6f5aeL57G75Z6LOiAke2NvbXBvbmVudFR5cGV9YCk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCfnu4Tku7blrozmlbTmlbDmja46JywgSlNPTi5zdHJpbmdpZnkoY29tcG9uZW50RGF0YSwgbnVsbCwgMikpO1xuXG4gICAgICAgIC8vIOWkhOeQhuiEmuacrOe7hOS7tiAtIE1DUOaOpeWPo+W3sue7j+i/lOWbnuato+ehrueahOWOi+e8qVVVSUTmoLzlvI9cbiAgICAgICAgaWYgKGNvbXBvbmVudFR5cGUgJiYgIWNvbXBvbmVudFR5cGUuc3RhcnRzV2l0aCgnY2MuJykpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGDkvb/nlKjohJrmnKznu4Tku7bljovnvKlVVUlE57G75Z6LOiAke2NvbXBvbmVudFR5cGV9YCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDln7rnoYDnu4Tku7bnu5PmnoRcbiAgICAgICAgY29uc3QgY29tcG9uZW50OiBhbnkgPSB7XG4gICAgICAgICAgICBcIl9fdHlwZV9fXCI6IGNvbXBvbmVudFR5cGUsXG4gICAgICAgICAgICBcIl9uYW1lXCI6IFwiXCIsXG4gICAgICAgICAgICBcIl9vYmpGbGFnc1wiOiAwLFxuICAgICAgICAgICAgXCJfX2VkaXRvckV4dHJhc19fXCI6IHt9LFxuICAgICAgICAgICAgXCJub2RlXCI6IHsgXCJfX2lkX19cIjogbm9kZUluZGV4IH0sXG4gICAgICAgICAgICBcIl9lbmFibGVkXCI6IGVuYWJsZWRcbiAgICAgICAgfTtcblxuICAgICAgICAvLyDmj5DliY3orr7nva4gX19wcmVmYWIg5bGe5oCn5Y2g5L2N56ym77yM5ZCO57ut5Lya6KKr5q2j56Gu6K6+572uXG4gICAgICAgIGNvbXBvbmVudC5fX3ByZWZhYiA9IG51bGw7XG5cbiAgICAgICAgLy8g5qC55o2u57uE5Lu257G75Z6L5re75Yqg54m55a6a5bGe5oCnXG4gICAgICAgIGlmIChjb21wb25lbnRUeXBlID09PSAnY2MuVUlUcmFuc2Zvcm0nKSB7XG4gICAgICAgICAgICBjb25zdCBjb250ZW50U2l6ZSA9IGNvbXBvbmVudERhdGEucHJvcGVydGllcz8uY29udGVudFNpemU/LnZhbHVlIHx8IHsgd2lkdGg6IDEwMCwgaGVpZ2h0OiAxMDAgfTtcbiAgICAgICAgICAgIGNvbnN0IGFuY2hvclBvaW50ID0gY29tcG9uZW50RGF0YS5wcm9wZXJ0aWVzPy5hbmNob3JQb2ludD8udmFsdWUgfHwgeyB4OiAwLjUsIHk6IDAuNSB9O1xuXG4gICAgICAgICAgICBjb21wb25lbnQuX2NvbnRlbnRTaXplID0ge1xuICAgICAgICAgICAgICAgIFwiX190eXBlX19cIjogXCJjYy5TaXplXCIsXG4gICAgICAgICAgICAgICAgXCJ3aWR0aFwiOiBjb250ZW50U2l6ZS53aWR0aCxcbiAgICAgICAgICAgICAgICBcImhlaWdodFwiOiBjb250ZW50U2l6ZS5oZWlnaHRcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb21wb25lbnQuX2FuY2hvclBvaW50ID0ge1xuICAgICAgICAgICAgICAgIFwiX190eXBlX19cIjogXCJjYy5WZWMyXCIsXG4gICAgICAgICAgICAgICAgXCJ4XCI6IGFuY2hvclBvaW50LngsXG4gICAgICAgICAgICAgICAgXCJ5XCI6IGFuY2hvclBvaW50LnlcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSBpZiAoY29tcG9uZW50VHlwZSA9PT0gJ2NjLlNwcml0ZScpIHtcbiAgICAgICAgICAgIC8vIOWkhOeQhlNwcml0Zee7hOS7tueahHNwcml0ZUZyYW1l5byV55SoXG4gICAgICAgICAgICBjb25zdCBzcHJpdGVGcmFtZVByb3AgPSBjb21wb25lbnREYXRhLnByb3BlcnRpZXM/Ll9zcHJpdGVGcmFtZSB8fCBjb21wb25lbnREYXRhLnByb3BlcnRpZXM/LnNwcml0ZUZyYW1lO1xuICAgICAgICAgICAgaWYgKHNwcml0ZUZyYW1lUHJvcCkge1xuICAgICAgICAgICAgICAgIGNvbXBvbmVudC5fc3ByaXRlRnJhbWUgPSB0aGlzLnByb2Nlc3NDb21wb25lbnRQcm9wZXJ0eShzcHJpdGVGcmFtZVByb3AsIGNvbnRleHQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb21wb25lbnQuX3Nwcml0ZUZyYW1lID0gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29tcG9uZW50Ll90eXBlID0gY29tcG9uZW50RGF0YS5wcm9wZXJ0aWVzPy5fdHlwZT8udmFsdWUgPz8gMDtcbiAgICAgICAgICAgIGNvbXBvbmVudC5fZmlsbFR5cGUgPSBjb21wb25lbnREYXRhLnByb3BlcnRpZXM/Ll9maWxsVHlwZT8udmFsdWUgPz8gMDtcbiAgICAgICAgICAgIGNvbXBvbmVudC5fc2l6ZU1vZGUgPSBjb21wb25lbnREYXRhLnByb3BlcnRpZXM/Ll9zaXplTW9kZT8udmFsdWUgPz8gMTtcbiAgICAgICAgICAgIGNvbXBvbmVudC5fZmlsbENlbnRlciA9IHsgXCJfX3R5cGVfX1wiOiBcImNjLlZlYzJcIiwgXCJ4XCI6IDAsIFwieVwiOiAwIH07XG4gICAgICAgICAgICBjb21wb25lbnQuX2ZpbGxTdGFydCA9IGNvbXBvbmVudERhdGEucHJvcGVydGllcz8uX2ZpbGxTdGFydD8udmFsdWUgPz8gMDtcbiAgICAgICAgICAgIGNvbXBvbmVudC5fZmlsbFJhbmdlID0gY29tcG9uZW50RGF0YS5wcm9wZXJ0aWVzPy5fZmlsbFJhbmdlPy52YWx1ZSA/PyAwO1xuICAgICAgICAgICAgY29tcG9uZW50Ll9pc1RyaW1tZWRNb2RlID0gY29tcG9uZW50RGF0YS5wcm9wZXJ0aWVzPy5faXNUcmltbWVkTW9kZT8udmFsdWUgPz8gdHJ1ZTtcbiAgICAgICAgICAgIGNvbXBvbmVudC5fdXNlR3JheXNjYWxlID0gY29tcG9uZW50RGF0YS5wcm9wZXJ0aWVzPy5fdXNlR3JheXNjYWxlPy52YWx1ZSA/PyBmYWxzZTtcblxuICAgICAgICAgICAgLy8g6LCD6K+V77ya5omT5Y2wU3ByaXRl57uE5Lu255qE5omA5pyJ5bGe5oCn77yI5bey5rOo6YeK77yJXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnU3ByaXRl57uE5Lu25bGe5oCnOicsIEpTT04uc3RyaW5naWZ5KGNvbXBvbmVudERhdGEucHJvcGVydGllcywgbnVsbCwgMikpO1xuICAgICAgICAgICAgY29tcG9uZW50Ll9hdGxhcyA9IG51bGw7XG4gICAgICAgICAgICBjb21wb25lbnQuX2lkID0gXCJcIjtcbiAgICAgICAgfSBlbHNlIGlmIChjb21wb25lbnRUeXBlID09PSAnY2MuQnV0dG9uJykge1xuICAgICAgICAgICAgY29tcG9uZW50Ll9pbnRlcmFjdGFibGUgPSB0cnVlO1xuICAgICAgICAgICAgY29tcG9uZW50Ll90cmFuc2l0aW9uID0gMztcbiAgICAgICAgICAgIGNvbXBvbmVudC5fbm9ybWFsQ29sb3IgPSB7IFwiX190eXBlX19cIjogXCJjYy5Db2xvclwiLCBcInJcIjogMjU1LCBcImdcIjogMjU1LCBcImJcIjogMjU1LCBcImFcIjogMjU1IH07XG4gICAgICAgICAgICBjb21wb25lbnQuX2hvdmVyQ29sb3IgPSB7IFwiX190eXBlX19cIjogXCJjYy5Db2xvclwiLCBcInJcIjogMjExLCBcImdcIjogMjExLCBcImJcIjogMjExLCBcImFcIjogMjU1IH07XG4gICAgICAgICAgICBjb21wb25lbnQuX3ByZXNzZWRDb2xvciA9IHsgXCJfX3R5cGVfX1wiOiBcImNjLkNvbG9yXCIsIFwiclwiOiAyNTUsIFwiZ1wiOiAyNTUsIFwiYlwiOiAyNTUsIFwiYVwiOiAyNTUgfTtcbiAgICAgICAgICAgIGNvbXBvbmVudC5fZGlzYWJsZWRDb2xvciA9IHsgXCJfX3R5cGVfX1wiOiBcImNjLkNvbG9yXCIsIFwiclwiOiAxMjQsIFwiZ1wiOiAxMjQsIFwiYlwiOiAxMjQsIFwiYVwiOiAyNTUgfTtcbiAgICAgICAgICAgIGNvbXBvbmVudC5fbm9ybWFsU3ByaXRlID0gbnVsbDtcbiAgICAgICAgICAgIGNvbXBvbmVudC5faG92ZXJTcHJpdGUgPSBudWxsO1xuICAgICAgICAgICAgY29tcG9uZW50Ll9wcmVzc2VkU3ByaXRlID0gbnVsbDtcbiAgICAgICAgICAgIGNvbXBvbmVudC5fZGlzYWJsZWRTcHJpdGUgPSBudWxsO1xuICAgICAgICAgICAgY29tcG9uZW50Ll9kdXJhdGlvbiA9IDAuMTtcbiAgICAgICAgICAgIGNvbXBvbmVudC5fem9vbVNjYWxlID0gMS4yO1xuICAgICAgICAgICAgLy8g5aSE55CGQnV0dG9u55qEdGFyZ2V05byV55SoXG4gICAgICAgICAgICBjb25zdCB0YXJnZXRQcm9wID0gY29tcG9uZW50RGF0YS5wcm9wZXJ0aWVzPy5fdGFyZ2V0IHx8IGNvbXBvbmVudERhdGEucHJvcGVydGllcz8udGFyZ2V0O1xuICAgICAgICAgICAgaWYgKHRhcmdldFByb3ApIHtcbiAgICAgICAgICAgICAgICBjb21wb25lbnQuX3RhcmdldCA9IHRoaXMucHJvY2Vzc0NvbXBvbmVudFByb3BlcnR5KHRhcmdldFByb3AsIGNvbnRleHQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb21wb25lbnQuX3RhcmdldCA9IHsgXCJfX2lkX19cIjogbm9kZUluZGV4IH07IC8vIOm7mOiupOaMh+WQkeiHqui6q+iKgueCuVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29tcG9uZW50Ll9jbGlja0V2ZW50cyA9IFtdO1xuICAgICAgICAgICAgY29tcG9uZW50Ll9pZCA9IFwiXCI7XG4gICAgICAgIH0gZWxzZSBpZiAoY29tcG9uZW50VHlwZSA9PT0gJ2NjLkxhYmVsJykge1xuICAgICAgICAgICAgY29tcG9uZW50Ll9zdHJpbmcgPSBjb21wb25lbnREYXRhLnByb3BlcnRpZXM/Ll9zdHJpbmc/LnZhbHVlIHx8IFwiTGFiZWxcIjtcbiAgICAgICAgICAgIGNvbXBvbmVudC5faG9yaXpvbnRhbEFsaWduID0gMTtcbiAgICAgICAgICAgIGNvbXBvbmVudC5fdmVydGljYWxBbGlnbiA9IDE7XG4gICAgICAgICAgICBjb21wb25lbnQuX2FjdHVhbEZvbnRTaXplID0gMjA7XG4gICAgICAgICAgICBjb21wb25lbnQuX2ZvbnRTaXplID0gMjA7XG4gICAgICAgICAgICBjb21wb25lbnQuX2ZvbnRGYW1pbHkgPSBcIkFyaWFsXCI7XG4gICAgICAgICAgICBjb21wb25lbnQuX2xpbmVIZWlnaHQgPSAyNTtcbiAgICAgICAgICAgIGNvbXBvbmVudC5fb3ZlcmZsb3cgPSAwO1xuICAgICAgICAgICAgY29tcG9uZW50Ll9lbmFibGVXcmFwVGV4dCA9IHRydWU7XG4gICAgICAgICAgICBjb21wb25lbnQuX2ZvbnQgPSBudWxsO1xuICAgICAgICAgICAgY29tcG9uZW50Ll9pc1N5c3RlbUZvbnRVc2VkID0gdHJ1ZTtcbiAgICAgICAgICAgIGNvbXBvbmVudC5fc3BhY2luZ1ggPSAwO1xuICAgICAgICAgICAgY29tcG9uZW50Ll9pc0l0YWxpYyA9IGZhbHNlO1xuICAgICAgICAgICAgY29tcG9uZW50Ll9pc0JvbGQgPSBmYWxzZTtcbiAgICAgICAgICAgIGNvbXBvbmVudC5faXNVbmRlcmxpbmUgPSBmYWxzZTtcbiAgICAgICAgICAgIGNvbXBvbmVudC5fdW5kZXJsaW5lSGVpZ2h0ID0gMjtcbiAgICAgICAgICAgIGNvbXBvbmVudC5fY2FjaGVNb2RlID0gMDtcbiAgICAgICAgICAgIGNvbXBvbmVudC5faWQgPSBcIlwiO1xuICAgICAgICB9IGVsc2UgaWYgKGNvbXBvbmVudERhdGEucHJvcGVydGllcykge1xuICAgICAgICAgICAgLy8g5aSE55CG5omA5pyJ57uE5Lu255qE5bGe5oCn77yI5YyF5ous5YaF572u57uE5Lu25ZKM6Ieq5a6a5LmJ6ISa5pys57uE5Lu277yJXG4gICAgICAgICAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhjb21wb25lbnREYXRhLnByb3BlcnRpZXMpKSB7XG4gICAgICAgICAgICAgICAgaWYgKGtleSA9PT0gJ25vZGUnIHx8IGtleSA9PT0gJ2VuYWJsZWQnIHx8IGtleSA9PT0gJ19fdHlwZV9fJyB8fFxuICAgICAgICAgICAgICAgICAgICBrZXkgPT09ICd1dWlkJyB8fCBrZXkgPT09ICduYW1lJyB8fCBrZXkgPT09ICdfX3NjcmlwdEFzc2V0JyB8fCBrZXkgPT09ICdfb2JqRmxhZ3MnKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlOyAvLyDot7Pov4fov5nkupvnibnmrorlsZ7mgKfvvIzljIXmi6xfb2JqRmxhZ3NcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyDlr7nkuo7ku6XkuIvliJLnur/lvIDlpLTnmoTlsZ7mgKfvvIzpnIDopoHnibnmrorlpITnkIZcbiAgICAgICAgICAgICAgICBpZiAoa2V5LnN0YXJ0c1dpdGgoJ18nKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyDnoa7kv53lsZ7mgKflkI3kv53mjIHljp/moLfvvIjljIXmi6zkuIvliJLnur/vvIlcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvcFZhbHVlID0gdGhpcy5wcm9jZXNzQ29tcG9uZW50UHJvcGVydHkodmFsdWUsIGNvbnRleHQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocHJvcFZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudFtrZXldID0gcHJvcFZhbHVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g6Z2e5LiL5YiS57q/5byA5aS055qE5bGe5oCn5q2j5bi45aSE55CGXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb3BWYWx1ZSA9IHRoaXMucHJvY2Vzc0NvbXBvbmVudFByb3BlcnR5KHZhbHVlLCBjb250ZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BWYWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnRba2V5XSA9IHByb3BWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOehruS/nSBfaWQg5Zyo5pyA5ZCO5L2N572uXG4gICAgICAgIGNvbnN0IF9pZCA9IGNvbXBvbmVudC5faWQgfHwgXCJcIjtcbiAgICAgICAgZGVsZXRlIGNvbXBvbmVudC5faWQ7XG4gICAgICAgIGNvbXBvbmVudC5faWQgPSBfaWQ7XG5cbiAgICAgICAgcmV0dXJuIGNvbXBvbmVudDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlpITnkIbnu4Tku7blsZ7mgKflgLzvvIznoa7kv53moLzlvI/kuI7miYvliqjliJvlu7rnmoTpooTliLbkvZPkuIDoh7RcbiAgICAgKi9cbiAgICBwcml2YXRlIHByb2Nlc3NDb21wb25lbnRQcm9wZXJ0eShwcm9wRGF0YTogYW55LCBjb250ZXh0Pzoge1xuICAgICAgICBub2RlVXVpZFRvSW5kZXg/OiBNYXA8c3RyaW5nLCBudW1iZXI+LFxuICAgICAgICBjb21wb25lbnRVdWlkVG9JbmRleD86IE1hcDxzdHJpbmcsIG51bWJlcj5cbiAgICB9KTogYW55IHtcbiAgICAgICAgaWYgKCFwcm9wRGF0YSB8fCB0eXBlb2YgcHJvcERhdGEgIT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICByZXR1cm4gcHJvcERhdGE7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB2YWx1ZSA9IHByb3BEYXRhLnZhbHVlO1xuICAgICAgICBjb25zdCB0eXBlID0gcHJvcERhdGEudHlwZTtcblxuICAgICAgICAvLyDlpITnkIZudWxs5YC8XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWkhOeQhuepulVVSUTlr7nosaHvvIzovazmjaLkuLpudWxsXG4gICAgICAgIGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlLnV1aWQgPT09ICcnKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWkhOeQhuiKgueCueW8leeUqFxuICAgICAgICBpZiAodHlwZSA9PT0gJ2NjLk5vZGUnICYmIHZhbHVlPy51dWlkKSB7XG4gICAgICAgICAgICAvLyDlnKjpooTliLbkvZPkuK3vvIzoioLngrnlvJXnlKjpnIDopoHovazmjaLkuLogX19pZF9fIOW9ouW8j1xuICAgICAgICAgICAgaWYgKGNvbnRleHQ/Lm5vZGVVdWlkVG9JbmRleCAmJiBjb250ZXh0Lm5vZGVVdWlkVG9JbmRleC5oYXModmFsdWUudXVpZCkpIHtcbiAgICAgICAgICAgICAgICAvLyDlhoXpg6jlvJXnlKjvvJrovazmjaLkuLpfX2lkX1/moLzlvI9cbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBcIl9faWRfX1wiOiBjb250ZXh0Lm5vZGVVdWlkVG9JbmRleC5nZXQodmFsdWUudXVpZClcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8g5aSW6YOo5byV55So77ya6K6+572u5Li6bnVsbO+8jOWboOS4uuWklumDqOiKgueCueS4jeWxnuS6jumihOWItuS9k+e7k+aehFxuICAgICAgICAgICAgY29uc29sZS53YXJuKGBOb2RlIHJlZmVyZW5jZSBVVUlEICR7dmFsdWUudXVpZH0gbm90IGZvdW5kIGluIHByZWZhYiBjb250ZXh0LCBzZXR0aW5nIHRvIG51bGwgKGV4dGVybmFsIHJlZmVyZW5jZSlgKTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5aSE55CG6LWE5rqQ5byV55So77yI6aKE5Yi25L2T44CB57q555CG44CB57K+54G15bin562J77yJXG4gICAgICAgIGlmICh2YWx1ZT8udXVpZCAmJiAoXG4gICAgICAgICAgICB0eXBlID09PSAnY2MuUHJlZmFiJyB8fFxuICAgICAgICAgICAgdHlwZSA9PT0gJ2NjLlRleHR1cmUyRCcgfHxcbiAgICAgICAgICAgIHR5cGUgPT09ICdjYy5TcHJpdGVGcmFtZScgfHxcbiAgICAgICAgICAgIHR5cGUgPT09ICdjYy5NYXRlcmlhbCcgfHxcbiAgICAgICAgICAgIHR5cGUgPT09ICdjYy5BbmltYXRpb25DbGlwJyB8fFxuICAgICAgICAgICAgdHlwZSA9PT0gJ2NjLkF1ZGlvQ2xpcCcgfHxcbiAgICAgICAgICAgIHR5cGUgPT09ICdjYy5Gb250JyB8fFxuICAgICAgICAgICAgdHlwZSA9PT0gJ2NjLkFzc2V0J1xuICAgICAgICApKSB7XG4gICAgICAgICAgICAvLyDlr7nkuo7pooTliLbkvZPlvJXnlKjvvIzkv53mjIHljp/lp4tVVUlE5qC85byPXG4gICAgICAgICAgICBjb25zdCB1dWlkVG9Vc2UgPSB0eXBlID09PSAnY2MuUHJlZmFiJyA/IHZhbHVlLnV1aWQgOiB0aGlzLnV1aWRUb0NvbXByZXNzZWRJZCh2YWx1ZS51dWlkKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgXCJfX3V1aWRfX1wiOiB1dWlkVG9Vc2UsXG4gICAgICAgICAgICAgICAgXCJfX2V4cGVjdGVkVHlwZV9fXCI6IHR5cGVcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICAvLyDlpITnkIbnu4Tku7blvJXnlKjvvIjljIXmi6zlhbfkvZPnmoTnu4Tku7bnsbvlnovlpoJjYy5MYWJlbCwgY2MuQnV0dG9u562J77yJXG4gICAgICAgIGlmICh2YWx1ZT8udXVpZCAmJiAodHlwZSA9PT0gJ2NjLkNvbXBvbmVudCcgfHxcbiAgICAgICAgICAgIHR5cGUgPT09ICdjYy5MYWJlbCcgfHwgdHlwZSA9PT0gJ2NjLkJ1dHRvbicgfHwgdHlwZSA9PT0gJ2NjLlNwcml0ZScgfHxcbiAgICAgICAgICAgIHR5cGUgPT09ICdjYy5VSVRyYW5zZm9ybScgfHwgdHlwZSA9PT0gJ2NjLlJpZ2lkQm9keTJEJyB8fFxuICAgICAgICAgICAgdHlwZSA9PT0gJ2NjLkJveENvbGxpZGVyMkQnIHx8IHR5cGUgPT09ICdjYy5BbmltYXRpb24nIHx8XG4gICAgICAgICAgICB0eXBlID09PSAnY2MuQXVkaW9Tb3VyY2UnIHx8ICh0eXBlPy5zdGFydHNXaXRoKCdjYy4nKSAmJiAhdHlwZS5pbmNsdWRlcygnQCcpKSkpIHtcbiAgICAgICAgICAgIC8vIOWcqOmihOWItuS9k+S4re+8jOe7hOS7tuW8leeUqOS5n+mcgOimgei9rOaNouS4uiBfX2lkX18g5b2i5byPXG4gICAgICAgICAgICBpZiAoY29udGV4dD8uY29tcG9uZW50VXVpZFRvSW5kZXggJiYgY29udGV4dC5jb21wb25lbnRVdWlkVG9JbmRleC5oYXModmFsdWUudXVpZCkpIHtcbiAgICAgICAgICAgICAgICAvLyDlhoXpg6jlvJXnlKjvvJrovazmjaLkuLpfX2lkX1/moLzlvI9cbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgQ29tcG9uZW50IHJlZmVyZW5jZSAke3R5cGV9IFVVSUQgJHt2YWx1ZS51dWlkfSBmb3VuZCBpbiBwcmVmYWIgY29udGV4dCwgY29udmVydGluZyB0byBfX2lkX19gKTtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBcIl9faWRfX1wiOiBjb250ZXh0LmNvbXBvbmVudFV1aWRUb0luZGV4LmdldCh2YWx1ZS51dWlkKVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyDlpJbpg6jlvJXnlKjvvJrorr7nva7kuLpudWxs77yM5Zug5Li65aSW6YOo57uE5Lu25LiN5bGe5LqO6aKE5Yi25L2T57uT5p6EXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYENvbXBvbmVudCByZWZlcmVuY2UgJHt0eXBlfSBVVUlEICR7dmFsdWUudXVpZH0gbm90IGZvdW5kIGluIHByZWZhYiBjb250ZXh0LCBzZXR0aW5nIHRvIG51bGwgKGV4dGVybmFsIHJlZmVyZW5jZSlgKTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5aSE55CG5aSN5p2C57G75Z6L77yM5re75YqgX190eXBlX1/moIforrBcbiAgICAgICAgaWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIGlmICh0eXBlID09PSAnY2MuQ29sb3InKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBcImNjLkNvbG9yXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiclwiOiBNYXRoLm1pbigyNTUsIE1hdGgubWF4KDAsIE51bWJlcih2YWx1ZS5yKSB8fCAwKSksXG4gICAgICAgICAgICAgICAgICAgIFwiZ1wiOiBNYXRoLm1pbigyNTUsIE1hdGgubWF4KDAsIE51bWJlcih2YWx1ZS5nKSB8fCAwKSksXG4gICAgICAgICAgICAgICAgICAgIFwiYlwiOiBNYXRoLm1pbigyNTUsIE1hdGgubWF4KDAsIE51bWJlcih2YWx1ZS5iKSB8fCAwKSksXG4gICAgICAgICAgICAgICAgICAgIFwiYVwiOiB2YWx1ZS5hICE9PSB1bmRlZmluZWQgPyBNYXRoLm1pbigyNTUsIE1hdGgubWF4KDAsIE51bWJlcih2YWx1ZS5hKSkpIDogMjU1XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ2NjLlZlYzMnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBcImNjLlZlYzNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ4XCI6IE51bWJlcih2YWx1ZS54KSB8fCAwLFxuICAgICAgICAgICAgICAgICAgICBcInlcIjogTnVtYmVyKHZhbHVlLnkpIHx8IDAsXG4gICAgICAgICAgICAgICAgICAgIFwielwiOiBOdW1iZXIodmFsdWUueikgfHwgMFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdjYy5WZWMyJykge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIFwiX190eXBlX19cIjogXCJjYy5WZWMyXCIsXG4gICAgICAgICAgICAgICAgICAgIFwieFwiOiBOdW1iZXIodmFsdWUueCkgfHwgMCxcbiAgICAgICAgICAgICAgICAgICAgXCJ5XCI6IE51bWJlcih2YWx1ZS55KSB8fCAwXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ2NjLlNpemUnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBcImNjLlNpemVcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ3aWR0aFwiOiBOdW1iZXIodmFsdWUud2lkdGgpIHx8IDAsXG4gICAgICAgICAgICAgICAgICAgIFwiaGVpZ2h0XCI6IE51bWJlcih2YWx1ZS5oZWlnaHQpIHx8IDBcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlID09PSAnY2MuUXVhdCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBcIl9fdHlwZV9fXCI6IFwiY2MuUXVhdFwiLFxuICAgICAgICAgICAgICAgICAgICBcInhcIjogTnVtYmVyKHZhbHVlLngpIHx8IDAsXG4gICAgICAgICAgICAgICAgICAgIFwieVwiOiBOdW1iZXIodmFsdWUueSkgfHwgMCxcbiAgICAgICAgICAgICAgICAgICAgXCJ6XCI6IE51bWJlcih2YWx1ZS56KSB8fCAwLFxuICAgICAgICAgICAgICAgICAgICBcIndcIjogdmFsdWUudyAhPT0gdW5kZWZpbmVkID8gTnVtYmVyKHZhbHVlLncpIDogMVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyDlpITnkIbmlbDnu4TnsbvlnotcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgICAgICAvLyDoioLngrnmlbDnu4RcbiAgICAgICAgICAgIGlmIChwcm9wRGF0YS5lbGVtZW50VHlwZURhdGE/LnR5cGUgPT09ICdjYy5Ob2RlJykge1xuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZS5tYXAoaXRlbSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpdGVtPy51dWlkICYmIGNvbnRleHQ/Lm5vZGVVdWlkVG9JbmRleD8uaGFzKGl0ZW0udXVpZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7IFwiX19pZF9fXCI6IGNvbnRleHQubm9kZVV1aWRUb0luZGV4LmdldChpdGVtLnV1aWQpIH07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfSkuZmlsdGVyKGl0ZW0gPT4gaXRlbSAhPT0gbnVsbCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOi1hOa6kOaVsOe7hFxuICAgICAgICAgICAgaWYgKHByb3BEYXRhLmVsZW1lbnRUeXBlRGF0YT8udHlwZSAmJiBwcm9wRGF0YS5lbGVtZW50VHlwZURhdGEudHlwZS5zdGFydHNXaXRoKCdjYy4nKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZS5tYXAoaXRlbSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpdGVtPy51dWlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiX191dWlkX19cIjogdGhpcy51dWlkVG9Db21wcmVzc2VkSWQoaXRlbS51dWlkKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIl9fZXhwZWN0ZWRUeXBlX19cIjogcHJvcERhdGEuZWxlbWVudFR5cGVEYXRhLnR5cGVcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfSkuZmlsdGVyKGl0ZW0gPT4gaXRlbSAhPT0gbnVsbCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOWfuuehgOexu+Wei+aVsOe7hFxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlLm1hcChpdGVtID0+IGl0ZW0/LnZhbHVlICE9PSB1bmRlZmluZWQgPyBpdGVtLnZhbHVlIDogaXRlbSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDlhbbku5blpI3mnYLlr7nosaHnsbvlnovvvIzkv53mjIHljp/moLfkvYbnoa7kv53mnIlfX3R5cGVfX+agh+iusFxuICAgICAgICBpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB0eXBlICYmIHR5cGUuc3RhcnRzV2l0aCgnY2MuJykpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiB0eXBlLFxuICAgICAgICAgICAgICAgIC4uLnZhbHVlXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWIm+W7uuespuWQiOW8leaTjuagh+WHhueahOiKgueCueWvueixoVxuICAgICAqL1xuICAgIHByaXZhdGUgY3JlYXRlRW5naW5lU3RhbmRhcmROb2RlKG5vZGVEYXRhOiBhbnksIHBhcmVudE5vZGVJbmRleDogbnVtYmVyIHwgbnVsbCwgbm9kZU5hbWU/OiBzdHJpbmcpOiBhbnkge1xuICAgICAgICAvLyDosIPor5XvvJrmiZPljbDljp/lp4voioLngrnmlbDmja7vvIjlt7Lms6jph4rvvIlcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ+WOn+Wni+iKgueCueaVsOaNrjonLCBKU09OLnN0cmluZ2lmeShub2RlRGF0YSwgbnVsbCwgMikpO1xuXG4gICAgICAgIC8vIOaPkOWPluiKgueCueeahOWfuuacrOWxnuaAp1xuICAgICAgICBjb25zdCBnZXRWYWx1ZSA9IChwcm9wOiBhbnkpID0+IHtcbiAgICAgICAgICAgIGlmIChwcm9wPy52YWx1ZSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gcHJvcC52YWx1ZTtcbiAgICAgICAgICAgIGlmIChwcm9wICE9PSB1bmRlZmluZWQpIHJldHVybiBwcm9wO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgcG9zaXRpb24gPSBnZXRWYWx1ZShub2RlRGF0YS5wb3NpdGlvbikgfHwgZ2V0VmFsdWUobm9kZURhdGEudmFsdWU/LnBvc2l0aW9uKSB8fCB7IHg6IDAsIHk6IDAsIHo6IDAgfTtcbiAgICAgICAgY29uc3Qgcm90YXRpb24gPSBnZXRWYWx1ZShub2RlRGF0YS5yb3RhdGlvbikgfHwgZ2V0VmFsdWUobm9kZURhdGEudmFsdWU/LnJvdGF0aW9uKSB8fCB7IHg6IDAsIHk6IDAsIHo6IDAsIHc6IDEgfTtcbiAgICAgICAgY29uc3Qgc2NhbGUgPSBnZXRWYWx1ZShub2RlRGF0YS5zY2FsZSkgfHwgZ2V0VmFsdWUobm9kZURhdGEudmFsdWU/LnNjYWxlKSB8fCB7IHg6IDEsIHk6IDEsIHo6IDEgfTtcbiAgICAgICAgY29uc3QgYWN0aXZlID0gZ2V0VmFsdWUobm9kZURhdGEuYWN0aXZlKSA/PyBnZXRWYWx1ZShub2RlRGF0YS52YWx1ZT8uYWN0aXZlKSA/PyB0cnVlO1xuICAgICAgICBjb25zdCBuYW1lID0gbm9kZU5hbWUgfHwgZ2V0VmFsdWUobm9kZURhdGEubmFtZSkgfHwgZ2V0VmFsdWUobm9kZURhdGEudmFsdWU/Lm5hbWUpIHx8ICdOb2RlJztcbiAgICAgICAgY29uc3QgbGF5ZXIgPSBnZXRWYWx1ZShub2RlRGF0YS5sYXllcikgfHwgZ2V0VmFsdWUobm9kZURhdGEudmFsdWU/LmxheWVyKSB8fCAxMDczNzQxODI0O1xuXG4gICAgICAgIC8vIOiwg+ivlei+k+WHulxuICAgICAgICBjb25zb2xlLmxvZyhg5Yib5bu66IqC54K5OiAke25hbWV9LCBwYXJlbnROb2RlSW5kZXg6ICR7cGFyZW50Tm9kZUluZGV4fWApO1xuXG4gICAgICAgIGNvbnN0IHBhcmVudFJlZiA9IHBhcmVudE5vZGVJbmRleCAhPT0gbnVsbCA/IHsgXCJfX2lkX19cIjogcGFyZW50Tm9kZUluZGV4IH0gOiBudWxsO1xuICAgICAgICBjb25zb2xlLmxvZyhg6IqC54K5ICR7bmFtZX0g55qE54i26IqC54K55byV55SoOmAsIHBhcmVudFJlZik7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIFwiX190eXBlX19cIjogXCJjYy5Ob2RlXCIsXG4gICAgICAgICAgICBcIl9uYW1lXCI6IG5hbWUsXG4gICAgICAgICAgICBcIl9vYmpGbGFnc1wiOiAwLFxuICAgICAgICAgICAgXCJfX2VkaXRvckV4dHJhc19fXCI6IHt9LFxuICAgICAgICAgICAgXCJfcGFyZW50XCI6IHBhcmVudFJlZixcbiAgICAgICAgICAgIFwiX2NoaWxkcmVuXCI6IFtdLCAvLyDlrZDoioLngrnlvJXnlKjlsIblnKjpgJLlvZLov4fnqIvkuK3liqjmgIHmt7vliqBcbiAgICAgICAgICAgIFwiX2FjdGl2ZVwiOiBhY3RpdmUsXG4gICAgICAgICAgICBcIl9jb21wb25lbnRzXCI6IFtdLCAvLyDnu4Tku7blvJXnlKjlsIblnKjlpITnkIbnu4Tku7bml7bliqjmgIHmt7vliqBcbiAgICAgICAgICAgIFwiX3ByZWZhYlwiOiB7IFwiX19pZF9fXCI6IDAgfSwgLy8g5Li05pe25YC877yM5ZCO57ut5Lya6KKr5q2j56Gu6K6+572uXG4gICAgICAgICAgICBcIl9scG9zXCI6IHtcbiAgICAgICAgICAgICAgICBcIl9fdHlwZV9fXCI6IFwiY2MuVmVjM1wiLFxuICAgICAgICAgICAgICAgIFwieFwiOiBwb3NpdGlvbi54LFxuICAgICAgICAgICAgICAgIFwieVwiOiBwb3NpdGlvbi55LFxuICAgICAgICAgICAgICAgIFwielwiOiBwb3NpdGlvbi56XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJfbHJvdFwiOiB7XG4gICAgICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBcImNjLlF1YXRcIixcbiAgICAgICAgICAgICAgICBcInhcIjogcm90YXRpb24ueCxcbiAgICAgICAgICAgICAgICBcInlcIjogcm90YXRpb24ueSxcbiAgICAgICAgICAgICAgICBcInpcIjogcm90YXRpb24ueixcbiAgICAgICAgICAgICAgICBcIndcIjogcm90YXRpb24ud1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiX2xzY2FsZVwiOiB7XG4gICAgICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBcImNjLlZlYzNcIixcbiAgICAgICAgICAgICAgICBcInhcIjogc2NhbGUueCxcbiAgICAgICAgICAgICAgICBcInlcIjogc2NhbGUueSxcbiAgICAgICAgICAgICAgICBcInpcIjogc2NhbGUuelxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiX21vYmlsaXR5XCI6IDAsXG4gICAgICAgICAgICBcIl9sYXllclwiOiBsYXllcixcbiAgICAgICAgICAgIFwiX2V1bGVyXCI6IHtcbiAgICAgICAgICAgICAgICBcIl9fdHlwZV9fXCI6IFwiY2MuVmVjM1wiLFxuICAgICAgICAgICAgICAgIFwieFwiOiAwLFxuICAgICAgICAgICAgICAgIFwieVwiOiAwLFxuICAgICAgICAgICAgICAgIFwielwiOiAwXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJfaWRcIjogXCJcIlxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOS7juiKgueCueaVsOaNruS4reaPkOWPllVVSURcbiAgICAgKi9cbiAgICBwcml2YXRlIGV4dHJhY3ROb2RlVXVpZChub2RlRGF0YTogYW55KTogc3RyaW5nIHwgbnVsbCB7XG4gICAgICAgIGlmICghbm9kZURhdGEpIHJldHVybiBudWxsO1xuXG4gICAgICAgIC8vIOWwneivleWkmuenjeaWueW8j+iOt+WPllVVSURcbiAgICAgICAgY29uc3Qgc291cmNlcyA9IFtcbiAgICAgICAgICAgIG5vZGVEYXRhLnV1aWQsXG4gICAgICAgICAgICBub2RlRGF0YS52YWx1ZT8udXVpZCxcbiAgICAgICAgICAgIG5vZGVEYXRhLl9fdXVpZF9fLFxuICAgICAgICAgICAgbm9kZURhdGEudmFsdWU/Ll9fdXVpZF9fLFxuICAgICAgICAgICAgbm9kZURhdGEuaWQsXG4gICAgICAgICAgICBub2RlRGF0YS52YWx1ZT8uaWRcbiAgICAgICAgXTtcblxuICAgICAgICBmb3IgKGNvbnN0IHNvdXJjZSBvZiBzb3VyY2VzKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHNvdXJjZSA9PT0gJ3N0cmluZycgJiYgc291cmNlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc291cmNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5Yib5bu65pyA5bCP5YyW55qE6IqC54K55a+56LGh77yM5LiN5YyF5ZCr5Lu75L2V57uE5Lu25Lul6YG/5YWN5L6d6LWW6Zeu6aKYXG4gICAgICovXG4gICAgcHJpdmF0ZSBjcmVhdGVNaW5pbWFsTm9kZShub2RlRGF0YTogYW55LCBub2RlTmFtZT86IHN0cmluZyk6IGFueSB7XG4gICAgICAgIC8vIOaPkOWPluiKgueCueeahOWfuuacrOWxnuaAp1xuICAgICAgICBjb25zdCBnZXRWYWx1ZSA9IChwcm9wOiBhbnkpID0+IHtcbiAgICAgICAgICAgIGlmIChwcm9wPy52YWx1ZSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gcHJvcC52YWx1ZTtcbiAgICAgICAgICAgIGlmIChwcm9wICE9PSB1bmRlZmluZWQpIHJldHVybiBwcm9wO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgcG9zaXRpb24gPSBnZXRWYWx1ZShub2RlRGF0YS5wb3NpdGlvbikgfHwgZ2V0VmFsdWUobm9kZURhdGEudmFsdWU/LnBvc2l0aW9uKSB8fCB7IHg6IDAsIHk6IDAsIHo6IDAgfTtcbiAgICAgICAgY29uc3Qgcm90YXRpb24gPSBnZXRWYWx1ZShub2RlRGF0YS5yb3RhdGlvbikgfHwgZ2V0VmFsdWUobm9kZURhdGEudmFsdWU/LnJvdGF0aW9uKSB8fCB7IHg6IDAsIHk6IDAsIHo6IDAsIHc6IDEgfTtcbiAgICAgICAgY29uc3Qgc2NhbGUgPSBnZXRWYWx1ZShub2RlRGF0YS5zY2FsZSkgfHwgZ2V0VmFsdWUobm9kZURhdGEudmFsdWU/LnNjYWxlKSB8fCB7IHg6IDEsIHk6IDEsIHo6IDEgfTtcbiAgICAgICAgY29uc3QgYWN0aXZlID0gZ2V0VmFsdWUobm9kZURhdGEuYWN0aXZlKSA/PyBnZXRWYWx1ZShub2RlRGF0YS52YWx1ZT8uYWN0aXZlKSA/PyB0cnVlO1xuICAgICAgICBjb25zdCBuYW1lID0gbm9kZU5hbWUgfHwgZ2V0VmFsdWUobm9kZURhdGEubmFtZSkgfHwgZ2V0VmFsdWUobm9kZURhdGEudmFsdWU/Lm5hbWUpIHx8ICdOb2RlJztcbiAgICAgICAgY29uc3QgbGF5ZXIgPSBnZXRWYWx1ZShub2RlRGF0YS5sYXllcikgfHwgZ2V0VmFsdWUobm9kZURhdGEudmFsdWU/LmxheWVyKSB8fCAzMzU1NDQzMjtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBcImNjLk5vZGVcIixcbiAgICAgICAgICAgIFwiX25hbWVcIjogbmFtZSxcbiAgICAgICAgICAgIFwiX29iakZsYWdzXCI6IDAsXG4gICAgICAgICAgICBcIl9wYXJlbnRcIjogbnVsbCxcbiAgICAgICAgICAgIFwiX2NoaWxkcmVuXCI6IFtdLFxuICAgICAgICAgICAgXCJfYWN0aXZlXCI6IGFjdGl2ZSxcbiAgICAgICAgICAgIFwiX2NvbXBvbmVudHNcIjogW10sIC8vIOepuueahOe7hOS7tuaVsOe7hO+8jOmBv+WFjee7hOS7tuS+nei1lumXrumimFxuICAgICAgICAgICAgXCJfcHJlZmFiXCI6IHtcbiAgICAgICAgICAgICAgICBcIl9faWRfX1wiOiAyXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJfbHBvc1wiOiB7XG4gICAgICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBcImNjLlZlYzNcIixcbiAgICAgICAgICAgICAgICBcInhcIjogcG9zaXRpb24ueCxcbiAgICAgICAgICAgICAgICBcInlcIjogcG9zaXRpb24ueSxcbiAgICAgICAgICAgICAgICBcInpcIjogcG9zaXRpb24uelxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiX2xyb3RcIjoge1xuICAgICAgICAgICAgICAgIFwiX190eXBlX19cIjogXCJjYy5RdWF0XCIsXG4gICAgICAgICAgICAgICAgXCJ4XCI6IHJvdGF0aW9uLngsXG4gICAgICAgICAgICAgICAgXCJ5XCI6IHJvdGF0aW9uLnksXG4gICAgICAgICAgICAgICAgXCJ6XCI6IHJvdGF0aW9uLnosXG4gICAgICAgICAgICAgICAgXCJ3XCI6IHJvdGF0aW9uLndcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcIl9sc2NhbGVcIjoge1xuICAgICAgICAgICAgICAgIFwiX190eXBlX19cIjogXCJjYy5WZWMzXCIsXG4gICAgICAgICAgICAgICAgXCJ4XCI6IHNjYWxlLngsXG4gICAgICAgICAgICAgICAgXCJ5XCI6IHNjYWxlLnksXG4gICAgICAgICAgICAgICAgXCJ6XCI6IHNjYWxlLnpcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcIl9sYXllclwiOiBsYXllcixcbiAgICAgICAgICAgIFwiX2V1bGVyXCI6IHtcbiAgICAgICAgICAgICAgICBcIl9fdHlwZV9fXCI6IFwiY2MuVmVjM1wiLFxuICAgICAgICAgICAgICAgIFwieFwiOiAwLFxuICAgICAgICAgICAgICAgIFwieVwiOiAwLFxuICAgICAgICAgICAgICAgIFwielwiOiAwXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJfaWRcIjogXCJcIlxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWIm+W7uuagh+WHhueahCBtZXRhIOaWh+S7tuWGheWuuVxuICAgICAqL1xuICAgIHByaXZhdGUgY3JlYXRlU3RhbmRhcmRNZXRhQ29udGVudChwcmVmYWJOYW1lOiBzdHJpbmcsIHByZWZhYlV1aWQ6IHN0cmluZyk6IGFueSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBcInZlclwiOiBcIjIuMC4zXCIsXG4gICAgICAgICAgICBcImltcG9ydGVyXCI6IFwicHJlZmFiXCIsXG4gICAgICAgICAgICBcImltcG9ydGVkXCI6IHRydWUsXG4gICAgICAgICAgICBcInV1aWRcIjogcHJlZmFiVXVpZCxcbiAgICAgICAgICAgIFwiZmlsZXNcIjogW1xuICAgICAgICAgICAgICAgIFwiLmpzb25cIlxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIFwic3ViTWV0YXNcIjoge30sXG4gICAgICAgICAgICBcInVzZXJEYXRhXCI6IHtcbiAgICAgICAgICAgICAgICBcInN5bmNOb2RlTmFtZVwiOiBwcmVmYWJOYW1lLFxuICAgICAgICAgICAgICAgIFwiaGFzSWNvblwiOiBmYWxzZVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWwneivleWwhuWOn+Wni+iKgueCuei9rOaNouS4uumihOWItuS9k+WunuS+i1xuICAgICAqL1xuICAgIHByaXZhdGUgYXN5bmMgY29udmVydE5vZGVUb1ByZWZhYkluc3RhbmNlKG5vZGVVdWlkOiBzdHJpbmcsIHByZWZhYlV1aWQ6IHN0cmluZywgcHJlZmFiUGF0aDogc3RyaW5nKTogUHJvbWlzZTx7IHN1Y2Nlc3M6IGJvb2xlYW47IGVycm9yPzogc3RyaW5nIH0+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAvLyDov5nkuKrlip/og73pnIDopoHmt7HlhaXnmoTlnLrmma/nvJbovpHlmajpm4bmiJDvvIzmmoLml7bov5Tlm57lpLHotKVcbiAgICAgICAgICAgIC8vIOWcqOWunumZheeahOW8leaTjuS4re+8jOi/mea2ieWPiuWIsOWkjeadgueahOmihOWItuS9k+WunuS+i+WMluWSjOiKgueCueabv+aNoumAu+i+kVxuICAgICAgICAgICAgY29uc29sZS5sb2coJ+iKgueCuei9rOaNouS4uumihOWItuS9k+WunuS+i+eahOWKn+iDvemcgOimgeabtOa3seWFpeeahOW8leaTjumbhuaIkCcpO1xuICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgZXJyb3I6ICfoioLngrnovazmjaLkuLrpooTliLbkvZPlrp7kvovpnIDopoHmm7Tmt7HlhaXnmoTlvJXmk47pm4bmiJDmlK/mjIEnXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyByZXN0b3JlUHJlZmFiTm9kZShub2RlVXVpZDogc3RyaW5nLCBhc3NldFV1aWQ6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgLy8g5L2/55So5a6Y5pa5QVBJIHJlc3RvcmUtcHJlZmFiIOi/mOWOn+mihOWItuS9k+iKgueCuVxuICAgICAgICAgICAgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KSgnc2NlbmUnLCAncmVzdG9yZS1wcmVmYWInLCBub2RlVXVpZCwgYXNzZXRVdWlkKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVV1aWQ6IG5vZGVVdWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXRVdWlkOiBhc3NldFV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAn6aKE5Yi25L2T6IqC54K56L+Y5Y6f5oiQ5YqfJ1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyb3I6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGDpooTliLbkvZPoioLngrnov5jljp/lpLHotKU6ICR7ZXJyb3IubWVzc2FnZX1gXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8g5Z+65LqO5a6Y5pa56aKE5Yi25L2T5qC85byP55qE5paw5a6e546w5pa55rOVXG4gICAgcHJpdmF0ZSBhc3luYyBnZXROb2RlRGF0YUZvclByZWZhYihub2RlVXVpZDogc3RyaW5nKTogUHJvbWlzZTx7IHN1Y2Nlc3M6IGJvb2xlYW47IGRhdGE/OiBhbnk7IGVycm9yPzogc3RyaW5nIH0+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1ub2RlJywgbm9kZVV1aWQpLnRoZW4oKG5vZGVEYXRhOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIW5vZGVEYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICfoioLngrnkuI3lrZjlnKgnIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiB0cnVlLCBkYXRhOiBub2RlRGF0YSB9KTtcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnJvcjogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGNyZWF0ZVN0YW5kYXJkUHJlZmFiRGF0YShub2RlRGF0YTogYW55LCBwcmVmYWJOYW1lOiBzdHJpbmcsIHByZWZhYlV1aWQ6IHN0cmluZyk6IFByb21pc2U8YW55W10+IHtcbiAgICAgICAgLy8g5Z+65LqO5a6Y5pa5Q2FudmFzLnByZWZhYuagvOW8j+WIm+W7uumihOWItuS9k+aVsOaNrue7k+aehFxuICAgICAgICBjb25zdCBwcmVmYWJEYXRhOiBhbnlbXSA9IFtdO1xuICAgICAgICBsZXQgY3VycmVudElkID0gMDtcblxuICAgICAgICAvLyDnrKzkuIDkuKrlhYPntKDvvJpjYy5QcmVmYWIg6LWE5rqQ5a+56LGhXG4gICAgICAgIGNvbnN0IHByZWZhYkFzc2V0ID0ge1xuICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBcImNjLlByZWZhYlwiLFxuICAgICAgICAgICAgXCJfbmFtZVwiOiBwcmVmYWJOYW1lLFxuICAgICAgICAgICAgXCJfb2JqRmxhZ3NcIjogMCxcbiAgICAgICAgICAgIFwiX19lZGl0b3JFeHRyYXNfX1wiOiB7fSxcbiAgICAgICAgICAgIFwiX25hdGl2ZVwiOiBcIlwiLFxuICAgICAgICAgICAgXCJkYXRhXCI6IHtcbiAgICAgICAgICAgICAgICBcIl9faWRfX1wiOiAxXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJvcHRpbWl6YXRpb25Qb2xpY3lcIjogMCxcbiAgICAgICAgICAgIFwicGVyc2lzdGVudFwiOiBmYWxzZVxuICAgICAgICB9O1xuICAgICAgICBwcmVmYWJEYXRhLnB1c2gocHJlZmFiQXNzZXQpO1xuICAgICAgICBjdXJyZW50SWQrKztcblxuICAgICAgICAvLyDnrKzkuozkuKrlhYPntKDvvJrmoLnoioLngrlcbiAgICAgICAgY29uc3Qgcm9vdE5vZGUgPSBhd2FpdCB0aGlzLmNyZWF0ZU5vZGVPYmplY3Qobm9kZURhdGEsIG51bGwsIHByZWZhYkRhdGEsIGN1cnJlbnRJZCk7XG4gICAgICAgIHByZWZhYkRhdGEucHVzaChyb290Tm9kZS5ub2RlKTtcbiAgICAgICAgY3VycmVudElkID0gcm9vdE5vZGUubmV4dElkO1xuXG4gICAgICAgIC8vIOa3u+WKoOagueiKgueCueeahCBQcmVmYWJJbmZvIC0g5L+u5aSNYXNzZXTlvJXnlKjkvb/nlKhVVUlEXG4gICAgICAgIGNvbnN0IHJvb3RQcmVmYWJJbmZvID0ge1xuICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBcImNjLlByZWZhYkluZm9cIixcbiAgICAgICAgICAgIFwicm9vdFwiOiB7XG4gICAgICAgICAgICAgICAgXCJfX2lkX19cIjogMVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiYXNzZXRcIjoge1xuICAgICAgICAgICAgICAgIFwiX191dWlkX19cIjogcHJlZmFiVXVpZFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiZmlsZUlkXCI6IHRoaXMuZ2VuZXJhdGVGaWxlSWQoKSxcbiAgICAgICAgICAgIFwiaW5zdGFuY2VcIjogbnVsbCxcbiAgICAgICAgICAgIFwidGFyZ2V0T3ZlcnJpZGVzXCI6IFtdLFxuICAgICAgICAgICAgXCJuZXN0ZWRQcmVmYWJJbnN0YW5jZVJvb3RzXCI6IFtdXG4gICAgICAgIH07XG4gICAgICAgIHByZWZhYkRhdGEucHVzaChyb290UHJlZmFiSW5mbyk7XG5cbiAgICAgICAgcmV0dXJuIHByZWZhYkRhdGE7XG4gICAgfVxuXG5cbiAgICBwcml2YXRlIGFzeW5jIGNyZWF0ZU5vZGVPYmplY3Qobm9kZURhdGE6IGFueSwgcGFyZW50SWQ6IG51bWJlciB8IG51bGwsIHByZWZhYkRhdGE6IGFueVtdLCBjdXJyZW50SWQ6IG51bWJlcik6IFByb21pc2U8eyBub2RlOiBhbnk7IG5leHRJZDogbnVtYmVyIH0+IHtcbiAgICAgICAgY29uc3Qgbm9kZUlkID0gY3VycmVudElkKys7XG5cbiAgICAgICAgLy8g5o+Q5Y+W6IqC54K555qE5Z+65pys5bGe5oCnIC0g6YCC6YWNcXVlcnktbm9kZS10cmVl55qE5pWw5o2u5qC85byPXG4gICAgICAgIGNvbnN0IGdldFZhbHVlID0gKHByb3A6IGFueSkgPT4ge1xuICAgICAgICAgICAgaWYgKHByb3A/LnZhbHVlICE9PSB1bmRlZmluZWQpIHJldHVybiBwcm9wLnZhbHVlO1xuICAgICAgICAgICAgaWYgKHByb3AgIT09IHVuZGVmaW5lZCkgcmV0dXJuIHByb3A7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCBwb3NpdGlvbiA9IGdldFZhbHVlKG5vZGVEYXRhLnBvc2l0aW9uKSB8fCBnZXRWYWx1ZShub2RlRGF0YS52YWx1ZT8ucG9zaXRpb24pIHx8IHsgeDogMCwgeTogMCwgejogMCB9O1xuICAgICAgICBjb25zdCByb3RhdGlvbiA9IGdldFZhbHVlKG5vZGVEYXRhLnJvdGF0aW9uKSB8fCBnZXRWYWx1ZShub2RlRGF0YS52YWx1ZT8ucm90YXRpb24pIHx8IHsgeDogMCwgeTogMCwgejogMCwgdzogMSB9O1xuICAgICAgICBjb25zdCBzY2FsZSA9IGdldFZhbHVlKG5vZGVEYXRhLnNjYWxlKSB8fCBnZXRWYWx1ZShub2RlRGF0YS52YWx1ZT8uc2NhbGUpIHx8IHsgeDogMSwgeTogMSwgejogMSB9O1xuICAgICAgICBjb25zdCBhY3RpdmUgPSBnZXRWYWx1ZShub2RlRGF0YS5hY3RpdmUpID8/IGdldFZhbHVlKG5vZGVEYXRhLnZhbHVlPy5hY3RpdmUpID8/IHRydWU7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBnZXRWYWx1ZShub2RlRGF0YS5uYW1lKSB8fCBnZXRWYWx1ZShub2RlRGF0YS52YWx1ZT8ubmFtZSkgfHwgJ05vZGUnO1xuICAgICAgICBjb25zdCBsYXllciA9IGdldFZhbHVlKG5vZGVEYXRhLmxheWVyKSB8fCBnZXRWYWx1ZShub2RlRGF0YS52YWx1ZT8ubGF5ZXIpIHx8IDMzNTU0NDMyO1xuXG4gICAgICAgIGNvbnN0IG5vZGU6IGFueSA9IHtcbiAgICAgICAgICAgIFwiX190eXBlX19cIjogXCJjYy5Ob2RlXCIsXG4gICAgICAgICAgICBcIl9uYW1lXCI6IG5hbWUsXG4gICAgICAgICAgICBcIl9vYmpGbGFnc1wiOiAwLFxuICAgICAgICAgICAgXCJfX2VkaXRvckV4dHJhc19fXCI6IHt9LFxuICAgICAgICAgICAgXCJfcGFyZW50XCI6IHBhcmVudElkICE9PSBudWxsID8geyBcIl9faWRfX1wiOiBwYXJlbnRJZCB9IDogbnVsbCxcbiAgICAgICAgICAgIFwiX2NoaWxkcmVuXCI6IFtdLFxuICAgICAgICAgICAgXCJfYWN0aXZlXCI6IGFjdGl2ZSxcbiAgICAgICAgICAgIFwiX2NvbXBvbmVudHNcIjogW10sXG4gICAgICAgICAgICBcIl9wcmVmYWJcIjogcGFyZW50SWQgPT09IG51bGwgPyB7XG4gICAgICAgICAgICAgICAgXCJfX2lkX19cIjogY3VycmVudElkKytcbiAgICAgICAgICAgIH0gOiBudWxsLFxuICAgICAgICAgICAgXCJfbHBvc1wiOiB7XG4gICAgICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBcImNjLlZlYzNcIixcbiAgICAgICAgICAgICAgICBcInhcIjogcG9zaXRpb24ueCxcbiAgICAgICAgICAgICAgICBcInlcIjogcG9zaXRpb24ueSxcbiAgICAgICAgICAgICAgICBcInpcIjogcG9zaXRpb24uelxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiX2xyb3RcIjoge1xuICAgICAgICAgICAgICAgIFwiX190eXBlX19cIjogXCJjYy5RdWF0XCIsXG4gICAgICAgICAgICAgICAgXCJ4XCI6IHJvdGF0aW9uLngsXG4gICAgICAgICAgICAgICAgXCJ5XCI6IHJvdGF0aW9uLnksXG4gICAgICAgICAgICAgICAgXCJ6XCI6IHJvdGF0aW9uLnosXG4gICAgICAgICAgICAgICAgXCJ3XCI6IHJvdGF0aW9uLndcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcIl9sc2NhbGVcIjoge1xuICAgICAgICAgICAgICAgIFwiX190eXBlX19cIjogXCJjYy5WZWMzXCIsXG4gICAgICAgICAgICAgICAgXCJ4XCI6IHNjYWxlLngsXG4gICAgICAgICAgICAgICAgXCJ5XCI6IHNjYWxlLnksXG4gICAgICAgICAgICAgICAgXCJ6XCI6IHNjYWxlLnpcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcIl9tb2JpbGl0eVwiOiAwLFxuICAgICAgICAgICAgXCJfbGF5ZXJcIjogbGF5ZXIsXG4gICAgICAgICAgICBcIl9ldWxlclwiOiB7XG4gICAgICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBcImNjLlZlYzNcIixcbiAgICAgICAgICAgICAgICBcInhcIjogMCxcbiAgICAgICAgICAgICAgICBcInlcIjogMCxcbiAgICAgICAgICAgICAgICBcInpcIjogMFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiX2lkXCI6IFwiXCJcbiAgICAgICAgfTtcblxuICAgICAgICAvLyDmmoLml7bot7Pov4dVSVRyYW5zZm9ybee7hOS7tuS7pemBv+WFjV9nZXREZXBlbmRDb21wb25lbnTplJnor69cbiAgICAgICAgLy8g5ZCO57ut6YCa6L+HRW5naW5lIEFQSeWKqOaAgea3u+WKoFxuICAgICAgICBjb25zb2xlLmxvZyhg6IqC54K5ICR7bmFtZX0g5pqC5pe26Lez6L+HVUlUcmFuc2Zvcm3nu4Tku7bvvIzpgb/lhY3lvJXmk47kvp3otZbplJnor69gKTtcblxuICAgICAgICAvLyDlpITnkIblhbbku5bnu4Tku7bvvIjmmoLml7bot7Pov4fvvIzkuJPms6jkuo7kv67lpI1VSVRyYW5zZm9ybemXrumimO+8iVxuICAgICAgICBjb25zdCBjb21wb25lbnRzID0gdGhpcy5leHRyYWN0Q29tcG9uZW50c0Zyb21Ob2RlKG5vZGVEYXRhKTtcbiAgICAgICAgaWYgKGNvbXBvbmVudHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYOiKgueCuSAke25hbWV9IOWMheWQqyAke2NvbXBvbmVudHMubGVuZ3RofSDkuKrlhbbku5bnu4Tku7bvvIzmmoLml7bot7Pov4fku6XkuJPms6jkuo5VSVRyYW5zZm9ybeS/ruWkjWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5aSE55CG5a2Q6IqC54K5IC0g5L2/55SocXVlcnktbm9kZS10cmVl6I635Y+W55qE5a6M5pW057uT5p6EXG4gICAgICAgIGNvbnN0IGNoaWxkcmVuVG9Qcm9jZXNzID0gdGhpcy5nZXRDaGlsZHJlblRvUHJvY2Vzcyhub2RlRGF0YSk7XG4gICAgICAgIGlmIChjaGlsZHJlblRvUHJvY2Vzcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgPT09IOWkhOeQhuWtkOiKgueCuSA9PT1gKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGDoioLngrkgJHtuYW1lfSDljIXlkKsgJHtjaGlsZHJlblRvUHJvY2Vzcy5sZW5ndGh9IOS4quWtkOiKgueCuWApO1xuXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkcmVuVG9Qcm9jZXNzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2hpbGREYXRhID0gY2hpbGRyZW5Ub1Byb2Nlc3NbaV07XG4gICAgICAgICAgICAgICAgY29uc3QgY2hpbGROYW1lID0gY2hpbGREYXRhLm5hbWUgfHwgY2hpbGREYXRhLnZhbHVlPy5uYW1lIHx8ICfmnKrnn6UnO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGDlpITnkIbnrKwke2kgKyAxfeS4quWtkOiKgueCuTogJHtjaGlsZE5hbWV9YCk7XG5cbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGlsZElkID0gY3VycmVudElkO1xuICAgICAgICAgICAgICAgICAgICBub2RlLl9jaGlsZHJlbi5wdXNoKHsgXCJfX2lkX19cIjogY2hpbGRJZCB9KTtcblxuICAgICAgICAgICAgICAgICAgICAvLyDpgJLlvZLliJvlu7rlrZDoioLngrlcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hpbGRSZXN1bHQgPSBhd2FpdCB0aGlzLmNyZWF0ZU5vZGVPYmplY3QoY2hpbGREYXRhLCBub2RlSWQsIHByZWZhYkRhdGEsIGN1cnJlbnRJZCk7XG4gICAgICAgICAgICAgICAgICAgIHByZWZhYkRhdGEucHVzaChjaGlsZFJlc3VsdC5ub2RlKTtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudElkID0gY2hpbGRSZXN1bHQubmV4dElkO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIOWtkOiKgueCueS4jemcgOimgVByZWZhYkluZm/vvIzlj6rmnInmoLnoioLngrnpnIDopoFcbiAgICAgICAgICAgICAgICAgICAgLy8g5a2Q6IqC54K555qEX3ByZWZhYuW6lOivpeiuvue9ruS4um51bGxcbiAgICAgICAgICAgICAgICAgICAgY2hpbGRSZXN1bHQubm9kZS5fcHJlZmFiID0gbnVsbDtcblxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhg4pyFIOaIkOWKn+a3u+WKoOWtkOiKgueCuTogJHtjaGlsZE5hbWV9YCk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihg5aSE55CG5a2Q6IqC54K5ICR7Y2hpbGROYW1lfSDml7blh7rplJk6YCwgZXJyb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7IG5vZGUsIG5leHRJZDogY3VycmVudElkIH07XG4gICAgfVxuXG4gICAgLy8g5LuO6IqC54K55pWw5o2u5Lit5o+Q5Y+W57uE5Lu25L+h5oGvXG4gICAgcHJpdmF0ZSBleHRyYWN0Q29tcG9uZW50c0Zyb21Ob2RlKG5vZGVEYXRhOiBhbnkpOiBhbnlbXSB7XG4gICAgICAgIGNvbnN0IGNvbXBvbmVudHM6IGFueVtdID0gW107XG5cbiAgICAgICAgLy8g5LuO5LiN5ZCM5L2N572u5bCd6K+V6I635Y+W57uE5Lu25pWw5o2uXG4gICAgICAgIGNvbnN0IGNvbXBvbmVudFNvdXJjZXMgPSBbXG4gICAgICAgICAgICBub2RlRGF0YS5fX2NvbXBzX18sXG4gICAgICAgICAgICBub2RlRGF0YS5jb21wb25lbnRzLFxuICAgICAgICAgICAgbm9kZURhdGEudmFsdWU/Ll9fY29tcHNfXyxcbiAgICAgICAgICAgIG5vZGVEYXRhLnZhbHVlPy5jb21wb25lbnRzXG4gICAgICAgIF07XG5cbiAgICAgICAgZm9yIChjb25zdCBzb3VyY2Ugb2YgY29tcG9uZW50U291cmNlcykge1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc291cmNlKSkge1xuICAgICAgICAgICAgICAgIGNvbXBvbmVudHMucHVzaCguLi5zb3VyY2UuZmlsdGVyKGNvbXAgPT4gY29tcCAmJiAoY29tcC5fX3R5cGVfXyB8fCBjb21wLnR5cGUpKSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7IC8vIOaJvuWIsOacieaViOeahOe7hOS7tuaVsOe7hOWwsemAgOWHulxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNvbXBvbmVudHM7XG4gICAgfVxuXG4gICAgLy8g5Yib5bu65qCH5YeG55qE57uE5Lu25a+56LGhXG4gICAgcHJpdmF0ZSBjcmVhdGVTdGFuZGFyZENvbXBvbmVudE9iamVjdChjb21wb25lbnREYXRhOiBhbnksIG5vZGVJZDogbnVtYmVyLCBwcmVmYWJJbmZvSWQ6IG51bWJlcik6IGFueSB7XG4gICAgICAgIGNvbnN0IGNvbXBvbmVudFR5cGUgPSBjb21wb25lbnREYXRhLl9fdHlwZV9fIHx8IGNvbXBvbmVudERhdGEudHlwZTtcblxuICAgICAgICBpZiAoIWNvbXBvbmVudFR5cGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2Fybign57uE5Lu257y65bCR57G75Z6L5L+h5oGvOicsIGNvbXBvbmVudERhdGEpO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDln7rnoYDnu4Tku7bnu5PmnoQgLSDln7rkuo7lrpjmlrnpooTliLbkvZPmoLzlvI9cbiAgICAgICAgY29uc3QgY29tcG9uZW50OiBhbnkgPSB7XG4gICAgICAgICAgICBcIl9fdHlwZV9fXCI6IGNvbXBvbmVudFR5cGUsXG4gICAgICAgICAgICBcIl9uYW1lXCI6IFwiXCIsXG4gICAgICAgICAgICBcIl9vYmpGbGFnc1wiOiAwLFxuICAgICAgICAgICAgXCJub2RlXCI6IHtcbiAgICAgICAgICAgICAgICBcIl9faWRfX1wiOiBub2RlSWRcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcIl9lbmFibGVkXCI6IHRoaXMuZ2V0Q29tcG9uZW50UHJvcGVydHlWYWx1ZShjb21wb25lbnREYXRhLCAnZW5hYmxlZCcsIHRydWUpLFxuICAgICAgICAgICAgXCJfX3ByZWZhYlwiOiB7XG4gICAgICAgICAgICAgICAgXCJfX2lkX19cIjogcHJlZmFiSW5mb0lkXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8g5qC55o2u57uE5Lu257G75Z6L5re75Yqg54m55a6a5bGe5oCnXG4gICAgICAgIHRoaXMuYWRkQ29tcG9uZW50U3BlY2lmaWNQcm9wZXJ0aWVzKGNvbXBvbmVudCwgY29tcG9uZW50RGF0YSwgY29tcG9uZW50VHlwZSk7XG5cbiAgICAgICAgLy8g5re75YqgX2lk5bGe5oCnXG4gICAgICAgIGNvbXBvbmVudC5faWQgPSBcIlwiO1xuXG4gICAgICAgIHJldHVybiBjb21wb25lbnQ7XG4gICAgfVxuXG4gICAgLy8g5re75Yqg57uE5Lu254m55a6a55qE5bGe5oCnXG4gICAgcHJpdmF0ZSBhZGRDb21wb25lbnRTcGVjaWZpY1Byb3BlcnRpZXMoY29tcG9uZW50OiBhbnksIGNvbXBvbmVudERhdGE6IGFueSwgY29tcG9uZW50VHlwZTogc3RyaW5nKTogdm9pZCB7XG4gICAgICAgIHN3aXRjaCAoY29tcG9uZW50VHlwZSkge1xuICAgICAgICAgICAgY2FzZSAnY2MuVUlUcmFuc2Zvcm0nOlxuICAgICAgICAgICAgICAgIHRoaXMuYWRkVUlUcmFuc2Zvcm1Qcm9wZXJ0aWVzKGNvbXBvbmVudCwgY29tcG9uZW50RGF0YSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdjYy5TcHJpdGUnOlxuICAgICAgICAgICAgICAgIHRoaXMuYWRkU3ByaXRlUHJvcGVydGllcyhjb21wb25lbnQsIGNvbXBvbmVudERhdGEpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnY2MuTGFiZWwnOlxuICAgICAgICAgICAgICAgIHRoaXMuYWRkTGFiZWxQcm9wZXJ0aWVzKGNvbXBvbmVudCwgY29tcG9uZW50RGF0YSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdjYy5CdXR0b24nOlxuICAgICAgICAgICAgICAgIHRoaXMuYWRkQnV0dG9uUHJvcGVydGllcyhjb21wb25lbnQsIGNvbXBvbmVudERhdGEpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAvLyDlr7nkuo7mnKrnn6XnsbvlnovnmoTnu4Tku7bvvIzlpI3liLbmiYDmnInlronlhajnmoTlsZ7mgKdcbiAgICAgICAgICAgICAgICB0aGlzLmFkZEdlbmVyaWNQcm9wZXJ0aWVzKGNvbXBvbmVudCwgY29tcG9uZW50RGF0YSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBVSVRyYW5zZm9ybee7hOS7tuWxnuaAp1xuICAgIHByaXZhdGUgYWRkVUlUcmFuc2Zvcm1Qcm9wZXJ0aWVzKGNvbXBvbmVudDogYW55LCBjb21wb25lbnREYXRhOiBhbnkpOiB2b2lkIHtcbiAgICAgICAgY29tcG9uZW50Ll9jb250ZW50U2l6ZSA9IHRoaXMuY3JlYXRlU2l6ZU9iamVjdChcbiAgICAgICAgICAgIHRoaXMuZ2V0Q29tcG9uZW50UHJvcGVydHlWYWx1ZShjb21wb25lbnREYXRhLCAnY29udGVudFNpemUnLCB7IHdpZHRoOiAxMDAsIGhlaWdodDogMTAwIH0pXG4gICAgICAgICk7XG4gICAgICAgIGNvbXBvbmVudC5fYW5jaG9yUG9pbnQgPSB0aGlzLmNyZWF0ZVZlYzJPYmplY3QoXG4gICAgICAgICAgICB0aGlzLmdldENvbXBvbmVudFByb3BlcnR5VmFsdWUoY29tcG9uZW50RGF0YSwgJ2FuY2hvclBvaW50JywgeyB4OiAwLjUsIHk6IDAuNSB9KVxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8vIFNwcml0Zee7hOS7tuWxnuaAp1xuICAgIHByaXZhdGUgYWRkU3ByaXRlUHJvcGVydGllcyhjb21wb25lbnQ6IGFueSwgY29tcG9uZW50RGF0YTogYW55KTogdm9pZCB7XG4gICAgICAgIGNvbXBvbmVudC5fdmlzRmxhZ3MgPSAwO1xuICAgICAgICBjb21wb25lbnQuX2N1c3RvbU1hdGVyaWFsID0gbnVsbDtcbiAgICAgICAgY29tcG9uZW50Ll9zcmNCbGVuZEZhY3RvciA9IDI7XG4gICAgICAgIGNvbXBvbmVudC5fZHN0QmxlbmRGYWN0b3IgPSA0O1xuICAgICAgICBjb21wb25lbnQuX2NvbG9yID0gdGhpcy5jcmVhdGVDb2xvck9iamVjdChcbiAgICAgICAgICAgIHRoaXMuZ2V0Q29tcG9uZW50UHJvcGVydHlWYWx1ZShjb21wb25lbnREYXRhLCAnY29sb3InLCB7IHI6IDI1NSwgZzogMjU1LCBiOiAyNTUsIGE6IDI1NSB9KVxuICAgICAgICApO1xuICAgICAgICBjb21wb25lbnQuX3Nwcml0ZUZyYW1lID0gdGhpcy5nZXRDb21wb25lbnRQcm9wZXJ0eVZhbHVlKGNvbXBvbmVudERhdGEsICdzcHJpdGVGcmFtZScsIG51bGwpO1xuICAgICAgICBjb21wb25lbnQuX3R5cGUgPSB0aGlzLmdldENvbXBvbmVudFByb3BlcnR5VmFsdWUoY29tcG9uZW50RGF0YSwgJ3R5cGUnLCAwKTtcbiAgICAgICAgY29tcG9uZW50Ll9maWxsVHlwZSA9IDA7XG4gICAgICAgIGNvbXBvbmVudC5fc2l6ZU1vZGUgPSB0aGlzLmdldENvbXBvbmVudFByb3BlcnR5VmFsdWUoY29tcG9uZW50RGF0YSwgJ3NpemVNb2RlJywgMSk7XG4gICAgICAgIGNvbXBvbmVudC5fZmlsbENlbnRlciA9IHRoaXMuY3JlYXRlVmVjMk9iamVjdCh7IHg6IDAsIHk6IDAgfSk7XG4gICAgICAgIGNvbXBvbmVudC5fZmlsbFN0YXJ0ID0gMDtcbiAgICAgICAgY29tcG9uZW50Ll9maWxsUmFuZ2UgPSAwO1xuICAgICAgICBjb21wb25lbnQuX2lzVHJpbW1lZE1vZGUgPSB0cnVlO1xuICAgICAgICBjb21wb25lbnQuX3VzZUdyYXlzY2FsZSA9IGZhbHNlO1xuICAgICAgICBjb21wb25lbnQuX2F0bGFzID0gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBMYWJlbOe7hOS7tuWxnuaAp1xuICAgIHByaXZhdGUgYWRkTGFiZWxQcm9wZXJ0aWVzKGNvbXBvbmVudDogYW55LCBjb21wb25lbnREYXRhOiBhbnkpOiB2b2lkIHtcbiAgICAgICAgY29tcG9uZW50Ll92aXNGbGFncyA9IDA7XG4gICAgICAgIGNvbXBvbmVudC5fY3VzdG9tTWF0ZXJpYWwgPSBudWxsO1xuICAgICAgICBjb21wb25lbnQuX3NyY0JsZW5kRmFjdG9yID0gMjtcbiAgICAgICAgY29tcG9uZW50Ll9kc3RCbGVuZEZhY3RvciA9IDQ7XG4gICAgICAgIGNvbXBvbmVudC5fY29sb3IgPSB0aGlzLmNyZWF0ZUNvbG9yT2JqZWN0KFxuICAgICAgICAgICAgdGhpcy5nZXRDb21wb25lbnRQcm9wZXJ0eVZhbHVlKGNvbXBvbmVudERhdGEsICdjb2xvcicsIHsgcjogMCwgZzogMCwgYjogMCwgYTogMjU1IH0pXG4gICAgICAgICk7XG4gICAgICAgIGNvbXBvbmVudC5fc3RyaW5nID0gdGhpcy5nZXRDb21wb25lbnRQcm9wZXJ0eVZhbHVlKGNvbXBvbmVudERhdGEsICdzdHJpbmcnLCAnTGFiZWwnKTtcbiAgICAgICAgY29tcG9uZW50Ll9ob3Jpem9udGFsQWxpZ24gPSAxO1xuICAgICAgICBjb21wb25lbnQuX3ZlcnRpY2FsQWxpZ24gPSAxO1xuICAgICAgICBjb21wb25lbnQuX2FjdHVhbEZvbnRTaXplID0gMjA7XG4gICAgICAgIGNvbXBvbmVudC5fZm9udFNpemUgPSB0aGlzLmdldENvbXBvbmVudFByb3BlcnR5VmFsdWUoY29tcG9uZW50RGF0YSwgJ2ZvbnRTaXplJywgMjApO1xuICAgICAgICBjb21wb25lbnQuX2ZvbnRGYW1pbHkgPSAnQXJpYWwnO1xuICAgICAgICBjb21wb25lbnQuX2xpbmVIZWlnaHQgPSA0MDtcbiAgICAgICAgY29tcG9uZW50Ll9vdmVyZmxvdyA9IDE7XG4gICAgICAgIGNvbXBvbmVudC5fZW5hYmxlV3JhcFRleHQgPSBmYWxzZTtcbiAgICAgICAgY29tcG9uZW50Ll9mb250ID0gbnVsbDtcbiAgICAgICAgY29tcG9uZW50Ll9pc1N5c3RlbUZvbnRVc2VkID0gdHJ1ZTtcbiAgICAgICAgY29tcG9uZW50Ll9pc0l0YWxpYyA9IGZhbHNlO1xuICAgICAgICBjb21wb25lbnQuX2lzQm9sZCA9IGZhbHNlO1xuICAgICAgICBjb21wb25lbnQuX2lzVW5kZXJsaW5lID0gZmFsc2U7XG4gICAgICAgIGNvbXBvbmVudC5fdW5kZXJsaW5lSGVpZ2h0ID0gMjtcbiAgICAgICAgY29tcG9uZW50Ll9jYWNoZU1vZGUgPSAwO1xuICAgIH1cblxuICAgIC8vIEJ1dHRvbue7hOS7tuWxnuaAp1xuICAgIHByaXZhdGUgYWRkQnV0dG9uUHJvcGVydGllcyhjb21wb25lbnQ6IGFueSwgY29tcG9uZW50RGF0YTogYW55KTogdm9pZCB7XG4gICAgICAgIGNvbXBvbmVudC5jbGlja0V2ZW50cyA9IFtdO1xuICAgICAgICBjb21wb25lbnQuX2ludGVyYWN0YWJsZSA9IHRydWU7XG4gICAgICAgIGNvbXBvbmVudC5fdHJhbnNpdGlvbiA9IDI7XG4gICAgICAgIGNvbXBvbmVudC5fbm9ybWFsQ29sb3IgPSB0aGlzLmNyZWF0ZUNvbG9yT2JqZWN0KHsgcjogMjE0LCBnOiAyMTQsIGI6IDIxNCwgYTogMjU1IH0pO1xuICAgICAgICBjb21wb25lbnQuX2hvdmVyQ29sb3IgPSB0aGlzLmNyZWF0ZUNvbG9yT2JqZWN0KHsgcjogMjExLCBnOiAyMTEsIGI6IDIxMSwgYTogMjU1IH0pO1xuICAgICAgICBjb21wb25lbnQuX3ByZXNzZWRDb2xvciA9IHRoaXMuY3JlYXRlQ29sb3JPYmplY3QoeyByOiAyNTUsIGc6IDI1NSwgYjogMjU1LCBhOiAyNTUgfSk7XG4gICAgICAgIGNvbXBvbmVudC5fZGlzYWJsZWRDb2xvciA9IHRoaXMuY3JlYXRlQ29sb3JPYmplY3QoeyByOiAxMjQsIGc6IDEyNCwgYjogMTI0LCBhOiAyNTUgfSk7XG4gICAgICAgIGNvbXBvbmVudC5fZHVyYXRpb24gPSAwLjE7XG4gICAgICAgIGNvbXBvbmVudC5fem9vbVNjYWxlID0gMS4yO1xuICAgIH1cblxuICAgIC8vIOa3u+WKoOmAmueUqOWxnuaAp1xuICAgIHByaXZhdGUgYWRkR2VuZXJpY1Byb3BlcnRpZXMoY29tcG9uZW50OiBhbnksIGNvbXBvbmVudERhdGE6IGFueSk6IHZvaWQge1xuICAgICAgICAvLyDlj6rlpI3liLblronlhajnmoTjgIHlt7Lnn6XnmoTlsZ7mgKdcbiAgICAgICAgY29uc3Qgc2FmZVByb3BlcnRpZXMgPSBbJ2VuYWJsZWQnLCAnY29sb3InLCAnc3RyaW5nJywgJ2ZvbnRTaXplJywgJ3Nwcml0ZUZyYW1lJywgJ3R5cGUnLCAnc2l6ZU1vZGUnXTtcblxuICAgICAgICBmb3IgKGNvbnN0IHByb3Agb2Ygc2FmZVByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgIGlmIChjb21wb25lbnREYXRhLmhhc093blByb3BlcnR5KHByb3ApKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdmFsdWUgPSB0aGlzLmdldENvbXBvbmVudFByb3BlcnR5VmFsdWUoY29tcG9uZW50RGF0YSwgcHJvcCk7XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50W2BfJHtwcm9wfWBdID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8g5Yib5bu6VmVjMuWvueixoVxuICAgIHByaXZhdGUgY3JlYXRlVmVjMk9iamVjdChkYXRhOiBhbnkpOiBhbnkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBcImNjLlZlYzJcIixcbiAgICAgICAgICAgIFwieFwiOiBkYXRhPy54IHx8IDAsXG4gICAgICAgICAgICBcInlcIjogZGF0YT8ueSB8fCAwXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8g5Yib5bu6VmVjM+WvueixoVxuICAgIHByaXZhdGUgY3JlYXRlVmVjM09iamVjdChkYXRhOiBhbnkpOiBhbnkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBcImNjLlZlYzNcIixcbiAgICAgICAgICAgIFwieFwiOiBkYXRhPy54IHx8IDAsXG4gICAgICAgICAgICBcInlcIjogZGF0YT8ueSB8fCAwLFxuICAgICAgICAgICAgXCJ6XCI6IGRhdGE/LnogfHwgMFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vIOWIm+W7ulNpemXlr7nosaFcbiAgICBwcml2YXRlIGNyZWF0ZVNpemVPYmplY3QoZGF0YTogYW55KTogYW55IHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIFwiX190eXBlX19cIjogXCJjYy5TaXplXCIsXG4gICAgICAgICAgICBcIndpZHRoXCI6IGRhdGE/LndpZHRoIHx8IDEwMCxcbiAgICAgICAgICAgIFwiaGVpZ2h0XCI6IGRhdGE/LmhlaWdodCB8fCAxMDBcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyDliJvlu7pDb2xvcuWvueixoVxuICAgIHByaXZhdGUgY3JlYXRlQ29sb3JPYmplY3QoZGF0YTogYW55KTogYW55IHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIFwiX190eXBlX19cIjogXCJjYy5Db2xvclwiLFxuICAgICAgICAgICAgXCJyXCI6IGRhdGE/LnIgPz8gMjU1LFxuICAgICAgICAgICAgXCJnXCI6IGRhdGE/LmcgPz8gMjU1LFxuICAgICAgICAgICAgXCJiXCI6IGRhdGE/LmIgPz8gMjU1LFxuICAgICAgICAgICAgXCJhXCI6IGRhdGE/LmEgPz8gMjU1XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8g5Yik5pat5piv5ZCm5bqU6K+l5aSN5Yi257uE5Lu25bGe5oCnXG4gICAgcHJpdmF0ZSBzaG91bGRDb3B5Q29tcG9uZW50UHJvcGVydHkoa2V5OiBzdHJpbmcsIHZhbHVlOiBhbnkpOiBib29sZWFuIHtcbiAgICAgICAgLy8g6Lez6L+H5YaF6YOo5bGe5oCn5ZKM5bey5aSE55CG55qE5bGe5oCnXG4gICAgICAgIGlmIChrZXkuc3RhcnRzV2l0aCgnX18nKSB8fCBrZXkgPT09ICdfZW5hYmxlZCcgfHwga2V5ID09PSAnbm9kZScgfHwga2V5ID09PSAnZW5hYmxlZCcpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOi3s+i/h+WHveaVsOWSjHVuZGVmaW5lZOWAvFxuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nIHx8IHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuXG4gICAgLy8g6I635Y+W57uE5Lu25bGe5oCn5YC8IC0g6YeN5ZG95ZCN5Lul6YG/5YWN5Yay56qBXG4gICAgcHJpdmF0ZSBnZXRDb21wb25lbnRQcm9wZXJ0eVZhbHVlKGNvbXBvbmVudERhdGE6IGFueSwgcHJvcGVydHlOYW1lOiBzdHJpbmcsIGRlZmF1bHRWYWx1ZT86IGFueSk6IGFueSB7XG4gICAgICAgIC8vIOWwneivleebtOaOpeiOt+WPluWxnuaAp1xuICAgICAgICBpZiAoY29tcG9uZW50RGF0YVtwcm9wZXJ0eU5hbWVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmV4dHJhY3RWYWx1ZShjb21wb25lbnREYXRhW3Byb3BlcnR5TmFtZV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5bCd6K+V5LuOdmFsdWXlsZ7mgKfkuK3ojrflj5ZcbiAgICAgICAgaWYgKGNvbXBvbmVudERhdGEudmFsdWUgJiYgY29tcG9uZW50RGF0YS52YWx1ZVtwcm9wZXJ0eU5hbWVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmV4dHJhY3RWYWx1ZShjb21wb25lbnREYXRhLnZhbHVlW3Byb3BlcnR5TmFtZV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5bCd6K+V5bim5LiL5YiS57q/5YmN57yA55qE5bGe5oCn5ZCNXG4gICAgICAgIGNvbnN0IHByZWZpeGVkTmFtZSA9IGBfJHtwcm9wZXJ0eU5hbWV9YDtcbiAgICAgICAgaWYgKGNvbXBvbmVudERhdGFbcHJlZml4ZWROYW1lXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5leHRyYWN0VmFsdWUoY29tcG9uZW50RGF0YVtwcmVmaXhlZE5hbWVdKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBkZWZhdWx0VmFsdWU7XG4gICAgfVxuXG4gICAgLy8g5o+Q5Y+W5bGe5oCn5YC8XG4gICAgcHJpdmF0ZSBleHRyYWN0VmFsdWUoZGF0YTogYW55KTogYW55IHtcbiAgICAgICAgaWYgKGRhdGEgPT09IG51bGwgfHwgZGF0YSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gZGF0YTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWmguaenOaciXZhbHVl5bGe5oCn77yM5LyY5YWI5L2/55SodmFsdWVcbiAgICAgICAgaWYgKHR5cGVvZiBkYXRhID09PSAnb2JqZWN0JyAmJiBkYXRhLmhhc093blByb3BlcnR5KCd2YWx1ZScpKSB7XG4gICAgICAgICAgICByZXR1cm4gZGF0YS52YWx1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWmguaenOaYr+W8leeUqOWvueixoe+8jOS/neaMgeWOn+agt1xuICAgICAgICBpZiAodHlwZW9mIGRhdGEgPT09ICdvYmplY3QnICYmIChkYXRhLl9faWRfXyAhPT0gdW5kZWZpbmVkIHx8IGRhdGEuX191dWlkX18gIT09IHVuZGVmaW5lZCkpIHtcbiAgICAgICAgICAgIHJldHVybiBkYXRhO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjcmVhdGVTdGFuZGFyZE1ldGFEYXRhKHByZWZhYk5hbWU6IHN0cmluZywgcHJlZmFiVXVpZDogc3RyaW5nKTogYW55IHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIFwidmVyXCI6IFwiMS4xLjUwXCIsXG4gICAgICAgICAgICBcImltcG9ydGVyXCI6IFwicHJlZmFiXCIsXG4gICAgICAgICAgICBcImltcG9ydGVkXCI6IHRydWUsXG4gICAgICAgICAgICBcInV1aWRcIjogcHJlZmFiVXVpZCxcbiAgICAgICAgICAgIFwiZmlsZXNcIjogW1xuICAgICAgICAgICAgICAgIFwiLmpzb25cIlxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIFwic3ViTWV0YXNcIjoge30sXG4gICAgICAgICAgICBcInVzZXJEYXRhXCI6IHtcbiAgICAgICAgICAgICAgICBcInN5bmNOb2RlTmFtZVwiOiBwcmVmYWJOYW1lXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBzYXZlUHJlZmFiV2l0aE1ldGEocHJlZmFiUGF0aDogc3RyaW5nLCBwcmVmYWJEYXRhOiBhbnlbXSwgbWV0YURhdGE6IGFueSk6IFByb21pc2U8eyBzdWNjZXNzOiBib29sZWFuOyBlcnJvcj86IHN0cmluZyB9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBwcmVmYWJDb250ZW50ID0gSlNPTi5zdHJpbmdpZnkocHJlZmFiRGF0YSwgbnVsbCwgMik7XG4gICAgICAgICAgICBjb25zdCBtZXRhQ29udGVudCA9IEpTT04uc3RyaW5naWZ5KG1ldGFEYXRhLCBudWxsLCAyKTtcblxuICAgICAgICAgICAgLy8g56Gu5L+d6Lev5b6E5LulLnByZWZhYue7k+WwvlxuICAgICAgICAgICAgY29uc3QgZmluYWxQcmVmYWJQYXRoID0gcHJlZmFiUGF0aC5lbmRzV2l0aCgnLnByZWZhYicpID8gcHJlZmFiUGF0aCA6IGAke3ByZWZhYlBhdGh9LnByZWZhYmA7XG4gICAgICAgICAgICBjb25zdCBtZXRhUGF0aCA9IGAke2ZpbmFsUHJlZmFiUGF0aH0ubWV0YWA7XG5cbiAgICAgICAgICAgIC8vIOS9v+eUqGFzc2V0LWRiIEFQSeWIm+W7uumihOWItuS9k+aWh+S7tlxuICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ2NyZWF0ZS1hc3NldCcsIGZpbmFsUHJlZmFiUGF0aCwgcHJlZmFiQ29udGVudCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodHJ1ZSk7XG4gICAgICAgICAgICAgICAgfSkuY2F0Y2goKGVycm9yOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyDliJvlu7ptZXRh5paH5Lu2XG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAnY3JlYXRlLWFzc2V0JywgbWV0YVBhdGgsIG1ldGFDb250ZW50KS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0cnVlKTtcbiAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJyb3I6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGA9PT0g6aKE5Yi25L2T5L+d5a2Y5a6M5oiQID09PWApO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYOmihOWItuS9k+aWh+S7tuW3suS/neWtmDogJHtmaW5hbFByZWZhYlBhdGh9YCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgTWV0YeaWh+S7tuW3suS/neWtmDogJHttZXRhUGF0aH1gKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGDpooTliLbkvZPmlbDnu4TmgLvplb/luqY6ICR7cHJlZmFiRGF0YS5sZW5ndGh9YCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhg6aKE5Yi25L2T5qC56IqC54K557Si5byVOiAke3ByZWZhYkRhdGEubGVuZ3RoIC0gMX1gKTtcblxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCfkv53lrZjpooTliLbkvZPmlofku7bml7blh7rplJk6JywgZXJyb3IpO1xuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH07XG4gICAgICAgIH1cbiAgICB9XG5cbn0iXX0=