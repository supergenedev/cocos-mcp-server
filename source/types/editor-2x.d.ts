/**
 * Type definitions for Cocos Creator 2.x Editor API
 */

declare namespace Editor {
    interface IpcOption {
        excludeSelf?: boolean;
    }

    namespace Ipc {
        function sendToAll(message: string, ...args: any[]): void;
        function sendToMain(message: string, ...args: any[]): void;
        function sendToPanel(panelID: string, message: string, ...args: any[]): void;
        function sendToWins(message: string, ...args: any[]): void;
        function sendToWins(message: string, args: any[], option: IpcOption): void;
    }

    namespace Panel {
        function open(panelID: string, ...args: any[]): void;
        function close(panelID: string): void;
        function focus(panelID: string): void;
        function extend(options: PanelOptions): any;
    }

    interface PanelOptions {
        listeners?: {
            [key: string]: (...args: any[]) => void;
        };
        template?: string;
        style?: string;
        $?: {
            [key: string]: string;
        };
        ready?: () => void;
        beforeClose?: () => void;
        close?: () => void;
        [key: string]: any;
    }

    // Editor 2.x has appPath as a direct property, not a namespace
    const appPath: string;

    namespace Project {
        const path: string;
        const name: string;
        const id: string;
    }

    namespace Scene {
        function callSceneScript(method: string, ...args: any[]): any;
    }

    // Note: In 2.x it's 'assetdb' (lowercase), not 'AssetDB'
    // Using interface to support reserved keywords like 'import' and 'delete'
    interface AssetDB {
        // Query APIs
        queryAssets(pattern: string, assetType: string | string[], callback: (err: Error | null, results: any[]) => void): void;
        queryInfoByUuid(uuid: string, callback: (err: Error | null, info: any) => void): void;
        queryMetaInfoByUuid(uuid: string, callback: (err: Error | null, info: any) => void): void;
        queryPathByUrl(url: string, callback: (err: Error | null, path: string) => void): void;
        queryUuidByUrl(url: string, callback: (err: Error | null, uuid: string) => void): void;
        queryUrlByUuid(uuid: string, callback: (err: Error | null, url: string) => void): void;

        // File system APIs
        explore(url: string): void;

        // Modification APIs
        refresh(url: string, callback?: (err: Error | null) => void): void;
        create(url: string, data: any, callback?: (err: Error | null, result: any) => void): void;
        saveMeta(uuid: string, metaJson: string, callback?: (err: Error | null) => void): void;
        import(rawfiles: string[], destUrl: string, showProgress: boolean, callback?: (err: Error | null) => void): void;
        move(srcUrl: string, destUrl: string, showMessageBox?: boolean): void;
        delete(urls: string[]): void;
    }

    const assetdb: AssetDB;

    namespace Selection {
        function select(type: string, uuid: string | string[], unselectOthers?: boolean, confirmedChange?: boolean): void;
        function unselect(type: string, uuid: string | string[], confirmedChange?: boolean): void;
        function clear(type: string): void;
        function curActivate(type: string): string | null;
        function curSelection(type: string): string[];
    }

    namespace UI {
        function registerElement(tagName: string, options: any): void;
    }

    namespace MainMenu {
        function add(path: string, template: any[]): void;
        function remove(path: string): void;
        function update(path: string, template: any[]): void;
    }

    function log(...args: any[]): void;
    function warn(...args: any[]): void;
    function error(...args: any[]): void;
    function success(...args: any[]): void;
    function failed(...args: any[]): void;
    function info(...args: any[]): void;
}

