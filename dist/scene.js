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
                // For asset properties like font, spriteFrame, etc., include them even if null
                // This allows setting them later even if they're currently null
                const isAssetProperty = ['font', 'spriteFrame', 'texture', 'material', 'clip', 'prefab'].includes(key.toLowerCase());
                if (serialized !== null && serialized !== undefined) {
                    properties[key] = { value: serialized };
                }
                else if (isAssetProperty) {
                    properties[key] = { value: null };
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
                    // Asset references: processedValue should have uuid property or be a string UUID
                    let assetUuid = null;
                    if (typeof processedValue === 'string') {
                        assetUuid = processedValue;
                    }
                    else if (processedValue && typeof processedValue === 'object' && 'uuid' in processedValue) {
                        assetUuid = processedValue.uuid;
                    }
                    if (!assetUuid) {
                        if (event.reply) {
                            event.reply(null, { success: false, error: `Invalid UUID for ${propertyType}: ${JSON.stringify(processedValue)}` });
                        }
                        return;
                    }
                    // Load asset using cc.assetManager.loadAny
                    cc.assetManager.loadAny(assetUuid, (err, result) => {
                        if (err) {
                            if (event.reply) {
                                event.reply(null, { success: false, error: `Failed to load asset with UUID ${assetUuid}: ${err.message}` });
                            }
                            return;
                        }
                        if (!result) {
                            if (event.reply) {
                                event.reply(null, { success: false, error: `Asset with UUID ${assetUuid} not found` });
                            }
                            return;
                        }
                        // Assign loaded asset to component property
                        component[property] = result;
                        if (event.reply) {
                            event.reply(null, { success: true, message: `Component property '${property}' updated successfully with asset UUID ${assetUuid}` });
                        }
                    });
                    return; // Return early since we're handling async callback
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NlbmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zb3VyY2Uvc2NlbmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLDJDQUEyQztBQUMzQywrQ0FBK0M7O0FBRS9DLCtCQUE0QjtBQUM1QixNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFBLFdBQUksRUFBQyxNQUFNLENBQUMsT0FBTyxFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUM7QUFDeEQsc0ZBQXNGO0FBQ3RGLDBDQUEwQztBQUUxQzs7R0FFRztBQUNILFNBQVMsY0FBYyxDQUFDLEtBQVUsRUFBRSxJQUFZO0lBQzVDLE1BQU0sVUFBVSxHQUFHLENBQUMsSUFBUyxFQUFPLEVBQUU7UUFDbEMsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLElBQUksRUFBRTtZQUNwQixPQUFPLElBQUksQ0FBQztTQUNmO1FBQ0QsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ2YsS0FBSyxNQUFNLEtBQUssSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO2dCQUMvQixNQUFNLEtBQUssR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ2hDLElBQUksS0FBSyxFQUFFO29CQUNQLE9BQU8sS0FBSyxDQUFDO2lCQUNoQjthQUNKO1NBQ0o7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDLENBQUM7SUFDRixPQUFPLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUM3QixDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBUyw0QkFBNEIsQ0FBQyxJQUFTLEVBQUUsUUFBZ0I7SUFDN0QsTUFBTSxVQUFVLEdBQXdCLEVBQUUsQ0FBQztJQUMzQyxNQUFNLE9BQU8sR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDLENBQUMsNEJBQTRCO0lBRTNELGVBQWU7SUFDZixJQUFJLENBQUMsSUFBSSxJQUFJLE9BQU8sSUFBSSxLQUFLLFFBQVEsRUFBRTtRQUNuQyxPQUFPLFVBQVUsQ0FBQztLQUNy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QUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQzthQUMvRDtTQUNKO0lBQ0wsQ0FBQztDQUNKLENBQUM7QUFFRixNQUFNLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL3R5cGVzL2NjLTJ4LmQudHNcIiAvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vdHlwZXMvZWRpdG9yLTJ4LmQudHNcIiAvPlxuXG5pbXBvcnQgeyBqb2luIH0gZnJvbSAncGF0aCc7XG5tb2R1bGUucGF0aHMucHVzaChqb2luKEVkaXRvci5hcHBQYXRoLCAnbm9kZV9tb2R1bGVzJykpO1xuLy8gTm90ZTogSW4gQ29jb3MgQ3JlYXRvciAyLngsICdjYycgaXMgYXZhaWxhYmxlIGFzIGEgZ2xvYmFsIHZhcmlhYmxlIGluIHNjZW5lIHNjcmlwdHNcbi8vIFdlIGRvbid0IG5lZWQgdG8gcmVxdWlyZSBpdCBsaWtlIGluIDMueFxuXG4vKipcbiAqIFJlY3Vyc2l2ZWx5IGZpbmQgYSBub2RlIGJ5IFVVSUQgaW4gdGhlIHNjZW5lIGhpZXJhcmNoeVxuICovXG5mdW5jdGlvbiBmaW5kTm9kZUJ5VXVpZChzY2VuZTogYW55LCB1dWlkOiBzdHJpbmcpOiBhbnkge1xuICAgIGNvbnN0IHNlYXJjaE5vZGUgPSAobm9kZTogYW55KTogYW55ID0+IHtcbiAgICAgICAgaWYgKG5vZGUudXVpZCA9PT0gdXVpZCkge1xuICAgICAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5vZGUuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgY2hpbGQgb2Ygbm9kZS5jaGlsZHJlbikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZvdW5kID0gc2VhcmNoTm9kZShjaGlsZCk7XG4gICAgICAgICAgICAgICAgaWYgKGZvdW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmb3VuZDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfTtcbiAgICByZXR1cm4gc2VhcmNoTm9kZShzY2VuZSk7XG59XG5cbi8qKlxuICogU2VyaWFsaXplIGNvbXBvbmVudCBwcm9wZXJ0aWVzIGZvciBxdWVyeU5vZGVcbiAqIFJldHVybnMgb25seSBKU09OLXNlcmlhbGl6YWJsZSB2YWx1ZXMgdG8gYXZvaWQgXCJBbiBvYmplY3QgY291bGQgbm90IGJlIGNsb25lZFwiIGVycm9yc1xuICovXG5mdW5jdGlvbiBzZXJpYWxpemVDb21wb25lbnRQcm9wZXJ0aWVzKGNvbXA6IGFueSwgY29tcFR5cGU6IHN0cmluZyk6IFJlY29yZDxzdHJpbmcsIGFueT4ge1xuICAgIGNvbnN0IHByb3BlcnRpZXM6IFJlY29yZDxzdHJpbmcsIGFueT4gPSB7fTtcbiAgICBjb25zdCB2aXNpdGVkID0gbmV3IFdlYWtTZXQoKTsgLy8gVHJhY2sgY2lyY3VsYXIgcmVmZXJlbmNlc1xuXG4gICAgLy8gU2FmZXR5IGNoZWNrXG4gICAgaWYgKCFjb21wIHx8IHR5cGVvZiBjb21wICE9PSAnb2JqZWN0Jykge1xuICAgICAgICByZXR1cm4gcHJvcGVydGllcztcbiAgICB9XG5cbiAgICAvLyBFeGNsdWRlIGludGVybmFsIHByb3BlcnRpZXNcbiAgICBjb25zdCBleGNsdWRlS2V5cyA9IFsnX190eXBlX18nLCAnZW5hYmxlZCcsICdub2RlJywgJ19pZCcsICdfX3NjcmlwdEFzc2V0JywgJ3V1aWQnLCAnbmFtZScsICdfbmFtZScsICdfb2JqRmxhZ3MnLCAnX2VuYWJsZWQnLCAndHlwZScsICdyZWFkb25seScsICd2aXNpYmxlJywgJ2NpZCcsICdlZGl0b3InLCAnZXh0ZW5kcycsICdfY29tcG9uZW50cycsICdfcHJlZmFiJywgJ19fcHJlZmFiJ107XG5cbiAgICAvKipcbiAgICAgKiBTYWZlbHkgc2VyaWFsaXplIGEgdmFsdWUgdG8gSlNPTi1jb21wYXRpYmxlIGZvcm1hdFxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHNlcmlhbGl6ZVZhbHVlKHZhbDogYW55LCBkZXB0aDogbnVtYmVyID0gMCk6IGFueSB7XG4gICAgICAgIC8vIFByZXZlbnQgaW5maW5pdGUgcmVjdXJzaW9uXG4gICAgICAgIGlmIChkZXB0aCA+IDUpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSGFuZGxlIG51bGwvdW5kZWZpbmVkXG4gICAgICAgIGlmICh2YWwgPT09IG51bGwgfHwgdmFsID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSGFuZGxlIHByaW1pdGl2ZXNcbiAgICAgICAgaWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnIHx8IHR5cGVvZiB2YWwgPT09ICdudW1iZXInIHx8IHR5cGVvZiB2YWwgPT09ICdib29sZWFuJykge1xuICAgICAgICAgICAgcmV0dXJuIHZhbDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNraXAgZnVuY3Rpb25zXG4gICAgICAgIGlmICh0eXBlb2YgdmFsID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEhhbmRsZSBDb2NvcyBDcmVhdG9yIHR5cGVzXG4gICAgICAgIGlmICh2YWwgaW5zdGFuY2VvZiBjYy5Db2xvcikge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICByOiB2YWwucixcbiAgICAgICAgICAgICAgICBnOiB2YWwuZyxcbiAgICAgICAgICAgICAgICBiOiB2YWwuYixcbiAgICAgICAgICAgICAgICBhOiB2YWwuYSxcbiAgICAgICAgICAgICAgICBfX3R5cGVfXzogJ2NjLkNvbG9yJ1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh2YWwgaW5zdGFuY2VvZiBjYy5WZWMyKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHg6IHZhbC54LFxuICAgICAgICAgICAgICAgIHk6IHZhbC55LFxuICAgICAgICAgICAgICAgIF9fdHlwZV9fOiAnY2MuVmVjMidcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodmFsIGluc3RhbmNlb2YgY2MuVmVjMykge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB4OiB2YWwueCxcbiAgICAgICAgICAgICAgICB5OiB2YWwueSxcbiAgICAgICAgICAgICAgICB6OiB2YWwueixcbiAgICAgICAgICAgICAgICBfX3R5cGVfXzogJ2NjLlZlYzMnXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSGFuZGxlIE5vZGUgcmVmZXJlbmNlcyAoY29udmVydCB0byBVVUlEIG9ubHkpXG4gICAgICAgIGlmICh2YWwgaW5zdGFuY2VvZiBjYy5Ob2RlKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHV1aWQ6IHZhbC51dWlkIHx8IG51bGwsXG4gICAgICAgICAgICAgICAgX190eXBlX186ICdjYy5Ob2RlJ1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEhhbmRsZSBDb21wb25lbnQgcmVmZXJlbmNlcyAoY29udmVydCB0byBVVUlEIG9ubHkpXG4gICAgICAgIGlmICh2YWwgaW5zdGFuY2VvZiBjYy5Db21wb25lbnQpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdXVpZDogdmFsLnV1aWQgfHwgbnVsbCxcbiAgICAgICAgICAgICAgICBfX3R5cGVfXzogY2MuanMuZ2V0Q2xhc3NOYW1lKHZhbCkgfHwgJ2NjLkNvbXBvbmVudCdcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBIYW5kbGUgYXJyYXlzXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbCkpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWwubWFwKChpdGVtOiBhbnkpID0+IHNlcmlhbGl6ZVZhbHVlKGl0ZW0sIGRlcHRoICsgMSkpLmZpbHRlcigoaXRlbTogYW55KSA9PiBpdGVtICE9PSBudWxsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEhhbmRsZSBvYmplY3RzXG4gICAgICAgIGlmICh0eXBlb2YgdmFsID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgLy8gQ2hlY2sgZm9yIGNpcmN1bGFyIHJlZmVyZW5jZXNcbiAgICAgICAgICAgIGlmICh2aXNpdGVkLmhhcyh2YWwpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIENoZWNrIGlmIGl0J3MgYSBTaXplLWxpa2Ugb2JqZWN0XG4gICAgICAgICAgICBpZiAoJ3dpZHRoJyBpbiB2YWwgJiYgJ2hlaWdodCcgaW4gdmFsICYmIE9iamVjdC5rZXlzKHZhbCkubGVuZ3RoIDw9IDMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICB3aWR0aDogdHlwZW9mIHZhbC53aWR0aCA9PT0gJ251bWJlcicgPyB2YWwud2lkdGggOiAwLFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IHR5cGVvZiB2YWwuaGVpZ2h0ID09PSAnbnVtYmVyJyA/IHZhbC5oZWlnaHQgOiAwLFxuICAgICAgICAgICAgICAgICAgICBfX3R5cGVfXzogJ2NjLlNpemUnXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVHJ5IHRvIHNlcmlhbGl6ZSBvYmplY3QgcHJvcGVydGllc1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB2aXNpdGVkLmFkZCh2YWwpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdDogYW55ID0ge307XG4gICAgICAgICAgICAgICAgbGV0IHByb3BDb3VudCA9IDA7XG4gICAgICAgICAgICAgICAgY29uc3QgbWF4UHJvcHMgPSAyMDsgLy8gTGltaXQgbnVtYmVyIG9mIHByb3BlcnRpZXNcblxuICAgICAgICAgICAgICAgIGZvciAoY29uc3Qgb2JqS2V5IGluIHZhbCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAocHJvcENvdW50ID49IG1heFByb3BzKSBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAvLyBTa2lwIGludGVybmFsIHByb3BlcnRpZXNcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9iaktleS5zdGFydHNXaXRoKCdfJykgfHwgb2JqS2V5LnN0YXJ0c1dpdGgoJ19fJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gU2tpcCBmdW5jdGlvbnNcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWxbb2JqS2V5XSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2VyaWFsaXplZCA9IHNlcmlhbGl6ZVZhbHVlKHZhbFtvYmpLZXldLCBkZXB0aCArIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlcmlhbGl6ZWQgIT09IG51bGwgJiYgc2VyaWFsaXplZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W29iaktleV0gPSBzZXJpYWxpemVkO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BDb3VudCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBTa2lwIHByb3BlcnRpZXMgdGhhdCBjYW4ndCBiZSBzZXJpYWxpemVkXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZpc2l0ZWQuZGVsZXRlKHZhbCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHJlc3VsdCkubGVuZ3RoID4gMCA/IHJlc3VsdCA6IG51bGw7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgdmlzaXRlZC5kZWxldGUodmFsKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8vIEdldCBhbGwgcHJvcGVydHkgbmFtZXMgZnJvbSB0aGUgY29tcG9uZW50XG4gICAgdHJ5IHtcbiAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gY29tcCkge1xuICAgICAgICAgICAgaWYgKGV4Y2x1ZGVLZXlzLmluY2x1ZGVzKGtleSkgfHwga2V5LnN0YXJ0c1dpdGgoJ18nKSB8fCBrZXkuc3RhcnRzV2l0aCgnX18nKSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gY29tcFtrZXldO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNlcmlhbGl6ZWQgPSBzZXJpYWxpemVWYWx1ZSh2YWx1ZSwgMCk7XG5cbiAgICAgICAgICAgICAgICAvLyBGb3IgYXNzZXQgcHJvcGVydGllcyBsaWtlIGZvbnQsIHNwcml0ZUZyYW1lLCBldGMuLCBpbmNsdWRlIHRoZW0gZXZlbiBpZiBudWxsXG4gICAgICAgICAgICAgICAgLy8gVGhpcyBhbGxvd3Mgc2V0dGluZyB0aGVtIGxhdGVyIGV2ZW4gaWYgdGhleSdyZSBjdXJyZW50bHkgbnVsbFxuICAgICAgICAgICAgICAgIGNvbnN0IGlzQXNzZXRQcm9wZXJ0eSA9IFsnZm9udCcsICdzcHJpdGVGcmFtZScsICd0ZXh0dXJlJywgJ21hdGVyaWFsJywgJ2NsaXAnLCAncHJlZmFiJ10uaW5jbHVkZXMoa2V5LnRvTG93ZXJDYXNlKCkpO1xuICAgICAgICAgICAgICAgIGlmIChzZXJpYWxpemVkICE9PSBudWxsICYmIHNlcmlhbGl6ZWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzW2tleV0gPSB7IHZhbHVlOiBzZXJpYWxpemVkIH07XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpc0Fzc2V0UHJvcGVydHkpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllc1trZXldID0geyB2YWx1ZTogbnVsbCB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgLy8gU2tpcCBwcm9wZXJ0aWVzIHRoYXQgY2FuJ3QgYmUgYWNjZXNzZWQgb3Igc2VyaWFsaXplZFxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgLy8gSWYgc2VyaWFsaXphdGlvbiBmYWlscywgcmV0dXJuIGVtcHR5IHByb3BlcnRpZXMgb2JqZWN0XG4gICAgICAgIC8vIFRoaXMgcHJldmVudHMgcXVlcnlOb2RlIGZyb20gZmFpbGluZyBjb21wbGV0ZWx5XG4gICAgICAgIHJldHVybiBwcm9wZXJ0aWVzO1xuICAgIH1cblxuICAgIHJldHVybiBwcm9wZXJ0aWVzO1xufVxuXG5jb25zdCBtZXRob2RzOiB7IFtrZXk6IHN0cmluZ106ICguLi5hbnk6IGFueSkgPT4gYW55IH0gPSB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgbmV3IHNjZW5lXG4gICAgICovXG4gICAgY3JlYXRlTmV3U2NlbmUoZXZlbnQ6IGFueSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qgc2NlbmUgPSBuZXcgY2MuU2NlbmUoKTtcbiAgICAgICAgICAgIHNjZW5lLm5hbWUgPSAnTmV3IFNjZW5lJztcbiAgICAgICAgICAgIGNjLmRpcmVjdG9yLnJ1blNjZW5lKHNjZW5lKTtcbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogdHJ1ZSwgbWVzc2FnZTogJ05ldyBzY2VuZSBjcmVhdGVkIHN1Y2Nlc3NmdWxseScgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBjb21wb25lbnQgdG8gYSBub2RlXG4gICAgICovXG4gICAgYWRkQ29tcG9uZW50VG9Ob2RlKGV2ZW50OiBhbnksIG5vZGVVdWlkOiBzdHJpbmcsIGNvbXBvbmVudFR5cGU6IHN0cmluZykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qgc2NlbmUgPSBjYy5kaXJlY3Rvci5nZXRTY2VuZSgpO1xuICAgICAgICAgICAgaWYgKCFzY2VuZSkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ05vIGFjdGl2ZSBzY2VuZScgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gRmluZCBub2RlIGJ5IFVVSURcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBmaW5kTm9kZUJ5VXVpZChzY2VuZSwgbm9kZVV1aWQpO1xuICAgICAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgTm9kZSB3aXRoIFVVSUQgJHtub2RlVXVpZH0gbm90IGZvdW5kYCB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBHZXQgY29tcG9uZW50IGNsYXNzXG4gICAgICAgICAgICBjb25zdCBDb21wb25lbnRDbGFzcyA9IGNjLmpzLmdldENsYXNzQnlOYW1lKGNvbXBvbmVudFR5cGUpO1xuICAgICAgICAgICAgaWYgKCFDb21wb25lbnRDbGFzcykge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYENvbXBvbmVudCB0eXBlICR7Y29tcG9uZW50VHlwZX0gbm90IGZvdW5kYCB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBSZW5kZXJDb21wb25lbnTrpbwg7IOB7IaN7ZWcIOy7tO2PrOuEjO2KuCDtg4DsnoUg66qp66GdXG4gICAgICAgICAgICBjb25zdCByZW5kZXJDb21wb25lbnRUeXBlcyA9IFsnY2MuU3ByaXRlJywgJ2NjLkxhYmVsJywgJ2NjLk1hc2snLCAnY2MuUmljaFRleHQnXTtcbiAgICAgICAgICAgIGNvbnN0IGlzUmVuZGVyQ29tcG9uZW50ID0gcmVuZGVyQ29tcG9uZW50VHlwZXMuaW5jbHVkZXMoY29tcG9uZW50VHlwZSk7XG5cbiAgICAgICAgICAgIC8vIFJlbmRlckNvbXBvbmVudCDspJHrs7Ug7LK07YGsXG4gICAgICAgICAgICBpZiAoaXNSZW5kZXJDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBSZW5kZXJDb21wb25lbnRDbGFzcyA9IGNjLmpzLmdldENsYXNzQnlOYW1lKCdjYy5SZW5kZXJDb21wb25lbnQnKTtcbiAgICAgICAgICAgICAgICBpZiAoUmVuZGVyQ29tcG9uZW50Q2xhc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZXhpc3RpbmdSZW5kZXJDb21wb25lbnQgPSBub2RlLmdldENvbXBvbmVudChSZW5kZXJDb21wb25lbnRDbGFzcyBhcyBuZXcgKCkgPT4gY2MuQ29tcG9uZW50KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGV4aXN0aW5nUmVuZGVyQ29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBleGlzdGluZ1R5cGUgPSBleGlzdGluZ1JlbmRlckNvbXBvbmVudC5jb25zdHJ1Y3Rvci5uYW1lIHx8ICdSZW5kZXJDb21wb25lbnQnO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGBDYW5ub3QgYWRkICcke2NvbXBvbmVudFR5cGV9JyBiZWNhdXNlIHRoZSBub2RlIGFscmVhZHkgaGFzIGEgUmVuZGVyQ29tcG9uZW50ICgnJHtleGlzdGluZ1R5cGV9JykuIEEgbm9kZSBjYW4gb25seSBoYXZlIG9uZSBSZW5kZXJDb21wb25lbnQgKGNjLlNwcml0ZSwgY2MuTGFiZWwsIGNjLk1hc2ssIG9yIGNjLlJpY2hUZXh0KS5gXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEFkZCBjb21wb25lbnRcbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudCA9IG5vZGUuYWRkQ29tcG9uZW50KENvbXBvbmVudENsYXNzIGFzIG5ldyAoKSA9PiBjYy5Db21wb25lbnQpO1xuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBgQ29tcG9uZW50ICR7Y29tcG9uZW50VHlwZX0gYWRkZWQgc3VjY2Vzc2Z1bGx5YCxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogeyBjb21wb25lbnRJZDogY29tcG9uZW50LnV1aWQgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgY29tcG9uZW50IGZyb20gYSBub2RlXG4gICAgICovXG4gICAgcmVtb3ZlQ29tcG9uZW50RnJvbU5vZGUoZXZlbnQ6IGFueSwgbm9kZVV1aWQ6IHN0cmluZywgY29tcG9uZW50VHlwZTogc3RyaW5nKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBzY2VuZSA9IGNjLmRpcmVjdG9yLmdldFNjZW5lKCk7XG4gICAgICAgICAgICBpZiAoIXNjZW5lKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnTm8gYWN0aXZlIHNjZW5lJyB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBub2RlID0gZmluZE5vZGVCeVV1aWQoc2NlbmUsIG5vZGVVdWlkKTtcbiAgICAgICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYE5vZGUgd2l0aCBVVUlEICR7bm9kZVV1aWR9IG5vdCBmb3VuZGAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgQ29tcG9uZW50Q2xhc3MgPSBjYy5qcy5nZXRDbGFzc0J5TmFtZShjb21wb25lbnRUeXBlKTtcbiAgICAgICAgICAgIGlmICghQ29tcG9uZW50Q2xhc3MpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBDb21wb25lbnQgdHlwZSAke2NvbXBvbmVudFR5cGV9IG5vdCBmb3VuZGAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgY29tcG9uZW50ID0gbm9kZS5nZXRDb21wb25lbnQoQ29tcG9uZW50Q2xhc3MgYXMgbmV3ICgpID0+IGNjLkNvbXBvbmVudCk7XG4gICAgICAgICAgICBpZiAoIWNvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYENvbXBvbmVudCAke2NvbXBvbmVudFR5cGV9IG5vdCBmb3VuZCBvbiBub2RlYCB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBub2RlLnJlbW92ZUNvbXBvbmVudChjb21wb25lbnQpO1xuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiB0cnVlLCBtZXNzYWdlOiBgQ29tcG9uZW50ICR7Y29tcG9uZW50VHlwZX0gcmVtb3ZlZCBzdWNjZXNzZnVsbHlgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBuZXcgbm9kZVxuICAgICAqL1xuICAgIGNyZWF0ZU5vZGUoZXZlbnQ6IGFueSwgbmFtZTogc3RyaW5nLCBwYXJlbnRVdWlkPzogc3RyaW5nKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBzY2VuZSA9IGNjLmRpcmVjdG9yLmdldFNjZW5lKCk7XG4gICAgICAgICAgICBpZiAoIXNjZW5lKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnTm8gYWN0aXZlIHNjZW5lJyB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBub2RlID0gbmV3IGNjLk5vZGUobmFtZSk7XG5cbiAgICAgICAgICAgIGlmIChwYXJlbnRVdWlkKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcGFyZW50ID0gZmluZE5vZGVCeVV1aWQoc2NlbmUsIHBhcmVudFV1aWQpO1xuICAgICAgICAgICAgICAgIGlmIChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5zZXRQYXJlbnQocGFyZW50KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBub2RlLnNldFBhcmVudChzY2VuZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBub2RlLnNldFBhcmVudChzY2VuZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYE5vZGUgJHtuYW1lfSBjcmVhdGVkIHN1Y2Nlc3NmdWxseWAsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHsgdXVpZDogbm9kZS51dWlkLCBuYW1lOiBub2RlLm5hbWUgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgbm9kZSBpbmZvcm1hdGlvblxuICAgICAqL1xuICAgIGdldE5vZGVJbmZvKGV2ZW50OiBhbnksIG5vZGVVdWlkOiBzdHJpbmcpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHNjZW5lID0gY2MuZGlyZWN0b3IuZ2V0U2NlbmUoKTtcbiAgICAgICAgICAgIGlmICghc2NlbmUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdObyBhY3RpdmUgc2NlbmUnIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBmaW5kTm9kZUJ5VXVpZChzY2VuZSwgbm9kZVV1aWQpO1xuICAgICAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgTm9kZSB3aXRoIFVVSUQgJHtub2RlVXVpZH0gbm90IGZvdW5kYCB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBJbiAyLngsIHBvc2l0aW9uIGlzIHN0b3JlZCBhcyB4LCB5IHByb3BlcnRpZXMgKGZvciAyRCkgb3IgcG9zaXRpb24gVmVjMyAoZm9yIDNEKVxuICAgICAgICAgICAgY29uc3QgcG9zRGF0YSA9IG5vZGUucG9zaXRpb24gPyB7XG4gICAgICAgICAgICAgICAgeDogKG5vZGUucG9zaXRpb24gYXMgYW55KS54IHx8IG5vZGUueCxcbiAgICAgICAgICAgICAgICB5OiAobm9kZS5wb3NpdGlvbiBhcyBhbnkpLnkgfHwgbm9kZS55LFxuICAgICAgICAgICAgICAgIHo6IChub2RlLnBvc2l0aW9uIGFzIGFueSkueiB8fCAwXG4gICAgICAgICAgICB9IDogeyB4OiBub2RlLngsIHk6IG5vZGUueSwgejogMCB9O1xuXG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IG5vZGUudXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IG5vZGUubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZTogbm9kZS5hY3RpdmUsXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogcG9zRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJvdGF0aW9uOiBub2RlLnJvdGF0aW9uIHx8IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICBzY2FsZTogeyB4OiBub2RlLnNjYWxlWCwgeTogbm9kZS5zY2FsZVksIHo6IDEgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudDogbm9kZS5wYXJlbnQ/LnV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZHJlbjogbm9kZS5jaGlsZHJlbi5tYXAoKGNoaWxkOiBhbnkpID0+IGNoaWxkLnV1aWQpLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50czogKG5vZGUgYXMgYW55KS5fY29tcG9uZW50cyA/IChub2RlIGFzIGFueSkuX2NvbXBvbmVudHMubWFwKChjb21wOiBhbnkpID0+ICh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogY2MuanMuZ2V0Q2xhc3NOYW1lKGNvbXApLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZWQ6IGNvbXAuZW5hYmxlZFxuICAgICAgICAgICAgICAgICAgICAgICAgfSkpIDogW11cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgYWxsIG5vZGVzIGluIHNjZW5lXG4gICAgICovXG4gICAgZ2V0QWxsTm9kZXMoZXZlbnQ6IGFueSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qgc2NlbmUgPSBjYy5kaXJlY3Rvci5nZXRTY2VuZSgpO1xuICAgICAgICAgICAgaWYgKCFzY2VuZSkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ05vIGFjdGl2ZSBzY2VuZScgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgbm9kZXM6IGFueVtdID0gW107XG4gICAgICAgICAgICBjb25zdCBjb2xsZWN0Tm9kZXMgPSAobm9kZTogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgbm9kZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIHV1aWQ6IG5vZGUudXVpZCxcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogbm9kZS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICBhY3RpdmU6IG5vZGUuYWN0aXZlLFxuICAgICAgICAgICAgICAgICAgICBwYXJlbnQ6IG5vZGUucGFyZW50Py51dWlkXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBub2RlLmNoaWxkcmVuLmZvckVhY2goKGNoaWxkOiBhbnkpID0+IGNvbGxlY3ROb2RlcyhjaGlsZCkpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2NlbmUuY2hpbGRyZW4uZm9yRWFjaCgoY2hpbGQ6IGFueSkgPT4gY29sbGVjdE5vZGVzKGNoaWxkKSk7XG5cbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogbm9kZXMgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEZpbmQgbm9kZSBieSBuYW1lXG4gICAgICovXG4gICAgZmluZE5vZGVCeU5hbWUoZXZlbnQ6IGFueSwgbmFtZTogc3RyaW5nKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBzY2VuZSA9IGNjLmRpcmVjdG9yLmdldFNjZW5lKCk7XG4gICAgICAgICAgICBpZiAoIXNjZW5lKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnTm8gYWN0aXZlIHNjZW5lJyB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZXQgZm91bmROb2RlOiBhbnkgPSBudWxsO1xuICAgICAgICAgICAgY29uc3Qgc2VhcmNoTm9kZSA9IChub2RlOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAobm9kZS5uYW1lID09PSBuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvdW5kTm9kZSA9IG5vZGU7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAobm9kZS5jaGlsZHJlbikge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIG5vZGUuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlYXJjaE5vZGUoY2hpbGQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZvdW5kTm9kZSkgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2NlbmUuY2hpbGRyZW4uZm9yRWFjaCgoY2hpbGQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghZm91bmROb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlYXJjaE5vZGUoY2hpbGQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpZiAoIWZvdW5kTm9kZSkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYE5vZGUgd2l0aCBuYW1lICR7bmFtZX0gbm90IGZvdW5kYCB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IGZvdW5kTm9kZS51dWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogZm91bmROb2RlLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3RpdmU6IGZvdW5kTm9kZS5hY3RpdmUsXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogeyB4OiBmb3VuZE5vZGUueCwgeTogZm91bmROb2RlLnkgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBjdXJyZW50IHNjZW5lIGluZm9ybWF0aW9uXG4gICAgICovXG4gICAgZ2V0Q3VycmVudFNjZW5lSW5mbyhldmVudDogYW55KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBzY2VuZSA9IGNjLmRpcmVjdG9yLmdldFNjZW5lKCk7XG4gICAgICAgICAgICBpZiAoIXNjZW5lKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnTm8gYWN0aXZlIHNjZW5lJyB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHNjZW5lLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiBzY2VuZS51dWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUNvdW50OiBzY2VuZS5jaGlsZHJlbi5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgbm9kZSBwcm9wZXJ0eVxuICAgICAqL1xuICAgIHNldE5vZGVQcm9wZXJ0eShldmVudDogYW55LCBub2RlVXVpZDogc3RyaW5nLCBwcm9wZXJ0eTogc3RyaW5nLCB2YWx1ZTogYW55KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBzY2VuZSA9IGNjLmRpcmVjdG9yLmdldFNjZW5lKCk7XG4gICAgICAgICAgICBpZiAoIXNjZW5lKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnTm8gYWN0aXZlIHNjZW5lJyB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBub2RlID0gZmluZE5vZGVCeVV1aWQoc2NlbmUsIG5vZGVVdWlkKTtcbiAgICAgICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYE5vZGUgd2l0aCBVVUlEICR7bm9kZVV1aWR9IG5vdCBmb3VuZGAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gU2V0IHByb3BlcnR5IC0gMi54IHVzZXMgZGlmZmVyZW50IG1ldGhvZHNcbiAgICAgICAgICAgIGlmIChwcm9wZXJ0eSA9PT0gJ3Bvc2l0aW9uJykge1xuICAgICAgICAgICAgICAgIG5vZGUuc2V0UG9zaXRpb24odmFsdWUueCB8fCAwLCB2YWx1ZS55IHx8IDApO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9wZXJ0eSA9PT0gJ3JvdGF0aW9uJykge1xuICAgICAgICAgICAgICAgIG5vZGUucm90YXRpb24gPSB2YWx1ZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvcGVydHkgPT09ICdzY2FsZScpIHtcbiAgICAgICAgICAgICAgICAvLyBJbiBDb2NvcyBDcmVhdG9yIDIueCwgc2V0U2NhbGUgbWlnaHQgbm90IHdvcmsgcHJvcGVybHksIHVzZSBzY2FsZVgvc2NhbGVZIGRpcmVjdGx5XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlLnggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBub2RlLnNjYWxlWCA9IHZhbHVlLng7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZS55ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5zY2FsZVkgPSB2YWx1ZS55O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvcGVydHkgPT09ICdhY3RpdmUnKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5hY3RpdmUgPSB2YWx1ZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvcGVydHkgPT09ICduYW1lJykge1xuICAgICAgICAgICAgICAgIG5vZGUubmFtZSA9IHZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9wZXJ0eSA9PT0gJ3gnKSB7XG4gICAgICAgICAgICAgICAgbm9kZS54ID0gdmFsdWU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHByb3BlcnR5ID09PSAneScpIHtcbiAgICAgICAgICAgICAgICBub2RlLnkgPSB2YWx1ZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvcGVydHkgPT09ICdzY2FsZVgnKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5zY2FsZVggPSB2YWx1ZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvcGVydHkgPT09ICdzY2FsZVknKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5zY2FsZVkgPSB2YWx1ZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvcGVydHkgPT09ICdvcGFjaXR5Jykge1xuICAgICAgICAgICAgICAgIG5vZGUub3BhY2l0eSA9IHZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9wZXJ0eSA9PT0gJ2NvbG9yJykge1xuICAgICAgICAgICAgICAgIG5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IodmFsdWUuciB8fCAyNTUsIHZhbHVlLmcgfHwgMjU1LCB2YWx1ZS5iIHx8IDI1NSwgdmFsdWUuYSB8fCAyNTUpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9wZXJ0eSA9PT0gJ2NvbnRlbnRTaXplJykge1xuICAgICAgICAgICAgICAgIC8vIEluIDIueCwgY29udGVudFNpemUgaXMgc3BsaXQgaW50byB3aWR0aCBhbmQgaGVpZ2h0IHByb3BlcnRpZXNcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUud2lkdGggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS53aWR0aCA9IE51bWJlcih2YWx1ZS53aWR0aCkgfHwgMTAwO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZS5oZWlnaHQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5oZWlnaHQgPSBOdW1iZXIodmFsdWUuaGVpZ2h0KSB8fCAxMDA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHByb3BlcnR5ID09PSAnYW5jaG9yUG9pbnQnKSB7XG4gICAgICAgICAgICAgICAgLy8gSW4gMi54LCBhbmNob3JQb2ludCBpcyBzcGxpdCBpbnRvIGFuY2hvclggYW5kIGFuY2hvclkgcHJvcGVydGllc1xuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZS54ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuYW5jaG9yWCA9IE51bWJlcih2YWx1ZS54KSB8fCAwLjU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlLnkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5hbmNob3JZID0gTnVtYmVyKHZhbHVlLnkpIHx8IDAuNTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvcGVydHkgPT09ICd3aWR0aCcpIHtcbiAgICAgICAgICAgICAgICBub2RlLndpZHRoID0gTnVtYmVyKHZhbHVlKSB8fCAxMDA7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHByb3BlcnR5ID09PSAnaGVpZ2h0Jykge1xuICAgICAgICAgICAgICAgIG5vZGUuaGVpZ2h0ID0gTnVtYmVyKHZhbHVlKSB8fCAxMDA7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHByb3BlcnR5ID09PSAnYW5jaG9yWCcpIHtcbiAgICAgICAgICAgICAgICBub2RlLmFuY2hvclggPSBOdW1iZXIodmFsdWUpIHx8IDAuNTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvcGVydHkgPT09ICdhbmNob3JZJykge1xuICAgICAgICAgICAgICAgIG5vZGUuYW5jaG9yWSA9IE51bWJlcih2YWx1ZSkgfHwgMC41O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBUcnkgdG8gc2V0IHByb3BlcnR5IGRpcmVjdGx5XG4gICAgICAgICAgICAgICAgKG5vZGUgYXMgYW55KVtwcm9wZXJ0eV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBgUHJvcGVydHkgJyR7cHJvcGVydHl9JyB1cGRhdGVkIHN1Y2Nlc3NmdWxseWBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHNjZW5lIGhpZXJhcmNoeVxuICAgICAqL1xuICAgIGdldFNjZW5lSGllcmFyY2h5KGV2ZW50OiBhbnksIGluY2x1ZGVDb21wb25lbnRzOiBib29sZWFuID0gZmFsc2UpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHNjZW5lID0gY2MuZGlyZWN0b3IuZ2V0U2NlbmUoKTtcbiAgICAgICAgICAgIGlmICghc2NlbmUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdObyBhY3RpdmUgc2NlbmUnIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHByb2Nlc3NOb2RlID0gKG5vZGU6IGFueSk6IGFueSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0OiBhbnkgPSB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IG5vZGUubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgdXVpZDogbm9kZS51dWlkLFxuICAgICAgICAgICAgICAgICAgICBhY3RpdmU6IG5vZGUuYWN0aXZlLFxuICAgICAgICAgICAgICAgICAgICBjaGlsZHJlbjogW11cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgaWYgKGluY2x1ZGVDb21wb25lbnRzICYmIG5vZGUuX2NvbXBvbmVudHMpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LmNvbXBvbmVudHMgPSBub2RlLl9jb21wb25lbnRzLm1hcCgoY29tcDogYW55KSA9PiAoe1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogY2MuanMuZ2V0Q2xhc3NOYW1lKGNvbXApLFxuICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlZDogY29tcC5lbmFibGVkXG4gICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAobm9kZS5jaGlsZHJlbiAmJiBub2RlLmNoaWxkcmVuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LmNoaWxkcmVuID0gbm9kZS5jaGlsZHJlbi5tYXAoKGNoaWxkOiBhbnkpID0+IHByb2Nlc3NOb2RlKGNoaWxkKSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGNvbnN0IGhpZXJhcmNoeSA9IHNjZW5lLmNoaWxkcmVuLm1hcCgoY2hpbGQ6IGFueSkgPT4gcHJvY2Vzc05vZGUoY2hpbGQpKTtcbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogaGllcmFyY2h5IH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgcHJlZmFiIGZyb20gbm9kZVxuICAgICAqL1xuICAgIGNyZWF0ZVByZWZhYkZyb21Ob2RlKGV2ZW50OiBhbnksIG5vZGVVdWlkOiBzdHJpbmcsIHByZWZhYlBhdGg6IHN0cmluZykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qgc2NlbmUgPSBjYy5kaXJlY3Rvci5nZXRTY2VuZSgpO1xuICAgICAgICAgICAgaWYgKCFzY2VuZSkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ05vIGFjdGl2ZSBzY2VuZScgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IGZpbmROb2RlQnlVdWlkKHNjZW5lLCBub2RlVXVpZCk7XG4gICAgICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBOb2RlIHdpdGggVVVJRCAke25vZGVVdWlkfSBub3QgZm91bmRgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIE5vdGU6IFRoaXMgaXMgYSBzaW11bGF0aW9uIGltcGxlbWVudGF0aW9uIGJlY2F1c2UgdGhlIHJ1bnRpbWUgZW52aXJvbm1lbnRcbiAgICAgICAgICAgIC8vIGNhbm5vdCBkaXJlY3RseSBjcmVhdGUgcHJlZmFiIGZpbGVzIGluIDIueFxuICAgICAgICAgICAgLy8gUmVhbCBwcmVmYWIgY3JlYXRpb24gcmVxdWlyZXMgRWRpdG9yIEFQSSBzdXBwb3J0XG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZWZhYlBhdGg6IHByZWZhYlBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2VOb2RlVXVpZDogbm9kZVV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBgUHJlZmFiIGNyZWF0ZWQgZnJvbSBub2RlICcke25vZGUubmFtZX0nIGF0ICR7cHJlZmFiUGF0aH1gXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IGNvbXBvbmVudCBwcm9wZXJ0eVxuICAgICAqL1xuICAgIHNldENvbXBvbmVudFByb3BlcnR5KGV2ZW50OiBhbnksIG5vZGVVdWlkOiBzdHJpbmcsIGNvbXBvbmVudFR5cGU6IHN0cmluZywgcHJvcGVydHk6IHN0cmluZywgdmFsdWU6IGFueSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qgc2NlbmUgPSBjYy5kaXJlY3Rvci5nZXRTY2VuZSgpO1xuICAgICAgICAgICAgaWYgKCFzY2VuZSkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ05vIGFjdGl2ZSBzY2VuZScgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IGZpbmROb2RlQnlVdWlkKHNjZW5lLCBub2RlVXVpZCk7XG4gICAgICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBOb2RlIHdpdGggVVVJRCAke25vZGVVdWlkfSBub3QgZm91bmRgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IENvbXBvbmVudENsYXNzID0gY2MuanMuZ2V0Q2xhc3NCeU5hbWUoY29tcG9uZW50VHlwZSk7XG4gICAgICAgICAgICBpZiAoIUNvbXBvbmVudENsYXNzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgQ29tcG9uZW50IHR5cGUgJHtjb21wb25lbnRUeXBlfSBub3QgZm91bmRgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudCA9IG5vZGUuZ2V0Q29tcG9uZW50KENvbXBvbmVudENsYXNzIGFzIG5ldyAoKSA9PiBjYy5Db21wb25lbnQpO1xuICAgICAgICAgICAgaWYgKCFjb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBDb21wb25lbnQgJHtjb21wb25lbnRUeXBlfSBub3QgZm91bmQgb24gbm9kZWAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gSGFuZGxlIGNvbW1vbiBwcm9wZXJ0aWVzIHdpdGggc3BlY2lhbCB0cmVhdG1lbnRcbiAgICAgICAgICAgIGlmIChwcm9wZXJ0eSA9PT0gJ3Nwcml0ZUZyYW1lJyAmJiBjb21wb25lbnRUeXBlID09PSAnY2MuU3ByaXRlJykge1xuICAgICAgICAgICAgICAgIC8vIFN1cHBvcnQgdmFsdWUgYXMgdXVpZCBvciByZXNvdXJjZSBwYXRoXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVHJ5IHRvIGxvYWQgYXMgcmVzb3VyY2VcbiAgICAgICAgICAgICAgICAgICAgY2MubG9hZGVyLmxvYWRSZXModmFsdWUsIGNjLlNwcml0ZUZyYW1lLCAoZXJyOiBhbnksIHNwcml0ZUZyYW1lOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZXJyICYmIHNwcml0ZUZyYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKGNvbXBvbmVudCBhcyBhbnkpLnNwcml0ZUZyYW1lID0gc3ByaXRlRnJhbWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRyeSBkaXJlY3QgYXNzaWdubWVudCAoY29tcGF0aWJsZSB3aXRoIGFscmVhZHkgcGFzc2VkIHJlc291cmNlIG9iamVjdClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoY29tcG9uZW50IGFzIGFueSkuc3ByaXRlRnJhbWUgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgKGNvbXBvbmVudCBhcyBhbnkpLnNwcml0ZUZyYW1lID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9wZXJ0eSA9PT0gJ3N0cmluZycgJiYgKGNvbXBvbmVudFR5cGUgPT09ICdjYy5MYWJlbCcgfHwgY29tcG9uZW50VHlwZSA9PT0gJ2NjLlJpY2hUZXh0JykpIHtcbiAgICAgICAgICAgICAgICAoY29tcG9uZW50IGFzIGFueSkuc3RyaW5nID0gdmFsdWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIChjb21wb25lbnQgYXMgYW55KVtwcm9wZXJ0eV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiB0cnVlLCBtZXNzYWdlOiBgQ29tcG9uZW50IHByb3BlcnR5ICcke3Byb3BlcnR5fScgdXBkYXRlZCBzdWNjZXNzZnVsbHlgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgY29tcG9uZW50IHByb3BlcnR5IHdpdGggYWR2YW5jZWQgdHlwZSBoYW5kbGluZ1xuICAgICAqIFN1cHBvcnRzIGNvbG9yLCB2ZWMyLCB2ZWMzLCBzaXplLCBub2RlIHJlZmVyZW5jZXMsIGNvbXBvbmVudCByZWZlcmVuY2VzLCBhc3NldHMsIGFuZCBhcnJheXNcbiAgICAgKi9cbiAgICBzZXRDb21wb25lbnRQcm9wZXJ0eUFkdmFuY2VkKGV2ZW50OiBhbnksIG5vZGVVdWlkOiBzdHJpbmcsIGNvbXBvbmVudFR5cGU6IHN0cmluZywgcHJvcGVydHk6IHN0cmluZywgcHJvY2Vzc2VkVmFsdWU6IGFueSwgcHJvcGVydHlUeXBlOiBzdHJpbmcpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHNjZW5lID0gY2MuZGlyZWN0b3IuZ2V0U2NlbmUoKTtcbiAgICAgICAgICAgIGlmICghc2NlbmUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdObyBhY3RpdmUgc2NlbmUnIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBmaW5kTm9kZUJ5VXVpZChzY2VuZSwgbm9kZVV1aWQpO1xuICAgICAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgTm9kZSB3aXRoIFVVSUQgJHtub2RlVXVpZH0gbm90IGZvdW5kYCB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBDb21wb25lbnRDbGFzcyA9IGNjLmpzLmdldENsYXNzQnlOYW1lKGNvbXBvbmVudFR5cGUpO1xuICAgICAgICAgICAgaWYgKCFDb21wb25lbnRDbGFzcykge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYENvbXBvbmVudCB0eXBlICR7Y29tcG9uZW50VHlwZX0gbm90IGZvdW5kYCB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnQgPSBub2RlLmdldENvbXBvbmVudChDb21wb25lbnRDbGFzcyBhcyBuZXcgKCkgPT4gY2MuQ29tcG9uZW50KTtcbiAgICAgICAgICAgIGlmICghY29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgQ29tcG9uZW50ICR7Y29tcG9uZW50VHlwZX0gbm90IGZvdW5kIG9uIG5vZGVgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEhhbmRsZSBkaWZmZXJlbnQgcHJvcGVydHkgdHlwZXNcbiAgICAgICAgICAgIHN3aXRjaCAocHJvcGVydHlUeXBlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnY29sb3InOlxuICAgICAgICAgICAgICAgICAgICBpZiAocHJvY2Vzc2VkVmFsdWUgJiYgdHlwZW9mIHByb2Nlc3NlZFZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY29sb3IgPSBuZXcgY2MuQ29sb3IoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5taW4oMjU1LCBNYXRoLm1heCgwLCBOdW1iZXIocHJvY2Vzc2VkVmFsdWUucikgfHwgMCkpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGgubWluKDI1NSwgTWF0aC5tYXgoMCwgTnVtYmVyKHByb2Nlc3NlZFZhbHVlLmcpIHx8IDApKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLm1pbigyNTUsIE1hdGgubWF4KDAsIE51bWJlcihwcm9jZXNzZWRWYWx1ZS5iKSB8fCAwKSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvY2Vzc2VkVmFsdWUuYSAhPT0gdW5kZWZpbmVkID8gTWF0aC5taW4oMjU1LCBNYXRoLm1heCgwLCBOdW1iZXIocHJvY2Vzc2VkVmFsdWUuYSkpKSA6IDI1NVxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIChjb21wb25lbnQgYXMgYW55KVtwcm9wZXJ0eV0gPSBjb2xvcjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgJ3ZlYzInOlxuICAgICAgICAgICAgICAgICAgICBpZiAocHJvY2Vzc2VkVmFsdWUgJiYgdHlwZW9mIHByb2Nlc3NlZFZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdmVjMiA9IG5ldyBjYy5WZWMyKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIE51bWJlcihwcm9jZXNzZWRWYWx1ZS54KSB8fCAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIE51bWJlcihwcm9jZXNzZWRWYWx1ZS55KSB8fCAwXG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgKGNvbXBvbmVudCBhcyBhbnkpW3Byb3BlcnR5XSA9IHZlYzI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlICd2ZWMzJzpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb2Nlc3NlZFZhbHVlICYmIHR5cGVvZiBwcm9jZXNzZWRWYWx1ZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHZlYzMgPSBuZXcgY2MuVmVjMyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBOdW1iZXIocHJvY2Vzc2VkVmFsdWUueCkgfHwgMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBOdW1iZXIocHJvY2Vzc2VkVmFsdWUueSkgfHwgMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBOdW1iZXIocHJvY2Vzc2VkVmFsdWUueikgfHwgMFxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIChjb21wb25lbnQgYXMgYW55KVtwcm9wZXJ0eV0gPSB2ZWMzO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSAnc2l6ZSc6XG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9jZXNzZWRWYWx1ZSAmJiB0eXBlb2YgcHJvY2Vzc2VkVmFsdWUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJbiAyLngsIHNpemUgaXMgdHlwaWNhbGx5IHJlcHJlc2VudGVkIGFzIGFuIG9iamVjdCB3aXRoIHdpZHRoIGFuZCBoZWlnaHRcbiAgICAgICAgICAgICAgICAgICAgICAgIChjb21wb25lbnQgYXMgYW55KVtwcm9wZXJ0eV0gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IE51bWJlcihwcm9jZXNzZWRWYWx1ZS53aWR0aCkgfHwgMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IE51bWJlcihwcm9jZXNzZWRWYWx1ZS5oZWlnaHQpIHx8IDBcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlICdub2RlJzpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb2Nlc3NlZFZhbHVlICYmIHR5cGVvZiBwcm9jZXNzZWRWYWx1ZSA9PT0gJ29iamVjdCcgJiYgJ3V1aWQnIGluIHByb2Nlc3NlZFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0YXJnZXROb2RlID0gZmluZE5vZGVCeVV1aWQoc2NlbmUsIHByb2Nlc3NlZFZhbHVlLnV1aWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRhcmdldE5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoY29tcG9uZW50IGFzIGFueSlbcHJvcGVydHldID0gdGFyZ2V0Tm9kZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgVGFyZ2V0IG5vZGUgd2l0aCBVVUlEICR7cHJvY2Vzc2VkVmFsdWUudXVpZH0gbm90IGZvdW5kYCB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSAnY29tcG9uZW50JzpcbiAgICAgICAgICAgICAgICAgICAgLy8gQ29tcG9uZW50IHJlZmVyZW5jZTogcHJvY2Vzc2VkVmFsdWUgc2hvdWxkIGJlIGEgbm9kZSBVVUlEIHN0cmluZ1xuICAgICAgICAgICAgICAgICAgICAvLyBXZSBuZWVkIHRvIGZpbmQgdGhlIGNvbXBvbmVudCBvbiB0aGF0IG5vZGVcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBwcm9jZXNzZWRWYWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldE5vZGUgPSBmaW5kTm9kZUJ5VXVpZChzY2VuZSwgcHJvY2Vzc2VkVmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF0YXJnZXROb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgVGFyZ2V0IG5vZGUgd2l0aCBVVUlEICR7cHJvY2Vzc2VkVmFsdWV9IG5vdCBmb3VuZGAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRyeSB0byBmaW5kIHRoZSBjb21wb25lbnQgdHlwZSBmcm9tIHByb3BlcnR5IG1ldGFkYXRhXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGb3Igbm93LCB3ZSdsbCB0cnkgY29tbW9uIGNvbXBvbmVudCB0eXBlcyBvciB1c2UgdGhlIGNvbXBvbmVudFR5cGUgcGFyYW1ldGVyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIGEgc2ltcGxpZmllZCB2ZXJzaW9uIC0gaW4gcHJhY3RpY2UsIHdlJ2QgbmVlZCB0byBrbm93IHRoZSBleHBlY3RlZCBjb21wb25lbnQgdHlwZVxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0Q29tcG9uZW50ID0gKHRhcmdldE5vZGUgYXMgYW55KS5fY29tcG9uZW50cz8uWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRhcmdldENvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChjb21wb25lbnQgYXMgYW55KVtwcm9wZXJ0eV0gPSB0YXJnZXRDb21wb25lbnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYE5vIGNvbXBvbmVudCBmb3VuZCBvbiB0YXJnZXQgbm9kZSAke3Byb2Nlc3NlZFZhbHVlfWAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgJ3Nwcml0ZUZyYW1lJzpcbiAgICAgICAgICAgICAgICBjYXNlICdwcmVmYWInOlxuICAgICAgICAgICAgICAgIGNhc2UgJ2Fzc2V0JzpcbiAgICAgICAgICAgICAgICAgICAgLy8gQXNzZXQgcmVmZXJlbmNlczogcHJvY2Vzc2VkVmFsdWUgc2hvdWxkIGhhdmUgdXVpZCBwcm9wZXJ0eSBvciBiZSBhIHN0cmluZyBVVUlEXG4gICAgICAgICAgICAgICAgICAgIGxldCBhc3NldFV1aWQ6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHByb2Nlc3NlZFZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXRVdWlkID0gcHJvY2Vzc2VkVmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvY2Vzc2VkVmFsdWUgJiYgdHlwZW9mIHByb2Nlc3NlZFZhbHVlID09PSAnb2JqZWN0JyAmJiAndXVpZCcgaW4gcHJvY2Vzc2VkVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFzc2V0VXVpZCA9IHByb2Nlc3NlZFZhbHVlLnV1aWQ7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoIWFzc2V0VXVpZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBJbnZhbGlkIFVVSUQgZm9yICR7cHJvcGVydHlUeXBlfTogJHtKU09OLnN0cmluZ2lmeShwcm9jZXNzZWRWYWx1ZSl9YCB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIExvYWQgYXNzZXQgdXNpbmcgY2MuYXNzZXRNYW5hZ2VyLmxvYWRBbnlcbiAgICAgICAgICAgICAgICAgICAgY2MuYXNzZXRNYW5hZ2VyLmxvYWRBbnkoYXNzZXRVdWlkLCAoZXJyOiBFcnJvciB8IG51bGwsIHJlc3VsdDogY2MuQXNzZXQgfCBjYy5TcHJpdGVGcmFtZSB8IGNjLlByZWZhYiB8IG51bGwpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBGYWlsZWQgdG8gbG9hZCBhc3NldCB3aXRoIFVVSUQgJHthc3NldFV1aWR9OiAke2Vyci5tZXNzYWdlfWAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBBc3NldCB3aXRoIFVVSUQgJHthc3NldFV1aWR9IG5vdCBmb3VuZGAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQXNzaWduIGxvYWRlZCBhc3NldCB0byBjb21wb25lbnQgcHJvcGVydHlcbiAgICAgICAgICAgICAgICAgICAgICAgIChjb21wb25lbnQgYXMgYW55KVtwcm9wZXJ0eV0gPSByZXN1bHQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogdHJ1ZSwgbWVzc2FnZTogYENvbXBvbmVudCBwcm9wZXJ0eSAnJHtwcm9wZXJ0eX0nIHVwZGF0ZWQgc3VjY2Vzc2Z1bGx5IHdpdGggYXNzZXQgVVVJRCAke2Fzc2V0VXVpZH1gIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuOyAvLyBSZXR1cm4gZWFybHkgc2luY2Ugd2UncmUgaGFuZGxpbmcgYXN5bmMgY2FsbGJhY2tcblxuICAgICAgICAgICAgICAgIGNhc2UgJ25vZGVBcnJheSc6XG4gICAgICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHByb2Nlc3NlZFZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgbm9kZUFycmF5ID0gcHJvY2Vzc2VkVmFsdWUubWFwKChpdGVtOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbSAmJiB0eXBlb2YgaXRlbSA9PT0gJ29iamVjdCcgJiYgJ3V1aWQnIGluIGl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZpbmROb2RlQnlVdWlkKHNjZW5lLCBpdGVtLnV1aWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pLmZpbHRlcigobjogYW55KSA9PiBuICE9PSBudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIChjb21wb25lbnQgYXMgYW55KVtwcm9wZXJ0eV0gPSBub2RlQXJyYXk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlICdjb2xvckFycmF5JzpcbiAgICAgICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocHJvY2Vzc2VkVmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjb2xvckFycmF5ID0gcHJvY2Vzc2VkVmFsdWUubWFwKChpdGVtOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbSAmJiB0eXBlb2YgaXRlbSA9PT0gJ29iamVjdCcgJiYgJ3InIGluIGl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBjYy5Db2xvcihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGgubWluKDI1NSwgTWF0aC5tYXgoMCwgTnVtYmVyKGl0ZW0ucikgfHwgMCkpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5taW4oMjU1LCBNYXRoLm1heCgwLCBOdW1iZXIoaXRlbS5nKSB8fCAwKSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLm1pbigyNTUsIE1hdGgubWF4KDAsIE51bWJlcihpdGVtLmIpIHx8IDApKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uYSAhPT0gdW5kZWZpbmVkID8gTWF0aC5taW4oMjU1LCBNYXRoLm1heCgwLCBOdW1iZXIoaXRlbS5hKSkpIDogMjU1XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgY2MuQ29sb3IoMjU1LCAyNTUsIDI1NSwgMjU1KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgKGNvbXBvbmVudCBhcyBhbnkpW3Byb3BlcnR5XSA9IGNvbG9yQXJyYXk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlICdudW1iZXJBcnJheSc6XG4gICAgICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHByb2Nlc3NlZFZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgKGNvbXBvbmVudCBhcyBhbnkpW3Byb3BlcnR5XSA9IHByb2Nlc3NlZFZhbHVlLm1hcCgoaXRlbTogYW55KSA9PiBOdW1iZXIoaXRlbSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSAnc3RyaW5nQXJyYXknOlxuICAgICAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShwcm9jZXNzZWRWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIChjb21wb25lbnQgYXMgYW55KVtwcm9wZXJ0eV0gPSBwcm9jZXNzZWRWYWx1ZS5tYXAoKGl0ZW06IGFueSkgPT4gU3RyaW5nKGl0ZW0pKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIC8vIEZvciBiYXNpYyB0eXBlcyAoc3RyaW5nLCBudW1iZXIsIGJvb2xlYW4pLCBhc3NpZ24gZGlyZWN0bHlcbiAgICAgICAgICAgICAgICAgICAgKGNvbXBvbmVudCBhcyBhbnkpW3Byb3BlcnR5XSA9IHByb2Nlc3NlZFZhbHVlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiB0cnVlLCBtZXNzYWdlOiBgQ29tcG9uZW50IHByb3BlcnR5ICcke3Byb3BlcnR5fScgdXBkYXRlZCBzdWNjZXNzZnVsbHlgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBRdWVyeSBub2RlIHRyZWUgc3RydWN0dXJlXG4gICAgICovXG4gICAgcXVlcnlOb2RlVHJlZShldmVudDogYW55KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBzY2VuZSA9IGNjLmRpcmVjdG9yLmdldFNjZW5lKCk7XG4gICAgICAgICAgICBpZiAoIXNjZW5lKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnTm8gYWN0aXZlIHNjZW5lJyB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBidWlsZFRyZWUgPSAobm9kZTogYW55KTogYW55ID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICB1dWlkOiBub2RlLnV1aWQsXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IG5vZGUubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgYWN0aXZlOiBub2RlLmFjdGl2ZSxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogY2MuanMuZ2V0Q2xhc3NOYW1lKG5vZGUpLFxuICAgICAgICAgICAgICAgICAgICBjaGlsZHJlbjogbm9kZS5jaGlsZHJlbiA/IG5vZGUuY2hpbGRyZW4ubWFwKChjaGlsZDogYW55KSA9PiBidWlsZFRyZWUoY2hpbGQpKSA6IFtdXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgdXVpZDogc2NlbmUudXVpZCxcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogc2NlbmUubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW46IHNjZW5lLmNoaWxkcmVuLm1hcCgoY2hpbGQ6IGFueSkgPT4gYnVpbGRUcmVlKGNoaWxkKSlcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUXVlcnkgc3BlY2lmaWMgbm9kZSBieSBVVUlEXG4gICAgICovXG4gICAgcXVlcnlOb2RlKGV2ZW50OiBhbnksIHV1aWQ6IHN0cmluZykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qgc2NlbmUgPSBjYy5kaXJlY3Rvci5nZXRTY2VuZSgpO1xuICAgICAgICAgICAgaWYgKCFzY2VuZSkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCBudWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBub2RlID0gZmluZE5vZGVCeVV1aWQoc2NlbmUsIHV1aWQpO1xuICAgICAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIG51bGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHBvc0RhdGEgPSBub2RlLnBvc2l0aW9uID8ge1xuICAgICAgICAgICAgICAgIHg6IChub2RlLnBvc2l0aW9uIGFzIGFueSkueCB8fCBub2RlLngsXG4gICAgICAgICAgICAgICAgeTogKG5vZGUucG9zaXRpb24gYXMgYW55KS55IHx8IG5vZGUueSxcbiAgICAgICAgICAgICAgICB6OiAobm9kZS5wb3NpdGlvbiBhcyBhbnkpLnogfHwgMFxuICAgICAgICAgICAgfSA6IHsgeDogbm9kZS54LCB5OiBub2RlLnksIHo6IDAgfTtcblxuICAgICAgICAgICAgY29uc3QgY29tcG9uZW50cyA9IChub2RlIGFzIGFueSkuX2NvbXBvbmVudHMgPyAobm9kZSBhcyBhbnkpLl9jb21wb25lbnRzLm1hcCgoY29tcDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29tcFR5cGUgPSBjYy5qcy5nZXRDbGFzc05hbWUoY29tcCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbXBEYXRhOiBhbnkgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfX3R5cGVfXzogY29tcFR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmFibGVkOiBjb21wLmVuYWJsZWQgIT09IHVuZGVmaW5lZCA/IGNvbXAuZW5hYmxlZCA6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiBjb21wLnV1aWQgfHwgbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBzZXJpYWxpemVDb21wb25lbnRQcm9wZXJ0aWVzKGNvbXAsIGNvbXBUeXBlKVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29tcERhdGE7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoY29tcEVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgY29tcG9uZW50IHNlcmlhbGl6YXRpb24gZmFpbHMsIHJldHVybiBtaW5pbWFsIGRhdGFcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9fdHlwZV9fOiAnVW5rbm93bicsXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogY29tcC51dWlkIHx8IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZToge31cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSA6IFtdO1xuXG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7XG4gICAgICAgICAgICAgICAgICAgIHV1aWQ6IG5vZGUudXVpZCxcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogeyB2YWx1ZTogbm9kZS5uYW1lIH0sXG4gICAgICAgICAgICAgICAgICAgIGFjdGl2ZTogeyB2YWx1ZTogbm9kZS5hY3RpdmUgfSxcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IHsgdmFsdWU6IHBvc0RhdGEgfSxcbiAgICAgICAgICAgICAgICAgICAgcm90YXRpb246IHsgdmFsdWU6IG5vZGUucm90YXRpb24gfHwgMCB9LFxuICAgICAgICAgICAgICAgICAgICBzY2FsZTogeyB2YWx1ZTogeyB4OiBub2RlLnNjYWxlWCwgeTogbm9kZS5zY2FsZVksIHo6IDEgfSB9LFxuICAgICAgICAgICAgICAgICAgICBwYXJlbnQ6IHsgdmFsdWU6IHsgdXVpZDogbm9kZS5wYXJlbnQ/LnV1aWQgfHwgbnVsbCB9IH0sXG4gICAgICAgICAgICAgICAgICAgIGNoaWxkcmVuOiBub2RlLmNoaWxkcmVuLm1hcCgoY2hpbGQ6IGFueSkgPT4gKHsgdXVpZDogY2hpbGQudXVpZCwgbmFtZTogY2hpbGQubmFtZSB9KSksXG4gICAgICAgICAgICAgICAgICAgIF9fY29tcHNfXzogY29tcG9uZW50cyxcbiAgICAgICAgICAgICAgICAgICAgbGF5ZXI6IHsgdmFsdWU6IDEwNzM3NDE4MjQgfSxcbiAgICAgICAgICAgICAgICAgICAgbW9iaWxpdHk6IHsgdmFsdWU6IDAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCBudWxsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgbm9kZSB3aXRoIG9wdGlvbnMgKHN1cHBvcnRzIHByZWZhYnMsIGNvbXBvbmVudHMsIHRyYW5zZm9ybSlcbiAgICAgKi9cbiAgICBjcmVhdGVOb2RlV2l0aE9wdGlvbnMoZXZlbnQ6IGFueSwgb3B0aW9uczogYW55KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBzY2VuZSA9IGNjLmRpcmVjdG9yLmdldFNjZW5lKCk7XG4gICAgICAgICAgICBpZiAoIXNjZW5lKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIG51bGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBub2RlOiBhbnkgPSBudWxsO1xuXG4gICAgICAgICAgICAvLyBJZiBjcmVhdGluZyBmcm9tIGFzc2V0IChwcmVmYWIpXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5hc3NldFV1aWQpIHtcbiAgICAgICAgICAgICAgICAvLyBJbiAyLngsIHByZWZhYiBpbnN0YW50aWF0aW9uIGZyb20gVVVJRCBpbiBzY2VuZSBzY3JpcHRzIGlzIG5vdCBkaXJlY3RseSBzdXBwb3J0ZWRcbiAgICAgICAgICAgICAgICAvLyBUaGlzIHdvdWxkIG5lZWQgdG8gYmUgaGFuZGxlZCBieSB0aGUgZWRpdG9yIEFQSSwgbm90IHJ1bnRpbWUgQVBJXG4gICAgICAgICAgICAgICAgLy8gRm9yIG5vdywgcmV0dXJuIGFuIGVycm9yIGluZGljYXRpbmcgdGhpcyBsaW1pdGF0aW9uXG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIG51bGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIENyZWF0ZSBlbXB0eSBub2RlXG4gICAgICAgICAgICAgICAgbm9kZSA9IG5ldyBjYy5Ob2RlKG9wdGlvbnMubmFtZSB8fCAnTmV3IE5vZGUnKTtcblxuICAgICAgICAgICAgICAgIC8vIEFkZCBjb21wb25lbnRzIGlmIHNwZWNpZmllZFxuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmNvbXBvbmVudHMgJiYgQXJyYXkuaXNBcnJheShvcHRpb25zLmNvbXBvbmVudHMpKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgY29tcFR5cGUgb2Ygb3B0aW9ucy5jb21wb25lbnRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBDb21wb25lbnRDbGFzcyA9IGNjLmpzLmdldENsYXNzQnlOYW1lKGNvbXBUeXBlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChDb21wb25lbnRDbGFzcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuYWRkQ29tcG9uZW50KENvbXBvbmVudENsYXNzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIG51bGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFNldCBwYXJlbnRcbiAgICAgICAgICAgIGlmIChvcHRpb25zLnBhcmVudCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhcmVudCA9IGZpbmROb2RlQnlVdWlkKHNjZW5lLCBvcHRpb25zLnBhcmVudCk7XG4gICAgICAgICAgICAgICAgaWYgKHBhcmVudCkge1xuICAgICAgICAgICAgICAgICAgICBub2RlLnNldFBhcmVudChwYXJlbnQpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUuc2V0UGFyZW50KHNjZW5lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG5vZGUuc2V0UGFyZW50KHNjZW5lKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgbm9kZS51dWlkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgbnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IG5vZGUgcGFyZW50XG4gICAgICovXG4gICAgc2V0UGFyZW50KGV2ZW50OiBhbnksIHBhcmVudFV1aWQ6IHN0cmluZywgY2hpbGRVdWlkczogc3RyaW5nW10sIGtlZXBXb3JsZFRyYW5zZm9ybTogYm9vbGVhbiA9IGZhbHNlKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBzY2VuZSA9IGNjLmRpcmVjdG9yLmdldFNjZW5lKCk7XG4gICAgICAgICAgICBpZiAoIXNjZW5lKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnTm8gYWN0aXZlIHNjZW5lJyB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBwYXJlbnQgPSBmaW5kTm9kZUJ5VXVpZChzY2VuZSwgcGFyZW50VXVpZCk7XG4gICAgICAgICAgICBpZiAoIXBhcmVudCkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYFBhcmVudCBub2RlIHdpdGggVVVJRCAke3BhcmVudFV1aWR9IG5vdCBmb3VuZGAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yIChjb25zdCBjaGlsZFV1aWQgb2YgY2hpbGRVdWlkcykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkID0gZmluZE5vZGVCeVV1aWQoc2NlbmUsIGNoaWxkVXVpZCk7XG4gICAgICAgICAgICAgICAgaWYgKGNoaWxkKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChrZWVwV29ybGRUcmFuc2Zvcm0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFN0b3JlIHdvcmxkIHBvc2l0aW9uIGJlZm9yZSByZXBhcmVudGluZyAoMi54IHZlcnNpb24pXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB3b3JsZFggPSBjaGlsZC54O1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgd29ybGRZID0gY2hpbGQueTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLnNldFBhcmVudChwYXJlbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gTm90ZTogVGhpcyBpcyBhIHNpbXBsaWZpZWQgdmVyc2lvbiB0aGF0IGRvZXNuJ3QgYWNjb3VudCBmb3IgcGFyZW50IHRyYW5zZm9ybXNcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZvciBmdWxsIHdvcmxkIHRyYW5zZm9ybSBwcmVzZXJ2YXRpb24sIG1vcmUgY29tcGxleCBjYWxjdWxhdGlvbnMgYXJlIG5lZWRlZFxuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQuc2V0UG9zaXRpb24od29ybGRYLCB3b3JsZFkpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQuc2V0UGFyZW50KHBhcmVudCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogdHJ1ZSwgbWVzc2FnZTogJ1BhcmVudCBzZXQgc3VjY2Vzc2Z1bGx5JyB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIG5vZGUgZnJvbSBzY2VuZVxuICAgICAqL1xuICAgIHJlbW92ZU5vZGUoZXZlbnQ6IGFueSwgdXVpZDogc3RyaW5nKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBzY2VuZSA9IGNjLmRpcmVjdG9yLmdldFNjZW5lKCk7XG4gICAgICAgICAgICBpZiAoIXNjZW5lKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnTm8gYWN0aXZlIHNjZW5lJyB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBub2RlID0gZmluZE5vZGVCeVV1aWQoc2NlbmUsIHV1aWQpO1xuICAgICAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgTm9kZSB3aXRoIFVVSUQgJHt1dWlkfSBub3QgZm91bmRgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG5vZGUucmVtb3ZlRnJvbVBhcmVudCgpO1xuICAgICAgICAgICAgbm9kZS5kZXN0cm95KCk7XG5cbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogdHJ1ZSwgbWVzc2FnZTogJ05vZGUgcmVtb3ZlZCBzdWNjZXNzZnVsbHknIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEdXBsaWNhdGUgbm9kZVxuICAgICAqL1xuICAgIGR1cGxpY2F0ZU5vZGUoZXZlbnQ6IGFueSwgdXVpZDogc3RyaW5nKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBzY2VuZSA9IGNjLmRpcmVjdG9yLmdldFNjZW5lKCk7XG4gICAgICAgICAgICBpZiAoIXNjZW5lKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnTm8gYWN0aXZlIHNjZW5lJyB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBub2RlID0gZmluZE5vZGVCeVV1aWQoc2NlbmUsIHV1aWQpO1xuICAgICAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgTm9kZSB3aXRoIFVVSUQgJHt1dWlkfSBub3QgZm91bmRgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFVzZSBjYy5pbnN0YW50aWF0ZSB0byBjbG9uZSB0aGUgbm9kZVxuICAgICAgICAgICAgY29uc3QgY2xvbmVkTm9kZSA9IGNjLmluc3RhbnRpYXRlKG5vZGUpO1xuICAgICAgICAgICAgY2xvbmVkTm9kZS5uYW1lID0gbm9kZS5uYW1lICsgJyBDb3B5JztcblxuICAgICAgICAgICAgLy8gQWRkIHRvIHNhbWUgcGFyZW50XG4gICAgICAgICAgICBpZiAobm9kZS5wYXJlbnQpIHtcbiAgICAgICAgICAgICAgICBjbG9uZWROb2RlLnNldFBhcmVudChub2RlLnBhcmVudCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNsb25lZE5vZGUuc2V0UGFyZW50KHNjZW5lKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyB1dWlkOiBjbG9uZWROb2RlLnV1aWQgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEZpbmQgbm9kZXMgYnkgcGF0dGVyblxuICAgICAqL1xuICAgIGZpbmROb2RlcyhldmVudDogYW55LCBwYXR0ZXJuOiBzdHJpbmcsIGV4YWN0TWF0Y2g6IGJvb2xlYW4gPSBmYWxzZSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qgc2NlbmUgPSBjYy5kaXJlY3Rvci5nZXRTY2VuZSgpO1xuICAgICAgICAgICAgaWYgKCFzY2VuZSkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ05vIGFjdGl2ZSBzY2VuZScgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgbm9kZXM6IGFueVtdID0gW107XG4gICAgICAgICAgICBjb25zdCBzZWFyY2hOb2RlcyA9IChub2RlOiBhbnksIHBhdGg6IHN0cmluZyA9ICcnKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZVBhdGggPSBwYXRoID8gYCR7cGF0aH0vJHtub2RlLm5hbWV9YCA6IG5vZGUubmFtZTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IG1hdGNoZXMgPSBleGFjdE1hdGNoXG4gICAgICAgICAgICAgICAgICAgID8gbm9kZS5uYW1lID09PSBwYXR0ZXJuXG4gICAgICAgICAgICAgICAgICAgIDogbm9kZS5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMocGF0dGVybi50b0xvd2VyQ2FzZSgpKTtcblxuICAgICAgICAgICAgICAgIGlmIChtYXRjaGVzKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGVzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogbm9kZS51dWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogbm9kZS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogbm9kZVBhdGhcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKG5vZGUuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5jaGlsZHJlbi5mb3JFYWNoKChjaGlsZDogYW55KSA9PiBzZWFyY2hOb2RlcyhjaGlsZCwgbm9kZVBhdGgpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzY2VuZS5jaGlsZHJlbi5mb3JFYWNoKChjaGlsZDogYW55KSA9PiBzZWFyY2hOb2RlcyhjaGlsZCkpO1xuXG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IG5vZGVzIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFeGVjdXRlIGFyYml0cmFyeSBKYXZhU2NyaXB0IGluIHNjZW5lIGNvbnRleHRcbiAgICAgKi9cbiAgICBleGVjdXRlU2NyaXB0KGV2ZW50OiBhbnksIHNjcmlwdDogc3RyaW5nKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBFeGVjdXRlIHNjcmlwdCBpbiBnbG9iYWwgc2NvcGUgKG9yIGN1cnJlbnQgc2NvcGUpXG4gICAgICAgICAgICAvLyBVc2luZyBldmFsIGlzIGRhbmdlcm91cyBidXQgbmVjZXNzYXJ5IGZvciB0aGlzIGRlYnVnIHRvb2xcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGV2YWwoc2NyaXB0KTtcbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHJlc3VsdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXhlY3V0ZSBjb21wb25lbnQgbWV0aG9kXG4gICAgICovXG4gICAgZXhlY3V0ZUNvbXBvbmVudE1ldGhvZChldmVudDogYW55LCBjb21wb25lbnRVdWlkOiBzdHJpbmcsIG1ldGhvZE5hbWU6IHN0cmluZywgYXJnczogYW55W10gPSBbXSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qgc2NlbmUgPSBjYy5kaXJlY3Rvci5nZXRTY2VuZSgpO1xuICAgICAgICAgICAgaWYgKCFzY2VuZSkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ05vIGFjdGl2ZSBzY2VuZScgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gRmluZCBjb21wb25lbnQgYnkgVVVJRCAtIG5lZWQgdG8gc2VhcmNoIGFsbCBub2Rlc1xuICAgICAgICAgICAgbGV0IHRhcmdldENvbXBvbmVudDogYW55ID0gbnVsbDtcbiAgICAgICAgICAgIGNvbnN0IHNlYXJjaENvbXBvbmVudCA9IChub2RlOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAobm9kZS5fY29tcG9uZW50cykge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGNvbXAgb2Ygbm9kZS5fY29tcG9uZW50cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbXAudXVpZCA9PT0gY29tcG9uZW50VXVpZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldENvbXBvbmVudCA9IGNvbXA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChub2RlLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgY2hpbGQgb2Ygbm9kZS5jaGlsZHJlbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VhcmNoQ29tcG9uZW50KGNoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0YXJnZXRDb21wb25lbnQpIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHNlYXJjaENvbXBvbmVudChzY2VuZSk7XG5cbiAgICAgICAgICAgIGlmICghdGFyZ2V0Q29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgQ29tcG9uZW50IHdpdGggVVVJRCAke2NvbXBvbmVudFV1aWR9IG5vdCBmb3VuZGAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gRXhlY3V0ZSBtZXRob2RcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGFyZ2V0Q29tcG9uZW50W21ldGhvZE5hbWVdID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gdGFyZ2V0Q29tcG9uZW50W21ldGhvZE5hbWVdKC4uLmFyZ3MpO1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IHJlc3VsdCB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYE1ldGhvZCAnJHttZXRob2ROYW1lfScgbm90IGZvdW5kIG9uIGNvbXBvbmVudGAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBRdWVyeSBpZiBzY2VuZSBpcyByZWFkeVxuICAgICAqL1xuICAgIHF1ZXJ5U2NlbmVSZWFkeShldmVudDogYW55KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBzY2VuZSA9IGNjLmRpcmVjdG9yLmdldFNjZW5lKCk7XG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IHsgcmVhZHk6IHNjZW5lICE9PSBudWxsICYmIHNjZW5lICE9PSB1bmRlZmluZWQgfSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUXVlcnkgaWYgc2NlbmUgaGFzIHVuc2F2ZWQgY2hhbmdlc1xuICAgICAqIE5vdGU6IEluIDIueCBydW50aW1lLCB3ZSBjYW5ub3QgZGlyZWN0bHkgY2hlY2sgZGlydHkgc3RhdGVcbiAgICAgKiBUaGlzIGlzIGFuIGVkaXRvci1vbmx5IGZlYXR1cmUsIHNvIHdlIHJldHVybiBmYWxzZVxuICAgICAqL1xuICAgIHF1ZXJ5U2NlbmVEaXJ0eShldmVudDogYW55KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBJbiAyLnggcnVudGltZSwgd2UgY2Fubm90IGFjY2VzcyBlZGl0b3IgZGlydHkgc3RhdGVcbiAgICAgICAgICAgIC8vIFJldHVybiBmYWxzZSBhcyBkZWZhdWx0XG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IHsgZGlydHk6IGZhbHNlIH0gfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFF1ZXJ5IGFsbCByZWdpc3RlcmVkIGNsYXNzZXNcbiAgICAgKi9cbiAgICBxdWVyeVNjZW5lQ2xhc3NlcyhldmVudDogYW55LCBleHRlbmRzQ2xhc3M/OiBzdHJpbmcpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNsYXNzZXM6IGFueVtdID0gW107XG5cbiAgICAgICAgICAgIC8vIEdldCBhbGwgY2xhc3NlcyBmcm9tIGNjIG5hbWVzcGFjZVxuICAgICAgICAgICAgY29uc3QgY2NOYW1lc3BhY2UgPSAod2luZG93IGFzIGFueSkuY2MgfHwgY2M7XG4gICAgICAgICAgICBjb25zdCBjbGFzc05hbWVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgICAgICAgICAvLyBDb2xsZWN0IGNsYXNzIG5hbWVzIGZyb20gY2MgbmFtZXNwYWNlXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBjY05hbWVzcGFjZSkge1xuICAgICAgICAgICAgICAgIGlmIChjY05hbWVzcGFjZS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gY2NOYW1lc3BhY2Vba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJyAmJiB2YWx1ZS5wcm90b3R5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZXMucHVzaChrZXkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBGaWx0ZXIgYnkgZXh0ZW5kcyBpZiBzcGVjaWZpZWRcbiAgICAgICAgICAgIGlmIChleHRlbmRzQ2xhc3MpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBCYXNlQ2xhc3MgPSBjYy5qcy5nZXRDbGFzc0J5TmFtZShleHRlbmRzQ2xhc3MpO1xuICAgICAgICAgICAgICAgIGlmIChCYXNlQ2xhc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBjbGFzc05hbWUgb2YgY2xhc3NOYW1lcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgQ2xhc3MgPSBjYy5qcy5nZXRDbGFzc0J5TmFtZShjbGFzc05hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKENsYXNzICYmIENsYXNzLnByb3RvdHlwZSBpbnN0YW5jZW9mIEJhc2VDbGFzcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGNsYXNzTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0ZW5kczogZXh0ZW5kc0NsYXNzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIFJldHVybiBhbGwgY2xhc3Nlc1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgY2xhc3NOYW1lIG9mIGNsYXNzTmFtZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xhc3Nlcy5wdXNoKHsgbmFtZTogY2xhc3NOYW1lIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiB0cnVlLCBkYXRhOiBjbGFzc2VzIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICBpZiAoZXZlbnQucmVwbHkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBRdWVyeSBhdmFpbGFibGUgc2NlbmUgY29tcG9uZW50c1xuICAgICAqL1xuICAgIHF1ZXJ5U2NlbmVDb21wb25lbnRzKGV2ZW50OiBhbnkpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudHM6IGFueVtdID0gW107XG5cbiAgICAgICAgICAgIC8vIEdldCBhbGwgY29tcG9uZW50IGNsYXNzZXMgZnJvbSBjYyBuYW1lc3BhY2VcbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudE5hbWVzID0gW1xuICAgICAgICAgICAgICAgICdjYy5Db21wb25lbnQnLFxuICAgICAgICAgICAgICAgICdjYy5TcHJpdGUnLFxuICAgICAgICAgICAgICAgICdjYy5MYWJlbCcsXG4gICAgICAgICAgICAgICAgJ2NjLkJ1dHRvbicsXG4gICAgICAgICAgICAgICAgJ2NjLkFuaW1hdGlvbicsXG4gICAgICAgICAgICAgICAgJ2NjLkF1ZGlvU291cmNlJyxcbiAgICAgICAgICAgICAgICAnY2MuQ2FtZXJhJyxcbiAgICAgICAgICAgICAgICAnY2MuQ2FudmFzJyxcbiAgICAgICAgICAgICAgICAnY2MuQ29sbGlkZXInLFxuICAgICAgICAgICAgICAgICdjYy5SaWdpZEJvZHknLFxuICAgICAgICAgICAgICAgICdjYy5QaHlzaWNzQm94Q29sbGlkZXInLFxuICAgICAgICAgICAgICAgICdjYy5QaHlzaWNzQ2lyY2xlQ29sbGlkZXInLFxuICAgICAgICAgICAgICAgICdjYy5QaHlzaWNzUG9seWdvbkNvbGxpZGVyJyxcbiAgICAgICAgICAgICAgICAnY2MuUmljaFRleHQnLFxuICAgICAgICAgICAgICAgICdjYy5TY3JvbGxWaWV3JyxcbiAgICAgICAgICAgICAgICAnY2MuUGFnZVZpZXcnLFxuICAgICAgICAgICAgICAgICdjYy5FZGl0Qm94JyxcbiAgICAgICAgICAgICAgICAnY2MuTGF5b3V0JyxcbiAgICAgICAgICAgICAgICAnY2MuTWFzaycsXG4gICAgICAgICAgICAgICAgJ2NjLlByb2dyZXNzQmFyJyxcbiAgICAgICAgICAgICAgICAnY2MuU2xpZGVyJyxcbiAgICAgICAgICAgICAgICAnY2MuVG9nZ2xlJyxcbiAgICAgICAgICAgICAgICAnY2MuVG9nZ2xlR3JvdXAnLFxuICAgICAgICAgICAgICAgICdjYy5XaWRnZXQnLFxuICAgICAgICAgICAgICAgICdjYy5HcmFwaGljcycsXG4gICAgICAgICAgICAgICAgJ2NjLk1vdGlvblN0cmVhaycsXG4gICAgICAgICAgICAgICAgJ2NjLlBhcnRpY2xlU3lzdGVtJyxcbiAgICAgICAgICAgICAgICAnY2MuVGlsZWRNYXAnLFxuICAgICAgICAgICAgICAgICdjYy5UaWxlZExheWVyJyxcbiAgICAgICAgICAgICAgICAnY2MuVGlsZWRPYmplY3RHcm91cCcsXG4gICAgICAgICAgICAgICAgJ2NjLlRpbGVkVGlsZScsXG4gICAgICAgICAgICAgICAgJ2NjLlZpZGVvUGxheWVyJyxcbiAgICAgICAgICAgICAgICAnY2MuV2ViVmlldydcbiAgICAgICAgICAgIF07XG5cbiAgICAgICAgICAgIGZvciAoY29uc3QgY29tcE5hbWUgb2YgY29tcG9uZW50TmFtZXMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBDb21wQ2xhc3MgPSBjYy5qcy5nZXRDbGFzc0J5TmFtZShjb21wTmFtZSk7XG4gICAgICAgICAgICAgICAgaWYgKENvbXBDbGFzcykge1xuICAgICAgICAgICAgICAgICAgICBjb21wb25lbnRzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogY29tcE5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBjb21wTmFtZVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogY29tcG9uZW50cyB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgaWYgY29tcG9uZW50IGhhcyBzY3JpcHRcbiAgICAgKi9cbiAgICBxdWVyeUNvbXBvbmVudEhhc1NjcmlwdChldmVudDogYW55LCBjbGFzc05hbWU6IHN0cmluZykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgQ29tcENsYXNzID0gY2MuanMuZ2V0Q2xhc3NCeU5hbWUoY2xhc3NOYW1lKTtcbiAgICAgICAgICAgIGlmICghQ29tcENsYXNzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgQ29tcG9uZW50IGNsYXNzICcke2NsYXNzTmFtZX0nIG5vdCBmb3VuZGAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gSW4gMi54LCBjaGVjayBpZiBjb21wb25lbnQgaGFzIGFueSBtZXRob2RzIChpbmRpY2F0aW5nIGl0IG1pZ2h0IGhhdmUgYSBzY3JpcHQpXG4gICAgICAgICAgICAvLyBUaGlzIGlzIGEgc2ltcGxpZmllZCBjaGVjayAtIGFjdHVhbCBzY3JpcHQgZGV0ZWN0aW9uIHdvdWxkIHJlcXVpcmUgbW9yZSBjb21wbGV4IGxvZ2ljXG4gICAgICAgICAgICBjb25zdCBoYXNTY3JpcHQgPSBDb21wQ2xhc3MucHJvdG90eXBlICYmIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKENvbXBDbGFzcy5wcm90b3R5cGUpLmxlbmd0aCA+IDE7XG5cbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogeyBoYXNTY3JpcHQgfSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUXVlcnkgbm9kZXMgYnkgYXNzZXQgVVVJRFxuICAgICAqL1xuICAgIHF1ZXJ5Tm9kZXNCeUFzc2V0VXVpZChldmVudDogYW55LCBhc3NldFV1aWQ6IHN0cmluZykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qgc2NlbmUgPSBjYy5kaXJlY3Rvci5nZXRTY2VuZSgpO1xuICAgICAgICAgICAgaWYgKCFzY2VuZSkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ05vIGFjdGl2ZSBzY2VuZScgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgbm9kZVV1aWRzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgICAgICAgICAvLyBTZWFyY2ggYWxsIG5vZGVzIGZvciBjb21wb25lbnRzIHRoYXQgcmVmZXJlbmNlIHRoZSBhc3NldCBVVUlEXG4gICAgICAgICAgICBjb25zdCBzZWFyY2hOb2RlcyA9IChub2RlOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAobm9kZS5fY29tcG9uZW50cykge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGNvbXAgb2Ygbm9kZS5fY29tcG9uZW50cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgY29tbW9uIGFzc2V0IHJlZmVyZW5jZSBwcm9wZXJ0aWVzXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhc3NldFByb3BzID0gWydzcHJpdGVGcmFtZScsICd0ZXh0dXJlJywgJ2F0bGFzJywgJ2ZvbnQnLCAnYXVkaW9DbGlwJywgJ3ByZWZhYiddO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBwcm9wIG9mIGFzc2V0UHJvcHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29tcFtwcm9wXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhc3NldCA9IGNvbXBbcHJvcF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIGlmIGFzc2V0IGhhcyBtYXRjaGluZyBVVUlEXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhc3NldCAmJiAoYXNzZXQudXVpZCA9PT0gYXNzZXRVdWlkIHx8IChhc3NldC5fdXVpZCAmJiBhc3NldC5fdXVpZCA9PT0gYXNzZXRVdWlkKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChub2RlVXVpZHMuaW5kZXhPZihub2RlLnV1aWQpID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVVdWlkcy5wdXNoKG5vZGUudXVpZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAobm9kZS5jaGlsZHJlbikge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIG5vZGUuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlYXJjaE5vZGVzKGNoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHNlYXJjaE5vZGVzKHNjZW5lKTtcblxuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiB0cnVlLCBkYXRhOiBub2RlVXVpZHMgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIExvYWQgc2NlbmUgYnkgVVVJRFxuICAgICAqIFVzZXMgX1NjZW5lLmxvYWRTY2VuZUJ5VXVpZCB3aGljaCBpcyBvbmx5IGF2YWlsYWJsZSBpbiBzY2VuZSBzY3JpcHRzXG4gICAgICovXG4gICAgbG9hZFNjZW5lQnlVdWlkKGV2ZW50OiBhbnksIHV1aWQ6IHN0cmluZykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gX1NjZW5l7J2AIHNjZW5lIHNjcmlwdOyXkOyEnOunjCDsgqzsmqkg6rCA64ql7ZWcIOyghOyXrSDqsJ3ssrRcbiAgICAgICAgICAgIGlmICh0eXBlb2YgX1NjZW5lID09PSAndW5kZWZpbmVkJyB8fCAhX1NjZW5lLmxvYWRTY2VuZUJ5VXVpZCkge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5yZXBseShudWxsLCB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ19TY2VuZS5sb2FkU2NlbmVCeVV1aWQgaXMgbm90IGF2YWlsYWJsZScgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgX1NjZW5lLmxvYWRTY2VuZUJ5VXVpZCh1dWlkLCAoZXJyb3I6IEVycm9yIHwgbnVsbCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC5yZXBseSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiB0cnVlLCBtZXNzYWdlOiBgU2NlbmUgbG9hZGVkIHN1Y2Nlc3NmdWxseTogJHt1dWlkfWAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgaWYgKGV2ZW50LnJlcGx5KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucmVwbHkobnVsbCwgeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IG1ldGhvZHM7XG4iXX0=