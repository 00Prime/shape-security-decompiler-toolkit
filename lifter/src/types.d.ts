/**
 * Type Definitions for the Lifter
 * 
 * This file defines the core data structures used throughout the lifting process.
 * These types represent different stages of the transformation from bytecode traces
 * to JavaScript AST.
 */

/**
 * Supported instruction types in the VM bytecode.
 * These represent the micro-operations that the lifter can recognize and convert.
 */
export type Instruction = "IF_ELSE_BRANCH" | "ELSE_BRANCH" | "IF_BRANCH" | "PUSH" | "SET" | "DEFINE_PROPERTY" | "SET_GLOBAL_EMPTY_OBJECT" | "SAVE_CALL_FUNCTION" | "JMP" | "SAVE_BINARY_EXPRESSION" | "SAVE_MEMBER_EXPRESSION" | "SAVE_NUMBER"

/**
 * A trace of a single function's execution.
 * Contains all opcodes executed for that function.
 */
export type FunctionTrace = Opcode[]

/**
 * Represents an argument to a micro-operation.
 * Can have nested arguments for complex operations.
 */
export interface Argument {
    type: any           // Type identifier for the argument
    value?: any         // Literal value (for constants)
    args?: any          // Nested arguments (for complex expressions)
}

/**
 * A micro-operation within an opcode.
 * Micro-ops are the atomic operations that the VM performs.
 */
export interface MicroOp {
    instruction: Instruction    // The type of operation
    args: Argument[]            // Arguments to the operation
}

/**
 * A single opcode from the VM execution.
 * Contains the bytecode offset and all micro-operations executed.
 */
export interface Opcode {
    offset: number              // Bytecode offset (program counter value)
    opcode: number              // The opcode number
    microOps: MicroOp[]         // Micro-operations executed for this opcode
}

/**
 * A micro-opcode with its bytecode offset.
 * Used during IR generation to maintain position information.
 */
export interface LabeledMicroOpcode {
    offset: number,             // Bytecode offset
    microOp: MicroOp            // The micro-operation
}

/**
 * Execution context during JavaScript lifting.
 * Tracks the current scope and variable state.
 */
export interface Context {
    label: string               // Context label (function name, etc.)

    stack: Map<number, boolean>      // Tracks which stack slots are initialized
    registers: Map<number, boolean>  // Tracks which registers are initialized
    parentBody: babel.types.Statement[]   // Parent AST body

    statements: babel.types.Statement[]   // Current statement list
}

/**
 * A basic block in the intermediate representation.
 * Represents a sequence of operations between control flow changes.
 */
export interface Block {
    opcodes: LabeledMicroOpcode[]   // Operations in this block
    isDeadBlock: boolean            // Whether this block is unreachable


}

/**
 * The complete intermediate representation of the program.
 * Contains all functions lifted from the execution traces.
 */
export interface IntermediateRepresentation {
    functions: Map<string, FunctionRepresentation>
}

/**
 * Representation of a single function in the IR.
 * Contains all basic blocks that make up the function.
 */
export interface FunctionRepresentation {
    
    blocks: Map<string, Block>      // Map of block ID to block data
    

}