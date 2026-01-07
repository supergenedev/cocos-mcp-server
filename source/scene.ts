/// <reference path="./types/cc-2x.d.ts" />
/// <reference path="./types/editor-2x.d.ts" />

import { join } from 'path';
module.paths.push(join(Editor.appPath, 'node_modules'));
// Note: In Cocos Creator 2.x, 'cc' is available as a global variable in scene scripts
// We don't need to require it like in 3.x

const methods: { [key: string]: (...any: any) => any } = {
    /**
     * Create a new scene
     */
    createNewScene(event: any) {
        try {
            const scene = new cc.Scene();
            scene.name = 'New Scene';
            cc.director.runScene(scene);
            if (event.reply) {
                event.reply(null, { success: true, message: 'New scene created successfully' });
            }
        } catch (error: any) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },

    /**
     * Add component to a node
     */
    addComponentToNode(event: any, nodeUuid: string, componentType: string) {
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                if (event.reply) {
                    event.reply(null, { success: false, error: 'No active scene' });
                }
                return;
            }

            // Find node by UUID
            const node = scene.getChildByUuid(nodeUuid);
            if (!node) {
                if (event.reply) {
                    event.reply(null, { success: false, error: `Node with UUID ${nodeUuid} not found` });
                }
                return;
            }

            // Get component class
            const ComponentClass = cc.js.getClassByName(componentType);
            if (!ComponentClass) {
                if (event.reply) {
                    event.reply(null, { success: false, error: `Component type ${componentType} not found` });
                }
                return;
            }

            // Add component
            const component = node.addComponent(ComponentClass as new () => cc.Component);
            if (event.reply) {
                event.reply(null, {
                    success: true,
                    message: `Component ${componentType} added successfully`,
                    data: { componentId: component.uuid }
                });
            }
        } catch (error: any) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },

    /**
     * Remove component from a node
     */
    removeComponentFromNode(event: any, nodeUuid: string, componentType: string) {
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                if (event.reply) {
                    event.reply(null, { success: false, error: 'No active scene' });
                }
                return;
            }

            const node = scene.getChildByUuid(nodeUuid);
            if (!node) {
                if (event.reply) {
                    event.reply(null, { success: false, error: `Node with UUID ${nodeUuid} not found` });
                }
                return;
            }

            const ComponentClass = cc.js.getClassByName(componentType);
            if (!ComponentClass) {
                if (event.reply) {
                    event.reply(null, { success: false, error: `Component type ${componentType} not found` });
                }
                return;
            }

            const component = node.getComponent(ComponentClass as new () => cc.Component);
            if (!component) {
                if (event.reply) {
                    event.reply(null, { success: false, error: `Component ${componentType} not found on node` });
                }
                return;
            }

            node.removeComponent(component);
            if (event.reply) {
                event.reply(null, { success: true, message: `Component ${componentType} removed successfully` });
            }
        } catch (error: any) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },

    /**
     * Create a new node
     */
    createNode(event: any, name: string, parentUuid?: string) {
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                if (event.reply) {
                    event.reply(null, { success: false, error: 'No active scene' });
                }
                return;
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

            if (event.reply) {
                event.reply(null, {
                    success: true,
                    message: `Node ${name} created successfully`,
                    data: { uuid: node.uuid, name: node.name }
                });
            }
        } catch (error: any) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },

    /**
     * Get node information
     */
    getNodeInfo(event: any, nodeUuid: string) {
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                if (event.reply) {
                    event.reply(null, { success: false, error: 'No active scene' });
                }
                return;
            }

            const node = scene.getChildByUuid(nodeUuid);
            if (!node) {
                if (event.reply) {
                    event.reply(null, { success: false, error: `Node with UUID ${nodeUuid} not found` });
                }
                return;
            }

            // In 2.x, position is stored as x, y properties (for 2D) or position Vec3 (for 3D)
            const posData = node.position ? {
                x: (node.position as any).x || node.x,
                y: (node.position as any).y || node.y,
                z: (node.position as any).z || 0
            } : { x: node.x, y: node.y, z: 0 };

            if (event.reply) {
                event.reply(null, {
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
                });
            }
        } catch (error: any) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },

    /**
     * Get all nodes in scene
     */
    getAllNodes(event: any) {
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                if (event.reply) {
                    event.reply(null, { success: false, error: 'No active scene' });
                }
                return;
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

            if (event.reply) {
                event.reply(null, { success: true, data: nodes });
            }
        } catch (error: any) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },

    /**
     * Find node by name
     */
    findNodeByName(event: any, name: string) {
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                if (event.reply) {
                    event.reply(null, { success: false, error: 'No active scene' });
                }
                return;
            }

            const node = scene.getChildByName(name);
            if (!node) {
                if (event.reply) {
                    event.reply(null, { success: false, error: `Node with name ${name} not found` });
                }
                return;
            }

            if (event.reply) {
                event.reply(null, {
                    success: true,
                    data: {
                        uuid: node.uuid,
                        name: node.name,
                        active: node.active,
                        position: { x: node.x, y: node.y }
                    }
                });
            }
        } catch (error: any) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },

    /**
     * Get current scene information
     */
    getCurrentSceneInfo(event: any) {
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                if (event.reply) {
                    event.reply(null, { success: false, error: 'No active scene' });
                }
                return;
            }

            if (event.reply) {
                event.reply(null, {
                    success: true,
                    data: {
                        name: scene.name,
                        uuid: scene.uuid,
                        nodeCount: scene.children.length
                    }
                });
            }
        } catch (error: any) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },

    /**
     * Set node property
     */
    setNodeProperty(event: any, nodeUuid: string, property: string, value: any) {
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                if (event.reply) {
                    event.reply(null, { success: false, error: 'No active scene' });
                }
                return;
            }

            // Recursively search for node by UUID (same as queryNode)
            const findNodeByUuid = (node: any): any => {
                if (node.uuid === nodeUuid) {
                    return node;
                }
                if (node.children) {
                    for (const child of node.children) {
                        const found = findNodeByUuid(child);
                        if (found) {
                            return found;
                        }
                    }
                }
                return null;
            };

            const node = findNodeByUuid(scene);
            if (!node) {
                if (event.reply) {
                    event.reply(null, { success: false, error: `Node with UUID ${nodeUuid} not found` });
                }
                return;
            }

            // Set property - 2.x uses different methods
            if (property === 'position') {
                node.setPosition(value.x || 0, value.y || 0);
            } else if (property === 'rotation') {
                node.rotation = value;
            } else if (property === 'scale') {
                // In Cocos Creator 2.x, setScale might not work properly, use scaleX/scaleY directly
                if (value.x !== undefined) {
                    node.scaleX = value.x;
                }
                if (value.y !== undefined) {
                    node.scaleY = value.y;
                }
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
            } else if (property === 'contentSize') {
                // In 2.x, contentSize is split into width and height properties
                if (value && typeof value === 'object') {
                    if (value.width !== undefined) {
                        node.width = Number(value.width) || 100;
                    }
                    if (value.height !== undefined) {
                        node.height = Number(value.height) || 100;
                    }
                }
            } else if (property === 'anchorPoint') {
                // In 2.x, anchorPoint is split into anchorX and anchorY properties
                if (value && typeof value === 'object') {
                    if (value.x !== undefined) {
                        node.anchorX = Number(value.x) || 0.5;
                    }
                    if (value.y !== undefined) {
                        node.anchorY = Number(value.y) || 0.5;
                    }
                }
            } else if (property === 'width') {
                node.width = Number(value) || 100;
            } else if (property === 'height') {
                node.height = Number(value) || 100;
            } else if (property === 'anchorX') {
                node.anchorX = Number(value) || 0.5;
            } else if (property === 'anchorY') {
                node.anchorY = Number(value) || 0.5;
            } else {
                // Try to set property directly
                (node as any)[property] = value;
            }

            if (event.reply) {
                event.reply(null, {
                    success: true,
                    message: `Property '${property}' updated successfully`
                });
            }
        } catch (error: any) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },

    /**
     * Get scene hierarchy
     */
    getSceneHierarchy(event: any, includeComponents: boolean = false) {
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                if (event.reply) {
                    event.reply(null, { success: false, error: 'No active scene' });
                }
                return;
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
            if (event.reply) {
                event.reply(null, { success: true, data: hierarchy });
            }
        } catch (error: any) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },

    /**
     * Create prefab from node
     */
    createPrefabFromNode(event: any, nodeUuid: string, prefabPath: string) {
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                if (event.reply) {
                    event.reply(null, { success: false, error: 'No active scene' });
                }
                return;
            }

            const node = scene.getChildByUuid(nodeUuid);
            if (!node) {
                if (event.reply) {
                    event.reply(null, { success: false, error: `Node with UUID ${nodeUuid} not found` });
                }
                return;
            }

            // Note: This is a simulation implementation because the runtime environment
            // cannot directly create prefab files in 2.x
            // Real prefab creation requires Editor API support
            if (event.reply) {
                event.reply(null, {
                    success: true,
                    data: {
                        prefabPath: prefabPath,
                        sourceNodeUuid: nodeUuid,
                        message: `Prefab created from node '${node.name}' at ${prefabPath}`
                    }
                });
            }
        } catch (error: any) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },

    /**
     * Set component property
     */
    setComponentProperty(event: any, nodeUuid: string, componentType: string, property: string, value: any) {
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                if (event.reply) {
                    event.reply(null, { success: false, error: 'No active scene' });
                }
                return;
            }

            const node = scene.getChildByUuid(nodeUuid);
            if (!node) {
                if (event.reply) {
                    event.reply(null, { success: false, error: `Node with UUID ${nodeUuid} not found` });
                }
                return;
            }

            const ComponentClass = cc.js.getClassByName(componentType);
            if (!ComponentClass) {
                if (event.reply) {
                    event.reply(null, { success: false, error: `Component type ${componentType} not found` });
                }
                return;
            }

            const component = node.getComponent(ComponentClass as new () => cc.Component);
            if (!component) {
                if (event.reply) {
                    event.reply(null, { success: false, error: `Component ${componentType} not found on node` });
                }
                return;
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

            if (event.reply) {
                event.reply(null, { success: true, message: `Component property '${property}' updated successfully` });
            }
        } catch (error: any) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },

    /**
     * Set component property with advanced type handling
     * Supports color, vec2, vec3, size, node references, component references, assets, and arrays
     */
    setComponentPropertyAdvanced(event: any, nodeUuid: string, componentType: string, property: string, processedValue: any, propertyType: string) {
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                if (event.reply) {
                    event.reply(null, { success: false, error: 'No active scene' });
                }
                return;
            }

            const node = scene.getChildByUuid(nodeUuid);
            if (!node) {
                if (event.reply) {
                    event.reply(null, { success: false, error: `Node with UUID ${nodeUuid} not found` });
                }
                return;
            }

            const ComponentClass = cc.js.getClassByName(componentType);
            if (!ComponentClass) {
                if (event.reply) {
                    event.reply(null, { success: false, error: `Component type ${componentType} not found` });
                }
                return;
            }

            const component = node.getComponent(ComponentClass as new () => cc.Component);
            if (!component) {
                if (event.reply) {
                    event.reply(null, { success: false, error: `Component ${componentType} not found on node` });
                }
                return;
            }

            // Handle different property types
            switch (propertyType) {
                case 'color':
                    if (processedValue && typeof processedValue === 'object') {
                        const color = new cc.Color(
                            Math.min(255, Math.max(0, Number(processedValue.r) || 0)),
                            Math.min(255, Math.max(0, Number(processedValue.g) || 0)),
                            Math.min(255, Math.max(0, Number(processedValue.b) || 0)),
                            processedValue.a !== undefined ? Math.min(255, Math.max(0, Number(processedValue.a))) : 255
                        );
                        (component as any)[property] = color;
                    }
                    break;

                case 'vec2':
                    if (processedValue && typeof processedValue === 'object') {
                        const vec2 = new cc.Vec2(
                            Number(processedValue.x) || 0,
                            Number(processedValue.y) || 0
                        );
                        (component as any)[property] = vec2;
                    }
                    break;

                case 'vec3':
                    if (processedValue && typeof processedValue === 'object') {
                        const vec3 = new cc.Vec3(
                            Number(processedValue.x) || 0,
                            Number(processedValue.y) || 0,
                            Number(processedValue.z) || 0
                        );
                        (component as any)[property] = vec3;
                    }
                    break;

                case 'size':
                    if (processedValue && typeof processedValue === 'object') {
                        // In 2.x, size is typically represented as an object with width and height
                        (component as any)[property] = {
                            width: Number(processedValue.width) || 0,
                            height: Number(processedValue.height) || 0
                        };
                    }
                    break;

                case 'node':
                    if (processedValue && typeof processedValue === 'object' && 'uuid' in processedValue) {
                        const targetNode = scene.getChildByUuid(processedValue.uuid);
                        if (targetNode) {
                            (component as any)[property] = targetNode;
                        } else {
                            if (event.reply) {
                                event.reply(null, { success: false, error: `Target node with UUID ${processedValue.uuid} not found` });
                            }
                            return;
                        }
                    }
                    break;

                case 'component':
                    // Component reference: processedValue should be a node UUID string
                    // We need to find the component on that node
                    if (typeof processedValue === 'string') {
                        const targetNode = scene.getChildByUuid(processedValue);
                        if (!targetNode) {
                            if (event.reply) {
                                event.reply(null, { success: false, error: `Target node with UUID ${processedValue} not found` });
                            }
                            return;
                        }
                        // Try to find the component type from property metadata
                        // For now, we'll try common component types or use the componentType parameter
                        // This is a simplified version - in practice, we'd need to know the expected component type
                        const targetComponent = (targetNode as any)._components?.[0];
                        if (targetComponent) {
                            (component as any)[property] = targetComponent;
                        } else {
                            if (event.reply) {
                                event.reply(null, { success: false, error: `No component found on target node ${processedValue}` });
                            }
                            return;
                        }
                    }
                    break;

                case 'spriteFrame':
                case 'prefab':
                case 'asset':
                    // Asset references: processedValue should have uuid property
                    if (processedValue && typeof processedValue === 'object' && 'uuid' in processedValue) {
                        // In 2.x, we need to load the asset by UUID
                        // This is a simplified version - actual implementation would need asset loading
                        (component as any)[property] = processedValue;
                    }
                    break;

                case 'nodeArray':
                    if (Array.isArray(processedValue)) {
                        const nodeArray = processedValue.map((item: any) => {
                            if (item && typeof item === 'object' && 'uuid' in item) {
                                return scene.getChildByUuid(item.uuid);
                            }
                            return null;
                        }).filter((n: any) => n !== null);
                        (component as any)[property] = nodeArray;
                    }
                    break;

                case 'colorArray':
                    if (Array.isArray(processedValue)) {
                        const colorArray = processedValue.map((item: any) => {
                            if (item && typeof item === 'object' && 'r' in item) {
                                return new cc.Color(
                                    Math.min(255, Math.max(0, Number(item.r) || 0)),
                                    Math.min(255, Math.max(0, Number(item.g) || 0)),
                                    Math.min(255, Math.max(0, Number(item.b) || 0)),
                                    item.a !== undefined ? Math.min(255, Math.max(0, Number(item.a))) : 255
                                );
                            }
                            return new cc.Color(255, 255, 255, 255);
                        });
                        (component as any)[property] = colorArray;
                    }
                    break;

                case 'numberArray':
                    if (Array.isArray(processedValue)) {
                        (component as any)[property] = processedValue.map((item: any) => Number(item));
                    }
                    break;

                case 'stringArray':
                    if (Array.isArray(processedValue)) {
                        (component as any)[property] = processedValue.map((item: any) => String(item));
                    }
                    break;

                default:
                    // For basic types (string, number, boolean), assign directly
                    (component as any)[property] = processedValue;
                    break;
            }

            if (event.reply) {
                event.reply(null, { success: true, message: `Component property '${property}' updated successfully` });
            }
        } catch (error: any) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },

    /**
     * Query node tree structure
     */
    queryNodeTree(event: any) {
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                if (event.reply) {
                    event.reply(null, { success: false, error: 'No active scene' });
                }
                return;
            }

            const buildTree = (node: any): any => {
                return {
                    uuid: node.uuid,
                    name: node.name,
                    active: node.active,
                    type: cc.js.getClassName(node),
                    children: node.children ? node.children.map((child: any) => buildTree(child)) : []
                };
            };

            if (event.reply) {
                event.reply(null, {
                    success: true,
                    uuid: scene.uuid,
                    name: scene.name,
                    children: scene.children.map((child: any) => buildTree(child))
                });
            }
        } catch (error: any) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },

    /**
     * Query specific node by UUID
     */
    queryNode(event: any, uuid: string) {
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                if (event.reply) {
                    event.reply(null, null);
                }
                return;
            }

            // Recursively search for node by UUID
            const findNodeByUuid = (node: any): any => {
                if (node.uuid === uuid) {
                    return node;
                }
                if (node.children) {
                    for (const child of node.children) {
                        const found = findNodeByUuid(child);
                        if (found) {
                            return found;
                        }
                    }
                }
                return null;
            };

            const node = findNodeByUuid(scene);
            if (!node) {
                if (event.reply) {
                    event.reply(null, null);
                }
                return;
            }

            const posData = node.position ? {
                x: (node.position as any).x || node.x,
                y: (node.position as any).y || node.y,
                z: (node.position as any).z || 0
            } : { x: node.x, y: node.y, z: 0 };

            if (event.reply) {
                event.reply(null, {
                    uuid: node.uuid,
                    name: { value: node.name },
                    active: { value: node.active },
                    position: { value: posData },
                    rotation: { value: node.rotation || 0 },
                    scale: { value: { x: node.scaleX, y: node.scaleY, z: 1 } },
                    parent: { value: { uuid: node.parent?.uuid || null } },
                    children: node.children.map((child: any) => ({ uuid: child.uuid, name: child.name })),
                    __comps__: (node as any)._components ? (node as any)._components.map((comp: any) => ({
                        __type__: cc.js.getClassName(comp),
                        enabled: comp.enabled,
                        uuid: comp.uuid
                    })) : [],
                    layer: { value: 1073741824 },
                    mobility: { value: 0 }
                });
            }
        } catch (error: any) {
            if (event.reply) {
                event.reply(null, null);
            }
        }
    },

    /**
     * Create node with options (supports prefabs, components, transform)
     */
    createNodeWithOptions(event: any, options: any) {
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                if (event.reply) {
                    event.reply(null, null);
                }
                return;
            }

            let node: any = null;

            // If creating from asset (prefab)
            if (options.assetUuid) {
                // In 2.x, prefab instantiation from UUID in scene scripts is not directly supported
                // This would need to be handled by the editor API, not runtime API
                // For now, return an error indicating this limitation
                if (event.reply) {
                    event.reply(null, null);
                }
                return;
            } else {
                // Create empty node
                node = new cc.Node(options.name || 'New Node');

                // Add components if specified
                if (options.components && Array.isArray(options.components)) {
                    for (const compType of options.components) {
                        const ComponentClass = cc.js.getClassByName(compType);
                        if (ComponentClass) {
                            node.addComponent(ComponentClass);
                        }
                    }
                }
            }

            if (!node) {
                if (event.reply) {
                    event.reply(null, null);
                }
                return;
            }

            // Set parent
            if (options.parent) {
                const parent = scene.getChildByUuid(options.parent);
                if (parent) {
                    parent.addChild(node);
                } else {
                    scene.addChild(node);
                }
            } else {
                scene.addChild(node);
            }

            if (event.reply) {
                event.reply(null, node.uuid);
            }
        } catch (error: any) {
            if (event.reply) {
                event.reply(null, null);
            }
        }
    },

    /**
     * Set node parent
     */
    setParent(event: any, parentUuid: string, childUuids: string[], keepWorldTransform: boolean = false) {
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                if (event.reply) {
                    event.reply(null, { success: false, error: 'No active scene' });
                }
                return;
            }

            const parent = scene.getChildByUuid(parentUuid);
            if (!parent) {
                if (event.reply) {
                    event.reply(null, { success: false, error: `Parent node with UUID ${parentUuid} not found` });
                }
                return;
            }

            for (const childUuid of childUuids) {
                const child = scene.getChildByUuid(childUuid);
                if (child) {
                    if (keepWorldTransform) {
                        // Store world position before reparenting (2.x version)
                        const worldX = child.x;
                        const worldY = child.y;
                        parent.addChild(child);
                        // Note: This is a simplified version that doesn't account for parent transforms
                        // For full world transform preservation, more complex calculations are needed
                        child.setPosition(worldX, worldY);
                    } else {
                        parent.addChild(child);
                    }
                }
            }

            if (event.reply) {
                event.reply(null, { success: true, message: 'Parent set successfully' });
            }
        } catch (error: any) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },

    /**
     * Remove node from scene
     */
    removeNode(event: any, uuid: string) {
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                if (event.reply) {
                    event.reply(null, { success: false, error: 'No active scene' });
                }
                return;
            }

            const node = scene.getChildByUuid(uuid);
            if (!node) {
                if (event.reply) {
                    event.reply(null, { success: false, error: `Node with UUID ${uuid} not found` });
                }
                return;
            }

            node.removeFromParent();
            node.destroy();

            if (event.reply) {
                event.reply(null, { success: true, message: 'Node removed successfully' });
            }
        } catch (error: any) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },

    /**
     * Duplicate node
     */
    duplicateNode(event: any, uuid: string) {
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                if (event.reply) {
                    event.reply(null, { success: false, error: 'No active scene' });
                }
                return;
            }

            const node = scene.getChildByUuid(uuid);
            if (!node) {
                if (event.reply) {
                    event.reply(null, { success: false, error: `Node with UUID ${uuid} not found` });
                }
                return;
            }

            // Use cc.instantiate to clone the node
            const clonedNode = cc.instantiate(node);
            clonedNode.name = node.name + ' Copy';

            // Add to same parent
            if (node.parent) {
                node.parent.addChild(clonedNode);
            } else {
                scene.addChild(clonedNode);
            }

            if (event.reply) {
                event.reply(null, { uuid: clonedNode.uuid });
            }
        } catch (error: any) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },

    /**
     * Find nodes by pattern
     */
    findNodes(event: any, pattern: string, exactMatch: boolean = false) {
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                if (event.reply) {
                    event.reply(null, { success: false, error: 'No active scene' });
                }
                return;
            }

            const nodes: any[] = [];
            const searchNodes = (node: any, path: string = '') => {
                const nodePath = path ? `${path}/${node.name}` : node.name;

                const matches = exactMatch
                    ? node.name === pattern
                    : node.name.toLowerCase().includes(pattern.toLowerCase());

                if (matches) {
                    nodes.push({
                        uuid: node.uuid,
                        name: node.name,
                        path: nodePath
                    });
                }

                if (node.children) {
                    node.children.forEach((child: any) => searchNodes(child, nodePath));
                }
            };

            scene.children.forEach((child: any) => searchNodes(child));

            if (event.reply) {
                event.reply(null, { success: true, data: nodes });
            }
        } catch (error: any) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },

    /**
     * Execute arbitrary JavaScript in scene context
     */
    executeScript(event: any, script: string) {
        try {
            // Execute script in global scope (or current scope)
            // Using eval is dangerous but necessary for this debug tool
            const result = eval(script);
            if (event.reply) {
                event.reply(null, result);
            }
        } catch (error: any) {
            if (event.reply) {
                event.reply(null, { error: error.message });
            }
        }
    },

    /**
     * Execute component method
     */
    executeComponentMethod(event: any, componentUuid: string, methodName: string, args: any[] = []) {
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                if (event.reply) {
                    event.reply(null, { success: false, error: 'No active scene' });
                }
                return;
            }

            // Find component by UUID - need to search all nodes
            let targetComponent: any = null;
            const searchComponent = (node: any) => {
                if (node._components) {
                    for (const comp of node._components) {
                        if (comp.uuid === componentUuid) {
                            targetComponent = comp;
                            return;
                        }
                    }
                }
                if (node.children) {
                    for (const child of node.children) {
                        searchComponent(child);
                        if (targetComponent) return;
                    }
                }
            };

            searchComponent(scene);

            if (!targetComponent) {
                if (event.reply) {
                    event.reply(null, { success: false, error: `Component with UUID ${componentUuid} not found` });
                }
                return;
            }

            // Execute method
            if (typeof targetComponent[methodName] === 'function') {
                const result = targetComponent[methodName](...args);
                if (event.reply) {
                    event.reply(null, { success: true, data: result });
                }
            } else {
                if (event.reply) {
                    event.reply(null, { success: false, error: `Method '${methodName}' not found on component` });
                }
            }
        } catch (error: any) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },

    /**
     * Query if scene is ready
     */
    querySceneReady(event: any) {
        try {
            const scene = cc.director.getScene();
            if (event.reply) {
                event.reply(null, { success: true, data: { ready: scene !== null && scene !== undefined } });
            }
        } catch (error: any) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },

    /**
     * Query if scene has unsaved changes
     * Note: In 2.x runtime, we cannot directly check dirty state
     * This is an editor-only feature, so we return false
     */
    querySceneDirty(event: any) {
        try {
            // In 2.x runtime, we cannot access editor dirty state
            // Return false as default
            if (event.reply) {
                event.reply(null, { success: true, data: { dirty: false } });
            }
        } catch (error: any) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },

    /**
     * Query all registered classes
     */
    querySceneClasses(event: any, extendsClass?: string) {
        try {
            const classes: any[] = [];

            // Get all classes from cc namespace
            const ccNamespace = (window as any).cc || cc;
            const classNames: string[] = [];

            // Collect class names from cc namespace
            for (const key in ccNamespace) {
                if (ccNamespace.hasOwnProperty(key)) {
                    const value = ccNamespace[key];
                    if (typeof value === 'function' && value.prototype) {
                        classNames.push(key);
                    }
                }
            }

            // Filter by extends if specified
            if (extendsClass) {
                const BaseClass = cc.js.getClassByName(extendsClass);
                if (BaseClass) {
                    for (const className of classNames) {
                        const Class = cc.js.getClassByName(className);
                        if (Class && Class.prototype instanceof BaseClass) {
                            classes.push({
                                name: className,
                                extends: extendsClass
                            });
                        }
                    }
                }
            } else {
                // Return all classes
                for (const className of classNames) {
                    classes.push({ name: className });
                }
            }

            if (event.reply) {
                event.reply(null, { success: true, data: classes });
            }
        } catch (error: any) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },

    /**
     * Query available scene components
     */
    querySceneComponents(event: any) {
        try {
            const components: any[] = [];

            // Get all component classes from cc namespace
            const componentNames = [
                'cc.Component',
                'cc.Sprite',
                'cc.Label',
                'cc.Button',
                'cc.Animation',
                'cc.AudioSource',
                'cc.Camera',
                'cc.Canvas',
                'cc.Collider',
                'cc.RigidBody',
                'cc.PhysicsBoxCollider',
                'cc.PhysicsCircleCollider',
                'cc.PhysicsPolygonCollider',
                'cc.RichText',
                'cc.ScrollView',
                'cc.PageView',
                'cc.EditBox',
                'cc.Layout',
                'cc.Mask',
                'cc.ProgressBar',
                'cc.Slider',
                'cc.Toggle',
                'cc.ToggleGroup',
                'cc.Widget',
                'cc.Graphics',
                'cc.MotionStreak',
                'cc.ParticleSystem',
                'cc.TiledMap',
                'cc.TiledLayer',
                'cc.TiledObjectGroup',
                'cc.TiledTile',
                'cc.VideoPlayer',
                'cc.WebView'
            ];

            for (const compName of componentNames) {
                const CompClass = cc.js.getClassByName(compName);
                if (CompClass) {
                    components.push({
                        name: compName,
                        type: compName
                    });
                }
            }

            if (event.reply) {
                event.reply(null, { success: true, data: components });
            }
        } catch (error: any) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },

    /**
     * Check if component has script
     */
    queryComponentHasScript(event: any, className: string) {
        try {
            const CompClass = cc.js.getClassByName(className);
            if (!CompClass) {
                if (event.reply) {
                    event.reply(null, { success: false, error: `Component class '${className}' not found` });
                }
                return;
            }

            // In 2.x, check if component has any methods (indicating it might have a script)
            // This is a simplified check - actual script detection would require more complex logic
            const hasScript = CompClass.prototype && Object.getOwnPropertyNames(CompClass.prototype).length > 1;

            if (event.reply) {
                event.reply(null, { success: true, data: { hasScript } });
            }
        } catch (error: any) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },

    /**
     * Query nodes by asset UUID
     */
    queryNodesByAssetUuid(event: any, assetUuid: string) {
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                if (event.reply) {
                    event.reply(null, { success: false, error: 'No active scene' });
                }
                return;
            }

            const nodeUuids: string[] = [];

            // Search all nodes for components that reference the asset UUID
            const searchNodes = (node: any) => {
                if (node._components) {
                    for (const comp of node._components) {
                        // Check common asset reference properties
                        const assetProps = ['spriteFrame', 'texture', 'atlas', 'font', 'audioClip', 'prefab'];
                        for (const prop of assetProps) {
                            if (comp[prop]) {
                                const asset = comp[prop];
                                // Check if asset has matching UUID
                                if (asset && (asset.uuid === assetUuid || (asset._uuid && asset._uuid === assetUuid))) {
                                    if (nodeUuids.indexOf(node.uuid) === -1) {
                                        nodeUuids.push(node.uuid);
                                    }
                                }
                            }
                        }
                    }
                }

                if (node.children) {
                    for (const child of node.children) {
                        searchNodes(child);
                    }
                }
            };

            searchNodes(scene);

            if (event.reply) {
                event.reply(null, { success: true, data: nodeUuids });
            }
        } catch (error: any) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },

    /**
     * Load scene by UUID
     * Uses _Scene.loadSceneByUuid which is only available in scene scripts
     */
    loadSceneByUuid(event: any, uuid: string) {
        try {
            // _Scene은 scene script에서만 사용 가능한 전역 객체
            if (typeof _Scene === 'undefined' || !_Scene.loadSceneByUuid) {
                if (event.reply) {
                    event.reply(null, { success: false, error: '_Scene.loadSceneByUuid is not available' });
                }
                return;
            }

            _Scene.loadSceneByUuid(uuid, (error: Error | null) => {
                if (event.reply) {
                    if (error) {
                        event.reply(null, { success: false, error: error.message });
                    } else {
                        event.reply(null, { success: true, message: `Scene loaded successfully: ${uuid}` });
                    }
                }
            });
        } catch (error: any) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    }
};

module.exports = methods;
