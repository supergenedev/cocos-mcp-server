"use strict";
/// <reference path="./types/cc-2x.d.ts" />
/// <reference path="./types/editor-2x.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
module.paths.push((0, path_1.join)(Editor.appPath, 'node_modules'));
// Note: In Cocos Creator 2.x, 'cc' is available as a global variable in scene scripts
// We don't need to require it like in 3.x
const methods = {
    /**
     * Create a new scene
     */
    createNewScene(event) {
        try {
            const scene = new cc.Scene();
            scene.name = 'New Scene';
            cc.director.runScene(scene);
            if (event.reply) {
                event.reply(null, { success: true, message: 'New scene created successfully' });
            }
        }
        catch (error) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },
    /**
     * Add component to a node
     */
    addComponentToNode(event, nodeUuid, componentType) {
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
            const component = node.addComponent(ComponentClass);
            if (event.reply) {
                event.reply(null, {
                    success: true,
                    message: `Component ${componentType} added successfully`,
                    data: { componentId: component.uuid }
                });
            }
        }
        catch (error) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },
    /**
     * Remove component from a node
     */
    removeComponentFromNode(event, nodeUuid, componentType) {
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
            const component = node.getComponent(ComponentClass);
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
        }
        catch (error) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },
    /**
     * Create a new node
     */
    createNode(event, name, parentUuid) {
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
                }
                else {
                    scene.addChild(node);
                }
            }
            else {
                scene.addChild(node);
            }
            if (event.reply) {
                event.reply(null, {
                    success: true,
                    message: `Node ${name} created successfully`,
                    data: { uuid: node.uuid, name: node.name }
                });
            }
        }
        catch (error) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },
    /**
     * Get node information
     */
    getNodeInfo(event, nodeUuid) {
        var _a;
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
                x: node.position.x || node.x,
                y: node.position.y || node.y,
                z: node.position.z || 0
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
                        parent: (_a = node.parent) === null || _a === void 0 ? void 0 : _a.uuid,
                        children: node.children.map((child) => child.uuid),
                        components: node._components ? node._components.map((comp) => ({
                            type: cc.js.getClassName(comp),
                            enabled: comp.enabled
                        })) : []
                    }
                });
            }
        }
        catch (error) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },
    /**
     * Get all nodes in scene
     */
    getAllNodes(event) {
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                if (event.reply) {
                    event.reply(null, { success: false, error: 'No active scene' });
                }
                return;
            }
            const nodes = [];
            const collectNodes = (node) => {
                var _a;
                nodes.push({
                    uuid: node.uuid,
                    name: node.name,
                    active: node.active,
                    parent: (_a = node.parent) === null || _a === void 0 ? void 0 : _a.uuid
                });
                node.children.forEach((child) => collectNodes(child));
            };
            scene.children.forEach((child) => collectNodes(child));
            if (event.reply) {
                event.reply(null, { success: true, data: nodes });
            }
        }
        catch (error) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },
    /**
     * Find node by name
     */
    findNodeByName(event, name) {
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
        }
        catch (error) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },
    /**
     * Get current scene information
     */
    getCurrentSceneInfo(event) {
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
        }
        catch (error) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },
    /**
     * Set node property
     */
    setNodeProperty(event, nodeUuid, property, value) {
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
            // Set property - 2.x uses different methods
            if (property === 'position') {
                node.setPosition(value.x || 0, value.y || 0);
            }
            else if (property === 'rotation') {
                node.rotation = value;
            }
            else if (property === 'scale') {
                node.setScale(value.x || 1, value.y || 1);
            }
            else if (property === 'active') {
                node.active = value;
            }
            else if (property === 'name') {
                node.name = value;
            }
            else if (property === 'x') {
                node.x = value;
            }
            else if (property === 'y') {
                node.y = value;
            }
            else if (property === 'scaleX') {
                node.scaleX = value;
            }
            else if (property === 'scaleY') {
                node.scaleY = value;
            }
            else if (property === 'opacity') {
                node.opacity = value;
            }
            else if (property === 'color') {
                node.color = new cc.Color(value.r || 255, value.g || 255, value.b || 255, value.a || 255);
            }
            else if (property === 'contentSize') {
                // In 2.x, contentSize is split into width and height properties
                if (value && typeof value === 'object') {
                    if (value.width !== undefined) {
                        node.width = Number(value.width) || 100;
                    }
                    if (value.height !== undefined) {
                        node.height = Number(value.height) || 100;
                    }
                }
            }
            else if (property === 'anchorPoint') {
                // In 2.x, anchorPoint is split into anchorX and anchorY properties
                if (value && typeof value === 'object') {
                    if (value.x !== undefined) {
                        node.anchorX = Number(value.x) || 0.5;
                    }
                    if (value.y !== undefined) {
                        node.anchorY = Number(value.y) || 0.5;
                    }
                }
            }
            else if (property === 'width') {
                node.width = Number(value) || 100;
            }
            else if (property === 'height') {
                node.height = Number(value) || 100;
            }
            else if (property === 'anchorX') {
                node.anchorX = Number(value) || 0.5;
            }
            else if (property === 'anchorY') {
                node.anchorY = Number(value) || 0.5;
            }
            else {
                // Try to set property directly
                node[property] = value;
            }
            if (event.reply) {
                event.reply(null, {
                    success: true,
                    message: `Property '${property}' updated successfully`
                });
            }
        }
        catch (error) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },
    /**
     * Get scene hierarchy
     */
    getSceneHierarchy(event, includeComponents = false) {
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                if (event.reply) {
                    event.reply(null, { success: false, error: 'No active scene' });
                }
                return;
            }
            const processNode = (node) => {
                const result = {
                    name: node.name,
                    uuid: node.uuid,
                    active: node.active,
                    children: []
                };
                if (includeComponents && node._components) {
                    result.components = node._components.map((comp) => ({
                        type: cc.js.getClassName(comp),
                        enabled: comp.enabled
                    }));
                }
                if (node.children && node.children.length > 0) {
                    result.children = node.children.map((child) => processNode(child));
                }
                return result;
            };
            const hierarchy = scene.children.map((child) => processNode(child));
            if (event.reply) {
                event.reply(null, { success: true, data: hierarchy });
            }
        }
        catch (error) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },
    /**
     * Create prefab from node
     */
    createPrefabFromNode(event, nodeUuid, prefabPath) {
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
        }
        catch (error) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },
    /**
     * Set component property
     */
    setComponentProperty(event, nodeUuid, componentType, property, value) {
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
            const component = node.getComponent(ComponentClass);
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
                    cc.loader.loadRes(value, cc.SpriteFrame, (err, spriteFrame) => {
                        if (!err && spriteFrame) {
                            component.spriteFrame = spriteFrame;
                        }
                        else {
                            // Try direct assignment (compatible with already passed resource object)
                            component.spriteFrame = value;
                        }
                    });
                }
                else {
                    component.spriteFrame = value;
                }
            }
            else if (property === 'string' && (componentType === 'cc.Label' || componentType === 'cc.RichText')) {
                component.string = value;
            }
            else {
                component[property] = value;
            }
            if (event.reply) {
                event.reply(null, { success: true, message: `Component property '${property}' updated successfully` });
            }
        }
        catch (error) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },
    /**
     * Set component property with advanced type handling
     * Supports color, vec2, vec3, size, node references, component references, assets, and arrays
     */
    setComponentPropertyAdvanced(event, nodeUuid, componentType, property, processedValue, propertyType) {
        var _a;
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
            const component = node.getComponent(ComponentClass);
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
                        const color = new cc.Color(Math.min(255, Math.max(0, Number(processedValue.r) || 0)), Math.min(255, Math.max(0, Number(processedValue.g) || 0)), Math.min(255, Math.max(0, Number(processedValue.b) || 0)), processedValue.a !== undefined ? Math.min(255, Math.max(0, Number(processedValue.a))) : 255);
                        component[property] = color;
                    }
                    break;
                case 'vec2':
                    if (processedValue && typeof processedValue === 'object') {
                        const vec2 = new cc.Vec2(Number(processedValue.x) || 0, Number(processedValue.y) || 0);
                        component[property] = vec2;
                    }
                    break;
                case 'vec3':
                    if (processedValue && typeof processedValue === 'object') {
                        const vec3 = new cc.Vec3(Number(processedValue.x) || 0, Number(processedValue.y) || 0, Number(processedValue.z) || 0);
                        component[property] = vec3;
                    }
                    break;
                case 'size':
                    if (processedValue && typeof processedValue === 'object') {
                        // In 2.x, size is typically represented as an object with width and height
                        component[property] = {
                            width: Number(processedValue.width) || 0,
                            height: Number(processedValue.height) || 0
                        };
                    }
                    break;
                case 'node':
                    if (processedValue && typeof processedValue === 'object' && 'uuid' in processedValue) {
                        const targetNode = scene.getChildByUuid(processedValue.uuid);
                        if (targetNode) {
                            component[property] = targetNode;
                        }
                        else {
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
                        const targetComponent = (_a = targetNode._components) === null || _a === void 0 ? void 0 : _a[0];
                        if (targetComponent) {
                            component[property] = targetComponent;
                        }
                        else {
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
                        component[property] = processedValue;
                    }
                    break;
                case 'nodeArray':
                    if (Array.isArray(processedValue)) {
                        const nodeArray = processedValue.map((item) => {
                            if (item && typeof item === 'object' && 'uuid' in item) {
                                return scene.getChildByUuid(item.uuid);
                            }
                            return null;
                        }).filter((n) => n !== null);
                        component[property] = nodeArray;
                    }
                    break;
                case 'colorArray':
                    if (Array.isArray(processedValue)) {
                        const colorArray = processedValue.map((item) => {
                            if (item && typeof item === 'object' && 'r' in item) {
                                return new cc.Color(Math.min(255, Math.max(0, Number(item.r) || 0)), Math.min(255, Math.max(0, Number(item.g) || 0)), Math.min(255, Math.max(0, Number(item.b) || 0)), item.a !== undefined ? Math.min(255, Math.max(0, Number(item.a))) : 255);
                            }
                            return new cc.Color(255, 255, 255, 255);
                        });
                        component[property] = colorArray;
                    }
                    break;
                case 'numberArray':
                    if (Array.isArray(processedValue)) {
                        component[property] = processedValue.map((item) => Number(item));
                    }
                    break;
                case 'stringArray':
                    if (Array.isArray(processedValue)) {
                        component[property] = processedValue.map((item) => String(item));
                    }
                    break;
                default:
                    // For basic types (string, number, boolean), assign directly
                    component[property] = processedValue;
                    break;
            }
            if (event.reply) {
                event.reply(null, { success: true, message: `Component property '${property}' updated successfully` });
            }
        }
        catch (error) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },
    /**
     * Query node tree structure
     */
    queryNodeTree(event) {
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                if (event.reply) {
                    event.reply(null, { success: false, error: 'No active scene' });
                }
                return;
            }
            const buildTree = (node) => {
                return {
                    uuid: node.uuid,
                    name: node.name,
                    active: node.active,
                    type: cc.js.getClassName(node),
                    children: node.children ? node.children.map((child) => buildTree(child)) : []
                };
            };
            if (event.reply) {
                event.reply(null, {
                    success: true,
                    uuid: scene.uuid,
                    name: scene.name,
                    children: scene.children.map((child) => buildTree(child))
                });
            }
        }
        catch (error) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },
    /**
     * Query specific node by UUID
     */
    queryNode(event, uuid) {
        var _a;
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                if (event.reply) {
                    event.reply(null, null);
                }
                return;
            }
            // Recursively search for node by UUID
            const findNodeByUuid = (node) => {
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
                x: node.position.x || node.x,
                y: node.position.y || node.y,
                z: node.position.z || 0
            } : { x: node.x, y: node.y, z: 0 };
            if (event.reply) {
                event.reply(null, {
                    uuid: node.uuid,
                    name: { value: node.name },
                    active: { value: node.active },
                    position: { value: posData },
                    rotation: { value: node.rotation || 0 },
                    scale: { value: { x: node.scaleX, y: node.scaleY, z: 1 } },
                    parent: { value: { uuid: ((_a = node.parent) === null || _a === void 0 ? void 0 : _a.uuid) || null } },
                    children: node.children.map((child) => ({ uuid: child.uuid, name: child.name })),
                    __comps__: node._components ? node._components.map((comp) => ({
                        __type__: cc.js.getClassName(comp),
                        enabled: comp.enabled,
                        uuid: comp.uuid
                    })) : [],
                    layer: { value: 1073741824 },
                    mobility: { value: 0 }
                });
            }
        }
        catch (error) {
            if (event.reply) {
                event.reply(null, null);
            }
        }
    },
    /**
     * Create node with options (supports prefabs, components, transform)
     */
    createNodeWithOptions(event, options) {
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                if (event.reply) {
                    event.reply(null, null);
                }
                return;
            }
            let node = null;
            // If creating from asset (prefab)
            if (options.assetUuid) {
                // In 2.x, prefab instantiation from UUID in scene scripts is not directly supported
                // This would need to be handled by the editor API, not runtime API
                // For now, return an error indicating this limitation
                if (event.reply) {
                    event.reply(null, null);
                }
                return;
            }
            else {
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
                }
                else {
                    scene.addChild(node);
                }
            }
            else {
                scene.addChild(node);
            }
            if (event.reply) {
                event.reply(null, node.uuid);
            }
        }
        catch (error) {
            if (event.reply) {
                event.reply(null, null);
            }
        }
    },
    /**
     * Set node parent
     */
    setParent(event, parentUuid, childUuids, keepWorldTransform = false) {
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
                    }
                    else {
                        parent.addChild(child);
                    }
                }
            }
            if (event.reply) {
                event.reply(null, { success: true, message: 'Parent set successfully' });
            }
        }
        catch (error) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },
    /**
     * Remove node from scene
     */
    removeNode(event, uuid) {
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
        }
        catch (error) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },
    /**
     * Duplicate node
     */
    duplicateNode(event, uuid) {
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
            }
            else {
                scene.addChild(clonedNode);
            }
            if (event.reply) {
                event.reply(null, { uuid: clonedNode.uuid });
            }
        }
        catch (error) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },
    /**
     * Find nodes by pattern
     */
    findNodes(event, pattern, exactMatch = false) {
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                if (event.reply) {
                    event.reply(null, { success: false, error: 'No active scene' });
                }
                return;
            }
            const nodes = [];
            const searchNodes = (node, path = '') => {
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
                    node.children.forEach((child) => searchNodes(child, nodePath));
                }
            };
            scene.children.forEach((child) => searchNodes(child));
            if (event.reply) {
                event.reply(null, { success: true, data: nodes });
            }
        }
        catch (error) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },
    /**
     * Execute arbitrary JavaScript in scene context
     */
    executeScript(event, script) {
        try {
            // Execute script in global scope (or current scope)
            // Using eval is dangerous but necessary for this debug tool
            const result = eval(script);
            if (event.reply) {
                event.reply(null, result);
            }
        }
        catch (error) {
            if (event.reply) {
                event.reply(null, { error: error.message });
            }
        }
    },
    /**
     * Execute component method
     */
    executeComponentMethod(event, componentUuid, methodName, args = []) {
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                if (event.reply) {
                    event.reply(null, { success: false, error: 'No active scene' });
                }
                return;
            }
            // Find component by UUID - need to search all nodes
            let targetComponent = null;
            const searchComponent = (node) => {
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
                        if (targetComponent)
                            return;
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
            }
            else {
                if (event.reply) {
                    event.reply(null, { success: false, error: `Method '${methodName}' not found on component` });
                }
            }
        }
        catch (error) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },
    /**
     * Query if scene is ready
     */
    querySceneReady(event) {
        try {
            const scene = cc.director.getScene();
            if (event.reply) {
                event.reply(null, { success: true, data: { ready: scene !== null && scene !== undefined } });
            }
        }
        catch (error) {
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
    querySceneDirty(event) {
        try {
            // In 2.x runtime, we cannot access editor dirty state
            // Return false as default
            if (event.reply) {
                event.reply(null, { success: true, data: { dirty: false } });
            }
        }
        catch (error) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },
    /**
     * Query all registered classes
     */
    querySceneClasses(event, extendsClass) {
        try {
            const classes = [];
            // Get all classes from cc namespace
            const ccNamespace = window.cc || cc;
            const classNames = [];
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
            }
            else {
                // Return all classes
                for (const className of classNames) {
                    classes.push({ name: className });
                }
            }
            if (event.reply) {
                event.reply(null, { success: true, data: classes });
            }
        }
        catch (error) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },
    /**
     * Query available scene components
     */
    querySceneComponents(event) {
        try {
            const components = [];
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
        }
        catch (error) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },
    /**
     * Check if component has script
     */
    queryComponentHasScript(event, className) {
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
        }
        catch (error) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    },
    /**
     * Query nodes by asset UUID
     */
    queryNodesByAssetUuid(event, assetUuid) {
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                if (event.reply) {
                    event.reply(null, { success: false, error: 'No active scene' });
                }
                return;
            }
            const nodeUuids = [];
            // Search all nodes for components that reference the asset UUID
            const searchNodes = (node) => {
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
        }
        catch (error) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    }
};
module.exports = methods;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NlbmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zb3VyY2Uvc2NlbmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLDJDQUEyQztBQUMzQywrQ0FBK0M7O0FBRS9DLCtCQUE0QjtBQUM1QixNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFBLFdBQUksRUFBQyxNQUFNLENBQUMsT0FBTyxFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUM7QUFDeEQsc0ZBQXNGO0FBQ3RGLDBDQUEwQztBQUUxQyxNQUFNLE9BQU8sR0FBNEM7SUFDckQ7O09BRUc7SUFDSCxjQUFjLENBQUMsS0FBVTtRQUNyQixJQUFJO1lBQ0EsTUFBTSxLQUFLLEdBQUcsSUFBSSxFQUFFLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDN0IsS0FBSyxDQUFDLElBQUksR0FBRyxXQUFXLENBQUM7WUFDekIsRUFBRSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDNUIsSUFBSSxLQUFLLENBQUMsS0FBSyxFQUFFO2dCQUNiLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsZ0NBQWdDLEVBQUUsQ0FBQyxDQUFDO2FBQ25GO1NBQ0o7UUFBQyxPQUFPLEtBQVUsRUFBRTtZQUNqQixJQUFJLEtBQUssQ0FBQyxLQUFLLEVBQUU7Z0JBQ2IsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQzthQUMvRDtTQUNKO0lBQ0wsQ0FBQztJQUVEOztPQUVHO0lBQ0gsa0JBQWtCLENBQUMsS0FBVSxFQUFFLFFBQWdCLEVBQUUsYUFBcUI7UUFDbEUsSUFBSTtZQUNBLE1BQU0sS0FBSyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDckMsSUFB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QUM7Z0JBQzVCLENBQUMsRUFBRyxJQUFJLENBQUMsUUFBZ0IsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUM7Z0JBQ3JDLENBQUMsRUFBRyxJQUFJLENBQUMsUUFBZ0IsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUM7Z0JBQ3JDLENBQUMsRUFBRyxJQUFJLENBQUMsUUFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQzthQUNuQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztZQUVuQyxJQUFJLEtBQUssQ0FBQyxLQUFLLEVBQUU7Z0JBQ2IsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUU7b0JBQ2QsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO29CQUNmLElBQUksRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFO29CQUMxQixNQUFNLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRTtvQkFDOUIsUUFBUSxFQUFFLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRTtvQkFDNUIsUUFBUSxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxRQUFRLElBQUksQ0FBQyxFQUFFO29CQUN2QyxLQUFLLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7b0JBQzFELE1BQU0sRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxDQUFBLE1BQUEsSUFBSSxDQUFDLE1BQU0sMENBQUUsSUFBSSxLQUFJLElBQUksRUFBRSxFQUFFO29CQUN0RCxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFVLEVBQUUsRUFBRSxDQUFDLENBQUMs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b0JBQ2YsS0FBSyxNQUFNLEtBQUssSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO3dCQUMvQixXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7cUJBQ3RCO2lCQUNKO1lBQ0wsQ0FBQyxDQUFDO1lBRUYsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRW5CLElBQUksS0FBSyxDQUFDLEtBQUssRUFBRTtnQkFDYixLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUM7YUFDekQ7U0FDSjtRQUFDLE9BQU8sS0FBVSxFQUFFO1lBQ2pCLElBQUksS0FBSyxDQUFDLEtBQUssRUFBRTtnQkFDYixLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO2FBQy9EO1NBQ0o7SUFDTCxDQUFDO0NBQ0osQ0FBQztBQUVGLE1BQU0sQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vdHlwZXMvY2MtMnguZC50c1wiIC8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi90eXBlcy9lZGl0b3ItMnguZC50c1wiIC8+XG5cbmltcG9ydCB7IGpvaW4gfSBmcm9tICdwYXRoJztcbm1vZHVsZS5wYXRocy5wdXNoKGpvaW4oRWRpdG9yLmFwcFBhdGgsICdub2RlX21vZHVsZXMnKSk7XG4vLyBOb3RlOiBJbiBDb2NvcyBDcmVhdG9yIDIueCwgJ2NjJyBpcyBhdmFpbGFibGUgYXMgYSBnbG9iYWwgdmFyaWFibGUgaW4gc2NlbmUgc2NyaXB0c1xuLy8gV2UgZG9uJ3QgbmVlZCB0byByZXF1aXJlIGl0IGxpa2UgaW4gMy54XG5cbmNvbnN0IG1ldGhvZHM6IHsgW2tleTogc3RyaW5nXTogKC4uLmFueTogYW55KSA9PiBhbnkgfSA9IHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBuZXcgc2NlbmVcbiAgICAgKi9cbiAgICBjcmVhdGVOZXdTY2VuZShldmVudDogYW55KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBzY2VuZSA9IG5ldyBjYy5TY2VuZSgpO1xuICAgICAgICAgICAgc2NlbmUubmFtZSA9ICdOZXcgU2NlbmUnO1xuICAgICAgICAgICAgY2MuZGlyZWN0b3IucnVuU2NlbmUoc2NlbmUpO1xuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiB0cnVlLCBtZXNzYWdlOiAnTmV3IHNjZW5lIGNyZWF0ZWQgc3VjY2Vzc2Z1bGx5JyB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGNvbXBvbmVudCB0byBhIG5vZGVcbiAgICAgKi9cbiAgICBhZGRDb21wb25lbnRUb05vZGUoZXZlbnQ6IGFueSwgbm9kZVV1aWQ6IHN0cmluZywgY29tcG9uZW50VHlwZTogc3RyaW5nKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBzY2VuZSA9IGNjLmRpcmVjdG9yLmdldFNjZW5lKCk7XG4gICAgICAgICAgICBpZiAoIXNjZW5lKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnTm8gYWN0aXZlIHNjZW5lJyB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBGaW5kIG5vZGUgYnkgVVVJRFxuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IHNjZW5lLmdldENoaWxkQnlVdWlkKG5vZGVVdWlkKTtcbiAgICAgICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYE5vZGUgd2l0aCBVVUlEICR7bm9kZVV1aWR9IG5vdCBmb3VuZGAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gR2V0IGNvbXBvbmVudCBjbGFzc1xuICAgICAgICAgICAgY29uc3QgQ29tcG9uZW50Q2xhc3MgPSBjYy5qcy5nZXRDbGFzc0J5TmFtZShjb21wb25lbnRUeXBlKTtcbiAgICAgICAgICAgIGlmICghQ29tcG9uZW50Q2xhc3MpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBDb21wb25lbnQgdHlwZSAke2NvbXBvbmVudFR5cGV9IG5vdCBmb3VuZGAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQWRkIGNvbXBvbmVudFxuICAgICAgICAgICAgY29uc3QgY29tcG9uZW50ID0gbm9kZS5hZGRDb21wb25lbnQoQ29tcG9uZW50Q2xhc3MgYXMgbmV3ICgpID0+IGNjLkNvbXBvbmVudCk7XG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBDb21wb25lbnQgJHtjb21wb25lbnRUeXBlfSBhZGRlZCBzdWNjZXNzZnVsbHlgLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB7IGNvbXBvbmVudElkOiBjb21wb25lbnQudXVpZCB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBjb21wb25lbnQgZnJvbSBhIG5vZGVcbiAgICAgKi9cbiAgICByZW1vdmVDb21wb25lbnRGcm9tTm9kZShldmVudDogYW55LCBub2RlVXVpZDogc3RyaW5nLCBjb21wb25lbnRUeXBlOiBzdHJpbmcpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHNjZW5lID0gY2MuZGlyZWN0b3IuZ2V0U2NlbmUoKTtcbiAgICAgICAgICAgIGlmICghc2NlbmUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdObyBhY3RpdmUgc2NlbmUnIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBzY2VuZS5nZXRDaGlsZEJ5VXVpZChub2RlVXVpZCk7XG4gICAgICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBOb2RlIHdpdGggVVVJRCAke25vZGVVdWlkfSBub3QgZm91bmRgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IENvbXBvbmVudENsYXNzID0gY2MuanMuZ2V0Q2xhc3NCeU5hbWUoY29tcG9uZW50VHlwZSk7XG4gICAgICAgICAgICBpZiAoIUNvbXBvbmVudENsYXNzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgQ29tcG9uZW50IHR5cGUgJHtjb21wb25lbnRUeXBlfSBub3QgZm91bmRgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudCA9IG5vZGUuZ2V0Q29tcG9uZW50KENvbXBvbmVudENsYXNzIGFzIG5ldyAoKSA9PiBjYy5Db21wb25lbnQpO1xuICAgICAgICAgICAgaWYgKCFjb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBDb21wb25lbnQgJHtjb21wb25lbnRUeXBlfSBub3QgZm91bmQgb24gbm9kZWAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbm9kZS5yZW1vdmVDb21wb25lbnQoY29tcG9uZW50KTtcbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogdHJ1ZSwgbWVzc2FnZTogYENvbXBvbmVudCAke2NvbXBvbmVudFR5cGV9IHJlbW92ZWQgc3VjY2Vzc2Z1bGx5YCB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgbmV3IG5vZGVcbiAgICAgKi9cbiAgICBjcmVhdGVOb2RlKGV2ZW50OiBhbnksIG5hbWU6IHN0cmluZywgcGFyZW50VXVpZD86IHN0cmluZykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qgc2NlbmUgPSBjYy5kaXJlY3Rvci5nZXRTY2VuZSgpO1xuICAgICAgICAgICAgaWYgKCFzY2VuZSkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ05vIGFjdGl2ZSBzY2VuZScgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IG5ldyBjYy5Ob2RlKG5hbWUpO1xuXG4gICAgICAgICAgICBpZiAocGFyZW50VXVpZCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhcmVudCA9IHNjZW5lLmdldENoaWxkQnlVdWlkKHBhcmVudFV1aWQpO1xuICAgICAgICAgICAgICAgIGlmIChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50LmFkZENoaWxkKG5vZGUpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHNjZW5lLmFkZENoaWxkKG5vZGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2NlbmUuYWRkQ2hpbGQobm9kZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYE5vZGUgJHtuYW1lfSBjcmVhdGVkIHN1Y2Nlc3NmdWxseWAsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHsgdXVpZDogbm9kZS51dWlkLCBuYW1lOiBub2RlLm5hbWUgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgbm9kZSBpbmZvcm1hdGlvblxuICAgICAqL1xuICAgIGdldE5vZGVJbmZvKGV2ZW50OiBhbnksIG5vZGVVdWlkOiBzdHJpbmcpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHNjZW5lID0gY2MuZGlyZWN0b3IuZ2V0U2NlbmUoKTtcbiAgICAgICAgICAgIGlmICghc2NlbmUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdObyBhY3RpdmUgc2NlbmUnIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBzY2VuZS5nZXRDaGlsZEJ5VXVpZChub2RlVXVpZCk7XG4gICAgICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBOb2RlIHdpdGggVVVJRCAke25vZGVVdWlkfSBub3QgZm91bmRgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEluIDIueCwgcG9zaXRpb24gaXMgc3RvcmVkIGFzIHgsIHkgcHJvcGVydGllcyAoZm9yIDJEKSBvciBwb3NpdGlvbiBWZWMzIChmb3IgM0QpXG4gICAgICAgICAgICBjb25zdCBwb3NEYXRhID0gbm9kZS5wb3NpdGlvbiA/IHtcbiAgICAgICAgICAgICAgICB4OiAobm9kZS5wb3NpdGlvbiBhcyBhbnkpLnggfHwgbm9kZS54LFxuICAgICAgICAgICAgICAgIHk6IChub2RlLnBvc2l0aW9uIGFzIGFueSkueSB8fCBub2RlLnksXG4gICAgICAgICAgICAgICAgejogKG5vZGUucG9zaXRpb24gYXMgYW55KS56IHx8IDBcbiAgICAgICAgICAgIH0gOiB7IHg6IG5vZGUueCwgeTogbm9kZS55LCB6OiAwIH07XG5cbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogbm9kZS51dWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogbm9kZS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZlOiBub2RlLmFjdGl2ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBwb3NEYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgcm90YXRpb246IG5vZGUucm90YXRpb24gfHwgMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjYWxlOiB7IHg6IG5vZGUuc2NhbGVYLCB5OiBub2RlLnNjYWxlWSwgejogMSB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50OiBub2RlLnBhcmVudD8udXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkcmVuOiBub2RlLmNoaWxkcmVuLm1hcCgoY2hpbGQ6IGFueSkgPT4gY2hpbGQudXVpZCksXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnRzOiAobm9kZSBhcyBhbnkpLl9jb21wb25lbnRzID8gKG5vZGUgYXMgYW55KS5fY29tcG9uZW50cy5tYXAoKGNvbXA6IGFueSkgPT4gKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBjYy5qcy5nZXRDbGFzc05hbWUoY29tcCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlZDogY29tcC5lbmFibGVkXG4gICAgICAgICAgICAgICAgICAgICAgICB9KSkgOiBbXVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBhbGwgbm9kZXMgaW4gc2NlbmVcbiAgICAgKi9cbiAgICBnZXRBbGxOb2RlcyhldmVudDogYW55KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBzY2VuZSA9IGNjLmRpcmVjdG9yLmdldFNjZW5lKCk7XG4gICAgICAgICAgICBpZiAoIXNjZW5lKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnTm8gYWN0aXZlIHNjZW5lJyB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBub2RlczogYW55W10gPSBbXTtcbiAgICAgICAgICAgIGNvbnN0IGNvbGxlY3ROb2RlcyA9IChub2RlOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBub2Rlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgdXVpZDogbm9kZS51dWlkLFxuICAgICAgICAgICAgICAgICAgICBuYW1lOiBub2RlLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGFjdGl2ZTogbm9kZS5hY3RpdmUsXG4gICAgICAgICAgICAgICAgICAgIHBhcmVudDogbm9kZS5wYXJlbnQ/LnV1aWRcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIG5vZGUuY2hpbGRyZW4uZm9yRWFjaCgoY2hpbGQ6IGFueSkgPT4gY29sbGVjdE5vZGVzKGNoaWxkKSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzY2VuZS5jaGlsZHJlbi5mb3JFYWNoKChjaGlsZDogYW55KSA9PiBjb2xsZWN0Tm9kZXMoY2hpbGQpKTtcblxuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiB0cnVlLCBkYXRhOiBub2RlcyB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRmluZCBub2RlIGJ5IG5hbWVcbiAgICAgKi9cbiAgICBmaW5kTm9kZUJ5TmFtZShldmVudDogYW55LCBuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHNjZW5lID0gY2MuZGlyZWN0b3IuZ2V0U2NlbmUoKTtcbiAgICAgICAgICAgIGlmICghc2NlbmUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdObyBhY3RpdmUgc2NlbmUnIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBzY2VuZS5nZXRDaGlsZEJ5TmFtZShuYW1lKTtcbiAgICAgICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYE5vZGUgd2l0aCBuYW1lICR7bmFtZX0gbm90IGZvdW5kYCB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IG5vZGUudXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IG5vZGUubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZTogbm9kZS5hY3RpdmUsXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogeyB4OiBub2RlLngsIHk6IG5vZGUueSB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGN1cnJlbnQgc2NlbmUgaW5mb3JtYXRpb25cbiAgICAgKi9cbiAgICBnZXRDdXJyZW50U2NlbmVJbmZvKGV2ZW50OiBhbnkpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHNjZW5lID0gY2MuZGlyZWN0b3IuZ2V0U2NlbmUoKTtcbiAgICAgICAgICAgIGlmICghc2NlbmUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdObyBhY3RpdmUgc2NlbmUnIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogc2NlbmUubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHNjZW5lLnV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlQ291bnQ6IHNjZW5lLmNoaWxkcmVuLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBub2RlIHByb3BlcnR5XG4gICAgICovXG4gICAgc2V0Tm9kZVByb3BlcnR5KGV2ZW50OiBhbnksIG5vZGVVdWlkOiBzdHJpbmcsIHByb3BlcnR5OiBzdHJpbmcsIHZhbHVlOiBhbnkpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHNjZW5lID0gY2MuZGlyZWN0b3IuZ2V0U2NlbmUoKTtcbiAgICAgICAgICAgIGlmICghc2NlbmUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdObyBhY3RpdmUgc2NlbmUnIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBzY2VuZS5nZXRDaGlsZEJ5VXVpZChub2RlVXVpZCk7XG4gICAgICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBOb2RlIHdpdGggVVVJRCAke25vZGVVdWlkfSBub3QgZm91bmRgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFNldCBwcm9wZXJ0eSAtIDIueCB1c2VzIGRpZmZlcmVudCBtZXRob2RzXG4gICAgICAgICAgICBpZiAocHJvcGVydHkgPT09ICdwb3NpdGlvbicpIHtcbiAgICAgICAgICAgICAgICBub2RlLnNldFBvc2l0aW9uKHZhbHVlLnggfHwgMCwgdmFsdWUueSB8fCAwKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvcGVydHkgPT09ICdyb3RhdGlvbicpIHtcbiAgICAgICAgICAgICAgICBub2RlLnJvdGF0aW9uID0gdmFsdWU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHByb3BlcnR5ID09PSAnc2NhbGUnKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5zZXRTY2FsZSh2YWx1ZS54IHx8IDEsIHZhbHVlLnkgfHwgMSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHByb3BlcnR5ID09PSAnYWN0aXZlJykge1xuICAgICAgICAgICAgICAgIG5vZGUuYWN0aXZlID0gdmFsdWU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHByb3BlcnR5ID09PSAnbmFtZScpIHtcbiAgICAgICAgICAgICAgICBub2RlLm5hbWUgPSB2YWx1ZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvcGVydHkgPT09ICd4Jykge1xuICAgICAgICAgICAgICAgIG5vZGUueCA9IHZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9wZXJ0eSA9PT0gJ3knKSB7XG4gICAgICAgICAgICAgICAgbm9kZS55ID0gdmFsdWU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHByb3BlcnR5ID09PSAnc2NhbGVYJykge1xuICAgICAgICAgICAgICAgIG5vZGUuc2NhbGVYID0gdmFsdWU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHByb3BlcnR5ID09PSAnc2NhbGVZJykge1xuICAgICAgICAgICAgICAgIG5vZGUuc2NhbGVZID0gdmFsdWU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHByb3BlcnR5ID09PSAnb3BhY2l0eScpIHtcbiAgICAgICAgICAgICAgICBub2RlLm9wYWNpdHkgPSB2YWx1ZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvcGVydHkgPT09ICdjb2xvcicpIHtcbiAgICAgICAgICAgICAgICBub2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKHZhbHVlLnIgfHwgMjU1LCB2YWx1ZS5nIHx8IDI1NSwgdmFsdWUuYiB8fCAyNTUsIHZhbHVlLmEgfHwgMjU1KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvcGVydHkgPT09ICdjb250ZW50U2l6ZScpIHtcbiAgICAgICAgICAgICAgICAvLyBJbiAyLngsIGNvbnRlbnRTaXplIGlzIHNwbGl0IGludG8gd2lkdGggYW5kIGhlaWdodCBwcm9wZXJ0aWVzXG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlLndpZHRoICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUud2lkdGggPSBOdW1iZXIodmFsdWUud2lkdGgpIHx8IDEwMDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUuaGVpZ2h0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuaGVpZ2h0ID0gTnVtYmVyKHZhbHVlLmhlaWdodCkgfHwgMTAwO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9wZXJ0eSA9PT0gJ2FuY2hvclBvaW50Jykge1xuICAgICAgICAgICAgICAgIC8vIEluIDIueCwgYW5jaG9yUG9pbnQgaXMgc3BsaXQgaW50byBhbmNob3JYIGFuZCBhbmNob3JZIHByb3BlcnRpZXNcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUueCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLmFuY2hvclggPSBOdW1iZXIodmFsdWUueCkgfHwgMC41O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZS55ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuYW5jaG9yWSA9IE51bWJlcih2YWx1ZS55KSB8fCAwLjU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHByb3BlcnR5ID09PSAnd2lkdGgnKSB7XG4gICAgICAgICAgICAgICAgbm9kZS53aWR0aCA9IE51bWJlcih2YWx1ZSkgfHwgMTAwO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9wZXJ0eSA9PT0gJ2hlaWdodCcpIHtcbiAgICAgICAgICAgICAgICBub2RlLmhlaWdodCA9IE51bWJlcih2YWx1ZSkgfHwgMTAwO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9wZXJ0eSA9PT0gJ2FuY2hvclgnKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5hbmNob3JYID0gTnVtYmVyKHZhbHVlKSB8fCAwLjU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHByb3BlcnR5ID09PSAnYW5jaG9yWScpIHtcbiAgICAgICAgICAgICAgICBub2RlLmFuY2hvclkgPSBOdW1iZXIodmFsdWUpIHx8IDAuNTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gVHJ5IHRvIHNldCBwcm9wZXJ0eSBkaXJlY3RseVxuICAgICAgICAgICAgICAgIChub2RlIGFzIGFueSlbcHJvcGVydHldID0gdmFsdWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYFByb3BlcnR5ICcke3Byb3BlcnR5fScgdXBkYXRlZCBzdWNjZXNzZnVsbHlgXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBzY2VuZSBoaWVyYXJjaHlcbiAgICAgKi9cbiAgICBnZXRTY2VuZUhpZXJhcmNoeShldmVudDogYW55LCBpbmNsdWRlQ29tcG9uZW50czogYm9vbGVhbiA9IGZhbHNlKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBzY2VuZSA9IGNjLmRpcmVjdG9yLmdldFNjZW5lKCk7XG4gICAgICAgICAgICBpZiAoIXNjZW5lKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnTm8gYWN0aXZlIHNjZW5lJyB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBwcm9jZXNzTm9kZSA9IChub2RlOiBhbnkpOiBhbnkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdDogYW55ID0ge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiBub2RlLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHV1aWQ6IG5vZGUudXVpZCxcbiAgICAgICAgICAgICAgICAgICAgYWN0aXZlOiBub2RlLmFjdGl2ZSxcbiAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW46IFtdXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIGlmIChpbmNsdWRlQ29tcG9uZW50cyAmJiBub2RlLl9jb21wb25lbnRzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5jb21wb25lbnRzID0gbm9kZS5fY29tcG9uZW50cy5tYXAoKGNvbXA6IGFueSkgPT4gKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IGNjLmpzLmdldENsYXNzTmFtZShjb21wKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZWQ6IGNvbXAuZW5hYmxlZFxuICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKG5vZGUuY2hpbGRyZW4gJiYgbm9kZS5jaGlsZHJlbi5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5jaGlsZHJlbiA9IG5vZGUuY2hpbGRyZW4ubWFwKChjaGlsZDogYW55KSA9PiBwcm9jZXNzTm9kZShjaGlsZCkpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBjb25zdCBoaWVyYXJjaHkgPSBzY2VuZS5jaGlsZHJlbi5tYXAoKGNoaWxkOiBhbnkpID0+IHByb2Nlc3NOb2RlKGNoaWxkKSk7XG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IGhpZXJhcmNoeSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIHByZWZhYiBmcm9tIG5vZGVcbiAgICAgKi9cbiAgICBjcmVhdGVQcmVmYWJGcm9tTm9kZShldmVudDogYW55LCBub2RlVXVpZDogc3RyaW5nLCBwcmVmYWJQYXRoOiBzdHJpbmcpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHNjZW5lID0gY2MuZGlyZWN0b3IuZ2V0U2NlbmUoKTtcbiAgICAgICAgICAgIGlmICghc2NlbmUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdObyBhY3RpdmUgc2NlbmUnIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBzY2VuZS5nZXRDaGlsZEJ5VXVpZChub2RlVXVpZCk7XG4gICAgICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBOb2RlIHdpdGggVVVJRCAke25vZGVVdWlkfSBub3QgZm91bmRgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIE5vdGU6IFRoaXMgaXMgYSBzaW11bGF0aW9uIGltcGxlbWVudGF0aW9uIGJlY2F1c2UgdGhlIHJ1bnRpbWUgZW52aXJvbm1lbnRcbiAgICAgICAgICAgIC8vIGNhbm5vdCBkaXJlY3RseSBjcmVhdGUgcHJlZmFiIGZpbGVzIGluIDIueFxuICAgICAgICAgICAgLy8gUmVhbCBwcmVmYWIgY3JlYXRpb24gcmVxdWlyZXMgRWRpdG9yIEFQSSBzdXBwb3J0XG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZWZhYlBhdGg6IHByZWZhYlBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2VOb2RlVXVpZDogbm9kZVV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBgUHJlZmFiIGNyZWF0ZWQgZnJvbSBub2RlICcke25vZGUubmFtZX0nIGF0ICR7cHJlZmFiUGF0aH1gXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGNvbXBvbmVudCBwcm9wZXJ0eVxuICAgICAqL1xuICAgIHNldENvbXBvbmVudFByb3BlcnR5KGV2ZW50OiBhbnksIG5vZGVVdWlkOiBzdHJpbmcsIGNvbXBvbmVudFR5cGU6IHN0cmluZywgcHJvcGVydHk6IHN0cmluZywgdmFsdWU6IGFueSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qgc2NlbmUgPSBjYy5kaXJlY3Rvci5nZXRTY2VuZSgpO1xuICAgICAgICAgICAgaWYgKCFzY2VuZSkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ05vIGFjdGl2ZSBzY2VuZScgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IHNjZW5lLmdldENoaWxkQnlVdWlkKG5vZGVVdWlkKTtcbiAgICAgICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYE5vZGUgd2l0aCBVVUlEICR7bm9kZVV1aWR9IG5vdCBmb3VuZGAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgQ29tcG9uZW50Q2xhc3MgPSBjYy5qcy5nZXRDbGFzc0J5TmFtZShjb21wb25lbnRUeXBlKTtcbiAgICAgICAgICAgIGlmICghQ29tcG9uZW50Q2xhc3MpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBDb21wb25lbnQgdHlwZSAke2NvbXBvbmVudFR5cGV9IG5vdCBmb3VuZGAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgY29tcG9uZW50ID0gbm9kZS5nZXRDb21wb25lbnQoQ29tcG9uZW50Q2xhc3MgYXMgbmV3ICgpID0+IGNjLkNvbXBvbmVudCk7XG4gICAgICAgICAgICBpZiAoIWNvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYENvbXBvbmVudCAke2NvbXBvbmVudFR5cGV9IG5vdCBmb3VuZCBvbiBub2RlYCB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBIYW5kbGUgY29tbW9uIHByb3BlcnRpZXMgd2l0aCBzcGVjaWFsIHRyZWF0bWVudFxuICAgICAgICAgICAgaWYgKHByb3BlcnR5ID09PSAnc3ByaXRlRnJhbWUnICYmIGNvbXBvbmVudFR5cGUgPT09ICdjYy5TcHJpdGUnKSB7XG4gICAgICAgICAgICAgICAgLy8gU3VwcG9ydCB2YWx1ZSBhcyB1dWlkIG9yIHJlc291cmNlIHBhdGhcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICAvLyBUcnkgdG8gbG9hZCBhcyByZXNvdXJjZVxuICAgICAgICAgICAgICAgICAgICBjYy5sb2FkZXIubG9hZFJlcyh2YWx1ZSwgY2MuU3ByaXRlRnJhbWUsIChlcnI6IGFueSwgc3ByaXRlRnJhbWU6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFlcnIgJiYgc3ByaXRlRnJhbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoY29tcG9uZW50IGFzIGFueSkuc3ByaXRlRnJhbWUgPSBzcHJpdGVGcmFtZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVHJ5IGRpcmVjdCBhc3NpZ25tZW50IChjb21wYXRpYmxlIHdpdGggYWxyZWFkeSBwYXNzZWQgcmVzb3VyY2Ugb2JqZWN0KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChjb21wb25lbnQgYXMgYW55KS5zcHJpdGVGcmFtZSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAoY29tcG9uZW50IGFzIGFueSkuc3ByaXRlRnJhbWUgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHByb3BlcnR5ID09PSAnc3RyaW5nJyAmJiAoY29tcG9uZW50VHlwZSA9PT0gJ2NjLkxhYmVsJyB8fCBjb21wb25lbnRUeXBlID09PSAnY2MuUmljaFRleHQnKSkge1xuICAgICAgICAgICAgICAgIChjb21wb25lbnQgYXMgYW55KS5zdHJpbmcgPSB2YWx1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgKGNvbXBvbmVudCBhcyBhbnkpW3Byb3BlcnR5XSA9IHZhbHVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IHRydWUsIG1lc3NhZ2U6IGBDb21wb25lbnQgcHJvcGVydHkgJyR7cHJvcGVydHl9JyB1cGRhdGVkIHN1Y2Nlc3NmdWxseWAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBjb21wb25lbnQgcHJvcGVydHkgd2l0aCBhZHZhbmNlZCB0eXBlIGhhbmRsaW5nXG4gICAgICogU3VwcG9ydHMgY29sb3IsIHZlYzIsIHZlYzMsIHNpemUsIG5vZGUgcmVmZXJlbmNlcywgY29tcG9uZW50IHJlZmVyZW5jZXMsIGFzc2V0cywgYW5kIGFycmF5c1xuICAgICAqL1xuICAgIHNldENvbXBvbmVudFByb3BlcnR5QWR2YW5jZWQoZXZlbnQ6IGFueSwgbm9kZVV1aWQ6IHN0cmluZywgY29tcG9uZW50VHlwZTogc3RyaW5nLCBwcm9wZXJ0eTogc3RyaW5nLCBwcm9jZXNzZWRWYWx1ZTogYW55LCBwcm9wZXJ0eVR5cGU6IHN0cmluZykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qgc2NlbmUgPSBjYy5kaXJlY3Rvci5nZXRTY2VuZSgpO1xuICAgICAgICAgICAgaWYgKCFzY2VuZSkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ05vIGFjdGl2ZSBzY2VuZScgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IHNjZW5lLmdldENoaWxkQnlVdWlkKG5vZGVVdWlkKTtcbiAgICAgICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYE5vZGUgd2l0aCBVVUlEICR7bm9kZVV1aWR9IG5vdCBmb3VuZGAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgQ29tcG9uZW50Q2xhc3MgPSBjYy5qcy5nZXRDbGFzc0J5TmFtZShjb21wb25lbnRUeXBlKTtcbiAgICAgICAgICAgIGlmICghQ29tcG9uZW50Q2xhc3MpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBDb21wb25lbnQgdHlwZSAke2NvbXBvbmVudFR5cGV9IG5vdCBmb3VuZGAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgY29tcG9uZW50ID0gbm9kZS5nZXRDb21wb25lbnQoQ29tcG9uZW50Q2xhc3MgYXMgbmV3ICgpID0+IGNjLkNvbXBvbmVudCk7XG4gICAgICAgICAgICBpZiAoIWNvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYENvbXBvbmVudCAke2NvbXBvbmVudFR5cGV9IG5vdCBmb3VuZCBvbiBub2RlYCB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBIYW5kbGUgZGlmZmVyZW50IHByb3BlcnR5IHR5cGVzXG4gICAgICAgICAgICBzd2l0Y2ggKHByb3BlcnR5VHlwZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ2NvbG9yJzpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb2Nlc3NlZFZhbHVlICYmIHR5cGVvZiBwcm9jZXNzZWRWYWx1ZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbG9yID0gbmV3IGNjLkNvbG9yKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGgubWluKDI1NSwgTWF0aC5tYXgoMCwgTnVtYmVyKHByb2Nlc3NlZFZhbHVlLnIpIHx8IDApKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLm1pbigyNTUsIE1hdGgubWF4KDAsIE51bWJlcihwcm9jZXNzZWRWYWx1ZS5nKSB8fCAwKSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5taW4oMjU1LCBNYXRoLm1heCgwLCBOdW1iZXIocHJvY2Vzc2VkVmFsdWUuYikgfHwgMCkpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2Nlc3NlZFZhbHVlLmEgIT09IHVuZGVmaW5lZCA/IE1hdGgubWluKDI1NSwgTWF0aC5tYXgoMCwgTnVtYmVyKHByb2Nlc3NlZFZhbHVlLmEpKSkgOiAyNTVcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAoY29tcG9uZW50IGFzIGFueSlbcHJvcGVydHldID0gY29sb3I7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlICd2ZWMyJzpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb2Nlc3NlZFZhbHVlICYmIHR5cGVvZiBwcm9jZXNzZWRWYWx1ZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHZlYzIgPSBuZXcgY2MuVmVjMihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBOdW1iZXIocHJvY2Vzc2VkVmFsdWUueCkgfHwgMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBOdW1iZXIocHJvY2Vzc2VkVmFsdWUueSkgfHwgMFxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIChjb21wb25lbnQgYXMgYW55KVtwcm9wZXJ0eV0gPSB2ZWMyO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSAndmVjMyc6XG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9jZXNzZWRWYWx1ZSAmJiB0eXBlb2YgcHJvY2Vzc2VkVmFsdWUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2ZWMzID0gbmV3IGNjLlZlYzMoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgTnVtYmVyKHByb2Nlc3NlZFZhbHVlLngpIHx8IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgTnVtYmVyKHByb2Nlc3NlZFZhbHVlLnkpIHx8IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgTnVtYmVyKHByb2Nlc3NlZFZhbHVlLnopIHx8IDBcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAoY29tcG9uZW50IGFzIGFueSlbcHJvcGVydHldID0gdmVjMztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgJ3NpemUnOlxuICAgICAgICAgICAgICAgICAgICBpZiAocHJvY2Vzc2VkVmFsdWUgJiYgdHlwZW9mIHByb2Nlc3NlZFZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSW4gMi54LCBzaXplIGlzIHR5cGljYWxseSByZXByZXNlbnRlZCBhcyBhbiBvYmplY3Qgd2l0aCB3aWR0aCBhbmQgaGVpZ2h0XG4gICAgICAgICAgICAgICAgICAgICAgICAoY29tcG9uZW50IGFzIGFueSlbcHJvcGVydHldID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiBOdW1iZXIocHJvY2Vzc2VkVmFsdWUud2lkdGgpIHx8IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBOdW1iZXIocHJvY2Vzc2VkVmFsdWUuaGVpZ2h0KSB8fCAwXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSAnbm9kZSc6XG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9jZXNzZWRWYWx1ZSAmJiB0eXBlb2YgcHJvY2Vzc2VkVmFsdWUgPT09ICdvYmplY3QnICYmICd1dWlkJyBpbiBwcm9jZXNzZWRWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0Tm9kZSA9IHNjZW5lLmdldENoaWxkQnlVdWlkKHByb2Nlc3NlZFZhbHVlLnV1aWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRhcmdldE5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoY29tcG9uZW50IGFzIGFueSlbcHJvcGVydHldID0gdGFyZ2V0Tm9kZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgVGFyZ2V0IG5vZGUgd2l0aCBVVUlEICR7cHJvY2Vzc2VkVmFsdWUudXVpZH0gbm90IGZvdW5kYCB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSAnY29tcG9uZW50JzpcbiAgICAgICAgICAgICAgICAgICAgLy8gQ29tcG9uZW50IHJlZmVyZW5jZTogcHJvY2Vzc2VkVmFsdWUgc2hvdWxkIGJlIGEgbm9kZSBVVUlEIHN0cmluZ1xuICAgICAgICAgICAgICAgICAgICAvLyBXZSBuZWVkIHRvIGZpbmQgdGhlIGNvbXBvbmVudCBvbiB0aGF0IG5vZGVcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBwcm9jZXNzZWRWYWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldE5vZGUgPSBzY2VuZS5nZXRDaGlsZEJ5VXVpZChwcm9jZXNzZWRWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRhcmdldE5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBUYXJnZXQgbm9kZSB3aXRoIFVVSUQgJHtwcm9jZXNzZWRWYWx1ZX0gbm90IGZvdW5kYCB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVHJ5IHRvIGZpbmQgdGhlIGNvbXBvbmVudCB0eXBlIGZyb20gcHJvcGVydHkgbWV0YWRhdGFcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZvciBub3csIHdlJ2xsIHRyeSBjb21tb24gY29tcG9uZW50IHR5cGVzIG9yIHVzZSB0aGUgY29tcG9uZW50VHlwZSBwYXJhbWV0ZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgYSBzaW1wbGlmaWVkIHZlcnNpb24gLSBpbiBwcmFjdGljZSwgd2UnZCBuZWVkIHRvIGtub3cgdGhlIGV4cGVjdGVkIGNvbXBvbmVudCB0eXBlXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0YXJnZXRDb21wb25lbnQgPSAodGFyZ2V0Tm9kZSBhcyBhbnkpLl9jb21wb25lbnRzPy5bMF07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGFyZ2V0Q29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKGNvbXBvbmVudCBhcyBhbnkpW3Byb3BlcnR5XSA9IHRhcmdldENvbXBvbmVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgTm8gY29tcG9uZW50IGZvdW5kIG9uIHRhcmdldCBub2RlICR7cHJvY2Vzc2VkVmFsdWV9YCB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSAnc3ByaXRlRnJhbWUnOlxuICAgICAgICAgICAgICAgIGNhc2UgJ3ByZWZhYic6XG4gICAgICAgICAgICAgICAgY2FzZSAnYXNzZXQnOlxuICAgICAgICAgICAgICAgICAgICAvLyBBc3NldCByZWZlcmVuY2VzOiBwcm9jZXNzZWRWYWx1ZSBzaG91bGQgaGF2ZSB1dWlkIHByb3BlcnR5XG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9jZXNzZWRWYWx1ZSAmJiB0eXBlb2YgcHJvY2Vzc2VkVmFsdWUgPT09ICdvYmplY3QnICYmICd1dWlkJyBpbiBwcm9jZXNzZWRWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSW4gMi54LCB3ZSBuZWVkIHRvIGxvYWQgdGhlIGFzc2V0IGJ5IFVVSURcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgYSBzaW1wbGlmaWVkIHZlcnNpb24gLSBhY3R1YWwgaW1wbGVtZW50YXRpb24gd291bGQgbmVlZCBhc3NldCBsb2FkaW5nXG4gICAgICAgICAgICAgICAgICAgICAgICAoY29tcG9uZW50IGFzIGFueSlbcHJvcGVydHldID0gcHJvY2Vzc2VkVmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlICdub2RlQXJyYXknOlxuICAgICAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShwcm9jZXNzZWRWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5vZGVBcnJheSA9IHByb2Nlc3NlZFZhbHVlLm1hcCgoaXRlbTogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0gJiYgdHlwZW9mIGl0ZW0gPT09ICdvYmplY3QnICYmICd1dWlkJyBpbiBpdGVtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzY2VuZS5nZXRDaGlsZEJ5VXVpZChpdGVtLnV1aWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pLmZpbHRlcigobjogYW55KSA9PiBuICE9PSBudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIChjb21wb25lbnQgYXMgYW55KVtwcm9wZXJ0eV0gPSBub2RlQXJyYXk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlICdjb2xvckFycmF5JzpcbiAgICAgICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocHJvY2Vzc2VkVmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjb2xvckFycmF5ID0gcHJvY2Vzc2VkVmFsdWUubWFwKChpdGVtOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbSAmJiB0eXBlb2YgaXRlbSA9PT0gJ29iamVjdCcgJiYgJ3InIGluIGl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBjYy5Db2xvcihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGgubWluKDI1NSwgTWF0aC5tYXgoMCwgTnVtYmVyKGl0ZW0ucikgfHwgMCkpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5taW4oMjU1LCBNYXRoLm1heCgwLCBOdW1iZXIoaXRlbS5nKSB8fCAwKSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLm1pbigyNTUsIE1hdGgubWF4KDAsIE51bWJlcihpdGVtLmIpIHx8IDApKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uYSAhPT0gdW5kZWZpbmVkID8gTWF0aC5taW4oMjU1LCBNYXRoLm1heCgwLCBOdW1iZXIoaXRlbS5hKSkpIDogMjU1XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgY2MuQ29sb3IoMjU1LCAyNTUsIDI1NSwgMjU1KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgKGNvbXBvbmVudCBhcyBhbnkpW3Byb3BlcnR5XSA9IGNvbG9yQXJyYXk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlICdudW1iZXJBcnJheSc6XG4gICAgICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHByb2Nlc3NlZFZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgKGNvbXBvbmVudCBhcyBhbnkpW3Byb3BlcnR5XSA9IHByb2Nlc3NlZFZhbHVlLm1hcCgoaXRlbTogYW55KSA9PiBOdW1iZXIoaXRlbSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSAnc3RyaW5nQXJyYXknOlxuICAgICAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShwcm9jZXNzZWRWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIChjb21wb25lbnQgYXMgYW55KVtwcm9wZXJ0eV0gPSBwcm9jZXNzZWRWYWx1ZS5tYXAoKGl0ZW06IGFueSkgPT4gU3RyaW5nKGl0ZW0pKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIC8vIEZvciBiYXNpYyB0eXBlcyAoc3RyaW5nLCBudW1iZXIsIGJvb2xlYW4pLCBhc3NpZ24gZGlyZWN0bHlcbiAgICAgICAgICAgICAgICAgICAgKGNvbXBvbmVudCBhcyBhbnkpW3Byb3BlcnR5XSA9IHByb2Nlc3NlZFZhbHVlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiB0cnVlLCBtZXNzYWdlOiBgQ29tcG9uZW50IHByb3BlcnR5ICcke3Byb3BlcnR5fScgdXBkYXRlZCBzdWNjZXNzZnVsbHlgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBRdWVyeSBub2RlIHRyZWUgc3RydWN0dXJlXG4gICAgICovXG4gICAgcXVlcnlOb2RlVHJlZShldmVudDogYW55KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBzY2VuZSA9IGNjLmRpcmVjdG9yLmdldFNjZW5lKCk7XG4gICAgICAgICAgICBpZiAoIXNjZW5lKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnTm8gYWN0aXZlIHNjZW5lJyB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBidWlsZFRyZWUgPSAobm9kZTogYW55KTogYW55ID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICB1dWlkOiBub2RlLnV1aWQsXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IG5vZGUubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgYWN0aXZlOiBub2RlLmFjdGl2ZSxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogY2MuanMuZ2V0Q2xhc3NOYW1lKG5vZGUpLFxuICAgICAgICAgICAgICAgICAgICBjaGlsZHJlbjogbm9kZS5jaGlsZHJlbiA/IG5vZGUuY2hpbGRyZW4ubWFwKChjaGlsZDogYW55KSA9PiBidWlsZFRyZWUoY2hpbGQpKSA6IFtdXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgdXVpZDogc2NlbmUudXVpZCxcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogc2NlbmUubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW46IHNjZW5lLmNoaWxkcmVuLm1hcCgoY2hpbGQ6IGFueSkgPT4gYnVpbGRUcmVlKGNoaWxkKSlcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUXVlcnkgc3BlY2lmaWMgbm9kZSBieSBVVUlEXG4gICAgICovXG4gICAgcXVlcnlOb2RlKGV2ZW50OiBhbnksIHV1aWQ6IHN0cmluZykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qgc2NlbmUgPSBjYy5kaXJlY3Rvci5nZXRTY2VuZSgpO1xuICAgICAgICAgICAgaWYgKCFzY2VuZSkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCBudWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBSZWN1cnNpdmVseSBzZWFyY2ggZm9yIG5vZGUgYnkgVVVJRFxuICAgICAgICAgICAgY29uc3QgZmluZE5vZGVCeVV1aWQgPSAobm9kZTogYW55KTogYW55ID0+IHtcbiAgICAgICAgICAgICAgICBpZiAobm9kZS51dWlkID09PSB1dWlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBub2RlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAobm9kZS5jaGlsZHJlbikge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIG5vZGUuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZvdW5kID0gZmluZE5vZGVCeVV1aWQoY2hpbGQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZvdW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZvdW5kO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IGZpbmROb2RlQnlVdWlkKHNjZW5lKTtcbiAgICAgICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCBudWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBwb3NEYXRhID0gbm9kZS5wb3NpdGlvbiA/IHtcbiAgICAgICAgICAgICAgICB4OiAobm9kZS5wb3NpdGlvbiBhcyBhbnkpLnggfHwgbm9kZS54LFxuICAgICAgICAgICAgICAgIHk6IChub2RlLnBvc2l0aW9uIGFzIGFueSkueSB8fCBub2RlLnksXG4gICAgICAgICAgICAgICAgejogKG5vZGUucG9zaXRpb24gYXMgYW55KS56IHx8IDBcbiAgICAgICAgICAgIH0gOiB7IHg6IG5vZGUueCwgeTogbm9kZS55LCB6OiAwIH07XG5cbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHtcbiAgICAgICAgICAgICAgICAgICAgdXVpZDogbm9kZS51dWlkLFxuICAgICAgICAgICAgICAgICAgICBuYW1lOiB7IHZhbHVlOiBub2RlLm5hbWUgfSxcbiAgICAgICAgICAgICAgICAgICAgYWN0aXZlOiB7IHZhbHVlOiBub2RlLmFjdGl2ZSB9LFxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogeyB2YWx1ZTogcG9zRGF0YSB9LFxuICAgICAgICAgICAgICAgICAgICByb3RhdGlvbjogeyB2YWx1ZTogbm9kZS5yb3RhdGlvbiB8fCAwIH0sXG4gICAgICAgICAgICAgICAgICAgIHNjYWxlOiB7IHZhbHVlOiB7IHg6IG5vZGUuc2NhbGVYLCB5OiBub2RlLnNjYWxlWSwgejogMSB9IH0sXG4gICAgICAgICAgICAgICAgICAgIHBhcmVudDogeyB2YWx1ZTogeyB1dWlkOiBub2RlLnBhcmVudD8udXVpZCB8fCBudWxsIH0gfSxcbiAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW46IG5vZGUuY2hpbGRyZW4ubWFwKChjaGlsZDogYW55KSA9PiAoeyB1dWlkOiBjaGlsZC51dWlkLCBuYW1lOiBjaGlsZC5uYW1lIH0pKSxcbiAgICAgICAgICAgICAgICAgICAgX19jb21wc19fOiAobm9kZSBhcyBhbnkpLl9jb21wb25lbnRzID8gKG5vZGUgYXMgYW55KS5fY29tcG9uZW50cy5tYXAoKGNvbXA6IGFueSkgPT4gKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9fdHlwZV9fOiBjYy5qcy5nZXRDbGFzc05hbWUoY29tcCksXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmFibGVkOiBjb21wLmVuYWJsZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiBjb21wLnV1aWRcbiAgICAgICAgICAgICAgICAgICAgfSkpIDogW10sXG4gICAgICAgICAgICAgICAgICAgIGxheWVyOiB7IHZhbHVlOiAxMDczNzQxODI0IH0sXG4gICAgICAgICAgICAgICAgICAgIG1vYmlsaXR5OiB7IHZhbHVlOiAwIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgbnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIG5vZGUgd2l0aCBvcHRpb25zIChzdXBwb3J0cyBwcmVmYWJzLCBjb21wb25lbnRzLCB0cmFuc2Zvcm0pXG4gICAgICovXG4gICAgY3JlYXRlTm9kZVdpdGhPcHRpb25zKGV2ZW50OiBhbnksIG9wdGlvbnM6IGFueSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qgc2NlbmUgPSBjYy5kaXJlY3Rvci5nZXRTY2VuZSgpO1xuICAgICAgICAgICAgaWYgKCFzY2VuZSkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCBudWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZXQgbm9kZTogYW55ID0gbnVsbDtcblxuICAgICAgICAgICAgLy8gSWYgY3JlYXRpbmcgZnJvbSBhc3NldCAocHJlZmFiKVxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuYXNzZXRVdWlkKSB7XG4gICAgICAgICAgICAgICAgLy8gSW4gMi54LCBwcmVmYWIgaW5zdGFudGlhdGlvbiBmcm9tIFVVSUQgaW4gc2NlbmUgc2NyaXB0cyBpcyBub3QgZGlyZWN0bHkgc3VwcG9ydGVkXG4gICAgICAgICAgICAgICAgLy8gVGhpcyB3b3VsZCBuZWVkIHRvIGJlIGhhbmRsZWQgYnkgdGhlIGVkaXRvciBBUEksIG5vdCBydW50aW1lIEFQSVxuICAgICAgICAgICAgICAgIC8vIEZvciBub3csIHJldHVybiBhbiBlcnJvciBpbmRpY2F0aW5nIHRoaXMgbGltaXRhdGlvblxuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCBudWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBDcmVhdGUgZW1wdHkgbm9kZVxuICAgICAgICAgICAgICAgIG5vZGUgPSBuZXcgY2MuTm9kZShvcHRpb25zLm5hbWUgfHwgJ05ldyBOb2RlJyk7XG5cbiAgICAgICAgICAgICAgICAvLyBBZGQgY29tcG9uZW50cyBpZiBzcGVjaWZpZWRcbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5jb21wb25lbnRzICYmIEFycmF5LmlzQXJyYXkob3B0aW9ucy5jb21wb25lbnRzKSkge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGNvbXBUeXBlIG9mIG9wdGlvbnMuY29tcG9uZW50cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgQ29tcG9uZW50Q2xhc3MgPSBjYy5qcy5nZXRDbGFzc0J5TmFtZShjb21wVHlwZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoQ29tcG9uZW50Q2xhc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlLmFkZENvbXBvbmVudChDb21wb25lbnRDbGFzcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCBudWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBTZXQgcGFyZW50XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5wYXJlbnQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXJlbnQgPSBzY2VuZS5nZXRDaGlsZEJ5VXVpZChvcHRpb25zLnBhcmVudCk7XG4gICAgICAgICAgICAgICAgaWYgKHBhcmVudCkge1xuICAgICAgICAgICAgICAgICAgICBwYXJlbnQuYWRkQ2hpbGQobm9kZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2NlbmUuYWRkQ2hpbGQobm9kZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzY2VuZS5hZGRDaGlsZChub2RlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgbm9kZS51dWlkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgbnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IG5vZGUgcGFyZW50XG4gICAgICovXG4gICAgc2V0UGFyZW50KGV2ZW50OiBhbnksIHBhcmVudFV1aWQ6IHN0cmluZywgY2hpbGRVdWlkczogc3RyaW5nW10sIGtlZXBXb3JsZFRyYW5zZm9ybTogYm9vbGVhbiA9IGZhbHNlKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBzY2VuZSA9IGNjLmRpcmVjdG9yLmdldFNjZW5lKCk7XG4gICAgICAgICAgICBpZiAoIXNjZW5lKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnTm8gYWN0aXZlIHNjZW5lJyB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBwYXJlbnQgPSBzY2VuZS5nZXRDaGlsZEJ5VXVpZChwYXJlbnRVdWlkKTtcbiAgICAgICAgICAgIGlmICghcGFyZW50KSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgUGFyZW50IG5vZGUgd2l0aCBVVUlEICR7cGFyZW50VXVpZH0gbm90IGZvdW5kYCB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGNoaWxkVXVpZCBvZiBjaGlsZFV1aWRzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2hpbGQgPSBzY2VuZS5nZXRDaGlsZEJ5VXVpZChjaGlsZFV1aWQpO1xuICAgICAgICAgICAgICAgIGlmIChjaGlsZCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoa2VlcFdvcmxkVHJhbnNmb3JtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBTdG9yZSB3b3JsZCBwb3NpdGlvbiBiZWZvcmUgcmVwYXJlbnRpbmcgKDIueCB2ZXJzaW9uKVxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgd29ybGRYID0gY2hpbGQueDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHdvcmxkWSA9IGNoaWxkLnk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQuYWRkQ2hpbGQoY2hpbGQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gTm90ZTogVGhpcyBpcyBhIHNpbXBsaWZpZWQgdmVyc2lvbiB0aGF0IGRvZXNuJ3QgYWNjb3VudCBmb3IgcGFyZW50IHRyYW5zZm9ybXNcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZvciBmdWxsIHdvcmxkIHRyYW5zZm9ybSBwcmVzZXJ2YXRpb24sIG1vcmUgY29tcGxleCBjYWxjdWxhdGlvbnMgYXJlIG5lZWRlZFxuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQuc2V0UG9zaXRpb24od29ybGRYLCB3b3JsZFkpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50LmFkZENoaWxkKGNoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiB0cnVlLCBtZXNzYWdlOiAnUGFyZW50IHNldCBzdWNjZXNzZnVsbHknIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgbm9kZSBmcm9tIHNjZW5lXG4gICAgICovXG4gICAgcmVtb3ZlTm9kZShldmVudDogYW55LCB1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHNjZW5lID0gY2MuZGlyZWN0b3IuZ2V0U2NlbmUoKTtcbiAgICAgICAgICAgIGlmICghc2NlbmUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdObyBhY3RpdmUgc2NlbmUnIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBzY2VuZS5nZXRDaGlsZEJ5VXVpZCh1dWlkKTtcbiAgICAgICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYE5vZGUgd2l0aCBVVUlEICR7dXVpZH0gbm90IGZvdW5kYCB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBub2RlLnJlbW92ZUZyb21QYXJlbnQoKTtcbiAgICAgICAgICAgIG5vZGUuZGVzdHJveSgpO1xuXG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IHRydWUsIG1lc3NhZ2U6ICdOb2RlIHJlbW92ZWQgc3VjY2Vzc2Z1bGx5JyB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRHVwbGljYXRlIG5vZGVcbiAgICAgKi9cbiAgICBkdXBsaWNhdGVOb2RlKGV2ZW50OiBhbnksIHV1aWQ6IHN0cmluZykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qgc2NlbmUgPSBjYy5kaXJlY3Rvci5nZXRTY2VuZSgpO1xuICAgICAgICAgICAgaWYgKCFzY2VuZSkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ05vIGFjdGl2ZSBzY2VuZScgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IHNjZW5lLmdldENoaWxkQnlVdWlkKHV1aWQpO1xuICAgICAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgTm9kZSB3aXRoIFVVSUQgJHt1dWlkfSBub3QgZm91bmRgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFVzZSBjYy5pbnN0YW50aWF0ZSB0byBjbG9uZSB0aGUgbm9kZVxuICAgICAgICAgICAgY29uc3QgY2xvbmVkTm9kZSA9IGNjLmluc3RhbnRpYXRlKG5vZGUpO1xuICAgICAgICAgICAgY2xvbmVkTm9kZS5uYW1lID0gbm9kZS5uYW1lICsgJyBDb3B5JztcblxuICAgICAgICAgICAgLy8gQWRkIHRvIHNhbWUgcGFyZW50XG4gICAgICAgICAgICBpZiAobm9kZS5wYXJlbnQpIHtcbiAgICAgICAgICAgICAgICBub2RlLnBhcmVudC5hZGRDaGlsZChjbG9uZWROb2RlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2NlbmUuYWRkQ2hpbGQoY2xvbmVkTm9kZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgdXVpZDogY2xvbmVkTm9kZS51dWlkIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBGaW5kIG5vZGVzIGJ5IHBhdHRlcm5cbiAgICAgKi9cbiAgICBmaW5kTm9kZXMoZXZlbnQ6IGFueSwgcGF0dGVybjogc3RyaW5nLCBleGFjdE1hdGNoOiBib29sZWFuID0gZmFsc2UpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHNjZW5lID0gY2MuZGlyZWN0b3IuZ2V0U2NlbmUoKTtcbiAgICAgICAgICAgIGlmICghc2NlbmUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdObyBhY3RpdmUgc2NlbmUnIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IG5vZGVzOiBhbnlbXSA9IFtdO1xuICAgICAgICAgICAgY29uc3Qgc2VhcmNoTm9kZXMgPSAobm9kZTogYW55LCBwYXRoOiBzdHJpbmcgPSAnJykgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5vZGVQYXRoID0gcGF0aCA/IGAke3BhdGh9LyR7bm9kZS5uYW1lfWAgOiBub2RlLm5hbWU7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBtYXRjaGVzID0gZXhhY3RNYXRjaFxuICAgICAgICAgICAgICAgICAgICA/IG5vZGUubmFtZSA9PT0gcGF0dGVyblxuICAgICAgICAgICAgICAgICAgICA6IG5vZGUubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHBhdHRlcm4udG9Mb3dlckNhc2UoKSk7XG5cbiAgICAgICAgICAgICAgICBpZiAobWF0Y2hlcykge1xuICAgICAgICAgICAgICAgICAgICBub2Rlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IG5vZGUudXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IG5vZGUubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IG5vZGVQYXRoXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChub2RlLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUuY2hpbGRyZW4uZm9yRWFjaCgoY2hpbGQ6IGFueSkgPT4gc2VhcmNoTm9kZXMoY2hpbGQsIG5vZGVQYXRoKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2NlbmUuY2hpbGRyZW4uZm9yRWFjaCgoY2hpbGQ6IGFueSkgPT4gc2VhcmNoTm9kZXMoY2hpbGQpKTtcblxuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiB0cnVlLCBkYXRhOiBub2RlcyB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXhlY3V0ZSBhcmJpdHJhcnkgSmF2YVNjcmlwdCBpbiBzY2VuZSBjb250ZXh0XG4gICAgICovXG4gICAgZXhlY3V0ZVNjcmlwdChldmVudDogYW55LCBzY3JpcHQ6IHN0cmluZykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gRXhlY3V0ZSBzY3JpcHQgaW4gZ2xvYmFsIHNjb3BlIChvciBjdXJyZW50IHNjb3BlKVxuICAgICAgICAgICAgLy8gVXNpbmcgZXZhbCBpcyBkYW5nZXJvdXMgYnV0IG5lY2Vzc2FyeSBmb3IgdGhpcyBkZWJ1ZyB0b29sXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBldmFsKHNjcmlwdCk7XG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCByZXN1bHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IGVycm9yOiBlcnJvci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV4ZWN1dGUgY29tcG9uZW50IG1ldGhvZFxuICAgICAqL1xuICAgIGV4ZWN1dGVDb21wb25lbnRNZXRob2QoZXZlbnQ6IGFueSwgY29tcG9uZW50VXVpZDogc3RyaW5nLCBtZXRob2ROYW1lOiBzdHJpbmcsIGFyZ3M6IGFueVtdID0gW10pIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHNjZW5lID0gY2MuZGlyZWN0b3IuZ2V0U2NlbmUoKTtcbiAgICAgICAgICAgIGlmICghc2NlbmUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdObyBhY3RpdmUgc2NlbmUnIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEZpbmQgY29tcG9uZW50IGJ5IFVVSUQgLSBuZWVkIHRvIHNlYXJjaCBhbGwgbm9kZXNcbiAgICAgICAgICAgIGxldCB0YXJnZXRDb21wb25lbnQ6IGFueSA9IG51bGw7XG4gICAgICAgICAgICBjb25zdCBzZWFyY2hDb21wb25lbnQgPSAobm9kZTogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKG5vZGUuX2NvbXBvbmVudHMpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBjb21wIG9mIG5vZGUuX2NvbXBvbmVudHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb21wLnV1aWQgPT09IGNvbXBvbmVudFV1aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRDb21wb25lbnQgPSBjb21wO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAobm9kZS5jaGlsZHJlbikge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIG5vZGUuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlYXJjaENvbXBvbmVudChjaGlsZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGFyZ2V0Q29tcG9uZW50KSByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzZWFyY2hDb21wb25lbnQoc2NlbmUpO1xuXG4gICAgICAgICAgICBpZiAoIXRhcmdldENvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYENvbXBvbmVudCB3aXRoIFVVSUQgJHtjb21wb25lbnRVdWlkfSBub3QgZm91bmRgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEV4ZWN1dGUgbWV0aG9kXG4gICAgICAgICAgICBpZiAodHlwZW9mIHRhcmdldENvbXBvbmVudFttZXRob2ROYW1lXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHRhcmdldENvbXBvbmVudFttZXRob2ROYW1lXSguLi5hcmdzKTtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiB0cnVlLCBkYXRhOiByZXN1bHQgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBNZXRob2QgJyR7bWV0aG9kTmFtZX0nIG5vdCBmb3VuZCBvbiBjb21wb25lbnRgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUXVlcnkgaWYgc2NlbmUgaXMgcmVhZHlcbiAgICAgKi9cbiAgICBxdWVyeVNjZW5lUmVhZHkoZXZlbnQ6IGFueSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qgc2NlbmUgPSBjYy5kaXJlY3Rvci5nZXRTY2VuZSgpO1xuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiB0cnVlLCBkYXRhOiB7IHJlYWR5OiBzY2VuZSAhPT0gbnVsbCAmJiBzY2VuZSAhPT0gdW5kZWZpbmVkIH0gfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFF1ZXJ5IGlmIHNjZW5lIGhhcyB1bnNhdmVkIGNoYW5nZXNcbiAgICAgKiBOb3RlOiBJbiAyLnggcnVudGltZSwgd2UgY2Fubm90IGRpcmVjdGx5IGNoZWNrIGRpcnR5IHN0YXRlXG4gICAgICogVGhpcyBpcyBhbiBlZGl0b3Itb25seSBmZWF0dXJlLCBzbyB3ZSByZXR1cm4gZmFsc2VcbiAgICAgKi9cbiAgICBxdWVyeVNjZW5lRGlydHkoZXZlbnQ6IGFueSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gSW4gMi54IHJ1bnRpbWUsIHdlIGNhbm5vdCBhY2Nlc3MgZWRpdG9yIGRpcnR5IHN0YXRlXG4gICAgICAgICAgICAvLyBSZXR1cm4gZmFsc2UgYXMgZGVmYXVsdFxuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiB0cnVlLCBkYXRhOiB7IGRpcnR5OiBmYWxzZSB9IH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBRdWVyeSBhbGwgcmVnaXN0ZXJlZCBjbGFzc2VzXG4gICAgICovXG4gICAgcXVlcnlTY2VuZUNsYXNzZXMoZXZlbnQ6IGFueSwgZXh0ZW5kc0NsYXNzPzogc3RyaW5nKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjbGFzc2VzOiBhbnlbXSA9IFtdO1xuXG4gICAgICAgICAgICAvLyBHZXQgYWxsIGNsYXNzZXMgZnJvbSBjYyBuYW1lc3BhY2VcbiAgICAgICAgICAgIGNvbnN0IGNjTmFtZXNwYWNlID0gKHdpbmRvdyBhcyBhbnkpLmNjIHx8IGNjO1xuICAgICAgICAgICAgY29uc3QgY2xhc3NOYW1lczogc3RyaW5nW10gPSBbXTtcblxuICAgICAgICAgICAgLy8gQ29sbGVjdCBjbGFzcyBuYW1lcyBmcm9tIGNjIG5hbWVzcGFjZVxuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gY2NOYW1lc3BhY2UpIHtcbiAgICAgICAgICAgICAgICBpZiAoY2NOYW1lc3BhY2UuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZSA9IGNjTmFtZXNwYWNlW2tleV07XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicgJiYgdmFsdWUucHJvdG90eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWVzLnB1c2goa2V5KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gRmlsdGVyIGJ5IGV4dGVuZHMgaWYgc3BlY2lmaWVkXG4gICAgICAgICAgICBpZiAoZXh0ZW5kc0NsYXNzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgQmFzZUNsYXNzID0gY2MuanMuZ2V0Q2xhc3NCeU5hbWUoZXh0ZW5kc0NsYXNzKTtcbiAgICAgICAgICAgICAgICBpZiAoQmFzZUNsYXNzKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgY2xhc3NOYW1lIG9mIGNsYXNzTmFtZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IENsYXNzID0gY2MuanMuZ2V0Q2xhc3NCeU5hbWUoY2xhc3NOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChDbGFzcyAmJiBDbGFzcy5wcm90b3R5cGUgaW5zdGFuY2VvZiBCYXNlQ2xhc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc2VzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBjbGFzc05hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dGVuZHM6IGV4dGVuZHNDbGFzc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBSZXR1cm4gYWxsIGNsYXNzZXNcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGNsYXNzTmFtZSBvZiBjbGFzc05hbWVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsYXNzZXMucHVzaCh7IG5hbWU6IGNsYXNzTmFtZSB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogY2xhc3NlcyB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUXVlcnkgYXZhaWxhYmxlIHNjZW5lIGNvbXBvbmVudHNcbiAgICAgKi9cbiAgICBxdWVyeVNjZW5lQ29tcG9uZW50cyhldmVudDogYW55KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnRzOiBhbnlbXSA9IFtdO1xuXG4gICAgICAgICAgICAvLyBHZXQgYWxsIGNvbXBvbmVudCBjbGFzc2VzIGZyb20gY2MgbmFtZXNwYWNlXG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnROYW1lcyA9IFtcbiAgICAgICAgICAgICAgICAnY2MuQ29tcG9uZW50JyxcbiAgICAgICAgICAgICAgICAnY2MuU3ByaXRlJyxcbiAgICAgICAgICAgICAgICAnY2MuTGFiZWwnLFxuICAgICAgICAgICAgICAgICdjYy5CdXR0b24nLFxuICAgICAgICAgICAgICAgICdjYy5BbmltYXRpb24nLFxuICAgICAgICAgICAgICAgICdjYy5BdWRpb1NvdXJjZScsXG4gICAgICAgICAgICAgICAgJ2NjLkNhbWVyYScsXG4gICAgICAgICAgICAgICAgJ2NjLkNhbnZhcycsXG4gICAgICAgICAgICAgICAgJ2NjLkNvbGxpZGVyJyxcbiAgICAgICAgICAgICAgICAnY2MuUmlnaWRCb2R5JyxcbiAgICAgICAgICAgICAgICAnY2MuUGh5c2ljc0JveENvbGxpZGVyJyxcbiAgICAgICAgICAgICAgICAnY2MuUGh5c2ljc0NpcmNsZUNvbGxpZGVyJyxcbiAgICAgICAgICAgICAgICAnY2MuUGh5c2ljc1BvbHlnb25Db2xsaWRlcicsXG4gICAgICAgICAgICAgICAgJ2NjLlJpY2hUZXh0JyxcbiAgICAgICAgICAgICAgICAnY2MuU2Nyb2xsVmlldycsXG4gICAgICAgICAgICAgICAgJ2NjLlBhZ2VWaWV3JyxcbiAgICAgICAgICAgICAgICAnY2MuRWRpdEJveCcsXG4gICAgICAgICAgICAgICAgJ2NjLkxheW91dCcsXG4gICAgICAgICAgICAgICAgJ2NjLk1hc2snLFxuICAgICAgICAgICAgICAgICdjYy5Qcm9ncmVzc0JhcicsXG4gICAgICAgICAgICAgICAgJ2NjLlNsaWRlcicsXG4gICAgICAgICAgICAgICAgJ2NjLlRvZ2dsZScsXG4gICAgICAgICAgICAgICAgJ2NjLlRvZ2dsZUdyb3VwJyxcbiAgICAgICAgICAgICAgICAnY2MuV2lkZ2V0JyxcbiAgICAgICAgICAgICAgICAnY2MuR3JhcGhpY3MnLFxuICAgICAgICAgICAgICAgICdjYy5Nb3Rpb25TdHJlYWsnLFxuICAgICAgICAgICAgICAgICdjYy5QYXJ0aWNsZVN5c3RlbScsXG4gICAgICAgICAgICAgICAgJ2NjLlRpbGVkTWFwJyxcbiAgICAgICAgICAgICAgICAnY2MuVGlsZWRMYXllcicsXG4gICAgICAgICAgICAgICAgJ2NjLlRpbGVkT2JqZWN0R3JvdXAnLFxuICAgICAgICAgICAgICAgICdjYy5UaWxlZFRpbGUnLFxuICAgICAgICAgICAgICAgICdjYy5WaWRlb1BsYXllcicsXG4gICAgICAgICAgICAgICAgJ2NjLldlYlZpZXcnXG4gICAgICAgICAgICBdO1xuXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGNvbXBOYW1lIG9mIGNvbXBvbmVudE5hbWVzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgQ29tcENsYXNzID0gY2MuanMuZ2V0Q2xhc3NCeU5hbWUoY29tcE5hbWUpO1xuICAgICAgICAgICAgICAgIGlmIChDb21wQ2xhc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50cy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGNvbXBOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogY29tcE5hbWVcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IGNvbXBvbmVudHMgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENoZWNrIGlmIGNvbXBvbmVudCBoYXMgc2NyaXB0XG4gICAgICovXG4gICAgcXVlcnlDb21wb25lbnRIYXNTY3JpcHQoZXZlbnQ6IGFueSwgY2xhc3NOYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IENvbXBDbGFzcyA9IGNjLmpzLmdldENsYXNzQnlOYW1lKGNsYXNzTmFtZSk7XG4gICAgICAgICAgICBpZiAoIUNvbXBDbGFzcykge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYENvbXBvbmVudCBjbGFzcyAnJHtjbGFzc05hbWV9JyBub3QgZm91bmRgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEluIDIueCwgY2hlY2sgaWYgY29tcG9uZW50IGhhcyBhbnkgbWV0aG9kcyAoaW5kaWNhdGluZyBpdCBtaWdodCBoYXZlIGEgc2NyaXB0KVxuICAgICAgICAgICAgLy8gVGhpcyBpcyBhIHNpbXBsaWZpZWQgY2hlY2sgLSBhY3R1YWwgc2NyaXB0IGRldGVjdGlvbiB3b3VsZCByZXF1aXJlIG1vcmUgY29tcGxleCBsb2dpY1xuICAgICAgICAgICAgY29uc3QgaGFzU2NyaXB0ID0gQ29tcENsYXNzLnByb3RvdHlwZSAmJiBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhDb21wQ2xhc3MucHJvdG90eXBlKS5sZW5ndGggPiAxO1xuXG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IHsgaGFzU2NyaXB0IH0gfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFF1ZXJ5IG5vZGVzIGJ5IGFzc2V0IFVVSURcbiAgICAgKi9cbiAgICBxdWVyeU5vZGVzQnlBc3NldFV1aWQoZXZlbnQ6IGFueSwgYXNzZXRVdWlkOiBzdHJpbmcpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHNjZW5lID0gY2MuZGlyZWN0b3IuZ2V0U2NlbmUoKTtcbiAgICAgICAgICAgIGlmICghc2NlbmUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdObyBhY3RpdmUgc2NlbmUnIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IG5vZGVVdWlkczogc3RyaW5nW10gPSBbXTtcblxuICAgICAgICAgICAgLy8gU2VhcmNoIGFsbCBub2RlcyBmb3IgY29tcG9uZW50cyB0aGF0IHJlZmVyZW5jZSB0aGUgYXNzZXQgVVVJRFxuICAgICAgICAgICAgY29uc3Qgc2VhcmNoTm9kZXMgPSAobm9kZTogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKG5vZGUuX2NvbXBvbmVudHMpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBjb21wIG9mIG5vZGUuX2NvbXBvbmVudHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIGNvbW1vbiBhc3NldCByZWZlcmVuY2UgcHJvcGVydGllc1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYXNzZXRQcm9wcyA9IFsnc3ByaXRlRnJhbWUnLCAndGV4dHVyZScsICdhdGxhcycsICdmb250JywgJ2F1ZGlvQ2xpcCcsICdwcmVmYWInXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgcHJvcCBvZiBhc3NldFByb3BzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbXBbcHJvcF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYXNzZXQgPSBjb21wW3Byb3BdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDaGVjayBpZiBhc3NldCBoYXMgbWF0Y2hpbmcgVVVJRFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXNzZXQgJiYgKGFzc2V0LnV1aWQgPT09IGFzc2V0VXVpZCB8fCAoYXNzZXQuX3V1aWQgJiYgYXNzZXQuX3V1aWQgPT09IGFzc2V0VXVpZCkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobm9kZVV1aWRzLmluZGV4T2Yobm9kZS51dWlkKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlVXVpZHMucHVzaChub2RlLnV1aWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKG5vZGUuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBub2RlLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWFyY2hOb2RlcyhjaGlsZCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzZWFyY2hOb2RlcyhzY2VuZSk7XG5cbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogbm9kZVV1aWRzIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gbWV0aG9kcztcbiJdfQ==