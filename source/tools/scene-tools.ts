/// <reference path="../types/editor-2x.d.ts" />

import { ToolDefinition, ToolResponse, ToolExecutor, SceneInfo } from '../types';
import { callSceneScriptAsync } from '../utils/scene-script-helper';

export class SceneTools implements ToolExecutor {
    getTools(): ToolDefinition[] {
        return [
            {
                name: 'get_current_scene',
                description: 'Get current scene information',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'get_scene_list',
                description: 'Get all scenes in the project',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'open_scene',
                description: 'Open a scene by path',
                inputSchema: {
                    type: 'object',
                    properties: {
                        scenePath: {
                            type: 'string',
                            description: 'The scene file path'
                        }
                    },
                    required: ['scenePath']
                }
            },
            {
                name: 'save_scene',
                description: 'Save current scene',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'create_scene',
                description: 'Create a new scene asset',
                inputSchema: {
                    type: 'object',
                    properties: {
                        sceneName: {
                            type: 'string',
                            description: 'Name of the new scene'
                        },
                        savePath: {
                            type: 'string',
                            description: 'Path to save the scene (e.g., db://assets/scenes/NewScene.fire)'
                        }
                    },
                    required: ['sceneName', 'savePath']
                }
            },
            {
                name: 'get_scene_hierarchy',
                description: 'Get the complete hierarchy of current scene',
                inputSchema: {
                    type: 'object',
                    properties: {
                        includeComponents: {
                            type: 'boolean',
                            description: 'Include component information',
                            default: false
                        }
                    }
                }
            }
        ];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        switch (toolName) {
            case 'get_current_scene':
                return await this.getCurrentScene();
            case 'get_scene_list':
                return await this.getSceneList();
            case 'open_scene':
                return await this.openScene(args.scenePath);
            case 'save_scene':
                return await this.saveScene();
            case 'create_scene':
                return await this.createScene(args.sceneName, args.savePath);
            case 'get_scene_hierarchy':
                return await this.getSceneHierarchy(args.includeComponents);
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    }

    private async getCurrentScene(): Promise<ToolResponse> {
        try {
            // In 2.x, use Editor.Scene.callSceneScript to execute scene scripts
            const result = await callSceneScriptAsync('cocos-mcp-server', 'getCurrentSceneInfo');
            if (result && result.success) {
                return result;
            } else {
                return { success: false, error: result?.error || 'Failed to get scene info' };
            }
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }

    private async getSceneList(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            // In 2.x, use Editor.assetdb (lowercase)
            Editor.assetdb.queryAssets('db://assets/**/*.fire', 'scene', (err, results) => {
                if (err) {
                    resolve({ success: false, error: err.message });
                    return;
                }

                const scenes: SceneInfo[] = results.map((asset: any) => ({
                    name: asset.name || asset.basename,
                    path: asset.url,
                    uuid: asset.uuid
                }));
                resolve({ success: true, data: scenes });
            });
        });
    }

    private async openScene(scenePath: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            // In 2.x, use Editor.Ipc to send messages
            Editor.Ipc.sendToMain('scene:open-scene', scenePath, (err: Error | null) => {
                if (err) {
                    resolve({ success: false, error: err.message });
                } else {
                    resolve({ success: true, message: `Scene opened: ${scenePath}` });
                }
            });
        });
    }

    private async saveScene(): Promise<ToolResponse> {
        Editor.Ipc.sendToPanel('scene', 'scene:stash-and-save');
        // 0.5초 대기
        await new Promise(resolve => setTimeout(resolve, 500));
        const result = await this.getCurrentScene();
        if (result && result.success) {
            return result;
        } else {
            return { success: false, error: result?.error || 'Failed to get scene info' };
        }
    }

    private async createScene(sceneName: string, savePath: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            // 确保路径以.fire结尾
            const fullPath = savePath.endsWith('.fire') ? savePath : `${savePath}/${sceneName}.fire`;

            // 使用正确的Cocos Creator 3.8场景格式
            const sceneContent = JSON.stringify([{ "__type__": "cc.SceneAsset", "_name": "", "_objFlags": 0, "_native": "", "scene": { "__id__": 1 } }, { "__type__": "cc.Scene", "_objFlags": 0, "_parent": null, "_children": [{ "__id__": 2 }], "_active": true, "_components": [], "_prefab": null, "_opacity": 255, "_color": { "__type__": "cc.Color", "r": 255, "g": 255, "b": 255, "a": 255 }, "_contentSize": { "__type__": "cc.Size", "width": 0, "height": 0 }, "_anchorPoint": { "__type__": "cc.Vec2", "x": 0, "y": 0 }, "_trs": { "__type__": "TypedArray", "ctor": "Float64Array", "array": [0, 0, 0, 0, 0, 0, 1, 1, 1, 1] }, "_is3DNode": true, "_groupIndex": 0, "groupIndex": 0, "autoReleaseAssets": false, "_id": "324247e8-c584-495d-87b3-015a69fee444" }, { "__type__": "cc.Node", "_name": "Canvas", "_objFlags": 0, "_parent": { "__id__": 1 }, "_children": [{ "__id__": 3 }], "_active": true, "_components": [{ "__id__": 5 }, { "__id__": 6 }], "_prefab": null, "_opacity": 255, "_color": { "__type__": "cc.Color", "r": 255, "g": 255, "b": 255, "a": 255 }, "_contentSize": { "__type__": "cc.Size", "width": 960, "height": 640 }, "_anchorPoint": { "__type__": "cc.Vec2", "x": 0.5, "y": 0.5 }, "_trs": { "__type__": "TypedArray", "ctor": "Float64Array", "array": [480, 320, 0, 0, 0, 0, 1, 1, 1, 1] }, "_eulerAngles": { "__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0 }, "_skewX": 0, "_skewY": 0, "_is3DNode": false, "_groupIndex": 0, "groupIndex": 0, "_id": "a5esZu+45LA5mBpvttspPD" }, { "__type__": "cc.Node", "_name": "Main Camera", "_objFlags": 0, "_parent": { "__id__": 2 }, "_children": [], "_active": true, "_components": [{ "__id__": 4 }], "_prefab": null, "_opacity": 255, "_color": { "__type__": "cc.Color", "r": 255, "g": 255, "b": 255, "a": 255 }, "_contentSize": { "__type__": "cc.Size", "width": 960, "height": 640 }, "_anchorPoint": { "__type__": "cc.Vec2", "x": 0.5, "y": 0.5 }, "_trs": { "__type__": "TypedArray", "ctor": "Float64Array", "array": [0, 0, 0, 0, 0, 0, 1, 1, 1, 1] }, "_eulerAngles": { "__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0 }, "_skewX": 0, "_skewY": 0, "_is3DNode": false, "_groupIndex": 0, "groupIndex": 0, "_id": "e1WoFrQ79G7r4ZuQE3HlNb" }, { "__type__": "cc.Camera", "_name": "", "_objFlags": 0, "node": { "__id__": 3 }, "_enabled": true, "_cullingMask": 4294967295, "_clearFlags": 7, "_backgroundColor": { "__type__": "cc.Color", "r": 0, "g": 0, "b": 0, "a": 255 }, "_depth": -1, "_zoomRatio": 1, "_targetTexture": null, "_fov": 60, "_orthoSize": 10, "_nearClip": 1, "_farClip": 4096, "_ortho": true, "_rect": { "__type__": "cc.Rect", "x": 0, "y": 0, "width": 1, "height": 1 }, "_renderStages": 1, "_alignWithScreen": true, "_id": "81GN3uXINKVLeW4+iKSlim" }, { "__type__": "cc.Canvas", "_name": "", "_objFlags": 0, "node": { "__id__": 2 }, "_enabled": true, "_designResolution": { "__type__": "cc.Size", "width": 720, "height": 1280 }, "_fitWidth": false, "_fitHeight": true, "_id": "59Cd0ovbdF4byw5sbjJDx7" }, { "__type__": "cc.Widget", "_name": "", "_objFlags": 0, "node": { "__id__": 2 }, "_enabled": true, "alignMode": 1, "_target": null, "_alignFlags": 45, "_left": 0, "_right": 0, "_top": 0, "_bottom": 0, "_verticalCenter": 0, "_horizontalCenter": 0, "_isAbsLeft": true, "_isAbsRight": true, "_isAbsTop": true, "_isAbsBottom": true, "_isAbsHorizontalCenter": true, "_isAbsVerticalCenter": true, "_originalWidth": 0, "_originalHeight": 0, "_id": "29zXboiXFBKoIV4PQ2liTe" }], null, 2);

            // In 2.x, use Editor.assetdb.create (lowercase)
            Editor.assetdb.create(fullPath, sceneContent, (err, result) => {
                if (err) {
                    resolve({ success: false, error: err.message });
                    return;
                }

                // Verify scene creation by checking if it exists
                this.getSceneList().then((sceneList) => {
                    const createdScene = sceneList.data?.find((scene: any) => scene.uuid === result.uuid);
                    resolve({
                        success: true,
                        data: {
                            uuid: result.uuid,
                            url: result.url,
                            name: sceneName,
                            message: `Scene '${sceneName}' created successfully`,
                            sceneVerified: !!createdScene
                        },
                        verificationData: createdScene
                    });
                }).catch(() => {
                    resolve({
                        success: true,
                        data: {
                            uuid: result.uuid,
                            url: result.url,
                            name: sceneName,
                            message: `Scene '${sceneName}' created successfully (verification failed)`
                        }
                    });
                });
            });
        });
    }

    private async getSceneHierarchy(includeComponents: boolean = false): Promise<ToolResponse> {
        try {
            // In 2.x, use Editor.Scene.callSceneScript to execute scene scripts
            const result = await callSceneScriptAsync('cocos-mcp-server', 'getSceneHierarchy', includeComponents);
            if (result && result.success) {
                return result;
            } else {
                return { success: false, error: result?.error || 'Failed to get scene hierarchy' };
            }
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }

    private buildHierarchy(node: any, includeComponents: boolean): any {
        const nodeInfo: any = {
            uuid: node.uuid,
            name: node.name,
            type: node.type,
            active: node.active,
            children: []
        };

        if (includeComponents && node.__comps__) {
            nodeInfo.components = node.__comps__.map((comp: any) => ({
                type: comp.__type__ || 'Unknown',
                enabled: comp.enabled !== undefined ? comp.enabled : true
            }));
        }

        if (node.children) {
            nodeInfo.children = node.children.map((child: any) =>
                this.buildHierarchy(child, includeComponents)
            );
        }

        return nodeInfo;
    }
}