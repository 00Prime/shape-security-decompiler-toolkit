/**
 * Deobfuscator and Tracer Injector
 * 
 * This module provides two modes of operation:
 * 1. Test mode: Process a single VM script file
 * 2. Server mode: Run as HTTP server for on-the-fly deobfuscation
 */

import { Labeler } from './labeler';
import fs from 'fs'
import { parse } from '@babel/parser';
import express from 'express'
import { Tracer } from './tracer';

// Parse command line arguments
const myArgs = process.argv.slice(2);

// TEST MODE: Process a single VM script file
// TEST MODE: Process a single VM script file
if (myArgs[0] == "--test") {
    // Read the raw VM script from input directory
    var ast = parse(fs.readFileSync("./input/raw.js").toString())
    var labeler = new Labeler(ast)
    
    // Step 1: Label and deobfuscate the VM
    var labeled = labeler.labelVirtualMachine()
    fs.writeFileSync('./output/labeled_vm.js', labeled)

    // Step 2: Inject tracer into the labeled VM
    var tracer = new Tracer(parse(labeled))
    
    fs.writeFileSync('./output/injected_vm.js', tracer.injectTracer())
    
    // Legacy code: Opcode handler comparison across VM versions
    // Useful for analyzing how Shape Security updates their VM
    /*
    // fs.writeFileSync('./output/labeled_vm_raw3.js', labeler.labelVirtualMachine())
    var ast2 = parse(fs.readFileSync("./input/raw3.js").toString())
    var labeler2 = new Labeler(ast2)
    fs.writeFileSync('./output/labeled_vm_raw3.js', labeler2.labelVirtualMachine())


    var usedOpcodes = JSON.parse(fs.readFileSync("used_opcodes.json").toString())
    
    var hashes = labeler.getOpcodeHandlerHash()
    var hashes2 = labeler2.getOpcodeHandlerHash()

    var count = 0

    var indexOfFunctionsThatDontMatch: number[] = []
    hashes.forEach((hash, i)=> {
        
        if (usedOpcodes[i]) {
            
            if (!(hashes2.includes(hash))) {
                indexOfFunctionsThatDontMatch.push(i)
            }
        }
    })
    console.log(JSON.stringify(indexOfFunctionsThatDontMatch))
    */
    
    

} else if (myArgs[0] == "--server") {
    // SERVER MODE: HTTP server for on-the-fly deobfuscation
    // Used with mitmproxy for real-time script interception
    const app = express();
    app.use(express.json({limit: '50mb'}));

    const port = 6969; // Port for accepting deobfuscation requests

    // Endpoint: POST / with body containing VM script
    // Returns: Deobfuscated and traced VM script
    app.post("/", ( req, res ) => {

        const ast = parse(req.body.body);

        // Step 1: Label VM components
        var labeler = new Labeler(ast)
        
        var labeled = labeler.labelVirtualMachine()
        
        // Step 2: Inject tracer
        var tracer = new Tracer(parse(labeled))
        res.send(tracer.injectTracer());
    } );

    // Start the Express server
    app.listen( port, () => {
        console.log( `server started at http://localhost:${ port }` );
    } );

}


// Note: Remove unused commented code at the bottom
// let raw = fs.readFileSync("./input/raw.js").toString()
