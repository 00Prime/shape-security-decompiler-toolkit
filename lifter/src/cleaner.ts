/**
 * JavaScript Beautifier (Cleaner)
 * 
 * This class post-processes the lifted JavaScript AST to make it more readable.
 * It performs various optimization and cleaning operations:
 * - Removes empty block functions
 * - Redirects function calls to skip unnecessary blocks
 * - Simplifies control flow
 * - Improves overall code structure
 * 
 * The goal is to transform the raw lifted code into something closer
 * to human-written JavaScript.
 */

import traverse from "@babel/traverse";
import fs from "fs";
import * as babel from "@babel/core";
import generate from "@babel/generator";
import { BlockStatementTraverser } from "./traverser";

/**
 * Represents a block item during traversal
 */
interface Item {
  node: babel.types.BlockStatement
  path: babel.NodePath<babel.types.FunctionDeclaration>
}

export class JavascriptBeautifier {
  ast: babel.types.File;
  variableMap: Map<string, babel.types.Expression>;
  blockNodes: Map<string, babel.types.FunctionDeclaration>;

  constructor(ast: babel.types.File) {
    this.ast = ast;
    this.variableMap = new Map<string, babel.types.Expression>();
    this.blockNodes = new Map<string, babel.types.FunctionDeclaration>();
  }

  /**
   * Checks if a function name represents a parent (top-level) function.
   * Parent functions are named with the pattern "fn_*"
   * 
   * @param name - The function name to check
   * @returns True if this is a parent function
   */
  private isParentFunction(name: string) {
    return name.includes("fn_");
  }
  
  /**
   * Traverses all parent functions and their nested block functions.
   * Collects block nodes and applies reduction transformations.
   */
  /**
   * Traverses all parent functions and their nested block functions.
   * Collects block nodes and applies reduction transformations.
   */
  private traverseParentFunctions() {
  

    traverse(this.ast, {
      FunctionDeclaration: (path) => {
        if (path.node.id && this.isParentFunction(path.node.id.name)) {
          // First, collect all block function declarations
          path.traverse({
            FunctionDeclaration: (path) => {
              if (path.node.id) {
                this.blockNodes.set(path.node.id.name, path.node);
              }
            },
          });
          
          // Then, apply reduction transformations to simplify the blocks
          const traverser = new BlockStatementTraverser(this.blockNodes, new Map(this.variableMap), [])
          traverser.reduceBlockStatement(path.node.body, path);
        
          
        }
      },
    });
   

  }
  
  /**
   * Removes empty block functions that only call another block.
   * These are redundant and can be eliminated by redirecting calls.
   * 
   * For example, if block_A only calls block_B, all calls to block_A
   * are redirected to block_B and block_A is removed.
   */
  /**
   * Removes empty block functions that only call another block.
   * These are redundant and can be eliminated by redirecting calls.
   * 
   * For example, if block_A only calls block_B, all calls to block_A
   * are redirected to block_B and block_A is removed.
   */
  private removeEmptyBlocks() {
    
    traverse(this.ast, {
      FunctionDeclaration: (path) => {
        if (path.node.id && this.isParentFunction(path.node.id.name)) {
          const redirectMap: Map<string, string> = new Map<string, string>()

          // Find all blocks that only call another block
          path.traverse({
            FunctionDeclaration: (path) => {
              if (path.node.id && path.node.body.body.length == 1) {
                const node = path.node.body.body[0]
                if (node.type == "ExpressionStatement" &&
                    node.expression.type == "CallExpression" &&
                    node.expression.callee.type == "Identifier" &&
                    node.expression.callee.name.includes("block_")) {
                    
                    // Record the redirection: this block -> target block
                    redirectMap.set(path.node.id.name, node.expression.callee.name)

                    // Remove this empty block function
                    path.remove()
                    path.skip()
                }
              }
            },
          });
          
          // Update all calls to use the redirect map
          path.traverse({
            CallExpression: (path) => {
              if (path.node.callee.type == "Identifier" && redirectMap.has(path.node.callee.name)) {
                const redirectedPath = redirectMap.get(path.node.callee.name)
                if (redirectedPath) {
                  path.replaceWith(babel.types.callExpression(babel.types.identifier(redirectedPath), []))
                }
               
              }
            }
          })
        
          
        }
      },
    });
    
  }

  /**
   * Main entry point for cleaning the AST.
   * Applies all cleaning transformations in sequence.
   * 
   * @returns The cleaned JavaScript code as a string
   */
  clean(): string {
    this.traverseParentFunctions();
    this.removeEmptyBlocks();
    return generate(this.ast).code
  }
}
