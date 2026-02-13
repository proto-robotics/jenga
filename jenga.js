import { Block, CodeGenerator, common, Field, Toolbox, FieldImage, utils } from "blockly";

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
 * @property {BlocklyIOConnection?} blocklyOutput The output connection for the block.
 * @property {boolean} inputsInline Whether the inputs are inline. Optional parameter only used in backend.
 * @property {function(?): object} save Function that saves extra state for the block. Optional parameter only used in backend.
 * @property {function(object): void} load Function that loads extra state for the block. Optional parameter only used in backend.
 * @property {function(): void} update Function that updates the block shape based on state. Optional parameter only used in backend.
 * @property {function(object): void} saveConnections Function that saves connections for the block. Optional parameter only used in backend.
 * @property {function(object): object} compose Function that composes the block from saved connections. Optional parameter only used in backend.
 * @property {function(object): object} decompose Function that decomposes the block to save connections. Optional parameter only used in backend.
 * @property {function(object): void} onchange Function that handles block changes. Optional parameter
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
 * @property {BlocklyIOConnection?} blocklyInput The input connection displayed in place of the field.
 */

/**
 * @typedef {object} BlocklyIOConnection
 * @property {BlocklyType} type The type of the connection.
 * @property {string} name The name of the connection.
 * @property {string?} shadow The name of the optional shadow block to use for this connection. Only used for block inputs.
 */

// TODO: define vocab objects

/**
 * @enum {string}
 */
const BlocklyType = {
  bool: "Boolean",
  number: "Number",
  string: "String",
  any: "Any",
  void: "Void",
  array: "Array",
  color: "Colour",
};

/**
 * @callback CodeGenFunction
 * @param {Block} block The blockly block.
 * @param {CodeGenerator | undefined} generator The blockly generator.
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
      let rootInput = null;

      for (const field of entry.blocklyTemplate) {
        if (field.text) {
          if (!rootInput) {
            rootInput = this.appendDummyInput()
          }
          //split text by \n
          //create a new dummy input for every new line
          //then add the text as a field
          const cleanText = field.text.split("\n")
          for (let i = 0; i < cleanText.length; i++) {
            rootInput.appendField(cleanText[i]);

            if (i != cleanText.length - 1) {
              rootInput = this.appendDummyInput()
            }
          }
        } else if (field.field) {
          if (!rootInput) {
            rootInput = this.appendDummyInput()
          }
          // Additional user input
          rootInput.appendField(field.field(), field.name);
        } else if (field.blocklyInput) {
          if (field.blocklyInput.type === "Any" || field.blocklyInput.type == null){
            rootInput = this.appendValueInput(field.blocklyInput.name)
            if (field.blocklyInput.shadow) {
              const shadowXml = utils.xml.textToDom(`
              <shadow type="${field.blocklyInput.shadow}">
              </shadow>
              `);
              rootInput.connection.setShadowDom(shadowXml);
            }
              
            rootInput = this.appendDummyInput() //needed to make sure next inputs go to after this one otheriwise they get added in front of this input
          } else if (field.blocklyInput.type === "Void") {
            rootInput = this.appendStatementInput(field.blocklyInput.name)
            if (field.blocklyInput.shadow) {
              const shadowXml = utils.xml.textToDom(`
              <shadow type="${field.blocklyInput.shadow}">
              </shadow>
              `);
              rootInput.connection.setShadowDom(shadowXml);
            }
          } else {
            rootInput = this.appendValueInput(field.blocklyInput.name).setCheck(field.blocklyInput.type || null)
            if (field.blocklyInput.shadow) {
              const shadowXml = utils.xml.textToDom(`
              <shadow type="${field.blocklyInput.shadow}">
              </shadow>
              `);
              rootInput.connection.setShadowDom(shadowXml);
            }
            rootInput = this.appendDummyInput() //needed to make sure next inputs go to after this one otheriwise they get added in front of this input
          }
        } else {
          console.error("unknown field type: ", field);
        }
      }

      this.setInputsInline(entry.inputsInline);

      const outputConn = entry.blocklyOutput;
      if (!outputConn) {
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
      } else {
        this.setOutput(true, outputConn.type);
      }

      //TODO: figure out where to put this since every block will have the help button
      rootInput.appendField(new FieldImage("./images/help.svg", 15, 15, "Info", () => console.log("Clicked!" + entry.name)), "info_icon");

      this.setTooltip(entry.description || "");
      this.setHelpUrl("");
      this.setColour(category.color);
    },

    saveExtraState: entry.save, //used for saving extra state
		loadExtraState: entry.load, //used for loading extra state
		updateShape_: entry.update, //used for updating shape based on state
    saveConnections: entry.saveConnections, //used for saving connections
    compose: entry.compose, //used for composing block from saved connections
    decompose: entry.decompose, //used for decomposing block to save connections
    onchange: entry.onchange, //used for handling block changes
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
  return {
    kind: "categoryToolbox",
    contents: blocklyCategories,
  };
}
