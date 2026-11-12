/**
 * Converts Google GenAI response schemas (OBJECT/STRING/INTEGER…) to standard JSON Schema
 * for Mistral's response_format json_schema mode.
 */

const GOOGLE_TYPE_MAP = {
  OBJECT: 'object',
  STRING: 'string',
  INTEGER: 'integer',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  ARRAY: 'array',
};

/**
 * @param {object} googleSchema - Google GenAI schema node
 * @param {{ strict?: boolean }} options
 * @returns {object} JSON Schema object
 */
function convertGoogleSchemaToJsonSchema(googleSchema, { strict = true } = {}) {
  if (!googleSchema || typeof googleSchema !== 'object') {
    return strict
      ? { type: 'object', additionalProperties: false }
      : { type: 'object' };
  }

  function convert(node) {
    if (!node || typeof node !== 'object' || Array.isArray(node)) {
      return node;
    }

    const result = {};

    if (node.type) {
      const mapped = GOOGLE_TYPE_MAP[node.type];
      result.type = mapped || String(node.type).toLowerCase();
    }

    if (node.description) {
      result.description = node.description;
    }

    if (node.enum) {
      result.enum = node.enum;
    }

    if (node.properties && typeof node.properties === 'object') {
      result.properties = {};
      for (const [key, value] of Object.entries(node.properties)) {
        result.properties[key] = convert(value);
      }
    }

    if (node.items) {
      result.items = convert(node.items);
    }

    if (Array.isArray(node.required)) {
      result.required = node.required;
    }

    if (result.type === 'object' && strict) {
      result.additionalProperties = false;
    }

    return result;
  }

  return convert(googleSchema);
}

module.exports = { convertGoogleSchemaToJsonSchema, GOOGLE_TYPE_MAP };
