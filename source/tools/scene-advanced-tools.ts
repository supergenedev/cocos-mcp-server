/// <reference path="../types/editor-2x.d.ts" />

import { ToolDefinition, ToolResponse, ToolExecutor } from '../types';
import { callSceneScriptAsync } from '../utils/scene-script-helper';

export class SceneAdvancedTools implements ToolExecutor {
    getTools(): ToolDefinition[] {
        return [
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

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        switch (toolName) {
            case 'restore_prefab':
                return await this.restorePrefab(args.nodeUuid, args.assetUuid);
            case 'execute_component_method':
                return await this.executeComponentMethod(args.uuid, args.name, args.args);
            case 'execute_scene_script':
                return await this.executeSceneScript(args.name, args.method, args.args);
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

    private async restorePrefab(nodeUuid: string, assetUuid: string): Promise<ToolResponse> {
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
            } catch (err: any) {
                resolve({ success: false, error: err.message });
            }
        });
    }

    private async executeComponentMethod(uuid: string, name: string, args: any[] = []): Promise<ToolResponse> {
        try {
            // In 2.x, use Editor.Scene.callSceneScript to execute component methods
            const result = await callSceneScriptAsync('cocos-mcp-server', 'executeComponentMethod', uuid, name, args);
            return {
                success: true,
                data: {
                    result: result,
                    message: `Method '${name}' executed successfully`
                }
            };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }

    private async executeSceneScript(name: string, method: string, args: any[] = []): Promise<ToolResponse> {
        try {
            // In 2.x, use Editor.Scene.callSceneScript directly
            const result = await callSceneScriptAsync(name, method, ...args);
            return {
                success: true,
                data: result
            };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }

    private async querySceneReady(): Promise<ToolResponse> {
        try {
            const result = await callSceneScriptAsync('cocos-mcp-server', 'querySceneReady');
            if (result && result.success) {
                return {
                    success: true,
                    data: {
                        ready: result.data?.ready || false,
                        message: result.data?.ready ? 'Scene is ready' : 'Scene is not ready'
                    }
                };
            } else {
                return { success: false, error: result?.error || 'Failed to query scene ready state' };
            }
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }

    private async querySceneDirty(): Promise<ToolResponse> {
        try {
            const result = await callSceneScriptAsync('cocos-mcp-server', 'querySceneDirty');
            if (result && result.success) {
                return {
                    success: true,
                    data: {
                        dirty: result.data?.dirty || false,
                        message: result.data?.dirty ? 'Scene has unsaved changes' : 'Scene is clean'
                    }
                };
            } else {
                return { success: false, error: result?.error || 'Failed to query scene dirty state' };
            }
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }

    private async querySceneClasses(extendsClass?: string): Promise<ToolResponse> {
        try {
            const result = await callSceneScriptAsync('cocos-mcp-server', 'querySceneClasses', extendsClass);
            if (result && result.success) {
                return {
                    success: true,
                    data: {
                        classes: result.data || [],
                        count: result.data?.length || 0,
                        extendsFilter: extendsClass
                    }
                };
            } else {
                return { success: false, error: result?.error || 'Failed to query scene classes' };
            }
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }

    private async querySceneComponents(): Promise<ToolResponse> {
        try {
            const result = await callSceneScriptAsync('cocos-mcp-server', 'querySceneComponents');
            if (result && result.success) {
                return {
                    success: true,
                    data: {
                        components: result.data || [],
                        count: result.data?.length || 0
                    }
                };
            } else {
                return { success: false, error: result?.error || 'Failed to query scene components' };
            }
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }

    private async queryComponentHasScript(className: string): Promise<ToolResponse> {
        try {
            const result = await callSceneScriptAsync('cocos-mcp-server', 'queryComponentHasScript', className);
            if (result && result.success) {
                const hasScript = result.data?.hasScript || false;
                return {
                    success: true,
                    data: {
                        className: className,
                        hasScript: hasScript,
                        message: hasScript ? `Component '${className}' has script` : `Component '${className}' does not have script`
                    }
                };
            } else {
                return { success: false, error: result?.error || 'Failed to query component script status' };
            }
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }

    private async queryNodesByAssetUuid(assetUuid: string): Promise<ToolResponse> {
        try {
            const result = await callSceneScriptAsync('cocos-mcp-server', 'queryNodesByAssetUuid', assetUuid);
            if (result && result.success) {
                const nodeUuids = result.data || [];
                return {
                    success: true,
                    data: {
                        assetUuid: assetUuid,
                        nodeUuids: nodeUuids,
                        count: nodeUuids.length,
                        message: `Found ${nodeUuids.length} nodes using asset`
                    }
                };
            } else {
                return { success: false, error: result?.error || 'Failed to query nodes by asset UUID' };
            }
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }
}