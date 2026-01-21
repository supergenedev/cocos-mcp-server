/**
 * Type definitions for Cocos Creator 2.x Runtime API (cc namespace)
 */

declare namespace cc {
    class Node {
        name: string;
        uuid: string;
        active: boolean;
        parent: Node | null;
        children: Node[];
        x: number;
        y: number;
        position: Vec2 | Vec3;
        rotation: number;
        rotationX: number;
        rotationY: number;
        scaleX: number;
        scaleY: number;
        width: number;
        height: number;
        anchorX: number;
        anchorY: number;
        zIndex: number;
        opacity: number;
        color: Color;

        constructor(name?: string);

        addChild(child: Node, localZOrder?: number, tag?: number | string): void;
        setParent(parent: Node | null): void;
        removeChild(child: Node, cleanup?: boolean): void;
        removeAllChildren(cleanup?: boolean): void;
        removeFromParent(cleanup?: boolean): void;
        getChildByName(name: string): Node | null;
        getChildByUuid(uuid: string): Node | null;
        getChildByTag(tag: number): Node | null;

        addComponent<T extends Component>(typeOrClassName: new () => T | string): T;
        getComponent<T extends Component>(typeOrClassName: new () => T | string): T | null;
        getComponents<T extends Component>(typeOrClassName: new () => T | string): T[];
        getComponentInChildren<T extends Component>(typeOrClassName: new () => T | string): T | null;
        getComponentsInChildren<T extends Component>(typeOrClassName: new () => T | string): T[];
        removeComponent(component: Component | string): void;

        setPosition(x: number | Vec2 | Vec3, y?: number, z?: number): void;
        getPosition(): Vec2 | Vec3;
        setScale(x: number | Vec2 | Vec3, y?: number, z?: number): void;
        setRotation(rotation: number): void;

        on(type: string, callback: Function, target?: any, useCapture?: boolean): void;
        off(type: string, callback?: Function, target?: any, useCapture?: boolean): void;
        once(type: string, callback: Function, target?: any): void;
        emit(type: string, ...args: any[]): void;

        destroy(): boolean;
    }

    class Scene extends Node {
        autoReleaseAssets: boolean;
    }

    class Component {
        name: string;
        uuid: string;
        node: Node;
        enabled: boolean;
        enabledInHierarchy: boolean;

        constructor();

        onLoad?(): void;
        start?(): void;
        onEnable?(): void;
        onDisable?(): void;
        update?(dt: number): void;
        lateUpdate?(dt: number): void;
        onDestroy?(): void;

        getComponent<T extends Component>(typeOrClassName: new () => T | string): T | null;
        getComponents<T extends Component>(typeOrClassName: new () => T | string): T[];
        getComponentInChildren<T extends Component>(typeOrClassName: new () => T | string): T | null;
        getComponentsInChildren<T extends Component>(typeOrClassName: new () => T | string): T[];

        schedule(callback: Function, interval?: number, repeat?: number, delay?: number): void;
        scheduleOnce(callback: Function, delay?: number): void;
        unschedule(callback: Function): void;
        unscheduleAllCallbacks(): void;

        destroy(): boolean;
    }

    class Vec2 {
        x: number;
        y: number;
        constructor(x?: number, y?: number);
    }

    class Vec3 {
        x: number;
        y: number;
        z: number;
        constructor(x?: number, y?: number, z?: number);
    }

    class Color {
        r: number;
        g: number;
        b: number;
        a: number;
        constructor(r?: number, g?: number, b?: number, a?: number);
    }

    class Sprite extends Component {
        spriteFrame: SpriteFrame | null;
        type: Sprite.Type;
        sizeMode: Sprite.SizeMode;
        trim: boolean;
    }

    namespace Sprite {
        enum Type {
            SIMPLE = 0,
            SLICED = 1,
            TILED = 2,
            FILLED = 3
        }
        enum SizeMode {
            CUSTOM = 0,
            TRIMMED = 1,
            RAW = 2
        }
    }

    class Label extends Component {
        string: string;
        fontSize: number;
        lineHeight: number;
        horizontalAlign: Label.HorizontalAlign;
        verticalAlign: Label.VerticalAlign;
        overflow: Label.Overflow;
        enableWrapText: boolean;
    }

    namespace Label {
        enum HorizontalAlign {
            LEFT = 0,
            CENTER = 1,
            RIGHT = 2
        }
        enum VerticalAlign {
            TOP = 0,
            CENTER = 1,
            BOTTOM = 2
        }
        enum Overflow {
            NONE = 0,
            CLAMP = 1,
            SHRINK = 2,
            RESIZE_HEIGHT = 3
        }
    }

    class Button extends Component {
        interactable: boolean;
        transition: Button.Transition;
        normalColor: Color;
        pressedColor: Color;
        hoverColor: Color;
        disabledColor: Color;
        target: Node | null;
        clickEvents: Component.EventHandler[];
    }

    namespace Button {
        enum Transition {
            NONE = 0,
            COLOR = 1,
            SPRITE = 2,
            SCALE = 3
        }
    }

    class SpriteFrame {
        constructor();
    }

    class Texture2D {
        constructor();
    }

    class Prefab {
        constructor();
        data: Node;
    }

    namespace director {
        function getScene(): Scene | null;
        function loadScene(sceneName: string, onLaunched?: Function): boolean;
        function runScene(scene: Scene | null, onBeforeLoadScene?: Function, onLaunched?: Function): void;
    }

    namespace game {
        function pause(): void;
        function resume(): void;
        function restart(): void;
        function end(): void;
    }

    namespace loader {
        function load(url: string | string[], progressCallback?: Function, completeCallback?: Function): void;
        function loadRes(url: string, type?: typeof cc.Asset, progressCallback?: Function, completeCallback?: Function): void;
        function loadResDir(url: string, type?: typeof cc.Asset, progressCallback?: Function, completeCallback?: Function): void;
        function release(asset: Asset | string): void;
        function releaseAsset(asset: Asset): void;
        function releaseRes(url: string, type?: typeof cc.Asset): void;
        function releaseResDir(url: string, type?: typeof cc.Asset): void;
    }

    namespace assetManager {
        function loadAny(uuid: string, callback: (err: Error | null, result: Asset | SpriteFrame | Prefab | null) => void): void;
    }

    namespace js {
        function getClassName(obj: any): string;
        function getClassByName(classname: string): Function | null;
    }

    function instantiate(original: Node | Prefab): Node;
    function find(path: string, referenceNode?: Node): Node | null;
    function log(...args: any[]): void;
    function warn(...args: any[]): void;
    function error(...args: any[]): void;

    class Asset {
        constructor();
    }
}

declare const cc: typeof cc;

