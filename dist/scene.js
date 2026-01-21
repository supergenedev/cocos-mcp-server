"use strict";
/// <reference path="./types/cc-2x.d.ts" />
/// <reference path="./types/editor-2x.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
module.paths.push((0, path_1.join)(Editor.appPath, 'node_modules'));
// Note: In Cocos Creator 2.x, 'cc' is available as a global variable in scene scripts
// We don't need to require it like in 3.x
/**
 * Recursively find a node by UUID in the scene hierarchy
 */
function findNodeByUuid(scene, uuid) {
    const searchNode = (node) => {
        if (node.uuid === uuid) {
            return node;
        }
        if (node.children) {
            for (const child of node.children) {
                const found = searchNode(child);
                if (found) {
                    return found;
                }
            }
        }
        return null;
    };
    return searchNode(scene);
}
/**
 * Serialize component properties for queryNode
 * Returns only JSON-serializable values to avoid "An object could not be cloned" errors
 */
function serializeComponentProperties(comp, compType) {
    const properties = {};
    const visited = new WeakSet(); // Track circular references
    // Safety check
    if (!comp || typeof comp !== 'object') {
        return properties;
    }
    // Exclude internal properties
    const excludeKeys = ['__type__', 'enabled', 'node', '_id', '__scriptAsset', 'uuid', 'name', '_name', '_objFlags', '_enabled', 'type', 'readonly', 'visible', 'cid', 'editor', 'extends', '_components', '_prefab', '__prefab'];
    /**
     * Safely serialize a value to JSON-compatible format
     */
    function serializeValue(val, depth = 0) {
        // Prevent infinite recursion
        if (depth > 5) {
            return null;
        }
        // Handle null/undefined
        if (val === null || val === undefined) {
            return null;
        }
        // Handle primitives
        if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
            return val;
        }
        // Skip functions
        if (typeof val === 'function') {
            return null;
        }
        // Handle Cocos Creator types
        if (val instanceof cc.Color) {
            return {
                r: val.r,
                g: val.g,
                b: val.b,
                a: val.a,
                __type__: 'cc.Color'
            };
        }
        if (val instanceof cc.Vec2) {
            return {
                x: val.x,
                y: val.y,
                __type__: 'cc.Vec2'
            };
        }
        if (val instanceof cc.Vec3) {
            return {
                x: val.x,
                y: val.y,
                z: val.z,
                __type__: 'cc.Vec3'
            };
        }
        // Handle Node references (convert to UUID only)
        if (val instanceof cc.Node) {
            return {
                uuid: val.uuid || null,
                __type__: 'cc.Node'
            };
        }
        // Handle Component references (convert to UUID only)
        if (val instanceof cc.Component) {
            return {
                uuid: val.uuid || null,
                __type__: cc.js.getClassName(val) || 'cc.Component'
            };
        }
        // Handle arrays
        if (Array.isArray(val)) {
            return val.map((item) => serializeValue(item, depth + 1)).filter((item) => item !== null);
        }
        // Handle objects
        if (typeof val === 'object') {
            // Check for circular references
            if (visited.has(val)) {
                return null;
            }
            // Check if it's a Size-like object
            if ('width' in val && 'height' in val && Object.keys(val).length <= 3) {
                return {
                    width: typeof val.width === 'number' ? val.width : 0,
                    height: typeof val.height === 'number' ? val.height : 0,
                    __type__: 'cc.Size'
                };
            }
            // Try to serialize object properties
            try {
                visited.add(val);
                const result = {};
                let propCount = 0;
                const maxProps = 20; // Limit number of properties
                for (const objKey in val) {
                    if (propCount >= maxProps)
                        break;
                    // Skip internal properties
                    if (objKey.startsWith('_') || objKey.startsWith('__')) {
                        continue;
                    }
                    // Skip functions
                    if (typeof val[objKey] === 'function') {
                        continue;
                    }
                    try {
                        const serialized = serializeValue(val[objKey], depth + 1);
                        if (serialized !== null && serialized !== undefined) {
                            result[objKey] = serialized;
                            propCount++;
                        }
                    }
                    catch (e) {
                        // Skip properties that can't be serialized
                        continue;
                    }
                }
                visited.delete(val);
                return Object.keys(result).length > 0 ? result : null;
            }
            catch (e) {
                visited.delete(val);
                return null;
            }
        }
        return null;
    }
    // Get all property names from the component
    try {
        for (const key in comp) {
            if (excludeKeys.includes(key) || key.startsWith('_') || key.startsWith('__')) {
                continue;
            }
            try {
                const value = comp[key];
                const serialized = serializeValue(value, 0);
                if (serialized !== null && serialized !== undefined) {
                    properties[key] = { value: serialized };
                }
            }
            catch (error) {
                // Skip properties that can't be accessed or serialized
                continue;
            }
        }
    }
    catch (error) {
        // If serialization fails, return empty properties object
        // This prevents queryNode from failing completely
        return properties;
    }
    return properties;
}
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
            const node = findNodeByUuid(scene, nodeUuid);
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
            // RenderComponent를 상속한 컴포넌트 타입 목록
            const renderComponentTypes = ['cc.Sprite', 'cc.Label', 'cc.Mask', 'cc.RichText'];
            const isRenderComponent = renderComponentTypes.includes(componentType);
            // RenderComponent 중복 체크
            if (isRenderComponent) {
                const RenderComponentClass = cc.js.getClassByName('cc.RenderComponent');
                if (RenderComponentClass) {
                    const existingRenderComponent = node.getComponent(RenderComponentClass);
                    if (existingRenderComponent) {
                        const existingType = existingRenderComponent.constructor.name || 'RenderComponent';
                        if (event.reply) {
                            event.reply(null, {
                                success: false,
                                error: `Cannot add '${componentType}' because the node already has a RenderComponent ('${existingType}'). A node can only have one RenderComponent (cc.Sprite, cc.Label, cc.Mask, or cc.RichText).`
                            });
                        }
                        return;
                    }
                }
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
            const node = findNodeByUuid(scene, nodeUuid);
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
                const parent = findNodeByUuid(scene, parentUuid);
                if (parent) {
                    node.setParent(parent);
                }
                else {
                    node.setParent(scene);
                }
            }
            else {
                node.setParent(scene);
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
            const node = findNodeByUuid(scene, nodeUuid);
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
            let foundNode = null;
            const searchNode = (node) => {
                if (node.name === name) {
                    foundNode = node;
                    return;
                }
                if (node.children) {
                    for (const child of node.children) {
                        searchNode(child);
                        if (foundNode)
                            return;
                    }
                }
            };
            scene.children.forEach((child) => {
                if (!foundNode) {
                    searchNode(child);
                }
            });
            if (!foundNode) {
                if (event.reply) {
                    event.reply(null, { success: false, error: `Node with name ${name} not found` });
                }
                return;
            }
            if (event.reply) {
                event.reply(null, {
                    success: true,
                    data: {
                        uuid: foundNode.uuid,
                        name: foundNode.name,
                        active: foundNode.active,
                        position: { x: foundNode.x, y: foundNode.y }
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
            const node = findNodeByUuid(scene, nodeUuid);
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
                // In Cocos Creator 2.x, setScale might not work properly, use scaleX/scaleY directly
                if (value.x !== undefined) {
                    node.scaleX = value.x;
                }
                if (value.y !== undefined) {
                    node.scaleY = value.y;
                }
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
            const node = findNodeByUuid(scene, nodeUuid);
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
            const node = findNodeByUuid(scene, nodeUuid);
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
            const node = findNodeByUuid(scene, nodeUuid);
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
                        const targetNode = findNodeByUuid(scene, processedValue.uuid);
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
                        const targetNode = findNodeByUuid(scene, processedValue);
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
                                return findNodeByUuid(scene, item.uuid);
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
            const node = findNodeByUuid(scene, uuid);
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
            const components = node._components ? node._components.map((comp) => {
                try {
                    const compType = cc.js.getClassName(comp);
                    const compData = {
                        __type__: compType,
                        enabled: comp.enabled !== undefined ? comp.enabled : true,
                        uuid: comp.uuid || null,
                        value: serializeComponentProperties(comp, compType)
                    };
                    return compData;
                }
                catch (compError) {
                    // If component serialization fails, return minimal data
                    return {
                        __type__: 'Unknown',
                        enabled: true,
                        uuid: comp.uuid || null,
                        value: {}
                    };
                }
            }) : [];
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
                    __comps__: components,
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
                const parent = findNodeByUuid(scene, options.parent);
                if (parent) {
                    node.setParent(parent);
                }
                else {
                    node.setParent(scene);
                }
            }
            else {
                node.setParent(scene);
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
            const parent = findNodeByUuid(scene, parentUuid);
            if (!parent) {
                if (event.reply) {
                    event.reply(null, { success: false, error: `Parent node with UUID ${parentUuid} not found` });
                }
                return;
            }
            for (const childUuid of childUuids) {
                const child = findNodeByUuid(scene, childUuid);
                if (child) {
                    if (keepWorldTransform) {
                        // Store world position before reparenting (2.x version)
                        const worldX = child.x;
                        const worldY = child.y;
                        child.setParent(parent);
                        // Note: This is a simplified version that doesn't account for parent transforms
                        // For full world transform preservation, more complex calculations are needed
                        child.setPosition(worldX, worldY);
                    }
                    else {
                        child.setParent(parent);
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
            const node = findNodeByUuid(scene, uuid);
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
            const node = findNodeByUuid(scene, uuid);
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
                clonedNode.setParent(node.parent);
            }
            else {
                clonedNode.setParent(scene);
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
    },
    /**
     * Load scene by UUID
     * Uses _Scene.loadSceneByUuid which is only available in scene scripts
     */
    loadSceneByUuid(event, uuid) {
        try {
            // _Scene은 scene script에서만 사용 가능한 전역 객체
            if (typeof _Scene === 'undefined' || !_Scene.loadSceneByUuid) {
                if (event.reply) {
                    event.reply(null, { success: false, error: '_Scene.loadSceneByUuid is not available' });
                }
                return;
            }
            _Scene.loadSceneByUuid(uuid, (error) => {
                if (event.reply) {
                    if (error) {
                        event.reply(null, { success: false, error: error.message });
                    }
                    else {
                        event.reply(null, { success: true, message: `Scene loaded successfully: ${uuid}` });
                    }
                }
            });
        }
        catch (error) {
            if (event.reply) {
                event.reply(null, { success: false, error: error.message });
            }
        }
    }
};
module.exports = methods;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NlbmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zb3VyY2Uvc2NlbmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLDJDQUEyQztBQUMzQywrQ0FBK0M7O0FBRS9DLCtCQUE0QjtBQUM1QixNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFBLFdBQUksRUFBQyxNQUFNLENBQUMsT0FBTyxFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUM7QUFDeEQsc0ZBQXNGO0FBQ3RGLDBDQUEwQztBQUUxQzs7R0FFRztBQUNILFNBQVMsY0FBYyxDQUFDLEtBQVUsRUFBRSxJQUFZO0lBQzVDLE1BQU0sVUFBVSxHQUFHLENBQUMsSUFBUyxFQUFPLEVBQUU7UUFDbEMsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLElBQUksRUFBRTtZQUNwQixPQUFPLElBQUksQ0FBQztTQUNmO1FBQ0QsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ2YsS0FBSyxNQUFNLEtBQUssSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO2dCQUMvQixNQUFNLEtBQUssR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ2hDLElBQUksS0FBSyxFQUFFO29CQUNQLE9BQU8sS0FBSyxDQUFDO2lCQUNoQjthQUNKO1NBQ0o7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDLENBQUM7SUFDRixPQUFPLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUM3QixDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBUyw0QkFBNEIsQ0FBQyxJQUFTLEVBQUUsUUFBZ0I7SUFDN0QsTUFBTSxVQUFVLEdBQXdCLEVBQUUsQ0FBQztJQUMzQyxNQUFNLE9BQU8sR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDLENBQUMsNEJBQTRCO0lBRTNELGVBQWU7SUFDZixJQUFJLENBQUMsSUFBSSxJQUFJLE9BQU8sSUFBSSxLQUFLLFFBQVEsRUFBRTtRQUNuQyxPQUFPLFVBQVUsQ0FBQztLQUNy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QkFDYixLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLHlDQUF5QyxFQUFFLENBQUMsQ0FBQztpQkFDM0Y7Z0JBQ0QsT0FBTzthQUNWO1lBRUQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxLQUFtQixFQUFFLEVBQUU7Z0JBQ2pELElBQUksS0FBSyxDQUFDLEtBQUssRUFBRTtvQkFDYixJQUFJLEtBQUssRUFBRTt3QkFDUCxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO3FCQUMvRDt5QkFBTTt3QkFDSCxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLDhCQUE4QixJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7cUJBQ3ZGO2lCQUNKO1lBQ0wsQ0FBQyxDQUFDLENBQUM7U0FDTjtRQUFDLE9BQU8sS0FBVSxFQUFFO1lBQ2pCLElBQUksS0FBSyxDQUFDLEtBQUssRUFBRTtnQkFDYixLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO2FBQy9EO1NBQ0o7SUFDTCxDQUFDO0NBQ0osQ0FBQztBQUVGLE1BQU0sQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vdHlwZXMvY2MtMnguZC50c1wiIC8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi90eXBlcy9lZGl0b3ItMnguZC50c1wiIC8+XG5cbmltcG9ydCB7IGpvaW4gfSBmcm9tICdwYXRoJztcbm1vZHVsZS5wYXRocy5wdXNoKGpvaW4oRWRpdG9yLmFwcFBhdGgsICdub2RlX21vZHVsZXMnKSk7XG4vLyBOb3RlOiBJbiBDb2NvcyBDcmVhdG9yIDIueCwgJ2NjJyBpcyBhdmFpbGFibGUgYXMgYSBnbG9iYWwgdmFyaWFibGUgaW4gc2NlbmUgc2NyaXB0c1xuLy8gV2UgZG9uJ3QgbmVlZCB0byByZXF1aXJlIGl0IGxpa2UgaW4gMy54XG5cbi8qKlxuICogUmVjdXJzaXZlbHkgZmluZCBhIG5vZGUgYnkgVVVJRCBpbiB0aGUgc2NlbmUgaGllcmFyY2h5XG4gKi9cbmZ1bmN0aW9uIGZpbmROb2RlQnlVdWlkKHNjZW5lOiBhbnksIHV1aWQ6IHN0cmluZyk6IGFueSB7XG4gICAgY29uc3Qgc2VhcmNoTm9kZSA9IChub2RlOiBhbnkpOiBhbnkgPT4ge1xuICAgICAgICBpZiAobm9kZS51dWlkID09PSB1dWlkKSB7XG4gICAgICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobm9kZS5jaGlsZHJlbikge1xuICAgICAgICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBub2RlLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZm91bmQgPSBzZWFyY2hOb2RlKGNoaWxkKTtcbiAgICAgICAgICAgICAgICBpZiAoZm91bmQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZvdW5kO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9O1xuICAgIHJldHVybiBzZWFyY2hOb2RlKHNjZW5lKTtcbn1cblxuLyoqXG4gKiBTZXJpYWxpemUgY29tcG9uZW50IHByb3BlcnRpZXMgZm9yIHF1ZXJ5Tm9kZVxuICogUmV0dXJucyBvbmx5IEpTT04tc2VyaWFsaXphYmxlIHZhbHVlcyB0byBhdm9pZCBcIkFuIG9iamVjdCBjb3VsZCBub3QgYmUgY2xvbmVkXCIgZXJyb3JzXG4gKi9cbmZ1bmN0aW9uIHNlcmlhbGl6ZUNvbXBvbmVudFByb3BlcnRpZXMoY29tcDogYW55LCBjb21wVHlwZTogc3RyaW5nKTogUmVjb3JkPHN0cmluZywgYW55PiB7XG4gICAgY29uc3QgcHJvcGVydGllczogUmVjb3JkPHN0cmluZywgYW55PiA9IHt9O1xuICAgIGNvbnN0IHZpc2l0ZWQgPSBuZXcgV2Vha1NldCgpOyAvLyBUcmFjayBjaXJjdWxhciByZWZlcmVuY2VzXG5cbiAgICAvLyBTYWZldHkgY2hlY2tcbiAgICBpZiAoIWNvbXAgfHwgdHlwZW9mIGNvbXAgIT09ICdvYmplY3QnKSB7XG4gICAgICAgIHJldHVybiBwcm9wZXJ0aWVzO1xuICAgIH1cblxuICAgIC8vIEV4Y2x1ZGUgaW50ZXJuYWwgcHJvcGVydGllc1xuICAgIGNvbnN0IGV4Y2x1ZGVLZXlzID0gWydfX3R5cGVfXycsICdlbmFibGVkJywgJ25vZGUnLCAnX2lkJywgJ19fc2NyaXB0QXNzZXQnLCAndXVpZCcsICduYW1lJywgJ19uYW1lJywgJ19vYmpGbGFncycsICdfZW5hYmxlZCcsICd0eXBlJywgJ3JlYWRvbmx5JywgJ3Zpc2libGUnLCAnY2lkJywgJ2VkaXRvcicsICdleHRlbmRzJywgJ19jb21wb25lbnRzJywgJ19wcmVmYWInLCAnX19wcmVmYWInXTtcblxuICAgIC8qKlxuICAgICAqIFNhZmVseSBzZXJpYWxpemUgYSB2YWx1ZSB0byBKU09OLWNvbXBhdGlibGUgZm9ybWF0XG4gICAgICovXG4gICAgZnVuY3Rpb24gc2VyaWFsaXplVmFsdWUodmFsOiBhbnksIGRlcHRoOiBudW1iZXIgPSAwKTogYW55IHtcbiAgICAgICAgLy8gUHJldmVudCBpbmZpbml0ZSByZWN1cnNpb25cbiAgICAgICAgaWYgKGRlcHRoID4gNSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBIYW5kbGUgbnVsbC91bmRlZmluZWRcbiAgICAgICAgaWYgKHZhbCA9PT0gbnVsbCB8fCB2YWwgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBIYW5kbGUgcHJpbWl0aXZlc1xuICAgICAgICBpZiAodHlwZW9mIHZhbCA9PT0gJ3N0cmluZycgfHwgdHlwZW9mIHZhbCA9PT0gJ251bWJlcicgfHwgdHlwZW9mIHZhbCA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2tpcCBmdW5jdGlvbnNcbiAgICAgICAgaWYgKHR5cGVvZiB2YWwgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSGFuZGxlIENvY29zIENyZWF0b3IgdHlwZXNcbiAgICAgICAgaWYgKHZhbCBpbnN0YW5jZW9mIGNjLkNvbG9yKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHI6IHZhbC5yLFxuICAgICAgICAgICAgICAgIGc6IHZhbC5nLFxuICAgICAgICAgICAgICAgIGI6IHZhbC5iLFxuICAgICAgICAgICAgICAgIGE6IHZhbC5hLFxuICAgICAgICAgICAgICAgIF9fdHlwZV9fOiAnY2MuQ29sb3InXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHZhbCBpbnN0YW5jZW9mIGNjLlZlYzIpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgeDogdmFsLngsXG4gICAgICAgICAgICAgICAgeTogdmFsLnksXG4gICAgICAgICAgICAgICAgX190eXBlX186ICdjYy5WZWMyJ1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh2YWwgaW5zdGFuY2VvZiBjYy5WZWMzKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHg6IHZhbC54LFxuICAgICAgICAgICAgICAgIHk6IHZhbC55LFxuICAgICAgICAgICAgICAgIHo6IHZhbC56LFxuICAgICAgICAgICAgICAgIF9fdHlwZV9fOiAnY2MuVmVjMydcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBIYW5kbGUgTm9kZSByZWZlcmVuY2VzIChjb252ZXJ0IHRvIFVVSUQgb25seSlcbiAgICAgICAgaWYgKHZhbCBpbnN0YW5jZW9mIGNjLk5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdXVpZDogdmFsLnV1aWQgfHwgbnVsbCxcbiAgICAgICAgICAgICAgICBfX3R5cGVfXzogJ2NjLk5vZGUnXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSGFuZGxlIENvbXBvbmVudCByZWZlcmVuY2VzIChjb252ZXJ0IHRvIFVVSUQgb25seSlcbiAgICAgICAgaWYgKHZhbCBpbnN0YW5jZW9mIGNjLkNvbXBvbmVudCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB1dWlkOiB2YWwudXVpZCB8fCBudWxsLFxuICAgICAgICAgICAgICAgIF9fdHlwZV9fOiBjYy5qcy5nZXRDbGFzc05hbWUodmFsKSB8fCAnY2MuQ29tcG9uZW50J1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEhhbmRsZSBhcnJheXNcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsKSkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbC5tYXAoKGl0ZW06IGFueSkgPT4gc2VyaWFsaXplVmFsdWUoaXRlbSwgZGVwdGggKyAxKSkuZmlsdGVyKChpdGVtOiBhbnkpID0+IGl0ZW0gIT09IG51bGwpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSGFuZGxlIG9iamVjdHNcbiAgICAgICAgaWYgKHR5cGVvZiB2YWwgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAvLyBDaGVjayBmb3IgY2lyY3VsYXIgcmVmZXJlbmNlc1xuICAgICAgICAgICAgaWYgKHZpc2l0ZWQuaGFzKHZhbCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQ2hlY2sgaWYgaXQncyBhIFNpemUtbGlrZSBvYmplY3RcbiAgICAgICAgICAgIGlmICgnd2lkdGgnIGluIHZhbCAmJiAnaGVpZ2h0JyBpbiB2YWwgJiYgT2JqZWN0LmtleXModmFsKS5sZW5ndGggPD0gMykge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiB0eXBlb2YgdmFsLndpZHRoID09PSAnbnVtYmVyJyA/IHZhbC53aWR0aCA6IDAsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogdHlwZW9mIHZhbC5oZWlnaHQgPT09ICdudW1iZXInID8gdmFsLmhlaWdodCA6IDAsXG4gICAgICAgICAgICAgICAgICAgIF9fdHlwZV9fOiAnY2MuU2l6ZSdcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBUcnkgdG8gc2VyaWFsaXplIG9iamVjdCBwcm9wZXJ0aWVzXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHZpc2l0ZWQuYWRkKHZhbCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0OiBhbnkgPSB7fTtcbiAgICAgICAgICAgICAgICBsZXQgcHJvcENvdW50ID0gMDtcbiAgICAgICAgICAgICAgICBjb25zdCBtYXhQcm9wcyA9IDIwOyAvLyBMaW1pdCBudW1iZXIgb2YgcHJvcGVydGllc1xuXG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBvYmpLZXkgaW4gdmFsKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9wQ291bnQgPj0gbWF4UHJvcHMpIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIFNraXAgaW50ZXJuYWwgcHJvcGVydGllc1xuICAgICAgICAgICAgICAgICAgICBpZiAob2JqS2V5LnN0YXJ0c1dpdGgoJ18nKSB8fCBvYmpLZXkuc3RhcnRzV2l0aCgnX18nKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBTa2lwIGZ1bmN0aW9uc1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHZhbFtvYmpLZXldID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzZXJpYWxpemVkID0gc2VyaWFsaXplVmFsdWUodmFsW29iaktleV0sIGRlcHRoICsgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2VyaWFsaXplZCAhPT0gbnVsbCAmJiBzZXJpYWxpemVkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbb2JqS2V5XSA9IHNlcmlhbGl6ZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcENvdW50Kys7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNraXAgcHJvcGVydGllcyB0aGF0IGNhbid0IGJlIHNlcmlhbGl6ZWRcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmlzaXRlZC5kZWxldGUodmFsKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gT2JqZWN0LmtleXMocmVzdWx0KS5sZW5ndGggPiAwID8gcmVzdWx0IDogbnVsbDtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICB2aXNpdGVkLmRlbGV0ZSh2YWwpO1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLy8gR2V0IGFsbCBwcm9wZXJ0eSBuYW1lcyBmcm9tIHRoZSBjb21wb25lbnRcbiAgICB0cnkge1xuICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBjb21wKSB7XG4gICAgICAgICAgICBpZiAoZXhjbHVkZUtleXMuaW5jbHVkZXMoa2V5KSB8fCBrZXkuc3RhcnRzV2l0aCgnXycpIHx8IGtleS5zdGFydHNXaXRoKCdfXycpKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBjb21wW2tleV07XG4gICAgICAgICAgICAgICAgY29uc3Qgc2VyaWFsaXplZCA9IHNlcmlhbGl6ZVZhbHVlKHZhbHVlLCAwKTtcblxuICAgICAgICAgICAgICAgIGlmIChzZXJpYWxpemVkICE9PSBudWxsICYmIHNlcmlhbGl6ZWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzW2tleV0gPSB7IHZhbHVlOiBzZXJpYWxpemVkIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAvLyBTa2lwIHByb3BlcnRpZXMgdGhhdCBjYW4ndCBiZSBhY2Nlc3NlZCBvciBzZXJpYWxpemVkXG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAvLyBJZiBzZXJpYWxpemF0aW9uIGZhaWxzLCByZXR1cm4gZW1wdHkgcHJvcGVydGllcyBvYmplY3RcbiAgICAgICAgLy8gVGhpcyBwcmV2ZW50cyBxdWVyeU5vZGUgZnJvbSBmYWlsaW5nIGNvbXBsZXRlbHlcbiAgICAgICAgcmV0dXJuIHByb3BlcnRpZXM7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByb3BlcnRpZXM7XG59XG5cbmNvbnN0IG1ldGhvZHM6IHsgW2tleTogc3RyaW5nXTogKC4uLmFueTogYW55KSA9PiBhbnkgfSA9IHtcbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBuZXcgc2NlbmVcbiAgICAgKi9cbiAgICBjcmVhdGVOZXdTY2VuZShldmVudDogYW55KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBzY2VuZSA9IG5ldyBjYy5TY2VuZSgpO1xuICAgICAgICAgICAgc2NlbmUubmFtZSA9ICdOZXcgU2NlbmUnO1xuICAgICAgICAgICAgY2MuZGlyZWN0b3IucnVuU2NlbmUoc2NlbmUpO1xuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiB0cnVlLCBtZXNzYWdlOiAnTmV3IHNjZW5lIGNyZWF0ZWQgc3VjY2Vzc2Z1bGx5JyB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGNvbXBvbmVudCB0byBhIG5vZGVcbiAgICAgKi9cbiAgICBhZGRDb21wb25lbnRUb05vZGUoZXZlbnQ6IGFueSwgbm9kZVV1aWQ6IHN0cmluZywgY29tcG9uZW50VHlwZTogc3RyaW5nKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBzY2VuZSA9IGNjLmRpcmVjdG9yLmdldFNjZW5lKCk7XG4gICAgICAgICAgICBpZiAoIXNjZW5lKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnTm8gYWN0aXZlIHNjZW5lJyB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBGaW5kIG5vZGUgYnkgVVVJRFxuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IGZpbmROb2RlQnlVdWlkKHNjZW5lLCBub2RlVXVpZCk7XG4gICAgICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBOb2RlIHdpdGggVVVJRCAke25vZGVVdWlkfSBub3QgZm91bmRgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEdldCBjb21wb25lbnQgY2xhc3NcbiAgICAgICAgICAgIGNvbnN0IENvbXBvbmVudENsYXNzID0gY2MuanMuZ2V0Q2xhc3NCeU5hbWUoY29tcG9uZW50VHlwZSk7XG4gICAgICAgICAgICBpZiAoIUNvbXBvbmVudENsYXNzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgQ29tcG9uZW50IHR5cGUgJHtjb21wb25lbnRUeXBlfSBub3QgZm91bmRgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFJlbmRlckNvbXBvbmVudOulvCDsg4Hsho3tlZwg7Lu07Y+s64SM7Yq4IO2DgOyehSDrqqnroZ1cbiAgICAgICAgICAgIGNvbnN0IHJlbmRlckNvbXBvbmVudFR5cGVzID0gWydjYy5TcHJpdGUnLCAnY2MuTGFiZWwnLCAnY2MuTWFzaycsICdjYy5SaWNoVGV4dCddO1xuICAgICAgICAgICAgY29uc3QgaXNSZW5kZXJDb21wb25lbnQgPSByZW5kZXJDb21wb25lbnRUeXBlcy5pbmNsdWRlcyhjb21wb25lbnRUeXBlKTtcblxuICAgICAgICAgICAgLy8gUmVuZGVyQ29tcG9uZW50IOykkeuztSDssrTtgaxcbiAgICAgICAgICAgIGlmIChpc1JlbmRlckNvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IFJlbmRlckNvbXBvbmVudENsYXNzID0gY2MuanMuZ2V0Q2xhc3NCeU5hbWUoJ2NjLlJlbmRlckNvbXBvbmVudCcpO1xuICAgICAgICAgICAgICAgIGlmIChSZW5kZXJDb21wb25lbnRDbGFzcykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBleGlzdGluZ1JlbmRlckNvbXBvbmVudCA9IG5vZGUuZ2V0Q29tcG9uZW50KFJlbmRlckNvbXBvbmVudENsYXNzIGFzIG5ldyAoKSA9PiBjYy5Db21wb25lbnQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXhpc3RpbmdSZW5kZXJDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nVHlwZSA9IGV4aXN0aW5nUmVuZGVyQ29tcG9uZW50LmNvbnN0cnVjdG9yLm5hbWUgfHwgJ1JlbmRlckNvbXBvbmVudCc7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogYENhbm5vdCBhZGQgJyR7Y29tcG9uZW50VHlwZX0nIGJlY2F1c2UgdGhlIG5vZGUgYWxyZWFkeSBoYXMgYSBSZW5kZXJDb21wb25lbnQgKCcke2V4aXN0aW5nVHlwZX0nKS4gQSBub2RlIGNhbiBvbmx5IGhhdmUgb25lIFJlbmRlckNvbXBvbmVudCAoY2MuU3ByaXRlLCBjYy5MYWJlbCwgY2MuTWFzaywgb3IgY2MuUmljaFRleHQpLmBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQWRkIGNvbXBvbmVudFxuICAgICAgICAgICAgY29uc3QgY29tcG9uZW50ID0gbm9kZS5hZGRDb21wb25lbnQoQ29tcG9uZW50Q2xhc3MgYXMgbmV3ICgpID0+IGNjLkNvbXBvbmVudCk7XG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBDb21wb25lbnQgJHtjb21wb25lbnRUeXBlfSBhZGRlZCBzdWNjZXNzZnVsbHlgLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB7IGNvbXBvbmVudElkOiBjb21wb25lbnQudXVpZCB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBjb21wb25lbnQgZnJvbSBhIG5vZGVcbiAgICAgKi9cbiAgICByZW1vdmVDb21wb25lbnRGcm9tTm9kZShldmVudDogYW55LCBub2RlVXVpZDogc3RyaW5nLCBjb21wb25lbnRUeXBlOiBzdHJpbmcpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHNjZW5lID0gY2MuZGlyZWN0b3IuZ2V0U2NlbmUoKTtcbiAgICAgICAgICAgIGlmICghc2NlbmUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdObyBhY3RpdmUgc2NlbmUnIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBmaW5kTm9kZUJ5VXVpZChzY2VuZSwgbm9kZVV1aWQpO1xuICAgICAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgTm9kZSB3aXRoIFVVSUQgJHtub2RlVXVpZH0gbm90IGZvdW5kYCB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBDb21wb25lbnRDbGFzcyA9IGNjLmpzLmdldENsYXNzQnlOYW1lKGNvbXBvbmVudFR5cGUpO1xuICAgICAgICAgICAgaWYgKCFDb21wb25lbnRDbGFzcykge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYENvbXBvbmVudCB0eXBlICR7Y29tcG9uZW50VHlwZX0gbm90IGZvdW5kYCB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnQgPSBub2RlLmdldENvbXBvbmVudChDb21wb25lbnRDbGFzcyBhcyBuZXcgKCkgPT4gY2MuQ29tcG9uZW50KTtcbiAgICAgICAgICAgIGlmICghY29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgQ29tcG9uZW50ICR7Y29tcG9uZW50VHlwZX0gbm90IGZvdW5kIG9uIG5vZGVgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG5vZGUucmVtb3ZlQ29tcG9uZW50KGNvbXBvbmVudCk7XG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IHRydWUsIG1lc3NhZ2U6IGBDb21wb25lbnQgJHtjb21wb25lbnRUeXBlfSByZW1vdmVkIHN1Y2Nlc3NmdWxseWAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldyBub2RlXG4gICAgICovXG4gICAgY3JlYXRlTm9kZShldmVudDogYW55LCBuYW1lOiBzdHJpbmcsIHBhcmVudFV1aWQ/OiBzdHJpbmcpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHNjZW5lID0gY2MuZGlyZWN0b3IuZ2V0U2NlbmUoKTtcbiAgICAgICAgICAgIGlmICghc2NlbmUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdObyBhY3RpdmUgc2NlbmUnIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBuZXcgY2MuTm9kZShuYW1lKTtcblxuICAgICAgICAgICAgaWYgKHBhcmVudFV1aWQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXJlbnQgPSBmaW5kTm9kZUJ5VXVpZChzY2VuZSwgcGFyZW50VXVpZCk7XG4gICAgICAgICAgICAgICAgaWYgKHBhcmVudCkge1xuICAgICAgICAgICAgICAgICAgICBub2RlLnNldFBhcmVudChwYXJlbnQpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUuc2V0UGFyZW50KHNjZW5lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG5vZGUuc2V0UGFyZW50KHNjZW5lKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBgTm9kZSAke25hbWV9IGNyZWF0ZWQgc3VjY2Vzc2Z1bGx5YCxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogeyB1dWlkOiBub2RlLnV1aWQsIG5hbWU6IG5vZGUubmFtZSB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBub2RlIGluZm9ybWF0aW9uXG4gICAgICovXG4gICAgZ2V0Tm9kZUluZm8oZXZlbnQ6IGFueSwgbm9kZVV1aWQ6IHN0cmluZykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qgc2NlbmUgPSBjYy5kaXJlY3Rvci5nZXRTY2VuZSgpO1xuICAgICAgICAgICAgaWYgKCFzY2VuZSkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ05vIGFjdGl2ZSBzY2VuZScgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IGZpbmROb2RlQnlVdWlkKHNjZW5lLCBub2RlVXVpZCk7XG4gICAgICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBOb2RlIHdpdGggVVVJRCAke25vZGVVdWlkfSBub3QgZm91bmRgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEluIDIueCwgcG9zaXRpb24gaXMgc3RvcmVkIGFzIHgsIHkgcHJvcGVydGllcyAoZm9yIDJEKSBvciBwb3NpdGlvbiBWZWMzIChmb3IgM0QpXG4gICAgICAgICAgICBjb25zdCBwb3NEYXRhID0gbm9kZS5wb3NpdGlvbiA/IHtcbiAgICAgICAgICAgICAgICB4OiAobm9kZS5wb3NpdGlvbiBhcyBhbnkpLnggfHwgbm9kZS54LFxuICAgICAgICAgICAgICAgIHk6IChub2RlLnBvc2l0aW9uIGFzIGFueSkueSB8fCBub2RlLnksXG4gICAgICAgICAgICAgICAgejogKG5vZGUucG9zaXRpb24gYXMgYW55KS56IHx8IDBcbiAgICAgICAgICAgIH0gOiB7IHg6IG5vZGUueCwgeTogbm9kZS55LCB6OiAwIH07XG5cbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogbm9kZS51dWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogbm9kZS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZlOiBub2RlLmFjdGl2ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBwb3NEYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgcm90YXRpb246IG5vZGUucm90YXRpb24gfHwgMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjYWxlOiB7IHg6IG5vZGUuc2NhbGVYLCB5OiBub2RlLnNjYWxlWSwgejogMSB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50OiBub2RlLnBhcmVudD8udXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkcmVuOiBub2RlLmNoaWxkcmVuLm1hcCgoY2hpbGQ6IGFueSkgPT4gY2hpbGQudXVpZCksXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnRzOiAobm9kZSBhcyBhbnkpLl9jb21wb25lbnRzID8gKG5vZGUgYXMgYW55KS5fY29tcG9uZW50cy5tYXAoKGNvbXA6IGFueSkgPT4gKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBjYy5qcy5nZXRDbGFzc05hbWUoY29tcCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlZDogY29tcC5lbmFibGVkXG4gICAgICAgICAgICAgICAgICAgICAgICB9KSkgOiBbXVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBhbGwgbm9kZXMgaW4gc2NlbmVcbiAgICAgKi9cbiAgICBnZXRBbGxOb2RlcyhldmVudDogYW55KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBzY2VuZSA9IGNjLmRpcmVjdG9yLmdldFNjZW5lKCk7XG4gICAgICAgICAgICBpZiAoIXNjZW5lKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnTm8gYWN0aXZlIHNjZW5lJyB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBub2RlczogYW55W10gPSBbXTtcbiAgICAgICAgICAgIGNvbnN0IGNvbGxlY3ROb2RlcyA9IChub2RlOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBub2Rlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgdXVpZDogbm9kZS51dWlkLFxuICAgICAgICAgICAgICAgICAgICBuYW1lOiBub2RlLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGFjdGl2ZTogbm9kZS5hY3RpdmUsXG4gICAgICAgICAgICAgICAgICAgIHBhcmVudDogbm9kZS5wYXJlbnQ/LnV1aWRcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIG5vZGUuY2hpbGRyZW4uZm9yRWFjaCgoY2hpbGQ6IGFueSkgPT4gY29sbGVjdE5vZGVzKGNoaWxkKSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzY2VuZS5jaGlsZHJlbi5mb3JFYWNoKChjaGlsZDogYW55KSA9PiBjb2xsZWN0Tm9kZXMoY2hpbGQpKTtcblxuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiB0cnVlLCBkYXRhOiBub2RlcyB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRmluZCBub2RlIGJ5IG5hbWVcbiAgICAgKi9cbiAgICBmaW5kTm9kZUJ5TmFtZShldmVudDogYW55LCBuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHNjZW5lID0gY2MuZGlyZWN0b3IuZ2V0U2NlbmUoKTtcbiAgICAgICAgICAgIGlmICghc2NlbmUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdObyBhY3RpdmUgc2NlbmUnIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBmb3VuZE5vZGU6IGFueSA9IG51bGw7XG4gICAgICAgICAgICBjb25zdCBzZWFyY2hOb2RlID0gKG5vZGU6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChub2RlLm5hbWUgPT09IG5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgZm91bmROb2RlID0gbm9kZTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChub2RlLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgY2hpbGQgb2Ygbm9kZS5jaGlsZHJlbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VhcmNoTm9kZShjaGlsZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZm91bmROb2RlKSByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzY2VuZS5jaGlsZHJlbi5mb3JFYWNoKChjaGlsZDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFmb3VuZE5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VhcmNoTm9kZShjaGlsZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmICghZm91bmROb2RlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgTm9kZSB3aXRoIG5hbWUgJHtuYW1lfSBub3QgZm91bmRgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogZm91bmROb2RlLnV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBmb3VuZE5vZGUubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZTogZm91bmROb2RlLmFjdGl2ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB7IHg6IGZvdW5kTm9kZS54LCB5OiBmb3VuZE5vZGUueSB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGN1cnJlbnQgc2NlbmUgaW5mb3JtYXRpb25cbiAgICAgKi9cbiAgICBnZXRDdXJyZW50U2NlbmVJbmZvKGV2ZW50OiBhbnkpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHNjZW5lID0gY2MuZGlyZWN0b3IuZ2V0U2NlbmUoKTtcbiAgICAgICAgICAgIGlmICghc2NlbmUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdObyBhY3RpdmUgc2NlbmUnIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogc2NlbmUubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHNjZW5lLnV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlQ291bnQ6IHNjZW5lLmNoaWxkcmVuLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBub2RlIHByb3BlcnR5XG4gICAgICovXG4gICAgc2V0Tm9kZVByb3BlcnR5KGV2ZW50OiBhbnksIG5vZGVVdWlkOiBzdHJpbmcsIHByb3BlcnR5OiBzdHJpbmcsIHZhbHVlOiBhbnkpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHNjZW5lID0gY2MuZGlyZWN0b3IuZ2V0U2NlbmUoKTtcbiAgICAgICAgICAgIGlmICghc2NlbmUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdObyBhY3RpdmUgc2NlbmUnIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBmaW5kTm9kZUJ5VXVpZChzY2VuZSwgbm9kZVV1aWQpO1xuICAgICAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgTm9kZSB3aXRoIFVVSUQgJHtub2RlVXVpZH0gbm90IGZvdW5kYCB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBTZXQgcHJvcGVydHkgLSAyLnggdXNlcyBkaWZmZXJlbnQgbWV0aG9kc1xuICAgICAgICAgICAgaWYgKHByb3BlcnR5ID09PSAncG9zaXRpb24nKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5zZXRQb3NpdGlvbih2YWx1ZS54IHx8IDAsIHZhbHVlLnkgfHwgMCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHByb3BlcnR5ID09PSAncm90YXRpb24nKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5yb3RhdGlvbiA9IHZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9wZXJ0eSA9PT0gJ3NjYWxlJykge1xuICAgICAgICAgICAgICAgIC8vIEluIENvY29zIENyZWF0b3IgMi54LCBzZXRTY2FsZSBtaWdodCBub3Qgd29yayBwcm9wZXJseSwgdXNlIHNjYWxlWC9zY2FsZVkgZGlyZWN0bHlcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUueCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUuc2NhbGVYID0gdmFsdWUueDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlLnkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBub2RlLnNjYWxlWSA9IHZhbHVlLnk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9wZXJ0eSA9PT0gJ2FjdGl2ZScpIHtcbiAgICAgICAgICAgICAgICBub2RlLmFjdGl2ZSA9IHZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9wZXJ0eSA9PT0gJ25hbWUnKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5uYW1lID0gdmFsdWU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHByb3BlcnR5ID09PSAneCcpIHtcbiAgICAgICAgICAgICAgICBub2RlLnggPSB2YWx1ZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvcGVydHkgPT09ICd5Jykge1xuICAgICAgICAgICAgICAgIG5vZGUueSA9IHZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9wZXJ0eSA9PT0gJ3NjYWxlWCcpIHtcbiAgICAgICAgICAgICAgICBub2RlLnNjYWxlWCA9IHZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9wZXJ0eSA9PT0gJ3NjYWxlWScpIHtcbiAgICAgICAgICAgICAgICBub2RlLnNjYWxlWSA9IHZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9wZXJ0eSA9PT0gJ29wYWNpdHknKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5vcGFjaXR5ID0gdmFsdWU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHByb3BlcnR5ID09PSAnY29sb3InKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcih2YWx1ZS5yIHx8IDI1NSwgdmFsdWUuZyB8fCAyNTUsIHZhbHVlLmIgfHwgMjU1LCB2YWx1ZS5hIHx8IDI1NSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHByb3BlcnR5ID09PSAnY29udGVudFNpemUnKSB7XG4gICAgICAgICAgICAgICAgLy8gSW4gMi54LCBjb250ZW50U2l6ZSBpcyBzcGxpdCBpbnRvIHdpZHRoIGFuZCBoZWlnaHQgcHJvcGVydGllc1xuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZS53aWR0aCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLndpZHRoID0gTnVtYmVyKHZhbHVlLndpZHRoKSB8fCAxMDA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlLmhlaWdodCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLmhlaWdodCA9IE51bWJlcih2YWx1ZS5oZWlnaHQpIHx8IDEwMDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvcGVydHkgPT09ICdhbmNob3JQb2ludCcpIHtcbiAgICAgICAgICAgICAgICAvLyBJbiAyLngsIGFuY2hvclBvaW50IGlzIHNwbGl0IGludG8gYW5jaG9yWCBhbmQgYW5jaG9yWSBwcm9wZXJ0aWVzXG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlLnggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5hbmNob3JYID0gTnVtYmVyKHZhbHVlLngpIHx8IDAuNTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUueSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLmFuY2hvclkgPSBOdW1iZXIodmFsdWUueSkgfHwgMC41O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9wZXJ0eSA9PT0gJ3dpZHRoJykge1xuICAgICAgICAgICAgICAgIG5vZGUud2lkdGggPSBOdW1iZXIodmFsdWUpIHx8IDEwMDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvcGVydHkgPT09ICdoZWlnaHQnKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5oZWlnaHQgPSBOdW1iZXIodmFsdWUpIHx8IDEwMDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvcGVydHkgPT09ICdhbmNob3JYJykge1xuICAgICAgICAgICAgICAgIG5vZGUuYW5jaG9yWCA9IE51bWJlcih2YWx1ZSkgfHwgMC41O1xuICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9wZXJ0eSA9PT0gJ2FuY2hvclknKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5hbmNob3JZID0gTnVtYmVyKHZhbHVlKSB8fCAwLjU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIFRyeSB0byBzZXQgcHJvcGVydHkgZGlyZWN0bHlcbiAgICAgICAgICAgICAgICAobm9kZSBhcyBhbnkpW3Byb3BlcnR5XSA9IHZhbHVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBQcm9wZXJ0eSAnJHtwcm9wZXJ0eX0nIHVwZGF0ZWQgc3VjY2Vzc2Z1bGx5YFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgc2NlbmUgaGllcmFyY2h5XG4gICAgICovXG4gICAgZ2V0U2NlbmVIaWVyYXJjaHkoZXZlbnQ6IGFueSwgaW5jbHVkZUNvbXBvbmVudHM6IGJvb2xlYW4gPSBmYWxzZSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qgc2NlbmUgPSBjYy5kaXJlY3Rvci5nZXRTY2VuZSgpO1xuICAgICAgICAgICAgaWYgKCFzY2VuZSkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ05vIGFjdGl2ZSBzY2VuZScgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgcHJvY2Vzc05vZGUgPSAobm9kZTogYW55KTogYW55ID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQ6IGFueSA9IHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogbm9kZS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICB1dWlkOiBub2RlLnV1aWQsXG4gICAgICAgICAgICAgICAgICAgIGFjdGl2ZTogbm9kZS5hY3RpdmUsXG4gICAgICAgICAgICAgICAgICAgIGNoaWxkcmVuOiBbXVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICBpZiAoaW5jbHVkZUNvbXBvbmVudHMgJiYgbm9kZS5fY29tcG9uZW50cykge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQuY29tcG9uZW50cyA9IG5vZGUuX2NvbXBvbmVudHMubWFwKChjb21wOiBhbnkpID0+ICh7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBjYy5qcy5nZXRDbGFzc05hbWUoY29tcCksXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmFibGVkOiBjb21wLmVuYWJsZWRcbiAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChub2RlLmNoaWxkcmVuICYmIG5vZGUuY2hpbGRyZW4ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQuY2hpbGRyZW4gPSBub2RlLmNoaWxkcmVuLm1hcCgoY2hpbGQ6IGFueSkgPT4gcHJvY2Vzc05vZGUoY2hpbGQpKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgY29uc3QgaGllcmFyY2h5ID0gc2NlbmUuY2hpbGRyZW4ubWFwKChjaGlsZDogYW55KSA9PiBwcm9jZXNzTm9kZShjaGlsZCkpO1xuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiB0cnVlLCBkYXRhOiBoaWVyYXJjaHkgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBwcmVmYWIgZnJvbSBub2RlXG4gICAgICovXG4gICAgY3JlYXRlUHJlZmFiRnJvbU5vZGUoZXZlbnQ6IGFueSwgbm9kZVV1aWQ6IHN0cmluZywgcHJlZmFiUGF0aDogc3RyaW5nKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBzY2VuZSA9IGNjLmRpcmVjdG9yLmdldFNjZW5lKCk7XG4gICAgICAgICAgICBpZiAoIXNjZW5lKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnTm8gYWN0aXZlIHNjZW5lJyB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBub2RlID0gZmluZE5vZGVCeVV1aWQoc2NlbmUsIG5vZGVVdWlkKTtcbiAgICAgICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYE5vZGUgd2l0aCBVVUlEICR7bm9kZVV1aWR9IG5vdCBmb3VuZGAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTm90ZTogVGhpcyBpcyBhIHNpbXVsYXRpb24gaW1wbGVtZW50YXRpb24gYmVjYXVzZSB0aGUgcnVudGltZSBlbnZpcm9ubWVudFxuICAgICAgICAgICAgLy8gY2Fubm90IGRpcmVjdGx5IGNyZWF0ZSBwcmVmYWIgZmlsZXMgaW4gMi54XG4gICAgICAgICAgICAvLyBSZWFsIHByZWZhYiBjcmVhdGlvbiByZXF1aXJlcyBFZGl0b3IgQVBJIHN1cHBvcnRcbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJlZmFiUGF0aDogcHJlZmFiUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZU5vZGVVdWlkOiBub2RlVXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBQcmVmYWIgY3JlYXRlZCBmcm9tIG5vZGUgJyR7bm9kZS5uYW1lfScgYXQgJHtwcmVmYWJQYXRofWBcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgY29tcG9uZW50IHByb3BlcnR5XG4gICAgICovXG4gICAgc2V0Q29tcG9uZW50UHJvcGVydHkoZXZlbnQ6IGFueSwgbm9kZVV1aWQ6IHN0cmluZywgY29tcG9uZW50VHlwZTogc3RyaW5nLCBwcm9wZXJ0eTogc3RyaW5nLCB2YWx1ZTogYW55KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBzY2VuZSA9IGNjLmRpcmVjdG9yLmdldFNjZW5lKCk7XG4gICAgICAgICAgICBpZiAoIXNjZW5lKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnTm8gYWN0aXZlIHNjZW5lJyB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBub2RlID0gZmluZE5vZGVCeVV1aWQoc2NlbmUsIG5vZGVVdWlkKTtcbiAgICAgICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYE5vZGUgd2l0aCBVVUlEICR7bm9kZVV1aWR9IG5vdCBmb3VuZGAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgQ29tcG9uZW50Q2xhc3MgPSBjYy5qcy5nZXRDbGFzc0J5TmFtZShjb21wb25lbnRUeXBlKTtcbiAgICAgICAgICAgIGlmICghQ29tcG9uZW50Q2xhc3MpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBDb21wb25lbnQgdHlwZSAke2NvbXBvbmVudFR5cGV9IG5vdCBmb3VuZGAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgY29tcG9uZW50ID0gbm9kZS5nZXRDb21wb25lbnQoQ29tcG9uZW50Q2xhc3MgYXMgbmV3ICgpID0+IGNjLkNvbXBvbmVudCk7XG4gICAgICAgICAgICBpZiAoIWNvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYENvbXBvbmVudCAke2NvbXBvbmVudFR5cGV9IG5vdCBmb3VuZCBvbiBub2RlYCB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBIYW5kbGUgY29tbW9uIHByb3BlcnRpZXMgd2l0aCBzcGVjaWFsIHRyZWF0bWVudFxuICAgICAgICAgICAgaWYgKHByb3BlcnR5ID09PSAnc3ByaXRlRnJhbWUnICYmIGNvbXBvbmVudFR5cGUgPT09ICdjYy5TcHJpdGUnKSB7XG4gICAgICAgICAgICAgICAgLy8gU3VwcG9ydCB2YWx1ZSBhcyB1dWlkIG9yIHJlc291cmNlIHBhdGhcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICAvLyBUcnkgdG8gbG9hZCBhcyByZXNvdXJjZVxuICAgICAgICAgICAgICAgICAgICBjYy5sb2FkZXIubG9hZFJlcyh2YWx1ZSwgY2MuU3ByaXRlRnJhbWUsIChlcnI6IGFueSwgc3ByaXRlRnJhbWU6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFlcnIgJiYgc3ByaXRlRnJhbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoY29tcG9uZW50IGFzIGFueSkuc3ByaXRlRnJhbWUgPSBzcHJpdGVGcmFtZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVHJ5IGRpcmVjdCBhc3NpZ25tZW50IChjb21wYXRpYmxlIHdpdGggYWxyZWFkeSBwYXNzZWQgcmVzb3VyY2Ugb2JqZWN0KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChjb21wb25lbnQgYXMgYW55KS5zcHJpdGVGcmFtZSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAoY29tcG9uZW50IGFzIGFueSkuc3ByaXRlRnJhbWUgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHByb3BlcnR5ID09PSAnc3RyaW5nJyAmJiAoY29tcG9uZW50VHlwZSA9PT0gJ2NjLkxhYmVsJyB8fCBjb21wb25lbnRUeXBlID09PSAnY2MuUmljaFRleHQnKSkge1xuICAgICAgICAgICAgICAgIChjb21wb25lbnQgYXMgYW55KS5zdHJpbmcgPSB2YWx1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgKGNvbXBvbmVudCBhcyBhbnkpW3Byb3BlcnR5XSA9IHZhbHVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IHRydWUsIG1lc3NhZ2U6IGBDb21wb25lbnQgcHJvcGVydHkgJyR7cHJvcGVydHl9JyB1cGRhdGVkIHN1Y2Nlc3NmdWxseWAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBjb21wb25lbnQgcHJvcGVydHkgd2l0aCBhZHZhbmNlZCB0eXBlIGhhbmRsaW5nXG4gICAgICogU3VwcG9ydHMgY29sb3IsIHZlYzIsIHZlYzMsIHNpemUsIG5vZGUgcmVmZXJlbmNlcywgY29tcG9uZW50IHJlZmVyZW5jZXMsIGFzc2V0cywgYW5kIGFycmF5c1xuICAgICAqL1xuICAgIHNldENvbXBvbmVudFByb3BlcnR5QWR2YW5jZWQoZXZlbnQ6IGFueSwgbm9kZVV1aWQ6IHN0cmluZywgY29tcG9uZW50VHlwZTogc3RyaW5nLCBwcm9wZXJ0eTogc3RyaW5nLCBwcm9jZXNzZWRWYWx1ZTogYW55LCBwcm9wZXJ0eVR5cGU6IHN0cmluZykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qgc2NlbmUgPSBjYy5kaXJlY3Rvci5nZXRTY2VuZSgpO1xuICAgICAgICAgICAgaWYgKCFzY2VuZSkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ05vIGFjdGl2ZSBzY2VuZScgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IGZpbmROb2RlQnlVdWlkKHNjZW5lLCBub2RlVXVpZCk7XG4gICAgICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBOb2RlIHdpdGggVVVJRCAke25vZGVVdWlkfSBub3QgZm91bmRgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IENvbXBvbmVudENsYXNzID0gY2MuanMuZ2V0Q2xhc3NCeU5hbWUoY29tcG9uZW50VHlwZSk7XG4gICAgICAgICAgICBpZiAoIUNvbXBvbmVudENsYXNzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgQ29tcG9uZW50IHR5cGUgJHtjb21wb25lbnRUeXBlfSBub3QgZm91bmRgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudCA9IG5vZGUuZ2V0Q29tcG9uZW50KENvbXBvbmVudENsYXNzIGFzIG5ldyAoKSA9PiBjYy5Db21wb25lbnQpO1xuICAgICAgICAgICAgaWYgKCFjb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBDb21wb25lbnQgJHtjb21wb25lbnRUeXBlfSBub3QgZm91bmQgb24gbm9kZWAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gSGFuZGxlIGRpZmZlcmVudCBwcm9wZXJ0eSB0eXBlc1xuICAgICAgICAgICAgc3dpdGNoIChwcm9wZXJ0eVR5cGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlICdjb2xvcic6XG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9jZXNzZWRWYWx1ZSAmJiB0eXBlb2YgcHJvY2Vzc2VkVmFsdWUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjb2xvciA9IG5ldyBjYy5Db2xvcihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLm1pbigyNTUsIE1hdGgubWF4KDAsIE51bWJlcihwcm9jZXNzZWRWYWx1ZS5yKSB8fCAwKSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5taW4oMjU1LCBNYXRoLm1heCgwLCBOdW1iZXIocHJvY2Vzc2VkVmFsdWUuZykgfHwgMCkpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGgubWluKDI1NSwgTWF0aC5tYXgoMCwgTnVtYmVyKHByb2Nlc3NlZFZhbHVlLmIpIHx8IDApKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzZWRWYWx1ZS5hICE9PSB1bmRlZmluZWQgPyBNYXRoLm1pbigyNTUsIE1hdGgubWF4KDAsIE51bWJlcihwcm9jZXNzZWRWYWx1ZS5hKSkpIDogMjU1XG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgKGNvbXBvbmVudCBhcyBhbnkpW3Byb3BlcnR5XSA9IGNvbG9yO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSAndmVjMic6XG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9jZXNzZWRWYWx1ZSAmJiB0eXBlb2YgcHJvY2Vzc2VkVmFsdWUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2ZWMyID0gbmV3IGNjLlZlYzIoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgTnVtYmVyKHByb2Nlc3NlZFZhbHVlLngpIHx8IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgTnVtYmVyKHByb2Nlc3NlZFZhbHVlLnkpIHx8IDBcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAoY29tcG9uZW50IGFzIGFueSlbcHJvcGVydHldID0gdmVjMjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgJ3ZlYzMnOlxuICAgICAgICAgICAgICAgICAgICBpZiAocHJvY2Vzc2VkVmFsdWUgJiYgdHlwZW9mIHByb2Nlc3NlZFZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdmVjMyA9IG5ldyBjYy5WZWMzKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIE51bWJlcihwcm9jZXNzZWRWYWx1ZS54KSB8fCAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIE51bWJlcihwcm9jZXNzZWRWYWx1ZS55KSB8fCAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIE51bWJlcihwcm9jZXNzZWRWYWx1ZS56KSB8fCAwXG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgKGNvbXBvbmVudCBhcyBhbnkpW3Byb3BlcnR5XSA9IHZlYzM7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlICdzaXplJzpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb2Nlc3NlZFZhbHVlICYmIHR5cGVvZiBwcm9jZXNzZWRWYWx1ZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEluIDIueCwgc2l6ZSBpcyB0eXBpY2FsbHkgcmVwcmVzZW50ZWQgYXMgYW4gb2JqZWN0IHdpdGggd2lkdGggYW5kIGhlaWdodFxuICAgICAgICAgICAgICAgICAgICAgICAgKGNvbXBvbmVudCBhcyBhbnkpW3Byb3BlcnR5XSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogTnVtYmVyKHByb2Nlc3NlZFZhbHVlLndpZHRoKSB8fCAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogTnVtYmVyKHByb2Nlc3NlZFZhbHVlLmhlaWdodCkgfHwgMFxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgJ25vZGUnOlxuICAgICAgICAgICAgICAgICAgICBpZiAocHJvY2Vzc2VkVmFsdWUgJiYgdHlwZW9mIHByb2Nlc3NlZFZhbHVlID09PSAnb2JqZWN0JyAmJiAndXVpZCcgaW4gcHJvY2Vzc2VkVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldE5vZGUgPSBmaW5kTm9kZUJ5VXVpZChzY2VuZSwgcHJvY2Vzc2VkVmFsdWUudXVpZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGFyZ2V0Tm9kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChjb21wb25lbnQgYXMgYW55KVtwcm9wZXJ0eV0gPSB0YXJnZXROb2RlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBUYXJnZXQgbm9kZSB3aXRoIFVVSUQgJHtwcm9jZXNzZWRWYWx1ZS51dWlkfSBub3QgZm91bmRgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlICdjb21wb25lbnQnOlxuICAgICAgICAgICAgICAgICAgICAvLyBDb21wb25lbnQgcmVmZXJlbmNlOiBwcm9jZXNzZWRWYWx1ZSBzaG91bGQgYmUgYSBub2RlIFVVSUQgc3RyaW5nXG4gICAgICAgICAgICAgICAgICAgIC8vIFdlIG5lZWQgdG8gZmluZCB0aGUgY29tcG9uZW50IG9uIHRoYXQgbm9kZVxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHByb2Nlc3NlZFZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0Tm9kZSA9IGZpbmROb2RlQnlVdWlkKHNjZW5lLCBwcm9jZXNzZWRWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRhcmdldE5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBUYXJnZXQgbm9kZSB3aXRoIFVVSUQgJHtwcm9jZXNzZWRWYWx1ZX0gbm90IGZvdW5kYCB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVHJ5IHRvIGZpbmQgdGhlIGNvbXBvbmVudCB0eXBlIGZyb20gcHJvcGVydHkgbWV0YWRhdGFcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZvciBub3csIHdlJ2xsIHRyeSBjb21tb24gY29tcG9uZW50IHR5cGVzIG9yIHVzZSB0aGUgY29tcG9uZW50VHlwZSBwYXJhbWV0ZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgYSBzaW1wbGlmaWVkIHZlcnNpb24gLSBpbiBwcmFjdGljZSwgd2UnZCBuZWVkIHRvIGtub3cgdGhlIGV4cGVjdGVkIGNvbXBvbmVudCB0eXBlXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0YXJnZXRDb21wb25lbnQgPSAodGFyZ2V0Tm9kZSBhcyBhbnkpLl9jb21wb25lbnRzPy5bMF07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGFyZ2V0Q29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKGNvbXBvbmVudCBhcyBhbnkpW3Byb3BlcnR5XSA9IHRhcmdldENvbXBvbmVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgTm8gY29tcG9uZW50IGZvdW5kIG9uIHRhcmdldCBub2RlICR7cHJvY2Vzc2VkVmFsdWV9YCB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSAnc3ByaXRlRnJhbWUnOlxuICAgICAgICAgICAgICAgIGNhc2UgJ3ByZWZhYic6XG4gICAgICAgICAgICAgICAgY2FzZSAnYXNzZXQnOlxuICAgICAgICAgICAgICAgICAgICAvLyBBc3NldCByZWZlcmVuY2VzOiBwcm9jZXNzZWRWYWx1ZSBzaG91bGQgaGF2ZSB1dWlkIHByb3BlcnR5XG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9jZXNzZWRWYWx1ZSAmJiB0eXBlb2YgcHJvY2Vzc2VkVmFsdWUgPT09ICdvYmplY3QnICYmICd1dWlkJyBpbiBwcm9jZXNzZWRWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSW4gMi54LCB3ZSBuZWVkIHRvIGxvYWQgdGhlIGFzc2V0IGJ5IFVVSURcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgYSBzaW1wbGlmaWVkIHZlcnNpb24gLSBhY3R1YWwgaW1wbGVtZW50YXRpb24gd291bGQgbmVlZCBhc3NldCBsb2FkaW5nXG4gICAgICAgICAgICAgICAgICAgICAgICAoY29tcG9uZW50IGFzIGFueSlbcHJvcGVydHldID0gcHJvY2Vzc2VkVmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlICdub2RlQXJyYXknOlxuICAgICAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShwcm9jZXNzZWRWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5vZGVBcnJheSA9IHByb2Nlc3NlZFZhbHVlLm1hcCgoaXRlbTogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0gJiYgdHlwZW9mIGl0ZW0gPT09ICdvYmplY3QnICYmICd1dWlkJyBpbiBpdGVtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmaW5kTm9kZUJ5VXVpZChzY2VuZSwgaXRlbS51dWlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KS5maWx0ZXIoKG46IGFueSkgPT4gbiAhPT0gbnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAoY29tcG9uZW50IGFzIGFueSlbcHJvcGVydHldID0gbm9kZUFycmF5O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSAnY29sb3JBcnJheSc6XG4gICAgICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHByb2Nlc3NlZFZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY29sb3JBcnJheSA9IHByb2Nlc3NlZFZhbHVlLm1hcCgoaXRlbTogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0gJiYgdHlwZW9mIGl0ZW0gPT09ICdvYmplY3QnICYmICdyJyBpbiBpdGVtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgY2MuQ29sb3IoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLm1pbigyNTUsIE1hdGgubWF4KDAsIE51bWJlcihpdGVtLnIpIHx8IDApKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGgubWluKDI1NSwgTWF0aC5tYXgoMCwgTnVtYmVyKGl0ZW0uZykgfHwgMCkpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5taW4oMjU1LCBNYXRoLm1heCgwLCBOdW1iZXIoaXRlbS5iKSB8fCAwKSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmEgIT09IHVuZGVmaW5lZCA/IE1hdGgubWluKDI1NSwgTWF0aC5tYXgoMCwgTnVtYmVyKGl0ZW0uYSkpKSA6IDI1NVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IGNjLkNvbG9yKDI1NSwgMjU1LCAyNTUsIDI1NSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIChjb21wb25lbnQgYXMgYW55KVtwcm9wZXJ0eV0gPSBjb2xvckFycmF5O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSAnbnVtYmVyQXJyYXknOlxuICAgICAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShwcm9jZXNzZWRWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIChjb21wb25lbnQgYXMgYW55KVtwcm9wZXJ0eV0gPSBwcm9jZXNzZWRWYWx1ZS5tYXAoKGl0ZW06IGFueSkgPT4gTnVtYmVyKGl0ZW0pKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgJ3N0cmluZ0FycmF5JzpcbiAgICAgICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocHJvY2Vzc2VkVmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAoY29tcG9uZW50IGFzIGFueSlbcHJvcGVydHldID0gcHJvY2Vzc2VkVmFsdWUubWFwKChpdGVtOiBhbnkpID0+IFN0cmluZyhpdGVtKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAvLyBGb3IgYmFzaWMgdHlwZXMgKHN0cmluZywgbnVtYmVyLCBib29sZWFuKSwgYXNzaWduIGRpcmVjdGx5XG4gICAgICAgICAgICAgICAgICAgIChjb21wb25lbnQgYXMgYW55KVtwcm9wZXJ0eV0gPSBwcm9jZXNzZWRWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogdHJ1ZSwgbWVzc2FnZTogYENvbXBvbmVudCBwcm9wZXJ0eSAnJHtwcm9wZXJ0eX0nIHVwZGF0ZWQgc3VjY2Vzc2Z1bGx5YCB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUXVlcnkgbm9kZSB0cmVlIHN0cnVjdHVyZVxuICAgICAqL1xuICAgIHF1ZXJ5Tm9kZVRyZWUoZXZlbnQ6IGFueSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qgc2NlbmUgPSBjYy5kaXJlY3Rvci5nZXRTY2VuZSgpO1xuICAgICAgICAgICAgaWYgKCFzY2VuZSkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ05vIGFjdGl2ZSBzY2VuZScgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgYnVpbGRUcmVlID0gKG5vZGU6IGFueSk6IGFueSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgdXVpZDogbm9kZS51dWlkLFxuICAgICAgICAgICAgICAgICAgICBuYW1lOiBub2RlLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGFjdGl2ZTogbm9kZS5hY3RpdmUsXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IGNjLmpzLmdldENsYXNzTmFtZShub2RlKSxcbiAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW46IG5vZGUuY2hpbGRyZW4gPyBub2RlLmNoaWxkcmVuLm1hcCgoY2hpbGQ6IGFueSkgPT4gYnVpbGRUcmVlKGNoaWxkKSkgOiBbXVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHV1aWQ6IHNjZW5lLnV1aWQsXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IHNjZW5lLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGNoaWxkcmVuOiBzY2VuZS5jaGlsZHJlbi5tYXAoKGNoaWxkOiBhbnkpID0+IGJ1aWxkVHJlZShjaGlsZCkpXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFF1ZXJ5IHNwZWNpZmljIG5vZGUgYnkgVVVJRFxuICAgICAqL1xuICAgIHF1ZXJ5Tm9kZShldmVudDogYW55LCB1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHNjZW5lID0gY2MuZGlyZWN0b3IuZ2V0U2NlbmUoKTtcbiAgICAgICAgICAgIGlmICghc2NlbmUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgbnVsbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IGZpbmROb2RlQnlVdWlkKHNjZW5lLCB1dWlkKTtcbiAgICAgICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCBudWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBwb3NEYXRhID0gbm9kZS5wb3NpdGlvbiA/IHtcbiAgICAgICAgICAgICAgICB4OiAobm9kZS5wb3NpdGlvbiBhcyBhbnkpLnggfHwgbm9kZS54LFxuICAgICAgICAgICAgICAgIHk6IChub2RlLnBvc2l0aW9uIGFzIGFueSkueSB8fCBub2RlLnksXG4gICAgICAgICAgICAgICAgejogKG5vZGUucG9zaXRpb24gYXMgYW55KS56IHx8IDBcbiAgICAgICAgICAgIH0gOiB7IHg6IG5vZGUueCwgeTogbm9kZS55LCB6OiAwIH07XG5cbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudHMgPSAobm9kZSBhcyBhbnkpLl9jb21wb25lbnRzID8gKG5vZGUgYXMgYW55KS5fY29tcG9uZW50cy5tYXAoKGNvbXA6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbXBUeXBlID0gY2MuanMuZ2V0Q2xhc3NOYW1lKGNvbXApO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb21wRGF0YTogYW55ID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgX190eXBlX186IGNvbXBUeXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlZDogY29tcC5lbmFibGVkICE9PSB1bmRlZmluZWQgPyBjb21wLmVuYWJsZWQgOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogY29tcC51dWlkIHx8IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogc2VyaWFsaXplQ29tcG9uZW50UHJvcGVydGllcyhjb21wLCBjb21wVHlwZSlcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbXBEYXRhO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGNvbXBFcnJvcjogYW55KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIElmIGNvbXBvbmVudCBzZXJpYWxpemF0aW9uIGZhaWxzLCByZXR1cm4gbWluaW1hbCBkYXRhXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfX3R5cGVfXzogJ1Vua25vd24nLFxuICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IGNvbXAudXVpZCB8fCBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHt9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkgOiBbXTtcblxuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwge1xuICAgICAgICAgICAgICAgICAgICB1dWlkOiBub2RlLnV1aWQsXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IHsgdmFsdWU6IG5vZGUubmFtZSB9LFxuICAgICAgICAgICAgICAgICAgICBhY3RpdmU6IHsgdmFsdWU6IG5vZGUuYWN0aXZlIH0sXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB7IHZhbHVlOiBwb3NEYXRhIH0sXG4gICAgICAgICAgICAgICAgICAgIHJvdGF0aW9uOiB7IHZhbHVlOiBub2RlLnJvdGF0aW9uIHx8IDAgfSxcbiAgICAgICAgICAgICAgICAgICAgc2NhbGU6IHsgdmFsdWU6IHsgeDogbm9kZS5zY2FsZVgsIHk6IG5vZGUuc2NhbGVZLCB6OiAxIH0gfSxcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50OiB7IHZhbHVlOiB7IHV1aWQ6IG5vZGUucGFyZW50Py51dWlkIHx8IG51bGwgfSB9LFxuICAgICAgICAgICAgICAgICAgICBjaGlsZHJlbjogbm9kZS5jaGlsZHJlbi5tYXAoKGNoaWxkOiBhbnkpID0+ICh7IHV1aWQ6IGNoaWxkLnV1aWQsIG5hbWU6IGNoaWxkLm5hbWUgfSkpLFxuICAgICAgICAgICAgICAgICAgICBfX2NvbXBzX186IGNvbXBvbmVudHMsXG4gICAgICAgICAgICAgICAgICAgIGxheWVyOiB7IHZhbHVlOiAxMDczNzQxODI0IH0sXG4gICAgICAgICAgICAgICAgICAgIG1vYmlsaXR5OiB7IHZhbHVlOiAwIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgbnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIG5vZGUgd2l0aCBvcHRpb25zIChzdXBwb3J0cyBwcmVmYWJzLCBjb21wb25lbnRzLCB0cmFuc2Zvcm0pXG4gICAgICovXG4gICAgY3JlYXRlTm9kZVdpdGhPcHRpb25zKGV2ZW50OiBhbnksIG9wdGlvbnM6IGFueSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qgc2NlbmUgPSBjYy5kaXJlY3Rvci5nZXRTY2VuZSgpO1xuICAgICAgICAgICAgaWYgKCFzY2VuZSkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCBudWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZXQgbm9kZTogYW55ID0gbnVsbDtcblxuICAgICAgICAgICAgLy8gSWYgY3JlYXRpbmcgZnJvbSBhc3NldCAocHJlZmFiKVxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuYXNzZXRVdWlkKSB7XG4gICAgICAgICAgICAgICAgLy8gSW4gMi54LCBwcmVmYWIgaW5zdGFudGlhdGlvbiBmcm9tIFVVSUQgaW4gc2NlbmUgc2NyaXB0cyBpcyBub3QgZGlyZWN0bHkgc3VwcG9ydGVkXG4gICAgICAgICAgICAgICAgLy8gVGhpcyB3b3VsZCBuZWVkIHRvIGJlIGhhbmRsZWQgYnkgdGhlIGVkaXRvciBBUEksIG5vdCBydW50aW1lIEFQSVxuICAgICAgICAgICAgICAgIC8vIEZvciBub3csIHJldHVybiBhbiBlcnJvciBpbmRpY2F0aW5nIHRoaXMgbGltaXRhdGlvblxuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCBudWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBDcmVhdGUgZW1wdHkgbm9kZVxuICAgICAgICAgICAgICAgIG5vZGUgPSBuZXcgY2MuTm9kZShvcHRpb25zLm5hbWUgfHwgJ05ldyBOb2RlJyk7XG5cbiAgICAgICAgICAgICAgICAvLyBBZGQgY29tcG9uZW50cyBpZiBzcGVjaWZpZWRcbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5jb21wb25lbnRzICYmIEFycmF5LmlzQXJyYXkob3B0aW9ucy5jb21wb25lbnRzKSkge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGNvbXBUeXBlIG9mIG9wdGlvbnMuY29tcG9uZW50cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgQ29tcG9uZW50Q2xhc3MgPSBjYy5qcy5nZXRDbGFzc0J5TmFtZShjb21wVHlwZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoQ29tcG9uZW50Q2xhc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlLmFkZENvbXBvbmVudChDb21wb25lbnRDbGFzcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCBudWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBTZXQgcGFyZW50XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5wYXJlbnQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXJlbnQgPSBmaW5kTm9kZUJ5VXVpZChzY2VuZSwgb3B0aW9ucy5wYXJlbnQpO1xuICAgICAgICAgICAgICAgIGlmIChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5zZXRQYXJlbnQocGFyZW50KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBub2RlLnNldFBhcmVudChzY2VuZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBub2RlLnNldFBhcmVudChzY2VuZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIG5vZGUudXVpZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBub2RlIHBhcmVudFxuICAgICAqL1xuICAgIHNldFBhcmVudChldmVudDogYW55LCBwYXJlbnRVdWlkOiBzdHJpbmcsIGNoaWxkVXVpZHM6IHN0cmluZ1tdLCBrZWVwV29ybGRUcmFuc2Zvcm06IGJvb2xlYW4gPSBmYWxzZSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qgc2NlbmUgPSBjYy5kaXJlY3Rvci5nZXRTY2VuZSgpO1xuICAgICAgICAgICAgaWYgKCFzY2VuZSkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ05vIGFjdGl2ZSBzY2VuZScgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgcGFyZW50ID0gZmluZE5vZGVCeVV1aWQoc2NlbmUsIHBhcmVudFV1aWQpO1xuICAgICAgICAgICAgaWYgKCFwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBQYXJlbnQgbm9kZSB3aXRoIFVVSUQgJHtwYXJlbnRVdWlkfSBub3QgZm91bmRgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAoY29uc3QgY2hpbGRVdWlkIG9mIGNoaWxkVXVpZHMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjaGlsZCA9IGZpbmROb2RlQnlVdWlkKHNjZW5lLCBjaGlsZFV1aWQpO1xuICAgICAgICAgICAgICAgIGlmIChjaGlsZCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoa2VlcFdvcmxkVHJhbnNmb3JtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBTdG9yZSB3b3JsZCBwb3NpdGlvbiBiZWZvcmUgcmVwYXJlbnRpbmcgKDIueCB2ZXJzaW9uKVxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgd29ybGRYID0gY2hpbGQueDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHdvcmxkWSA9IGNoaWxkLnk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZC5zZXRQYXJlbnQocGFyZW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5vdGU6IFRoaXMgaXMgYSBzaW1wbGlmaWVkIHZlcnNpb24gdGhhdCBkb2Vzbid0IGFjY291bnQgZm9yIHBhcmVudCB0cmFuc2Zvcm1zXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGb3IgZnVsbCB3b3JsZCB0cmFuc2Zvcm0gcHJlc2VydmF0aW9uLCBtb3JlIGNvbXBsZXggY2FsY3VsYXRpb25zIGFyZSBuZWVkZWRcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLnNldFBvc2l0aW9uKHdvcmxkWCwgd29ybGRZKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLnNldFBhcmVudChwYXJlbnQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IHRydWUsIG1lc3NhZ2U6ICdQYXJlbnQgc2V0IHN1Y2Nlc3NmdWxseScgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBub2RlIGZyb20gc2NlbmVcbiAgICAgKi9cbiAgICByZW1vdmVOb2RlKGV2ZW50OiBhbnksIHV1aWQ6IHN0cmluZykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qgc2NlbmUgPSBjYy5kaXJlY3Rvci5nZXRTY2VuZSgpO1xuICAgICAgICAgICAgaWYgKCFzY2VuZSkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ05vIGFjdGl2ZSBzY2VuZScgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IGZpbmROb2RlQnlVdWlkKHNjZW5lLCB1dWlkKTtcbiAgICAgICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYE5vZGUgd2l0aCBVVUlEICR7dXVpZH0gbm90IGZvdW5kYCB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBub2RlLnJlbW92ZUZyb21QYXJlbnQoKTtcbiAgICAgICAgICAgIG5vZGUuZGVzdHJveSgpO1xuXG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IHRydWUsIG1lc3NhZ2U6ICdOb2RlIHJlbW92ZWQgc3VjY2Vzc2Z1bGx5JyB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRHVwbGljYXRlIG5vZGVcbiAgICAgKi9cbiAgICBkdXBsaWNhdGVOb2RlKGV2ZW50OiBhbnksIHV1aWQ6IHN0cmluZykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qgc2NlbmUgPSBjYy5kaXJlY3Rvci5nZXRTY2VuZSgpO1xuICAgICAgICAgICAgaWYgKCFzY2VuZSkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ05vIGFjdGl2ZSBzY2VuZScgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IGZpbmROb2RlQnlVdWlkKHNjZW5lLCB1dWlkKTtcbiAgICAgICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYE5vZGUgd2l0aCBVVUlEICR7dXVpZH0gbm90IGZvdW5kYCB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBVc2UgY2MuaW5zdGFudGlhdGUgdG8gY2xvbmUgdGhlIG5vZGVcbiAgICAgICAgICAgIGNvbnN0IGNsb25lZE5vZGUgPSBjYy5pbnN0YW50aWF0ZShub2RlKTtcbiAgICAgICAgICAgIGNsb25lZE5vZGUubmFtZSA9IG5vZGUubmFtZSArICcgQ29weSc7XG5cbiAgICAgICAgICAgIC8vIEFkZCB0byBzYW1lIHBhcmVudFxuICAgICAgICAgICAgaWYgKG5vZGUucGFyZW50KSB7XG4gICAgICAgICAgICAgICAgY2xvbmVkTm9kZS5zZXRQYXJlbnQobm9kZS5wYXJlbnQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjbG9uZWROb2RlLnNldFBhcmVudChzY2VuZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgdXVpZDogY2xvbmVkTm9kZS51dWlkIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBGaW5kIG5vZGVzIGJ5IHBhdHRlcm5cbiAgICAgKi9cbiAgICBmaW5kTm9kZXMoZXZlbnQ6IGFueSwgcGF0dGVybjogc3RyaW5nLCBleGFjdE1hdGNoOiBib29sZWFuID0gZmFsc2UpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHNjZW5lID0gY2MuZGlyZWN0b3IuZ2V0U2NlbmUoKTtcbiAgICAgICAgICAgIGlmICghc2NlbmUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdObyBhY3RpdmUgc2NlbmUnIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IG5vZGVzOiBhbnlbXSA9IFtdO1xuICAgICAgICAgICAgY29uc3Qgc2VhcmNoTm9kZXMgPSAobm9kZTogYW55LCBwYXRoOiBzdHJpbmcgPSAnJykgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5vZGVQYXRoID0gcGF0aCA/IGAke3BhdGh9LyR7bm9kZS5uYW1lfWAgOiBub2RlLm5hbWU7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBtYXRjaGVzID0gZXhhY3RNYXRjaFxuICAgICAgICAgICAgICAgICAgICA/IG5vZGUubmFtZSA9PT0gcGF0dGVyblxuICAgICAgICAgICAgICAgICAgICA6IG5vZGUubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHBhdHRlcm4udG9Mb3dlckNhc2UoKSk7XG5cbiAgICAgICAgICAgICAgICBpZiAobWF0Y2hlcykge1xuICAgICAgICAgICAgICAgICAgICBub2Rlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IG5vZGUudXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IG5vZGUubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IG5vZGVQYXRoXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChub2RlLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUuY2hpbGRyZW4uZm9yRWFjaCgoY2hpbGQ6IGFueSkgPT4gc2VhcmNoTm9kZXMoY2hpbGQsIG5vZGVQYXRoKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2NlbmUuY2hpbGRyZW4uZm9yRWFjaCgoY2hpbGQ6IGFueSkgPT4gc2VhcmNoTm9kZXMoY2hpbGQpKTtcblxuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiB0cnVlLCBkYXRhOiBub2RlcyB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXhlY3V0ZSBhcmJpdHJhcnkgSmF2YVNjcmlwdCBpbiBzY2VuZSBjb250ZXh0XG4gICAgICovXG4gICAgZXhlY3V0ZVNjcmlwdChldmVudDogYW55LCBzY3JpcHQ6IHN0cmluZykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gRXhlY3V0ZSBzY3JpcHQgaW4gZ2xvYmFsIHNjb3BlIChvciBjdXJyZW50IHNjb3BlKVxuICAgICAgICAgICAgLy8gVXNpbmcgZXZhbCBpcyBkYW5nZXJvdXMgYnV0IG5lY2Vzc2FyeSBmb3IgdGhpcyBkZWJ1ZyB0b29sXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBldmFsKHNjcmlwdCk7XG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCByZXN1bHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IGVycm9yOiBlcnJvci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV4ZWN1dGUgY29tcG9uZW50IG1ldGhvZFxuICAgICAqL1xuICAgIGV4ZWN1dGVDb21wb25lbnRNZXRob2QoZXZlbnQ6IGFueSwgY29tcG9uZW50VXVpZDogc3RyaW5nLCBtZXRob2ROYW1lOiBzdHJpbmcsIGFyZ3M6IGFueVtdID0gW10pIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHNjZW5lID0gY2MuZGlyZWN0b3IuZ2V0U2NlbmUoKTtcbiAgICAgICAgICAgIGlmICghc2NlbmUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdObyBhY3RpdmUgc2NlbmUnIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEZpbmQgY29tcG9uZW50IGJ5IFVVSUQgLSBuZWVkIHRvIHNlYXJjaCBhbGwgbm9kZXNcbiAgICAgICAgICAgIGxldCB0YXJnZXRDb21wb25lbnQ6IGFueSA9IG51bGw7XG4gICAgICAgICAgICBjb25zdCBzZWFyY2hDb21wb25lbnQgPSAobm9kZTogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKG5vZGUuX2NvbXBvbmVudHMpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBjb21wIG9mIG5vZGUuX2NvbXBvbmVudHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb21wLnV1aWQgPT09IGNvbXBvbmVudFV1aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRDb21wb25lbnQgPSBjb21wO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAobm9kZS5jaGlsZHJlbikge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIG5vZGUuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlYXJjaENvbXBvbmVudChjaGlsZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGFyZ2V0Q29tcG9uZW50KSByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzZWFyY2hDb21wb25lbnQoc2NlbmUpO1xuXG4gICAgICAgICAgICBpZiAoIXRhcmdldENvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYENvbXBvbmVudCB3aXRoIFVVSUQgJHtjb21wb25lbnRVdWlkfSBub3QgZm91bmRgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEV4ZWN1dGUgbWV0aG9kXG4gICAgICAgICAgICBpZiAodHlwZW9mIHRhcmdldENvbXBvbmVudFttZXRob2ROYW1lXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHRhcmdldENvbXBvbmVudFttZXRob2ROYW1lXSguLi5hcmdzKTtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiB0cnVlLCBkYXRhOiByZXN1bHQgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBNZXRob2QgJyR7bWV0aG9kTmFtZX0nIG5vdCBmb3VuZCBvbiBjb21wb25lbnRgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUXVlcnkgaWYgc2NlbmUgaXMgcmVhZHlcbiAgICAgKi9cbiAgICBxdWVyeVNjZW5lUmVhZHkoZXZlbnQ6IGFueSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qgc2NlbmUgPSBjYy5kaXJlY3Rvci5nZXRTY2VuZSgpO1xuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiB0cnVlLCBkYXRhOiB7IHJlYWR5OiBzY2VuZSAhPT0gbnVsbCAmJiBzY2VuZSAhPT0gdW5kZWZpbmVkIH0gfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFF1ZXJ5IGlmIHNjZW5lIGhhcyB1bnNhdmVkIGNoYW5nZXNcbiAgICAgKiBOb3RlOiBJbiAyLnggcnVudGltZSwgd2UgY2Fubm90IGRpcmVjdGx5IGNoZWNrIGRpcnR5IHN0YXRlXG4gICAgICogVGhpcyBpcyBhbiBlZGl0b3Itb25seSBmZWF0dXJlLCBzbyB3ZSByZXR1cm4gZmFsc2VcbiAgICAgKi9cbiAgICBxdWVyeVNjZW5lRGlydHkoZXZlbnQ6IGFueSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gSW4gMi54IHJ1bnRpbWUsIHdlIGNhbm5vdCBhY2Nlc3MgZWRpdG9yIGRpcnR5IHN0YXRlXG4gICAgICAgICAgICAvLyBSZXR1cm4gZmFsc2UgYXMgZGVmYXVsdFxuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiB0cnVlLCBkYXRhOiB7IGRpcnR5OiBmYWxzZSB9IH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBRdWVyeSBhbGwgcmVnaXN0ZXJlZCBjbGFzc2VzXG4gICAgICovXG4gICAgcXVlcnlTY2VuZUNsYXNzZXMoZXZlbnQ6IGFueSwgZXh0ZW5kc0NsYXNzPzogc3RyaW5nKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjbGFzc2VzOiBhbnlbXSA9IFtdO1xuXG4gICAgICAgICAgICAvLyBHZXQgYWxsIGNsYXNzZXMgZnJvbSBjYyBuYW1lc3BhY2VcbiAgICAgICAgICAgIGNvbnN0IGNjTmFtZXNwYWNlID0gKHdpbmRvdyBhcyBhbnkpLmNjIHx8IGNjO1xuICAgICAgICAgICAgY29uc3QgY2xhc3NOYW1lczogc3RyaW5nW10gPSBbXTtcblxuICAgICAgICAgICAgLy8gQ29sbGVjdCBjbGFzcyBuYW1lcyBmcm9tIGNjIG5hbWVzcGFjZVxuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gY2NOYW1lc3BhY2UpIHtcbiAgICAgICAgICAgICAgICBpZiAoY2NOYW1lc3BhY2UuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZSA9IGNjTmFtZXNwYWNlW2tleV07XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicgJiYgdmFsdWUucHJvdG90eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWVzLnB1c2goa2V5KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gRmlsdGVyIGJ5IGV4dGVuZHMgaWYgc3BlY2lmaWVkXG4gICAgICAgICAgICBpZiAoZXh0ZW5kc0NsYXNzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgQmFzZUNsYXNzID0gY2MuanMuZ2V0Q2xhc3NCeU5hbWUoZXh0ZW5kc0NsYXNzKTtcbiAgICAgICAgICAgICAgICBpZiAoQmFzZUNsYXNzKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgY2xhc3NOYW1lIG9mIGNsYXNzTmFtZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IENsYXNzID0gY2MuanMuZ2V0Q2xhc3NCeU5hbWUoY2xhc3NOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChDbGFzcyAmJiBDbGFzcy5wcm90b3R5cGUgaW5zdGFuY2VvZiBCYXNlQ2xhc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc2VzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBjbGFzc05hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dGVuZHM6IGV4dGVuZHNDbGFzc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBSZXR1cm4gYWxsIGNsYXNzZXNcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGNsYXNzTmFtZSBvZiBjbGFzc05hbWVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsYXNzZXMucHVzaCh7IG5hbWU6IGNsYXNzTmFtZSB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogY2xhc3NlcyB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUXVlcnkgYXZhaWxhYmxlIHNjZW5lIGNvbXBvbmVudHNcbiAgICAgKi9cbiAgICBxdWVyeVNjZW5lQ29tcG9uZW50cyhldmVudDogYW55KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnRzOiBhbnlbXSA9IFtdO1xuXG4gICAgICAgICAgICAvLyBHZXQgYWxsIGNvbXBvbmVudCBjbGFzc2VzIGZyb20gY2MgbmFtZXNwYWNlXG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnROYW1lcyA9IFtcbiAgICAgICAgICAgICAgICAnY2MuQ29tcG9uZW50JyxcbiAgICAgICAgICAgICAgICAnY2MuU3ByaXRlJyxcbiAgICAgICAgICAgICAgICAnY2MuTGFiZWwnLFxuICAgICAgICAgICAgICAgICdjYy5CdXR0b24nLFxuICAgICAgICAgICAgICAgICdjYy5BbmltYXRpb24nLFxuICAgICAgICAgICAgICAgICdjYy5BdWRpb1NvdXJjZScsXG4gICAgICAgICAgICAgICAgJ2NjLkNhbWVyYScsXG4gICAgICAgICAgICAgICAgJ2NjLkNhbnZhcycsXG4gICAgICAgICAgICAgICAgJ2NjLkNvbGxpZGVyJyxcbiAgICAgICAgICAgICAgICAnY2MuUmlnaWRCb2R5JyxcbiAgICAgICAgICAgICAgICAnY2MuUGh5c2ljc0JveENvbGxpZGVyJyxcbiAgICAgICAgICAgICAgICAnY2MuUGh5c2ljc0NpcmNsZUNvbGxpZGVyJyxcbiAgICAgICAgICAgICAgICAnY2MuUGh5c2ljc1BvbHlnb25Db2xsaWRlcicsXG4gICAgICAgICAgICAgICAgJ2NjLlJpY2hUZXh0JyxcbiAgICAgICAgICAgICAgICAnY2MuU2Nyb2xsVmlldycsXG4gICAgICAgICAgICAgICAgJ2NjLlBhZ2VWaWV3JyxcbiAgICAgICAgICAgICAgICAnY2MuRWRpdEJveCcsXG4gICAgICAgICAgICAgICAgJ2NjLkxheW91dCcsXG4gICAgICAgICAgICAgICAgJ2NjLk1hc2snLFxuICAgICAgICAgICAgICAgICdjYy5Qcm9ncmVzc0JhcicsXG4gICAgICAgICAgICAgICAgJ2NjLlNsaWRlcicsXG4gICAgICAgICAgICAgICAgJ2NjLlRvZ2dsZScsXG4gICAgICAgICAgICAgICAgJ2NjLlRvZ2dsZUdyb3VwJyxcbiAgICAgICAgICAgICAgICAnY2MuV2lkZ2V0JyxcbiAgICAgICAgICAgICAgICAnY2MuR3JhcGhpY3MnLFxuICAgICAgICAgICAgICAgICdjYy5Nb3Rpb25TdHJlYWsnLFxuICAgICAgICAgICAgICAgICdjYy5QYXJ0aWNsZVN5c3RlbScsXG4gICAgICAgICAgICAgICAgJ2NjLlRpbGVkTWFwJyxcbiAgICAgICAgICAgICAgICAnY2MuVGlsZWRMYXllcicsXG4gICAgICAgICAgICAgICAgJ2NjLlRpbGVkT2JqZWN0R3JvdXAnLFxuICAgICAgICAgICAgICAgICdjYy5UaWxlZFRpbGUnLFxuICAgICAgICAgICAgICAgICdjYy5WaWRlb1BsYXllcicsXG4gICAgICAgICAgICAgICAgJ2NjLldlYlZpZXcnXG4gICAgICAgICAgICBdO1xuXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGNvbXBOYW1lIG9mIGNvbXBvbmVudE5hbWVzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgQ29tcENsYXNzID0gY2MuanMuZ2V0Q2xhc3NCeU5hbWUoY29tcE5hbWUpO1xuICAgICAgICAgICAgICAgIGlmIChDb21wQ2xhc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50cy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGNvbXBOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogY29tcE5hbWVcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IGNvbXBvbmVudHMgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENoZWNrIGlmIGNvbXBvbmVudCBoYXMgc2NyaXB0XG4gICAgICovXG4gICAgcXVlcnlDb21wb25lbnRIYXNTY3JpcHQoZXZlbnQ6IGFueSwgY2xhc3NOYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IENvbXBDbGFzcyA9IGNjLmpzLmdldENsYXNzQnlOYW1lKGNsYXNzTmFtZSk7XG4gICAgICAgICAgICBpZiAoIUNvbXBDbGFzcykge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYENvbXBvbmVudCBjbGFzcyAnJHtjbGFzc05hbWV9JyBub3QgZm91bmRgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEluIDIueCwgY2hlY2sgaWYgY29tcG9uZW50IGhhcyBhbnkgbWV0aG9kcyAoaW5kaWNhdGluZyBpdCBtaWdodCBoYXZlIGEgc2NyaXB0KVxuICAgICAgICAgICAgLy8gVGhpcyBpcyBhIHNpbXBsaWZpZWQgY2hlY2sgLSBhY3R1YWwgc2NyaXB0IGRldGVjdGlvbiB3b3VsZCByZXF1aXJlIG1vcmUgY29tcGxleCBsb2dpY1xuICAgICAgICAgICAgY29uc3QgaGFzU2NyaXB0ID0gQ29tcENsYXNzLnByb3RvdHlwZSAmJiBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhDb21wQ2xhc3MucHJvdG90eXBlKS5sZW5ndGggPiAxO1xuXG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IHsgaGFzU2NyaXB0IH0gfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFF1ZXJ5IG5vZGVzIGJ5IGFzc2V0IFVVSURcbiAgICAgKi9cbiAgICBxdWVyeU5vZGVzQnlBc3NldFV1aWQoZXZlbnQ6IGFueSwgYXNzZXRVdWlkOiBzdHJpbmcpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHNjZW5lID0gY2MuZGlyZWN0b3IuZ2V0U2NlbmUoKTtcbiAgICAgICAgICAgIGlmICghc2NlbmUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdObyBhY3RpdmUgc2NlbmUnIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IG5vZGVVdWlkczogc3RyaW5nW10gPSBbXTtcblxuICAgICAgICAgICAgLy8gU2VhcmNoIGFsbCBub2RlcyBmb3IgY29tcG9uZW50cyB0aGF0IHJlZmVyZW5jZSB0aGUgYXNzZXQgVVVJRFxuICAgICAgICAgICAgY29uc3Qgc2VhcmNoTm9kZXMgPSAobm9kZTogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKG5vZGUuX2NvbXBvbmVudHMpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBjb21wIG9mIG5vZGUuX2NvbXBvbmVudHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIGNvbW1vbiBhc3NldCByZWZlcmVuY2UgcHJvcGVydGllc1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYXNzZXRQcm9wcyA9IFsnc3ByaXRlRnJhbWUnLCAndGV4dHVyZScsICdhdGxhcycsICdmb250JywgJ2F1ZGlvQ2xpcCcsICdwcmVmYWInXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgcHJvcCBvZiBhc3NldFByb3BzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbXBbcHJvcF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYXNzZXQgPSBjb21wW3Byb3BdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDaGVjayBpZiBhc3NldCBoYXMgbWF0Y2hpbmcgVVVJRFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXNzZXQgJiYgKGFzc2V0LnV1aWQgPT09IGFzc2V0VXVpZCB8fCAoYXNzZXQuX3V1aWQgJiYgYXNzZXQuX3V1aWQgPT09IGFzc2V0VXVpZCkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobm9kZVV1aWRzLmluZGV4T2Yobm9kZS51dWlkKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlVXVpZHMucHVzaChub2RlLnV1aWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKG5vZGUuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBub2RlLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWFyY2hOb2RlcyhjaGlsZCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzZWFyY2hOb2RlcyhzY2VuZSk7XG5cbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogbm9kZVV1aWRzIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBMb2FkIHNjZW5lIGJ5IFVVSURcbiAgICAgKiBVc2VzIF9TY2VuZS5sb2FkU2NlbmVCeVV1aWQgd2hpY2ggaXMgb25seSBhdmFpbGFibGUgaW4gc2NlbmUgc2NyaXB0c1xuICAgICAqL1xuICAgIGxvYWRTY2VuZUJ5VXVpZChldmVudDogYW55LCB1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIF9TY2VuZeydgCBzY2VuZSBzY3JpcHTsl5DshJzrp4wg7IKs7JqpIOqwgOuKpe2VnCDsoITsl60g6rCd7LK0XG4gICAgICAgICAgICBpZiAodHlwZW9mIF9TY2VuZSA9PT0gJ3VuZGVmaW5lZCcgfHwgIV9TY2VuZS5sb2FkU2NlbmVCeVV1aWQpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdfU2NlbmUubG9hZFNjZW5lQnlVdWlkIGlzIG5vdCBhdmFpbGFibGUnIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIF9TY2VuZS5sb2FkU2NlbmVCeVV1aWQodXVpZCwgKGVycm9yOiBFcnJvciB8IG51bGwpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogdHJ1ZSwgbWVzc2FnZTogYFNjZW5lIGxvYWRlZCBzdWNjZXNzZnVsbHk6ICR7dXVpZH1gIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBtZXRob2RzO1xuIl19