/// <reference path="../types/editor-2x.d.ts" />

/**
 * Helper function to call scene scripts with Promise-based API
 * Converts callback-based callSceneScript to Promise-based
 */
export function callSceneScriptAsync(module: string, method: string, ...args: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
        // Create callback function
        const callback = (err: Error | null, result: any) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        };

        // Call with args spread and callback as last parameter
        // Handle different argument counts to ensure callback is last
        if (args.length === 0) {
            Editor.Scene.callSceneScript(module, method, callback);
        } else if (args.length === 1) {
            Editor.Scene.callSceneScript(module, method, args[0], callback);
        } else if (args.length === 2) {
            Editor.Scene.callSceneScript(module, method, args[0], args[1], callback);
        } else if (args.length === 3) {
            Editor.Scene.callSceneScript(module, method, args[0], args[1], args[2], callback);
        } else if (args.length === 4) {
            Editor.Scene.callSceneScript(module, method, args[0], args[1], args[2], args[3], callback);
        } else if (args.length === 5) {
            Editor.Scene.callSceneScript(module, method, args[0], args[1], args[2], args[3], args[4], callback);
        } else {
            // Fallback for more args - use rest parameter overload
            Editor.Scene.callSceneScript(module, method, ...args, callback);
        }
    });
}

