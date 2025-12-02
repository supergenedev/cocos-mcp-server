"use strict";
/// <reference path="../types/editor-2x.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneAdvancedTools = void 0;
class SceneAdvancedTools {
    getTools() {
        return [
            {
                name: 'reset_node_property',
                description: 'Reset node property to default value',
                inputSchema: {
                    type: 'object',
                    properties: {
                        uuid: {
                            type: 'string',
                            description: 'Node UUID'
                        },
                        path: {
                            type: 'string',
                            description: 'Property path (e.g., position, rotation, scale)'
                        }
                    },
                    required: ['uuid', 'path']
                }
            },
            {
                name: 'move_array_element',
                description: 'Move array element position',
                inputSchema: {
                    type: 'object',
                    properties: {
                        uuid: {
                            type: 'string',
                            description: 'Node UUID'
                        },
                        path: {
                            type: 'string',
                            description: 'Array property path (e.g., __comps__)'
                        },
                        target: {
                            type: 'number',
                            description: 'Target item original index'
                        },
                        offset: {
                            type: 'number',
                            description: 'Offset amount (positive or negative)'
                        }
                    },
                    required: ['uuid', 'path', 'target', 'offset']
                }
            },
            {
                name: 'remove_array_element',
                description: 'Remove array element at specific index',
                inputSchema: {
                    type: 'object',
                    properties: {
                        uuid: {
                            type: 'string',
                            description: 'Node UUID'
                        },
                        path: {
                            type: 'string',
                            description: 'Array property path'
                        },
                        index: {
                            type: 'number',
                            description: 'Target item index to remove'
                        }
                    },
                    required: ['uuid', 'path', 'index']
                }
            },
            {
                name: 'copy_node',
                description: 'Copy node for later paste operation',
                inputSchema: {
                    type: 'object',
                    properties: {
                        uuids: {
                            oneOf: [
                                { type: 'string' },
                                { type: 'array', items: { type: 'string' } }
                            ],
                            description: 'Node UUID or array of UUIDs to copy'
                        }
                    },
                    required: ['uuids']
                }
            },
            {
                name: 'paste_node',
                description: 'Paste previously copied nodes',
                inputSchema: {
                    type: 'object',
                    properties: {
                        target: {
                            type: 'string',
                            description: 'Target parent node UUID'
                        },
                        uuids: {
                            oneOf: [
                                { type: 'string' },
                                { type: 'array', items: { type: 'string' } }
                            ],
                            description: 'Node UUIDs to paste'
                        },
                        keepWorldTransform: {
                            type: 'boolean',
                            description: 'Keep world transform coordinates',
                            default: false
                        }
                    },
                    required: ['target', 'uuids']
                }
            },
            {
                name: 'cut_node',
                description: 'Cut node (copy + mark for move)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        uuids: {
                            oneOf: [
                                { type: 'string' },
                                { type: 'array', items: { type: 'string' } }
                            ],
                            description: 'Node UUID or array of UUIDs to cut'
                        }
                    },
                    required: ['uuids']
                }
            },
            {
                name: 'reset_node_transform',
                description: 'Reset node position, rotation and scale',
                inputSchema: {
                    type: 'object',
                    properties: {
                        uuid: {
                            type: 'string',
                            description: 'Node UUID'
                        }
                    },
                    required: ['uuid']
                }
            },
            {
                name: 'reset_component',
                description: 'Reset component to default values',
                inputSchema: {
                    type: 'object',
                    properties: {
                        uuid: {
                            type: 'string',
                            description: 'Component UUID'
                        }
                    },
                    required: ['uuid']
                }
            },
            {
                name: 'restore_prefab',
                description: 'Restore prefab instance from asset',
                inputSchema: {
                    type: 'object',
                    properties: {
                        nodeUuid: {
                            type: 'string',
                            description: 'Node UUID'
                        },
                        assetUuid: {
                            type: 'string',
                            description: 'Prefab asset UUID'
                        }
                    },
                    required: ['nodeUuid', 'assetUuid']
                }
            },
            {
                name: 'execute_component_method',
                description: 'Execute method on component',
                inputSchema: {
                    type: 'object',
                    properties: {
                        uuid: {
                            type: 'string',
                            description: 'Component UUID'
                        },
                        name: {
                            type: 'string',
                            description: 'Method name'
                        },
                        args: {
                            type: 'array',
                            description: 'Method arguments',
                            default: []
                        }
                    },
                    required: ['uuid', 'name']
                }
            },
            {
                name: 'execute_scene_script',
                description: 'Execute scene script method',
                inputSchema: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            description: 'Plugin name'
                        },
                        method: {
                            type: 'string',
                            description: 'Method name'
                        },
                        args: {
                            type: 'array',
                            description: 'Method arguments',
                            default: []
                        }
                    },
                    required: ['name', 'method']
                }
            },
            {
                name: 'scene_snapshot',
                description: 'Create scene state snapshot',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'scene_snapshot_abort',
                description: 'Abort scene snapshot creation',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'begin_undo_recording',
                description: 'Begin recording undo data',
                inputSchema: {
                    type: 'object',
                    properties: {
                        nodeUuid: {
                            type: 'string',
                            description: 'Node UUID to record'
                        }
                    },
                    required: ['nodeUuid']
                }
            },
            {
                name: 'end_undo_recording',
                description: 'End recording undo data',
                inputSchema: {
                    type: 'object',
                    properties: {
                        undoId: {
                            type: 'string',
                            description: 'Undo recording ID from begin_undo_recording'
                        }
                    },
                    required: ['undoId']
                }
            },
            {
                name: 'cancel_undo_recording',
                description: 'Cancel undo recording',
                inputSchema: {
                    type: 'object',
                    properties: {
                        undoId: {
                            type: 'string',
                            description: 'Undo recording ID to cancel'
                        }
                    },
                    required: ['undoId']
                }
            },
            {
                name: 'soft_reload_scene',
                description: 'Soft reload current scene',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'query_scene_ready',
                description: 'Check if scene is ready',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'query_scene_dirty',
                description: 'Check if scene has unsaved changes',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'query_scene_classes',
                description: 'Query all registered classes',
                inputSchema: {
                    type: 'object',
                    properties: {
                        extends: {
                            type: 'string',
                            description: 'Filter classes that extend this base class'
                        }
                    }
                }
            },
            {
                name: 'query_scene_components',
                description: 'Query available scene components',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'query_component_has_script',
                description: 'Check if component has script',
                inputSchema: {
                    type: 'object',
                    properties: {
                        className: {
                            type: 'string',
                            description: 'Script class name to check'
                        }
                    },
                    required: ['className']
                }
            },
            {
                name: 'query_nodes_by_asset_uuid',
                description: 'Find nodes that use specific asset UUID',
                inputSchema: {
                    type: 'object',
                    properties: {
                        assetUuid: {
                            type: 'string',
                            description: 'Asset UUID to search for'
                        }
                    },
                    required: ['assetUuid']
                }
            }
        ];
    }
    async execute(toolName, args) {
        switch (toolName) {
            case 'reset_node_property':
                return await this.resetNodeProperty(args.uuid, args.path);
            case 'move_array_element':
                return await this.moveArrayElement(args.uuid, args.path, args.target, args.offset);
            case 'remove_array_element':
                return await this.removeArrayElement(args.uuid, args.path, args.index);
            case 'copy_node':
                return await this.copyNode(args.uuids);
            case 'paste_node':
                return await this.pasteNode(args.target, args.uuids, args.keepWorldTransform);
            case 'cut_node':
                return await this.cutNode(args.uuids);
            case 'reset_node_transform':
                return await this.resetNodeTransform(args.uuid);
            case 'reset_component':
                return await this.resetComponent(args.uuid);
            case 'restore_prefab':
                return await this.restorePrefab(args.nodeUuid, args.assetUuid);
            case 'execute_component_method':
                return await this.executeComponentMethod(args.uuid, args.name, args.args);
            case 'execute_scene_script':
                return await this.executeSceneScript(args.name, args.method, args.args);
            case 'scene_snapshot':
                return await this.sceneSnapshot();
            case 'scene_snapshot_abort':
                return await this.sceneSnapshotAbort();
            case 'begin_undo_recording':
                return await this.beginUndoRecording(args.nodeUuid);
            case 'end_undo_recording':
                return await this.endUndoRecording(args.undoId);
            case 'cancel_undo_recording':
                return await this.cancelUndoRecording(args.undoId);
            case 'soft_reload_scene':
                return await this.softReloadScene();
            case 'query_scene_ready':
                return await this.querySceneReady();
            case 'query_scene_dirty':
                return await this.querySceneDirty();
            case 'query_scene_classes':
                return await this.querySceneClasses(args.extends);
            case 'query_scene_components':
                return await this.querySceneComponents();
            case 'query_component_has_script':
                return await this.queryComponentHasScript(args.className);
            case 'query_nodes_by_asset_uuid':
                return await this.queryNodesByAssetUuid(args.assetUuid);
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    }
    async resetNodeProperty(uuid, path) {
        // Note: reset-property is not supported in Cocos Creator 2.x
        // Use scene:set-property to manually set default values instead
        return Promise.resolve({
            success: false,
            error: 'reset-property is not supported in Cocos Creator 2.x. Please use set_node_property to set default values manually.'
        });
    }
    async moveArrayElement(uuid, path, target, offset) {
        // Note: move-array-element is not supported in Cocos Creator 2.x
        return Promise.resolve({
            success: false,
            error: 'move-array-element is not supported in Cocos Creator 2.x'
        });
    }
    async removeArrayElement(uuid, path, index) {
        // Note: remove-array-element is not supported in Cocos Creator 2.x
        return Promise.resolve({
            success: false,
            error: 'remove-array-element is not supported in Cocos Creator 2.x'
        });
    }
    async copyNode(uuids) {
        // Note: copy-node is not supported in Cocos Creator 2.x
        return Promise.resolve({
            success: false,
            error: 'copy-node is not supported in Cocos Creator 2.x'
        });
    }
    async pasteNode(target, uuids, keepWorldTransform = false) {
        // Note: paste-node is not supported in Cocos Creator 2.x
        return Promise.resolve({
            success: false,
            error: 'paste-node is not supported in Cocos Creator 2.x'
        });
    }
    async cutNode(uuids) {
        // Note: cut-node is not supported in Cocos Creator 2.x
        return Promise.resolve({
            success: false,
            error: 'cut-node is not supported in Cocos Creator 2.x'
        });
    }
    async resetNodeTransform(uuid) {
        // Note: reset-node is not supported in Cocos Creator 2.x
        return Promise.resolve({
            success: false,
            error: 'reset-node is not supported in Cocos Creator 2.x. Please use set_node_property to reset position/rotation/scale manually.'
        });
    }
    async resetComponent(uuid) {
        // Note: reset-component is not supported in Cocos Creator 2.x
        return Promise.resolve({
            success: false,
            error: 'reset-component is not supported in Cocos Creator 2.x'
        });
    }
    async restorePrefab(nodeUuid, assetUuid) {
        return new Promise((resolve) => {
            try {
                // In 2.x, restore-prefab is not directly supported
                // Use break-prefab-instance + apply-prefab combination instead
                // First, break the prefab instance
                Editor.Ipc.sendToPanel('scene', 'scene:break-prefab-instance', nodeUuid);
                // Then apply the prefab from asset
                Editor.Ipc.sendToPanel('scene', 'scene:apply-prefab', nodeUuid);
                resolve({
                    success: true,
                    message: 'Prefab restored successfully (using break + apply)'
                });
            }
            catch (err) {
                resolve({ success: false, error: err.message });
            }
        });
    }
    async executeComponentMethod(uuid, name, args = []) {
        return new Promise((resolve) => {
            try {
                // In 2.x, use Editor.Scene.callSceneScript to execute component methods
                const result = Editor.Scene.callSceneScript('cocos-mcp-server', 'executeComponentMethod', uuid, name, args);
                resolve({
                    success: true,
                    data: {
                        result: result,
                        message: `Method '${name}' executed successfully`
                    }
                });
            }
            catch (err) {
                resolve({ success: false, error: err.message });
            }
        });
    }
    async executeSceneScript(name, method, args = []) {
        return new Promise((resolve) => {
            try {
                // In 2.x, use Editor.Scene.callSceneScript directly
                const result = Editor.Scene.callSceneScript(name, method, ...args);
                resolve({
                    success: true,
                    data: result
                });
            }
            catch (err) {
                resolve({ success: false, error: err.message });
            }
        });
    }
    async sceneSnapshot() {
        // Note: snapshot is not supported in Cocos Creator 2.x
        return Promise.resolve({
            success: false,
            error: 'scene snapshot is not supported in Cocos Creator 2.x'
        });
    }
    async sceneSnapshotAbort() {
        // Note: snapshot-abort is not supported in Cocos Creator 2.x
        return Promise.resolve({
            success: false,
            error: 'scene snapshot-abort is not supported in Cocos Creator 2.x'
        });
    }
    async beginUndoRecording(nodeUuid) {
        // Note: begin-recording is not supported in Cocos Creator 2.x
        return Promise.resolve({
            success: false,
            error: 'undo recording is not supported in Cocos Creator 2.x'
        });
    }
    async endUndoRecording(undoId) {
        // Note: end-recording is not supported in Cocos Creator 2.x
        return Promise.resolve({
            success: false,
            error: 'undo recording is not supported in Cocos Creator 2.x'
        });
    }
    async cancelUndoRecording(undoId) {
        // Note: cancel-recording is not supported in Cocos Creator 2.x
        return Promise.resolve({
            success: false,
            error: 'undo recording is not supported in Cocos Creator 2.x'
        });
    }
    async softReloadScene() {
        // Note: soft-reload is not supported in Cocos Creator 2.x
        return Promise.resolve({
            success: false,
            error: 'soft-reload is not supported in Cocos Creator 2.x'
        });
    }
    async querySceneReady() {
        return new Promise((resolve) => {
            var _a, _b;
            try {
                const result = Editor.Scene.callSceneScript('cocos-mcp-server', 'querySceneReady');
                if (result && result.success) {
                    resolve({
                        success: true,
                        data: {
                            ready: ((_a = result.data) === null || _a === void 0 ? void 0 : _a.ready) || false,
                            message: ((_b = result.data) === null || _b === void 0 ? void 0 : _b.ready) ? 'Scene is ready' : 'Scene is not ready'
                        }
                    });
                }
                else {
                    resolve({ success: false, error: (result === null || result === void 0 ? void 0 : result.error) || 'Failed to query scene ready state' });
                }
            }
            catch (err) {
                resolve({ success: false, error: err.message });
            }
        });
    }
    async querySceneDirty() {
        return new Promise((resolve) => {
            var _a, _b;
            try {
                const result = Editor.Scene.callSceneScript('cocos-mcp-server', 'querySceneDirty');
                if (result && result.success) {
                    resolve({
                        success: true,
                        data: {
                            dirty: ((_a = result.data) === null || _a === void 0 ? void 0 : _a.dirty) || false,
                            message: ((_b = result.data) === null || _b === void 0 ? void 0 : _b.dirty) ? 'Scene has unsaved changes' : 'Scene is clean'
                        }
                    });
                }
                else {
                    resolve({ success: false, error: (result === null || result === void 0 ? void 0 : result.error) || 'Failed to query scene dirty state' });
                }
            }
            catch (err) {
                resolve({ success: false, error: err.message });
            }
        });
    }
    async querySceneClasses(extendsClass) {
        return new Promise((resolve) => {
            var _a;
            try {
                const result = Editor.Scene.callSceneScript('cocos-mcp-server', 'querySceneClasses', extendsClass);
                if (result && result.success) {
                    resolve({
                        success: true,
                        data: {
                            classes: result.data || [],
                            count: ((_a = result.data) === null || _a === void 0 ? void 0 : _a.length) || 0,
                            extendsFilter: extendsClass
                        }
                    });
                }
                else {
                    resolve({ success: false, error: (result === null || result === void 0 ? void 0 : result.error) || 'Failed to query scene classes' });
                }
            }
            catch (err) {
                resolve({ success: false, error: err.message });
            }
        });
    }
    async querySceneComponents() {
        return new Promise((resolve) => {
            var _a;
            try {
                const result = Editor.Scene.callSceneScript('cocos-mcp-server', 'querySceneComponents');
                if (result && result.success) {
                    resolve({
                        success: true,
                        data: {
                            components: result.data || [],
                            count: ((_a = result.data) === null || _a === void 0 ? void 0 : _a.length) || 0
                        }
                    });
                }
                else {
                    resolve({ success: false, error: (result === null || result === void 0 ? void 0 : result.error) || 'Failed to query scene components' });
                }
            }
            catch (err) {
                resolve({ success: false, error: err.message });
            }
        });
    }
    async queryComponentHasScript(className) {
        return new Promise((resolve) => {
            var _a;
            try {
                const result = Editor.Scene.callSceneScript('cocos-mcp-server', 'queryComponentHasScript', className);
                if (result && result.success) {
                    const hasScript = ((_a = result.data) === null || _a === void 0 ? void 0 : _a.hasScript) || false;
                    resolve({
                        success: true,
                        data: {
                            className: className,
                            hasScript: hasScript,
                            message: hasScript ? `Component '${className}' has script` : `Component '${className}' does not have script`
                        }
                    });
                }
                else {
                    resolve({ success: false, error: (result === null || result === void 0 ? void 0 : result.error) || 'Failed to query component script status' });
                }
            }
            catch (err) {
                resolve({ success: false, error: err.message });
            }
        });
    }
    async queryNodesByAssetUuid(assetUuid) {
        return new Promise((resolve) => {
            try {
                const result = Editor.Scene.callSceneScript('cocos-mcp-server', 'queryNodesByAssetUuid', assetUuid);
                if (result && result.success) {
                    const nodeUuids = result.data || [];
                    resolve({
                        success: true,
                        data: {
                            assetUuid: assetUuid,
                            nodeUuids: nodeUuids,
                            count: nodeUuids.length,
                            message: `Found ${nodeUuids.length} nodes using asset`
                        }
                    });
                }
                else {
                    resolve({ success: false, error: (result === null || result === void 0 ? void 0 : result.error) || 'Failed to query nodes by asset UUID' });
                }
            }
            catch (err) {
                resolve({ success: false, error: err.message });
            }
        });
    }
}
exports.SceneAdvancedTools = SceneAdvancedTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NlbmUtYWR2YW5jZWQtdG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvdG9vbHMvc2NlbmUtYWR2YW5jZWQtdG9vbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGdEQUFnRDs7O0FBSWhELE1BQWEsa0JBQWtCO0lBQzNCLFFBQVE7UUFDSixPQUFPO1lBQ0g7Z0JBQ0ksSUFBSSxFQUFFLHFCQUFxQjtnQkFDM0IsV0FBVyxFQUFFLHNDQUFzQztnQkFDbkQsV0FBVyxFQUFFO29CQUNULElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRTt3QkFDUixJQUFJLEVBQUU7NEJBQ0YsSUFBSSxFQUFFLFFBQVE7NEJBQ2QsV0FBVyxFQUFFLFdBQVc7eUJBQzNCO3dCQUNELElBQUksRUFBRTs0QkFDRixJQUFJLEVBQUUsUUFBUTs0QkFDZCxXQUFXLEVBQUUsaURBQWlEO3lCQUNqRTtxQkFDSjtvQkFDRCxRQUFRLEVBQUUsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDO2lCQUM3QjthQUNKO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLG9CQUFvQjtnQkFDMUIsV0FBVyxFQUFFLDZCQUE2QjtnQkFDMUMsV0FBVyxFQUFFO29CQUNULElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRTt3QkFDUixJQUFJLEVBQUU7NEJBQ0YsSUFBSSxFQUFFLFFBQVE7NEJBQ2QsV0FBVyxFQUFFLFdBQVc7eUJBQzNCO3dCQUNELElBQUksRUFBRTs0QkFDRixJQUFJLEVBQUUsUUFBUTs0QkFDZCxXQUFXLEVBQUUsdUNBQXVDO3lCQUN2RDt3QkFDRCxNQUFNLEVBQUU7NEJBQ0osSUFBSSxFQUFFLFFBQVE7NEJBQ2QsV0FBVyxFQUFFLDRCQUE0Qjt5QkFDNUM7d0JBQ0QsTUFBTSxFQUFFOzRCQUNKLElBQUksRUFBRSxRQUFROzRCQUNkLFdBQVcsRUFBRSxzQ0FBc0M7eUJBQ3REO3FCQUNKO29CQUNELFFBQVEsRUFBRSxDQUFDLE1BQU0sRUFB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Q0FBQztnQkFDL0YsQ0FBQztZQUNMLENBQUM7WUFBQyxPQUFPLEdBQVEsRUFBRSxDQUFDO2dCQUNoQixPQUFPLENBQUMsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUNwRCxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0NBQ0o7QUFsc0JELGdEQWtzQkMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vdHlwZXMvZWRpdG9yLTJ4LmQudHNcIiAvPlxuXG5pbXBvcnQgeyBUb29sRGVmaW5pdGlvbiwgVG9vbFJlc3BvbnNlLCBUb29sRXhlY3V0b3IgfSBmcm9tICcuLi90eXBlcyc7XG5cbmV4cG9ydCBjbGFzcyBTY2VuZUFkdmFuY2VkVG9vbHMgaW1wbGVtZW50cyBUb29sRXhlY3V0b3Ige1xuICAgIGdldFRvb2xzKCk6IFRvb2xEZWZpbml0aW9uW10ge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdyZXNldF9ub2RlX3Byb3BlcnR5JyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1Jlc2V0IG5vZGUgcHJvcGVydHkgdG8gZGVmYXVsdCB2YWx1ZScsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ05vZGUgVVVJRCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdQcm9wZXJ0eSBwYXRoIChlLmcuLCBwb3NpdGlvbiwgcm90YXRpb24sIHNjYWxlKSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsndXVpZCcsICdwYXRoJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdtb3ZlX2FycmF5X2VsZW1lbnQnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTW92ZSBhcnJheSBlbGVtZW50IHBvc2l0aW9uJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTm9kZSBVVUlEJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0FycmF5IHByb3BlcnR5IHBhdGggKGUuZy4sIF9fY29tcHNfXyknXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ251bWJlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdUYXJnZXQgaXRlbSBvcmlnaW5hbCBpbmRleCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnbnVtYmVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ09mZnNldCBhbW91bnQgKHBvc2l0aXZlIG9yIG5lZ2F0aXZlKSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsndXVpZCcsICdwYXRoJywgJ3RhcmdldCcsICdvZmZzZXQnXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3JlbW92ZV9hcnJheV9lbGVtZW50JyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1JlbW92ZSBhcnJheSBlbGVtZW50IGF0IHNwZWNpZmljIGluZGV4JyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTm9kZSBVVUlEJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0FycmF5IHByb3BlcnR5IHBhdGgnXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXg6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnbnVtYmVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1RhcmdldCBpdGVtIGluZGV4IHRvIHJlbW92ZSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsndXVpZCcsICdwYXRoJywgJ2luZGV4J11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdjb3B5X25vZGUnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ29weSBub2RlIGZvciBsYXRlciBwYXN0ZSBvcGVyYXRpb24nLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uZU9mOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgdHlwZTogJ3N0cmluZycgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeyB0eXBlOiAnYXJyYXknLCBpdGVtczogeyB0eXBlOiAnc3RyaW5nJyB9IH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTm9kZSBVVUlEIG9yIGFycmF5IG9mIFVVSURzIHRvIGNvcHknXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ3V1aWRzJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdwYXN0ZV9ub2RlJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1Bhc3RlIHByZXZpb3VzbHkgY29waWVkIG5vZGVzJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdUYXJnZXQgcGFyZW50IG5vZGUgVVVJRCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uZU9mOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgdHlwZTogJ3N0cmluZycgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeyB0eXBlOiAnYXJyYXknLCBpdGVtczogeyB0eXBlOiAnc3RyaW5nJyB9IH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTm9kZSBVVUlEcyB0byBwYXN0ZSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBrZWVwV29ybGRUcmFuc2Zvcm06IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdLZWVwIHdvcmxkIHRyYW5zZm9ybSBjb29yZGluYXRlcycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsndGFyZ2V0JywgJ3V1aWRzJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdjdXRfbm9kZScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdDdXQgbm9kZSAoY29weSArIG1hcmsgZm9yIG1vdmUpJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZHM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbmVPZjogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IHR5cGU6ICdzdHJpbmcnIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgdHlwZTogJ2FycmF5JywgaXRlbXM6IHsgdHlwZTogJ3N0cmluZycgfSB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ05vZGUgVVVJRCBvciBhcnJheSBvZiBVVUlEcyB0byBjdXQnXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ3V1aWRzJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdyZXNldF9ub2RlX3RyYW5zZm9ybScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdSZXNldCBub2RlIHBvc2l0aW9uLCByb3RhdGlvbiBhbmQgc2NhbGUnLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdOb2RlIFVVSUQnXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ3V1aWQnXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3Jlc2V0X2NvbXBvbmVudCcsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdSZXNldCBjb21wb25lbnQgdG8gZGVmYXVsdCB2YWx1ZXMnLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdDb21wb25lbnQgVVVJRCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsndXVpZCddXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAncmVzdG9yZV9wcmVmYWInLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUmVzdG9yZSBwcmVmYWIgaW5zdGFuY2UgZnJvbSBhc3NldCcsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVVdWlkOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdOb2RlIFVVSUQnXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXRVdWlkOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdQcmVmYWIgYXNzZXQgVVVJRCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsnbm9kZVV1aWQnLCAnYXNzZXRVdWlkJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdleGVjdXRlX2NvbXBvbmVudF9tZXRob2QnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRXhlY3V0ZSBtZXRob2Qgb24gY29tcG9uZW50JyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ29tcG9uZW50IFVVSUQnXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTWV0aG9kIG5hbWUnXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdNZXRob2QgYXJndW1lbnRzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiBbXVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWyd1dWlkJywgJ25hbWUnXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2V4ZWN1dGVfc2NlbmVfc2NyaXB0JyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0V4ZWN1dGUgc2NlbmUgc2NyaXB0IG1ldGhvZCcsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1BsdWdpbiBuYW1lJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTWV0aG9kIG5hbWUnXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdNZXRob2QgYXJndW1lbnRzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiBbXVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWyduYW1lJywgJ21ldGhvZCddXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnc2NlbmVfc25hcHNob3QnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ3JlYXRlIHNjZW5lIHN0YXRlIHNuYXBzaG90JyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge31cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdzY2VuZV9zbmFwc2hvdF9hYm9ydCcsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBYm9ydCBzY2VuZSBzbmFwc2hvdCBjcmVhdGlvbicsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHt9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnYmVnaW5fdW5kb19yZWNvcmRpbmcnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQmVnaW4gcmVjb3JkaW5nIHVuZG8gZGF0YScsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVVdWlkOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdOb2RlIFVVSUQgdG8gcmVjb3JkJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWydub2RlVXVpZCddXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnZW5kX3VuZG9fcmVjb3JkaW5nJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0VuZCByZWNvcmRpbmcgdW5kbyBkYXRhJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgdW5kb0lkOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdVbmRvIHJlY29yZGluZyBJRCBmcm9tIGJlZ2luX3VuZG9fcmVjb3JkaW5nJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWyd1bmRvSWQnXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2NhbmNlbF91bmRvX3JlY29yZGluZycsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdDYW5jZWwgdW5kbyByZWNvcmRpbmcnLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1bmRvSWQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1VuZG8gcmVjb3JkaW5nIElEIHRvIGNhbmNlbCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsndW5kb0lkJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdzb2Z0X3JlbG9hZF9zY2VuZScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdTb2Z0IHJlbG9hZCBjdXJyZW50IHNjZW5lJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge31cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdxdWVyeV9zY2VuZV9yZWFkeScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdDaGVjayBpZiBzY2VuZSBpcyByZWFkeScsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHt9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAncXVlcnlfc2NlbmVfZGlydHknLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ2hlY2sgaWYgc2NlbmUgaGFzIHVuc2F2ZWQgY2hhbmdlcycsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHt9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAncXVlcnlfc2NlbmVfY2xhc3NlcycsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdRdWVyeSBhbGwgcmVnaXN0ZXJlZCBjbGFzc2VzJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXh0ZW5kczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRmlsdGVyIGNsYXNzZXMgdGhhdCBleHRlbmQgdGhpcyBiYXNlIGNsYXNzJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAncXVlcnlfc2NlbmVfY29tcG9uZW50cycsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdRdWVyeSBhdmFpbGFibGUgc2NlbmUgY29tcG9uZW50cycsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHt9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAncXVlcnlfY29tcG9uZW50X2hhc19zY3JpcHQnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ2hlY2sgaWYgY29tcG9uZW50IGhhcyBzY3JpcHQnLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1NjcmlwdCBjbGFzcyBuYW1lIHRvIGNoZWNrJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWydjbGFzc05hbWUnXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3F1ZXJ5X25vZGVzX2J5X2Fzc2V0X3V1aWQnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRmluZCBub2RlcyB0aGF0IHVzZSBzcGVjaWZpYyBhc3NldCBVVUlEJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXRVdWlkOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBc3NldCBVVUlEIHRvIHNlYXJjaCBmb3InXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ2Fzc2V0VXVpZCddXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICBdO1xuICAgIH1cblxuICAgIGFzeW5jIGV4ZWN1dGUodG9vbE5hbWU6IHN0cmluZywgYXJnczogYW55KTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgc3dpdGNoICh0b29sTmFtZSkge1xuICAgICAgICAgICAgY2FzZSAncmVzZXRfbm9kZV9wcm9wZXJ0eSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucmVzZXROb2RlUHJvcGVydHkoYXJncy51dWlkLCBhcmdzLnBhdGgpO1xuICAgICAgICAgICAgY2FzZSAnbW92ZV9hcnJheV9lbGVtZW50JzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5tb3ZlQXJyYXlFbGVtZW50KGFyZ3MudXVpZCwgYXJncy5wYXRoLCBhcmdzLnRhcmdldCwgYXJncy5vZmZzZXQpO1xuICAgICAgICAgICAgY2FzZSAncmVtb3ZlX2FycmF5X2VsZW1lbnQnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnJlbW92ZUFycmF5RWxlbWVudChhcmdzLnV1aWQsIGFyZ3MucGF0aCwgYXJncy5pbmRleCk7XG4gICAgICAgICAgICBjYXNlICdjb3B5X25vZGUnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmNvcHlOb2RlKGFyZ3MudXVpZHMpO1xuICAgICAgICAgICAgY2FzZSAncGFzdGVfbm9kZSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucGFzdGVOb2RlKGFyZ3MudGFyZ2V0LCBhcmdzLnV1aWRzLCBhcmdzLmtlZXBXb3JsZFRyYW5zZm9ybSk7XG4gICAgICAgICAgICBjYXNlICdjdXRfbm9kZSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuY3V0Tm9kZShhcmdzLnV1aWRzKTtcbiAgICAgICAgICAgIGNhc2UgJ3Jlc2V0X25vZGVfdHJhbnNmb3JtJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5yZXNldE5vZGVUcmFuc2Zvcm0oYXJncy51dWlkKTtcbiAgICAgICAgICAgIGNhc2UgJ3Jlc2V0X2NvbXBvbmVudCc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucmVzZXRDb21wb25lbnQoYXJncy51dWlkKTtcbiAgICAgICAgICAgIGNhc2UgJ3Jlc3RvcmVfcHJlZmFiJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5yZXN0b3JlUHJlZmFiKGFyZ3Mubm9kZVV1aWQsIGFyZ3MuYXNzZXRVdWlkKTtcbiAgICAgICAgICAgIGNhc2UgJ2V4ZWN1dGVfY29tcG9uZW50X21ldGhvZCc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZXhlY3V0ZUNvbXBvbmVudE1ldGhvZChhcmdzLnV1aWQsIGFyZ3MubmFtZSwgYXJncy5hcmdzKTtcbiAgICAgICAgICAgIGNhc2UgJ2V4ZWN1dGVfc2NlbmVfc2NyaXB0JzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5leGVjdXRlU2NlbmVTY3JpcHQoYXJncy5uYW1lLCBhcmdzLm1ldGhvZCwgYXJncy5hcmdzKTtcbiAgICAgICAgICAgIGNhc2UgJ3NjZW5lX3NuYXBzaG90JzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5zY2VuZVNuYXBzaG90KCk7XG4gICAgICAgICAgICBjYXNlICdzY2VuZV9zbmFwc2hvdF9hYm9ydCc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuc2NlbmVTbmFwc2hvdEFib3J0KCk7XG4gICAgICAgICAgICBjYXNlICdiZWdpbl91bmRvX3JlY29yZGluZyc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuYmVnaW5VbmRvUmVjb3JkaW5nKGFyZ3Mubm9kZVV1aWQpO1xuICAgICAgICAgICAgY2FzZSAnZW5kX3VuZG9fcmVjb3JkaW5nJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5lbmRVbmRvUmVjb3JkaW5nKGFyZ3MudW5kb0lkKTtcbiAgICAgICAgICAgIGNhc2UgJ2NhbmNlbF91bmRvX3JlY29yZGluZyc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuY2FuY2VsVW5kb1JlY29yZGluZyhhcmdzLnVuZG9JZCk7XG4gICAgICAgICAgICBjYXNlICdzb2Z0X3JlbG9hZF9zY2VuZSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuc29mdFJlbG9hZFNjZW5lKCk7XG4gICAgICAgICAgICBjYXNlICdxdWVyeV9zY2VuZV9yZWFkeSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucXVlcnlTY2VuZVJlYWR5KCk7XG4gICAgICAgICAgICBjYXNlICdxdWVyeV9zY2VuZV9kaXJ0eSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucXVlcnlTY2VuZURpcnR5KCk7XG4gICAgICAgICAgICBjYXNlICdxdWVyeV9zY2VuZV9jbGFzc2VzJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5xdWVyeVNjZW5lQ2xhc3NlcyhhcmdzLmV4dGVuZHMpO1xuICAgICAgICAgICAgY2FzZSAncXVlcnlfc2NlbmVfY29tcG9uZW50cyc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucXVlcnlTY2VuZUNvbXBvbmVudHMoKTtcbiAgICAgICAgICAgIGNhc2UgJ3F1ZXJ5X2NvbXBvbmVudF9oYXNfc2NyaXB0JzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5xdWVyeUNvbXBvbmVudEhhc1NjcmlwdChhcmdzLmNsYXNzTmFtZSk7XG4gICAgICAgICAgICBjYXNlICdxdWVyeV9ub2Rlc19ieV9hc3NldF91dWlkJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5xdWVyeU5vZGVzQnlBc3NldFV1aWQoYXJncy5hc3NldFV1aWQpO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gdG9vbDogJHt0b29sTmFtZX1gKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgcmVzZXROb2RlUHJvcGVydHkodXVpZDogc3RyaW5nLCBwYXRoOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICAvLyBOb3RlOiByZXNldC1wcm9wZXJ0eSBpcyBub3Qgc3VwcG9ydGVkIGluIENvY29zIENyZWF0b3IgMi54XG4gICAgICAgIC8vIFVzZSBzY2VuZTpzZXQtcHJvcGVydHkgdG8gbWFudWFsbHkgc2V0IGRlZmF1bHQgdmFsdWVzIGluc3RlYWRcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XG4gICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgIGVycm9yOiAncmVzZXQtcHJvcGVydHkgaXMgbm90IHN1cHBvcnRlZCBpbiBDb2NvcyBDcmVhdG9yIDIueC4gUGxlYXNlIHVzZSBzZXRfbm9kZV9wcm9wZXJ0eSB0byBzZXQgZGVmYXVsdCB2YWx1ZXMgbWFudWFsbHkuJ1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIG1vdmVBcnJheUVsZW1lbnQodXVpZDogc3RyaW5nLCBwYXRoOiBzdHJpbmcsIHRhcmdldDogbnVtYmVyLCBvZmZzZXQ6IG51bWJlcik6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIC8vIE5vdGU6IG1vdmUtYXJyYXktZWxlbWVudCBpcyBub3Qgc3VwcG9ydGVkIGluIENvY29zIENyZWF0b3IgMi54XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xuICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICBlcnJvcjogJ21vdmUtYXJyYXktZWxlbWVudCBpcyBub3Qgc3VwcG9ydGVkIGluIENvY29zIENyZWF0b3IgMi54J1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHJlbW92ZUFycmF5RWxlbWVudCh1dWlkOiBzdHJpbmcsIHBhdGg6IHN0cmluZywgaW5kZXg6IG51bWJlcik6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIC8vIE5vdGU6IHJlbW92ZS1hcnJheS1lbGVtZW50IGlzIG5vdCBzdXBwb3J0ZWQgaW4gQ29jb3MgQ3JlYXRvciAyLnhcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XG4gICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgIGVycm9yOiAncmVtb3ZlLWFycmF5LWVsZW1lbnQgaXMgbm90IHN1cHBvcnRlZCBpbiBDb2NvcyBDcmVhdG9yIDIueCdcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBjb3B5Tm9kZSh1dWlkczogc3RyaW5nIHwgc3RyaW5nW10pOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICAvLyBOb3RlOiBjb3B5LW5vZGUgaXMgbm90IHN1cHBvcnRlZCBpbiBDb2NvcyBDcmVhdG9yIDIueFxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgZXJyb3I6ICdjb3B5LW5vZGUgaXMgbm90IHN1cHBvcnRlZCBpbiBDb2NvcyBDcmVhdG9yIDIueCdcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBwYXN0ZU5vZGUodGFyZ2V0OiBzdHJpbmcsIHV1aWRzOiBzdHJpbmcgfCBzdHJpbmdbXSwga2VlcFdvcmxkVHJhbnNmb3JtOiBib29sZWFuID0gZmFsc2UpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICAvLyBOb3RlOiBwYXN0ZS1ub2RlIGlzIG5vdCBzdXBwb3J0ZWQgaW4gQ29jb3MgQ3JlYXRvciAyLnhcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XG4gICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgIGVycm9yOiAncGFzdGUtbm9kZSBpcyBub3Qgc3VwcG9ydGVkIGluIENvY29zIENyZWF0b3IgMi54J1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGN1dE5vZGUodXVpZHM6IHN0cmluZyB8IHN0cmluZ1tdKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgLy8gTm90ZTogY3V0LW5vZGUgaXMgbm90IHN1cHBvcnRlZCBpbiBDb2NvcyBDcmVhdG9yIDIueFxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgZXJyb3I6ICdjdXQtbm9kZSBpcyBub3Qgc3VwcG9ydGVkIGluIENvY29zIENyZWF0b3IgMi54J1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHJlc2V0Tm9kZVRyYW5zZm9ybSh1dWlkOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICAvLyBOb3RlOiByZXNldC1ub2RlIGlzIG5vdCBzdXBwb3J0ZWQgaW4gQ29jb3MgQ3JlYXRvciAyLnhcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XG4gICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgIGVycm9yOiAncmVzZXQtbm9kZSBpcyBub3Qgc3VwcG9ydGVkIGluIENvY29zIENyZWF0b3IgMi54LiBQbGVhc2UgdXNlIHNldF9ub2RlX3Byb3BlcnR5IHRvIHJlc2V0IHBvc2l0aW9uL3JvdGF0aW9uL3NjYWxlIG1hbnVhbGx5LidcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyByZXNldENvbXBvbmVudCh1dWlkOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICAvLyBOb3RlOiByZXNldC1jb21wb25lbnQgaXMgbm90IHN1cHBvcnRlZCBpbiBDb2NvcyBDcmVhdG9yIDIueFxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgZXJyb3I6ICdyZXNldC1jb21wb25lbnQgaXMgbm90IHN1cHBvcnRlZCBpbiBDb2NvcyBDcmVhdG9yIDIueCdcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyByZXN0b3JlUHJlZmFiKG5vZGVVdWlkOiBzdHJpbmcsIGFzc2V0VXVpZDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIC8vIEluIDIueCwgcmVzdG9yZS1wcmVmYWIgaXMgbm90IGRpcmVjdGx5IHN1cHBvcnRlZFxuICAgICAgICAgICAgICAgIC8vIFVzZSBicmVhay1wcmVmYWItaW5zdGFuY2UgKyBhcHBseS1wcmVmYWIgY29tYmluYXRpb24gaW5zdGVhZFxuICAgICAgICAgICAgICAgIC8vIEZpcnN0LCBicmVhayB0aGUgcHJlZmFiIGluc3RhbmNlXG4gICAgICAgICAgICAgICAgRWRpdG9yLklwYy5zZW5kVG9QYW5lbCgnc2NlbmUnLCAnc2NlbmU6YnJlYWstcHJlZmFiLWluc3RhbmNlJywgbm9kZVV1aWQpO1xuXG4gICAgICAgICAgICAgICAgLy8gVGhlbiBhcHBseSB0aGUgcHJlZmFiIGZyb20gYXNzZXRcbiAgICAgICAgICAgICAgICBFZGl0b3IuSXBjLnNlbmRUb1BhbmVsKCdzY2VuZScsICdzY2VuZTphcHBseS1wcmVmYWInLCBub2RlVXVpZCk7XG5cbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ1ByZWZhYiByZXN0b3JlZCBzdWNjZXNzZnVsbHkgKHVzaW5nIGJyZWFrICsgYXBwbHkpJ1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBleGVjdXRlQ29tcG9uZW50TWV0aG9kKHV1aWQ6IHN0cmluZywgbmFtZTogc3RyaW5nLCBhcmdzOiBhbnlbXSA9IFtdKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIC8vIEluIDIueCwgdXNlIEVkaXRvci5TY2VuZS5jYWxsU2NlbmVTY3JpcHQgdG8gZXhlY3V0ZSBjb21wb25lbnQgbWV0aG9kc1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IEVkaXRvci5TY2VuZS5jYWxsU2NlbmVTY3JpcHQoJ2NvY29zLW1jcC1zZXJ2ZXInLCAnZXhlY3V0ZUNvbXBvbmVudE1ldGhvZCcsIHV1aWQsIG5hbWUsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IHJlc3VsdCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBNZXRob2QgJyR7bmFtZX0nIGV4ZWN1dGVkIHN1Y2Nlc3NmdWxseWBcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBleGVjdXRlU2NlbmVTY3JpcHQobmFtZTogc3RyaW5nLCBtZXRob2Q6IHN0cmluZywgYXJnczogYW55W10gPSBbXSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAvLyBJbiAyLngsIHVzZSBFZGl0b3IuU2NlbmUuY2FsbFNjZW5lU2NyaXB0IGRpcmVjdGx5XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gRWRpdG9yLlNjZW5lLmNhbGxTY2VuZVNjcmlwdChuYW1lLCBtZXRob2QsIC4uLmFyZ3MpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiByZXN1bHRcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgc2NlbmVTbmFwc2hvdCgpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICAvLyBOb3RlOiBzbmFwc2hvdCBpcyBub3Qgc3VwcG9ydGVkIGluIENvY29zIENyZWF0b3IgMi54XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xuICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICBlcnJvcjogJ3NjZW5lIHNuYXBzaG90IGlzIG5vdCBzdXBwb3J0ZWQgaW4gQ29jb3MgQ3JlYXRvciAyLngnXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgc2NlbmVTbmFwc2hvdEFib3J0KCk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIC8vIE5vdGU6IHNuYXBzaG90LWFib3J0IGlzIG5vdCBzdXBwb3J0ZWQgaW4gQ29jb3MgQ3JlYXRvciAyLnhcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XG4gICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgIGVycm9yOiAnc2NlbmUgc25hcHNob3QtYWJvcnQgaXMgbm90IHN1cHBvcnRlZCBpbiBDb2NvcyBDcmVhdG9yIDIueCdcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBiZWdpblVuZG9SZWNvcmRpbmcobm9kZVV1aWQ6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIC8vIE5vdGU6IGJlZ2luLXJlY29yZGluZyBpcyBub3Qgc3VwcG9ydGVkIGluIENvY29zIENyZWF0b3IgMi54XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xuICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICBlcnJvcjogJ3VuZG8gcmVjb3JkaW5nIGlzIG5vdCBzdXBwb3J0ZWQgaW4gQ29jb3MgQ3JlYXRvciAyLngnXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgZW5kVW5kb1JlY29yZGluZyh1bmRvSWQ6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIC8vIE5vdGU6IGVuZC1yZWNvcmRpbmcgaXMgbm90IHN1cHBvcnRlZCBpbiBDb2NvcyBDcmVhdG9yIDIueFxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgZXJyb3I6ICd1bmRvIHJlY29yZGluZyBpcyBub3Qgc3VwcG9ydGVkIGluIENvY29zIENyZWF0b3IgMi54J1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGNhbmNlbFVuZG9SZWNvcmRpbmcodW5kb0lkOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICAvLyBOb3RlOiBjYW5jZWwtcmVjb3JkaW5nIGlzIG5vdCBzdXBwb3J0ZWQgaW4gQ29jb3MgQ3JlYXRvciAyLnhcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XG4gICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgIGVycm9yOiAndW5kbyByZWNvcmRpbmcgaXMgbm90IHN1cHBvcnRlZCBpbiBDb2NvcyBDcmVhdG9yIDIueCdcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBzb2Z0UmVsb2FkU2NlbmUoKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgLy8gTm90ZTogc29mdC1yZWxvYWQgaXMgbm90IHN1cHBvcnRlZCBpbiBDb2NvcyBDcmVhdG9yIDIueFxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgZXJyb3I6ICdzb2Z0LXJlbG9hZCBpcyBub3Qgc3VwcG9ydGVkIGluIENvY29zIENyZWF0b3IgMi54J1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHF1ZXJ5U2NlbmVSZWFkeSgpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gRWRpdG9yLlNjZW5lLmNhbGxTY2VuZVNjcmlwdCgnY29jb3MtbWNwLXNlcnZlcicsICdxdWVyeVNjZW5lUmVhZHknKTtcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0ICYmIHJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWFkeTogcmVzdWx0LmRhdGE/LnJlYWR5IHx8IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IHJlc3VsdC5kYXRhPy5yZWFkeSA/ICdTY2VuZSBpcyByZWFkeScgOiAnU2NlbmUgaXMgbm90IHJlYWR5J1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiByZXN1bHQ/LmVycm9yIHx8ICdGYWlsZWQgdG8gcXVlcnkgc2NlbmUgcmVhZHkgc3RhdGUnIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgcXVlcnlTY2VuZURpcnR5KCk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBFZGl0b3IuU2NlbmUuY2FsbFNjZW5lU2NyaXB0KCdjb2Nvcy1tY3Atc2VydmVyJywgJ3F1ZXJ5U2NlbmVEaXJ0eScpO1xuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQgJiYgcmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpcnR5OiByZXN1bHQuZGF0YT8uZGlydHkgfHwgZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogcmVzdWx0LmRhdGE/LmRpcnR5ID8gJ1NjZW5lIGhhcyB1bnNhdmVkIGNoYW5nZXMnIDogJ1NjZW5lIGlzIGNsZWFuJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiByZXN1bHQ/LmVycm9yIHx8ICdGYWlsZWQgdG8gcXVlcnkgc2NlbmUgZGlydHkgc3RhdGUnIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgcXVlcnlTY2VuZUNsYXNzZXMoZXh0ZW5kc0NsYXNzPzogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IEVkaXRvci5TY2VuZS5jYWxsU2NlbmVTY3JpcHQoJ2NvY29zLW1jcC1zZXJ2ZXInLCAncXVlcnlTY2VuZUNsYXNzZXMnLCBleHRlbmRzQ2xhc3MpO1xuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQgJiYgcmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzZXM6IHJlc3VsdC5kYXRhIHx8IFtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50OiByZXN1bHQuZGF0YT8ubGVuZ3RoIHx8IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0ZW5kc0ZpbHRlcjogZXh0ZW5kc0NsYXNzXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IHJlc3VsdD8uZXJyb3IgfHwgJ0ZhaWxlZCB0byBxdWVyeSBzY2VuZSBjbGFzc2VzJyB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHF1ZXJ5U2NlbmVDb21wb25lbnRzKCk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBFZGl0b3IuU2NlbmUuY2FsbFNjZW5lU2NyaXB0KCdjb2Nvcy1tY3Atc2VydmVyJywgJ3F1ZXJ5U2NlbmVDb21wb25lbnRzJyk7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdCAmJiByZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50czogcmVzdWx0LmRhdGEgfHwgW10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY291bnQ6IHJlc3VsdC5kYXRhPy5sZW5ndGggfHwgMFxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiByZXN1bHQ/LmVycm9yIHx8ICdGYWlsZWQgdG8gcXVlcnkgc2NlbmUgY29tcG9uZW50cycgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBxdWVyeUNvbXBvbmVudEhhc1NjcmlwdChjbGFzc05hbWU6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBFZGl0b3IuU2NlbmUuY2FsbFNjZW5lU2NyaXB0KCdjb2Nvcy1tY3Atc2VydmVyJywgJ3F1ZXJ5Q29tcG9uZW50SGFzU2NyaXB0JywgY2xhc3NOYW1lKTtcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0ICYmIHJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGhhc1NjcmlwdCA9IHJlc3VsdC5kYXRhPy5oYXNTY3JpcHQgfHwgZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU6IGNsYXNzTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYXNTY3JpcHQ6IGhhc1NjcmlwdCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBoYXNTY3JpcHQgPyBgQ29tcG9uZW50ICcke2NsYXNzTmFtZX0nIGhhcyBzY3JpcHRgIDogYENvbXBvbmVudCAnJHtjbGFzc05hbWV9JyBkb2VzIG5vdCBoYXZlIHNjcmlwdGBcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogcmVzdWx0Py5lcnJvciB8fCAnRmFpbGVkIHRvIHF1ZXJ5IGNvbXBvbmVudCBzY3JpcHQgc3RhdHVzJyB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHF1ZXJ5Tm9kZXNCeUFzc2V0VXVpZChhc3NldFV1aWQ6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBFZGl0b3IuU2NlbmUuY2FsbFNjZW5lU2NyaXB0KCdjb2Nvcy1tY3Atc2VydmVyJywgJ3F1ZXJ5Tm9kZXNCeUFzc2V0VXVpZCcsIGFzc2V0VXVpZCk7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdCAmJiByZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBub2RlVXVpZHMgPSByZXN1bHQuZGF0YSB8fCBbXTtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzc2V0VXVpZDogYXNzZXRVdWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVVdWlkczogbm9kZVV1aWRzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50OiBub2RlVXVpZHMubGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBGb3VuZCAke25vZGVVdWlkcy5sZW5ndGh9IG5vZGVzIHVzaW5nIGFzc2V0YFxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiByZXN1bHQ/LmVycm9yIHx8ICdGYWlsZWQgdG8gcXVlcnkgbm9kZXMgYnkgYXNzZXQgVVVJRCcgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxufSJdfQ==