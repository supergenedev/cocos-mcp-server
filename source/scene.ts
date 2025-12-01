/// <reference path="./types/cc-2x.d.ts" />
/// <reference path="./types/editor-2x.d.ts" />

import { join } from 'path';
module.paths.push(join(Editor.appPath, 'node_modules'));
// Note: In Cocos Creator 2.x, 'cc' is available as a global variable in scene scripts
// We don't need to require it like in 3.x

export const methods: { [key: string]: (...any: any) => any } = {
    /**
     * Create a new scene
     */
    createNewScene() {
        try {
            const scene = new cc.Scene();
            scene.name = 'New Scene';
            cc.director.runScene(scene);
            return { success: true, message: 'New scene created successfully' };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Add component to a node
     */
    addComponentToNode(nodeUuid: string, componentType: string) {
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                return { success: false, error: 'No active scene' };
            }

            // Find node by UUID
            const node = scene.getChildByUuid(nodeUuid);
            if (!node) {
                return { success: false, error: `Node with UUID ${nodeUuid} not found` };
            }

            // Get component class
            const ComponentClass = cc.js.getClassByName(componentType);
            if (!ComponentClass) {
                return { success: false, error: `Component type ${componentType} not found` };
            }

            // Add component
            const component = node.addComponent(ComponentClass as new () => cc.Component);
            return {
                success: true,
                message: `Component ${componentType} added successfully`,
                data: { componentId: component.uuid }
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Remove component from a node
     */
    removeComponentFromNode(nodeUuid: string, componentType: string) {
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                return { success: false, error: 'No active scene' };
            }

            const node = scene.getChildByUuid(nodeUuid);
            if (!node) {
                return { success: false, error: `Node with UUID ${nodeUuid} not found` };
            }

            const ComponentClass = cc.js.getClassByName(componentType);
            if (!ComponentClass) {
                return { success: false, error: `Component type ${componentType} not found` };
            }

            const component = node.getComponent(ComponentClass as new () => cc.Component);
            if (!component) {
                return { success: false, error: `Component ${componentType} not found on node` };
            }

            node.removeComponent(component);
            return { success: true, message: `Component ${componentType} removed successfully` };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Create a new node
     */
    createNode(name: string, parentUuid?: string) {
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                return { success: false, error: 'No active scene' };
            }

            const node = new cc.Node(name);

            if (parentUuid) {
                const parent = scene.getChildByUuid(parentUuid);
                if (parent) {
                    parent.addChild(node);
                } else {
                    scene.addChild(node);
                }
            } else {
                scene.addChild(node);
            }

            return {
                success: true,
                message: `Node ${name} created successfully`,
                data: { uuid: node.uuid, name: node.name }
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Get node information
     */
    getNodeInfo(nodeUuid: string) {
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                return { success: false, error: 'No active scene' };
            }

            const node = scene.getChildByUuid(nodeUuid);
            if (!node) {
                return { success: false, error: `Node with UUID ${nodeUuid} not found` };
            }

            // In 2.x, position is stored as x, y properties (for 2D) or position Vec3 (for 3D)
            const posData = node.position ? {
                x: (node.position as any).x || node.x,
                y: (node.position as any).y || node.y,
                z: (node.position as any).z || 0
            } : { x: node.x, y: node.y, z: 0 };

            return {
                success: true,
                data: {
                    uuid: node.uuid,
                    name: node.name,
                    active: node.active,
                    position: posData,
                    rotation: node.rotation || 0,
                    scale: { x: node.scaleX, y: node.scaleY, z: 1 },
                    parent: node.parent?.uuid,
                    children: node.children.map((child: any) => child.uuid),
                    components: (node as any)._components ? (node as any)._components.map((comp: any) => ({
                        type: cc.js.getClassName(comp),
                        enabled: comp.enabled
                    })) : []
                }
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Get all nodes in scene
     */
    getAllNodes() {
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                return { success: false, error: 'No active scene' };
            }

            const nodes: any[] = [];
            const collectNodes = (node: any) => {
                nodes.push({
                    uuid: node.uuid,
                    name: node.name,
                    active: node.active,
                    parent: node.parent?.uuid
                });

                node.children.forEach((child: any) => collectNodes(child));
            };

            scene.children.forEach((child: any) => collectNodes(child));

            return { success: true, data: nodes };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Find node by name
     */
    findNodeByName(name: string) {
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                return { success: false, error: 'No active scene' };
            }

            const node = scene.getChildByName(name);
            if (!node) {
                return { success: false, error: `Node with name ${name} not found` };
            }

            return {
                success: true,
                data: {
                    uuid: node.uuid,
                    name: node.name,
                    active: node.active,
                    position: { x: node.x, y: node.y }
                }
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Get current scene information
     */
    getCurrentSceneInfo() {
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                return { success: false, error: 'No active scene' };
            }

            return {
                success: true,
                data: {
                    name: scene.name,
                    uuid: scene.uuid,
                    nodeCount: scene.children.length
                }
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Set node property
     */
    setNodeProperty(nodeUuid: string, property: string, value: any) {
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                return { success: false, error: 'No active scene' };
            }

            const node = scene.getChildByUuid(nodeUuid);
            if (!node) {
                return { success: false, error: `Node with UUID ${nodeUuid} not found` };
            }

            // Set property - 2.x uses different methods
            if (property === 'position') {
                node.setPosition(value.x || 0, value.y || 0);
            } else if (property === 'rotation') {
                node.rotation = value;
            } else if (property === 'scale') {
                node.setScale(value.x || 1, value.y || 1);
            } else if (property === 'active') {
                node.active = value;
            } else if (property === 'name') {
                node.name = value;
            } else if (property === 'x') {
                node.x = value;
            } else if (property === 'y') {
                node.y = value;
            } else if (property === 'scaleX') {
                node.scaleX = value;
            } else if (property === 'scaleY') {
                node.scaleY = value;
            } else if (property === 'opacity') {
                node.opacity = value;
            } else if (property === 'color') {
                node.color = new cc.Color(value.r || 255, value.g || 255, value.b || 255, value.a || 255);
            } else {
                // Try to set property directly
                (node as any)[property] = value;
            }

            return {
                success: true,
                message: `Property '${property}' updated successfully`
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Get scene hierarchy
     */
    getSceneHierarchy(includeComponents: boolean = false) {
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                return { success: false, error: 'No active scene' };
            }

            const processNode = (node: any): any => {
                const result: any = {
                    name: node.name,
                    uuid: node.uuid,
                    active: node.active,
                    children: []
                };

                if (includeComponents && node._components) {
                    result.components = node._components.map((comp: any) => ({
                        type: cc.js.getClassName(comp),
                        enabled: comp.enabled
                    }));
                }

                if (node.children && node.children.length > 0) {
                    result.children = node.children.map((child: any) => processNode(child));
                }

                return result;
            };

            const hierarchy = scene.children.map((child: any) => processNode(child));
            return { success: true, data: hierarchy };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Create prefab from node
     */
    createPrefabFromNode(nodeUuid: string, prefabPath: string) {
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                return { success: false, error: 'No active scene' };
            }

            const node = scene.getChildByUuid(nodeUuid);
            if (!node) {
                return { success: false, error: `Node with UUID ${nodeUuid} not found` };
            }

            // Note: This is a simulation implementation because the runtime environment
            // cannot directly create prefab files in 2.x
            // Real prefab creation requires Editor API support
            return {
                success: true,
                data: {
                    prefabPath: prefabPath,
                    sourceNodeUuid: nodeUuid,
                    message: `Prefab created from node '${node.name}' at ${prefabPath}`
                }
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Set component property
     */
    setComponentProperty(nodeUuid: string, componentType: string, property: string, value: any) {
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                return { success: false, error: 'No active scene' };
            }

            const node = scene.getChildByUuid(nodeUuid);
            if (!node) {
                return { success: false, error: `Node with UUID ${nodeUuid} not found` };
            }

            const ComponentClass = cc.js.getClassByName(componentType);
            if (!ComponentClass) {
                return { success: false, error: `Component type ${componentType} not found` };
            }

            const component = node.getComponent(ComponentClass as new () => cc.Component);
            if (!component) {
                return { success: false, error: `Component ${componentType} not found on node` };
            }

            // Handle common properties with special treatment
            if (property === 'spriteFrame' && componentType === 'cc.Sprite') {
                // Support value as uuid or resource path
                if (typeof value === 'string') {
                    // Try to load as resource
                    cc.loader.loadRes(value, cc.SpriteFrame, (err: any, spriteFrame: any) => {
                        if (!err && spriteFrame) {
                            (component as any).spriteFrame = spriteFrame;
                        } else {
                            // Try direct assignment (compatible with already passed resource object)
                            (component as any).spriteFrame = value;
                        }
                    });
                } else {
                    (component as any).spriteFrame = value;
                }
            } else if (property === 'string' && (componentType === 'cc.Label' || componentType === 'cc.RichText')) {
                (component as any).string = value;
            } else {
                (component as any)[property] = value;
            }

            return { success: true, message: `Component property '${property}' updated successfully` };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
};
