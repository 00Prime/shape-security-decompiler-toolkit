## Deobfuscator and Tracer Injector

This component is the **deobfuscator** for Shape Security's virtual machine interpreter script. It removes all obfuscations from their VM and injects a custom tracer to capture bytecode execution.

## Table of Contents

- [Features](#features)
- [How It Works](#how-it-works)
- [Installation](#installation)
- [Usage Modes](#usage-modes)
- [Configuration](#configuration)
- [Output Files](#output-files)
- [Troubleshooting](#troubleshooting)

## Features

### Deobfuscation Capabilities

- **Removes Proxy Object Definitions** - Eliminates proxy-based obfuscation patterns
- **Labels VM Components** - Identifies and names:
  - Virtual machine registers
  - Stack operations
  - Program counter
  - Opcode handlers
  - Bytecode arrays
- **Reduces Proxy Identifier Calls** - Simplifies obfuscated property access
- **Version Agnostic** - Works across all versions of Shape's VM

### Tracing Capabilities

- **Opcode Execution Tracking** - Logs every important operation executed in the VM
- **Function Version Preservation** - Saves all function variations to prevent data loss
- **Branch Recording** - Tracks all conditional branches taken during execution
- **Automatic Persistence** - Saves traces to JSON every 30 seconds
- **Comprehensive Coverage** - Captures:
  - Stack operations (push, pop, slice)
  - Function calls and returns
  - Control flow (jumps, conditionals)
  - Variable assignments
  - Object property access

## How It Works

### Phase 1: Labeling (`labeler.ts`)

The labeler performs several transformations on the obfuscated VM script:

1. **Identifies the VM Environment:**
   - Locates the main VM execution function
   - Finds the bytecode array
   - Identifies register arrays and stack structures

2. **Removes Obfuscation:**
   - Strips proxy object wrappers
   - Resolves proxy property accesses
   - Replaces obfuscated names with meaningful labels

3. **Labels Components:**
   ```javascript
   // Before:
   var a = b[c[d++]];
   
   // After:
   var vmContext.stack = vmContext.registers[vmContext.programCounter++];
   ```

### Phase 2: Tracing (`tracer.ts`)

The tracer injects monitoring code that:

1. **Intercepts Stack Operations:**
   - Logs all push/pop operations
   - Records stack slicing for function arguments

2. **Tracks Control Flow:**
   - Captures jump destinations
   - Records conditional branch outcomes

3. **Monitors Function Calls:**
   - Logs new function creation from bytecode
   - Tracks function invocations

4. **Persists Data:**
   - Saves execution traces periodically
   - Generates structured JSON output

## Installation

```bash
# Navigate to deobfuscator directory
cd deobfuscator

# Install dependencies
npm install

# Build TypeScript files
npm run build
```

## Usage Modes

### Mode 1: Test Mode (Single File)

Process a single VM script file for testing:

```bash
# Place your VM script in input/raw.js
npm test
```

This will:
1. Read `input/raw.js`
2. Generate `output/labeled_vm.js` (deobfuscated VM)
3. Generate `output/injected_vm.js` (VM with tracer)

**Programmatic Usage:**

```javascript
import { Labeler } from './labeler';
import { Tracer } from './tracer';
import { parse } from '@babel/parser';
import fs from 'fs';

// Step 1: Parse the VM script
const ast = parse(fs.readFileSync("./input/raw.js").toString());

// Step 2: Label VM components
const labeler = new Labeler(ast);
const labeled = labeler.labelVirtualMachine();
fs.writeFileSync('./output/labeled_vm.js', labeled);

// Step 3: Inject tracer
const tracer = new Tracer(parse(labeled));
const injected = tracer.injectTracer();
fs.writeFileSync('./output/injected_vm.js', injected);
```

### Mode 2: Server Mode (Production)

Run as a server for on-the-fly deobfuscation with mitmproxy:

```bash
# Terminal 1: Start the deobfuscator server
npm start

# Terminal 2: Start mitmproxy with the rewrite script
mitmproxy -s rewrite.py
```

**Server Details:**
- **Port:** 6969
- **Endpoint:** POST `/`
- **Request Body:** `{ "body": "/* VM script code */" }`
- **Response:** Deobfuscated and traced VM script

**mitmproxy Integration:**

The `rewrite.py` script intercepts HTTP responses containing VM scripts and:
1. Extracts the VM script from the response
2. Sends it to the deobfuscator server
3. Replaces the original script with the traced version
4. Returns the modified response to the browser

**Setup Steps:**

1. **Configure Browser Proxy:**
   ```
   Proxy: localhost:8080
   ```

2. **Start Services:**
   ```bash
   # Start mitmproxy
   mitmproxy -s rewrite.py
   
   # In another terminal
   cd deobfuscator
   npm start
   ```

3. **Visit Target Site:**
   - Browse to the website using Shape Security
   - The VM script will be automatically intercepted and modified
   - Execution traces will be saved to the output directory

## Configuration

### Adjusting Trace Save Interval

The tracer saves data every 30 seconds by default. To change this, modify the injected code in `tracer.ts`:

```typescript
// Look for setInterval in the tracer injection code
// Default: 30000ms (30 seconds)
setInterval(() => { /* save logic */ }, 30000);
```

### Memory Settings

For large VM scripts, you may need to increase Node.js memory:

```bash
node --max_old_space_size=4096 dist/index.js --server
```

## Output Files

### `output/labeled_vm.js`

The deobfuscated VM script with meaningful labels:
- Human-readable variable names
- Identified VM structures
- Removed proxy obfuscation
- **Use case:** Understanding the VM structure

### `output/injected_vm.js`

The labeled VM with tracer code injected:
- All monitoring code inserted
- Ready for execution
- **Use case:** Deploy this to collect execution traces

### Execution Traces (Generated at Runtime)

**File:** `vm_call_stack.json` (or similar, saved during execution)

**Size:** 400+ MB (contains complete execution history)

**Structure:**
```json
{
  "function_43518_9": [
    {
      "blockId": "104153_5",
      "operations": [
        { "type": "stackPush", "value": "..." },
        { "type": "jump", "destination": "43525_3" }
      ]
    }
  ]
}
```

**Contents:**
- All executed functions (by ID)
- All basic blocks visited
- Complete operation traces
- Branch decisions
- Stack states

## Troubleshooting

### Issue: "Cannot find module '@babel/parser'"

**Solution:**
```bash
cd deobfuscator
npm install
```

### Issue: "Port 6969 already in use"

**Solution:**
```bash
# Find and kill the process using the port
lsof -ti:6969 | xargs kill -9

# Or change the port in src/index.ts
```

### Issue: "Out of memory" error

**Solution:**
```bash
# Increase Node.js heap size
node --max_old_space_size=8192 dist/index.js --server
```

### Issue: "No output generated"

**Checklist:**
1. Ensure `input/raw.js` exists and contains valid JavaScript
2. Check for syntax errors in the VM script
3. Verify TypeScript compilation succeeded (`npm test` shows no errors)
4. Check file permissions on the output directory

### Issue: "Tracer not logging execution"

**Possible Causes:**
1. The injected VM script isn't actually executing
2. Browser security policies preventing execution
3. VM script has tamper detection

**Debug Steps:**
1. Check browser console for JavaScript errors
2. Verify the injected script is being loaded (Network tab)
3. Add console.log statements to the tracer code

### Issue: "mitmproxy not intercepting traffic"

**Solution:**
1. Verify browser proxy settings (localhost:8080)
2. Install mitmproxy certificate in browser
3. Check that rewrite.py is loaded (`mitmproxy -s rewrite.py`)
4. Ensure the deobfuscator server is running

## Advanced Usage

### Comparing Multiple VM Versions

The code includes commented-out logic for comparing opcode handlers across versions:

```javascript
// Useful for identifying changes between VM versions
// See index.ts for the comparison implementation
```

### Custom Opcode Analysis

To analyze specific opcodes:

1. Modify the tracer to filter specific operation types
2. Adjust the JSON output format
3. Post-process traces with custom scripts

## Output Example

![Example of the labeled output](https://i.imgur.com/E0Un6R4.png)

The image shows how the deobfuscator transforms obfuscated code into readable, labeled VM components.
