"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_TOOL_MANAGER_SETTINGS = exports.DEFAULT_SETTINGS = exports.importToolConfiguration = exports.exportToolConfiguration = exports.saveToolManagerSettings = exports.readToolManagerSettings = exports.saveSettings = exports.readSettings = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const DEFAULT_SETTINGS = {
    port: 3000,
    autoStart: false,
    enableDebugLog: false,
    allowedOrigins: ['*'],
    maxConnections: 10
};
exports.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
const DEFAULT_TOOL_MANAGER_SETTINGS = {
    configurations: [],
    currentConfigId: '',
    maxConfigSlots: 5
};
exports.DEFAULT_TOOL_MANAGER_SETTINGS = DEFAULT_TOOL_MANAGER_SETTINGS;
function getSettingsPath() {
    return path.join(Editor.Project.path, 'settings', 'mcp-server.json');
}
function getToolManagerSettingsPath() {
    return path.join(Editor.Project.path, 'settings', 'tool-manager.json');
}
function ensureSettingsDir() {
    const settingsDir = path.dirname(getSettingsPath());
    if (!fs.existsSync(settingsDir)) {
        fs.mkdirSync(settingsDir, { recursive: true });
    }
}
function readSettings() {
    try {
        ensureSettingsDir();
        const settingsFile = getSettingsPath();
        if (fs.existsSync(settingsFile)) {
            const content = fs.readFileSync(settingsFile, 'utf8');
            return Object.assign(Object.assign({}, DEFAULT_SETTINGS), JSON.parse(content));
        }
    }
    catch (e) {
        console.error('Failed to read settings:', e);
    }
    return DEFAULT_SETTINGS;
}
exports.readSettings = readSettings;
function saveSettings(settings) {
    try {
        ensureSettingsDir();
        const settingsFile = getSettingsPath();
        fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
    }
    catch (e) {
        console.error('Failed to save settings:', e);
        throw e;
    }
}
exports.saveSettings = saveSettings;
// 工具管理器设置相关函数
function readToolManagerSettings() {
    try {
        ensureSettingsDir();
        const settingsFile = getToolManagerSettingsPath();
        if (fs.existsSync(settingsFile)) {
            const content = fs.readFileSync(settingsFile, 'utf8');
            return Object.assign(Object.assign({}, DEFAULT_TOOL_MANAGER_SETTINGS), JSON.parse(content));
        }
    }
    catch (e) {
        console.error('Failed to read tool manager settings:', e);
    }
    return DEFAULT_TOOL_MANAGER_SETTINGS;
}
exports.readToolManagerSettings = readToolManagerSettings;
function saveToolManagerSettings(settings) {
    try {
        ensureSettingsDir();
        const settingsFile = getToolManagerSettingsPath();
        fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
    }
    catch (e) {
        console.error('Failed to save tool manager settings:', e);
        throw e;
    }
}
exports.saveToolManagerSettings = saveToolManagerSettings;
function exportToolConfiguration(config) {
    return JSON.stringify(config, null, 2);
}
exports.exportToolConfiguration = exportToolConfiguration;
function importToolConfiguration(configJson) {
    try {
        const config = JSON.parse(configJson);
        // 验证配置格式
        if (!config.id || !config.name || !Array.isArray(config.tools)) {
            throw new Error('Invalid configuration format');
        }
        return config;
    }
    catch (e) {
        console.error('Failed to parse tool configuration:', e);
        throw new Error('Invalid JSON format or configuration structure');
    }
}
exports.importToolConfiguration = importToolConfiguration;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zb3VyY2Uvc2V0dGluZ3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSx1Q0FBeUI7QUFDekIsMkNBQTZCO0FBRzdCLE1BQU0sZ0JBQWdCLEdBQXNCO0lBQ3hDLElBQUksRUFBRSxJQUFJO0lBQ1YsU0FBUyxFQUFFLEtBQUs7SUFDaEIsY0FBYyxFQUFFLEtBQUs7SUFDckIsY0FBYyxFQUFFLENBQUMsR0FBRyxDQUFDO0lBQ3JCLGNBQWMsRUFBRSxFQUFFO0NBQ3JCLENBQUM7QUE0Rk8sNENBQWdCO0FBMUZ6QixNQUFNLDZCQUE2QixHQUF3QjtJQUN2RCxjQUFjLEVBQUUsRUFBRTtJQUNsQixlQUFlLEVBQUUsRUFBRTtJQUNuQixjQUFjLEVBQUUsQ0FBQztDQUNwQixDQUFDO0FBc0Z5QixzRUFBNkI7QUFwRnhELFNBQVMsZUFBZTtJQUNwQixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLGlCQUFpQixDQUFDLENBQUM7QUFDekUsQ0FBQztBQUVELFNBQVMsMEJBQTBCO0lBQy9CLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxVQUFVLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztBQUMzRSxDQUFDO0FBRUQsU0FBUyxpQkFBaUI7SUFDdEIsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDO0lBQ3BELElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxFQUFFO1FBQzdCLEVBQUUsQ0FBQyxTQUFTLENBQUMsV0FBVyxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7S0FDbEQ7QUFDTCxDQUFDO0FBRUQsU0FBZ0IsWUFBWTtJ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T0FBTyxNQUFNLENBQUM7S0FDakI7SUFBQyxPQUFPLENBQUMsRUFBRTtRQUNSLE9BQU8sQ0FBQyxLQUFLLENBQUMscUNBQXFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDeEQsTUFBTSxJQUFJLEtBQUssQ0FBQyxnREFBZ0QsQ0FBQyxDQUFDO0tBQ3JFO0FBQ0wsQ0FBQztBQVpELDBEQVlDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IE1DUFNlcnZlclNldHRpbmdzLCBUb29sTWFuYWdlclNldHRpbmdzLCBUb29sQ29uZmlndXJhdGlvbiwgVG9vbENvbmZpZyB9IGZyb20gJy4vdHlwZXMnO1xuXG5jb25zdCBERUZBVUxUX1NFVFRJTkdTOiBNQ1BTZXJ2ZXJTZXR0aW5ncyA9IHtcbiAgICBwb3J0OiAzMDAwLFxuICAgIGF1dG9TdGFydDogZmFsc2UsXG4gICAgZW5hYmxlRGVidWdMb2c6IGZhbHNlLFxuICAgIGFsbG93ZWRPcmlnaW5zOiBbJyonXSxcbiAgICBtYXhDb25uZWN0aW9uczogMTBcbn07XG5cbmNvbnN0IERFRkFVTFRfVE9PTF9NQU5BR0VSX1NFVFRJTkdTOiBUb29sTWFuYWdlclNldHRpbmdzID0ge1xuICAgIGNvbmZpZ3VyYXRpb25zOiBbXSxcbiAgICBjdXJyZW50Q29uZmlnSWQ6ICcnLFxuICAgIG1heENvbmZpZ1Nsb3RzOiA1XG59O1xuXG5mdW5jdGlvbiBnZXRTZXR0aW5nc1BhdGgoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gcGF0aC5qb2luKEVkaXRvci5Qcm9qZWN0LnBhdGgsICdzZXR0aW5ncycsICdtY3Atc2VydmVyLmpzb24nKTtcbn1cblxuZnVuY3Rpb24gZ2V0VG9vbE1hbmFnZXJTZXR0aW5nc1BhdGgoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gcGF0aC5qb2luKEVkaXRvci5Qcm9qZWN0LnBhdGgsICdzZXR0aW5ncycsICd0b29sLW1hbmFnZXIuanNvbicpO1xufVxuXG5mdW5jdGlvbiBlbnN1cmVTZXR0aW5nc0RpcigpOiB2b2lkIHtcbiAgICBjb25zdCBzZXR0aW5nc0RpciA9IHBhdGguZGlybmFtZShnZXRTZXR0aW5nc1BhdGgoKSk7XG4gICAgaWYgKCFmcy5leGlzdHNTeW5jKHNldHRpbmdzRGlyKSkge1xuICAgICAgICBmcy5ta2RpclN5bmMoc2V0dGluZ3NEaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRTZXR0aW5ncygpOiBNQ1BTZXJ2ZXJTZXR0aW5ncyB7XG4gICAgdHJ5IHtcbiAgICAgICAgZW5zdXJlU2V0dGluZ3NEaXIoKTtcbiAgICAgICAgY29uc3Qgc2V0dGluZ3NGaWxlID0gZ2V0U2V0dGluZ3NQYXRoKCk7XG4gICAgICAgIGlmIChmcy5leGlzdHNTeW5jKHNldHRpbmdzRmlsZSkpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMoc2V0dGluZ3NGaWxlLCAndXRmOCcpO1xuICAgICAgICAgICAgcmV0dXJuIHsgLi4uREVGQVVMVF9TRVRUSU5HUywgLi4uSlNPTi5wYXJzZShjb250ZW50KSB9O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gcmVhZCBzZXR0aW5nczonLCBlKTtcbiAgICB9XG4gICAgcmV0dXJuIERFRkFVTFRfU0VUVElOR1M7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzYXZlU2V0dGluZ3Moc2V0dGluZ3M6IE1DUFNlcnZlclNldHRpbmdzKTogdm9pZCB7XG4gICAgdHJ5IHtcbiAgICAgICAgZW5zdXJlU2V0dGluZ3NEaXIoKTtcbiAgICAgICAgY29uc3Qgc2V0dGluZ3NGaWxlID0gZ2V0U2V0dGluZ3NQYXRoKCk7XG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMoc2V0dGluZ3NGaWxlLCBKU09OLnN0cmluZ2lmeShzZXR0aW5ncywgbnVsbCwgMikpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIHNhdmUgc2V0dGluZ3M6JywgZSk7XG4gICAgICAgIHRocm93IGU7XG4gICAgfVxufVxuXG4vLyDlt6XlhbfnrqHnkIblmajorr7nva7nm7jlhbPlh73mlbBcbmV4cG9ydCBmdW5jdGlvbiByZWFkVG9vbE1hbmFnZXJTZXR0aW5ncygpOiBUb29sTWFuYWdlclNldHRpbmdzIHtcbiAgICB0cnkge1xuICAgICAgICBlbnN1cmVTZXR0aW5nc0RpcigpO1xuICAgICAgICBjb25zdCBzZXR0aW5nc0ZpbGUgPSBnZXRUb29sTWFuYWdlclNldHRpbmdzUGF0aCgpO1xuICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhzZXR0aW5nc0ZpbGUpKSB7XG4gICAgICAgICAgICBjb25zdCBjb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKHNldHRpbmdzRmlsZSwgJ3V0ZjgnKTtcbiAgICAgICAgICAgIHJldHVybiB7IC4uLkRFRkFVTFRfVE9PTF9NQU5BR0VSX1NFVFRJTkdTLCAuLi5KU09OLnBhcnNlKGNvbnRlbnQpIH07XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byByZWFkIHRvb2wgbWFuYWdlciBzZXR0aW5nczonLCBlKTtcbiAgICB9XG4gICAgcmV0dXJuIERFRkFVTFRfVE9PTF9NQU5BR0VSX1NFVFRJTkdTO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2F2ZVRvb2xNYW5hZ2VyU2V0dGluZ3Moc2V0dGluZ3M6IFRvb2xNYW5hZ2VyU2V0dGluZ3MpOiB2b2lkIHtcbiAgICB0cnkge1xuICAgICAgICBlbnN1cmVTZXR0aW5nc0RpcigpO1xuICAgICAgICBjb25zdCBzZXR0aW5nc0ZpbGUgPSBnZXRUb29sTWFuYWdlclNldHRpbmdzUGF0aCgpO1xuICAgICAgICBmcy53cml0ZUZpbGVTeW5jKHNldHRpbmdzRmlsZSwgSlNPTi5zdHJpbmdpZnkoc2V0dGluZ3MsIG51bGwsIDIpKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBzYXZlIHRvb2wgbWFuYWdlciBzZXR0aW5nczonLCBlKTtcbiAgICAgICAgdGhyb3cgZTtcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleHBvcnRUb29sQ29uZmlndXJhdGlvbihjb25maWc6IFRvb2xDb25maWd1cmF0aW9uKTogc3RyaW5nIHtcbiAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoY29uZmlnLCBudWxsLCAyKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGltcG9ydFRvb2xDb25maWd1cmF0aW9uKGNvbmZpZ0pzb246IHN0cmluZyk6IFRvb2xDb25maWd1cmF0aW9uIHtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCBjb25maWcgPSBKU09OLnBhcnNlKGNvbmZpZ0pzb24pO1xuICAgICAgICAvLyDpqozor4HphY3nva7moLzlvI9cbiAgICAgICAgaWYgKCFjb25maWcuaWQgfHwgIWNvbmZpZy5uYW1lIHx8ICFBcnJheS5pc0FycmF5KGNvbmZpZy50b29scykpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjb25maWd1cmF0aW9uIGZvcm1hdCcpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjb25maWc7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gcGFyc2UgdG9vbCBjb25maWd1cmF0aW9uOicsIGUpO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgSlNPTiBmb3JtYXQgb3IgY29uZmlndXJhdGlvbiBzdHJ1Y3R1cmUnKTtcbiAgICB9XG59XG5cbmV4cG9ydCB7IERFRkFVTFRfU0VUVElOR1MsIERFRkFVTFRfVE9PTF9NQU5BR0VSX1NFVFRJTkdTIH07Il19