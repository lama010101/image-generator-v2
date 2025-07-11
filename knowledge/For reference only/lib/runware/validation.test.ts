
import { describe, it, expect } from 'vitest';
import { buildPositivePrompt, validateBaseModel, AIR_REGEX, buildRunwareRequestPayload } from './validation';

describe('Runware validation utilities', () => {
  describe('buildPositivePrompt', () => {
    it('handles valid input string', () => {
      const result = buildPositivePrompt('A beautiful sunset');
      expect(result).toBe('A beautiful sunset');
    });

    it('rejects empty string', () => {
      expect(() => buildPositivePrompt('')).toThrow('Prompt must be at least 2 characters long');
    });

    it('rejects whitespace-only string', () => {
      expect(() => buildPositivePrompt('  ')).toThrow('Prompt must be at least 2 characters long');
    });

    it('trims whitespace', () => {
      const result = buildPositivePrompt('  Hello world  ');
      expect(result).toBe('Hello world');
    });

    it('handles non-string input', () => {
      const result = buildPositivePrompt(123);
      expect(result).toBe('123');
    });

    it('truncates long input', () => {
      const longInput = 'a'.repeat(4000);
      const result = buildPositivePrompt(longInput);
      expect(result.length).toBe(3000);
    });

    it('handles null or undefined input', () => {
      expect(() => buildPositivePrompt(null)).toThrow('Prompt must be at least 2 characters long');
      expect(() => buildPositivePrompt(undefined)).toThrow('Prompt must be at least 2 characters long');
    });
  });

  describe('AIR_REGEX', () => {
    it('matches valid AIR identifiers', () => {
      expect(AIR_REGEX.test('rundiffusion:130@100')).toBe(true);
      expect(AIR_REGEX.test('runware:100@1')).toBe(true);
      expect(AIR_REGEX.test('dreamshaper:1@1')).toBe(true);
    });

    it('rejects invalid AIR identifiers', () => {
      expect(AIR_REGEX.test('bad model')).toBe(false);
      expect(AIR_REGEX.test('rundiffusion:')).toBe(false);
      expect(AIR_REGEX.test('rundiffusion:130')).toBe(false);
      expect(AIR_REGEX.test('rundiffusion:130@')).toBe(false);
      expect(AIR_REGEX.test('rundiffusion@100')).toBe(false);
    });
  });

  describe('validateBaseModel', () => {
    it('accepts valid model identifiers', () => {
      expect(validateBaseModel('rundiffusion:130@100')).toBe('rundiffusion:130@100');
    });

    it('rejects invalid model identifiers', () => {
      expect(() => validateBaseModel('bad model')).toThrow('Invalid model format');
      expect(() => validateBaseModel('')).toThrow('Model ID must be provided');
    });
  });

  describe('buildRunwareRequestPayload', () => {
    it('builds a valid request payload', () => {
      const payload = buildRunwareRequestPayload({
        positivePrompt: 'A beautiful sunset',
        model: 'rundiffusion:130@100',
        width: 512,
        height: 512
      });
      
      expect(payload.positivePrompt).toBe('A beautiful sunset');
      expect(payload.model).toBe('rundiffusion:130@100');
      expect(payload.width).toBe(512);
      expect(payload.height).toBe(512);
    });

    it('uses default values', () => {
      const payload = buildRunwareRequestPayload({
        positivePrompt: 'A cat',
        model: 'rundiffusion:130@100'
      });
      
      expect(payload.width).toBe(1024);
      expect(payload.height).toBe(1024);
      expect(payload.steps).toBe(35);
      expect(payload.CFGScale).toBe(15);
      expect(payload.scheduler).toBe('FlowMatchEulerDiscreteScheduler');
      expect(payload.outputFormat).toBe('WEBP');
    });

    it('handles controlNetModel', () => {
      const payload = buildRunwareRequestPayload({
        positivePrompt: 'A dog',
        model: 'rundiffusion:130@100',
        controlNetModel: 'runware:20@1'
      });
      
      expect(payload.controlNet).toBeDefined();
      expect(payload.controlNet[0].model).toBe('runware:20@1');
    });
  });
});
