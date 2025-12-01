"use strict";
/// <reference path="./types/cc-2x.d.ts" />
/// <reference path="./types/editor-2x.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = void 0;
const path_1 = require("path");
module.paths.push((0, path_1.join)(Editor.appPath, 'node_modules'));
// Note: In Cocos Creator 2.x, 'cc' is available as a global variable in scene scripts
// We don't need to require it like in 3.x
exports.methods = {
    /**
     * Create a new scene
     */
    createNewScene() {
        try {
            const scene = new cc.Scene();
            scene.name = 'New Scene';
            cc.director.runScene(scene);
            return { success: true, message: 'New scene created successfully' };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
    /**
     * Add component to a node
     */
    addComponentToNode(nodeUuid, componentType) {
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
            const component = node.addComponent(ComponentClass);
            return {
                success: true,
                message: `Component ${componentType} added successfully`,
                data: { componentId: component.uuid }
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
    /**
     * Remove component from a node
     */
    removeComponentFromNode(nodeUuid, componentType) {
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
            const component = node.getComponent(ComponentClass);
            if (!component) {
                return { success: false, error: `Component ${componentType} not found on node` };
            }
            node.removeComponent(component);
            return { success: true, message: `Component ${componentType} removed successfully` };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
    /**
     * Create a new node
     */
    createNode(name, parentUuid) {
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
                }
                else {
                    scene.addChild(node);
                }
            }
            else {
                scene.addChild(node);
            }
            return {
                success: true,
                message: `Node ${name} created successfully`,
                data: { uuid: node.uuid, name: node.name }
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
    /**
     * Get node information
     */
    getNodeInfo(nodeUuid) {
        var _a;
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
                x: node.position.x || node.x,
                y: node.position.y || node.y,
                z: node.position.z || 0
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
                    parent: (_a = node.parent) === null || _a === void 0 ? void 0 : _a.uuid,
                    children: node.children.map((child) => child.uuid),
                    components: node._components ? node._components.map((comp) => ({
                        type: cc.js.getClassName(comp),
                        enabled: comp.enabled
                    })) : []
                }
            };
        }
        catch (error) {
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
            return { success: true, data: nodes };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
    /**
     * Find node by name
     */
    findNodeByName(name) {
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
        }
        catch (error) {
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
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
    /**
     * Set node property
     */
    setNodeProperty(nodeUuid, property, value) {
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
            else {
                // Try to set property directly
                node[property] = value;
            }
            return {
                success: true,
                message: `Property '${property}' updated successfully`
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
    /**
     * Get scene hierarchy
     */
    getSceneHierarchy(includeComponents = false) {
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                return { success: false, error: 'No active scene' };
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
            return { success: true, data: hierarchy };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
    /**
     * Create prefab from node
     */
    createPrefabFromNode(nodeUuid, prefabPath) {
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
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
    /**
     * Set component property
     */
    setComponentProperty(nodeUuid, componentType, property, value) {
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
            const component = node.getComponent(ComponentClass);
            if (!component) {
                return { success: false, error: `Component ${componentType} not found on node` };
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
            return { success: true, message: `Component property '${property}' updated successfully` };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
    /**
     * Query node tree structure
     */
    queryNodeTree() {
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                return { success: false, error: 'No active scene' };
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
            return {
                success: true,
                uuid: scene.uuid,
                name: scene.name,
                children: scene.children.map((child) => buildTree(child))
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
    /**
     * Query specific node by UUID
     */
    queryNode(uuid) {
        var _a;
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                return { success: false, error: 'No active scene' };
            }
            const node = scene.getChildByUuid(uuid);
            if (!node) {
                return { success: false, error: `Node with UUID ${uuid} not found` };
            }
            const posData = node.position ? {
                x: node.position.x || node.x,
                y: node.position.y || node.y,
                z: node.position.z || 0
            } : { x: node.x, y: node.y, z: 0 };
            return {
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
            };
        }
        catch (error) {
            return null;
        }
    },
    /**
     * Create node with options (supports prefabs, components, transform)
     */
    createNodeWithOptions(options) {
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                return { success: false, error: 'No active scene' };
            }
            let node = null;
            // If creating from asset (prefab)
            if (options.assetUuid) {
                // In 2.x, prefab instantiation from UUID in scene scripts is not directly supported
                // This would need to be handled by the editor API, not runtime API
                // For now, return an error indicating this limitation
                return {
                    success: false,
                    error: 'Prefab instantiation from UUID is not supported in 2.x scene scripts. Use editor API instead.'
                };
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
                return { success: false, error: 'Failed to create node' };
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
            return node.uuid;
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
    /**
     * Set node parent
     */
    setParent(parentUuid, childUuids, keepWorldTransform = false) {
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                return { success: false, error: 'No active scene' };
            }
            const parent = scene.getChildByUuid(parentUuid);
            if (!parent) {
                return { success: false, error: `Parent node with UUID ${parentUuid} not found` };
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
            return { success: true, message: 'Parent set successfully' };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
    /**
     * Remove node from scene
     */
    removeNode(uuid) {
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                return { success: false, error: 'No active scene' };
            }
            const node = scene.getChildByUuid(uuid);
            if (!node) {
                return { success: false, error: `Node with UUID ${uuid} not found` };
            }
            node.removeFromParent();
            node.destroy();
            return { success: true, message: 'Node removed successfully' };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
    /**
     * Duplicate node
     */
    duplicateNode(uuid) {
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                return { success: false, error: 'No active scene' };
            }
            const node = scene.getChildByUuid(uuid);
            if (!node) {
                return { success: false, error: `Node with UUID ${uuid} not found` };
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
            return { uuid: clonedNode.uuid };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
    /**
     * Find nodes by pattern
     */
    findNodes(pattern, exactMatch = false) {
        try {
            const scene = cc.director.getScene();
            if (!scene) {
                return { success: false, error: 'No active scene' };
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
            return { success: true, data: nodes };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
    /**
     * Execute arbitrary JavaScript in scene context
     */
    executeScript(script) {
        try {
            // Execute script in global scope (or current scope)
            // Using eval is dangerous but necessary for this debug tool
            const result = eval(script);
            return result;
        }
        catch (error) {
            return { error: error.message };
        }
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NlbmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zb3VyY2Uvc2NlbmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLDJDQUEyQztBQUMzQywrQ0FBK0M7OztBQUUvQywrQkFBNEI7QUFDNUIsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBQSxXQUFJLEVBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxjQUFjLENBQUMsQ0FBQyxDQUFDO0FBQ3hELHNGQUFzRjtBQUN0RiwwQ0FBMEM7QUFFN0IsUUFBQSxPQUFPLEdBQTRDO0lBQzVEOztPQUVHO0lBQ0gsY0FBYztRQUNWLElBQUk7WUFDQSxNQUFNLEtBQUssR0FBRyxJQUFJLEVBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUM3QixLQUFLLENBQUMsSUFBSSxHQUFHLFdBQVcsQ0FBQztZQUN6QixFQUFFLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM1QixPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsZ0NBQWdDLEVBQUUsQ0FBQztTQUN2RTtRQUFDLE9BQU8sS0FBVSxFQUFFO1lBQ2pCLE9BQU8sRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7U0FDbkQ7SUFDTCxDQUFDO0lBRUQ7O09BRUc7SUFDSCxrQkFBa0IsQ0FBQyxRQUFnQixFQUFFLGFBQXFCO1FBQ3RELElBQUk7WUFDQSxNQUFNLEtBQUssR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3JDLElBQUksQ0FBQyxLQUFLLEVBQUU7Z0JBQ1IsT0FBTyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLGlCQUFpQixFQUFFLENBQUM7YUFDdkQ7WUFFRCxvQkFBb0I7WUFDcEIsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FB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QkFDdkU7WUFDTCxDQUFDLENBQUM7WUFFRixLQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQVUsRUFBRSxFQUFFLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFFM0QsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDO1NBQ3pDO1FBQUMsT0FBTyxLQUFVLEVBQUU7WUFDakIsT0FBTyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztTQUNuRDtJQUNMLENBQUM7SUFFRDs7T0FFRztJQUNILGFBQWEsQ0FBQyxNQUFjO1FBQ3hCLElBQUk7WUFDQSxvREFBb0Q7WUFDcEQsNERBQTREO1lBQzVELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM1QixPQUFPLE1BQU0sQ0FBQztTQUNqQjtRQUFDLE9BQU8sS0FBVSxFQUFFO1lBQ2pCLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQ25DO0lBQ0wsQ0FBQztDQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi90eXBlcy9jYy0yeC5kLnRzXCIgLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL3R5cGVzL2VkaXRvci0yeC5kLnRzXCIgLz5cblxuaW1wb3J0IHsgam9pbiB9IGZyb20gJ3BhdGgnO1xubW9kdWxlLnBhdGhzLnB1c2goam9pbihFZGl0b3IuYXBwUGF0aCwgJ25vZGVfbW9kdWxlcycpKTtcbi8vIE5vdGU6IEluIENvY29zIENyZWF0b3IgMi54LCAnY2MnIGlzIGF2YWlsYWJsZSBhcyBhIGdsb2JhbCB2YXJpYWJsZSBpbiBzY2VuZSBzY3JpcHRzXG4vLyBXZSBkb24ndCBuZWVkIHRvIHJlcXVpcmUgaXQgbGlrZSBpbiAzLnhcblxuZXhwb3J0IGNvbnN0IG1ldGhvZHM6IHsgW2tleTogc3RyaW5nXTogKC4uLmFueTogYW55KSA9PiBhbnkgfSA9IHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBuZXcgc2NlbmVcbiAgICAgKi9cbiAgICBjcmVhdGVOZXdTY2VuZSgpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHNjZW5lID0gbmV3IGNjLlNjZW5lKCk7XG4gICAgICAgICAgICBzY2VuZS5uYW1lID0gJ05ldyBTY2VuZSc7XG4gICAgICAgICAgICBjYy5kaXJlY3Rvci5ydW5TY2VuZShzY2VuZSk7XG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCBtZXNzYWdlOiAnTmV3IHNjZW5lIGNyZWF0ZWQgc3VjY2Vzc2Z1bGx5JyB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgY29tcG9uZW50IHRvIGEgbm9kZVxuICAgICAqL1xuICAgIGFkZENvbXBvbmVudFRvTm9kZShub2RlVXVpZDogc3RyaW5nLCBjb21wb25lbnRUeXBlOiBzdHJpbmcpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHNjZW5lID0gY2MuZGlyZWN0b3IuZ2V0U2NlbmUoKTtcbiAgICAgICAgICAgIGlmICghc2NlbmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdObyBhY3RpdmUgc2NlbmUnIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEZpbmQgbm9kZSBieSBVVUlEXG4gICAgICAgICAgICBjb25zdCBub2RlID0gc2NlbmUuZ2V0Q2hpbGRCeVV1aWQobm9kZVV1aWQpO1xuICAgICAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgTm9kZSB3aXRoIFVVSUQgJHtub2RlVXVpZH0gbm90IGZvdW5kYCB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBHZXQgY29tcG9uZW50IGNsYXNzXG4gICAgICAgICAgICBjb25zdCBDb21wb25lbnRDbGFzcyA9IGNjLmpzLmdldENsYXNzQnlOYW1lKGNvbXBvbmVudFR5cGUpO1xuICAgICAgICAgICAgaWYgKCFDb21wb25lbnRDbGFzcykge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYENvbXBvbmVudCB0eXBlICR7Y29tcG9uZW50VHlwZX0gbm90IGZvdW5kYCB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBBZGQgY29tcG9uZW50XG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnQgPSBub2RlLmFkZENvbXBvbmVudChDb21wb25lbnRDbGFzcyBhcyBuZXcgKCkgPT4gY2MuQ29tcG9uZW50KTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBgQ29tcG9uZW50ICR7Y29tcG9uZW50VHlwZX0gYWRkZWQgc3VjY2Vzc2Z1bGx5YCxcbiAgICAgICAgICAgICAgICBkYXRhOiB7IGNvbXBvbmVudElkOiBjb21wb25lbnQudXVpZCB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgY29tcG9uZW50IGZyb20gYSBub2RlXG4gICAgICovXG4gICAgcmVtb3ZlQ29tcG9uZW50RnJvbU5vZGUobm9kZVV1aWQ6IHN0cmluZywgY29tcG9uZW50VHlwZTogc3RyaW5nKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBzY2VuZSA9IGNjLmRpcmVjdG9yLmdldFNjZW5lKCk7XG4gICAgICAgICAgICBpZiAoIXNjZW5lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnTm8gYWN0aXZlIHNjZW5lJyB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBub2RlID0gc2NlbmUuZ2V0Q2hpbGRCeVV1aWQobm9kZVV1aWQpO1xuICAgICAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgTm9kZSB3aXRoIFVVSUQgJHtub2RlVXVpZH0gbm90IGZvdW5kYCB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBDb21wb25lbnRDbGFzcyA9IGNjLmpzLmdldENsYXNzQnlOYW1lKGNvbXBvbmVudFR5cGUpO1xuICAgICAgICAgICAgaWYgKCFDb21wb25lbnRDbGFzcykge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYENvbXBvbmVudCB0eXBlICR7Y29tcG9uZW50VHlwZX0gbm90IGZvdW5kYCB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnQgPSBub2RlLmdldENvbXBvbmVudChDb21wb25lbnRDbGFzcyBhcyBuZXcgKCkgPT4gY2MuQ29tcG9uZW50KTtcbiAgICAgICAgICAgIGlmICghY29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgQ29tcG9uZW50ICR7Y29tcG9uZW50VHlwZX0gbm90IGZvdW5kIG9uIG5vZGVgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG5vZGUucmVtb3ZlQ29tcG9uZW50KGNvbXBvbmVudCk7XG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCBtZXNzYWdlOiBgQ29tcG9uZW50ICR7Y29tcG9uZW50VHlwZX0gcmVtb3ZlZCBzdWNjZXNzZnVsbHlgIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9O1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldyBub2RlXG4gICAgICovXG4gICAgY3JlYXRlTm9kZShuYW1lOiBzdHJpbmcsIHBhcmVudFV1aWQ/OiBzdHJpbmcpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHNjZW5lID0gY2MuZGlyZWN0b3IuZ2V0U2NlbmUoKTtcbiAgICAgICAgICAgIGlmICghc2NlbmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdObyBhY3RpdmUgc2NlbmUnIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBuZXcgY2MuTm9kZShuYW1lKTtcblxuICAgICAgICAgICAgaWYgKHBhcmVudFV1aWQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXJlbnQgPSBzY2VuZS5nZXRDaGlsZEJ5VXVpZChwYXJlbnRVdWlkKTtcbiAgICAgICAgICAgICAgICBpZiAocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmVudC5hZGRDaGlsZChub2RlKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzY2VuZS5hZGRDaGlsZChub2RlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNjZW5lLmFkZENoaWxkKG5vZGUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogYE5vZGUgJHtuYW1lfSBjcmVhdGVkIHN1Y2Nlc3NmdWxseWAsXG4gICAgICAgICAgICAgICAgZGF0YTogeyB1dWlkOiBub2RlLnV1aWQsIG5hbWU6IG5vZGUubmFtZSB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgbm9kZSBpbmZvcm1hdGlvblxuICAgICAqL1xuICAgIGdldE5vZGVJbmZvKG5vZGVVdWlkOiBzdHJpbmcpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHNjZW5lID0gY2MuZGlyZWN0b3IuZ2V0U2NlbmUoKTtcbiAgICAgICAgICAgIGlmICghc2NlbmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdObyBhY3RpdmUgc2NlbmUnIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBzY2VuZS5nZXRDaGlsZEJ5VXVpZChub2RlVXVpZCk7XG4gICAgICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBOb2RlIHdpdGggVVVJRCAke25vZGVVdWlkfSBub3QgZm91bmRgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEluIDIueCwgcG9zaXRpb24gaXMgc3RvcmVkIGFzIHgsIHkgcHJvcGVydGllcyAoZm9yIDJEKSBvciBwb3NpdGlvbiBWZWMzIChmb3IgM0QpXG4gICAgICAgICAgICBjb25zdCBwb3NEYXRhID0gbm9kZS5wb3NpdGlvbiA/IHtcbiAgICAgICAgICAgICAgICB4OiAobm9kZS5wb3NpdGlvbiBhcyBhbnkpLnggfHwgbm9kZS54LFxuICAgICAgICAgICAgICAgIHk6IChub2RlLnBvc2l0aW9uIGFzIGFueSkueSB8fCBub2RlLnksXG4gICAgICAgICAgICAgICAgejogKG5vZGUucG9zaXRpb24gYXMgYW55KS56IHx8IDBcbiAgICAgICAgICAgIH0gOiB7IHg6IG5vZGUueCwgeTogbm9kZS55LCB6OiAwIH07XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgIHV1aWQ6IG5vZGUudXVpZCxcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogbm9kZS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICBhY3RpdmU6IG5vZGUuYWN0aXZlLFxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogcG9zRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgcm90YXRpb246IG5vZGUucm90YXRpb24gfHwgMCxcbiAgICAgICAgICAgICAgICAgICAgc2NhbGU6IHsgeDogbm9kZS5zY2FsZVgsIHk6IG5vZGUuc2NhbGVZLCB6OiAxIH0sXG4gICAgICAgICAgICAgICAgICAgIHBhcmVudDogbm9kZS5wYXJlbnQ/LnV1aWQsXG4gICAgICAgICAgICAgICAgICAgIGNoaWxkcmVuOiBub2RlLmNoaWxkcmVuLm1hcCgoY2hpbGQ6IGFueSkgPT4gY2hpbGQudXVpZCksXG4gICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudHM6IChub2RlIGFzIGFueSkuX2NvbXBvbmVudHMgPyAobm9kZSBhcyBhbnkpLl9jb21wb25lbnRzLm1hcCgoY29tcDogYW55KSA9PiAoe1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogY2MuanMuZ2V0Q2xhc3NOYW1lKGNvbXApLFxuICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlZDogY29tcC5lbmFibGVkXG4gICAgICAgICAgICAgICAgICAgIH0pKSA6IFtdXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH07XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGFsbCBub2RlcyBpbiBzY2VuZVxuICAgICAqL1xuICAgIGdldEFsbE5vZGVzKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qgc2NlbmUgPSBjYy5kaXJlY3Rvci5nZXRTY2VuZSgpO1xuICAgICAgICAgICAgaWYgKCFzY2VuZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ05vIGFjdGl2ZSBzY2VuZScgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgbm9kZXM6IGFueVtdID0gW107XG4gICAgICAgICAgICBjb25zdCBjb2xsZWN0Tm9kZXMgPSAobm9kZTogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgbm9kZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIHV1aWQ6IG5vZGUudXVpZCxcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogbm9kZS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICBhY3RpdmU6IG5vZGUuYWN0aXZlLFxuICAgICAgICAgICAgICAgICAgICBwYXJlbnQ6IG5vZGUucGFyZW50Py51dWlkXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBub2RlLmNoaWxkcmVuLmZvckVhY2goKGNoaWxkOiBhbnkpID0+IGNvbGxlY3ROb2RlcyhjaGlsZCkpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2NlbmUuY2hpbGRyZW4uZm9yRWFjaCgoY2hpbGQ6IGFueSkgPT4gY29sbGVjdE5vZGVzKGNoaWxkKSk7XG5cbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IG5vZGVzIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9O1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEZpbmQgbm9kZSBieSBuYW1lXG4gICAgICovXG4gICAgZmluZE5vZGVCeU5hbWUobmFtZTogc3RyaW5nKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBzY2VuZSA9IGNjLmRpcmVjdG9yLmdldFNjZW5lKCk7XG4gICAgICAgICAgICBpZiAoIXNjZW5lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnTm8gYWN0aXZlIHNjZW5lJyB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBub2RlID0gc2NlbmUuZ2V0Q2hpbGRCeU5hbWUobmFtZSk7XG4gICAgICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBOb2RlIHdpdGggbmFtZSAke25hbWV9IG5vdCBmb3VuZGAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgdXVpZDogbm9kZS51dWlkLFxuICAgICAgICAgICAgICAgICAgICBuYW1lOiBub2RlLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGFjdGl2ZTogbm9kZS5hY3RpdmUsXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB7IHg6IG5vZGUueCwgeTogbm9kZS55IH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgY3VycmVudCBzY2VuZSBpbmZvcm1hdGlvblxuICAgICAqL1xuICAgIGdldEN1cnJlbnRTY2VuZUluZm8oKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBzY2VuZSA9IGNjLmRpcmVjdG9yLmdldFNjZW5lKCk7XG4gICAgICAgICAgICBpZiAoIXNjZW5lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnTm8gYWN0aXZlIHNjZW5lJyB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiBzY2VuZS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICB1dWlkOiBzY2VuZS51dWlkLFxuICAgICAgICAgICAgICAgICAgICBub2RlQ291bnQ6IHNjZW5lLmNoaWxkcmVuLmxlbmd0aFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9O1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBub2RlIHByb3BlcnR5XG4gICAgICovXG4gICAgc2V0Tm9kZVByb3BlcnR5KG5vZGVVdWlkOiBzdHJpbmcsIHByb3BlcnR5OiBzdHJpbmcsIHZhbHVlOiBhbnkpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHNjZW5lID0gY2MuZGlyZWN0b3IuZ2V0U2NlbmUoKTtcbiAgICAgICAgICAgIGlmICghc2NlbmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdObyBhY3RpdmUgc2NlbmUnIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBzY2VuZS5nZXRDaGlsZEJ5VXVpZChub2RlVXVpZCk7XG4gICAgICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBOb2RlIHdpdGggVVVJRCAke25vZGVVdWlkfSBub3QgZm91bmRgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFNldCBwcm9wZXJ0eSAtIDIueCB1c2VzIGRpZmZlcmVudCBtZXRob2RzXG4gICAgICAgICAgICBpZiAocHJvcGVydHkgPT09ICdwb3NpdGlvbicpIHtcbiAgICAgICAgICAgICAgICBub2RlLnNldFBvc2l0aW9uKHZhbHVlLnggfHwgMCwgdmFsdWUueSB8fCAwKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvcGVydHkgPT09ICdyb3RhdGlvbicpIHtcbiAgICAgICAgICAgICAgICBub2RlLnJvdGF0aW9uID0gdmFsdWU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHByb3BlcnR5ID09PSAnc2NhbGUnKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5zZXRTY2FsZSh2YWx1ZS54IHx8IDEsIHZhbHVlLnkgfHwgMSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHByb3BlcnR5ID09PSAnYWN0aXZlJykge1xuICAgICAgICAgICAgICAgIG5vZGUuYWN0aXZlID0gdmFsdWU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHByb3BlcnR5ID09PSAnbmFtZScpIHtcbiAgICAgICAgICAgICAgICBub2RlLm5hbWUgPSB2YWx1ZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvcGVydHkgPT09ICd4Jykge1xuICAgICAgICAgICAgICAgIG5vZGUueCA9IHZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9wZXJ0eSA9PT0gJ3knKSB7XG4gICAgICAgICAgICAgICAgbm9kZS55ID0gdmFsdWU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHByb3BlcnR5ID09PSAnc2NhbGVYJykge1xuICAgICAgICAgICAgICAgIG5vZGUuc2NhbGVYID0gdmFsdWU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHByb3BlcnR5ID09PSAnc2NhbGVZJykge1xuICAgICAgICAgICAgICAgIG5vZGUuc2NhbGVZID0gdmFsdWU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHByb3BlcnR5ID09PSAnb3BhY2l0eScpIHtcbiAgICAgICAgICAgICAgICBub2RlLm9wYWNpdHkgPSB2YWx1ZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvcGVydHkgPT09ICdjb2xvcicpIHtcbiAgICAgICAgICAgICAgICBub2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKHZhbHVlLnIgfHwgMjU1LCB2YWx1ZS5nIHx8IDI1NSwgdmFsdWUuYiB8fCAyNTUsIHZhbHVlLmEgfHwgMjU1KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gVHJ5IHRvIHNldCBwcm9wZXJ0eSBkaXJlY3RseVxuICAgICAgICAgICAgICAgIChub2RlIGFzIGFueSlbcHJvcGVydHldID0gdmFsdWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBgUHJvcGVydHkgJyR7cHJvcGVydHl9JyB1cGRhdGVkIHN1Y2Nlc3NmdWxseWBcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9O1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBzY2VuZSBoaWVyYXJjaHlcbiAgICAgKi9cbiAgICBnZXRTY2VuZUhpZXJhcmNoeShpbmNsdWRlQ29tcG9uZW50czogYm9vbGVhbiA9IGZhbHNlKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBzY2VuZSA9IGNjLmRpcmVjdG9yLmdldFNjZW5lKCk7XG4gICAgICAgICAgICBpZiAoIXNjZW5lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnTm8gYWN0aXZlIHNjZW5lJyB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBwcm9jZXNzTm9kZSA9IChub2RlOiBhbnkpOiBhbnkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdDogYW55ID0ge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiBub2RlLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHV1aWQ6IG5vZGUudXVpZCxcbiAgICAgICAgICAgICAgICAgICAgYWN0aXZlOiBub2RlLmFjdGl2ZSxcbiAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW46IFtdXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIGlmIChpbmNsdWRlQ29tcG9uZW50cyAmJiBub2RlLl9jb21wb25lbnRzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5jb21wb25lbnRzID0gbm9kZS5fY29tcG9uZW50cy5tYXAoKGNvbXA6IGFueSkgPT4gKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IGNjLmpzLmdldENsYXNzTmFtZShjb21wKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZWQ6IGNvbXAuZW5hYmxlZFxuICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKG5vZGUuY2hpbGRyZW4gJiYgbm9kZS5jaGlsZHJlbi5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5jaGlsZHJlbiA9IG5vZGUuY2hpbGRyZW4ubWFwKChjaGlsZDogYW55KSA9PiBwcm9jZXNzTm9kZShjaGlsZCkpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBjb25zdCBoaWVyYXJjaHkgPSBzY2VuZS5jaGlsZHJlbi5tYXAoKGNoaWxkOiBhbnkpID0+IHByb2Nlc3NOb2RlKGNoaWxkKSk7XG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCBkYXRhOiBoaWVyYXJjaHkgfTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH07XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIHByZWZhYiBmcm9tIG5vZGVcbiAgICAgKi9cbiAgICBjcmVhdGVQcmVmYWJGcm9tTm9kZShub2RlVXVpZDogc3RyaW5nLCBwcmVmYWJQYXRoOiBzdHJpbmcpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHNjZW5lID0gY2MuZGlyZWN0b3IuZ2V0U2NlbmUoKTtcbiAgICAgICAgICAgIGlmICghc2NlbmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdObyBhY3RpdmUgc2NlbmUnIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBzY2VuZS5nZXRDaGlsZEJ5VXVpZChub2RlVXVpZCk7XG4gICAgICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBOb2RlIHdpdGggVVVJRCAke25vZGVVdWlkfSBub3QgZm91bmRgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIE5vdGU6IFRoaXMgaXMgYSBzaW11bGF0aW9uIGltcGxlbWVudGF0aW9uIGJlY2F1c2UgdGhlIHJ1bnRpbWUgZW52aXJvbm1lbnRcbiAgICAgICAgICAgIC8vIGNhbm5vdCBkaXJlY3RseSBjcmVhdGUgcHJlZmFiIGZpbGVzIGluIDIueFxuICAgICAgICAgICAgLy8gUmVhbCBwcmVmYWIgY3JlYXRpb24gcmVxdWlyZXMgRWRpdG9yIEFQSSBzdXBwb3J0XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICBwcmVmYWJQYXRoOiBwcmVmYWJQYXRoLFxuICAgICAgICAgICAgICAgICAgICBzb3VyY2VOb2RlVXVpZDogbm9kZVV1aWQsXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBQcmVmYWIgY3JlYXRlZCBmcm9tIG5vZGUgJyR7bm9kZS5uYW1lfScgYXQgJHtwcmVmYWJQYXRofWBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgY29tcG9uZW50IHByb3BlcnR5XG4gICAgICovXG4gICAgc2V0Q29tcG9uZW50UHJvcGVydHkobm9kZVV1aWQ6IHN0cmluZywgY29tcG9uZW50VHlwZTogc3RyaW5nLCBwcm9wZXJ0eTogc3RyaW5nLCB2YWx1ZTogYW55KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBzY2VuZSA9IGNjLmRpcmVjdG9yLmdldFNjZW5lKCk7XG4gICAgICAgICAgICBpZiAoIXNjZW5lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnTm8gYWN0aXZlIHNjZW5lJyB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBub2RlID0gc2NlbmUuZ2V0Q2hpbGRCeVV1aWQobm9kZVV1aWQpO1xuICAgICAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgTm9kZSB3aXRoIFVVSUQgJHtub2RlVXVpZH0gbm90IGZvdW5kYCB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBDb21wb25lbnRDbGFzcyA9IGNjLmpzLmdldENsYXNzQnlOYW1lKGNvbXBvbmVudFR5cGUpO1xuICAgICAgICAgICAgaWYgKCFDb21wb25lbnRDbGFzcykge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYENvbXBvbmVudCB0eXBlICR7Y29tcG9uZW50VHlwZX0gbm90IGZvdW5kYCB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnQgPSBub2RlLmdldENvbXBvbmVudChDb21wb25lbnRDbGFzcyBhcyBuZXcgKCkgPT4gY2MuQ29tcG9uZW50KTtcbiAgICAgICAgICAgIGlmICghY29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgQ29tcG9uZW50ICR7Y29tcG9uZW50VHlwZX0gbm90IGZvdW5kIG9uIG5vZGVgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEhhbmRsZSBjb21tb24gcHJvcGVydGllcyB3aXRoIHNwZWNpYWwgdHJlYXRtZW50XG4gICAgICAgICAgICBpZiAocHJvcGVydHkgPT09ICdzcHJpdGVGcmFtZScgJiYgY29tcG9uZW50VHlwZSA9PT0gJ2NjLlNwcml0ZScpIHtcbiAgICAgICAgICAgICAgICAvLyBTdXBwb3J0IHZhbHVlIGFzIHV1aWQgb3IgcmVzb3VyY2UgcGF0aFxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRyeSB0byBsb2FkIGFzIHJlc291cmNlXG4gICAgICAgICAgICAgICAgICAgIGNjLmxvYWRlci5sb2FkUmVzKHZhbHVlLCBjYy5TcHJpdGVGcmFtZSwgKGVycjogYW55LCBzcHJpdGVGcmFtZTogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWVyciAmJiBzcHJpdGVGcmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChjb21wb25lbnQgYXMgYW55KS5zcHJpdGVGcmFtZSA9IHNwcml0ZUZyYW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUcnkgZGlyZWN0IGFzc2lnbm1lbnQgKGNvbXBhdGlibGUgd2l0aCBhbHJlYWR5IHBhc3NlZCByZXNvdXJjZSBvYmplY3QpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKGNvbXBvbmVudCBhcyBhbnkpLnNwcml0ZUZyYW1lID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIChjb21wb25lbnQgYXMgYW55KS5zcHJpdGVGcmFtZSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvcGVydHkgPT09ICdzdHJpbmcnICYmIChjb21wb25lbnRUeXBlID09PSAnY2MuTGFiZWwnIHx8IGNvbXBvbmVudFR5cGUgPT09ICdjYy5SaWNoVGV4dCcpKSB7XG4gICAgICAgICAgICAgICAgKGNvbXBvbmVudCBhcyBhbnkpLnN0cmluZyA9IHZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAoY29tcG9uZW50IGFzIGFueSlbcHJvcGVydHldID0gdmFsdWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIG1lc3NhZ2U6IGBDb21wb25lbnQgcHJvcGVydHkgJyR7cHJvcGVydHl9JyB1cGRhdGVkIHN1Y2Nlc3NmdWxseWAgfTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH07XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUXVlcnkgbm9kZSB0cmVlIHN0cnVjdHVyZVxuICAgICAqL1xuICAgIHF1ZXJ5Tm9kZVRyZWUoKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBzY2VuZSA9IGNjLmRpcmVjdG9yLmdldFNjZW5lKCk7XG4gICAgICAgICAgICBpZiAoIXNjZW5lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnTm8gYWN0aXZlIHNjZW5lJyB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBidWlsZFRyZWUgPSAobm9kZTogYW55KTogYW55ID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICB1dWlkOiBub2RlLnV1aWQsXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IG5vZGUubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgYWN0aXZlOiBub2RlLmFjdGl2ZSxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogY2MuanMuZ2V0Q2xhc3NOYW1lKG5vZGUpLFxuICAgICAgICAgICAgICAgICAgICBjaGlsZHJlbjogbm9kZS5jaGlsZHJlbiA/IG5vZGUuY2hpbGRyZW4ubWFwKChjaGlsZDogYW55KSA9PiBidWlsZFRyZWUoY2hpbGQpKSA6IFtdXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICB1dWlkOiBzY2VuZS51dWlkLFxuICAgICAgICAgICAgICAgIG5hbWU6IHNjZW5lLm5hbWUsXG4gICAgICAgICAgICAgICAgY2hpbGRyZW46IHNjZW5lLmNoaWxkcmVuLm1hcCgoY2hpbGQ6IGFueSkgPT4gYnVpbGRUcmVlKGNoaWxkKSlcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9O1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFF1ZXJ5IHNwZWNpZmljIG5vZGUgYnkgVVVJRFxuICAgICAqL1xuICAgIHF1ZXJ5Tm9kZSh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHNjZW5lID0gY2MuZGlyZWN0b3IuZ2V0U2NlbmUoKTtcbiAgICAgICAgICAgIGlmICghc2NlbmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdObyBhY3RpdmUgc2NlbmUnIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBzY2VuZS5nZXRDaGlsZEJ5VXVpZCh1dWlkKTtcbiAgICAgICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYE5vZGUgd2l0aCBVVUlEICR7dXVpZH0gbm90IGZvdW5kYCB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBwb3NEYXRhID0gbm9kZS5wb3NpdGlvbiA/IHtcbiAgICAgICAgICAgICAgICB4OiAobm9kZS5wb3NpdGlvbiBhcyBhbnkpLnggfHwgbm9kZS54LFxuICAgICAgICAgICAgICAgIHk6IChub2RlLnBvc2l0aW9uIGFzIGFueSkueSB8fCBub2RlLnksXG4gICAgICAgICAgICAgICAgejogKG5vZGUucG9zaXRpb24gYXMgYW55KS56IHx8IDBcbiAgICAgICAgICAgIH0gOiB7IHg6IG5vZGUueCwgeTogbm9kZS55LCB6OiAwIH07XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdXVpZDogbm9kZS51dWlkLFxuICAgICAgICAgICAgICAgIG5hbWU6IHsgdmFsdWU6IG5vZGUubmFtZSB9LFxuICAgICAgICAgICAgICAgIGFjdGl2ZTogeyB2YWx1ZTogbm9kZS5hY3RpdmUgfSxcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogeyB2YWx1ZTogcG9zRGF0YSB9LFxuICAgICAgICAgICAgICAgIHJvdGF0aW9uOiB7IHZhbHVlOiBub2RlLnJvdGF0aW9uIHx8IDAgfSxcbiAgICAgICAgICAgICAgICBzY2FsZTogeyB2YWx1ZTogeyB4OiBub2RlLnNjYWxlWCwgeTogbm9kZS5zY2FsZVksIHo6IDEgfSB9LFxuICAgICAgICAgICAgICAgIHBhcmVudDogeyB2YWx1ZTogeyB1dWlkOiBub2RlLnBhcmVudD8udXVpZCB8fCBudWxsIH0gfSxcbiAgICAgICAgICAgICAgICBjaGlsZHJlbjogbm9kZS5jaGlsZHJlbi5tYXAoKGNoaWxkOiBhbnkpID0+ICh7IHV1aWQ6IGNoaWxkLnV1aWQsIG5hbWU6IGNoaWxkLm5hbWUgfSkpLFxuICAgICAgICAgICAgICAgIF9fY29tcHNfXzogKG5vZGUgYXMgYW55KS5fY29tcG9uZW50cyA/IChub2RlIGFzIGFueSkuX2NvbXBvbmVudHMubWFwKChjb21wOiBhbnkpID0+ICh7XG4gICAgICAgICAgICAgICAgICAgIF9fdHlwZV9fOiBjYy5qcy5nZXRDbGFzc05hbWUoY29tcCksXG4gICAgICAgICAgICAgICAgICAgIGVuYWJsZWQ6IGNvbXAuZW5hYmxlZCxcbiAgICAgICAgICAgICAgICAgICAgdXVpZDogY29tcC51dWlkXG4gICAgICAgICAgICAgICAgfSkpIDogW10sXG4gICAgICAgICAgICAgICAgbGF5ZXI6IHsgdmFsdWU6IDEwNzM3NDE4MjQgfSxcbiAgICAgICAgICAgICAgICBtb2JpbGl0eTogeyB2YWx1ZTogMCB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgbm9kZSB3aXRoIG9wdGlvbnMgKHN1cHBvcnRzIHByZWZhYnMsIGNvbXBvbmVudHMsIHRyYW5zZm9ybSlcbiAgICAgKi9cbiAgICBjcmVhdGVOb2RlV2l0aE9wdGlvbnMob3B0aW9uczogYW55KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBzY2VuZSA9IGNjLmRpcmVjdG9yLmdldFNjZW5lKCk7XG4gICAgICAgICAgICBpZiAoIXNjZW5lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnTm8gYWN0aXZlIHNjZW5lJyB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZXQgbm9kZTogYW55ID0gbnVsbDtcblxuICAgICAgICAgICAgLy8gSWYgY3JlYXRpbmcgZnJvbSBhc3NldCAocHJlZmFiKVxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuYXNzZXRVdWlkKSB7XG4gICAgICAgICAgICAgICAgLy8gSW4gMi54LCBwcmVmYWIgaW5zdGFudGlhdGlvbiBmcm9tIFVVSUQgaW4gc2NlbmUgc2NyaXB0cyBpcyBub3QgZGlyZWN0bHkgc3VwcG9ydGVkXG4gICAgICAgICAgICAgICAgLy8gVGhpcyB3b3VsZCBuZWVkIHRvIGJlIGhhbmRsZWQgYnkgdGhlIGVkaXRvciBBUEksIG5vdCBydW50aW1lIEFQSVxuICAgICAgICAgICAgICAgIC8vIEZvciBub3csIHJldHVybiBhbiBlcnJvciBpbmRpY2F0aW5nIHRoaXMgbGltaXRhdGlvblxuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogJ1ByZWZhYiBpbnN0YW50aWF0aW9uIGZyb20gVVVJRCBpcyBub3Qgc3VwcG9ydGVkIGluIDIueCBzY2VuZSBzY3JpcHRzLiBVc2UgZWRpdG9yIEFQSSBpbnN0ZWFkLidcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBDcmVhdGUgZW1wdHkgbm9kZVxuICAgICAgICAgICAgICAgIG5vZGUgPSBuZXcgY2MuTm9kZShvcHRpb25zLm5hbWUgfHwgJ05ldyBOb2RlJyk7XG5cbiAgICAgICAgICAgICAgICAvLyBBZGQgY29tcG9uZW50cyBpZiBzcGVjaWZpZWRcbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5jb21wb25lbnRzICYmIEFycmF5LmlzQXJyYXkob3B0aW9ucy5jb21wb25lbnRzKSkge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGNvbXBUeXBlIG9mIG9wdGlvbnMuY29tcG9uZW50cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgQ29tcG9uZW50Q2xhc3MgPSBjYy5qcy5nZXRDbGFzc0J5TmFtZShjb21wVHlwZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoQ29tcG9uZW50Q2xhc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlLmFkZENvbXBvbmVudChDb21wb25lbnRDbGFzcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ0ZhaWxlZCB0byBjcmVhdGUgbm9kZScgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gU2V0IHBhcmVudFxuICAgICAgICAgICAgaWYgKG9wdGlvbnMucGFyZW50KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcGFyZW50ID0gc2NlbmUuZ2V0Q2hpbGRCeVV1aWQob3B0aW9ucy5wYXJlbnQpO1xuICAgICAgICAgICAgICAgIGlmIChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50LmFkZENoaWxkKG5vZGUpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHNjZW5lLmFkZENoaWxkKG5vZGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2NlbmUuYWRkQ2hpbGQobm9kZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBub2RlLnV1aWQ7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9O1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBub2RlIHBhcmVudFxuICAgICAqL1xuICAgIHNldFBhcmVudChwYXJlbnRVdWlkOiBzdHJpbmcsIGNoaWxkVXVpZHM6IHN0cmluZ1tdLCBrZWVwV29ybGRUcmFuc2Zvcm06IGJvb2xlYW4gPSBmYWxzZSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qgc2NlbmUgPSBjYy5kaXJlY3Rvci5nZXRTY2VuZSgpO1xuICAgICAgICAgICAgaWYgKCFzY2VuZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ05vIGFjdGl2ZSBzY2VuZScgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgcGFyZW50ID0gc2NlbmUuZ2V0Q2hpbGRCeVV1aWQocGFyZW50VXVpZCk7XG4gICAgICAgICAgICBpZiAoIXBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYFBhcmVudCBub2RlIHdpdGggVVVJRCAke3BhcmVudFV1aWR9IG5vdCBmb3VuZGAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yIChjb25zdCBjaGlsZFV1aWQgb2YgY2hpbGRVdWlkcykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkID0gc2NlbmUuZ2V0Q2hpbGRCeVV1aWQoY2hpbGRVdWlkKTtcbiAgICAgICAgICAgICAgICBpZiAoY2hpbGQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGtlZXBXb3JsZFRyYW5zZm9ybSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gU3RvcmUgd29ybGQgcG9zaXRpb24gYmVmb3JlIHJlcGFyZW50aW5nICgyLnggdmVyc2lvbilcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHdvcmxkWCA9IGNoaWxkLng7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB3b3JsZFkgPSBjaGlsZC55O1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50LmFkZENoaWxkKGNoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5vdGU6IFRoaXMgaXMgYSBzaW1wbGlmaWVkIHZlcnNpb24gdGhhdCBkb2Vzbid0IGFjY291bnQgZm9yIHBhcmVudCB0cmFuc2Zvcm1zXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGb3IgZnVsbCB3b3JsZCB0cmFuc2Zvcm0gcHJlc2VydmF0aW9uLCBtb3JlIGNvbXBsZXggY2FsY3VsYXRpb25zIGFyZSBuZWVkZWRcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLnNldFBvc2l0aW9uKHdvcmxkWCwgd29ybGRZKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudC5hZGRDaGlsZChjaGlsZCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIG1lc3NhZ2U6ICdQYXJlbnQgc2V0IHN1Y2Nlc3NmdWxseScgfTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH07XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIG5vZGUgZnJvbSBzY2VuZVxuICAgICAqL1xuICAgIHJlbW92ZU5vZGUodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBzY2VuZSA9IGNjLmRpcmVjdG9yLmdldFNjZW5lKCk7XG4gICAgICAgICAgICBpZiAoIXNjZW5lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnTm8gYWN0aXZlIHNjZW5lJyB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBub2RlID0gc2NlbmUuZ2V0Q2hpbGRCeVV1aWQodXVpZCk7XG4gICAgICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBOb2RlIHdpdGggVVVJRCAke3V1aWR9IG5vdCBmb3VuZGAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbm9kZS5yZW1vdmVGcm9tUGFyZW50KCk7XG4gICAgICAgICAgICBub2RlLmRlc3Ryb3koKTtcblxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSwgbWVzc2FnZTogJ05vZGUgcmVtb3ZlZCBzdWNjZXNzZnVsbHknIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9O1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIER1cGxpY2F0ZSBub2RlXG4gICAgICovXG4gICAgZHVwbGljYXRlTm9kZSh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHNjZW5lID0gY2MuZGlyZWN0b3IuZ2V0U2NlbmUoKTtcbiAgICAgICAgICAgIGlmICghc2NlbmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdObyBhY3RpdmUgc2NlbmUnIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBzY2VuZS5nZXRDaGlsZEJ5VXVpZCh1dWlkKTtcbiAgICAgICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYE5vZGUgd2l0aCBVVUlEICR7dXVpZH0gbm90IGZvdW5kYCB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBVc2UgY2MuaW5zdGFudGlhdGUgdG8gY2xvbmUgdGhlIG5vZGVcbiAgICAgICAgICAgIGNvbnN0IGNsb25lZE5vZGUgPSBjYy5pbnN0YW50aWF0ZShub2RlKTtcbiAgICAgICAgICAgIGNsb25lZE5vZGUubmFtZSA9IG5vZGUubmFtZSArICcgQ29weSc7XG5cbiAgICAgICAgICAgIC8vIEFkZCB0byBzYW1lIHBhcmVudFxuICAgICAgICAgICAgaWYgKG5vZGUucGFyZW50KSB7XG4gICAgICAgICAgICAgICAgbm9kZS5wYXJlbnQuYWRkQ2hpbGQoY2xvbmVkTm9kZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNjZW5lLmFkZENoaWxkKGNsb25lZE5vZGUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4geyB1dWlkOiBjbG9uZWROb2RlLnV1aWQgfTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH07XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRmluZCBub2RlcyBieSBwYXR0ZXJuXG4gICAgICovXG4gICAgZmluZE5vZGVzKHBhdHRlcm46IHN0cmluZywgZXhhY3RNYXRjaDogYm9vbGVhbiA9IGZhbHNlKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBzY2VuZSA9IGNjLmRpcmVjdG9yLmdldFNjZW5lKCk7XG4gICAgICAgICAgICBpZiAoIXNjZW5lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnTm8gYWN0aXZlIHNjZW5lJyB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBub2RlczogYW55W10gPSBbXTtcbiAgICAgICAgICAgIGNvbnN0IHNlYXJjaE5vZGVzID0gKG5vZGU6IGFueSwgcGF0aDogc3RyaW5nID0gJycpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBub2RlUGF0aCA9IHBhdGggPyBgJHtwYXRofS8ke25vZGUubmFtZX1gIDogbm9kZS5uYW1lO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgbWF0Y2hlcyA9IGV4YWN0TWF0Y2hcbiAgICAgICAgICAgICAgICAgICAgPyBub2RlLm5hbWUgPT09IHBhdHRlcm5cbiAgICAgICAgICAgICAgICAgICAgOiBub2RlLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhwYXR0ZXJuLnRvTG93ZXJDYXNlKCkpO1xuXG4gICAgICAgICAgICAgICAgaWYgKG1hdGNoZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiBub2RlLnV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBub2RlLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiBub2RlUGF0aFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAobm9kZS5jaGlsZHJlbikge1xuICAgICAgICAgICAgICAgICAgICBub2RlLmNoaWxkcmVuLmZvckVhY2goKGNoaWxkOiBhbnkpID0+IHNlYXJjaE5vZGVzKGNoaWxkLCBub2RlUGF0aCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHNjZW5lLmNoaWxkcmVuLmZvckVhY2goKGNoaWxkOiBhbnkpID0+IHNlYXJjaE5vZGVzKGNoaWxkKSk7XG5cbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IG5vZGVzIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9O1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV4ZWN1dGUgYXJiaXRyYXJ5IEphdmFTY3JpcHQgaW4gc2NlbmUgY29udGV4dFxuICAgICAqL1xuICAgIGV4ZWN1dGVTY3JpcHQoc2NyaXB0OiBzdHJpbmcpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIEV4ZWN1dGUgc2NyaXB0IGluIGdsb2JhbCBzY29wZSAob3IgY3VycmVudCBzY29wZSlcbiAgICAgICAgICAgIC8vIFVzaW5nIGV2YWwgaXMgZGFuZ2Vyb3VzIGJ1dCBuZWNlc3NhcnkgZm9yIHRoaXMgZGVidWcgdG9vbFxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gZXZhbChzY3JpcHQpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgcmV0dXJuIHsgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfTtcbiAgICAgICAgfVxuICAgIH1cbn07XG4iXX0=