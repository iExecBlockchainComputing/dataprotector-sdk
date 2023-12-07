import { describe, it, expect } from '@jest/globals';
import { reverseSafeSchema } from '../../../src/utils/data.js';

describe('reverseSafeSchema()', function () {
  describe('When giving a basic one-item array with email of type string', function () {
    it('should return the correct object', function () {
      // --- GIVEN
      const schemaInput = [
        {
          id: 'email:string',
        },
      ];

      // --- WHEN
      const safeSchema = reverseSafeSchema(schemaInput);

      // --- THEN
      expect(safeSchema).toEqual({ email: 'string' });
    });
  });

  describe('When giving a basic two-item array', function () {
    it('should return the correct object', function () {
      // --- GIVEN
      const schemaInput = [
        {
          id: 'numberOne:number',
        },
        {
          id: 'numberZero:number',
        },
      ];

      // --- WHEN
      const safeSchema = reverseSafeSchema(schemaInput);

      // --- THEN
      expect(safeSchema).toEqual({ numberOne: 'number', numberZero: 'number' });
    });
  });

  describe('When giving something nested with only 1 level', function () {
    it('should return the correct object', function () {
      // --- GIVEN
      const schemaInput = [
        {
          id: 'nested.something:string',
        },
      ];

      // --- WHEN
      const safeSchema = reverseSafeSchema(schemaInput);

      // --- THEN
      expect(safeSchema).toEqual({
        nested: {
          something: 'string',
        },
      });
    });
  });

  describe('When giving something deeply nested', function () {
    it('should return the correct object', function () {
      // --- GIVEN
      const schemaInput = [
        {
          id: 'nested.object.with.binary.data.pngImage:string',
        },
      ];

      // --- WHEN
      const safeSchema = reverseSafeSchema(schemaInput);

      // --- THEN
      expect(safeSchema).toEqual({
        nested: {
          object: {
            with: {
              binary: {
                data: {
                  pngImage: 'string',
                },
              },
            },
          },
        },
      });
    });
  });
});
