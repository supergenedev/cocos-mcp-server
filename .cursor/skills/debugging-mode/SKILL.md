---
name: debugging-mode
description: Provides critical environment constraints and guidelines for debugging this Cocos Creator extension running in Electron with Node.js v14.16.0. Use when debugging, working with logs, making HTTP requests, handling errors, or when the user mentions debug, debugging, fetch API, npm packages, absolute paths, or Node.js v14 limitations.
---

# ⚠️ Debugging Mode Guide

This project runs as an Electron app extension with specific environment constraints.

## Environment Constraints

### Node.js Version
- **Node Version**: v14.16.0
- This is an older version, so modern features are not available.

### Unavailable Features

#### 1. fetch API is Prohibited
Node.js v14.16.0 does not have built-in `fetch`.

```typescript
// ❌ BAD - fetch is not available
const response = await fetch('https://api.example.com');

// ✅ GOOD - Use Node.js built-in modules
import * as https from 'https';
import * as http from 'http';
// or
const https = require('https');
```

#### 2. No Additional Package Downloads
Additional npm packages cannot be installed in the extension environment. Only Node.js built-in modules should be used.

```typescript
// ❌ BAD - External packages not available
import axios from 'axios';
import node-fetch from 'node-fetch';

// ✅ GOOD - Use Node.js built-in modules only
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import * as https from 'https';
```

## Logging Guide

### Log Path Configuration
Log file paths must be set as **absolute paths**.

```typescript
// ❌ BAD - Using relative paths
const logPath = './logs/debug.log';
const logPath = '../logs/debug.log';

// ✅ GOOD - Using absolute paths
import * as path from 'path';
import * as os from 'os';

const logPath = path.join(os.homedir(), '.cocos-mcp-server', 'debug.log');
// or
const logPath = '/Users/username/.cocos-mcp-server/debug.log';
```

### Logging Example

```typescript
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

function writeLog(message: string): void {
  const logDir = path.join(os.homedir(), '.cocos-mcp-server');
  const logPath = path.join(logDir, 'debug.log');

  // Create directory if it doesn't exist
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;

  fs.appendFileSync(logPath, logMessage, 'utf8');
}
```

## Debugging Checklist

Verify the following when writing code:

- [ ] Are you avoiding the `fetch` API?
- [ ] Are you not importing external npm packages?
- [ ] Is the log path set as an absolute path?
- [ ] Are you using only features supported by Node.js v14.16.0?

## Available Node.js Built-in Modules

The following modules can be freely used:

- `fs` - File system operations
- `path` - Path handling
- `os` - Operating system information
- `http` / `https` - HTTP requests (instead of fetch)
- `util` - Utility functions
- `events` - Event handling
- `stream` - Stream processing
