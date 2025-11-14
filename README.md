## Shape Security Decompiler Tool-Kit

This toolkit is capable of dynamically deobfuscating all versions of Shape Security's virtual machine interpreter script and injecting a custom tracer that is capable of tracing all opcodes that are executed in the virtual machine script. It also has a custom lifter that will lift these traces into JavaScript.

## Table of Contents

- [What is JavaScript Virtualization Obfuscation?](#what-is-javascript-virtualization-obfuscation)
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
- [Quick Start Guide](#quick-start-guide)
- [Limitations](#limitations)
- [Contributing](#contributing)

## What is JavaScript Virtualization Obfuscation?

JavaScript virtualization obfuscation is an advanced obfuscation technique that requires defenders to create a full virtual machine in JavaScript along with a custom compiler that is capable of compiling JavaScript into bytecode that this virtual machine can understand. 

**Key characteristics:**
- The original source code is **never restored** at any point during VM execution
- Requires reverse engineers to first understand the heavily obfuscated virtual machine
- Provides strong protection against static analysis and basic deobfuscation attempts

## Overview

Shape Security implements a **custom stack-based CISC virtual machine** in JavaScript with a **rotating instruction set** that executes custom bytecode. They do this to protect source code executed on the browser side.

**Important Notes:**
- The virtualized code itself was obfuscated **before** virtualization to add another layer of protection
- This toolkit focuses on the reverse engineering process and creating a lifter for the bytecode
- Instead of targeting full instructions, this approach targets **micro-instructions** that are consistent across all versions

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14.0.0 or higher recommended)
- **npm** (comes with Node.js)
- **Python 3.x** (for mitmproxy script)
- **mitmproxy** (for intercepting and rewriting scripts)
- **TypeScript** compiler (installed via npm)

### Installing Prerequisites

```bash
# Check Node.js version
node --version

# Install mitmproxy (macOS)
brew install mitmproxy

# Install mitmproxy (Linux)
pip3 install mitmproxy

# Install mitmproxy (Windows)
# Download from https://mitmproxy.org/
```

## Installation

1. **Clone the repository:**
```bash
git clone https://github.com/00Prime/shape-security-decompiler-toolkit.git
cd shape-security-decompiler-toolkit
```

2. **Install deobfuscator dependencies:**
```bash
cd deobfuscator
npm install
cd ..
```

3. **Install lifter dependencies:**
```bash
cd lifter
npm install
cd ..
```

## Project Structure

```
shape-security-decompiler-toolkit/
├── deobfuscator/           # Deobfuscates VM script and injects tracer
│   ├── src/
│   │   ├── index.ts        # Main entry point with CLI and server modes
│   │   ├── labeler.ts      # Labels VM components and removes obfuscation
│   │   └── tracer.ts       # Injects tracing code into the VM
│   ├── input/              # Place raw VM scripts here
│   ├── output/             # Deobfuscated and traced output
│   └── rewrite.py          # mitmproxy script for on-the-fly rewriting
│
├── lifter/                 # Lifts traced bytecode to JavaScript
│   ├── src/
│   │   ├── index.ts        # Main entry point
│   │   ├── ir.ts           # Intermediate representation lifter
│   │   ├── lifter.ts       # JavaScript AST lifter
│   │   ├── cleaner.ts      # Beautifies and cleans output
│   │   ├── traverser.ts    # Bytecode trace traverser
│   │   └── types.d.ts      # TypeScript type definitions
│   ├── input/              # Place vm_call_stack.json here
│   └── output/             # Lifted JavaScript output
│
└── README.md               # This file
```

## How It Works

### Phase 1: Deobfuscation and Tracing

The **deobfuscator** component performs the following steps:

1. **Labeling (`labeler.ts`):**
   - Identifies and labels VM components (registers, stack, program counter, etc.)
   - Removes proxy object definitions
   - Reduces proxy identifier calls
   - Makes the VM structure readable

2. **Tracing (`tracer.ts`):**
   - Injects custom tracing code into the labeled VM
   - Tracks all executed opcodes
   - Records function calls, branches, and stack operations
   - Saves execution traces every 30 seconds as JSON
   - Preserves all function versions to minimize data loss

**Output:** A modified VM script that generates comprehensive execution traces (400+ MB)

### Phase 2: Lifting to JavaScript

The **lifter** component processes execution traces:

1. **Intermediate Representation (`ir.ts`):**
   - Converts bytecode traces into an intermediate representation
   - Identifies basic blocks based on jump instructions
   - Builds a control flow graph

2. **JavaScript Lifting (`lifter.ts`):**
   - Translates IR into JavaScript AST
   - Reconstructs control flow (if/else statements)
   - Generates function structures

3. **Cleaning (`cleaner.ts`):**
   - Beautifies the generated JavaScript
   - Removes redundant code
   - Improves readability

**Output:** Readable JavaScript that represents the original virtualized code

## Quick Start Guide

### Step 1: Test the Deobfuscator

```bash
cd deobfuscator

# Place your raw VM script in input/raw.js
# Then run the test mode
npm test

# Check output/labeled_vm.js and output/injected_vm.js
```

### Step 2: Run as Server with mitmproxy

```bash
# Terminal 1: Start mitmproxy
mitmproxy -s rewrite.py

# Terminal 2: Start deobfuscator server
cd deobfuscator
npm start

# The server listens on port 6969
# mitmproxy will intercept VM scripts and send them to the server
# The server returns deobfuscated versions
```

### Step 3: Collect Execution Traces

1. Configure your browser to use mitmproxy as a proxy
2. Visit the target website
3. The modified VM will execute and save traces to JSON files
4. Wait for execution to complete (traces are saved every 30s)

### Step 4: Lift Traces to JavaScript

```bash
cd lifter

# Place vm_call_stack.json in input/
npm start

# Check output/cleaned.js for the lifted JavaScript
```

## Limitations

### Current Limitations

1. **Self-Defending Code Risk:**
   - Since the deobfuscator directly edits the VM script, there's a risk of triggering tamper checks
   - Output may contain code from fake execution paths
   - However, the tracer logs all conditionals, so tamper checks should be visible in traces

2. **Function Call Arguments:**
   - Argument reconstruction is not fully accurate
   - May require manual review and correction

3. **Loop Detection:**
   - While loops are not explicitly created in the output
   - Their behavior is represented through block calls
   - May require manual restructuring for readability

4. **Trace Size:**
   - Execution traces can exceed 400 MB
   - Requires significant disk space and memory for processing
   - The lifter runs with increased memory: `--max_old_space_size=4096`

### Known Issues

- Version-specific edge cases may require adjustments to the labeler
- Complex control flow may not lift perfectly
- Some obfuscated variable names may persist in the output

## Contributing

Contributions are welcome! This project was created as a reverse engineering research tool. If you find issues or have improvements:

1. Fork the repository
2. Create a feature branch
3. Make your changes with clear commit messages
4. Submit a pull request with a description of your changes

## License

ISC License - See individual package.json files for details

## Acknowledgments

This toolkit is for educational and research purposes. It demonstrates advanced reverse engineering techniques for understanding JavaScript virtualization obfuscation.
