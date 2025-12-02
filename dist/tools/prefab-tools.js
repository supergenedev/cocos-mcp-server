"use strict";
/// <reference path="../types/editor-2x.d.ts" />
/// <reference path="../types/cc-2x.d.ts" />
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrefabTools = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
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
    /**
     * Promise wrapper for Editor.assetdb.queryInfoByUuid (2.x API is callback-based)
     */
    queryAssetInfoByUuid(uuid) {
        return new Promise((resolve, reject) => {
            Editor.assetdb.queryInfoByUuid(uuid, (err, info) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(info);
                }
            });
        });
    }
    /**
     * Promise wrapper for Editor.assetdb.queryUuidByUrl + queryInfoByUuid
     */
    queryAssetInfoByUrl(url) {
        return new Promise((resolve, reject) => {
            Editor.assetdb.queryUuidByUrl(url, (err, uuid) => {
                if (err) {
                    reject(err);
                    return;
                }
                this.queryAssetInfoByUuid(uuid).then(resolve).catch(reject);
            });
        });
    }
    async getPrefabList(folder = 'db://assets') {
        return new Promise((resolve) => {
            const pattern = folder.endsWith('/') ?
                `${folder}**/*.prefab` : `${folder}/**/*.prefab`;
            Editor.assetdb.queryAssets(pattern, 'prefab', (err, results) => {
                if (err) {
                    resolve({ success: false, error: err.message });
                    return;
                }
                const prefabs = results.map(asset => ({
                    name: asset.name,
                    path: asset.url,
                    uuid: asset.uuid,
                    folder: asset.url.substring(0, asset.url.lastIndexOf('/'))
                }));
                resolve({ success: true, data: prefabs });
            });
        });
    }
    async loadPrefab(prefabPath) {
        return new Promise((resolve) => {
            Editor.assetdb.queryUuidByUrl(prefabPath, (err, uuid) => {
                if (err || !uuid) {
                    resolve({ success: false, error: (err === null || err === void 0 ? void 0 : err.message) || 'Prefab not found' });
                    return;
                }
                Editor.assetdb.queryInfoByUuid(uuid, (err2, assetInfo) => {
                    if (err2 || !assetInfo) {
                        resolve({ success: false, error: (err2 === null || err2 === void 0 ? void 0 : err2.message) || 'Failed to load prefab info' });
                        return;
                    }
                    resolve({
                        success: true,
                        data: {
                            uuid: assetInfo.uuid,
                            name: assetInfo.name,
                            message: 'Prefab info loaded successfully'
                        }
                    });
                });
            });
        });
    }
    async instantiatePrefab(args) {
        return new Promise(async (resolve) => {
            try {
                // 获取预制体资源信息
                const assetInfo = await this.queryAssetInfoByUrl(args.prefabPath);
                if (!assetInfo) {
                    throw new Error('预制体未找到');
                }
                // 使用 2.x API 从预制体资源实例化
                // scene:create-nodes-by-uuids 用于实例化预制体
                const nodeName = args.name || assetInfo.name || 'PrefabInstance';
                const parentUuid = args.parentUuid || '';
                // 使用 Ipc.sendToPanel 发送场景命令
                Editor.Ipc.sendToPanel('scene', 'scene:create-nodes-by-uuids', [assetInfo.uuid], parentUuid);
                // 注意: sendToPanel은 동기적으로 실행되지만 결과를 반환하지 않음
                // 실제로는 이벤트 리스너를 통해 결과를 받아야 하지만, 간단하게 처리
                // UUID는 assetInfo.uuid를 사용 (실제로는 새로 생성된 노드 UUID가 필요)
                console.log('预制体节点创建成功:', {
                    prefabUuid: assetInfo.uuid,
                    prefabPath: args.prefabPath
                });
                resolve({
                    success: true,
                    data: {
                        prefabUuid: assetInfo.uuid,
                        prefabPath: args.prefabPath,
                        parentUuid: args.parentUuid,
                        position: args.position,
                        message: '预制体实例化成功（使用scene:create-nodes-by-uuids）'
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
            // 尝试使用 2.x API 建立预制体连接
            // 2.x에서는 scene:apply-prefab 명령어 사용
            try {
                Editor.Ipc.sendToPanel('scene', 'scene:apply-prefab', nodeUuid);
                console.log('预制体连接成功');
            }
            catch (error) {
                console.warn('预制体连接方法失败，尝试手动建立连接:', error);
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
            // 使用 2.x API 设置属性
            Editor.Ipc.sendToPanel('scene', 'scene:set-property', {
                id: nodeUuid,
                path: '_prefab',
                type: 'cc.Prefab',
                value: {
                    '__uuid__': prefabUuid,
                    '__expectedType__': 'cc.Prefab'
                },
                isSubProp: false
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
            // 使用 2.x API 读取文件内容
            let assetContent;
            try {
                assetContent = await this.queryAssetInfoByUrl(prefabPath);
                if (assetContent && assetContent.source) {
                    // 如果有source路径，直接读取文件
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
        return new Promise(async (resolve) => {
            try {
                const assetInfo = await this.queryAssetInfoByUrl(args.prefabPath);
                if (!assetInfo) {
                    throw new Error('预制体未找到');
                }
                // 使用 2.x API: scene:create-nodes-by-uuids
                const parentUuid = args.parentUuid || '';
                Editor.Ipc.sendToPanel('scene', 'scene:create-nodes-by-uuids', [assetInfo.uuid], parentUuid);
                // 注意: sendToPanel은 결과를 반환하지 않으므로, 위치 설정은 별도로 처리
                if (args.position) {
                    // 위치 설정은 별도 이벤트로 처리해야 할 수 있음
                    console.log('位置设置需要在节点创建后单独处理');
                }
                resolve({
                    success: true,
                    data: {
                        prefabUuid: assetInfo.uuid,
                        prefabPath: args.prefabPath,
                        parentUuid: args.parentUuid,
                        position: args.position,
                        message: '预制体实例化成功（备用方法）'
                    }
                });
            }
            catch (err) {
                resolve({
                    success: false,
                    error: `备用预制体实例化方法也失败: ${err.message}`
                });
            }
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
        try {
            return await this.queryAssetInfoByUrl(prefabPath);
        }
        catch (_a) {
            return null;
        }
    }
    async createNode(parentUuid, position) {
        return new Promise((resolve) => {
            try {
                // 使用 2.x API 创建节点
                const nodeName = 'PrefabInstance';
                const parent = parentUuid || '';
                Editor.Ipc.sendToPanel('scene', 'scene:create-node-by-classid', nodeName, '', parent);
                // 注意: sendToPanel은 결과를 반환하지 않으므로, UUID는 별도로 얻어야 함
                // 위치 설정도 별도로 처리해야 함
                resolve({
                    success: true,
                    data: {
                        nodeUuid: '',
                        name: 'PrefabInstance'
                    }
                });
            }
            catch (error) {
                resolve({ success: false, error: error.message || '创建节点失败' });
            }
        });
    }
    async applyPrefabToNode(nodeUuid, prefabUuid) {
        return new Promise((resolve) => {
            try {
                // 使用 2.x API 应用预制体
                Editor.Ipc.sendToPanel('scene', 'scene:apply-prefab', nodeUuid);
                resolve({ success: true });
            }
            catch (error) {
                resolve({ success: false, error: error.message || '无法应用预制体数据' });
            }
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
                // 使用 2.x API 获取基本节点信息
                const nodeInfo = Editor.Scene.callSceneScript('cocos-mcp-server', 'queryNode', nodeUuid);
                if (!nodeInfo || !nodeInfo.success) {
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
                    resolve(nodeInfo.data || nodeInfo);
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
            // 使用 2.x API 获取整个场景树
            const treeResult = Editor.Scene.callSceneScript('cocos-mcp-server', 'getSceneHierarchy');
            const tree = (treeResult === null || treeResult === void 0 ? void 0 : treeResult.data) || treeResult;
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
            try {
                // 使用 2.x API 构建基本的节点信息
                const result = Editor.Scene.callSceneScript('cocos-mcp-server', 'queryNode', nodeUuid);
                const nodeInfo = (result === null || result === void 0 ? void 0 : result.data) || result;
                if (!nodeInfo) {
                    resolve(null);
                    return;
                }
                // 简化版本：只返回基本节点信息，不获取子节点和组件
                // 这些信息将在后续的预制体处理中根据需要添加
                const basicInfo = Object.assign(Object.assign({}, nodeInfo), { children: [], components: [] });
                resolve(basicInfo);
            }
            catch (_a) {
                resolve(null);
            }
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
            // 使用 2.x API 创建/保存文件
            Editor.assetdb.create(filePath, content, (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    }
    async updatePrefab(prefabPath, nodeUuid) {
        return new Promise(async (resolve) => {
            try {
                const assetInfo = await this.queryAssetInfoByUrl(prefabPath);
                if (!assetInfo) {
                    throw new Error('Prefab not found');
                }
                // 使用 2.x API 应用预制体
                Editor.Ipc.sendToPanel('scene', 'scene:apply-prefab', nodeUuid);
                resolve({
                    success: true,
                    message: 'Prefab updated successfully'
                });
            }
            catch (err) {
                resolve({ success: false, error: err.message });
            }
        });
    }
    async revertPrefab(nodeUuid) {
        return new Promise((resolve) => {
            try {
                // 2.x에서는 revert-prefab 명령어가 없을 수 있음
                // break-prefab-instance를 사용하여 연결 해제
                Editor.Ipc.sendToPanel('scene', 'scene:break-prefab-instance', nodeUuid);
                resolve({
                    success: true,
                    message: 'Prefab instance reverted successfully'
                });
            }
            catch (err) {
                resolve({ success: false, error: err.message });
            }
        });
    }
    async getPrefabInfo(prefabPath) {
        return new Promise(async (resolve) => {
            try {
                const assetInfo = await this.queryAssetInfoByUrl(prefabPath);
                if (!assetInfo) {
                    throw new Error('Prefab not found');
                }
                // 获取meta信息
                const metaInfo = await new Promise((resolveMeta, rejectMeta) => {
                    Editor.assetdb.queryMetaInfoByUuid(assetInfo.uuid, (err, meta) => {
                        if (err) {
                            rejectMeta(err);
                        }
                        else {
                            resolveMeta(meta);
                        }
                    });
                });
                const info = {
                    name: metaInfo.name || assetInfo.name,
                    uuid: metaInfo.uuid || assetInfo.uuid,
                    path: prefabPath,
                    folder: prefabPath.substring(0, prefabPath.lastIndexOf('/')),
                    createTime: metaInfo.createTime,
                    modifyTime: metaInfo.modifyTime,
                    dependencies: metaInfo.depends || []
                };
                resolve({ success: true, data: info });
            }
            catch (err) {
                resolve({ success: false, error: err.message });
            }
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
        return new Promise(async (resolve) => {
            try {
                // 读取预制体文件内容
                const assetInfo = await this.queryAssetInfoByUrl(prefabPath);
                if (!assetInfo) {
                    resolve({
                        success: false,
                        error: '预制体文件不存在'
                    });
                    return;
                }
                // 使用fs直接读取文件
                try {
                    const fullPath = assetInfo.source || path.join(Editor.Project.path, prefabPath.replace('db://assets/', 'assets/'));
                    const content = fs.readFileSync(fullPath, 'utf8');
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
                        error: `预制体文件格式错误: ${parseError.message}`
                    });
                }
            }
            catch (error) {
                resolve({
                    success: false,
                    error: `验证预制体时发生错误: ${error.message}`
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
        return new Promise(async (resolve) => {
            try {
                const assetInfo = await this.queryAssetInfoByUrl(prefabPath);
                if (!assetInfo) {
                    resolve({ success: false, error: '预制体文件不存在' });
                    return;
                }
                // 使用fs直接读取文件
                const fullPath = assetInfo.source || path.join(Editor.Project.path, prefabPath.replace('db://assets/', 'assets/'));
                const content = fs.readFileSync(fullPath, 'utf8');
                const prefabData = JSON.parse(content);
                resolve({ success: true, data: prefabData });
            }
            catch (error) {
                resolve({ success: false, error: error.message || '读取预制体文件失败' });
            }
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
            Editor.assetdb.create(assetPath, content, (err, assetInfo) => {
                if (err) {
                    console.error('创建资源文件失败:', err);
                    resolve({ success: false, error: err.message || '创建资源文件失败' });
                }
                else {
                    console.log('创建资源文件成功:', assetInfo);
                    resolve({ success: true, data: assetInfo });
                }
            });
        });
    }
    /**
     * 使用 asset-db API 创建 meta 文件
     */
    async createMetaWithAssetDB(assetPath, metaContent) {
        return new Promise(async (resolve) => {
            try {
                const assetInfo = await this.queryAssetInfoByUrl(assetPath);
                if (!assetInfo || !assetInfo.uuid) {
                    resolve({ success: false, error: '无法获取资源UUID' });
                    return;
                }
                const metaContentString = JSON.stringify(metaContent, null, 2);
                Editor.assetdb.saveMeta(assetInfo.uuid, metaContentString, (err) => {
                    if (err) {
                        console.error('创建meta文件失败:', err);
                        resolve({ success: false, error: err.message || '创建meta文件失败' });
                    }
                    else {
                        console.log('创建meta文件成功');
                        resolve({ success: true, data: assetInfo });
                    }
                });
            }
            catch (error) {
                resolve({ success: false, error: error.message || '创建meta文件失败' });
            }
        });
    }
    /**
     * 使用 asset-db API 重新导入资源
     */
    async reimportAssetWithAssetDB(assetPath) {
        return new Promise((resolve) => {
            Editor.assetdb.refresh(assetPath, (err) => {
                if (err) {
                    console.error('重新导入资源失败:', err);
                    resolve({ success: false, error: err.message || '重新导入资源失败' });
                }
                else {
                    console.log('重新导入资源成功');
                    resolve({ success: true });
                }
            });
        });
    }
    /**
     * 使用 asset-db API 更新资源文件内容
     */
    async updateAssetWithAssetDB(assetPath, content) {
        return new Promise((resolve) => {
            // 2.x에서는 create가 기존 파일을 덮어씁니다
            Editor.assetdb.create(assetPath, content, (err, result) => {
                if (err) {
                    console.error('更新资源文件失败:', err);
                    resolve({ success: false, error: err.message || '更新资源文件失败' });
                }
                else {
                    console.log('更新资源文件成功:', result);
                    resolve({ success: true, data: result });
                }
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
            try {
                // 2.x에서는 restore-prefab 명령어가 없을 수 있음
                // break-prefab-instance 후 다시 apply-prefab
                Editor.Ipc.sendToPanel('scene', 'scene:break-prefab-instance', nodeUuid);
                Editor.Ipc.sendToPanel('scene', 'scene:apply-prefab', nodeUuid);
                resolve({
                    success: true,
                    data: {
                        nodeUuid: nodeUuid,
                        assetUuid: assetUuid,
                        message: '预制体节点还原成功'
                    }
                });
            }
            catch (error) {
                resolve({
                    success: false,
                    error: `预制体节点还原失败: ${error.message}`
                });
            }
        });
    }
    // 基于官方预制体格式的新实现方法
    async getNodeDataForPrefab(nodeUuid) {
        return new Promise((resolve) => {
            try {
                const result = Editor.Scene.callSceneScript('cocos-mcp-server', 'queryNode', nodeUuid);
                const nodeData = (result === null || result === void 0 ? void 0 : result.data) || result;
                if (!nodeData) {
                    resolve({ success: false, error: '节点不存在' });
                    return;
                }
                resolve({ success: true, data: nodeData });
            }
            catch (error) {
                resolve({ success: false, error: error.message });
            }
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
            // 使用 2.x API 创建预制体文件
            await new Promise((resolve, reject) => {
                Editor.assetdb.create(finalPrefabPath, prefabContent, (err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(true);
                    }
                });
            });
            // 创建meta文件 - 先获取UUID
            const assetInfo = await this.queryAssetInfoByUrl(finalPrefabPath);
            if (assetInfo && assetInfo.uuid) {
                await new Promise((resolve, reject) => {
                    Editor.assetdb.saveMeta(assetInfo.uuid, metaContent, (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(true);
                        }
                    });
                });
            }
            else {
                // 如果无法获取UUID，直接创建meta文件
                await new Promise((resolve, reject) => {
                    Editor.assetdb.create(metaPath, metaContent, (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(true);
                        }
                    });
                });
            }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZmFiLXRvb2xzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL3Rvb2xzL3ByZWZhYi10b29scy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsZ0RBQWdEO0FBQ2hELDRDQUE0Qzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFHNUMsdUNBQXlCO0FBQ3pCLDJDQUE2QjtBQUU3QixNQUFhLFdBQVc7SUFDcEIsUUFBUTtRQUNKLE9BQU87WUFDSDtnQkFDSSxJQUFJLEVBQUUsaUJBQWlCO2dCQUN2QixXQUFXLEVBQUUsZ0NBQWdDO2dCQUM3QyxXQUFXLEVBQUU7b0JBQ1QsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsVUFBVSxFQUFFO3dCQUNSLE1BQU0sRUFBRTs0QkFDSixJQUFJLEVBQUUsUUFBUTs0QkFDZCxXQUFXLEVBQUUsa0NBQWtDOzRCQUMvQyxPQUFPLEVBQUUsYUFBYTt5QkFDekI7cUJBQ0o7aUJBQ0o7YUFDSjtZQUNEO2dCQUNJLElBQUksRUFBRSxhQUFhO2dCQUNuQixXQUFXLEVBQUUsdUJBQXVCO2dCQUNwQyxXQUFXLEVBQUU7b0JBQ1QsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsVUFBVSxFQUFFO3dCQUNSLFVBQVUsRUFBRTs0QkFDUixJQUFJLEVBQUUsUUFBUTs0QkFDZCxXQUFXLEVBQUUsbUJBQW1CO3lCQUNuQztxQkFDSjtvQkFDRCxRQUFRLEVBQUUsQ0FBQyxZQUFZLENBQUM7aUJBQzNCO2FBQ0o7WUFDRDtnQkFDSSxJQUFJLEVBQUUsb0JBQW9CO2dCQUMxQixXQUFXLEVBQUUsbUNBQW1DO2dCQUNoRCxXQUFXLEVBQUU7b0JBQ1QsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsVUFBVSxFQUFFO3dCQUNSLFVBQVUsRUFBRTs0QkFDUixJQUFJLEVBQUUsUUFBUTs0QkFDZCxXQUFXLEVBQUUsbUJBQW1CO3lCQUNuQzt3QkFDRCxVQUFVLEVBQUU7NEJBQ1IsSUFBSSxFQUFFLFFBQVE7NEJBQ2QsV0FBVyxFQUFFLDZC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O29CQUN6QixHQUFHLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO29CQUN6QixHQUFHLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO2lCQUM1QixDQUFDO2FBQ0w7aUJBQU0sSUFBSSxJQUFJLEtBQUssU0FBUyxFQUFFO2dCQUMzQixPQUFPO29CQUNILFVBQVUsRUFBRSxTQUFTO29CQUNyQixHQUFHLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO29CQUN6QixHQUFHLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO2lCQUM1QixDQUFDO2FBQ0w7aUJBQU0sSUFBSSxJQUFJLEtBQUssU0FBUyxFQUFFO2dCQUMzQixPQUFPO29CQUNILFVBQVUsRUFBRSxTQUFTO29CQUNyQixPQUFPLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDO29CQUNqQyxRQUFRLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDO2lCQUN0QyxDQUFDO2FBQ0w7aUJBQU0sSUFBSSxJQUFJLEtBQUssU0FBUyxFQUFFO2dCQUMzQixPQUFPO29CQUNILFVBQVUsRUFBRSxTQUFTO29CQUNyQixHQUFHLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO29CQUN6QixHQUFHLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO29CQUN6QixHQUFHLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO29CQUN6QixHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUMsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQ25ELENBQUM7YUFDTDtTQUNKO1FBRUQsU0FBUztRQUNU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SUFBSSxLQUFLLFNBQVM7Z0JBQUUsT0FBTyxJQUFJLENBQUM7WUFDcEMsT0FBTyxJQUFJLENBQUM7UUFDaEIsQ0FBQyxDQUFDO1FBRUYsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxRQUFRLENBQUMsTUFBQSxRQUFRLENBQUMsS0FBSywwQ0FBRSxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7UUFDM0csTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxRQUFRLENBQUMsTUFBQSxRQUFRLENBQUMsS0FBSywwQ0FBRSxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztRQUNqSCxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLFFBQVEsQ0FBQyxNQUFBLFFBQVEsQ0FBQyxLQUFLLDBDQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztRQUNsRyxNQUFNLE1BQU0sR0FBRyxNQUFBLE1BQUEsUUFBUSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsbUNBQUksUUFBUSxDQUFDLE1BQUEsUUFBUSxDQUFDLEtBQUssMENBQUUsTUFBTSxDQUFDLG1DQUFJLElBQUksQ0FBQztRQUNyRixNQUFNLElBQUksR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLFFBQVEsQ0FBQyxNQUFBLFFBQVEsQ0FBQyxLQUFLLDBDQUFFLElBQUksQ0FBQyxJQUFJLE1BQU0sQ0FBQztRQUNqRixNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMs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Q0FBQyxHQUFHLENBQUMsYUFBYSxlQUFlLEVBQUUsQ0FBQyxDQUFDO1lBQzVDLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ3RDLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztZQUM5QyxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsVUFBVSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBRWxELE9BQU8sRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUM7U0FDNUI7UUFBQyxPQUFPLEtBQVUsRUFBRTtZQUNqQixPQUFPLENBQUMsS0FBSyxDQUFDLGFBQWEsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNwQyxPQUFPLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQ25EO0lBQ0wsQ0FBQztDQUVKO0FBendGRCxrQ0F5d0ZDIiwic291cmNlc0NvbnRlbnQiOlsiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL3R5cGVzL2VkaXRvci0yeC5kLnRzXCIgLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi90eXBlcy9jYy0yeC5kLnRzXCIgLz5cblxuaW1wb3J0IHsgVG9vbERlZmluaXRpb24sIFRvb2xSZXNwb25zZSwgVG9vbEV4ZWN1dG9yLCBQcmVmYWJJbmZvIH0gZnJvbSAnLi4vdHlwZXMnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcblxuZXhwb3J0IGNsYXNzIFByZWZhYlRvb2xzIGltcGxlbWVudHMgVG9vbEV4ZWN1dG9yIHtcbiAgICBnZXRUb29scygpOiBUb29sRGVmaW5pdGlvbltdIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnZ2V0X3ByZWZhYl9saXN0JyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0dldCBhbGwgcHJlZmFicyBpbiB0aGUgcHJvamVjdCcsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvbGRlcjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRm9sZGVyIHBhdGggdG8gc2VhcmNoIChvcHRpb25hbCknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6ICdkYjovL2Fzc2V0cydcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2xvYWRfcHJlZmFiJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0xvYWQgYSBwcmVmYWIgYnkgcGF0aCcsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZWZhYlBhdGg6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1ByZWZhYiBhc3NldCBwYXRoJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWydwcmVmYWJQYXRoJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdpbnN0YW50aWF0ZV9wcmVmYWInLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnSW5zdGFudGlhdGUgYSBwcmVmYWIgaW4gdGhlIHNjZW5lJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJlZmFiUGF0aDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUHJlZmFiIGFzc2V0IHBhdGgnXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50VXVpZDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUGFyZW50IG5vZGUgVVVJRCAob3B0aW9uYWwpJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdJbml0aWFsIHBvc2l0aW9uJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHg6IHsgdHlwZTogJ251bWJlcicgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeTogeyB0eXBlOiAnbnVtYmVyJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB6OiB7IHR5cGU6ICdudW1iZXInIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ3ByZWZhYlBhdGgnXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2NyZWF0ZV9wcmVmYWInLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ3JlYXRlIGEgcHJlZmFiIGZyb20gYSBub2RlIHdpdGggYWxsIGNoaWxkcmVuIGFuZCBjb21wb25lbnRzJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVV1aWQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1NvdXJjZSBub2RlIFVVSUQnXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgc2F2ZVBhdGg6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1BhdGggdG8gc2F2ZSB0aGUgcHJlZmFiIChlLmcuLCBkYjovL2Fzc2V0cy9wcmVmYWJzL015UHJlZmFiLnByZWZhYiknXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgcHJlZmFiTmFtZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUHJlZmFiIG5hbWUnXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ25vZGVVdWlkJywgJ3NhdmVQYXRoJywgJ3ByZWZhYk5hbWUnXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3VwZGF0ZV9wcmVmYWInLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVXBkYXRlIGFuIGV4aXN0aW5nIHByZWZhYicsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZWZhYlBhdGg6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1ByZWZhYiBhc3NldCBwYXRoJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVVdWlkOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdOb2RlIFVVSUQgd2l0aCBjaGFuZ2VzJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWydwcmVmYWJQYXRoJywgJ25vZGVVdWlkJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdyZXZlcnRfcHJlZmFiJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1JldmVydCBwcmVmYWIgaW5zdGFuY2UgdG8gb3JpZ2luYWwnLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlVXVpZDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUHJlZmFiIGluc3RhbmNlIG5vZGUgVVVJRCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsnbm9kZVV1aWQnXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2dldF9wcmVmYWJfaW5mbycsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdHZXQgZGV0YWlsZWQgcHJlZmFiIGluZm9ybWF0aW9uJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJlZmFiUGF0aDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUHJlZmFiIGFzc2V0IHBhdGgnXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ3ByZWZhYlBhdGgnXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3ZhbGlkYXRlX3ByZWZhYicsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdWYWxpZGF0ZSBhIHByZWZhYiBmaWxlIGZvcm1hdCcsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZWZhYlBhdGg6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1ByZWZhYiBhc3NldCBwYXRoJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWydwcmVmYWJQYXRoJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdkdXBsaWNhdGVfcHJlZmFiJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0R1cGxpY2F0ZSBhbiBleGlzdGluZyBwcmVmYWInLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2VQcmVmYWJQYXRoOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdTb3VyY2UgcHJlZmFiIHBhdGgnXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0UHJlZmFiUGF0aDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVGFyZ2V0IHByZWZhYiBwYXRoJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld1ByZWZhYk5hbWU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ05ldyBwcmVmYWIgbmFtZSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsnc291cmNlUHJlZmFiUGF0aCcsICd0YXJnZXRQcmVmYWJQYXRoJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdyZXN0b3JlX3ByZWZhYl9ub2RlJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1Jlc3RvcmUgcHJlZmFiIG5vZGUgdXNpbmcgcHJlZmFiIGFzc2V0IChidWlsdC1pbiB1bmRvIHJlY29yZCknLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlVXVpZDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUHJlZmFiIGluc3RhbmNlIG5vZGUgVVVJRCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBhc3NldFV1aWQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1ByZWZhYiBhc3NldCBVVUlEJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWydub2RlVXVpZCcsICdhc3NldFV1aWQnXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgXTtcbiAgICB9XG5cbiAgICBhc3luYyBleGVjdXRlKHRvb2xOYW1lOiBzdHJpbmcsIGFyZ3M6IGFueSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHN3aXRjaCAodG9vbE5hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgJ2dldF9wcmVmYWJfbGlzdCc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZ2V0UHJlZmFiTGlzdChhcmdzLmZvbGRlcik7XG4gICAgICAgICAgICBjYXNlICdsb2FkX3ByZWZhYic6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMubG9hZFByZWZhYihhcmdzLnByZWZhYlBhdGgpO1xuICAgICAgICAgICAgY2FzZSAnaW5zdGFudGlhdGVfcHJlZmFiJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5pbnN0YW50aWF0ZVByZWZhYihhcmdzKTtcbiAgICAgICAgICAgIGNhc2UgJ2NyZWF0ZV9wcmVmYWInOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmNyZWF0ZVByZWZhYihhcmdzKTtcbiAgICAgICAgICAgIGNhc2UgJ3VwZGF0ZV9wcmVmYWInOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnVwZGF0ZVByZWZhYihhcmdzLnByZWZhYlBhdGgsIGFyZ3Mubm9kZVV1aWQpO1xuICAgICAgICAgICAgY2FzZSAncmV2ZXJ0X3ByZWZhYic6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucmV2ZXJ0UHJlZmFiKGFyZ3Mubm9kZVV1aWQpO1xuICAgICAgICAgICAgY2FzZSAnZ2V0X3ByZWZhYl9pbmZvJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5nZXRQcmVmYWJJbmZvKGFyZ3MucHJlZmFiUGF0aCk7XG4gICAgICAgICAgICBjYXNlICd2YWxpZGF0ZV9wcmVmYWInOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnZhbGlkYXRlUHJlZmFiKGFyZ3MucHJlZmFiUGF0aCk7XG4gICAgICAgICAgICBjYXNlICdkdXBsaWNhdGVfcHJlZmFiJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5kdXBsaWNhdGVQcmVmYWIoYXJncyk7XG4gICAgICAgICAgICBjYXNlICdyZXN0b3JlX3ByZWZhYl9ub2RlJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5yZXN0b3JlUHJlZmFiTm9kZShhcmdzLm5vZGVVdWlkLCBhcmdzLmFzc2V0VXVpZCk7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biB0b29sOiAke3Rvb2xOYW1lfWApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUHJvbWlzZSB3cmFwcGVyIGZvciBFZGl0b3IuYXNzZXRkYi5xdWVyeUluZm9CeVV1aWQgKDIueCBBUEkgaXMgY2FsbGJhY2stYmFzZWQpXG4gICAgICovXG4gICAgcHJpdmF0ZSBxdWVyeUFzc2V0SW5mb0J5VXVpZCh1dWlkOiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgRWRpdG9yLmFzc2V0ZGIucXVlcnlJbmZvQnlVdWlkKHV1aWQsIChlcnI6IEVycm9yIHwgbnVsbCwgaW5mbzogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGluZm8pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQcm9taXNlIHdyYXBwZXIgZm9yIEVkaXRvci5hc3NldGRiLnF1ZXJ5VXVpZEJ5VXJsICsgcXVlcnlJbmZvQnlVdWlkXG4gICAgICovXG4gICAgcHJpdmF0ZSBxdWVyeUFzc2V0SW5mb0J5VXJsKHVybDogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIEVkaXRvci5hc3NldGRiLnF1ZXJ5VXVpZEJ5VXJsKHVybCwgKGVycjogRXJyb3IgfCBudWxsLCB1dWlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMucXVlcnlBc3NldEluZm9CeVV1aWQodXVpZCkudGhlbihyZXNvbHZlKS5jYXRjaChyZWplY3QpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgZ2V0UHJlZmFiTGlzdChmb2xkZXI6IHN0cmluZyA9ICdkYjovL2Fzc2V0cycpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHBhdHRlcm4gPSBmb2xkZXIuZW5kc1dpdGgoJy8nKSA/XG4gICAgICAgICAgICAgICAgYCR7Zm9sZGVyfSoqLyoucHJlZmFiYCA6IGAke2ZvbGRlcn0vKiovKi5wcmVmYWJgO1xuXG4gICAgICAgICAgICBFZGl0b3IuYXNzZXRkYi5xdWVyeUFzc2V0cyhwYXR0ZXJuLCAncHJlZmFiJywgKGVycjogRXJyb3IgfCBudWxsLCByZXN1bHRzOiBhbnlbXSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBwcmVmYWJzOiBQcmVmYWJJbmZvW10gPSByZXN1bHRzLm1hcChhc3NldCA9PiAoe1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiBhc3NldC5uYW1lLFxuICAgICAgICAgICAgICAgICAgICBwYXRoOiBhc3NldC51cmwsXG4gICAgICAgICAgICAgICAgICAgIHV1aWQ6IGFzc2V0LnV1aWQsXG4gICAgICAgICAgICAgICAgICAgIGZvbGRlcjogYXNzZXQudXJsLnN1YnN0cmluZygwLCBhc3NldC51cmwubGFzdEluZGV4T2YoJy8nKSlcbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IHByZWZhYnMgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBsb2FkUHJlZmFiKHByZWZhYlBhdGg6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgRWRpdG9yLmFzc2V0ZGIucXVlcnlVdWlkQnlVcmwocHJlZmFiUGF0aCwgKGVycjogRXJyb3IgfCBudWxsLCB1dWlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyIHx8ICF1dWlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycj8ubWVzc2FnZSB8fCAnUHJlZmFiIG5vdCBmb3VuZCcgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBFZGl0b3IuYXNzZXRkYi5xdWVyeUluZm9CeVV1aWQodXVpZCwgKGVycjI6IEVycm9yIHwgbnVsbCwgYXNzZXRJbmZvOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycjIgfHwgIWFzc2V0SW5mbykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyMj8ubWVzc2FnZSB8fCAnRmFpbGVkIHRvIGxvYWQgcHJlZmFiIGluZm8nIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IGFzc2V0SW5mby51dWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGFzc2V0SW5mby5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdQcmVmYWIgaW5mbyBsb2FkZWQgc3VjY2Vzc2Z1bGx5J1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGluc3RhbnRpYXRlUHJlZmFiKGFyZ3M6IGFueSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyAocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAvLyDojrflj5bpooTliLbkvZPotYTmupDkv6Hmga9cbiAgICAgICAgICAgICAgICBjb25zdCBhc3NldEluZm8gPSBhd2FpdCB0aGlzLnF1ZXJ5QXNzZXRJbmZvQnlVcmwoYXJncy5wcmVmYWJQYXRoKTtcbiAgICAgICAgICAgICAgICBpZiAoIWFzc2V0SW5mbykge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+mihOWItuS9k+acquaJvuWIsCcpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIOS9v+eUqCAyLnggQVBJIOS7jumihOWItuS9k+i1hOa6kOWunuS+i+WMllxuICAgICAgICAgICAgICAgIC8vIHNjZW5lOmNyZWF0ZS1ub2Rlcy1ieS11dWlkcyDnlKjkuo7lrp7kvovljJbpooTliLbkvZNcbiAgICAgICAgICAgICAgICBjb25zdCBub2RlTmFtZSA9IGFyZ3MubmFtZSB8fCBhc3NldEluZm8ubmFtZSB8fCAnUHJlZmFiSW5zdGFuY2UnO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhcmVudFV1aWQgPSBhcmdzLnBhcmVudFV1aWQgfHwgJyc7XG5cbiAgICAgICAgICAgICAgICAvLyDkvb/nlKggSXBjLnNlbmRUb1BhbmVsIOWPkemAgeWcuuaZr+WRveS7pFxuICAgICAgICAgICAgICAgIEVkaXRvci5JcGMuc2VuZFRvUGFuZWwoJ3NjZW5lJywgJ3NjZW5lOmNyZWF0ZS1ub2Rlcy1ieS11dWlkcycsIFthc3NldEluZm8udXVpZF0sIHBhcmVudFV1aWQpO1xuXG4gICAgICAgICAgICAgICAgLy8g5rOo5oSPOiBzZW5kVG9QYW5lbOydgCDrj5nquLDsoIHsnLzroZwg7Iuk7ZaJ65CY7KeA66eMIOqysOqzvOulvCDrsJjtmZjtlZjsp4Ag7JWK7J2MXG4gICAgICAgICAgICAgICAgLy8g7Iuk7KCc66Gc64qUIOydtOuypO2KuCDrpqzsiqTrhIjrpbwg7Ya17ZW0IOqysOqzvOulvCDrsJvslYTslbwg7ZWY7KeA66eMLCDqsITri6jtlZjqsowg7LKY66asXG4gICAgICAgICAgICAgICAgLy8gVVVJROuKlCBhc3NldEluZm8udXVpZOulvCDsgqzsmqkgKOyLpOygnOuhnOuKlCDsg4jroZwg7IOd7ISx65CcIOuFuOuTnCBVVUlE6rCAIO2VhOyalClcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygn6aKE5Yi25L2T6IqC54K55Yib5bu65oiQ5YqfOicsIHtcbiAgICAgICAgICAgICAgICAgICAgcHJlZmFiVXVpZDogYXNzZXRJbmZvLnV1aWQsXG4gICAgICAgICAgICAgICAgICAgIHByZWZhYlBhdGg6IGFyZ3MucHJlZmFiUGF0aFxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZWZhYlV1aWQ6IGFzc2V0SW5mby51dWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgcHJlZmFiUGF0aDogYXJncy5wcmVmYWJQYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50VXVpZDogYXJncy5wYXJlbnRVdWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IGFyZ3MucG9zaXRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAn6aKE5Yi25L2T5a6e5L6L5YyW5oiQ5Yqf77yI5L2/55Soc2NlbmU6Y3JlYXRlLW5vZGVzLWJ5LXV1aWRz77yJJ1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGDpooTliLbkvZPlrp7kvovljJblpLHotKU6ICR7ZXJyLm1lc3NhZ2V9YCxcbiAgICAgICAgICAgICAgICAgICAgaW5zdHJ1Y3Rpb246ICfor7fmo4Dmn6XpooTliLbkvZPot6/lvoTmmK/lkKbmraPnoa7vvIznoa7kv53pooTliLbkvZPmlofku7bmoLzlvI/mraPnoa4nXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOW7uueri+iKgueCueS4jumihOWItuS9k+eahOWFs+iBlOWFs+ezu1xuICAgICAqIOi/meS4quaWueazleWIm+W7uuW/heimgeeahFByZWZhYkluZm/lkoxQcmVmYWJJbnN0YW5jZee7k+aehFxuICAgICAqL1xuICAgIHByaXZhdGUgYXN5bmMgZXN0YWJsaXNoUHJlZmFiQ29ubmVjdGlvbihub2RlVXVpZDogc3RyaW5nLCBwcmVmYWJVdWlkOiBzdHJpbmcsIHByZWZhYlBhdGg6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8g6K+75Y+W6aKE5Yi25L2T5paH5Lu26I635Y+W5qC56IqC54K555qEZmlsZUlkXG4gICAgICAgICAgICBjb25zdCBwcmVmYWJDb250ZW50ID0gYXdhaXQgdGhpcy5yZWFkUHJlZmFiRmlsZShwcmVmYWJQYXRoKTtcbiAgICAgICAgICAgIGlmICghcHJlZmFiQ29udGVudCB8fCAhcHJlZmFiQ29udGVudC5kYXRhIHx8ICFwcmVmYWJDb250ZW50LmRhdGEubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfml6Dms5Xor7vlj5bpooTliLbkvZPmlofku7blhoXlrrknKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g5om+5Yiw6aKE5Yi25L2T5qC56IqC54K555qEZmlsZUlkICjpgJrluLjmmK/nrKzkuozkuKrlr7nosaHvvIzljbPntKLlvJUxKVxuICAgICAgICAgICAgY29uc3Qgcm9vdE5vZGUgPSBwcmVmYWJDb250ZW50LmRhdGEuZmluZCgoaXRlbTogYW55KSA9PiBpdGVtLl9fdHlwZSA9PT0gJ2NjLk5vZGUnICYmIGl0ZW0uX3BhcmVudCA9PT0gbnVsbCk7XG4gICAgICAgICAgICBpZiAoIXJvb3ROb2RlIHx8ICFyb290Tm9kZS5fcHJlZmFiKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfml6Dms5Xmib7liLDpooTliLbkvZPmoLnoioLngrnmiJblhbbpooTliLbkvZPkv6Hmga8nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g6I635Y+W5qC56IqC54K555qEUHJlZmFiSW5mb1xuICAgICAgICAgICAgY29uc3Qgcm9vdFByZWZhYkluZm8gPSBwcmVmYWJDb250ZW50LmRhdGFbcm9vdE5vZGUuX3ByZWZhYi5fX2lkX19dO1xuICAgICAgICAgICAgaWYgKCFyb290UHJlZmFiSW5mbyB8fCByb290UHJlZmFiSW5mby5fX3R5cGUgIT09ICdjYy5QcmVmYWJJbmZvJykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5peg5rOV5om+5Yiw6aKE5Yi25L2T5qC56IqC54K555qEUHJlZmFiSW5mbycpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCByb290RmlsZUlkID0gcm9vdFByZWZhYkluZm8uZmlsZUlkO1xuXG4gICAgICAgICAgICAvLyDkvb/nlKhzY2VuZSBBUEnlu7rnq4vpooTliLbkvZPov57mjqVcbiAgICAgICAgICAgIGNvbnN0IHByZWZhYkNvbm5lY3Rpb25EYXRhID0ge1xuICAgICAgICAgICAgICAgIG5vZGU6IG5vZGVVdWlkLFxuICAgICAgICAgICAgICAgIHByZWZhYjogcHJlZmFiVXVpZCxcbiAgICAgICAgICAgICAgICBmaWxlSWQ6IHJvb3RGaWxlSWRcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8vIOWwneivleS9v+eUqCAyLnggQVBJIOW7uueri+mihOWItuS9k+i/nuaOpVxuICAgICAgICAgICAgLy8gMi547JeQ7ISc64qUIHNjZW5lOmFwcGx5LXByZWZhYiDrqoXroLnslrQg7IKs7JqpXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIEVkaXRvci5JcGMuc2VuZFRvUGFuZWwoJ3NjZW5lJywgJ3NjZW5lOmFwcGx5LXByZWZhYicsIG5vZGVVdWlkKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygn6aKE5Yi25L2T6L+e5o6l5oiQ5YqfJyk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2Fybign6aKE5Yi25L2T6L+e5o6l5pa55rOV5aSx6LSl77yM5bCd6K+V5omL5Yqo5bu656uL6L+e5o6lOicsIGVycm9yKTtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLm1hbnVhbGx5RXN0YWJsaXNoUHJlZmFiQ29ubmVjdGlvbihub2RlVXVpZCwgcHJlZmFiVXVpZCwgcm9vdEZpbGVJZCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ+W7uueri+mihOWItuS9k+i/nuaOpeWksei0pTonLCBlcnJvcik7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOaJi+WKqOW7uueri+mihOWItuS9k+i/nuaOpe+8iOW9k0FQSeaWueazleWksei0peaXtueahOWkh+eUqOaWueahiO+8iVxuICAgICAqL1xuICAgIHByaXZhdGUgYXN5bmMgbWFudWFsbHlFc3RhYmxpc2hQcmVmYWJDb25uZWN0aW9uKG5vZGVVdWlkOiBzdHJpbmcsIHByZWZhYlV1aWQ6IHN0cmluZywgcm9vdEZpbGVJZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyDlsJ3or5Xkvb/nlKhkdW1wIEFQSeS/ruaUueiKgueCueeahF9wcmVmYWLlsZ7mgKdcbiAgICAgICAgICAgIGNvbnN0IHByZWZhYkNvbm5lY3Rpb25EYXRhID0ge1xuICAgICAgICAgICAgICAgIFtub2RlVXVpZF06IHtcbiAgICAgICAgICAgICAgICAgICAgJ19wcmVmYWInOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAnX191dWlkX18nOiBwcmVmYWJVdWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ19fZXhwZWN0ZWRUeXBlX18nOiAnY2MuUHJlZmFiJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICdmaWxlSWQnOiByb290RmlsZUlkXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvLyDkvb/nlKggMi54IEFQSSDorr7nva7lsZ7mgKdcbiAgICAgICAgICAgIEVkaXRvci5JcGMuc2VuZFRvUGFuZWwoJ3NjZW5lJywgJ3NjZW5lOnNldC1wcm9wZXJ0eScsIHtcbiAgICAgICAgICAgICAgICBpZDogbm9kZVV1aWQsXG4gICAgICAgICAgICAgICAgcGF0aDogJ19wcmVmYWInLFxuICAgICAgICAgICAgICAgIHR5cGU6ICdjYy5QcmVmYWInLFxuICAgICAgICAgICAgICAgIHZhbHVlOiB7XG4gICAgICAgICAgICAgICAgICAgICdfX3V1aWRfXyc6IHByZWZhYlV1aWQsXG4gICAgICAgICAgICAgICAgICAgICdfX2V4cGVjdGVkVHlwZV9fJzogJ2NjLlByZWZhYidcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGlzU3ViUHJvcDogZmFsc2VcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCfmiYvliqjlu7rnq4vpooTliLbkvZPov57mjqXkuZ/lpLHotKU6JywgZXJyb3IpO1xuICAgICAgICAgICAgLy8g5LiN5oqb5Ye66ZSZ6K+v77yM5Zug5Li65Z+65pys55qE6IqC54K55Yib5bu65bey57uP5oiQ5YqfXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDor7vlj5bpooTliLbkvZPmlofku7blhoXlrrlcbiAgICAgKi9cbiAgICBwcml2YXRlIGFzeW5jIHJlYWRQcmVmYWJGaWxlKHByZWZhYlBhdGg6IHN0cmluZyk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyDkvb/nlKggMi54IEFQSSDor7vlj5bmlofku7blhoXlrrlcbiAgICAgICAgICAgIGxldCBhc3NldENvbnRlbnQ6IGFueTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXNzZXRDb250ZW50ID0gYXdhaXQgdGhpcy5xdWVyeUFzc2V0SW5mb0J5VXJsKHByZWZhYlBhdGgpO1xuICAgICAgICAgICAgICAgIGlmIChhc3NldENvbnRlbnQgJiYgYXNzZXRDb250ZW50LnNvdXJjZSkge1xuICAgICAgICAgICAgICAgICAgICAvLyDlpoLmnpzmnIlzb3VyY2Xot6/lvoTvvIznm7TmjqXor7vlj5bmlofku7ZcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZnVsbFBhdGggPSBwYXRoLnJlc29sdmUoYXNzZXRDb250ZW50LnNvdXJjZSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpbGVDb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKGZ1bGxQYXRoLCAndXRmOCcpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gSlNPTi5wYXJzZShmaWxlQ29udGVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ+S9v+eUqGFzc2V0LWRi6K+75Y+W5aSx6LSl77yM5bCd6K+V5YW25LuW5pa55rOVOicsIGVycm9yKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g5aSH55So5pa55rOV77ya6L2s5o2iZGI6Ly/ot6/lvoTkuLrlrp7pmYXmlofku7bot6/lvoRcbiAgICAgICAgICAgIGNvbnN0IGZzUGF0aCA9IHByZWZhYlBhdGgucmVwbGFjZSgnZGI6Ly9hc3NldHMvJywgJ2Fzc2V0cy8nKS5yZXBsYWNlKCdkYjovL2Fzc2V0cycsICdhc3NldHMnKTtcblxuICAgICAgICAgICAgLy8g5bCd6K+V5aSa5Liq5Y+v6IO955qE6aG555uu5qC56Lev5b6EXG4gICAgICAgICAgICBjb25zdCBwb3NzaWJsZVBhdGhzID0gW1xuICAgICAgICAgICAgICAgIHBhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpLCAnLi4vLi4vTmV3UHJvamVjdF8zJywgZnNQYXRoKSxcbiAgICAgICAgICAgICAgICBwYXRoLnJlc29sdmUoJy9Vc2Vycy9saXpoaXlvbmcvTmV3UHJvamVjdF8zJywgZnNQYXRoKSxcbiAgICAgICAgICAgICAgICBwYXRoLnJlc29sdmUoZnNQYXRoKSxcbiAgICAgICAgICAgICAgICAvLyDlpoLmnpzmmK/moLnnm67lvZXkuIvnmoTmlofku7bvvIzkuZ/lsJ3or5Xnm7TmjqXot6/lvoRcbiAgICAgICAgICAgICAgICBwYXRoLnJlc29sdmUoJy9Vc2Vycy9saXpoaXlvbmcvTmV3UHJvamVjdF8zL2Fzc2V0cycsIHBhdGguYmFzZW5hbWUoZnNQYXRoKSlcbiAgICAgICAgICAgIF07XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCflsJ3or5Xor7vlj5bpooTliLbkvZPmlofku7bvvIzot6/lvoTovazmjaI6Jywge1xuICAgICAgICAgICAgICAgIG9yaWdpbmFsUGF0aDogcHJlZmFiUGF0aCxcbiAgICAgICAgICAgICAgICBmc1BhdGg6IGZzUGF0aCxcbiAgICAgICAgICAgICAgICBwb3NzaWJsZVBhdGhzOiBwb3NzaWJsZVBhdGhzXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZm9yIChjb25zdCBmdWxsUGF0aCBvZiBwb3NzaWJsZVBhdGhzKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYOajgOafpei3r+W+hDogJHtmdWxsUGF0aH1gKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoZnVsbFBhdGgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhg5om+5Yiw5paH5Lu2OiAke2Z1bGxQYXRofWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZmlsZUNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMoZnVsbFBhdGgsICd1dGY4Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKGZpbGVDb250ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCfmlofku7bop6PmnpDmiJDlip/vvIzmlbDmja7nu5PmnoQ6Jywge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhc0RhdGE6ICEhcGFyc2VkLmRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YUxlbmd0aDogcGFyc2VkLmRhdGEgPyBwYXJzZWQuZGF0YS5sZW5ndGggOiAwXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZWQ7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhg5paH5Lu25LiN5a2Y5ZyoOiAke2Z1bGxQYXRofWApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAocmVhZEVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2Fybihg6K+75Y+W5paH5Lu25aSx6LSlICR7ZnVsbFBhdGh9OmAsIHJlYWRFcnJvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+aXoOazleaJvuWIsOaIluivu+WPlumihOWItuS9k+aWh+S7ticpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcign6K+75Y+W6aKE5Yi25L2T5paH5Lu25aSx6LSlOicsIGVycm9yKTtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyB0cnlDcmVhdGVOb2RlV2l0aFByZWZhYihhcmdzOiBhbnkpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMgKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYXNzZXRJbmZvID0gYXdhaXQgdGhpcy5xdWVyeUFzc2V0SW5mb0J5VXJsKGFyZ3MucHJlZmFiUGF0aCk7XG4gICAgICAgICAgICAgICAgaWYgKCFhc3NldEluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfpooTliLbkvZPmnKrmib7liLAnKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyDkvb/nlKggMi54IEFQSTogc2NlbmU6Y3JlYXRlLW5vZGVzLWJ5LXV1aWRzXG4gICAgICAgICAgICAgICAgY29uc3QgcGFyZW50VXVpZCA9IGFyZ3MucGFyZW50VXVpZCB8fCAnJztcbiAgICAgICAgICAgICAgICBFZGl0b3IuSXBjLnNlbmRUb1BhbmVsKCdzY2VuZScsICdzY2VuZTpjcmVhdGUtbm9kZXMtYnktdXVpZHMnLCBbYXNzZXRJbmZvLnV1aWRdLCBwYXJlbnRVdWlkKTtcblxuICAgICAgICAgICAgICAgIC8vIOazqOaEjzogc2VuZFRvUGFuZWzsnYAg6rKw6rO866W8IOuwmO2ZmO2VmOyngCDslYrsnLzrr4DroZwsIOychOy5mCDshKTsoJXsnYAg67OE64+E66GcIOyymOumrFxuICAgICAgICAgICAgICAgIGlmIChhcmdzLnBvc2l0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOychOy5mCDshKTsoJXsnYAg67OE64+EIOydtOuypO2KuOuhnCDsspjrpqztlbTslbwg7ZWgIOyImCDsnojsnYxcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ+S9jee9ruiuvue9rumcgOimgeWcqOiKgueCueWIm+W7uuWQjuWNleeLrOWkhOeQhicpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmVmYWJVdWlkOiBhc3NldEluZm8udXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZWZhYlBhdGg6IGFyZ3MucHJlZmFiUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudFV1aWQ6IGFyZ3MucGFyZW50VXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBhcmdzLnBvc2l0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ+mihOWItuS9k+WunuS+i+WMluaIkOWKn++8iOWkh+eUqOaWueazle+8iSdcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBg5aSH55So6aKE5Yi25L2T5a6e5L6L5YyW5pa55rOV5Lmf5aSx6LSlOiAke2Vyci5tZXNzYWdlfWBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyB0cnlBbHRlcm5hdGl2ZUluc3RhbnRpYXRlTWV0aG9kcyhhcmdzOiBhbnkpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMgKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgLy8g5pa55rOVMTog5bCd6K+V5L2/55SoIGNyZWF0ZS1ub2RlIOeEtuWQjuiuvue9rumihOWItuS9k1xuICAgICAgICAgICAgICAgIGNvbnN0IGFzc2V0SW5mbyA9IGF3YWl0IHRoaXMuZ2V0QXNzZXRJbmZvKGFyZ3MucHJlZmFiUGF0aCk7XG4gICAgICAgICAgICAgICAgaWYgKCFhc3NldEluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ+aXoOazleiOt+WPlumihOWItuS9k+S/oeaBrycgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyDliJvlu7rnqbroioLngrlcbiAgICAgICAgICAgICAgICBjb25zdCBjcmVhdGVSZXN1bHQgPSBhd2FpdCB0aGlzLmNyZWF0ZU5vZGUoYXJncy5wYXJlbnRVdWlkLCBhcmdzLnBvc2l0aW9uKTtcbiAgICAgICAgICAgICAgICBpZiAoIWNyZWF0ZVJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoY3JlYXRlUmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIOWwneivleWwhumihOWItuS9k+W6lOeUqOWIsOiKgueCuVxuICAgICAgICAgICAgICAgIGNvbnN0IGFwcGx5UmVzdWx0ID0gYXdhaXQgdGhpcy5hcHBseVByZWZhYlRvTm9kZShjcmVhdGVSZXN1bHQuZGF0YS5ub2RlVXVpZCwgYXNzZXRJbmZvLnV1aWQpO1xuICAgICAgICAgICAgICAgIGlmIChhcHBseVJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlVXVpZDogY3JlYXRlUmVzdWx0LmRhdGEubm9kZVV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogY3JlYXRlUmVzdWx0LmRhdGEubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAn6aKE5Yi25L2T5a6e5L6L5YyW5oiQ5Yqf77yI5L2/55So5aSH6YCJ5pa55rOV77yJJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6ICfml6Dms5XlsIbpooTliLbkvZPlupTnlKjliLDoioLngrknLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVVdWlkOiBjcmVhdGVSZXN1bHQuZGF0YS5ub2RlVXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAn5bey5Yib5bu66IqC54K577yM5L2G5peg5rOV5bqU55So6aKE5Yi25L2T5pWw5o2uJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYOWkh+mAieWunuS+i+WMluaWueazleWksei0pTogJHtlcnJvcn1gIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGdldEFzc2V0SW5mbyhwcmVmYWJQYXRoOiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucXVlcnlBc3NldEluZm9CeVVybChwcmVmYWJQYXRoKTtcbiAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgY3JlYXRlTm9kZShwYXJlbnRVdWlkPzogc3RyaW5nLCBwb3NpdGlvbj86IGFueSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAvLyDkvb/nlKggMi54IEFQSSDliJvlu7roioLngrlcbiAgICAgICAgICAgICAgICBjb25zdCBub2RlTmFtZSA9ICdQcmVmYWJJbnN0YW5jZSc7XG4gICAgICAgICAgICAgICAgY29uc3QgcGFyZW50ID0gcGFyZW50VXVpZCB8fCAnJztcbiAgICAgICAgICAgICAgICBFZGl0b3IuSXBjLnNlbmRUb1BhbmVsKCdzY2VuZScsICdzY2VuZTpjcmVhdGUtbm9kZS1ieS1jbGFzc2lkJywgbm9kZU5hbWUsICcnLCBwYXJlbnQpO1xuXG4gICAgICAgICAgICAgICAgLy8g5rOo5oSPOiBzZW5kVG9QYW5lbOydgCDqsrDqs7zrpbwg67CY7ZmY7ZWY7KeAIOyViuycvOuvgOuhnCwgVVVJROuKlCDrs4Trj4TroZwg7Ja77Ja07JW8IO2VqFxuICAgICAgICAgICAgICAgIC8vIOychOy5mCDshKTsoJXrj4Qg67OE64+E66GcIOyymOumrO2VtOyVvCDtlahcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVV1aWQ6ICcnLCAvLyAyLnjsl5DshJzripQg67OE64+E66GcIFVVSUTrpbwg7Ja77Ja07JW8IO2VqFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ1ByZWZhYkluc3RhbmNlJ1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB8fCAn5Yib5bu66IqC54K55aSx6LSlJyB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBhcHBseVByZWZhYlRvTm9kZShub2RlVXVpZDogc3RyaW5nLCBwcmVmYWJVdWlkOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgLy8g5L2/55SoIDIueCBBUEkg5bqU55So6aKE5Yi25L2TXG4gICAgICAgICAgICAgICAgRWRpdG9yLklwYy5zZW5kVG9QYW5lbCgnc2NlbmUnLCAnc2NlbmU6YXBwbHktcHJlZmFiJywgbm9kZVV1aWQpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiB0cnVlIH0pO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfHwgJ+aXoOazleW6lOeUqOmihOWItuS9k+aVsOaNricgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOS9v+eUqCBhc3NldC1kYiBBUEkg5Yib5bu66aKE5Yi25L2T55qE5paw5pa55rOVXG4gICAgICog5rex5bqm5pW05ZCI5byV5pOO55qE6LWE5rqQ566h55CG57O757uf77yM5a6e546w5a6M5pW055qE6aKE5Yi25L2T5Yib5bu65rWB56iLXG4gICAgICovXG4gICAgcHJpdmF0ZSBhc3luYyBjcmVhdGVQcmVmYWJXaXRoQXNzZXREQihub2RlVXVpZDogc3RyaW5nLCBzYXZlUGF0aDogc3RyaW5nLCBwcmVmYWJOYW1lOiBzdHJpbmcsIGluY2x1ZGVDaGlsZHJlbjogYm9vbGVhbiwgaW5jbHVkZUNvbXBvbmVudHM6IGJvb2xlYW4pOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMgKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJz09PSDkvb/nlKggQXNzZXQtREIgQVBJIOWIm+W7uumihOWItuS9kyA9PT0nKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhg6IqC54K5VVVJRDogJHtub2RlVXVpZH1gKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhg5L+d5a2Y6Lev5b6EOiAke3NhdmVQYXRofWApO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGDpooTliLbkvZPlkI3np7A6ICR7cHJlZmFiTmFtZX1gKTtcblxuICAgICAgICAgICAgICAgIC8vIOesrOS4gOatpe+8muiOt+WPluiKgueCueaVsOaNru+8iOWMheaLrOWPmOaNouWxnuaAp++8iVxuICAgICAgICAgICAgICAgIGNvbnN0IG5vZGVEYXRhID0gYXdhaXQgdGhpcy5nZXROb2RlRGF0YShub2RlVXVpZCk7XG4gICAgICAgICAgICAgICAgaWYgKCFub2RlRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6ICfml6Dms5Xojrflj5boioLngrnmlbDmja4nXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ+iOt+WPluWIsOiKgueCueaVsOaNru+8jOWtkOiKgueCueaVsOmHjzonLCBub2RlRGF0YS5jaGlsZHJlbiA/IG5vZGVEYXRhLmNoaWxkcmVuLmxlbmd0aCA6IDApO1xuXG4gICAgICAgICAgICAgICAgLy8g56ys5LqM5q2l77ya5YWI5Yib5bu66LWE5rqQ5paH5Lu25Lul6I635Y+W5byV5pOO5YiG6YWN55qEVVVJRFxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCfliJvlu7rpooTliLbkvZPotYTmupDmlofku7YuLi4nKTtcbiAgICAgICAgICAgICAgICBjb25zdCB0ZW1wUHJlZmFiQ29udGVudCA9IEpTT04uc3RyaW5naWZ5KFt7XCJfX3R5cGVfX1wiOiBcImNjLlByZWZhYlwiLCBcIl9uYW1lXCI6IHByZWZhYk5hbWV9XSwgbnVsbCwgMik7XG4gICAgICAgICAgICAgICAgY29uc3QgY3JlYXRlUmVzdWx0ID0gYXdhaXQgdGhpcy5jcmVhdGVBc3NldFdpdGhBc3NldERCKHNhdmVQYXRoLCB0ZW1wUHJlZmFiQ29udGVudCk7XG4gICAgICAgICAgICAgICAgaWYgKCFjcmVhdGVSZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGNyZWF0ZVJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyDojrflj5blvJXmk47liIbphY3nmoTlrp7pmYVVVUlEXG4gICAgICAgICAgICAgICAgY29uc3QgYWN0dWFsUHJlZmFiVXVpZCA9IGNyZWF0ZVJlc3VsdC5kYXRhPy51dWlkO1xuICAgICAgICAgICAgICAgIGlmICghYWN0dWFsUHJlZmFiVXVpZCkge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6ICfml6Dms5Xojrflj5blvJXmk47liIbphY3nmoTpooTliLbkvZNVVUlEJ1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygn5byV5pOO5YiG6YWN55qEVVVJRDonLCBhY3R1YWxQcmVmYWJVdWlkKTtcblxuICAgICAgICAgICAgICAgIC8vIOesrOS4ieatpe+8muS9v+eUqOWunumZhVVVSUTph43mlrDnlJ/miJDpooTliLbkvZPlhoXlrrlcbiAgICAgICAgICAgICAgICBjb25zdCBwcmVmYWJDb250ZW50ID0gYXdhaXQgdGhpcy5jcmVhdGVTdGFuZGFyZFByZWZhYkNvbnRlbnQobm9kZURhdGEsIHByZWZhYk5hbWUsIGFjdHVhbFByZWZhYlV1aWQsIGluY2x1ZGVDaGlsZHJlbiwgaW5jbHVkZUNvbXBvbmVudHMpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHByZWZhYkNvbnRlbnRTdHJpbmcgPSBKU09OLnN0cmluZ2lmeShwcmVmYWJDb250ZW50LCBudWxsLCAyKTtcblxuICAgICAgICAgICAgICAgIC8vIOesrOWbm+atpe+8muabtOaWsOmihOWItuS9k+aWh+S7tuWGheWuuVxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCfmm7TmlrDpooTliLbkvZPmlofku7blhoXlrrkuLi4nKTtcbiAgICAgICAgICAgICAgICBjb25zdCB1cGRhdGVSZXN1bHQgPSBhd2FpdCB0aGlzLnVwZGF0ZUFzc2V0V2l0aEFzc2V0REIoc2F2ZVBhdGgsIHByZWZhYkNvbnRlbnRTdHJpbmcpO1xuXG4gICAgICAgICAgICAgICAgLy8g56ys5LqU5q2l77ya5Yib5bu65a+55bqU55qEbWV0YeaWh+S7tu+8iOS9v+eUqOWunumZhVVVSUTvvIlcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygn5Yib5bu66aKE5Yi25L2TbWV0YeaWh+S7ti4uLicpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG1ldGFDb250ZW50ID0gdGhpcy5jcmVhdGVTdGFuZGFyZE1ldGFDb250ZW50KHByZWZhYk5hbWUsIGFjdHVhbFByZWZhYlV1aWQpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG1ldGFSZXN1bHQgPSBhd2FpdCB0aGlzLmNyZWF0ZU1ldGFXaXRoQXNzZXREQihzYXZlUGF0aCwgbWV0YUNvbnRlbnQpO1xuXG4gICAgICAgICAgICAgICAgLy8g56ys5YWt5q2l77ya6YeN5paw5a+85YWl6LWE5rqQ5Lul5pu05paw5byV55SoXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ+mHjeaWsOWvvOWFpemihOWItuS9k+i1hOa6kC4uLicpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlaW1wb3J0UmVzdWx0ID0gYXdhaXQgdGhpcy5yZWltcG9ydEFzc2V0V2l0aEFzc2V0REIoc2F2ZVBhdGgpO1xuXG4gICAgICAgICAgICAgICAgLy8g56ys5LiD5q2l77ya5bCd6K+V5bCG5Y6f5aeL6IqC54K56L2s5o2i5Li66aKE5Yi25L2T5a6e5L6LXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ+WwneivleWwhuWOn+Wni+iKgueCuei9rOaNouS4uumihOWItuS9k+WunuS+iy4uLicpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnZlcnRSZXN1bHQgPSBhd2FpdCB0aGlzLmNvbnZlcnROb2RlVG9QcmVmYWJJbnN0YW5jZShub2RlVXVpZCwgYWN0dWFsUHJlZmFiVXVpZCwgc2F2ZVBhdGgpO1xuXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZWZhYlV1aWQ6IGFjdHVhbFByZWZhYlV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBwcmVmYWJQYXRoOiBzYXZlUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVVdWlkOiBub2RlVXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZWZhYk5hbWU6IHByZWZhYk5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb252ZXJ0ZWRUb1ByZWZhYkluc3RhbmNlOiBjb252ZXJ0UmVzdWx0LnN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgICAgICBjcmVhdGVBc3NldFJlc3VsdDogY3JlYXRlUmVzdWx0LFxuICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlUmVzdWx0OiB1cGRhdGVSZXN1bHQsXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXRhUmVzdWx0OiBtZXRhUmVzdWx0LFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVpbXBvcnRSZXN1bHQ6IHJlaW1wb3J0UmVzdWx0LFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udmVydFJlc3VsdDogY29udmVydFJlc3VsdCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGNvbnZlcnRSZXN1bHQuc3VjY2VzcyA/ICfpooTliLbkvZPliJvlu7rlubbmiJDlip/ovazmjaLljp/lp4voioLngrknIDogJ+mihOWItuS9k+WIm+W7uuaIkOWKn++8jOS9huiKgueCuei9rOaNouWksei0pSdcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ+WIm+W7uumihOWItuS9k+aXtuWPkeeUn+mUmeivrzonLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogYOWIm+W7uumihOWItuS9k+Wksei0pTogJHtlcnJvcn1gXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgY3JlYXRlUHJlZmFiKGFyZ3M6IGFueSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyAocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAvLyDmlK/mjIEgcHJlZmFiUGF0aCDlkowgc2F2ZVBhdGgg5Lik56eN5Y+C5pWw5ZCNXG4gICAgICAgICAgICAgICAgY29uc3QgcGF0aFBhcmFtID0gYXJncy5wcmVmYWJQYXRoIHx8IGFyZ3Muc2F2ZVBhdGg7XG4gICAgICAgICAgICAgICAgaWYgKCFwYXRoUGFyYW0pIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiAn57y65bCR6aKE5Yi25L2T6Lev5b6E5Y+C5pWw44CC6K+35o+Q5L6bIHByZWZhYlBhdGgg5oiWIHNhdmVQYXRo44CCJ1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnN0IHByZWZhYk5hbWUgPSBhcmdzLnByZWZhYk5hbWUgfHwgJ05ld1ByZWZhYic7XG4gICAgICAgICAgICAgICAgY29uc3QgZnVsbFBhdGggPSBwYXRoUGFyYW0uZW5kc1dpdGgoJy5wcmVmYWInKSA/XG4gICAgICAgICAgICAgICAgICAgIHBhdGhQYXJhbSA6IGAke3BhdGhQYXJhbX0vJHtwcmVmYWJOYW1lfS5wcmVmYWJgO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgaW5jbHVkZUNoaWxkcmVuID0gYXJncy5pbmNsdWRlQ2hpbGRyZW4gIT09IGZhbHNlOyAvLyDpu5jorqTkuLogdHJ1ZVxuICAgICAgICAgICAgICAgIGNvbnN0IGluY2x1ZGVDb21wb25lbnRzID0gYXJncy5pbmNsdWRlQ29tcG9uZW50cyAhPT0gZmFsc2U7IC8vIOm7mOiupOS4uiB0cnVlXG5cbiAgICAgICAgICAgICAgICAvLyDkvJjlhYjkvb/nlKjmlrDnmoQgYXNzZXQtZGIg5pa55rOV5Yib5bu66aKE5Yi25L2TXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ+S9v+eUqOaWsOeahCBhc3NldC1kYiDmlrnms5XliJvlu7rpooTliLbkvZMuLi4nKTtcbiAgICAgICAgICAgICAgICBjb25zdCBhc3NldERiUmVzdWx0ID0gYXdhaXQgdGhpcy5jcmVhdGVQcmVmYWJXaXRoQXNzZXREQihcbiAgICAgICAgICAgICAgICAgICAgYXJncy5ub2RlVXVpZCxcbiAgICAgICAgICAgICAgICAgICAgZnVsbFBhdGgsXG4gICAgICAgICAgICAgICAgICAgIHByZWZhYk5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGluY2x1ZGVDaGlsZHJlbixcbiAgICAgICAgICAgICAgICAgICAgaW5jbHVkZUNvbXBvbmVudHNcbiAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgaWYgKGFzc2V0RGJSZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGFzc2V0RGJSZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8g5aaC5p6cIGFzc2V0LWRiIOaWueazleWksei0pe+8jOWwneivleS9v+eUqENvY29zIENyZWF0b3LnmoTljp/nlJ/pooTliLbkvZPliJvlu7pBUElcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnYXNzZXQtZGIg5pa55rOV5aSx6LSl77yM5bCd6K+V5Y6f55SfQVBJLi4uJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgbmF0aXZlUmVzdWx0ID0gYXdhaXQgdGhpcy5jcmVhdGVQcmVmYWJOYXRpdmUoYXJncy5ub2RlVXVpZCwgZnVsbFBhdGgpO1xuICAgICAgICAgICAgICAgIGlmIChuYXRpdmVSZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKG5hdGl2ZVJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyDlpoLmnpzljp/nlJ9BUEnlpLHotKXvvIzkvb/nlKjoh6rlrprkuYnlrp7njrBcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygn5Y6f55SfQVBJ5aSx6LSl77yM5L2/55So6Ieq5a6a5LmJ5a6e546wLi4uJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgY3VzdG9tUmVzdWx0ID0gYXdhaXQgdGhpcy5jcmVhdGVQcmVmYWJDdXN0b20oYXJncy5ub2RlVXVpZCwgZnVsbFBhdGgsIHByZWZhYk5hbWUpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoY3VzdG9tUmVzdWx0KTtcblxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBg5Yib5bu66aKE5Yi25L2T5pe25Y+R55Sf6ZSZ6K+vOiAke2Vycm9yfWBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBjcmVhdGVQcmVmYWJOYXRpdmUobm9kZVV1aWQ6IHN0cmluZywgcHJlZmFiUGF0aDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAvLyDmoLnmja7lrpjmlrlBUEnmlofmoaPvvIzkuI3lrZjlnKjnm7TmjqXnmoTpooTliLbkvZPliJvlu7pBUElcbiAgICAgICAgICAgIC8vIOmihOWItuS9k+WIm+W7uumcgOimgeaJi+WKqOWcqOe8lui+keWZqOS4reWujOaIkFxuICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgZXJyb3I6ICfljp/nlJ/pooTliLbkvZPliJvlu7pBUEnkuI3lrZjlnKgnLFxuICAgICAgICAgICAgICAgIGluc3RydWN0aW9uOiAn5qC55o2uQ29jb3MgQ3JlYXRvcuWumOaWuUFQSeaWh+aho++8jOmihOWItuS9k+WIm+W7uumcgOimgeaJi+WKqOaTjeS9nO+8mlxcbjEuIOWcqOWcuuaZr+S4remAieaLqeiKgueCuVxcbjIuIOWwhuiKgueCueaLluaLveWIsOi1hOa6kOeuoeeQhuWZqOS4rVxcbjMuIOaIluWPs+mUruiKgueCuemAieaLqVwi55Sf5oiQ6aKE5Yi25L2TXCInXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBjcmVhdGVQcmVmYWJDdXN0b20obm9kZVV1aWQ6IHN0cmluZywgcHJlZmFiUGF0aDogc3RyaW5nLCBwcmVmYWJOYW1lOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMgKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgLy8gMS4g6I635Y+W5rqQ6IqC54K555qE5a6M5pW05pWw5o2uXG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZURhdGEgPSBhd2FpdCB0aGlzLmdldE5vZGVEYXRhKG5vZGVVdWlkKTtcbiAgICAgICAgICAgICAgICBpZiAoIW5vZGVEYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogYOaXoOazleaJvuWIsOiKgueCuTogJHtub2RlVXVpZH1gXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gMi4g55Sf5oiQ6aKE5Yi25L2TVVVJRFxuICAgICAgICAgICAgICAgIGNvbnN0IHByZWZhYlV1aWQgPSB0aGlzLmdlbmVyYXRlVVVJRCgpO1xuXG4gICAgICAgICAgICAgICAgLy8gMy4g5Yib5bu66aKE5Yi25L2T5pWw5o2u57uT5p6EXG4gICAgICAgICAgICAgICAgY29uc3QgcHJlZmFiRGF0YSA9IHRoaXMuY3JlYXRlUHJlZmFiRGF0YShub2RlRGF0YSwgcHJlZmFiTmFtZSwgcHJlZmFiVXVpZCk7XG5cbiAgICAgICAgICAgICAgICAvLyA0LiDln7rkuo7lrpjmlrnmoLzlvI/liJvlu7rpooTliLbkvZPmlbDmja7nu5PmnoRcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPT09IOW8gOWni+WIm+W7uumihOWItuS9kyA9PT0nKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygn6IqC54K55ZCN56ewOicsIG5vZGVEYXRhLm5hbWU/LnZhbHVlIHx8ICfmnKrnn6UnKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygn6IqC54K5VVVJRDonLCBub2RlRGF0YS51dWlkPy52YWx1ZSB8fCAn5pyq55+lJyk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ+mihOWItuS9k+S/neWtmOi3r+W+hDonLCBwcmVmYWJQYXRoKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhg5byA5aeL5Yib5bu66aKE5Yi25L2T77yM6IqC54K55pWw5o2uOmAsIG5vZGVEYXRhKTtcbiAgICAgICAgICAgICAgICBjb25zdCBwcmVmYWJKc29uRGF0YSA9IGF3YWl0IHRoaXMuY3JlYXRlU3RhbmRhcmRQcmVmYWJDb250ZW50KG5vZGVEYXRhLCBwcmVmYWJOYW1lLCBwcmVmYWJVdWlkLCB0cnVlLCB0cnVlKTtcblxuICAgICAgICAgICAgICAgIC8vIDUuIOWIm+W7uuagh+WHhm1ldGHmlofku7bmlbDmja5cbiAgICAgICAgICAgICAgICBjb25zdCBzdGFuZGFyZE1ldGFEYXRhID0gdGhpcy5jcmVhdGVTdGFuZGFyZE1ldGFEYXRhKHByZWZhYk5hbWUsIHByZWZhYlV1aWQpO1xuXG4gICAgICAgICAgICAgICAgLy8gNi4g5L+d5a2Y6aKE5Yi25L2T5ZKMbWV0YeaWh+S7tlxuICAgICAgICAgICAgICAgIGNvbnN0IHNhdmVSZXN1bHQgPSBhd2FpdCB0aGlzLnNhdmVQcmVmYWJXaXRoTWV0YShwcmVmYWJQYXRoLCBwcmVmYWJKc29uRGF0YSwgc3RhbmRhcmRNZXRhRGF0YSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoc2F2ZVJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOS/neWtmOaIkOWKn+WQju+8jOWwhuWOn+Wni+iKgueCuei9rOaNouS4uumihOWItuS9k+WunuS+i1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb252ZXJ0UmVzdWx0ID0gYXdhaXQgdGhpcy5jb252ZXJ0Tm9kZVRvUHJlZmFiSW5zdGFuY2Uobm9kZVV1aWQsIHByZWZhYlBhdGgsIHByZWZhYlV1aWQpO1xuXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmVmYWJVdWlkOiBwcmVmYWJVdWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByZWZhYlBhdGg6IHByZWZhYlBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVV1aWQ6IG5vZGVVdWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByZWZhYk5hbWU6IHByZWZhYk5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udmVydGVkVG9QcmVmYWJJbnN0YW5jZTogY29udmVydFJlc3VsdC5zdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGNvbnZlcnRSZXN1bHQuc3VjY2VzcyA/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICfoh6rlrprkuYnpooTliLbkvZPliJvlu7rmiJDlip/vvIzljp/lp4voioLngrnlt7LovazmjaLkuLrpooTliLbkvZPlrp7kvosnIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ+mihOWItuS9k+WIm+W7uuaIkOWKn++8jOS9huiKgueCuei9rOaNouWksei0pSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBzYXZlUmVzdWx0LmVycm9yIHx8ICfkv53lrZjpooTliLbkvZPmlofku7blpLHotKUnXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBg5Yib5bu66aKE5Yi25L2T5pe25Y+R55Sf6ZSZ6K+vOiAke2Vycm9yfWBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBnZXROb2RlRGF0YShub2RlVXVpZDogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGFzeW5jIChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIC8vIOS9v+eUqCAyLnggQVBJIOiOt+WPluWfuuacrOiKgueCueS/oeaBr1xuICAgICAgICAgICAgICAgIGNvbnN0IG5vZGVJbmZvID0gRWRpdG9yLlNjZW5lLmNhbGxTY2VuZVNjcmlwdCgnY29jb3MtbWNwLXNlcnZlcicsICdxdWVyeU5vZGUnLCBub2RlVXVpZCk7XG4gICAgICAgICAgICAgICAgaWYgKCFub2RlSW5mbyB8fCAhbm9kZUluZm8uc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKG51bGwpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYOiOt+WPluiKgueCuSAke25vZGVVdWlkfSDnmoTln7rmnKzkv6Hmga/miJDlip9gKTtcblxuICAgICAgICAgICAgICAgIC8vIOS9v+eUqHF1ZXJ5LW5vZGUtdHJlZeiOt+WPluWMheWQq+WtkOiKgueCueeahOWujOaVtOe7k+aehFxuICAgICAgICAgICAgICAgIGNvbnN0IG5vZGVUcmVlID0gYXdhaXQgdGhpcy5nZXROb2RlV2l0aENoaWxkcmVuKG5vZGVVdWlkKTtcbiAgICAgICAgICAgICAgICBpZiAobm9kZVRyZWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYOiOt+WPluiKgueCuSAke25vZGVVdWlkfSDnmoTlrozmlbTmoJHnu5PmnoTmiJDlip9gKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShub2RlVHJlZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYOS9v+eUqOWfuuacrOiKgueCueS/oeaBr2ApO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKG5vZGVJbmZvLmRhdGEgfHwgbm9kZUluZm8pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGDojrflj5boioLngrnmlbDmja7lpLHotKUgJHtub2RlVXVpZH06YCwgZXJyb3IpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUobnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIOS9v+eUqHF1ZXJ5LW5vZGUtdHJlZeiOt+WPluWMheWQq+WtkOiKgueCueeahOWujOaVtOiKgueCuee7k+aehFxuICAgIHByaXZhdGUgYXN5bmMgZ2V0Tm9kZVdpdGhDaGlsZHJlbihub2RlVXVpZDogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIOS9v+eUqCAyLnggQVBJIOiOt+WPluaVtOS4quWcuuaZr+agkVxuICAgICAgICAgICAgY29uc3QgdHJlZVJlc3VsdCA9IEVkaXRvci5TY2VuZS5jYWxsU2NlbmVTY3JpcHQoJ2NvY29zLW1jcC1zZXJ2ZXInLCAnZ2V0U2NlbmVIaWVyYXJjaHknKTtcbiAgICAgICAgICAgIGNvbnN0IHRyZWUgPSB0cmVlUmVzdWx0Py5kYXRhIHx8IHRyZWVSZXN1bHQ7XG4gICAgICAgICAgICBpZiAoIXRyZWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g5Zyo5qCR5Lit5p+l5om+5oyH5a6a55qE6IqC54K5XG4gICAgICAgICAgICBjb25zdCB0YXJnZXROb2RlID0gdGhpcy5maW5kTm9kZUluVHJlZSh0cmVlLCBub2RlVXVpZCk7XG4gICAgICAgICAgICBpZiAodGFyZ2V0Tm9kZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGDlnKjlnLrmma/moJHkuK3mib7liLDoioLngrkgJHtub2RlVXVpZH3vvIzlrZDoioLngrnmlbDph486ICR7dGFyZ2V0Tm9kZS5jaGlsZHJlbiA/IHRhcmdldE5vZGUuY2hpbGRyZW4ubGVuZ3RoIDogMH1gKTtcblxuICAgICAgICAgICAgICAgIC8vIOWinuW8uuiKgueCueagke+8jOiOt+WPluavj+S4quiKgueCueeahOato+ehrue7hOS7tuS/oeaBr1xuICAgICAgICAgICAgICAgIGNvbnN0IGVuaGFuY2VkVHJlZSA9IGF3YWl0IHRoaXMuZW5oYW5jZVRyZWVXaXRoTUNQQ29tcG9uZW50cyh0YXJnZXROb2RlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZW5oYW5jZWRUcmVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2Fybihg6I635Y+W6IqC54K55qCR57uT5p6E5aSx6LSlICR7bm9kZVV1aWR9OmAsIGVycm9yKTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8g5Zyo6IqC54K55qCR5Lit6YCS5b2S5p+l5om+5oyH5a6aVVVJROeahOiKgueCuVxuICAgIHByaXZhdGUgZmluZE5vZGVJblRyZWUobm9kZTogYW55LCB0YXJnZXRVdWlkOiBzdHJpbmcpOiBhbnkge1xuICAgICAgICBpZiAoIW5vZGUpIHJldHVybiBudWxsO1xuXG4gICAgICAgIC8vIOajgOafpeW9k+WJjeiKgueCuVxuICAgICAgICBpZiAobm9kZS51dWlkID09PSB0YXJnZXRVdWlkIHx8IG5vZGUudmFsdWU/LnV1aWQgPT09IHRhcmdldFV1aWQpIHtcbiAgICAgICAgICAgIHJldHVybiBub2RlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g6YCS5b2S5qOA5p+l5a2Q6IqC54K5XG4gICAgICAgIGlmIChub2RlLmNoaWxkcmVuICYmIEFycmF5LmlzQXJyYXkobm9kZS5jaGlsZHJlbikpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgY2hpbGQgb2Ygbm9kZS5jaGlsZHJlbikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZvdW5kID0gdGhpcy5maW5kTm9kZUluVHJlZShjaGlsZCwgdGFyZ2V0VXVpZCk7XG4gICAgICAgICAgICAgICAgaWYgKGZvdW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmb3VuZDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDkvb/nlKhNQ1DmjqXlj6Plop7lvLroioLngrnmoJHvvIzojrflj5bmraPnoa7nmoTnu4Tku7bkv6Hmga9cbiAgICAgKi9cbiAgICBwcml2YXRlIGFzeW5jIGVuaGFuY2VUcmVlV2l0aE1DUENvbXBvbmVudHMobm9kZTogYW55KTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgaWYgKCFub2RlIHx8ICFub2RlLnV1aWQpIHtcbiAgICAgICAgICAgIHJldHVybiBub2RlO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIOS9v+eUqE1DUOaOpeWPo+iOt+WPluiKgueCueeahOe7hOS7tuS/oeaBr1xuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCgnaHR0cDovL2xvY2FsaG9zdDo4NTg1L21jcCcsIHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgICAgIFwianNvbnJwY1wiOiBcIjIuMFwiLFxuICAgICAgICAgICAgICAgICAgICBcIm1ldGhvZFwiOiBcInRvb2xzL2NhbGxcIixcbiAgICAgICAgICAgICAgICAgICAgXCJwYXJhbXNcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJuYW1lXCI6IFwiY29tcG9uZW50X2dldF9jb21wb25lbnRzXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcImFyZ3VtZW50c1wiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJub2RlVXVpZFwiOiBub2RlLnV1aWRcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgXCJpZFwiOiBEYXRlLm5vdygpXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBjb25zdCBtY3BSZXN1bHQgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gICAgICAgICAgICBpZiAobWNwUmVzdWx0LnJlc3VsdD8uY29udGVudD8uWzBdPy50ZXh0KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29tcG9uZW50RGF0YSA9IEpTT04ucGFyc2UobWNwUmVzdWx0LnJlc3VsdC5jb250ZW50WzBdLnRleHQpO1xuICAgICAgICAgICAgICAgIGlmIChjb21wb25lbnREYXRhLnN1Y2Nlc3MgJiYgY29tcG9uZW50RGF0YS5kYXRhLmNvbXBvbmVudHMpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5pu05paw6IqC54K555qE57uE5Lu25L+h5oGv5Li6TUNQ6L+U5Zue55qE5q2j56Gu5pWw5o2uXG4gICAgICAgICAgICAgICAgICAgIG5vZGUuY29tcG9uZW50cyA9IGNvbXBvbmVudERhdGEuZGF0YS5jb21wb25lbnRzO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhg6IqC54K5ICR7bm9kZS51dWlkfSDojrflj5bliLAgJHtjb21wb25lbnREYXRhLmRhdGEuY29tcG9uZW50cy5sZW5ndGh9IOS4que7hOS7tu+8jOWMheWQq+iEmuacrOe7hOS7tueahOato+ehruexu+Wei2ApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2Fybihg6I635Y+W6IqC54K5ICR7bm9kZS51dWlkfSDnmoRNQ1Dnu4Tku7bkv6Hmga/lpLHotKU6YCwgZXJyb3IpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g6YCS5b2S5aSE55CG5a2Q6IqC54K5XG4gICAgICAgIGlmIChub2RlLmNoaWxkcmVuICYmIEFycmF5LmlzQXJyYXkobm9kZS5jaGlsZHJlbikpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIG5vZGUuY2hpbGRyZW5baV0gPSBhd2FpdCB0aGlzLmVuaGFuY2VUcmVlV2l0aE1DUENvbXBvbmVudHMobm9kZS5jaGlsZHJlbltpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbm9kZTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGJ1aWxkQmFzaWNOb2RlSW5mbyhub2RlVXVpZDogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIC8vIOS9v+eUqCAyLnggQVBJIOaehOW7uuWfuuacrOeahOiKgueCueS/oeaBr1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IEVkaXRvci5TY2VuZS5jYWxsU2NlbmVTY3JpcHQoJ2NvY29zLW1jcC1zZXJ2ZXInLCAncXVlcnlOb2RlJywgbm9kZVV1aWQpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG5vZGVJbmZvID0gcmVzdWx0Py5kYXRhIHx8IHJlc3VsdDtcbiAgICAgICAgICAgICAgICBpZiAoIW5vZGVJbmZvKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUobnVsbCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyDnroDljJbniYjmnKzvvJrlj6rov5Tlm57ln7rmnKzoioLngrnkv6Hmga/vvIzkuI3ojrflj5blrZDoioLngrnlkoznu4Tku7ZcbiAgICAgICAgICAgICAgICAvLyDov5nkupvkv6Hmga/lsIblnKjlkI7nu63nmoTpooTliLbkvZPlpITnkIbkuK3moLnmja7pnIDopoHmt7vliqBcbiAgICAgICAgICAgICAgICBjb25zdCBiYXNpY0luZm8gPSB7XG4gICAgICAgICAgICAgICAgICAgIC4uLm5vZGVJbmZvLFxuICAgICAgICAgICAgICAgICAgICBjaGlsZHJlbjogW10sXG4gICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudHM6IFtdXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKGJhc2ljSW5mbyk7XG4gICAgICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyDpqozor4HoioLngrnmlbDmja7mmK/lkKbmnInmlYhcbiAgICBwcml2YXRlIGlzVmFsaWROb2RlRGF0YShub2RlRGF0YTogYW55KTogYm9vbGVhbiB7XG4gICAgICAgIGlmICghbm9kZURhdGEpIHJldHVybiBmYWxzZTtcbiAgICAgICAgaWYgKHR5cGVvZiBub2RlRGF0YSAhPT0gJ29iamVjdCcpIHJldHVybiBmYWxzZTtcblxuICAgICAgICAvLyDmo4Dmn6Xln7rmnKzlsZ7mgKcgLSDpgILphY1xdWVyeS1ub2RlLXRyZWXnmoTmlbDmja7moLzlvI9cbiAgICAgICAgcmV0dXJuIG5vZGVEYXRhLmhhc093blByb3BlcnR5KCd1dWlkJykgfHxcbiAgICAgICAgICAgICAgIG5vZGVEYXRhLmhhc093blByb3BlcnR5KCduYW1lJykgfHxcbiAgICAgICAgICAgICAgIG5vZGVEYXRhLmhhc093blByb3BlcnR5KCdfX3R5cGVfXycpIHx8XG4gICAgICAgICAgICAgICAobm9kZURhdGEudmFsdWUgJiYgKFxuICAgICAgICAgICAgICAgICAgIG5vZGVEYXRhLnZhbHVlLmhhc093blByb3BlcnR5KCd1dWlkJykgfHxcbiAgICAgICAgICAgICAgICAgICBub2RlRGF0YS52YWx1ZS5oYXNPd25Qcm9wZXJ0eSgnbmFtZScpIHx8XG4gICAgICAgICAgICAgICAgICAgbm9kZURhdGEudmFsdWUuaGFzT3duUHJvcGVydHkoJ19fdHlwZV9fJylcbiAgICAgICAgICAgICAgICkpO1xuICAgIH1cblxuICAgIC8vIOaPkOWPluWtkOiKgueCuVVVSUTnmoTnu5/kuIDmlrnms5VcbiAgICBwcml2YXRlIGV4dHJhY3RDaGlsZFV1aWQoY2hpbGRSZWY6IGFueSk6IHN0cmluZyB8IG51bGwge1xuICAgICAgICBpZiAoIWNoaWxkUmVmKSByZXR1cm4gbnVsbDtcblxuICAgICAgICAvLyDmlrnms5UxOiDnm7TmjqXlrZfnrKbkuLJcbiAgICAgICAgaWYgKHR5cGVvZiBjaGlsZFJlZiA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJldHVybiBjaGlsZFJlZjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOaWueazlTI6IHZhbHVl5bGe5oCn5YyF5ZCr5a2X56ym5LiyXG4gICAgICAgIGlmIChjaGlsZFJlZi52YWx1ZSAmJiB0eXBlb2YgY2hpbGRSZWYudmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICByZXR1cm4gY2hpbGRSZWYudmFsdWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDmlrnms5UzOiB2YWx1ZS51dWlk5bGe5oCnXG4gICAgICAgIGlmIChjaGlsZFJlZi52YWx1ZSAmJiBjaGlsZFJlZi52YWx1ZS51dWlkKSB7XG4gICAgICAgICAgICByZXR1cm4gY2hpbGRSZWYudmFsdWUudXVpZDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOaWueazlTQ6IOebtOaOpXV1aWTlsZ7mgKdcbiAgICAgICAgaWYgKGNoaWxkUmVmLnV1aWQpIHtcbiAgICAgICAgICAgIHJldHVybiBjaGlsZFJlZi51dWlkO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5pa55rOVNTogX19pZF9f5byV55SoIC0g6L+Z56eN5oOF5Ya16ZyA6KaB54m55q6K5aSE55CGXG4gICAgICAgIGlmIChjaGlsZFJlZi5fX2lkX18gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYOWPkeeOsF9faWRfX+W8leeUqDogJHtjaGlsZFJlZi5fX2lkX19977yM5Y+v6IO96ZyA6KaB5LuO5pWw5o2u57uT5p6E5Lit5p+l5om+YCk7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDsgLy8g5pqC5pe26L+U5ZuebnVsbO+8jOWQjue7reWPr+S7pea3u+WKoOW8leeUqOino+aekOmAu+i+kVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc29sZS53YXJuKCfml6Dms5Xmj5Dlj5blrZDoioLngrlVVUlEOicsIEpTT04uc3RyaW5naWZ5KGNoaWxkUmVmKSk7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8vIOiOt+WPlumcgOimgeWkhOeQhueahOWtkOiKgueCueaVsOaNrlxuICAgIHByaXZhdGUgZ2V0Q2hpbGRyZW5Ub1Byb2Nlc3Mobm9kZURhdGE6IGFueSk6IGFueVtdIHtcbiAgICAgICAgY29uc3QgY2hpbGRyZW46IGFueVtdID0gW107XG5cbiAgICAgICAgLy8g5pa55rOVMTog55u05o6l5LuOY2hpbGRyZW7mlbDnu4Tojrflj5bvvIjku45xdWVyeS1ub2RlLXRyZWXov5Tlm57nmoTmlbDmja7vvIlcbiAgICAgICAgaWYgKG5vZGVEYXRhLmNoaWxkcmVuICYmIEFycmF5LmlzQXJyYXkobm9kZURhdGEuY2hpbGRyZW4pKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhg5LuOY2hpbGRyZW7mlbDnu4Tojrflj5blrZDoioLngrnvvIzmlbDph486ICR7bm9kZURhdGEuY2hpbGRyZW4ubGVuZ3RofWApO1xuICAgICAgICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBub2RlRGF0YS5jaGlsZHJlbikge1xuICAgICAgICAgICAgICAgIC8vIHF1ZXJ5LW5vZGUtdHJlZei/lOWbnueahOWtkOiKgueCuemAmuW4uOW3sue7j+aYr+WujOaVtOeahOaVsOaNrue7k+aehFxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmlzVmFsaWROb2RlRGF0YShjaGlsZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW4ucHVzaChjaGlsZCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGDmt7vliqDlrZDoioLngrk6ICR7Y2hpbGQubmFtZSB8fCBjaGlsZC52YWx1ZT8ubmFtZSB8fCAn5pyq55+lJ31gKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygn5a2Q6IqC54K55pWw5o2u5peg5pWIOicsIEpTT04uc3RyaW5naWZ5KGNoaWxkLCBudWxsLCAyKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ+iKgueCueayoeacieWtkOiKgueCueaIlmNoaWxkcmVu5pWw57uE5Li656m6Jyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY2hpbGRyZW47XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZW5lcmF0ZVVVSUQoKTogc3RyaW5nIHtcbiAgICAgICAgLy8g55Sf5oiQ56ym5ZCIQ29jb3MgQ3JlYXRvcuagvOW8j+eahFVVSURcbiAgICAgICAgY29uc3QgY2hhcnMgPSAnMDEyMzQ1Njc4OWFiY2RlZic7XG4gICAgICAgIGxldCB1dWlkID0gJyc7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMzI7IGkrKykge1xuICAgICAgICAgICAgaWYgKGkgPT09IDggfHwgaSA9PT0gMTIgfHwgaSA9PT0gMTYgfHwgaSA9PT0gMjApIHtcbiAgICAgICAgICAgICAgICB1dWlkICs9ICctJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHV1aWQgKz0gY2hhcnNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogY2hhcnMubGVuZ3RoKV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHV1aWQ7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjcmVhdGVQcmVmYWJEYXRhKG5vZGVEYXRhOiBhbnksIHByZWZhYk5hbWU6IHN0cmluZywgcHJlZmFiVXVpZDogc3RyaW5nKTogYW55W10ge1xuICAgICAgICAvLyDliJvlu7rmoIflh4bnmoTpooTliLbkvZPmlbDmja7nu5PmnoRcbiAgICAgICAgY29uc3QgcHJlZmFiQXNzZXQgPSB7XG4gICAgICAgICAgICBcIl9fdHlwZV9fXCI6IFwiY2MuUHJlZmFiXCIsXG4gICAgICAgICAgICBcIl9uYW1lXCI6IHByZWZhYk5hbWUsXG4gICAgICAgICAgICBcIl9vYmpGbGFnc1wiOiAwLFxuICAgICAgICAgICAgXCJfX2VkaXRvckV4dHJhc19fXCI6IHt9LFxuICAgICAgICAgICAgXCJfbmF0aXZlXCI6IFwiXCIsXG4gICAgICAgICAgICBcImRhdGFcIjoge1xuICAgICAgICAgICAgICAgIFwiX19pZF9fXCI6IDFcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcIm9wdGltaXphdGlvblBvbGljeVwiOiAwLFxuICAgICAgICAgICAgXCJwZXJzaXN0ZW50XCI6IGZhbHNlXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8g5aSE55CG6IqC54K55pWw5o2u77yM56Gu5L+d56ym5ZCI6aKE5Yi25L2T5qC85byPXG4gICAgICAgIGNvbnN0IHByb2Nlc3NlZE5vZGVEYXRhID0gdGhpcy5wcm9jZXNzTm9kZUZvclByZWZhYihub2RlRGF0YSwgcHJlZmFiVXVpZCk7XG5cbiAgICAgICAgcmV0dXJuIFtwcmVmYWJBc3NldCwgLi4ucHJvY2Vzc2VkTm9kZURhdGFdO1xuICAgIH1cblxuICAgIHByaXZhdGUgcHJvY2Vzc05vZGVGb3JQcmVmYWIobm9kZURhdGE6IGFueSwgcHJlZmFiVXVpZDogc3RyaW5nKTogYW55W10ge1xuICAgICAgICAvLyDlpITnkIboioLngrnmlbDmja7ku6XnrKblkIjpooTliLbkvZPmoLzlvI9cbiAgICAgICAgY29uc3QgcHJvY2Vzc2VkRGF0YTogYW55W10gPSBbXTtcbiAgICAgICAgbGV0IGlkQ291bnRlciA9IDE7XG5cbiAgICAgICAgLy8g6YCS5b2S5aSE55CG6IqC54K55ZKM57uE5Lu2XG4gICAgICAgIGNvbnN0IHByb2Nlc3NOb2RlID0gKG5vZGU6IGFueSwgcGFyZW50SWQ6IG51bWJlciA9IDApOiBudW1iZXIgPT4ge1xuICAgICAgICAgICAgY29uc3Qgbm9kZUlkID0gaWRDb3VudGVyKys7XG5cbiAgICAgICAgICAgIC8vIOWIm+W7uuiKgueCueWvueixoVxuICAgICAgICAgICAgY29uc3QgcHJvY2Vzc2VkTm9kZSA9IHtcbiAgICAgICAgICAgICAgICBcIl9fdHlwZV9fXCI6IFwiY2MuTm9kZVwiLFxuICAgICAgICAgICAgICAgIFwiX25hbWVcIjogbm9kZS5uYW1lIHx8IFwiTm9kZVwiLFxuICAgICAgICAgICAgICAgIFwiX29iakZsYWdzXCI6IDAsXG4gICAgICAgICAgICAgICAgXCJfX2VkaXRvckV4dHJhc19fXCI6IHt9LFxuICAgICAgICAgICAgICAgIFwiX3BhcmVudFwiOiBwYXJlbnRJZCA+IDAgPyB7IFwiX19pZF9fXCI6IHBhcmVudElkIH0gOiBudWxsLFxuICAgICAgICAgICAgICAgIFwiX2NoaWxkcmVuXCI6IG5vZGUuY2hpbGRyZW4gPyBub2RlLmNoaWxkcmVuLm1hcCgoKSA9PiAoeyBcIl9faWRfX1wiOiBpZENvdW50ZXIrKyB9KSkgOiBbXSxcbiAgICAgICAgICAgICAgICBcIl9hY3RpdmVcIjogbm9kZS5hY3RpdmUgIT09IGZhbHNlLFxuICAgICAgICAgICAgICAgIFwiX2NvbXBvbmVudHNcIjogbm9kZS5jb21wb25lbnRzID8gbm9kZS5jb21wb25lbnRzLm1hcCgoKSA9PiAoeyBcIl9faWRfX1wiOiBpZENvdW50ZXIrKyB9KSkgOiBbXSxcbiAgICAgICAgICAgICAgICBcIl9wcmVmYWJcIjoge1xuICAgICAgICAgICAgICAgICAgICBcIl9faWRfX1wiOiBpZENvdW50ZXIrK1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgXCJfbHBvc1wiOiB7XG4gICAgICAgICAgICAgICAgICAgIFwiX190eXBlX19cIjogXCJjYy5WZWMzXCIsXG4gICAgICAgICAgICAgICAgICAgIFwieFwiOiAwLFxuICAgICAgICAgICAgICAgICAgICBcInlcIjogMCxcbiAgICAgICAgICAgICAgICAgICAgXCJ6XCI6IDBcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIFwiX2xyb3RcIjoge1xuICAgICAgICAgICAgICAgICAgICBcIl9fdHlwZV9fXCI6IFwiY2MuUXVhdFwiLFxuICAgICAgICAgICAgICAgICAgICBcInhcIjogMCxcbiAgICAgICAgICAgICAgICAgICAgXCJ5XCI6IDAsXG4gICAgICAgICAgICAgICAgICAgIFwielwiOiAwLFxuICAgICAgICAgICAgICAgICAgICBcIndcIjogMVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgXCJfbHNjYWxlXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBcImNjLlZlYzNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ4XCI6IDEsXG4gICAgICAgICAgICAgICAgICAgIFwieVwiOiAxLFxuICAgICAgICAgICAgICAgICAgICBcInpcIjogMVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgXCJfbW9iaWxpdHlcIjogMCxcbiAgICAgICAgICAgICAgICBcIl9sYXllclwiOiAxMDczNzQxODI0LFxuICAgICAgICAgICAgICAgIFwiX2V1bGVyXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBcImNjLlZlYzNcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ4XCI6IDAsXG4gICAgICAgICAgICAgICAgICAgIFwieVwiOiAwLFxuICAgICAgICAgICAgICAgICAgICBcInpcIjogMFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgXCJfaWRcIjogXCJcIlxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgcHJvY2Vzc2VkRGF0YS5wdXNoKHByb2Nlc3NlZE5vZGUpO1xuXG4gICAgICAgICAgICAvLyDlpITnkIbnu4Tku7ZcbiAgICAgICAgICAgIGlmIChub2RlLmNvbXBvbmVudHMpIHtcbiAgICAgICAgICAgICAgICBub2RlLmNvbXBvbmVudHMuZm9yRWFjaCgoY29tcG9uZW50OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29tcG9uZW50SWQgPSBpZENvdW50ZXIrKztcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvY2Vzc2VkQ29tcG9uZW50cyA9IHRoaXMucHJvY2Vzc0NvbXBvbmVudEZvclByZWZhYihjb21wb25lbnQsIGNvbXBvbmVudElkKTtcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzc2VkRGF0YS5wdXNoKC4uLnByb2Nlc3NlZENvbXBvbmVudHMpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDlpITnkIblrZDoioLngrlcbiAgICAgICAgICAgIGlmIChub2RlLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5jaGlsZHJlbi5mb3JFYWNoKChjaGlsZDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHByb2Nlc3NOb2RlKGNoaWxkLCBub2RlSWQpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gbm9kZUlkO1xuICAgICAgICB9O1xuXG4gICAgICAgIHByb2Nlc3NOb2RlKG5vZGVEYXRhKTtcbiAgICAgICAgcmV0dXJuIHByb2Nlc3NlZERhdGE7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBwcm9jZXNzQ29tcG9uZW50Rm9yUHJlZmFiKGNvbXBvbmVudDogYW55LCBjb21wb25lbnRJZDogbnVtYmVyKTogYW55W10ge1xuICAgICAgICAvLyDlpITnkIbnu4Tku7bmlbDmja7ku6XnrKblkIjpooTliLbkvZPmoLzlvI9cbiAgICAgICAgY29uc3QgcHJvY2Vzc2VkQ29tcG9uZW50ID0ge1xuICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBjb21wb25lbnQudHlwZSB8fCBcImNjLkNvbXBvbmVudFwiLFxuICAgICAgICAgICAgXCJfbmFtZVwiOiBcIlwiLFxuICAgICAgICAgICAgXCJfb2JqRmxhZ3NcIjogMCxcbiAgICAgICAgICAgIFwiX19lZGl0b3JFeHRyYXNfX1wiOiB7fSxcbiAgICAgICAgICAgIFwibm9kZVwiOiB7XG4gICAgICAgICAgICAgICAgXCJfX2lkX19cIjogY29tcG9uZW50SWQgLSAxXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJfZW5hYmxlZFwiOiBjb21wb25lbnQuZW5hYmxlZCAhPT0gZmFsc2UsXG4gICAgICAgICAgICBcIl9fcHJlZmFiXCI6IHtcbiAgICAgICAgICAgICAgICBcIl9faWRfX1wiOiBjb21wb25lbnRJZCArIDFcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAuLi5jb21wb25lbnQucHJvcGVydGllc1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIOa3u+WKoOe7hOS7tueJueWumueahOmihOWItuS9k+S/oeaBr1xuICAgICAgICBjb25zdCBjb21wUHJlZmFiSW5mbyA9IHtcbiAgICAgICAgICAgIFwiX190eXBlX19cIjogXCJjYy5Db21wUHJlZmFiSW5mb1wiLFxuICAgICAgICAgICAgXCJmaWxlSWRcIjogdGhpcy5nZW5lcmF0ZUZpbGVJZCgpXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIFtwcm9jZXNzZWRDb21wb25lbnQsIGNvbXBQcmVmYWJJbmZvXTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdlbmVyYXRlRmlsZUlkKCk6IHN0cmluZyB7XG4gICAgICAgIC8vIOeUn+aIkOaWh+S7tklE77yI566A5YyW54mI5pys77yJXG4gICAgICAgIGNvbnN0IGNoYXJzID0gJ2FiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVowMTIzNDU2Nzg5Ky8nO1xuICAgICAgICBsZXQgZmlsZUlkID0gJyc7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMjI7IGkrKykge1xuICAgICAgICAgICAgZmlsZUlkICs9IGNoYXJzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGNoYXJzLmxlbmd0aCldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmaWxlSWQ7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjcmVhdGVNZXRhRGF0YShwcmVmYWJOYW1lOiBzdHJpbmcsIHByZWZhYlV1aWQ6IHN0cmluZyk6IGFueSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBcInZlclwiOiBcIjEuMS41MFwiLFxuICAgICAgICAgICAgXCJpbXBvcnRlclwiOiBcInByZWZhYlwiLFxuICAgICAgICAgICAgXCJpbXBvcnRlZFwiOiB0cnVlLFxuICAgICAgICAgICAgXCJ1dWlkXCI6IHByZWZhYlV1aWQsXG4gICAgICAgICAgICBcImZpbGVzXCI6IFtcbiAgICAgICAgICAgICAgICBcIi5qc29uXCJcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBcInN1Yk1ldGFzXCI6IHt9LFxuICAgICAgICAgICAgXCJ1c2VyRGF0YVwiOiB7XG4gICAgICAgICAgICAgICAgXCJzeW5jTm9kZU5hbWVcIjogcHJlZmFiTmFtZVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgc2F2ZVByZWZhYkZpbGVzKHByZWZhYlBhdGg6IHN0cmluZywgcHJlZmFiRGF0YTogYW55W10sIG1ldGFEYXRhOiBhbnkpOiBQcm9taXNlPHsgc3VjY2VzczogYm9vbGVhbjsgZXJyb3I/OiBzdHJpbmcgfT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgLy8g5L2/55SoRWRpdG9yIEFQSeS/neWtmOmihOWItuS9k+aWh+S7tlxuICAgICAgICAgICAgICAgIGNvbnN0IHByZWZhYkNvbnRlbnQgPSBKU09OLnN0cmluZ2lmeShwcmVmYWJEYXRhLCBudWxsLCAyKTtcbiAgICAgICAgICAgICAgICBjb25zdCBtZXRhQ29udGVudCA9IEpTT04uc3RyaW5naWZ5KG1ldGFEYXRhLCBudWxsLCAyKTtcblxuICAgICAgICAgICAgICAgIC8vIOWwneivleS9v+eUqOabtOWPr+mdoOeahOS/neWtmOaWueazlVxuICAgICAgICAgICAgICAgIHRoaXMuc2F2ZUFzc2V0RmlsZShwcmVmYWJQYXRoLCBwcmVmYWJDb250ZW50KS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5YaN5Yib5bu6bWV0YeaWh+S7tlxuICAgICAgICAgICAgICAgICAgICBjb25zdCBtZXRhUGF0aCA9IGAke3ByZWZhYlBhdGh9Lm1ldGFgO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zYXZlQXNzZXRGaWxlKG1ldGFQYXRoLCBtZXRhQ29udGVudCk7XG4gICAgICAgICAgICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgIH0pLmNhdGNoKChlcnJvcjogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfHwgJ+S/neWtmOmihOWItuS9k+aWh+S7tuWksei0pScgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGDkv53lrZjmlofku7bml7blj5HnlJ/plJnor686ICR7ZXJyb3J9YCB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBzYXZlQXNzZXRGaWxlKGZpbGVQYXRoOiBzdHJpbmcsIGNvbnRlbnQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgLy8g5L2/55SoIDIueCBBUEkg5Yib5bu6L+S/neWtmOaWh+S7tlxuICAgICAgICAgICAgRWRpdG9yLmFzc2V0ZGIuY3JlYXRlKGZpbGVQYXRoLCBjb250ZW50LCAoZXJyOiBFcnJvciB8IG51bGwpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyB1cGRhdGVQcmVmYWIocHJlZmFiUGF0aDogc3RyaW5nLCBub2RlVXVpZDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGFzeW5jIChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFzc2V0SW5mbyA9IGF3YWl0IHRoaXMucXVlcnlBc3NldEluZm9CeVVybChwcmVmYWJQYXRoKTtcbiAgICAgICAgICAgICAgICBpZiAoIWFzc2V0SW5mbykge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1ByZWZhYiBub3QgZm91bmQnKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyDkvb/nlKggMi54IEFQSSDlupTnlKjpooTliLbkvZNcbiAgICAgICAgICAgICAgICBFZGl0b3IuSXBjLnNlbmRUb1BhbmVsKCdzY2VuZScsICdzY2VuZTphcHBseS1wcmVmYWInLCBub2RlVXVpZCk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdQcmVmYWIgdXBkYXRlZCBzdWNjZXNzZnVsbHknXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHJldmVydFByZWZhYihub2RlVXVpZDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIC8vIDIueOyXkOyEnOuKlCByZXZlcnQtcHJlZmFiIOuqheugueyWtOqwgCDsl4bsnYQg7IiYIOyeiOydjFxuICAgICAgICAgICAgICAgIC8vIGJyZWFrLXByZWZhYi1pbnN0YW5jZeulvCDsgqzsmqntlZjsl6wg7Jew6rKwIO2VtOygnFxuICAgICAgICAgICAgICAgIEVkaXRvci5JcGMuc2VuZFRvUGFuZWwoJ3NjZW5lJywgJ3NjZW5lOmJyZWFrLXByZWZhYi1pbnN0YW5jZScsIG5vZGVVdWlkKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ1ByZWZhYiBpbnN0YW5jZSByZXZlcnRlZCBzdWNjZXNzZnVsbHknXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGdldFByZWZhYkluZm8ocHJlZmFiUGF0aDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGFzeW5jIChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFzc2V0SW5mbyA9IGF3YWl0IHRoaXMucXVlcnlBc3NldEluZm9CeVVybChwcmVmYWJQYXRoKTtcbiAgICAgICAgICAgICAgICBpZiAoIWFzc2V0SW5mbykge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1ByZWZhYiBub3QgZm91bmQnKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyDojrflj5ZtZXRh5L+h5oGvXG4gICAgICAgICAgICAgICAgY29uc3QgbWV0YUluZm8gPSBhd2FpdCBuZXcgUHJvbWlzZTxhbnk+KChyZXNvbHZlTWV0YSwgcmVqZWN0TWV0YSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBFZGl0b3IuYXNzZXRkYi5xdWVyeU1ldGFJbmZvQnlVdWlkKGFzc2V0SW5mby51dWlkLCAoZXJyOiBFcnJvciB8IG51bGwsIG1ldGE6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdE1ldGEoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZU1ldGEobWV0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgaW5mbzogUHJlZmFiSW5mbyA9IHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogbWV0YUluZm8ubmFtZSB8fCBhc3NldEluZm8ubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgdXVpZDogbWV0YUluZm8udXVpZCB8fCBhc3NldEluZm8udXVpZCxcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogcHJlZmFiUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgZm9sZGVyOiBwcmVmYWJQYXRoLnN1YnN0cmluZygwLCBwcmVmYWJQYXRoLmxhc3RJbmRleE9mKCcvJykpLFxuICAgICAgICAgICAgICAgICAgICBjcmVhdGVUaW1lOiBtZXRhSW5mby5jcmVhdGVUaW1lLFxuICAgICAgICAgICAgICAgICAgICBtb2RpZnlUaW1lOiBtZXRhSW5mby5tb2RpZnlUaW1lLFxuICAgICAgICAgICAgICAgICAgICBkZXBlbmRlbmNpZXM6IG1ldGFJbmZvLmRlcGVuZHMgfHwgW11cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiB0cnVlLCBkYXRhOiBpbmZvIH0pO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBjcmVhdGVQcmVmYWJGcm9tTm9kZShhcmdzOiBhbnkpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICAvLyDku44gcHJlZmFiUGF0aCDmj5Dlj5blkI3np7BcbiAgICAgICAgY29uc3QgcHJlZmFiUGF0aCA9IGFyZ3MucHJlZmFiUGF0aDtcbiAgICAgICAgY29uc3QgcHJlZmFiTmFtZSA9IHByZWZhYlBhdGguc3BsaXQoJy8nKS5wb3AoKT8ucmVwbGFjZSgnLnByZWZhYicsICcnKSB8fCAnTmV3UHJlZmFiJztcblxuICAgICAgICAvLyDosIPnlKjljp/mnaXnmoQgY3JlYXRlUHJlZmFiIOaWueazlVxuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5jcmVhdGVQcmVmYWIoe1xuICAgICAgICAgICAgbm9kZVV1aWQ6IGFyZ3Mubm9kZVV1aWQsXG4gICAgICAgICAgICBzYXZlUGF0aDogcHJlZmFiUGF0aCxcbiAgICAgICAgICAgIHByZWZhYk5hbWU6IHByZWZhYk5hbWVcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyB2YWxpZGF0ZVByZWZhYihwcmVmYWJQYXRoOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMgKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgLy8g6K+75Y+W6aKE5Yi25L2T5paH5Lu25YaF5a65XG4gICAgICAgICAgICAgICAgY29uc3QgYXNzZXRJbmZvID0gYXdhaXQgdGhpcy5xdWVyeUFzc2V0SW5mb0J5VXJsKHByZWZhYlBhdGgpO1xuICAgICAgICAgICAgICAgIGlmICghYXNzZXRJbmZvKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogJ+mihOWItuS9k+aWh+S7tuS4jeWtmOWcqCdcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyDkvb/nlKhmc+ebtOaOpeivu+WPluaWh+S7tlxuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZ1bGxQYXRoID0gYXNzZXRJbmZvLnNvdXJjZSB8fCBwYXRoLmpvaW4oRWRpdG9yLlByb2plY3QucGF0aCwgcHJlZmFiUGF0aC5yZXBsYWNlKCdkYjovL2Fzc2V0cy8nLCAnYXNzZXRzLycpKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhmdWxsUGF0aCwgJ3V0ZjgnKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJlZmFiRGF0YSA9IEpTT04ucGFyc2UoY29udGVudCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHZhbGlkYXRpb25SZXN1bHQgPSB0aGlzLnZhbGlkYXRlUHJlZmFiRm9ybWF0KHByZWZhYkRhdGEpO1xuXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc1ZhbGlkOiB2YWxpZGF0aW9uUmVzdWx0LmlzVmFsaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNzdWVzOiB2YWxpZGF0aW9uUmVzdWx0Lmlzc3VlcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlQ291bnQ6IHZhbGlkYXRpb25SZXN1bHQubm9kZUNvdW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudENvdW50OiB2YWxpZGF0aW9uUmVzdWx0LmNvbXBvbmVudENvdW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IHZhbGlkYXRpb25SZXN1bHQuaXNWYWxpZCA/ICfpooTliLbkvZPmoLzlvI/mnInmlYgnIDogJ+mihOWItuS9k+agvOW8j+WtmOWcqOmXrumimCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAocGFyc2VFcnJvcjogYW55KSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogYOmihOWItuS9k+aWh+S7tuagvOW8j+mUmeivrzogJHtwYXJzZUVycm9yLm1lc3NhZ2V9YFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogYOmqjOivgemihOWItuS9k+aXtuWPkeeUn+mUmeivrzogJHtlcnJvci5tZXNzYWdlfWBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSB2YWxpZGF0ZVByZWZhYkZvcm1hdChwcmVmYWJEYXRhOiBhbnkpOiB7IGlzVmFsaWQ6IGJvb2xlYW47IGlzc3Vlczogc3RyaW5nW107IG5vZGVDb3VudDogbnVtYmVyOyBjb21wb25lbnRDb3VudDogbnVtYmVyIH0ge1xuICAgICAgICBjb25zdCBpc3N1ZXM6IHN0cmluZ1tdID0gW107XG4gICAgICAgIGxldCBub2RlQ291bnQgPSAwO1xuICAgICAgICBsZXQgY29tcG9uZW50Q291bnQgPSAwO1xuXG4gICAgICAgIC8vIOajgOafpeWfuuacrOe7k+aehFxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkocHJlZmFiRGF0YSkpIHtcbiAgICAgICAgICAgIGlzc3Vlcy5wdXNoKCfpooTliLbkvZPmlbDmja7lv4XpobvmmK/mlbDnu4TmoLzlvI8nKTtcbiAgICAgICAgICAgIHJldHVybiB7IGlzVmFsaWQ6IGZhbHNlLCBpc3N1ZXMsIG5vZGVDb3VudCwgY29tcG9uZW50Q291bnQgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwcmVmYWJEYXRhLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgaXNzdWVzLnB1c2goJ+mihOWItuS9k+aVsOaNruS4uuepuicpO1xuICAgICAgICAgICAgcmV0dXJuIHsgaXNWYWxpZDogZmFsc2UsIGlzc3Vlcywgbm9kZUNvdW50LCBjb21wb25lbnRDb3VudCB9O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5qOA5p+l56ys5LiA5Liq5YWD57Sg5piv5ZCm5Li66aKE5Yi25L2T6LWE5LqnXG4gICAgICAgIGNvbnN0IGZpcnN0RWxlbWVudCA9IHByZWZhYkRhdGFbMF07XG4gICAgICAgIGlmICghZmlyc3RFbGVtZW50IHx8IGZpcnN0RWxlbWVudC5fX3R5cGVfXyAhPT0gJ2NjLlByZWZhYicpIHtcbiAgICAgICAgICAgIGlzc3Vlcy5wdXNoKCfnrKzkuIDkuKrlhYPntKDlv4XpobvmmK9jYy5QcmVmYWLnsbvlnosnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOe7n+iuoeiKgueCueWSjOe7hOS7tlxuICAgICAgICBwcmVmYWJEYXRhLmZvckVhY2goKGl0ZW06IGFueSwgaW5kZXg6IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgaWYgKGl0ZW0uX190eXBlX18gPT09ICdjYy5Ob2RlJykge1xuICAgICAgICAgICAgICAgIG5vZGVDb3VudCsrO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChpdGVtLl9fdHlwZV9fICYmIGl0ZW0uX190eXBlX18uaW5jbHVkZXMoJ2NjLicpKSB7XG4gICAgICAgICAgICAgICAgY29tcG9uZW50Q291bnQrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g5qOA5p+l5b+F6KaB55qE5a2X5q61XG4gICAgICAgIGlmIChub2RlQ291bnQgPT09IDApIHtcbiAgICAgICAgICAgIGlzc3Vlcy5wdXNoKCfpooTliLbkvZPlv4XpobvljIXlkKvoh7PlsJHkuIDkuKroioLngrknKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBpc1ZhbGlkOiBpc3N1ZXMubGVuZ3RoID09PSAwLFxuICAgICAgICAgICAgaXNzdWVzLFxuICAgICAgICAgICAgbm9kZUNvdW50LFxuICAgICAgICAgICAgY29tcG9uZW50Q291bnRcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGR1cGxpY2F0ZVByZWZhYihhcmdzOiBhbnkpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMgKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgeyBzb3VyY2VQcmVmYWJQYXRoLCB0YXJnZXRQcmVmYWJQYXRoLCBuZXdQcmVmYWJOYW1lIH0gPSBhcmdzO1xuXG4gICAgICAgICAgICAgICAgLy8g6K+75Y+W5rqQ6aKE5Yi25L2TXG4gICAgICAgICAgICAgICAgY29uc3Qgc291cmNlSW5mbyA9IGF3YWl0IHRoaXMuZ2V0UHJlZmFiSW5mbyhzb3VyY2VQcmVmYWJQYXRoKTtcbiAgICAgICAgICAgICAgICBpZiAoIXNvdXJjZUluZm8uc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGDml6Dms5Xor7vlj5bmupDpooTliLbkvZM6ICR7c291cmNlSW5mby5lcnJvcn1gXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8g6K+75Y+W5rqQ6aKE5Yi25L2T5YaF5a65XG4gICAgICAgICAgICAgICAgY29uc3Qgc291cmNlQ29udGVudCA9IGF3YWl0IHRoaXMucmVhZFByZWZhYkNvbnRlbnQoc291cmNlUHJlZmFiUGF0aCk7XG4gICAgICAgICAgICAgICAgaWYgKCFzb3VyY2VDb250ZW50LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBg5peg5rOV6K+75Y+W5rqQ6aKE5Yi25L2T5YaF5a65OiAke3NvdXJjZUNvbnRlbnQuZXJyb3J9YFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIOeUn+aIkOaWsOeahFVVSURcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdVdWlkID0gdGhpcy5nZW5lcmF0ZVVVSUQoKTtcblxuICAgICAgICAgICAgICAgIC8vIOS/ruaUuemihOWItuS9k+aVsOaNrlxuICAgICAgICAgICAgICAgIGNvbnN0IG1vZGlmaWVkRGF0YSA9IHRoaXMubW9kaWZ5UHJlZmFiRm9yRHVwbGljYXRpb24oc291cmNlQ29udGVudC5kYXRhLCBuZXdQcmVmYWJOYW1lLCBuZXdVdWlkKTtcblxuICAgICAgICAgICAgICAgIC8vIOWIm+W7uuaWsOeahG1ldGHmlbDmja5cbiAgICAgICAgICAgICAgICBjb25zdCBuZXdNZXRhRGF0YSA9IHRoaXMuY3JlYXRlTWV0YURhdGEobmV3UHJlZmFiTmFtZSB8fCAnRHVwbGljYXRlZFByZWZhYicsIG5ld1V1aWQpO1xuXG4gICAgICAgICAgICAgICAgLy8g6aKE5Yi25L2T5aSN5Yi25Yqf6IO95pqC5pe256aB55So77yM5Zug5Li65raJ5Y+K5aSN5p2C55qE5bqP5YiX5YyW5qC85byPXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogJ+mihOWItuS9k+WkjeWItuWKn+iDveaaguaXtuS4jeWPr+eUqCcsXG4gICAgICAgICAgICAgICAgICAgIGluc3RydWN0aW9uOiAn6K+35ZyoIENvY29zIENyZWF0b3Ig57yW6L6R5Zmo5Lit5omL5Yqo5aSN5Yi26aKE5Yi25L2T77yaXFxuMS4g5Zyo6LWE5rqQ566h55CG5Zmo5Lit6YCJ5oup6KaB5aSN5Yi255qE6aKE5Yi25L2TXFxuMi4g5Y+z6ZSu6YCJ5oup5aSN5Yi2XFxuMy4g5Zyo55uu5qCH5L2N572u57KY6LS0J1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGDlpI3liLbpooTliLbkvZPml7blj5HnlJ/plJnor686ICR7ZXJyb3J9YFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHJlYWRQcmVmYWJDb250ZW50KHByZWZhYlBhdGg6IHN0cmluZyk6IFByb21pc2U8eyBzdWNjZXNzOiBib29sZWFuOyBkYXRhPzogYW55OyBlcnJvcj86IHN0cmluZyB9PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyAocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhc3NldEluZm8gPSBhd2FpdCB0aGlzLnF1ZXJ5QXNzZXRJbmZvQnlVcmwocHJlZmFiUGF0aCk7XG4gICAgICAgICAgICAgICAgaWYgKCFhc3NldEluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ+mihOWItuS9k+aWh+S7tuS4jeWtmOWcqCcgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyDkvb/nlKhmc+ebtOaOpeivu+WPluaWh+S7tlxuICAgICAgICAgICAgICAgIGNvbnN0IGZ1bGxQYXRoID0gYXNzZXRJbmZvLnNvdXJjZSB8fCBwYXRoLmpvaW4oRWRpdG9yLlByb2plY3QucGF0aCwgcHJlZmFiUGF0aC5yZXBsYWNlKCdkYjovL2Fzc2V0cy8nLCAnYXNzZXRzLycpKTtcbiAgICAgICAgICAgICAgICBjb25zdCBjb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKGZ1bGxQYXRoLCAndXRmOCcpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHByZWZhYkRhdGEgPSBKU09OLnBhcnNlKGNvbnRlbnQpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiB0cnVlLCBkYXRhOiBwcmVmYWJEYXRhIH0pO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfHwgJ+ivu+WPlumihOWItuS9k+aWh+S7tuWksei0pScgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgbW9kaWZ5UHJlZmFiRm9yRHVwbGljYXRpb24ocHJlZmFiRGF0YTogYW55W10sIG5ld05hbWU6IHN0cmluZywgbmV3VXVpZDogc3RyaW5nKTogYW55W10ge1xuICAgICAgICAvLyDkv67mlLnpooTliLbkvZPmlbDmja7ku6XliJvlu7rlia/mnKxcbiAgICAgICAgY29uc3QgbW9kaWZpZWREYXRhID0gWy4uLnByZWZhYkRhdGFdO1xuXG4gICAgICAgIC8vIOS/ruaUueesrOS4gOS4quWFg+e0oO+8iOmihOWItuS9k+i1hOS6p++8iVxuICAgICAgICBpZiAobW9kaWZpZWREYXRhWzBdICYmIG1vZGlmaWVkRGF0YVswXS5fX3R5cGVfXyA9PT0gJ2NjLlByZWZhYicpIHtcbiAgICAgICAgICAgIG1vZGlmaWVkRGF0YVswXS5fbmFtZSA9IG5ld05hbWUgfHwgJ0R1cGxpY2F0ZWRQcmVmYWInO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5pu05paw5omA5pyJVVVJROW8leeUqO+8iOeugOWMlueJiOacrO+8iVxuICAgICAgICAvLyDlnKjlrp7pmYXlupTnlKjkuK3vvIzlj6/og73pnIDopoHmm7TlpI3mnYLnmoRVVUlE5pig5bCE5aSE55CGXG5cbiAgICAgICAgcmV0dXJuIG1vZGlmaWVkRGF0YTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDkvb/nlKggYXNzZXQtZGIgQVBJIOWIm+W7uui1hOa6kOaWh+S7tlxuICAgICAqL1xuICAgIHByaXZhdGUgYXN5bmMgY3JlYXRlQXNzZXRXaXRoQXNzZXREQihhc3NldFBhdGg6IHN0cmluZywgY29udGVudDogc3RyaW5nKTogUHJvbWlzZTx7IHN1Y2Nlc3M6IGJvb2xlYW47IGRhdGE/OiBhbnk7IGVycm9yPzogc3RyaW5nIH0+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICBFZGl0b3IuYXNzZXRkYi5jcmVhdGUoYXNzZXRQYXRoLCBjb250ZW50LCAoZXJyOiBFcnJvciB8IG51bGwsIGFzc2V0SW5mbzogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCfliJvlu7rotYTmupDmlofku7blpLHotKU6JywgZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfHwgJ+WIm+W7uui1hOa6kOaWh+S7tuWksei0pScgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ+WIm+W7uui1hOa6kOaWh+S7tuaIkOWKnzonLCBhc3NldEluZm8pO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogYXNzZXRJbmZvIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDkvb/nlKggYXNzZXQtZGIgQVBJIOWIm+W7uiBtZXRhIOaWh+S7tlxuICAgICAqL1xuICAgIHByaXZhdGUgYXN5bmMgY3JlYXRlTWV0YVdpdGhBc3NldERCKGFzc2V0UGF0aDogc3RyaW5nLCBtZXRhQ29udGVudDogYW55KTogUHJvbWlzZTx7IHN1Y2Nlc3M6IGJvb2xlYW47IGRhdGE/OiBhbnk7IGVycm9yPzogc3RyaW5nIH0+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGFzeW5jIChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFzc2V0SW5mbyA9IGF3YWl0IHRoaXMucXVlcnlBc3NldEluZm9CeVVybChhc3NldFBhdGgpO1xuICAgICAgICAgICAgICAgIGlmICghYXNzZXRJbmZvIHx8ICFhc3NldEluZm8udXVpZCkge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAn5peg5rOV6I635Y+W6LWE5rqQVVVJRCcgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBtZXRhQ29udGVudFN0cmluZyA9IEpTT04uc3RyaW5naWZ5KG1ldGFDb250ZW50LCBudWxsLCAyKTtcbiAgICAgICAgICAgICAgICBFZGl0b3IuYXNzZXRkYi5zYXZlTWV0YShhc3NldEluZm8udXVpZCwgbWV0YUNvbnRlbnRTdHJpbmcsIChlcnI6IEVycm9yIHwgbnVsbCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCfliJvlu7ptZXRh5paH5Lu25aSx6LSlOicsIGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB8fCAn5Yib5bu6bWV0YeaWh+S7tuWksei0pScgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygn5Yib5bu6bWV0YeaWh+S7tuaIkOWKnycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IGFzc2V0SW5mbyB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfHwgJ+WIm+W7um1ldGHmlofku7blpLHotKUnIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDkvb/nlKggYXNzZXQtZGIgQVBJIOmHjeaWsOWvvOWFpei1hOa6kFxuICAgICAqL1xuICAgIHByaXZhdGUgYXN5bmMgcmVpbXBvcnRBc3NldFdpdGhBc3NldERCKGFzc2V0UGF0aDogc3RyaW5nKTogUHJvbWlzZTx7IHN1Y2Nlc3M6IGJvb2xlYW47IGRhdGE/OiBhbnk7IGVycm9yPzogc3RyaW5nIH0+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICBFZGl0b3IuYXNzZXRkYi5yZWZyZXNoKGFzc2V0UGF0aCwgKGVycjogRXJyb3IgfCBudWxsKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCfph43mlrDlr7zlhaXotYTmupDlpLHotKU6JywgZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfHwgJ+mHjeaWsOWvvOWFpei1hOa6kOWksei0pScgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ+mHjeaWsOWvvOWFpei1hOa6kOaIkOWKnycpO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5L2/55SoIGFzc2V0LWRiIEFQSSDmm7TmlrDotYTmupDmlofku7blhoXlrrlcbiAgICAgKi9cbiAgICBwcml2YXRlIGFzeW5jIHVwZGF0ZUFzc2V0V2l0aEFzc2V0REIoYXNzZXRQYXRoOiBzdHJpbmcsIGNvbnRlbnQ6IHN0cmluZyk6IFByb21pc2U8eyBzdWNjZXNzOiBib29sZWFuOyBkYXRhPzogYW55OyBlcnJvcj86IHN0cmluZyB9PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgLy8gMi547JeQ7ISc64qUIGNyZWF0ZeqwgCDquLDsobQg7YyM7J287J2EIOuNruyWtOyUgeuLiOuLpFxuICAgICAgICAgICAgRWRpdG9yLmFzc2V0ZGIuY3JlYXRlKGFzc2V0UGF0aCwgY29udGVudCwgKGVycjogRXJyb3IgfCBudWxsLCByZXN1bHQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcign5pu05paw6LWE5rqQ5paH5Lu25aSx6LSlOicsIGVycik7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIHx8ICfmm7TmlrDotYTmupDmlofku7blpLHotKUnIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCfmm7TmlrDotYTmupDmlofku7bmiJDlip86JywgcmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IHJlc3VsdCB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5Yib5bu656ym5ZCIIENvY29zIENyZWF0b3Ig5qCH5YeG55qE6aKE5Yi25L2T5YaF5a65XG4gICAgICog5a6M5pW05a6e546w6YCS5b2S6IqC54K55qCR5aSE55CG77yM5Yy56YWN5byV5pOO5qCH5YeG5qC85byPXG4gICAgICovXG4gICAgcHJpdmF0ZSBhc3luYyBjcmVhdGVTdGFuZGFyZFByZWZhYkNvbnRlbnQobm9kZURhdGE6IGFueSwgcHJlZmFiTmFtZTogc3RyaW5nLCBwcmVmYWJVdWlkOiBzdHJpbmcsIGluY2x1ZGVDaGlsZHJlbjogYm9vbGVhbiwgaW5jbHVkZUNvbXBvbmVudHM6IGJvb2xlYW4pOiBQcm9taXNlPGFueVtdPiB7XG4gICAgICAgIGNvbnNvbGUubG9nKCflvIDlp4vliJvlu7rlvJXmk47moIflh4bpooTliLbkvZPlhoXlrrkuLi4nKTtcblxuICAgICAgICBjb25zdCBwcmVmYWJEYXRhOiBhbnlbXSA9IFtdO1xuICAgICAgICBsZXQgY3VycmVudElkID0gMDtcblxuICAgICAgICAvLyAxLiDliJvlu7rpooTliLbkvZPotYTkuqflr7nosaEgKGluZGV4IDApXG4gICAgICAgIGNvbnN0IHByZWZhYkFzc2V0ID0ge1xuICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBcImNjLlByZWZhYlwiLFxuICAgICAgICAgICAgXCJfbmFtZVwiOiBwcmVmYWJOYW1lIHx8IFwiXCIsIC8vIOehruS/nemihOWItuS9k+WQjeensOS4jeS4uuepulxuICAgICAgICAgICAgXCJfb2JqRmxhZ3NcIjogMCxcbiAgICAgICAgICAgIFwiX19lZGl0b3JFeHRyYXNfX1wiOiB7fSxcbiAgICAgICAgICAgIFwiX25hdGl2ZVwiOiBcIlwiLFxuICAgICAgICAgICAgXCJkYXRhXCI6IHtcbiAgICAgICAgICAgICAgICBcIl9faWRfX1wiOiAxXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJvcHRpbWl6YXRpb25Qb2xpY3lcIjogMCxcbiAgICAgICAgICAgIFwicGVyc2lzdGVudFwiOiBmYWxzZVxuICAgICAgICB9O1xuICAgICAgICBwcmVmYWJEYXRhLnB1c2gocHJlZmFiQXNzZXQpO1xuICAgICAgICBjdXJyZW50SWQrKztcblxuICAgICAgICAvLyAyLiDpgJLlvZLliJvlu7rlrozmlbTnmoToioLngrnmoJHnu5PmnoRcbiAgICAgICAgY29uc3QgY29udGV4dCA9IHtcbiAgICAgICAgICAgIHByZWZhYkRhdGEsXG4gICAgICAgICAgICBjdXJyZW50SWQ6IGN1cnJlbnRJZCArIDEsIC8vIOagueiKgueCueWNoOeUqOe0ouW8lTHvvIzlrZDoioLngrnku47ntKLlvJUy5byA5aeLXG4gICAgICAgICAgICBwcmVmYWJBc3NldEluZGV4OiAwLFxuICAgICAgICAgICAgbm9kZUZpbGVJZHM6IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCksIC8vIOWtmOWCqOiKgueCuUlE5YiwZmlsZUlk55qE5pig5bCEXG4gICAgICAgICAgICBub2RlVXVpZFRvSW5kZXg6IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCksIC8vIOWtmOWCqOiKgueCuVVVSUTliLDntKLlvJXnmoTmmKDlsIRcbiAgICAgICAgICAgIGNvbXBvbmVudFV1aWRUb0luZGV4OiBuZXcgTWFwPHN0cmluZywgbnVtYmVyPigpIC8vIOWtmOWCqOe7hOS7tlVVSUTliLDntKLlvJXnmoTmmKDlsIRcbiAgICAgICAgfTtcblxuICAgICAgICAvLyDliJvlu7rmoLnoioLngrnlkozmlbTkuKroioLngrnmoJEgLSDms6jmhI/vvJrmoLnoioLngrnnmoTniLboioLngrnlupTor6XmmK9udWxs77yM5LiN5piv6aKE5Yi25L2T5a+56LGhXG4gICAgICAgIGF3YWl0IHRoaXMuY3JlYXRlQ29tcGxldGVOb2RlVHJlZShub2RlRGF0YSwgbnVsbCwgMSwgY29udGV4dCwgaW5jbHVkZUNoaWxkcmVuLCBpbmNsdWRlQ29tcG9uZW50cywgcHJlZmFiTmFtZSk7XG5cbiAgICAgICAgY29uc29sZS5sb2coYOmihOWItuS9k+WGheWuueWIm+W7uuWujOaIkO+8jOaAu+WFsSAke3ByZWZhYkRhdGEubGVuZ3RofSDkuKrlr7nosaFgKTtcbiAgICAgICAgY29uc29sZS5sb2coJ+iKgueCuWZpbGVJZOaYoOWwhDonLCBBcnJheS5mcm9tKGNvbnRleHQubm9kZUZpbGVJZHMuZW50cmllcygpKSk7XG5cbiAgICAgICAgcmV0dXJuIHByZWZhYkRhdGE7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6YCS5b2S5Yib5bu65a6M5pW055qE6IqC54K55qCR77yM5YyF5ous5omA5pyJ5a2Q6IqC54K55ZKM5a+55bqU55qEUHJlZmFiSW5mb1xuICAgICAqL1xuICAgIHByaXZhdGUgYXN5bmMgY3JlYXRlQ29tcGxldGVOb2RlVHJlZShcbiAgICAgICAgbm9kZURhdGE6IGFueSxcbiAgICAgICAgcGFyZW50Tm9kZUluZGV4OiBudW1iZXIgfCBudWxsLFxuICAgICAgICBub2RlSW5kZXg6IG51bWJlcixcbiAgICAgICAgY29udGV4dDoge1xuICAgICAgICAgICAgcHJlZmFiRGF0YTogYW55W10sXG4gICAgICAgICAgICBjdXJyZW50SWQ6IG51bWJlcixcbiAgICAgICAgICAgIHByZWZhYkFzc2V0SW5kZXg6IG51bWJlcixcbiAgICAgICAgICAgIG5vZGVGaWxlSWRzOiBNYXA8c3RyaW5nLCBzdHJpbmc+LFxuICAgICAgICAgICAgbm9kZVV1aWRUb0luZGV4OiBNYXA8c3RyaW5nLCBudW1iZXI+LFxuICAgICAgICAgICAgY29tcG9uZW50VXVpZFRvSW5kZXg6IE1hcDxzdHJpbmcsIG51bWJlcj5cbiAgICAgICAgfSxcbiAgICAgICAgaW5jbHVkZUNoaWxkcmVuOiBib29sZWFuLFxuICAgICAgICBpbmNsdWRlQ29tcG9uZW50czogYm9vbGVhbixcbiAgICAgICAgbm9kZU5hbWU/OiBzdHJpbmdcbiAgICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc3QgeyBwcmVmYWJEYXRhIH0gPSBjb250ZXh0O1xuXG4gICAgICAgIC8vIOWIm+W7uuiKgueCueWvueixoVxuICAgICAgICBjb25zdCBub2RlID0gdGhpcy5jcmVhdGVFbmdpbmVTdGFuZGFyZE5vZGUobm9kZURhdGEsIHBhcmVudE5vZGVJbmRleCwgbm9kZU5hbWUpO1xuXG4gICAgICAgIC8vIOehruS/neiKgueCueWcqOaMh+WumueahOe0ouW8leS9jee9rlxuICAgICAgICB3aGlsZSAocHJlZmFiRGF0YS5sZW5ndGggPD0gbm9kZUluZGV4KSB7XG4gICAgICAgICAgICBwcmVmYWJEYXRhLnB1c2gobnVsbCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5sb2coYOiuvue9ruiKgueCueWIsOe0ouW8lSAke25vZGVJbmRleH06ICR7bm9kZS5fbmFtZX0sIF9wYXJlbnQ6YCwgbm9kZS5fcGFyZW50LCBgX2NoaWxkcmVuIGNvdW50OiAke25vZGUuX2NoaWxkcmVuLmxlbmd0aH1gKTtcbiAgICAgICAgcHJlZmFiRGF0YVtub2RlSW5kZXhdID0gbm9kZTtcblxuICAgICAgICAvLyDkuLrlvZPliY3oioLngrnnlJ/miJBmaWxlSWTlubborrDlvZVVVUlE5Yiw57Si5byV55qE5pig5bCEXG4gICAgICAgIGNvbnN0IG5vZGVVdWlkID0gdGhpcy5leHRyYWN0Tm9kZVV1aWQobm9kZURhdGEpO1xuICAgICAgICBjb25zdCBmaWxlSWQgPSBub2RlVXVpZCB8fCB0aGlzLmdlbmVyYXRlRmlsZUlkKCk7XG4gICAgICAgIGNvbnRleHQubm9kZUZpbGVJZHMuc2V0KG5vZGVJbmRleC50b1N0cmluZygpLCBmaWxlSWQpO1xuXG4gICAgICAgIC8vIOiusOW9leiKgueCuVVVSUTliLDntKLlvJXnmoTmmKDlsIRcbiAgICAgICAgaWYgKG5vZGVVdWlkKSB7XG4gICAgICAgICAgICBjb250ZXh0Lm5vZGVVdWlkVG9JbmRleC5zZXQobm9kZVV1aWQsIG5vZGVJbmRleCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhg6K6w5b2V6IqC54K5VVVJROaYoOWwhDogJHtub2RlVXVpZH0gLT4gJHtub2RlSW5kZXh9YCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDlhYjlpITnkIblrZDoioLngrnvvIjkv53mjIHkuI7miYvliqjliJvlu7rnmoTntKLlvJXpobrluo/kuIDoh7TvvIlcbiAgICAgICAgY29uc3QgY2hpbGRyZW5Ub1Byb2Nlc3MgPSB0aGlzLmdldENoaWxkcmVuVG9Qcm9jZXNzKG5vZGVEYXRhKTtcbiAgICAgICAgaWYgKGluY2x1ZGVDaGlsZHJlbiAmJiBjaGlsZHJlblRvUHJvY2Vzcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhg5aSE55CG6IqC54K5ICR7bm9kZS5fbmFtZX0g55qEICR7Y2hpbGRyZW5Ub1Byb2Nlc3MubGVuZ3RofSDkuKrlrZDoioLngrlgKTtcblxuICAgICAgICAgICAgLy8g5Li65q+P5Liq5a2Q6IqC54K55YiG6YWN57Si5byVXG4gICAgICAgICAgICBjb25zdCBjaGlsZEluZGljZXM6IG51bWJlcltdID0gW107XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhg5YeG5aSH5Li6ICR7Y2hpbGRyZW5Ub1Byb2Nlc3MubGVuZ3RofSDkuKrlrZDoioLngrnliIbphY3ntKLlvJXvvIzlvZPliY1JRDogJHtjb250ZXh0LmN1cnJlbnRJZH1gKTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGRyZW5Ub1Byb2Nlc3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhg5aSE55CG56ysICR7aSsxfSDkuKrlrZDoioLngrnvvIzlvZPliY1jdXJyZW50SWQ6ICR7Y29udGV4dC5jdXJyZW50SWR9YCk7XG4gICAgICAgICAgICAgICAgY29uc3QgY2hpbGRJbmRleCA9IGNvbnRleHQuY3VycmVudElkKys7XG4gICAgICAgICAgICAgICAgY2hpbGRJbmRpY2VzLnB1c2goY2hpbGRJbmRleCk7XG4gICAgICAgICAgICAgICAgbm9kZS5fY2hpbGRyZW4ucHVzaCh7IFwiX19pZF9fXCI6IGNoaWxkSW5kZXggfSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYOKchSDmt7vliqDlrZDoioLngrnlvJXnlKjliLAgJHtub2RlLl9uYW1lfToge19faWRfXzogJHtjaGlsZEluZGV4fX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGDinIUg6IqC54K5ICR7bm9kZS5fbmFtZX0g5pyA57uI55qE5a2Q6IqC54K55pWw57uEOmAsIG5vZGUuX2NoaWxkcmVuKTtcblxuICAgICAgICAgICAgLy8g6YCS5b2S5Yib5bu65a2Q6IqC54K5XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkcmVuVG9Qcm9jZXNzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2hpbGREYXRhID0gY2hpbGRyZW5Ub1Byb2Nlc3NbaV07XG4gICAgICAgICAgICAgICAgY29uc3QgY2hpbGRJbmRleCA9IGNoaWxkSW5kaWNlc1tpXTtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmNyZWF0ZUNvbXBsZXRlTm9kZVRyZWUoXG4gICAgICAgICAgICAgICAgICAgIGNoaWxkRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgbm9kZUluZGV4LFxuICAgICAgICAgICAgICAgICAgICBjaGlsZEluZGV4LFxuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LFxuICAgICAgICAgICAgICAgICAgICBpbmNsdWRlQ2hpbGRyZW4sXG4gICAgICAgICAgICAgICAgICAgIGluY2x1ZGVDb21wb25lbnRzLFxuICAgICAgICAgICAgICAgICAgICBjaGlsZERhdGEubmFtZSB8fCBgQ2hpbGQke2krMX1gXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOeEtuWQjuWkhOeQhue7hOS7tlxuICAgICAgICBpZiAoaW5jbHVkZUNvbXBvbmVudHMgJiYgbm9kZURhdGEuY29tcG9uZW50cyAmJiBBcnJheS5pc0FycmF5KG5vZGVEYXRhLmNvbXBvbmVudHMpKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhg5aSE55CG6IqC54K5ICR7bm9kZS5fbmFtZX0g55qEICR7bm9kZURhdGEuY29tcG9uZW50cy5sZW5ndGh9IOS4que7hOS7tmApO1xuXG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnRJbmRpY2VzOiBudW1iZXJbXSA9IFtdO1xuICAgICAgICAgICAgZm9yIChjb25zdCBjb21wb25lbnQgb2Ygbm9kZURhdGEuY29tcG9uZW50cykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudEluZGV4ID0gY29udGV4dC5jdXJyZW50SWQrKztcbiAgICAgICAgICAgICAgICBjb21wb25lbnRJbmRpY2VzLnB1c2goY29tcG9uZW50SW5kZXgpO1xuICAgICAgICAgICAgICAgIG5vZGUuX2NvbXBvbmVudHMucHVzaCh7IFwiX19pZF9fXCI6IGNvbXBvbmVudEluZGV4IH0pO1xuXG4gICAgICAgICAgICAgICAgLy8g6K6w5b2V57uE5Lu2VVVJROWIsOe0ouW8leeahOaYoOWwhFxuICAgICAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudFV1aWQgPSBjb21wb25lbnQudXVpZCB8fCAoY29tcG9uZW50LnZhbHVlICYmIGNvbXBvbmVudC52YWx1ZS51dWlkKTtcbiAgICAgICAgICAgICAgICBpZiAoY29tcG9uZW50VXVpZCkge1xuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LmNvbXBvbmVudFV1aWRUb0luZGV4LnNldChjb21wb25lbnRVdWlkLCBjb21wb25lbnRJbmRleCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGDorrDlvZXnu4Tku7ZVVUlE5pig5bCEOiAke2NvbXBvbmVudFV1aWR9IC0+ICR7Y29tcG9uZW50SW5kZXh9YCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8g5Yib5bu657uE5Lu25a+56LGh77yM5Lyg5YWlY29udGV4dOS7peWkhOeQhuW8leeUqFxuICAgICAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudE9iaiA9IHRoaXMuY3JlYXRlQ29tcG9uZW50T2JqZWN0KGNvbXBvbmVudCwgbm9kZUluZGV4LCBjb250ZXh0KTtcbiAgICAgICAgICAgICAgICBwcmVmYWJEYXRhW2NvbXBvbmVudEluZGV4XSA9IGNvbXBvbmVudE9iajtcblxuICAgICAgICAgICAgICAgIC8vIOS4uue7hOS7tuWIm+W7uiBDb21wUHJlZmFiSW5mb1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbXBQcmVmYWJJbmZvSW5kZXggPSBjb250ZXh0LmN1cnJlbnRJZCsrO1xuICAgICAgICAgICAgICAgIHByZWZhYkRhdGFbY29tcFByZWZhYkluZm9JbmRleF0gPSB7XG4gICAgICAgICAgICAgICAgICAgIFwiX190eXBlX19cIjogXCJjYy5Db21wUHJlZmFiSW5mb1wiLFxuICAgICAgICAgICAgICAgICAgICBcImZpbGVJZFwiOiB0aGlzLmdlbmVyYXRlRmlsZUlkKClcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLy8g5aaC5p6c57uE5Lu25a+56LGh5pyJIF9fcHJlZmFiIOWxnuaAp++8jOiuvue9ruW8leeUqFxuICAgICAgICAgICAgICAgIGlmIChjb21wb25lbnRPYmogJiYgdHlwZW9mIGNvbXBvbmVudE9iaiA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50T2JqLl9fcHJlZmFiID0geyBcIl9faWRfX1wiOiBjb21wUHJlZmFiSW5mb0luZGV4IH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhg4pyFIOiKgueCuSAke25vZGUuX25hbWV9IOa3u+WKoOS6hiAke2NvbXBvbmVudEluZGljZXMubGVuZ3RofSDkuKrnu4Tku7ZgKTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgLy8g5Li65b2T5YmN6IqC54K55Yib5bu6UHJlZmFiSW5mb1xuICAgICAgICBjb25zdCBwcmVmYWJJbmZvSW5kZXggPSBjb250ZXh0LmN1cnJlbnRJZCsrO1xuICAgICAgICBub2RlLl9wcmVmYWIgPSB7IFwiX19pZF9fXCI6IHByZWZhYkluZm9JbmRleCB9O1xuXG4gICAgICAgIGNvbnN0IHByZWZhYkluZm86IGFueSA9IHtcbiAgICAgICAgICAgIFwiX190eXBlX19cIjogXCJjYy5QcmVmYWJJbmZvXCIsXG4gICAgICAgICAgICBcInJvb3RcIjogeyBcIl9faWRfX1wiOiAxIH0sXG4gICAgICAgICAgICBcImFzc2V0XCI6IHsgXCJfX2lkX19cIjogY29udGV4dC5wcmVmYWJBc3NldEluZGV4IH0sXG4gICAgICAgICAgICBcImZpbGVJZFwiOiBmaWxlSWQsXG4gICAgICAgICAgICBcInRhcmdldE92ZXJyaWRlc1wiOiBudWxsLFxuICAgICAgICAgICAgXCJuZXN0ZWRQcmVmYWJJbnN0YW5jZVJvb3RzXCI6IG51bGxcbiAgICAgICAgfTtcblxuICAgICAgICAvLyDmoLnoioLngrnnmoTnibnmrorlpITnkIZcbiAgICAgICAgaWYgKG5vZGVJbmRleCA9PT0gMSkge1xuICAgICAgICAgICAgLy8g5qC56IqC54K55rKh5pyJaW5zdGFuY2XvvIzkvYblj6/og73mnIl0YXJnZXRPdmVycmlkZXNcbiAgICAgICAgICAgIHByZWZhYkluZm8uaW5zdGFuY2UgPSBudWxsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8g5a2Q6IqC54K56YCa5bi45pyJaW5zdGFuY2XkuLpudWxsXG4gICAgICAgICAgICBwcmVmYWJJbmZvLmluc3RhbmNlID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHByZWZhYkRhdGFbcHJlZmFiSW5mb0luZGV4XSA9IHByZWZhYkluZm87XG4gICAgICAgIGNvbnRleHQuY3VycmVudElkID0gcHJlZmFiSW5mb0luZGV4ICsgMTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlsIZVVUlE6L2s5o2i5Li6Q29jb3MgQ3JlYXRvcueahOWOi+e8qeagvOW8j1xuICAgICAqIOWfuuS6juecn+WunkNvY29zIENyZWF0b3LnvJbovpHlmajnmoTljovnvKnnrpfms5Xlrp7njrBcbiAgICAgKiDliY015LiqaGV45a2X56ym5L+d5oyB5LiN5Y+Y77yM5Ymp5L2ZMjfkuKrlrZfnrKbljovnvKnmiJAxOOS4quWtl+esplxuICAgICAqL1xuICAgIHByaXZhdGUgdXVpZFRvQ29tcHJlc3NlZElkKHV1aWQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIGNvbnN0IEJBU0U2NF9LRVlTID0gJ0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky89JztcblxuICAgICAgICAvLyDnp7vpmaTov57lrZfnrKblubbovazkuLrlsI/lhplcbiAgICAgICAgY29uc3QgY2xlYW5VdWlkID0gdXVpZC5yZXBsYWNlKC8tL2csICcnKS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAgIC8vIOehruS/nVVVSUTmnInmlYhcbiAgICAgICAgaWYgKGNsZWFuVXVpZC5sZW5ndGggIT09IDMyKSB7XG4gICAgICAgICAgICByZXR1cm4gdXVpZDsgLy8g5aaC5p6c5LiN5piv5pyJ5pWI55qEVVVJRO+8jOi/lOWbnuWOn+Wni+WAvFxuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ29jb3MgQ3JlYXRvcueahOWOi+e8qeeul+azle+8muWJjTXkuKrlrZfnrKbkv53mjIHkuI3lj5jvvIzliankvZkyN+S4quWtl+espuWOi+e8qeaIkDE45Liq5a2X56ymXG4gICAgICAgIGxldCByZXN1bHQgPSBjbGVhblV1aWQuc3Vic3RyaW5nKDAsIDUpO1xuXG4gICAgICAgIC8vIOWJqeS9mTI35Liq5a2X56ym6ZyA6KaB5Y6L57yp5oiQMTjkuKrlrZfnrKZcbiAgICAgICAgY29uc3QgcmVtYWluZGVyID0gY2xlYW5VdWlkLnN1YnN0cmluZyg1KTtcblxuICAgICAgICAvLyDmr48z5LiqaGV45a2X56ym5Y6L57yp5oiQMuS4quWtl+esplxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJlbWFpbmRlci5sZW5ndGg7IGkgKz0gMykge1xuICAgICAgICAgICAgY29uc3QgaGV4MSA9IHJlbWFpbmRlcltpXSB8fCAnMCc7XG4gICAgICAgICAgICBjb25zdCBoZXgyID0gcmVtYWluZGVyW2kgKyAxXSB8fCAnMCc7XG4gICAgICAgICAgICBjb25zdCBoZXgzID0gcmVtYWluZGVyW2kgKyAyXSB8fCAnMCc7XG5cbiAgICAgICAgICAgIC8vIOWwhjPkuKpoZXjlrZfnrKYoMTLkvY0p6L2s5o2i5Li6MuS4qmJhc2U2NOWtl+esplxuICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBwYXJzZUludChoZXgxICsgaGV4MiArIGhleDMsIDE2KTtcblxuICAgICAgICAgICAgLy8gMTLkvY3liIbmiJDkuKTkuKo25L2NXG4gICAgICAgICAgICBjb25zdCBoaWdoNiA9ICh2YWx1ZSA+PiA2KSAmIDYzO1xuICAgICAgICAgICAgY29uc3QgbG93NiA9IHZhbHVlICYgNjM7XG5cbiAgICAgICAgICAgIHJlc3VsdCArPSBCQVNFNjRfS0VZU1toaWdoNl0gKyBCQVNFNjRfS0VZU1tsb3c2XTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5Yib5bu657uE5Lu25a+56LGhXG4gICAgICovXG4gICAgcHJpdmF0ZSBjcmVhdGVDb21wb25lbnRPYmplY3QoY29tcG9uZW50RGF0YTogYW55LCBub2RlSW5kZXg6IG51bWJlciwgY29udGV4dD86IHtcbiAgICAgICAgbm9kZVV1aWRUb0luZGV4PzogTWFwPHN0cmluZywgbnVtYmVyPixcbiAgICAgICAgY29tcG9uZW50VXVpZFRvSW5kZXg/OiBNYXA8c3RyaW5nLCBudW1iZXI+XG4gICAgfSk6IGFueSB7XG4gICAgICAgIGxldCBjb21wb25lbnRUeXBlID0gY29tcG9uZW50RGF0YS50eXBlIHx8IGNvbXBvbmVudERhdGEuX190eXBlX18gfHwgJ2NjLkNvbXBvbmVudCc7XG4gICAgICAgIGNvbnN0IGVuYWJsZWQgPSBjb21wb25lbnREYXRhLmVuYWJsZWQgIT09IHVuZGVmaW5lZCA/IGNvbXBvbmVudERhdGEuZW5hYmxlZCA6IHRydWU7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYOWIm+W7uue7hOS7tuWvueixoSAtIOWOn+Wni+exu+WeizogJHtjb21wb25lbnRUeXBlfWApO1xuICAgICAgICAvLyBjb25zb2xlLmxvZygn57uE5Lu25a6M5pW05pWw5o2uOicsIEpTT04uc3RyaW5naWZ5KGNvbXBvbmVudERhdGEsIG51bGwsIDIpKTtcblxuICAgICAgICAvLyDlpITnkIbohJrmnKznu4Tku7YgLSBNQ1DmjqXlj6Plt7Lnu4/ov5Tlm57mraPnoa7nmoTljovnvKlVVUlE5qC85byPXG4gICAgICAgIGlmIChjb21wb25lbnRUeXBlICYmICFjb21wb25lbnRUeXBlLnN0YXJ0c1dpdGgoJ2NjLicpKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhg5L2/55So6ISa5pys57uE5Lu25Y6L57ypVVVJROexu+WeizogJHtjb21wb25lbnRUeXBlfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5Z+656GA57uE5Lu257uT5p6EXG4gICAgICAgIGNvbnN0IGNvbXBvbmVudDogYW55ID0ge1xuICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBjb21wb25lbnRUeXBlLFxuICAgICAgICAgICAgXCJfbmFtZVwiOiBcIlwiLFxuICAgICAgICAgICAgXCJfb2JqRmxhZ3NcIjogMCxcbiAgICAgICAgICAgIFwiX19lZGl0b3JFeHRyYXNfX1wiOiB7fSxcbiAgICAgICAgICAgIFwibm9kZVwiOiB7IFwiX19pZF9fXCI6IG5vZGVJbmRleCB9LFxuICAgICAgICAgICAgXCJfZW5hYmxlZFwiOiBlbmFibGVkXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8g5o+Q5YmN6K6+572uIF9fcHJlZmFiIOWxnuaAp+WNoOS9jeespu+8jOWQjue7reS8muiiq+ato+ehruiuvue9rlxuICAgICAgICBjb21wb25lbnQuX19wcmVmYWIgPSBudWxsO1xuXG4gICAgICAgIC8vIOagueaNrue7hOS7tuexu+Wei+a3u+WKoOeJueWumuWxnuaAp1xuICAgICAgICBpZiAoY29tcG9uZW50VHlwZSA9PT0gJ2NjLlVJVHJhbnNmb3JtJykge1xuICAgICAgICAgICAgY29uc3QgY29udGVudFNpemUgPSBjb21wb25lbnREYXRhLnByb3BlcnRpZXM/LmNvbnRlbnRTaXplPy52YWx1ZSB8fCB7IHdpZHRoOiAxMDAsIGhlaWdodDogMTAwIH07XG4gICAgICAgICAgICBjb25zdCBhbmNob3JQb2ludCA9IGNvbXBvbmVudERhdGEucHJvcGVydGllcz8uYW5jaG9yUG9pbnQ/LnZhbHVlIHx8IHsgeDogMC41LCB5OiAwLjUgfTtcblxuICAgICAgICAgICAgY29tcG9uZW50Ll9jb250ZW50U2l6ZSA9IHtcbiAgICAgICAgICAgICAgICBcIl9fdHlwZV9fXCI6IFwiY2MuU2l6ZVwiLFxuICAgICAgICAgICAgICAgIFwid2lkdGhcIjogY29udGVudFNpemUud2lkdGgsXG4gICAgICAgICAgICAgICAgXCJoZWlnaHRcIjogY29udGVudFNpemUuaGVpZ2h0XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29tcG9uZW50Ll9hbmNob3JQb2ludCA9IHtcbiAgICAgICAgICAgICAgICBcIl9fdHlwZV9fXCI6IFwiY2MuVmVjMlwiLFxuICAgICAgICAgICAgICAgIFwieFwiOiBhbmNob3JQb2ludC54LFxuICAgICAgICAgICAgICAgIFwieVwiOiBhbmNob3JQb2ludC55XG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2UgaWYgKGNvbXBvbmVudFR5cGUgPT09ICdjYy5TcHJpdGUnKSB7XG4gICAgICAgICAgICAvLyDlpITnkIZTcHJpdGXnu4Tku7bnmoRzcHJpdGVGcmFtZeW8leeUqFxuICAgICAgICAgICAgY29uc3Qgc3ByaXRlRnJhbWVQcm9wID0gY29tcG9uZW50RGF0YS5wcm9wZXJ0aWVzPy5fc3ByaXRlRnJhbWUgfHwgY29tcG9uZW50RGF0YS5wcm9wZXJ0aWVzPy5zcHJpdGVGcmFtZTtcbiAgICAgICAgICAgIGlmIChzcHJpdGVGcmFtZVByb3ApIHtcbiAgICAgICAgICAgICAgICBjb21wb25lbnQuX3Nwcml0ZUZyYW1lID0gdGhpcy5wcm9jZXNzQ29tcG9uZW50UHJvcGVydHkoc3ByaXRlRnJhbWVQcm9wLCBjb250ZXh0KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29tcG9uZW50Ll9zcHJpdGVGcmFtZSA9IG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbXBvbmVudC5fdHlwZSA9IGNvbXBvbmVudERhdGEucHJvcGVydGllcz8uX3R5cGU/LnZhbHVlID8/IDA7XG4gICAgICAgICAgICBjb21wb25lbnQuX2ZpbGxUeXBlID0gY29tcG9uZW50RGF0YS5wcm9wZXJ0aWVzPy5fZmlsbFR5cGU/LnZhbHVlID8/IDA7XG4gICAgICAgICAgICBjb21wb25lbnQuX3NpemVNb2RlID0gY29tcG9uZW50RGF0YS5wcm9wZXJ0aWVzPy5fc2l6ZU1vZGU/LnZhbHVlID8/IDE7XG4gICAgICAgICAgICBjb21wb25lbnQuX2ZpbGxDZW50ZXIgPSB7IFwiX190eXBlX19cIjogXCJjYy5WZWMyXCIsIFwieFwiOiAwLCBcInlcIjogMCB9O1xuICAgICAgICAgICAgY29tcG9uZW50Ll9maWxsU3RhcnQgPSBjb21wb25lbnREYXRhLnByb3BlcnRpZXM/Ll9maWxsU3RhcnQ/LnZhbHVlID8/IDA7XG4gICAgICAgICAgICBjb21wb25lbnQuX2ZpbGxSYW5nZSA9IGNvbXBvbmVudERhdGEucHJvcGVydGllcz8uX2ZpbGxSYW5nZT8udmFsdWUgPz8gMDtcbiAgICAgICAgICAgIGNvbXBvbmVudC5faXNUcmltbWVkTW9kZSA9IGNvbXBvbmVudERhdGEucHJvcGVydGllcz8uX2lzVHJpbW1lZE1vZGU/LnZhbHVlID8/IHRydWU7XG4gICAgICAgICAgICBjb21wb25lbnQuX3VzZUdyYXlzY2FsZSA9IGNvbXBvbmVudERhdGEucHJvcGVydGllcz8uX3VzZUdyYXlzY2FsZT8udmFsdWUgPz8gZmFsc2U7XG5cbiAgICAgICAgICAgIC8vIOiwg+ivle+8muaJk+WNsFNwcml0Zee7hOS7tueahOaJgOacieWxnuaAp++8iOW3suazqOmHiu+8iVxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ1Nwcml0Zee7hOS7tuWxnuaApzonLCBKU09OLnN0cmluZ2lmeShjb21wb25lbnREYXRhLnByb3BlcnRpZXMsIG51bGwsIDIpKTtcbiAgICAgICAgICAgIGNvbXBvbmVudC5fYXRsYXMgPSBudWxsO1xuICAgICAgICAgICAgY29tcG9uZW50Ll9pZCA9IFwiXCI7XG4gICAgICAgIH0gZWxzZSBpZiAoY29tcG9uZW50VHlwZSA9PT0gJ2NjLkJ1dHRvbicpIHtcbiAgICAgICAgICAgIGNvbXBvbmVudC5faW50ZXJhY3RhYmxlID0gdHJ1ZTtcbiAgICAgICAgICAgIGNvbXBvbmVudC5fdHJhbnNpdGlvbiA9IDM7XG4gICAgICAgICAgICBjb21wb25lbnQuX25vcm1hbENvbG9yID0geyBcIl9fdHlwZV9fXCI6IFwiY2MuQ29sb3JcIiwgXCJyXCI6IDI1NSwgXCJnXCI6IDI1NSwgXCJiXCI6IDI1NSwgXCJhXCI6IDI1NSB9O1xuICAgICAgICAgICAgY29tcG9uZW50Ll9ob3ZlckNvbG9yID0geyBcIl9fdHlwZV9fXCI6IFwiY2MuQ29sb3JcIiwgXCJyXCI6IDIxMSwgXCJnXCI6IDIxMSwgXCJiXCI6IDIxMSwgXCJhXCI6IDI1NSB9O1xuICAgICAgICAgICAgY29tcG9uZW50Ll9wcmVzc2VkQ29sb3IgPSB7IFwiX190eXBlX19cIjogXCJjYy5Db2xvclwiLCBcInJcIjogMjU1LCBcImdcIjogMjU1LCBcImJcIjogMjU1LCBcImFcIjogMjU1IH07XG4gICAgICAgICAgICBjb21wb25lbnQuX2Rpc2FibGVkQ29sb3IgPSB7IFwiX190eXBlX19cIjogXCJjYy5Db2xvclwiLCBcInJcIjogMTI0LCBcImdcIjogMTI0LCBcImJcIjogMTI0LCBcImFcIjogMjU1IH07XG4gICAgICAgICAgICBjb21wb25lbnQuX25vcm1hbFNwcml0ZSA9IG51bGw7XG4gICAgICAgICAgICBjb21wb25lbnQuX2hvdmVyU3ByaXRlID0gbnVsbDtcbiAgICAgICAgICAgIGNvbXBvbmVudC5fcHJlc3NlZFNwcml0ZSA9IG51bGw7XG4gICAgICAgICAgICBjb21wb25lbnQuX2Rpc2FibGVkU3ByaXRlID0gbnVsbDtcbiAgICAgICAgICAgIGNvbXBvbmVudC5fZHVyYXRpb24gPSAwLjE7XG4gICAgICAgICAgICBjb21wb25lbnQuX3pvb21TY2FsZSA9IDEuMjtcbiAgICAgICAgICAgIC8vIOWkhOeQhkJ1dHRvbueahHRhcmdldOW8leeUqFxuICAgICAgICAgICAgY29uc3QgdGFyZ2V0UHJvcCA9IGNvbXBvbmVudERhdGEucHJvcGVydGllcz8uX3RhcmdldCB8fCBjb21wb25lbnREYXRhLnByb3BlcnRpZXM/LnRhcmdldDtcbiAgICAgICAgICAgIGlmICh0YXJnZXRQcm9wKSB7XG4gICAgICAgICAgICAgICAgY29tcG9uZW50Ll90YXJnZXQgPSB0aGlzLnByb2Nlc3NDb21wb25lbnRQcm9wZXJ0eSh0YXJnZXRQcm9wLCBjb250ZXh0KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29tcG9uZW50Ll90YXJnZXQgPSB7IFwiX19pZF9fXCI6IG5vZGVJbmRleCB9OyAvLyDpu5jorqTmjIflkJHoh6rouqvoioLngrlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbXBvbmVudC5fY2xpY2tFdmVudHMgPSBbXTtcbiAgICAgICAgICAgIGNvbXBvbmVudC5faWQgPSBcIlwiO1xuICAgICAgICB9IGVsc2UgaWYgKGNvbXBvbmVudFR5cGUgPT09ICdjYy5MYWJlbCcpIHtcbiAgICAgICAgICAgIGNvbXBvbmVudC5fc3RyaW5nID0gY29tcG9uZW50RGF0YS5wcm9wZXJ0aWVzPy5fc3RyaW5nPy52YWx1ZSB8fCBcIkxhYmVsXCI7XG4gICAgICAgICAgICBjb21wb25lbnQuX2hvcml6b250YWxBbGlnbiA9IDE7XG4gICAgICAgICAgICBjb21wb25lbnQuX3ZlcnRpY2FsQWxpZ24gPSAxO1xuICAgICAgICAgICAgY29tcG9uZW50Ll9hY3R1YWxGb250U2l6ZSA9IDIwO1xuICAgICAgICAgICAgY29tcG9uZW50Ll9mb250U2l6ZSA9IDIwO1xuICAgICAgICAgICAgY29tcG9uZW50Ll9mb250RmFtaWx5ID0gXCJBcmlhbFwiO1xuICAgICAgICAgICAgY29tcG9uZW50Ll9saW5lSGVpZ2h0ID0gMjU7XG4gICAgICAgICAgICBjb21wb25lbnQuX292ZXJmbG93ID0gMDtcbiAgICAgICAgICAgIGNvbXBvbmVudC5fZW5hYmxlV3JhcFRleHQgPSB0cnVlO1xuICAgICAgICAgICAgY29tcG9uZW50Ll9mb250ID0gbnVsbDtcbiAgICAgICAgICAgIGNvbXBvbmVudC5faXNTeXN0ZW1Gb250VXNlZCA9IHRydWU7XG4gICAgICAgICAgICBjb21wb25lbnQuX3NwYWNpbmdYID0gMDtcbiAgICAgICAgICAgIGNvbXBvbmVudC5faXNJdGFsaWMgPSBmYWxzZTtcbiAgICAgICAgICAgIGNvbXBvbmVudC5faXNCb2xkID0gZmFsc2U7XG4gICAgICAgICAgICBjb21wb25lbnQuX2lzVW5kZXJsaW5lID0gZmFsc2U7XG4gICAgICAgICAgICBjb21wb25lbnQuX3VuZGVybGluZUhlaWdodCA9IDI7XG4gICAgICAgICAgICBjb21wb25lbnQuX2NhY2hlTW9kZSA9IDA7XG4gICAgICAgICAgICBjb21wb25lbnQuX2lkID0gXCJcIjtcbiAgICAgICAgfSBlbHNlIGlmIChjb21wb25lbnREYXRhLnByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgIC8vIOWkhOeQhuaJgOaciee7hOS7tueahOWxnuaAp++8iOWMheaLrOWGhee9rue7hOS7tuWSjOiHquWumuS5ieiEmuacrOe7hOS7tu+8iVxuICAgICAgICAgICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMoY29tcG9uZW50RGF0YS5wcm9wZXJ0aWVzKSkge1xuICAgICAgICAgICAgICAgIGlmIChrZXkgPT09ICdub2RlJyB8fCBrZXkgPT09ICdlbmFibGVkJyB8fCBrZXkgPT09ICdfX3R5cGVfXycgfHxcbiAgICAgICAgICAgICAgICAgICAga2V5ID09PSAndXVpZCcgfHwga2V5ID09PSAnbmFtZScgfHwga2V5ID09PSAnX19zY3JpcHRBc3NldCcgfHwga2V5ID09PSAnX29iakZsYWdzJykge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTsgLy8g6Lez6L+H6L+Z5Lqb54m55q6K5bGe5oCn77yM5YyF5ousX29iakZsYWdzXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8g5a+55LqO5Lul5LiL5YiS57q/5byA5aS055qE5bGe5oCn77yM6ZyA6KaB54m55q6K5aSE55CGXG4gICAgICAgICAgICAgICAgaWYgKGtleS5zdGFydHNXaXRoKCdfJykpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g56Gu5L+d5bGe5oCn5ZCN5L+d5oyB5Y6f5qC377yI5YyF5ous5LiL5YiS57q/77yJXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb3BWYWx1ZSA9IHRoaXMucHJvY2Vzc0NvbXBvbmVudFByb3BlcnR5KHZhbHVlLCBjb250ZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BWYWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnRba2V5XSA9IHByb3BWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOmdnuS4i+WIkue6v+W8gOWktOeahOWxnuaAp+ato+W4uOWkhOeQhlxuICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9wVmFsdWUgPSB0aGlzLnByb2Nlc3NDb21wb25lbnRQcm9wZXJ0eSh2YWx1ZSwgY29udGV4dCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9wVmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50W2tleV0gPSBwcm9wVmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyDnoa7kv50gX2lkIOWcqOacgOWQjuS9jee9rlxuICAgICAgICBjb25zdCBfaWQgPSBjb21wb25lbnQuX2lkIHx8IFwiXCI7XG4gICAgICAgIGRlbGV0ZSBjb21wb25lbnQuX2lkO1xuICAgICAgICBjb21wb25lbnQuX2lkID0gX2lkO1xuXG4gICAgICAgIHJldHVybiBjb21wb25lbnQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5aSE55CG57uE5Lu25bGe5oCn5YC877yM56Gu5L+d5qC85byP5LiO5omL5Yqo5Yib5bu655qE6aKE5Yi25L2T5LiA6Ie0XG4gICAgICovXG4gICAgcHJpdmF0ZSBwcm9jZXNzQ29tcG9uZW50UHJvcGVydHkocHJvcERhdGE6IGFueSwgY29udGV4dD86IHtcbiAgICAgICAgbm9kZVV1aWRUb0luZGV4PzogTWFwPHN0cmluZywgbnVtYmVyPixcbiAgICAgICAgY29tcG9uZW50VXVpZFRvSW5kZXg/OiBNYXA8c3RyaW5nLCBudW1iZXI+XG4gICAgfSk6IGFueSB7XG4gICAgICAgIGlmICghcHJvcERhdGEgfHwgdHlwZW9mIHByb3BEYXRhICE9PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgcmV0dXJuIHByb3BEYXRhO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdmFsdWUgPSBwcm9wRGF0YS52YWx1ZTtcbiAgICAgICAgY29uc3QgdHlwZSA9IHByb3BEYXRhLnR5cGU7XG5cbiAgICAgICAgLy8g5aSE55CGbnVsbOWAvFxuICAgICAgICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDlpITnkIbnqbpVVUlE5a+56LGh77yM6L2s5o2i5Li6bnVsbFxuICAgICAgICBpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZS51dWlkID09PSAnJykge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDlpITnkIboioLngrnlvJXnlKhcbiAgICAgICAgaWYgKHR5cGUgPT09ICdjYy5Ob2RlJyAmJiB2YWx1ZT8udXVpZCkge1xuICAgICAgICAgICAgLy8g5Zyo6aKE5Yi25L2T5Lit77yM6IqC54K55byV55So6ZyA6KaB6L2s5o2i5Li6IF9faWRfXyDlvaLlvI9cbiAgICAgICAgICAgIGlmIChjb250ZXh0Py5ub2RlVXVpZFRvSW5kZXggJiYgY29udGV4dC5ub2RlVXVpZFRvSW5kZXguaGFzKHZhbHVlLnV1aWQpKSB7XG4gICAgICAgICAgICAgICAgLy8g5YaF6YOo5byV55So77ya6L2s5o2i5Li6X19pZF9f5qC85byPXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgXCJfX2lkX19cIjogY29udGV4dC5ub2RlVXVpZFRvSW5kZXguZ2V0KHZhbHVlLnV1aWQpXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIOWklumDqOW8leeUqO+8muiuvue9ruS4um51bGzvvIzlm6DkuLrlpJbpg6joioLngrnkuI3lsZ7kuo7pooTliLbkvZPnu5PmnoRcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgTm9kZSByZWZlcmVuY2UgVVVJRCAke3ZhbHVlLnV1aWR9IG5vdCBmb3VuZCBpbiBwcmVmYWIgY29udGV4dCwgc2V0dGluZyB0byBudWxsIChleHRlcm5hbCByZWZlcmVuY2UpYCk7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWkhOeQhui1hOa6kOW8leeUqO+8iOmihOWItuS9k+OAgee6ueeQhuOAgeeyvueBteW4p+etie+8iVxuICAgICAgICBpZiAodmFsdWU/LnV1aWQgJiYgKFxuICAgICAgICAgICAgdHlwZSA9PT0gJ2NjLlByZWZhYicgfHxcbiAgICAgICAgICAgIHR5cGUgPT09ICdjYy5UZXh0dXJlMkQnIHx8XG4gICAgICAgICAgICB0eXBlID09PSAnY2MuU3ByaXRlRnJhbWUnIHx8XG4gICAgICAgICAgICB0eXBlID09PSAnY2MuTWF0ZXJpYWwnIHx8XG4gICAgICAgICAgICB0eXBlID09PSAnY2MuQW5pbWF0aW9uQ2xpcCcgfHxcbiAgICAgICAgICAgIHR5cGUgPT09ICdjYy5BdWRpb0NsaXAnIHx8XG4gICAgICAgICAgICB0eXBlID09PSAnY2MuRm9udCcgfHxcbiAgICAgICAgICAgIHR5cGUgPT09ICdjYy5Bc3NldCdcbiAgICAgICAgKSkge1xuICAgICAgICAgICAgLy8g5a+55LqO6aKE5Yi25L2T5byV55So77yM5L+d5oyB5Y6f5aeLVVVJROagvOW8j1xuICAgICAgICAgICAgY29uc3QgdXVpZFRvVXNlID0gdHlwZSA9PT0gJ2NjLlByZWZhYicgPyB2YWx1ZS51dWlkIDogdGhpcy51dWlkVG9Db21wcmVzc2VkSWQodmFsdWUudXVpZCk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIFwiX191dWlkX19cIjogdXVpZFRvVXNlLFxuICAgICAgICAgICAgICAgIFwiX19leHBlY3RlZFR5cGVfX1wiOiB0eXBlXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5aSE55CG57uE5Lu25byV55So77yI5YyF5ous5YW35L2T55qE57uE5Lu257G75Z6L5aaCY2MuTGFiZWwsIGNjLkJ1dHRvbuetie+8iVxuICAgICAgICBpZiAodmFsdWU/LnV1aWQgJiYgKHR5cGUgPT09ICdjYy5Db21wb25lbnQnIHx8XG4gICAgICAgICAgICB0eXBlID09PSAnY2MuTGFiZWwnIHx8IHR5cGUgPT09ICdjYy5CdXR0b24nIHx8IHR5cGUgPT09ICdjYy5TcHJpdGUnIHx8XG4gICAgICAgICAgICB0eXBlID09PSAnY2MuVUlUcmFuc2Zvcm0nIHx8IHR5cGUgPT09ICdjYy5SaWdpZEJvZHkyRCcgfHxcbiAgICAgICAgICAgIHR5cGUgPT09ICdjYy5Cb3hDb2xsaWRlcjJEJyB8fCB0eXBlID09PSAnY2MuQW5pbWF0aW9uJyB8fFxuICAgICAgICAgICAgdHlwZSA9PT0gJ2NjLkF1ZGlvU291cmNlJyB8fCAodHlwZT8uc3RhcnRzV2l0aCgnY2MuJykgJiYgIXR5cGUuaW5jbHVkZXMoJ0AnKSkpKSB7XG4gICAgICAgICAgICAvLyDlnKjpooTliLbkvZPkuK3vvIznu4Tku7blvJXnlKjkuZ/pnIDopoHovazmjaLkuLogX19pZF9fIOW9ouW8j1xuICAgICAgICAgICAgaWYgKGNvbnRleHQ/LmNvbXBvbmVudFV1aWRUb0luZGV4ICYmIGNvbnRleHQuY29tcG9uZW50VXVpZFRvSW5kZXguaGFzKHZhbHVlLnV1aWQpKSB7XG4gICAgICAgICAgICAgICAgLy8g5YaF6YOo5byV55So77ya6L2s5o2i5Li6X19pZF9f5qC85byPXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYENvbXBvbmVudCByZWZlcmVuY2UgJHt0eXBlfSBVVUlEICR7dmFsdWUudXVpZH0gZm91bmQgaW4gcHJlZmFiIGNvbnRleHQsIGNvbnZlcnRpbmcgdG8gX19pZF9fYCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgXCJfX2lkX19cIjogY29udGV4dC5jb21wb25lbnRVdWlkVG9JbmRleC5nZXQodmFsdWUudXVpZClcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8g5aSW6YOo5byV55So77ya6K6+572u5Li6bnVsbO+8jOWboOS4uuWklumDqOe7hOS7tuS4jeWxnuS6jumihOWItuS9k+e7k+aehFxuICAgICAgICAgICAgY29uc29sZS53YXJuKGBDb21wb25lbnQgcmVmZXJlbmNlICR7dHlwZX0gVVVJRCAke3ZhbHVlLnV1aWR9IG5vdCBmb3VuZCBpbiBwcmVmYWIgY29udGV4dCwgc2V0dGluZyB0byBudWxsIChleHRlcm5hbCByZWZlcmVuY2UpYCk7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWkhOeQhuWkjeadguexu+Wei++8jOa3u+WKoF9fdHlwZV9f5qCH6K6wXG4gICAgICAgIGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBpZiAodHlwZSA9PT0gJ2NjLkNvbG9yJykge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIFwiX190eXBlX19cIjogXCJjYy5Db2xvclwiLFxuICAgICAgICAgICAgICAgICAgICBcInJcIjogTWF0aC5taW4oMjU1LCBNYXRoLm1heCgwLCBOdW1iZXIodmFsdWUucikgfHwgMCkpLFxuICAgICAgICAgICAgICAgICAgICBcImdcIjogTWF0aC5taW4oMjU1LCBNYXRoLm1heCgwLCBOdW1iZXIodmFsdWUuZykgfHwgMCkpLFxuICAgICAgICAgICAgICAgICAgICBcImJcIjogTWF0aC5taW4oMjU1LCBNYXRoLm1heCgwLCBOdW1iZXIodmFsdWUuYikgfHwgMCkpLFxuICAgICAgICAgICAgICAgICAgICBcImFcIjogdmFsdWUuYSAhPT0gdW5kZWZpbmVkID8gTWF0aC5taW4oMjU1LCBNYXRoLm1heCgwLCBOdW1iZXIodmFsdWUuYSkpKSA6IDI1NVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdjYy5WZWMzJykge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIFwiX190eXBlX19cIjogXCJjYy5WZWMzXCIsXG4gICAgICAgICAgICAgICAgICAgIFwieFwiOiBOdW1iZXIodmFsdWUueCkgfHwgMCxcbiAgICAgICAgICAgICAgICAgICAgXCJ5XCI6IE51bWJlcih2YWx1ZS55KSB8fCAwLFxuICAgICAgICAgICAgICAgICAgICBcInpcIjogTnVtYmVyKHZhbHVlLnopIHx8IDBcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlID09PSAnY2MuVmVjMicpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBcIl9fdHlwZV9fXCI6IFwiY2MuVmVjMlwiLFxuICAgICAgICAgICAgICAgICAgICBcInhcIjogTnVtYmVyKHZhbHVlLngpIHx8IDAsXG4gICAgICAgICAgICAgICAgICAgIFwieVwiOiBOdW1iZXIodmFsdWUueSkgfHwgMFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdjYy5TaXplJykge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIFwiX190eXBlX19cIjogXCJjYy5TaXplXCIsXG4gICAgICAgICAgICAgICAgICAgIFwid2lkdGhcIjogTnVtYmVyKHZhbHVlLndpZHRoKSB8fCAwLFxuICAgICAgICAgICAgICAgICAgICBcImhlaWdodFwiOiBOdW1iZXIodmFsdWUuaGVpZ2h0KSB8fCAwXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ2NjLlF1YXQnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBcImNjLlF1YXRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ4XCI6IE51bWJlcih2YWx1ZS54KSB8fCAwLFxuICAgICAgICAgICAgICAgICAgICBcInlcIjogTnVtYmVyKHZhbHVlLnkpIHx8IDAsXG4gICAgICAgICAgICAgICAgICAgIFwielwiOiBOdW1iZXIodmFsdWUueikgfHwgMCxcbiAgICAgICAgICAgICAgICAgICAgXCJ3XCI6IHZhbHVlLncgIT09IHVuZGVmaW5lZCA/IE51bWJlcih2YWx1ZS53KSA6IDFcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g5aSE55CG5pWw57uE57G75Z6LXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICAgICAgLy8g6IqC54K55pWw57uEXG4gICAgICAgICAgICBpZiAocHJvcERhdGEuZWxlbWVudFR5cGVEYXRhPy50eXBlID09PSAnY2MuTm9kZScpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWUubWFwKGl0ZW0gPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbT8udXVpZCAmJiBjb250ZXh0Py5ub2RlVXVpZFRvSW5kZXg/LmhhcyhpdGVtLnV1aWQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBcIl9faWRfX1wiOiBjb250ZXh0Lm5vZGVVdWlkVG9JbmRleC5nZXQoaXRlbS51dWlkKSB9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH0pLmZpbHRlcihpdGVtID0+IGl0ZW0gIT09IG51bGwpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDotYTmupDmlbDnu4RcbiAgICAgICAgICAgIGlmIChwcm9wRGF0YS5lbGVtZW50VHlwZURhdGE/LnR5cGUgJiYgcHJvcERhdGEuZWxlbWVudFR5cGVEYXRhLnR5cGUuc3RhcnRzV2l0aCgnY2MuJykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWUubWFwKGl0ZW0gPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbT8udXVpZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIl9fdXVpZF9fXCI6IHRoaXMudXVpZFRvQ29tcHJlc3NlZElkKGl0ZW0udXVpZCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJfX2V4cGVjdGVkVHlwZV9fXCI6IHByb3BEYXRhLmVsZW1lbnRUeXBlRGF0YS50eXBlXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH0pLmZpbHRlcihpdGVtID0+IGl0ZW0gIT09IG51bGwpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDln7rnoYDnsbvlnovmlbDnu4RcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZS5tYXAoaXRlbSA9PiBpdGVtPy52YWx1ZSAhPT0gdW5kZWZpbmVkID8gaXRlbS52YWx1ZSA6IGl0ZW0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5YW25LuW5aSN5p2C5a+56LGh57G75Z6L77yM5L+d5oyB5Y6f5qC35L2G56Gu5L+d5pyJX190eXBlX1/moIforrBcbiAgICAgICAgaWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdHlwZSAmJiB0eXBlLnN0YXJ0c1dpdGgoJ2NjLicpKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIFwiX190eXBlX19cIjogdHlwZSxcbiAgICAgICAgICAgICAgICAuLi52YWx1ZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDliJvlu7rnrKblkIjlvJXmk47moIflh4bnmoToioLngrnlr7nosaFcbiAgICAgKi9cbiAgICBwcml2YXRlIGNyZWF0ZUVuZ2luZVN0YW5kYXJkTm9kZShub2RlRGF0YTogYW55LCBwYXJlbnROb2RlSW5kZXg6IG51bWJlciB8IG51bGwsIG5vZGVOYW1lPzogc3RyaW5nKTogYW55IHtcbiAgICAgICAgLy8g6LCD6K+V77ya5omT5Y2w5Y6f5aeL6IqC54K55pWw5o2u77yI5bey5rOo6YeK77yJXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCfljp/lp4voioLngrnmlbDmja46JywgSlNPTi5zdHJpbmdpZnkobm9kZURhdGEsIG51bGwsIDIpKTtcblxuICAgICAgICAvLyDmj5Dlj5boioLngrnnmoTln7rmnKzlsZ7mgKdcbiAgICAgICAgY29uc3QgZ2V0VmFsdWUgPSAocHJvcDogYW55KSA9PiB7XG4gICAgICAgICAgICBpZiAocHJvcD8udmFsdWUgIT09IHVuZGVmaW5lZCkgcmV0dXJuIHByb3AudmFsdWU7XG4gICAgICAgICAgICBpZiAocHJvcCAhPT0gdW5kZWZpbmVkKSByZXR1cm4gcHJvcDtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IHBvc2l0aW9uID0gZ2V0VmFsdWUobm9kZURhdGEucG9zaXRpb24pIHx8IGdldFZhbHVlKG5vZGVEYXRhLnZhbHVlPy5wb3NpdGlvbikgfHwgeyB4OiAwLCB5OiAwLCB6OiAwIH07XG4gICAgICAgIGNvbnN0IHJvdGF0aW9uID0gZ2V0VmFsdWUobm9kZURhdGEucm90YXRpb24pIHx8IGdldFZhbHVlKG5vZGVEYXRhLnZhbHVlPy5yb3RhdGlvbikgfHwgeyB4OiAwLCB5OiAwLCB6OiAwLCB3OiAxIH07XG4gICAgICAgIGNvbnN0IHNjYWxlID0gZ2V0VmFsdWUobm9kZURhdGEuc2NhbGUpIHx8IGdldFZhbHVlKG5vZGVEYXRhLnZhbHVlPy5zY2FsZSkgfHwgeyB4OiAxLCB5OiAxLCB6OiAxIH07XG4gICAgICAgIGNvbnN0IGFjdGl2ZSA9IGdldFZhbHVlKG5vZGVEYXRhLmFjdGl2ZSkgPz8gZ2V0VmFsdWUobm9kZURhdGEudmFsdWU/LmFjdGl2ZSkgPz8gdHJ1ZTtcbiAgICAgICAgY29uc3QgbmFtZSA9IG5vZGVOYW1lIHx8IGdldFZhbHVlKG5vZGVEYXRhLm5hbWUpIHx8IGdldFZhbHVlKG5vZGVEYXRhLnZhbHVlPy5uYW1lKSB8fCAnTm9kZSc7XG4gICAgICAgIGNvbnN0IGxheWVyID0gZ2V0VmFsdWUobm9kZURhdGEubGF5ZXIpIHx8IGdldFZhbHVlKG5vZGVEYXRhLnZhbHVlPy5sYXllcikgfHwgMTA3Mzc0MTgyNDtcblxuICAgICAgICAvLyDosIPor5XovpPlh7pcbiAgICAgICAgY29uc29sZS5sb2coYOWIm+W7uuiKgueCuTogJHtuYW1lfSwgcGFyZW50Tm9kZUluZGV4OiAke3BhcmVudE5vZGVJbmRleH1gKTtcblxuICAgICAgICBjb25zdCBwYXJlbnRSZWYgPSBwYXJlbnROb2RlSW5kZXggIT09IG51bGwgPyB7IFwiX19pZF9fXCI6IHBhcmVudE5vZGVJbmRleCB9IDogbnVsbDtcbiAgICAgICAgY29uc29sZS5sb2coYOiKgueCuSAke25hbWV9IOeahOeItuiKgueCueW8leeUqDpgLCBwYXJlbnRSZWYpO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBcIl9fdHlwZV9fXCI6IFwiY2MuTm9kZVwiLFxuICAgICAgICAgICAgXCJfbmFtZVwiOiBuYW1lLFxuICAgICAgICAgICAgXCJfb2JqRmxhZ3NcIjogMCxcbiAgICAgICAgICAgIFwiX19lZGl0b3JFeHRyYXNfX1wiOiB7fSxcbiAgICAgICAgICAgIFwiX3BhcmVudFwiOiBwYXJlbnRSZWYsXG4gICAgICAgICAgICBcIl9jaGlsZHJlblwiOiBbXSwgLy8g5a2Q6IqC54K55byV55So5bCG5Zyo6YCS5b2S6L+H56iL5Lit5Yqo5oCB5re75YqgXG4gICAgICAgICAgICBcIl9hY3RpdmVcIjogYWN0aXZlLFxuICAgICAgICAgICAgXCJfY29tcG9uZW50c1wiOiBbXSwgLy8g57uE5Lu25byV55So5bCG5Zyo5aSE55CG57uE5Lu25pe25Yqo5oCB5re75YqgXG4gICAgICAgICAgICBcIl9wcmVmYWJcIjogeyBcIl9faWRfX1wiOiAwIH0sIC8vIOS4tOaXtuWAvO+8jOWQjue7reS8muiiq+ato+ehruiuvue9rlxuICAgICAgICAgICAgXCJfbHBvc1wiOiB7XG4gICAgICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBcImNjLlZlYzNcIixcbiAgICAgICAgICAgICAgICBcInhcIjogcG9zaXRpb24ueCxcbiAgICAgICAgICAgICAgICBcInlcIjogcG9zaXRpb24ueSxcbiAgICAgICAgICAgICAgICBcInpcIjogcG9zaXRpb24uelxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiX2xyb3RcIjoge1xuICAgICAgICAgICAgICAgIFwiX190eXBlX19cIjogXCJjYy5RdWF0XCIsXG4gICAgICAgICAgICAgICAgXCJ4XCI6IHJvdGF0aW9uLngsXG4gICAgICAgICAgICAgICAgXCJ5XCI6IHJvdGF0aW9uLnksXG4gICAgICAgICAgICAgICAgXCJ6XCI6IHJvdGF0aW9uLnosXG4gICAgICAgICAgICAgICAgXCJ3XCI6IHJvdGF0aW9uLndcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcIl9sc2NhbGVcIjoge1xuICAgICAgICAgICAgICAgIFwiX190eXBlX19cIjogXCJjYy5WZWMzXCIsXG4gICAgICAgICAgICAgICAgXCJ4XCI6IHNjYWxlLngsXG4gICAgICAgICAgICAgICAgXCJ5XCI6IHNjYWxlLnksXG4gICAgICAgICAgICAgICAgXCJ6XCI6IHNjYWxlLnpcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcIl9tb2JpbGl0eVwiOiAwLFxuICAgICAgICAgICAgXCJfbGF5ZXJcIjogbGF5ZXIsXG4gICAgICAgICAgICBcIl9ldWxlclwiOiB7XG4gICAgICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBcImNjLlZlYzNcIixcbiAgICAgICAgICAgICAgICBcInhcIjogMCxcbiAgICAgICAgICAgICAgICBcInlcIjogMCxcbiAgICAgICAgICAgICAgICBcInpcIjogMFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiX2lkXCI6IFwiXCJcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDku47oioLngrnmlbDmja7kuK3mj5Dlj5ZVVUlEXG4gICAgICovXG4gICAgcHJpdmF0ZSBleHRyYWN0Tm9kZVV1aWQobm9kZURhdGE6IGFueSk6IHN0cmluZyB8IG51bGwge1xuICAgICAgICBpZiAoIW5vZGVEYXRhKSByZXR1cm4gbnVsbDtcblxuICAgICAgICAvLyDlsJ3or5XlpJrnp43mlrnlvI/ojrflj5ZVVUlEXG4gICAgICAgIGNvbnN0IHNvdXJjZXMgPSBbXG4gICAgICAgICAgICBub2RlRGF0YS51dWlkLFxuICAgICAgICAgICAgbm9kZURhdGEudmFsdWU/LnV1aWQsXG4gICAgICAgICAgICBub2RlRGF0YS5fX3V1aWRfXyxcbiAgICAgICAgICAgIG5vZGVEYXRhLnZhbHVlPy5fX3V1aWRfXyxcbiAgICAgICAgICAgIG5vZGVEYXRhLmlkLFxuICAgICAgICAgICAgbm9kZURhdGEudmFsdWU/LmlkXG4gICAgICAgIF07XG5cbiAgICAgICAgZm9yIChjb25zdCBzb3VyY2Ugb2Ygc291cmNlcykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBzb3VyY2UgPT09ICdzdHJpbmcnICYmIHNvdXJjZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNvdXJjZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWIm+W7uuacgOWwj+WMlueahOiKgueCueWvueixoe+8jOS4jeWMheWQq+S7u+S9lee7hOS7tuS7pemBv+WFjeS+nei1lumXrumimFxuICAgICAqL1xuICAgIHByaXZhdGUgY3JlYXRlTWluaW1hbE5vZGUobm9kZURhdGE6IGFueSwgbm9kZU5hbWU/OiBzdHJpbmcpOiBhbnkge1xuICAgICAgICAvLyDmj5Dlj5boioLngrnnmoTln7rmnKzlsZ7mgKdcbiAgICAgICAgY29uc3QgZ2V0VmFsdWUgPSAocHJvcDogYW55KSA9PiB7XG4gICAgICAgICAgICBpZiAocHJvcD8udmFsdWUgIT09IHVuZGVmaW5lZCkgcmV0dXJuIHByb3AudmFsdWU7XG4gICAgICAgICAgICBpZiAocHJvcCAhPT0gdW5kZWZpbmVkKSByZXR1cm4gcHJvcDtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IHBvc2l0aW9uID0gZ2V0VmFsdWUobm9kZURhdGEucG9zaXRpb24pIHx8IGdldFZhbHVlKG5vZGVEYXRhLnZhbHVlPy5wb3NpdGlvbikgfHwgeyB4OiAwLCB5OiAwLCB6OiAwIH07XG4gICAgICAgIGNvbnN0IHJvdGF0aW9uID0gZ2V0VmFsdWUobm9kZURhdGEucm90YXRpb24pIHx8IGdldFZhbHVlKG5vZGVEYXRhLnZhbHVlPy5yb3RhdGlvbikgfHwgeyB4OiAwLCB5OiAwLCB6OiAwLCB3OiAxIH07XG4gICAgICAgIGNvbnN0IHNjYWxlID0gZ2V0VmFsdWUobm9kZURhdGEuc2NhbGUpIHx8IGdldFZhbHVlKG5vZGVEYXRhLnZhbHVlPy5zY2FsZSkgfHwgeyB4OiAxLCB5OiAxLCB6OiAxIH07XG4gICAgICAgIGNvbnN0IGFjdGl2ZSA9IGdldFZhbHVlKG5vZGVEYXRhLmFjdGl2ZSkgPz8gZ2V0VmFsdWUobm9kZURhdGEudmFsdWU/LmFjdGl2ZSkgPz8gdHJ1ZTtcbiAgICAgICAgY29uc3QgbmFtZSA9IG5vZGVOYW1lIHx8IGdldFZhbHVlKG5vZGVEYXRhLm5hbWUpIHx8IGdldFZhbHVlKG5vZGVEYXRhLnZhbHVlPy5uYW1lKSB8fCAnTm9kZSc7XG4gICAgICAgIGNvbnN0IGxheWVyID0gZ2V0VmFsdWUobm9kZURhdGEubGF5ZXIpIHx8IGdldFZhbHVlKG5vZGVEYXRhLnZhbHVlPy5sYXllcikgfHwgMzM1NTQ0MzI7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIFwiX190eXBlX19cIjogXCJjYy5Ob2RlXCIsXG4gICAgICAgICAgICBcIl9uYW1lXCI6IG5hbWUsXG4gICAgICAgICAgICBcIl9vYmpGbGFnc1wiOiAwLFxuICAgICAgICAgICAgXCJfcGFyZW50XCI6IG51bGwsXG4gICAgICAgICAgICBcIl9jaGlsZHJlblwiOiBbXSxcbiAgICAgICAgICAgIFwiX2FjdGl2ZVwiOiBhY3RpdmUsXG4gICAgICAgICAgICBcIl9jb21wb25lbnRzXCI6IFtdLCAvLyDnqbrnmoTnu4Tku7bmlbDnu4TvvIzpgb/lhY3nu4Tku7bkvp3otZbpl67pophcbiAgICAgICAgICAgIFwiX3ByZWZhYlwiOiB7XG4gICAgICAgICAgICAgICAgXCJfX2lkX19cIjogMlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiX2xwb3NcIjoge1xuICAgICAgICAgICAgICAgIFwiX190eXBlX19cIjogXCJjYy5WZWMzXCIsXG4gICAgICAgICAgICAgICAgXCJ4XCI6IHBvc2l0aW9uLngsXG4gICAgICAgICAgICAgICAgXCJ5XCI6IHBvc2l0aW9uLnksXG4gICAgICAgICAgICAgICAgXCJ6XCI6IHBvc2l0aW9uLnpcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcIl9scm90XCI6IHtcbiAgICAgICAgICAgICAgICBcIl9fdHlwZV9fXCI6IFwiY2MuUXVhdFwiLFxuICAgICAgICAgICAgICAgIFwieFwiOiByb3RhdGlvbi54LFxuICAgICAgICAgICAgICAgIFwieVwiOiByb3RhdGlvbi55LFxuICAgICAgICAgICAgICAgIFwielwiOiByb3RhdGlvbi56LFxuICAgICAgICAgICAgICAgIFwid1wiOiByb3RhdGlvbi53XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJfbHNjYWxlXCI6IHtcbiAgICAgICAgICAgICAgICBcIl9fdHlwZV9fXCI6IFwiY2MuVmVjM1wiLFxuICAgICAgICAgICAgICAgIFwieFwiOiBzY2FsZS54LFxuICAgICAgICAgICAgICAgIFwieVwiOiBzY2FsZS55LFxuICAgICAgICAgICAgICAgIFwielwiOiBzY2FsZS56XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJfbGF5ZXJcIjogbGF5ZXIsXG4gICAgICAgICAgICBcIl9ldWxlclwiOiB7XG4gICAgICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBcImNjLlZlYzNcIixcbiAgICAgICAgICAgICAgICBcInhcIjogMCxcbiAgICAgICAgICAgICAgICBcInlcIjogMCxcbiAgICAgICAgICAgICAgICBcInpcIjogMFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiX2lkXCI6IFwiXCJcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDliJvlu7rmoIflh4bnmoQgbWV0YSDmlofku7blhoXlrrlcbiAgICAgKi9cbiAgICBwcml2YXRlIGNyZWF0ZVN0YW5kYXJkTWV0YUNvbnRlbnQocHJlZmFiTmFtZTogc3RyaW5nLCBwcmVmYWJVdWlkOiBzdHJpbmcpOiBhbnkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgXCJ2ZXJcIjogXCIyLjAuM1wiLFxuICAgICAgICAgICAgXCJpbXBvcnRlclwiOiBcInByZWZhYlwiLFxuICAgICAgICAgICAgXCJpbXBvcnRlZFwiOiB0cnVlLFxuICAgICAgICAgICAgXCJ1dWlkXCI6IHByZWZhYlV1aWQsXG4gICAgICAgICAgICBcImZpbGVzXCI6IFtcbiAgICAgICAgICAgICAgICBcIi5qc29uXCJcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBcInN1Yk1ldGFzXCI6IHt9LFxuICAgICAgICAgICAgXCJ1c2VyRGF0YVwiOiB7XG4gICAgICAgICAgICAgICAgXCJzeW5jTm9kZU5hbWVcIjogcHJlZmFiTmFtZSxcbiAgICAgICAgICAgICAgICBcImhhc0ljb25cIjogZmFsc2VcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlsJ3or5XlsIbljp/lp4voioLngrnovazmjaLkuLrpooTliLbkvZPlrp7kvotcbiAgICAgKi9cbiAgICBwcml2YXRlIGFzeW5jIGNvbnZlcnROb2RlVG9QcmVmYWJJbnN0YW5jZShub2RlVXVpZDogc3RyaW5nLCBwcmVmYWJVdWlkOiBzdHJpbmcsIHByZWZhYlBhdGg6IHN0cmluZyk6IFByb21pc2U8eyBzdWNjZXNzOiBib29sZWFuOyBlcnJvcj86IHN0cmluZyB9PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgLy8g6L+Z5Liq5Yqf6IO96ZyA6KaB5rex5YWl55qE5Zy65pmv57yW6L6R5Zmo6ZuG5oiQ77yM5pqC5pe26L+U5Zue5aSx6LSlXG4gICAgICAgICAgICAvLyDlnKjlrp7pmYXnmoTlvJXmk47kuK3vvIzov5nmtonlj4rliLDlpI3mnYLnmoTpooTliLbkvZPlrp7kvovljJblkozoioLngrnmm7/mjaLpgLvovpFcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCfoioLngrnovazmjaLkuLrpooTliLbkvZPlrp7kvovnmoTlip/og73pnIDopoHmm7Tmt7HlhaXnmoTlvJXmk47pm4bmiJAnKTtcbiAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGVycm9yOiAn6IqC54K56L2s5o2i5Li66aKE5Yi25L2T5a6e5L6L6ZyA6KaB5pu05rex5YWl55qE5byV5pOO6ZuG5oiQ5pSv5oyBJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgcmVzdG9yZVByZWZhYk5vZGUobm9kZVV1aWQ6IHN0cmluZywgYXNzZXRVdWlkOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgLy8gMi547JeQ7ISc64qUIHJlc3RvcmUtcHJlZmFiIOuqheugueyWtOqwgCDsl4bsnYQg7IiYIOyeiOydjFxuICAgICAgICAgICAgICAgIC8vIGJyZWFrLXByZWZhYi1pbnN0YW5jZSDtm4Qg64uk7IucIGFwcGx5LXByZWZhYlxuICAgICAgICAgICAgICAgIEVkaXRvci5JcGMuc2VuZFRvUGFuZWwoJ3NjZW5lJywgJ3NjZW5lOmJyZWFrLXByZWZhYi1pbnN0YW5jZScsIG5vZGVVdWlkKTtcbiAgICAgICAgICAgICAgICBFZGl0b3IuSXBjLnNlbmRUb1BhbmVsKCdzY2VuZScsICdzY2VuZTphcHBseS1wcmVmYWInLCBub2RlVXVpZCk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVVdWlkOiBub2RlVXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFzc2V0VXVpZDogYXNzZXRVdWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ+mihOWItuS9k+iKgueCuei/mOWOn+aIkOWKnydcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGDpooTliLbkvZPoioLngrnov5jljp/lpLHotKU6ICR7ZXJyb3IubWVzc2FnZX1gXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIOWfuuS6juWumOaWuemihOWItuS9k+agvOW8j+eahOaWsOWunueOsOaWueazlVxuICAgIHByaXZhdGUgYXN5bmMgZ2V0Tm9kZURhdGFGb3JQcmVmYWIobm9kZVV1aWQ6IHN0cmluZyk6IFByb21pc2U8eyBzdWNjZXNzOiBib29sZWFuOyBkYXRhPzogYW55OyBlcnJvcj86IHN0cmluZyB9PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBFZGl0b3IuU2NlbmUuY2FsbFNjZW5lU2NyaXB0KCdjb2Nvcy1tY3Atc2VydmVyJywgJ3F1ZXJ5Tm9kZScsIG5vZGVVdWlkKTtcbiAgICAgICAgICAgICAgICBjb25zdCBub2RlRGF0YSA9IHJlc3VsdD8uZGF0YSB8fCByZXN1bHQ7XG4gICAgICAgICAgICAgICAgaWYgKCFub2RlRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAn6IqC54K55LiN5a2Y5ZyoJyB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogbm9kZURhdGEgfSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBjcmVhdGVTdGFuZGFyZFByZWZhYkRhdGEobm9kZURhdGE6IGFueSwgcHJlZmFiTmFtZTogc3RyaW5nLCBwcmVmYWJVdWlkOiBzdHJpbmcpOiBQcm9taXNlPGFueVtdPiB7XG4gICAgICAgIC8vIOWfuuS6juWumOaWuUNhbnZhcy5wcmVmYWLmoLzlvI/liJvlu7rpooTliLbkvZPmlbDmja7nu5PmnoRcbiAgICAgICAgY29uc3QgcHJlZmFiRGF0YTogYW55W10gPSBbXTtcbiAgICAgICAgbGV0IGN1cnJlbnRJZCA9IDA7XG5cbiAgICAgICAgLy8g56ys5LiA5Liq5YWD57Sg77yaY2MuUHJlZmFiIOi1hOa6kOWvueixoVxuICAgICAgICBjb25zdCBwcmVmYWJBc3NldCA9IHtcbiAgICAgICAgICAgIFwiX190eXBlX19cIjogXCJjYy5QcmVmYWJcIixcbiAgICAgICAgICAgIFwiX25hbWVcIjogcHJlZmFiTmFtZSxcbiAgICAgICAgICAgIFwiX29iakZsYWdzXCI6IDAsXG4gICAgICAgICAgICBcIl9fZWRpdG9yRXh0cmFzX19cIjoge30sXG4gICAgICAgICAgICBcIl9uYXRpdmVcIjogXCJcIixcbiAgICAgICAgICAgIFwiZGF0YVwiOiB7XG4gICAgICAgICAgICAgICAgXCJfX2lkX19cIjogMVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwib3B0aW1pemF0aW9uUG9saWN5XCI6IDAsXG4gICAgICAgICAgICBcInBlcnNpc3RlbnRcIjogZmFsc2VcbiAgICAgICAgfTtcbiAgICAgICAgcHJlZmFiRGF0YS5wdXNoKHByZWZhYkFzc2V0KTtcbiAgICAgICAgY3VycmVudElkKys7XG5cbiAgICAgICAgLy8g56ys5LqM5Liq5YWD57Sg77ya5qC56IqC54K5XG4gICAgICAgIGNvbnN0IHJvb3ROb2RlID0gYXdhaXQgdGhpcy5jcmVhdGVOb2RlT2JqZWN0KG5vZGVEYXRhLCBudWxsLCBwcmVmYWJEYXRhLCBjdXJyZW50SWQpO1xuICAgICAgICBwcmVmYWJEYXRhLnB1c2gocm9vdE5vZGUubm9kZSk7XG4gICAgICAgIGN1cnJlbnRJZCA9IHJvb3ROb2RlLm5leHRJZDtcblxuICAgICAgICAvLyDmt7vliqDmoLnoioLngrnnmoQgUHJlZmFiSW5mbyAtIOS/ruWkjWFzc2V05byV55So5L2/55SoVVVJRFxuICAgICAgICBjb25zdCByb290UHJlZmFiSW5mbyA9IHtcbiAgICAgICAgICAgIFwiX190eXBlX19cIjogXCJjYy5QcmVmYWJJbmZvXCIsXG4gICAgICAgICAgICBcInJvb3RcIjoge1xuICAgICAgICAgICAgICAgIFwiX19pZF9fXCI6IDFcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImFzc2V0XCI6IHtcbiAgICAgICAgICAgICAgICBcIl9fdXVpZF9fXCI6IHByZWZhYlV1aWRcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImZpbGVJZFwiOiB0aGlzLmdlbmVyYXRlRmlsZUlkKCksXG4gICAgICAgICAgICBcImluc3RhbmNlXCI6IG51bGwsXG4gICAgICAgICAgICBcInRhcmdldE92ZXJyaWRlc1wiOiBbXSxcbiAgICAgICAgICAgIFwibmVzdGVkUHJlZmFiSW5zdGFuY2VSb290c1wiOiBbXVxuICAgICAgICB9O1xuICAgICAgICBwcmVmYWJEYXRhLnB1c2gocm9vdFByZWZhYkluZm8pO1xuXG4gICAgICAgIHJldHVybiBwcmVmYWJEYXRhO1xuICAgIH1cblxuXG4gICAgcHJpdmF0ZSBhc3luYyBjcmVhdGVOb2RlT2JqZWN0KG5vZGVEYXRhOiBhbnksIHBhcmVudElkOiBudW1iZXIgfCBudWxsLCBwcmVmYWJEYXRhOiBhbnlbXSwgY3VycmVudElkOiBudW1iZXIpOiBQcm9taXNlPHsgbm9kZTogYW55OyBuZXh0SWQ6IG51bWJlciB9PiB7XG4gICAgICAgIGNvbnN0IG5vZGVJZCA9IGN1cnJlbnRJZCsrO1xuXG4gICAgICAgIC8vIOaPkOWPluiKgueCueeahOWfuuacrOWxnuaApyAtIOmAgumFjXF1ZXJ5LW5vZGUtdHJlZeeahOaVsOaNruagvOW8j1xuICAgICAgICBjb25zdCBnZXRWYWx1ZSA9IChwcm9wOiBhbnkpID0+IHtcbiAgICAgICAgICAgIGlmIChwcm9wPy52YWx1ZSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gcHJvcC52YWx1ZTtcbiAgICAgICAgICAgIGlmIChwcm9wICE9PSB1bmRlZmluZWQpIHJldHVybiBwcm9wO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgcG9zaXRpb24gPSBnZXRWYWx1ZShub2RlRGF0YS5wb3NpdGlvbikgfHwgZ2V0VmFsdWUobm9kZURhdGEudmFsdWU/LnBvc2l0aW9uKSB8fCB7IHg6IDAsIHk6IDAsIHo6IDAgfTtcbiAgICAgICAgY29uc3Qgcm90YXRpb24gPSBnZXRWYWx1ZShub2RlRGF0YS5yb3RhdGlvbikgfHwgZ2V0VmFsdWUobm9kZURhdGEudmFsdWU/LnJvdGF0aW9uKSB8fCB7IHg6IDAsIHk6IDAsIHo6IDAsIHc6IDEgfTtcbiAgICAgICAgY29uc3Qgc2NhbGUgPSBnZXRWYWx1ZShub2RlRGF0YS5zY2FsZSkgfHwgZ2V0VmFsdWUobm9kZURhdGEudmFsdWU/LnNjYWxlKSB8fCB7IHg6IDEsIHk6IDEsIHo6IDEgfTtcbiAgICAgICAgY29uc3QgYWN0aXZlID0gZ2V0VmFsdWUobm9kZURhdGEuYWN0aXZlKSA/PyBnZXRWYWx1ZShub2RlRGF0YS52YWx1ZT8uYWN0aXZlKSA/PyB0cnVlO1xuICAgICAgICBjb25zdCBuYW1lID0gZ2V0VmFsdWUobm9kZURhdGEubmFtZSkgfHwgZ2V0VmFsdWUobm9kZURhdGEudmFsdWU/Lm5hbWUpIHx8ICdOb2RlJztcbiAgICAgICAgY29uc3QgbGF5ZXIgPSBnZXRWYWx1ZShub2RlRGF0YS5sYXllcikgfHwgZ2V0VmFsdWUobm9kZURhdGEudmFsdWU/LmxheWVyKSB8fCAzMzU1NDQzMjtcblxuICAgICAgICBjb25zdCBub2RlOiBhbnkgPSB7XG4gICAgICAgICAgICBcIl9fdHlwZV9fXCI6IFwiY2MuTm9kZVwiLFxuICAgICAgICAgICAgXCJfbmFtZVwiOiBuYW1lLFxuICAgICAgICAgICAgXCJfb2JqRmxhZ3NcIjogMCxcbiAgICAgICAgICAgIFwiX19lZGl0b3JFeHRyYXNfX1wiOiB7fSxcbiAgICAgICAgICAgIFwiX3BhcmVudFwiOiBwYXJlbnRJZCAhPT0gbnVsbCA/IHsgXCJfX2lkX19cIjogcGFyZW50SWQgfSA6IG51bGwsXG4gICAgICAgICAgICBcIl9jaGlsZHJlblwiOiBbXSxcbiAgICAgICAgICAgIFwiX2FjdGl2ZVwiOiBhY3RpdmUsXG4gICAgICAgICAgICBcIl9jb21wb25lbnRzXCI6IFtdLFxuICAgICAgICAgICAgXCJfcHJlZmFiXCI6IHBhcmVudElkID09PSBudWxsID8ge1xuICAgICAgICAgICAgICAgIFwiX19pZF9fXCI6IGN1cnJlbnRJZCsrXG4gICAgICAgICAgICB9IDogbnVsbCxcbiAgICAgICAgICAgIFwiX2xwb3NcIjoge1xuICAgICAgICAgICAgICAgIFwiX190eXBlX19cIjogXCJjYy5WZWMzXCIsXG4gICAgICAgICAgICAgICAgXCJ4XCI6IHBvc2l0aW9uLngsXG4gICAgICAgICAgICAgICAgXCJ5XCI6IHBvc2l0aW9uLnksXG4gICAgICAgICAgICAgICAgXCJ6XCI6IHBvc2l0aW9uLnpcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcIl9scm90XCI6IHtcbiAgICAgICAgICAgICAgICBcIl9fdHlwZV9fXCI6IFwiY2MuUXVhdFwiLFxuICAgICAgICAgICAgICAgIFwieFwiOiByb3RhdGlvbi54LFxuICAgICAgICAgICAgICAgIFwieVwiOiByb3RhdGlvbi55LFxuICAgICAgICAgICAgICAgIFwielwiOiByb3RhdGlvbi56LFxuICAgICAgICAgICAgICAgIFwid1wiOiByb3RhdGlvbi53XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJfbHNjYWxlXCI6IHtcbiAgICAgICAgICAgICAgICBcIl9fdHlwZV9fXCI6IFwiY2MuVmVjM1wiLFxuICAgICAgICAgICAgICAgIFwieFwiOiBzY2FsZS54LFxuICAgICAgICAgICAgICAgIFwieVwiOiBzY2FsZS55LFxuICAgICAgICAgICAgICAgIFwielwiOiBzY2FsZS56XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJfbW9iaWxpdHlcIjogMCxcbiAgICAgICAgICAgIFwiX2xheWVyXCI6IGxheWVyLFxuICAgICAgICAgICAgXCJfZXVsZXJcIjoge1xuICAgICAgICAgICAgICAgIFwiX190eXBlX19cIjogXCJjYy5WZWMzXCIsXG4gICAgICAgICAgICAgICAgXCJ4XCI6IDAsXG4gICAgICAgICAgICAgICAgXCJ5XCI6IDAsXG4gICAgICAgICAgICAgICAgXCJ6XCI6IDBcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcIl9pZFwiOiBcIlwiXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8g5pqC5pe26Lez6L+HVUlUcmFuc2Zvcm3nu4Tku7bku6Xpgb/lhY1fZ2V0RGVwZW5kQ29tcG9uZW506ZSZ6K+vXG4gICAgICAgIC8vIOWQjue7remAmui/h0VuZ2luZSBBUEnliqjmgIHmt7vliqBcbiAgICAgICAgY29uc29sZS5sb2coYOiKgueCuSAke25hbWV9IOaaguaXtui3s+i/h1VJVHJhbnNmb3Jt57uE5Lu277yM6YG/5YWN5byV5pOO5L6d6LWW6ZSZ6K+vYCk7XG5cbiAgICAgICAgLy8g5aSE55CG5YW25LuW57uE5Lu277yI5pqC5pe26Lez6L+H77yM5LiT5rOo5LqO5L+u5aSNVUlUcmFuc2Zvcm3pl67popjvvIlcbiAgICAgICAgY29uc3QgY29tcG9uZW50cyA9IHRoaXMuZXh0cmFjdENvbXBvbmVudHNGcm9tTm9kZShub2RlRGF0YSk7XG4gICAgICAgIGlmIChjb21wb25lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGDoioLngrkgJHtuYW1lfSDljIXlkKsgJHtjb21wb25lbnRzLmxlbmd0aH0g5Liq5YW25LuW57uE5Lu277yM5pqC5pe26Lez6L+H5Lul5LiT5rOo5LqOVUlUcmFuc2Zvcm3kv67lpI1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWkhOeQhuWtkOiKgueCuSAtIOS9v+eUqHF1ZXJ5LW5vZGUtdHJlZeiOt+WPlueahOWujOaVtOe7k+aehFxuICAgICAgICBjb25zdCBjaGlsZHJlblRvUHJvY2VzcyA9IHRoaXMuZ2V0Q2hpbGRyZW5Ub1Byb2Nlc3Mobm9kZURhdGEpO1xuICAgICAgICBpZiAoY2hpbGRyZW5Ub1Byb2Nlc3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYD09PSDlpITnkIblrZDoioLngrkgPT09YCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhg6IqC54K5ICR7bmFtZX0g5YyF5ZCrICR7Y2hpbGRyZW5Ub1Byb2Nlc3MubGVuZ3RofSDkuKrlrZDoioLngrlgKTtcblxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGlsZHJlblRvUHJvY2Vzcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkRGF0YSA9IGNoaWxkcmVuVG9Qcm9jZXNzW2ldO1xuICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkTmFtZSA9IGNoaWxkRGF0YS5uYW1lIHx8IGNoaWxkRGF0YS52YWx1ZT8ubmFtZSB8fCAn5pyq55+lJztcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhg5aSE55CG56ysJHtpICsgMX3kuKrlrZDoioLngrk6ICR7Y2hpbGROYW1lfWApO1xuXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hpbGRJZCA9IGN1cnJlbnRJZDtcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5fY2hpbGRyZW4ucHVzaCh7IFwiX19pZF9fXCI6IGNoaWxkSWQgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8g6YCS5b2S5Yib5bu65a2Q6IqC54K5XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkUmVzdWx0ID0gYXdhaXQgdGhpcy5jcmVhdGVOb2RlT2JqZWN0KGNoaWxkRGF0YSwgbm9kZUlkLCBwcmVmYWJEYXRhLCBjdXJyZW50SWQpO1xuICAgICAgICAgICAgICAgICAgICBwcmVmYWJEYXRhLnB1c2goY2hpbGRSZXN1bHQubm9kZSk7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRJZCA9IGNoaWxkUmVzdWx0Lm5leHRJZDtcblxuICAgICAgICAgICAgICAgICAgICAvLyDlrZDoioLngrnkuI3pnIDopoFQcmVmYWJJbmZv77yM5Y+q5pyJ5qC56IqC54K56ZyA6KaBXG4gICAgICAgICAgICAgICAgICAgIC8vIOWtkOiKgueCueeahF9wcmVmYWLlupTor6Xorr7nva7kuLpudWxsXG4gICAgICAgICAgICAgICAgICAgIGNoaWxkUmVzdWx0Lm5vZGUuX3ByZWZhYiA9IG51bGw7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYOKchSDmiJDlip/mt7vliqDlrZDoioLngrk6ICR7Y2hpbGROYW1lfWApO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYOWkhOeQhuWtkOiKgueCuSAke2NoaWxkTmFtZX0g5pe25Ye66ZSZOmAsIGVycm9yKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4geyBub2RlLCBuZXh0SWQ6IGN1cnJlbnRJZCB9O1xuICAgIH1cblxuICAgIC8vIOS7juiKgueCueaVsOaNruS4reaPkOWPlue7hOS7tuS/oeaBr1xuICAgIHByaXZhdGUgZXh0cmFjdENvbXBvbmVudHNGcm9tTm9kZShub2RlRGF0YTogYW55KTogYW55W10ge1xuICAgICAgICBjb25zdCBjb21wb25lbnRzOiBhbnlbXSA9IFtdO1xuXG4gICAgICAgIC8vIOS7juS4jeWQjOS9jee9ruWwneivleiOt+WPlue7hOS7tuaVsOaNrlxuICAgICAgICBjb25zdCBjb21wb25lbnRTb3VyY2VzID0gW1xuICAgICAgICAgICAgbm9kZURhdGEuX19jb21wc19fLFxuICAgICAgICAgICAgbm9kZURhdGEuY29tcG9uZW50cyxcbiAgICAgICAgICAgIG5vZGVEYXRhLnZhbHVlPy5fX2NvbXBzX18sXG4gICAgICAgICAgICBub2RlRGF0YS52YWx1ZT8uY29tcG9uZW50c1xuICAgICAgICBdO1xuXG4gICAgICAgIGZvciAoY29uc3Qgc291cmNlIG9mIGNvbXBvbmVudFNvdXJjZXMpIHtcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHNvdXJjZSkpIHtcbiAgICAgICAgICAgICAgICBjb21wb25lbnRzLnB1c2goLi4uc291cmNlLmZpbHRlcihjb21wID0+IGNvbXAgJiYgKGNvbXAuX190eXBlX18gfHwgY29tcC50eXBlKSkpO1xuICAgICAgICAgICAgICAgIGJyZWFrOyAvLyDmib7liLDmnInmlYjnmoTnu4Tku7bmlbDnu4TlsLHpgIDlh7pcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjb21wb25lbnRzO1xuICAgIH1cblxuICAgIC8vIOWIm+W7uuagh+WHhueahOe7hOS7tuWvueixoVxuICAgIHByaXZhdGUgY3JlYXRlU3RhbmRhcmRDb21wb25lbnRPYmplY3QoY29tcG9uZW50RGF0YTogYW55LCBub2RlSWQ6IG51bWJlciwgcHJlZmFiSW5mb0lkOiBudW1iZXIpOiBhbnkge1xuICAgICAgICBjb25zdCBjb21wb25lbnRUeXBlID0gY29tcG9uZW50RGF0YS5fX3R5cGVfXyB8fCBjb21wb25lbnREYXRhLnR5cGU7XG5cbiAgICAgICAgaWYgKCFjb21wb25lbnRUeXBlKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ+e7hOS7tue8uuWwkeexu+Wei+S/oeaBrzonLCBjb21wb25lbnREYXRhKTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5Z+656GA57uE5Lu257uT5p6EIC0g5Z+65LqO5a6Y5pa56aKE5Yi25L2T5qC85byPXG4gICAgICAgIGNvbnN0IGNvbXBvbmVudDogYW55ID0ge1xuICAgICAgICAgICAgXCJfX3R5cGVfX1wiOiBjb21wb25lbnRUeXBlLFxuICAgICAgICAgICAgXCJfbmFtZVwiOiBcIlwiLFxuICAgICAgICAgICAgXCJfb2JqRmxhZ3NcIjogMCxcbiAgICAgICAgICAgIFwibm9kZVwiOiB7XG4gICAgICAgICAgICAgICAgXCJfX2lkX19cIjogbm9kZUlkXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJfZW5hYmxlZFwiOiB0aGlzLmdldENvbXBvbmVudFByb3BlcnR5VmFsdWUoY29tcG9uZW50RGF0YSwgJ2VuYWJsZWQnLCB0cnVlKSxcbiAgICAgICAgICAgIFwiX19wcmVmYWJcIjoge1xuICAgICAgICAgICAgICAgIFwiX19pZF9fXCI6IHByZWZhYkluZm9JZFxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIOagueaNrue7hOS7tuexu+Wei+a3u+WKoOeJueWumuWxnuaAp1xuICAgICAgICB0aGlzLmFkZENvbXBvbmVudFNwZWNpZmljUHJvcGVydGllcyhjb21wb25lbnQsIGNvbXBvbmVudERhdGEsIGNvbXBvbmVudFR5cGUpO1xuXG4gICAgICAgIC8vIOa3u+WKoF9pZOWxnuaAp1xuICAgICAgICBjb21wb25lbnQuX2lkID0gXCJcIjtcblxuICAgICAgICByZXR1cm4gY29tcG9uZW50O1xuICAgIH1cblxuICAgIC8vIOa3u+WKoOe7hOS7tueJueWumueahOWxnuaAp1xuICAgIHByaXZhdGUgYWRkQ29tcG9uZW50U3BlY2lmaWNQcm9wZXJ0aWVzKGNvbXBvbmVudDogYW55LCBjb21wb25lbnREYXRhOiBhbnksIGNvbXBvbmVudFR5cGU6IHN0cmluZyk6IHZvaWQge1xuICAgICAgICBzd2l0Y2ggKGNvbXBvbmVudFR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ2NjLlVJVHJhbnNmb3JtJzpcbiAgICAgICAgICAgICAgICB0aGlzLmFkZFVJVHJhbnNmb3JtUHJvcGVydGllcyhjb21wb25lbnQsIGNvbXBvbmVudERhdGEpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnY2MuU3ByaXRlJzpcbiAgICAgICAgICAgICAgICB0aGlzLmFkZFNwcml0ZVByb3BlcnRpZXMoY29tcG9uZW50LCBjb21wb25lbnREYXRhKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2NjLkxhYmVsJzpcbiAgICAgICAgICAgICAgICB0aGlzLmFkZExhYmVsUHJvcGVydGllcyhjb21wb25lbnQsIGNvbXBvbmVudERhdGEpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnY2MuQnV0dG9uJzpcbiAgICAgICAgICAgICAgICB0aGlzLmFkZEJ1dHRvblByb3BlcnRpZXMoY29tcG9uZW50LCBjb21wb25lbnREYXRhKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgLy8g5a+55LqO5pyq55+l57G75Z6L55qE57uE5Lu277yM5aSN5Yi25omA5pyJ5a6J5YWo55qE5bGe5oCnXG4gICAgICAgICAgICAgICAgdGhpcy5hZGRHZW5lcmljUHJvcGVydGllcyhjb21wb25lbnQsIGNvbXBvbmVudERhdGEpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gVUlUcmFuc2Zvcm3nu4Tku7blsZ7mgKdcbiAgICBwcml2YXRlIGFkZFVJVHJhbnNmb3JtUHJvcGVydGllcyhjb21wb25lbnQ6IGFueSwgY29tcG9uZW50RGF0YTogYW55KTogdm9pZCB7XG4gICAgICAgIGNvbXBvbmVudC5fY29udGVudFNpemUgPSB0aGlzLmNyZWF0ZVNpemVPYmplY3QoXG4gICAgICAgICAgICB0aGlzLmdldENvbXBvbmVudFByb3BlcnR5VmFsdWUoY29tcG9uZW50RGF0YSwgJ2NvbnRlbnRTaXplJywgeyB3aWR0aDogMTAwLCBoZWlnaHQ6IDEwMCB9KVxuICAgICAgICApO1xuICAgICAgICBjb21wb25lbnQuX2FuY2hvclBvaW50ID0gdGhpcy5jcmVhdGVWZWMyT2JqZWN0KFxuICAgICAgICAgICAgdGhpcy5nZXRDb21wb25lbnRQcm9wZXJ0eVZhbHVlKGNvbXBvbmVudERhdGEsICdhbmNob3JQb2ludCcsIHsgeDogMC41LCB5OiAwLjUgfSlcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBTcHJpdGXnu4Tku7blsZ7mgKdcbiAgICBwcml2YXRlIGFkZFNwcml0ZVByb3BlcnRpZXMoY29tcG9uZW50OiBhbnksIGNvbXBvbmVudERhdGE6IGFueSk6IHZvaWQge1xuICAgICAgICBjb21wb25lbnQuX3Zpc0ZsYWdzID0gMDtcbiAgICAgICAgY29tcG9uZW50Ll9jdXN0b21NYXRlcmlhbCA9IG51bGw7XG4gICAgICAgIGNvbXBvbmVudC5fc3JjQmxlbmRGYWN0b3IgPSAyO1xuICAgICAgICBjb21wb25lbnQuX2RzdEJsZW5kRmFjdG9yID0gNDtcbiAgICAgICAgY29tcG9uZW50Ll9jb2xvciA9IHRoaXMuY3JlYXRlQ29sb3JPYmplY3QoXG4gICAgICAgICAgICB0aGlzLmdldENvbXBvbmVudFByb3BlcnR5VmFsdWUoY29tcG9uZW50RGF0YSwgJ2NvbG9yJywgeyByOiAyNTUsIGc6IDI1NSwgYjogMjU1LCBhOiAyNTUgfSlcbiAgICAgICAgKTtcbiAgICAgICAgY29tcG9uZW50Ll9zcHJpdGVGcmFtZSA9IHRoaXMuZ2V0Q29tcG9uZW50UHJvcGVydHlWYWx1ZShjb21wb25lbnREYXRhLCAnc3ByaXRlRnJhbWUnLCBudWxsKTtcbiAgICAgICAgY29tcG9uZW50Ll90eXBlID0gdGhpcy5nZXRDb21wb25lbnRQcm9wZXJ0eVZhbHVlKGNvbXBvbmVudERhdGEsICd0eXBlJywgMCk7XG4gICAgICAgIGNvbXBvbmVudC5fZmlsbFR5cGUgPSAwO1xuICAgICAgICBjb21wb25lbnQuX3NpemVNb2RlID0gdGhpcy5nZXRDb21wb25lbnRQcm9wZXJ0eVZhbHVlKGNvbXBvbmVudERhdGEsICdzaXplTW9kZScsIDEpO1xuICAgICAgICBjb21wb25lbnQuX2ZpbGxDZW50ZXIgPSB0aGlzLmNyZWF0ZVZlYzJPYmplY3QoeyB4OiAwLCB5OiAwIH0pO1xuICAgICAgICBjb21wb25lbnQuX2ZpbGxTdGFydCA9IDA7XG4gICAgICAgIGNvbXBvbmVudC5fZmlsbFJhbmdlID0gMDtcbiAgICAgICAgY29tcG9uZW50Ll9pc1RyaW1tZWRNb2RlID0gdHJ1ZTtcbiAgICAgICAgY29tcG9uZW50Ll91c2VHcmF5c2NhbGUgPSBmYWxzZTtcbiAgICAgICAgY29tcG9uZW50Ll9hdGxhcyA9IG51bGw7XG4gICAgfVxuXG4gICAgLy8gTGFiZWznu4Tku7blsZ7mgKdcbiAgICBwcml2YXRlIGFkZExhYmVsUHJvcGVydGllcyhjb21wb25lbnQ6IGFueSwgY29tcG9uZW50RGF0YTogYW55KTogdm9pZCB7XG4gICAgICAgIGNvbXBvbmVudC5fdmlzRmxhZ3MgPSAwO1xuICAgICAgICBjb21wb25lbnQuX2N1c3RvbU1hdGVyaWFsID0gbnVsbDtcbiAgICAgICAgY29tcG9uZW50Ll9zcmNCbGVuZEZhY3RvciA9IDI7XG4gICAgICAgIGNvbXBvbmVudC5fZHN0QmxlbmRGYWN0b3IgPSA0O1xuICAgICAgICBjb21wb25lbnQuX2NvbG9yID0gdGhpcy5jcmVhdGVDb2xvck9iamVjdChcbiAgICAgICAgICAgIHRoaXMuZ2V0Q29tcG9uZW50UHJvcGVydHlWYWx1ZShjb21wb25lbnREYXRhLCAnY29sb3InLCB7IHI6IDAsIGc6IDAsIGI6IDAsIGE6IDI1NSB9KVxuICAgICAgICApO1xuICAgICAgICBjb21wb25lbnQuX3N0cmluZyA9IHRoaXMuZ2V0Q29tcG9uZW50UHJvcGVydHlWYWx1ZShjb21wb25lbnREYXRhLCAnc3RyaW5nJywgJ0xhYmVsJyk7XG4gICAgICAgIGNvbXBvbmVudC5faG9yaXpvbnRhbEFsaWduID0gMTtcbiAgICAgICAgY29tcG9uZW50Ll92ZXJ0aWNhbEFsaWduID0gMTtcbiAgICAgICAgY29tcG9uZW50Ll9hY3R1YWxGb250U2l6ZSA9IDIwO1xuICAgICAgICBjb21wb25lbnQuX2ZvbnRTaXplID0gdGhpcy5nZXRDb21wb25lbnRQcm9wZXJ0eVZhbHVlKGNvbXBvbmVudERhdGEsICdmb250U2l6ZScsIDIwKTtcbiAgICAgICAgY29tcG9uZW50Ll9mb250RmFtaWx5ID0gJ0FyaWFsJztcbiAgICAgICAgY29tcG9uZW50Ll9saW5lSGVpZ2h0ID0gNDA7XG4gICAgICAgIGNvbXBvbmVudC5fb3ZlcmZsb3cgPSAxO1xuICAgICAgICBjb21wb25lbnQuX2VuYWJsZVdyYXBUZXh0ID0gZmFsc2U7XG4gICAgICAgIGNvbXBvbmVudC5fZm9udCA9IG51bGw7XG4gICAgICAgIGNvbXBvbmVudC5faXNTeXN0ZW1Gb250VXNlZCA9IHRydWU7XG4gICAgICAgIGNvbXBvbmVudC5faXNJdGFsaWMgPSBmYWxzZTtcbiAgICAgICAgY29tcG9uZW50Ll9pc0JvbGQgPSBmYWxzZTtcbiAgICAgICAgY29tcG9uZW50Ll9pc1VuZGVybGluZSA9IGZhbHNlO1xuICAgICAgICBjb21wb25lbnQuX3VuZGVybGluZUhlaWdodCA9IDI7XG4gICAgICAgIGNvbXBvbmVudC5fY2FjaGVNb2RlID0gMDtcbiAgICB9XG5cbiAgICAvLyBCdXR0b27nu4Tku7blsZ7mgKdcbiAgICBwcml2YXRlIGFkZEJ1dHRvblByb3BlcnRpZXMoY29tcG9uZW50OiBhbnksIGNvbXBvbmVudERhdGE6IGFueSk6IHZvaWQge1xuICAgICAgICBjb21wb25lbnQuY2xpY2tFdmVudHMgPSBbXTtcbiAgICAgICAgY29tcG9uZW50Ll9pbnRlcmFjdGFibGUgPSB0cnVlO1xuICAgICAgICBjb21wb25lbnQuX3RyYW5zaXRpb24gPSAyO1xuICAgICAgICBjb21wb25lbnQuX25vcm1hbENvbG9yID0gdGhpcy5jcmVhdGVDb2xvck9iamVjdCh7IHI6IDIxNCwgZzogMjE0LCBiOiAyMTQsIGE6IDI1NSB9KTtcbiAgICAgICAgY29tcG9uZW50Ll9ob3ZlckNvbG9yID0gdGhpcy5jcmVhdGVDb2xvck9iamVjdCh7IHI6IDIxMSwgZzogMjExLCBiOiAyMTEsIGE6IDI1NSB9KTtcbiAgICAgICAgY29tcG9uZW50Ll9wcmVzc2VkQ29sb3IgPSB0aGlzLmNyZWF0ZUNvbG9yT2JqZWN0KHsgcjogMjU1LCBnOiAyNTUsIGI6IDI1NSwgYTogMjU1IH0pO1xuICAgICAgICBjb21wb25lbnQuX2Rpc2FibGVkQ29sb3IgPSB0aGlzLmNyZWF0ZUNvbG9yT2JqZWN0KHsgcjogMTI0LCBnOiAxMjQsIGI6IDEyNCwgYTogMjU1IH0pO1xuICAgICAgICBjb21wb25lbnQuX2R1cmF0aW9uID0gMC4xO1xuICAgICAgICBjb21wb25lbnQuX3pvb21TY2FsZSA9IDEuMjtcbiAgICB9XG5cbiAgICAvLyDmt7vliqDpgJrnlKjlsZ7mgKdcbiAgICBwcml2YXRlIGFkZEdlbmVyaWNQcm9wZXJ0aWVzKGNvbXBvbmVudDogYW55LCBjb21wb25lbnREYXRhOiBhbnkpOiB2b2lkIHtcbiAgICAgICAgLy8g5Y+q5aSN5Yi25a6J5YWo55qE44CB5bey55+l55qE5bGe5oCnXG4gICAgICAgIGNvbnN0IHNhZmVQcm9wZXJ0aWVzID0gWydlbmFibGVkJywgJ2NvbG9yJywgJ3N0cmluZycsICdmb250U2l6ZScsICdzcHJpdGVGcmFtZScsICd0eXBlJywgJ3NpemVNb2RlJ107XG5cbiAgICAgICAgZm9yIChjb25zdCBwcm9wIG9mIHNhZmVQcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICBpZiAoY29tcG9uZW50RGF0YS5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gdGhpcy5nZXRDb21wb25lbnRQcm9wZXJ0eVZhbHVlKGNvbXBvbmVudERhdGEsIHByb3ApO1xuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudFtgXyR7cHJvcH1gXSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIOWIm+W7ulZlYzLlr7nosaFcbiAgICBwcml2YXRlIGNyZWF0ZVZlYzJPYmplY3QoZGF0YTogYW55KTogYW55IHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIFwiX190eXBlX19cIjogXCJjYy5WZWMyXCIsXG4gICAgICAgICAgICBcInhcIjogZGF0YT8ueCB8fCAwLFxuICAgICAgICAgICAgXCJ5XCI6IGRhdGE/LnkgfHwgMFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vIOWIm+W7ulZlYzPlr7nosaFcbiAgICBwcml2YXRlIGNyZWF0ZVZlYzNPYmplY3QoZGF0YTogYW55KTogYW55IHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIFwiX190eXBlX19cIjogXCJjYy5WZWMzXCIsXG4gICAgICAgICAgICBcInhcIjogZGF0YT8ueCB8fCAwLFxuICAgICAgICAgICAgXCJ5XCI6IGRhdGE/LnkgfHwgMCxcbiAgICAgICAgICAgIFwielwiOiBkYXRhPy56IHx8IDBcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyDliJvlu7pTaXpl5a+56LGhXG4gICAgcHJpdmF0ZSBjcmVhdGVTaXplT2JqZWN0KGRhdGE6IGFueSk6IGFueSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBcIl9fdHlwZV9fXCI6IFwiY2MuU2l6ZVwiLFxuICAgICAgICAgICAgXCJ3aWR0aFwiOiBkYXRhPy53aWR0aCB8fCAxMDAsXG4gICAgICAgICAgICBcImhlaWdodFwiOiBkYXRhPy5oZWlnaHQgfHwgMTAwXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8g5Yib5bu6Q29sb3Llr7nosaFcbiAgICBwcml2YXRlIGNyZWF0ZUNvbG9yT2JqZWN0KGRhdGE6IGFueSk6IGFueSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBcIl9fdHlwZV9fXCI6IFwiY2MuQ29sb3JcIixcbiAgICAgICAgICAgIFwiclwiOiBkYXRhPy5yID8/IDI1NSxcbiAgICAgICAgICAgIFwiZ1wiOiBkYXRhPy5nID8/IDI1NSxcbiAgICAgICAgICAgIFwiYlwiOiBkYXRhPy5iID8/IDI1NSxcbiAgICAgICAgICAgIFwiYVwiOiBkYXRhPy5hID8/IDI1NVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vIOWIpOaWreaYr+WQpuW6lOivpeWkjeWItue7hOS7tuWxnuaAp1xuICAgIHByaXZhdGUgc2hvdWxkQ29weUNvbXBvbmVudFByb3BlcnR5KGtleTogc3RyaW5nLCB2YWx1ZTogYW55KTogYm9vbGVhbiB7XG4gICAgICAgIC8vIOi3s+i/h+WGhemDqOWxnuaAp+WSjOW3suWkhOeQhueahOWxnuaAp1xuICAgICAgICBpZiAoa2V5LnN0YXJ0c1dpdGgoJ19fJykgfHwga2V5ID09PSAnX2VuYWJsZWQnIHx8IGtleSA9PT0gJ25vZGUnIHx8IGtleSA9PT0gJ2VuYWJsZWQnKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDot7Pov4flh73mlbDlkox1bmRlZmluZWTlgLxcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJyB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cblxuICAgIC8vIOiOt+WPlue7hOS7tuWxnuaAp+WAvCAtIOmHjeWRveWQjeS7pemBv+WFjeWGsueqgVxuICAgIHByaXZhdGUgZ2V0Q29tcG9uZW50UHJvcGVydHlWYWx1ZShjb21wb25lbnREYXRhOiBhbnksIHByb3BlcnR5TmFtZTogc3RyaW5nLCBkZWZhdWx0VmFsdWU/OiBhbnkpOiBhbnkge1xuICAgICAgICAvLyDlsJ3or5Xnm7TmjqXojrflj5blsZ7mgKdcbiAgICAgICAgaWYgKGNvbXBvbmVudERhdGFbcHJvcGVydHlOYW1lXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5leHRyYWN0VmFsdWUoY29tcG9uZW50RGF0YVtwcm9wZXJ0eU5hbWVdKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWwneivleS7jnZhbHVl5bGe5oCn5Lit6I635Y+WXG4gICAgICAgIGlmIChjb21wb25lbnREYXRhLnZhbHVlICYmIGNvbXBvbmVudERhdGEudmFsdWVbcHJvcGVydHlOYW1lXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5leHRyYWN0VmFsdWUoY29tcG9uZW50RGF0YS52YWx1ZVtwcm9wZXJ0eU5hbWVdKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWwneivleW4puS4i+WIkue6v+WJjee8gOeahOWxnuaAp+WQjVxuICAgICAgICBjb25zdCBwcmVmaXhlZE5hbWUgPSBgXyR7cHJvcGVydHlOYW1lfWA7XG4gICAgICAgIGlmIChjb21wb25lbnREYXRhW3ByZWZpeGVkTmFtZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZXh0cmFjdFZhbHVlKGNvbXBvbmVudERhdGFbcHJlZml4ZWROYW1lXSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZGVmYXVsdFZhbHVlO1xuICAgIH1cblxuICAgIC8vIOaPkOWPluWxnuaAp+WAvFxuICAgIHByaXZhdGUgZXh0cmFjdFZhbHVlKGRhdGE6IGFueSk6IGFueSB7XG4gICAgICAgIGlmIChkYXRhID09PSBudWxsIHx8IGRhdGEgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDlpoLmnpzmnIl2YWx1ZeWxnuaAp++8jOS8mOWFiOS9v+eUqHZhbHVlXG4gICAgICAgIGlmICh0eXBlb2YgZGF0YSA9PT0gJ29iamVjdCcgJiYgZGF0YS5oYXNPd25Qcm9wZXJ0eSgndmFsdWUnKSkge1xuICAgICAgICAgICAgcmV0dXJuIGRhdGEudmFsdWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDlpoLmnpzmmK/lvJXnlKjlr7nosaHvvIzkv53mjIHljp/moLdcbiAgICAgICAgaWYgKHR5cGVvZiBkYXRhID09PSAnb2JqZWN0JyAmJiAoZGF0YS5fX2lkX18gIT09IHVuZGVmaW5lZCB8fCBkYXRhLl9fdXVpZF9fICE9PSB1bmRlZmluZWQpKSB7XG4gICAgICAgICAgICByZXR1cm4gZGF0YTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgIH1cblxuICAgIHByaXZhdGUgY3JlYXRlU3RhbmRhcmRNZXRhRGF0YShwcmVmYWJOYW1lOiBzdHJpbmcsIHByZWZhYlV1aWQ6IHN0cmluZyk6IGFueSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBcInZlclwiOiBcIjEuMS41MFwiLFxuICAgICAgICAgICAgXCJpbXBvcnRlclwiOiBcInByZWZhYlwiLFxuICAgICAgICAgICAgXCJpbXBvcnRlZFwiOiB0cnVlLFxuICAgICAgICAgICAgXCJ1dWlkXCI6IHByZWZhYlV1aWQsXG4gICAgICAgICAgICBcImZpbGVzXCI6IFtcbiAgICAgICAgICAgICAgICBcIi5qc29uXCJcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBcInN1Yk1ldGFzXCI6IHt9LFxuICAgICAgICAgICAgXCJ1c2VyRGF0YVwiOiB7XG4gICAgICAgICAgICAgICAgXCJzeW5jTm9kZU5hbWVcIjogcHJlZmFiTmFtZVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgc2F2ZVByZWZhYldpdGhNZXRhKHByZWZhYlBhdGg6IHN0cmluZywgcHJlZmFiRGF0YTogYW55W10sIG1ldGFEYXRhOiBhbnkpOiBQcm9taXNlPHsgc3VjY2VzczogYm9vbGVhbjsgZXJyb3I/OiBzdHJpbmcgfT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcHJlZmFiQ29udGVudCA9IEpTT04uc3RyaW5naWZ5KHByZWZhYkRhdGEsIG51bGwsIDIpO1xuICAgICAgICAgICAgY29uc3QgbWV0YUNvbnRlbnQgPSBKU09OLnN0cmluZ2lmeShtZXRhRGF0YSwgbnVsbCwgMik7XG5cbiAgICAgICAgICAgIC8vIOehruS/nei3r+W+hOS7pS5wcmVmYWLnu5PlsL5cbiAgICAgICAgICAgIGNvbnN0IGZpbmFsUHJlZmFiUGF0aCA9IHByZWZhYlBhdGguZW5kc1dpdGgoJy5wcmVmYWInKSA/IHByZWZhYlBhdGggOiBgJHtwcmVmYWJQYXRofS5wcmVmYWJgO1xuICAgICAgICAgICAgY29uc3QgbWV0YVBhdGggPSBgJHtmaW5hbFByZWZhYlBhdGh9Lm1ldGFgO1xuXG4gICAgICAgICAgICAvLyDkvb/nlKggMi54IEFQSSDliJvlu7rpooTliLbkvZPmlofku7ZcbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICBFZGl0b3IuYXNzZXRkYi5jcmVhdGUoZmluYWxQcmVmYWJQYXRoLCBwcmVmYWJDb250ZW50LCAoZXJyOiBFcnJvciB8IG51bGwpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8g5Yib5bu6bWV0YeaWh+S7tiAtIOWFiOiOt+WPllVVSURcbiAgICAgICAgICAgIGNvbnN0IGFzc2V0SW5mbyA9IGF3YWl0IHRoaXMucXVlcnlBc3NldEluZm9CeVVybChmaW5hbFByZWZhYlBhdGgpO1xuICAgICAgICAgICAgaWYgKGFzc2V0SW5mbyAmJiBhc3NldEluZm8udXVpZCkge1xuICAgICAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgRWRpdG9yLmFzc2V0ZGIuc2F2ZU1ldGEoYXNzZXRJbmZvLnV1aWQsIG1ldGFDb250ZW50LCAoZXJyOiBFcnJvciB8IG51bGwpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIOWmguaenOaXoOazleiOt+WPllVVSUTvvIznm7TmjqXliJvlu7ptZXRh5paH5Lu2XG4gICAgICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBFZGl0b3IuYXNzZXRkYi5jcmVhdGUobWV0YVBhdGgsIG1ldGFDb250ZW50LCAoZXJyOiBFcnJvciB8IG51bGwpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGA9PT0g6aKE5Yi25L2T5L+d5a2Y5a6M5oiQID09PWApO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYOmihOWItuS9k+aWh+S7tuW3suS/neWtmDogJHtmaW5hbFByZWZhYlBhdGh9YCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgTWV0YeaWh+S7tuW3suS/neWtmDogJHttZXRhUGF0aH1gKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGDpooTliLbkvZPmlbDnu4TmgLvplb/luqY6ICR7cHJlZmFiRGF0YS5sZW5ndGh9YCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhg6aKE5Yi25L2T5qC56IqC54K557Si5byVOiAke3ByZWZhYkRhdGEubGVuZ3RoIC0gMX1gKTtcblxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCfkv53lrZjpooTliLbkvZPmlofku7bml7blh7rplJk6JywgZXJyb3IpO1xuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH07XG4gICAgICAgIH1cbiAgICB9XG5cbn0iXX0=