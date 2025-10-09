import { Block, CodeGenerator, common, Field, Toolbox } from "blockly";

/**
 * @typedef {object} Category
 * @property {string} name The name of the category.
 * @property {string} color CSS color for the category.
 * @property {Entry[]} entries The entries in the category.
 */

/**
 * @typedef {object} Entry
 * @property {string} name The name of the entry.
 * @property {string} description Description of the entry.
 * @property {BlocklyField[]} blocklyTemplate The template used to make the blockly block.
 * @property {BlocklyIOConnection?} blocklyInput The input connection for the block.
 * @property {BlocklyIOConnection?} blocklyOutput The output connection for the block.
 * @property {CodeGenFunction} codeGenerator The code generator function used by blockly.
 */

/**
 * @callback FieldFunction
 * @returns {Field} The blockly field object.
 */

/**
 * @typedef {object} BlocklyField
 * @property {string?} name The name of the field.
 * @property {FieldFunction?} field Function that generates the blockly field object.
 * @property {string?} text Text displayed in place of the field.
 */

/**
 * @typedef {object} BlocklyIOConnection
 * @property {BlocklyType} type The type of the connection.
 * @property {string} name The name of the connection.
 */

// TODO: define vocab objects

/**
 * @enum {string}
 */
const BlocklyType = {
  bool: "Boolean",
  // TODO: Add other types
};

/**
 * @callback CodeGenFunction
 * @param {Block} block The blockly block.
 * @returns {string} The generated code.
 */

/**
 * Processes a collection of categories to produce a blockly toolbox and a
 * function vocabulary.
 * @param {Category[]} categories The categories from which everything is built.
 * @param {CodeGenerator} generator The blockly code generator.
 * @returns {{toolbox: Toolbox, vocab: Vocabulary}} The generated structures.
 */
export function processJengaTower(categories, generator) {
  const blocklyCategories = [];

  for (const category of categories) {
    // TODO: add vocab functions
    const blocklyCategory = initBlocklyCategory(category);
    blocklyCategories.push(blocklyCategory);

    for (const entry of category.entries) {
      const blocklyBlock = initBlocklyBlock(entry, category, generator);
      blocklyCategory.contents.push(blocklyBlock);
    }
  }

  const toolbox = initBlocklyToolbox(blocklyCategories);

  return { toolbox: toolbox, vocab: null };
}

/**
 * @param {Category} category The category.
 * @returns {{kind: string, name: string, colour: string, contents: object[]}} The blockly category.
 */
function initBlocklyCategory(category) {
  return {
    kind: "category",
    name: category.name,
    colour: category.color || "#000000",
    contents: [],
  };
}

/**
 * @param {Entry} entry The entry.
 * @param {Category} category The category that contains the entry.
 * @param {CodeGenerator} generator The blockly code generator.
 * @returns {{kind: string, type: string}} The blockly category entry.
 */
function initBlocklyBlock(entry, category, generator) {
  const blockDefinition = {
    init: function () {
      const inputConn = entry.blocklyInput;
      const rootInput = !inputConn
        ? this.appendDummyInput("dummyInput")
        : this.appendValueInput(inputConn.name).setCheck(inputConn.type);

      for (const field of entry.blocklyTemplate) {
        if (field.text) {
          // Plain text
          rootInput.appendField(field.text);
        } else {
          // Additional user input
          rootInput.appendField(field.field(), field.name);
        }
      }

      const outputConn = entry.blocklyOutput;
      if (!outputConn) {
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
      } else {
        this.setOutput(true, outputConn.type);
      }

      this.setTooltip(entry.description || "");
      this.setHelpUrl("");
      this.setColour(category.color);
    },
  };

  // Define the block globally
  common.defineBlocks({ [entry.name]: blockDefinition });
  // Add a generator function for the block
  generator.forBlock[entry.name] = entry.codeGenerator;

  return {
    kind: "block",
    type: entry.name,
  };
}

/**
 * @param {object[]} blocklyCategories The blockly categories to add to the toolbox.
 * @returns {{kind: string, contents: object[]}} The blockly toolbox.
 */
function initBlocklyToolbox(blocklyCategories) {
  // TODO: filter default categories
  const defaultCategories = [
    {
      kind: "category",
      name: "Flow",
      colour: "#e9a719",
      contents: [
        {
          kind: "block",
          type: "controls_if",
        },
        {
          kind: "block",
          type: "logic_compare",
        },
        {
          kind: "block",
          type: "logic_operation",
        },
        {
          kind: "block",
          type: "logic_negate",
        },
        {
          kind: "block",
          type: "logic_boolean",
        },
        {
          kind: "block",
          type: "controls_repeat_ext",
          inputs: {
            TIMES: {
              block: {
                type: "math_number",
                fields: {
                  NUM: 10,
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "controls_whileUntil",
        },
      ],
    },
    {
      kind: "category",
      name: "Math",
      colour: "#cc44cc",
      contents: [
        {
          kind: "block",
          type: "math_number",
          fields: {
            NUM: 123,
          },
        },
        {
          kind: "block",
          type: "math_arithmetic",
        },
      ],
    },
  ];

  return {
    kind: "categoryToolbox",
    contents: blocklyCategories.concat(defaultCategories),
  };
}
