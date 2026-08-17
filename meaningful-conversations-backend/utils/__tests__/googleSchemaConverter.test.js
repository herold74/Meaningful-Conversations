const { convertGoogleSchemaToJsonSchema } = require('../googleSchemaConverter.js');
const { transcriptEvaluationPrompts } = require('../../services/geminiPrompts.js');

describe('convertGoogleSchemaToJsonSchema', () => {
  test('maps Google types to JSON Schema types', () => {
    const result = convertGoogleSchemaToJsonSchema({
      type: 'OBJECT',
      properties: {
        summary: { type: 'STRING' },
        overallScore: { type: 'INTEGER' },
        strengths: {
          type: 'ARRAY',
          items: { type: 'STRING' },
        },
      },
      required: ['summary', 'overallScore'],
    });

    expect(result).toEqual({
      type: 'object',
      additionalProperties: false,
      properties: {
        summary: { type: 'string' },
        overallScore: { type: 'integer' },
        strengths: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: ['summary', 'overallScore'],
    });
  });

  test('adds additionalProperties false on nested objects when strict', () => {
    const result = convertGoogleSchemaToJsonSchema({
      type: 'OBJECT',
      properties: {
        goalAlignment: {
          type: 'OBJECT',
          properties: {
            score: { type: 'INTEGER' },
          },
          required: ['score'],
        },
      },
      required: ['goalAlignment'],
    });

    expect(result.properties.goalAlignment).toEqual({
      type: 'object',
      additionalProperties: false,
      properties: {
        score: { type: 'integer' },
      },
      required: ['score'],
    });
  });

  test('converts full transcript evaluation schema without throwing', () => {
    const result = convertGoogleSchemaToJsonSchema(transcriptEvaluationPrompts.schema);
    expect(result.type).toBe('object');
    expect(result.additionalProperties).toBe(false);
    expect(result.properties.summary.type).toBe('string');
    expect(result.properties.botRecommendations.type).toBe('array');
    expect(result.required).toContain('overallScore');
  });
});
