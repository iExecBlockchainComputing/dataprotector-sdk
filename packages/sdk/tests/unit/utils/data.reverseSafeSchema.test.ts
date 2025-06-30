import { describe, it, expect } from '@jest/globals';
import { reverseSafeSchema } from '../../../src/utils/data.js';

describe('reverseSafeSchema()', function () {
  describe('When giving an empty schema', function () {
    it('should not crash and return', function () {
      // --- WHEN
      const safeSchema = reverseSafeSchema(undefined);

      // --- THEN
      expect(safeSchema).toEqual({});
    });
  });

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
          id: 'nested.object.with.binary.data.pngImage:image/png',
        },
        {
          id: 'nested.object.with.binary.data.string:string',
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
                  pngImage: 'image/png',
                  string: 'string',
                },
              },
            },
          },
        },
      });
    });
  });

  describe('when giving some real life schema', function () {
    it('should return the correct object', function () {
      // --- GIVEN
      const schemaInput = [
        {
          id: 'n8nWorkflow.credentials.0.createdAt:string',
        },
        {
          id: 'n8nWorkflow.credentials.0.data.accessToken:string',
        },
        {
          id: 'n8nWorkflow.credentials.0.id:string',
        },
        {
          id: 'n8nWorkflow.credentials.0.isManaged:bool',
        },
        {
          id: 'n8nWorkflow.credentials.0.name:string',
        },
        {
          id: 'n8nWorkflow.credentials.0.type:string',
        },
        {
          id: 'n8nWorkflow.credentials.0.updatedAt:string',
        },
        {
          id: 'n8nWorkflow.workflows.0.active:bool',
        },
        {
          id: 'n8nWorkflow.workflows.0.connections.Date___Time.main.0.0.index:f64',
        },
        {
          id: 'n8nWorkflow.workflows.0.connections.Date___Time.main.0.0.node:string',
        },
        {
          id: 'n8nWorkflow.workflows.0.connections.Date___Time.main.0.0.type:string',
        },
        {
          id: 'n8nWorkflow.workflows.0.connections.Schedule_Trigger.main.0.0.index:f64',
        },
        {
          id: 'n8nWorkflow.workflows.0.connections.Schedule_Trigger.main.0.0.node:string',
        },
        {
          id: 'n8nWorkflow.workflows.0.connections.Schedule_Trigger.main.0.0.type:string',
        },
        {
          id: 'n8nWorkflow.workflows.0.connections.When_clicking__Execute_workflow_.main.0.0.index:f64',
        },
        {
          id: 'n8nWorkflow.workflows.0.connections.When_clicking__Execute_workflow_.main.0.0.node:string',
        },
        {
          id: 'n8nWorkflow.workflows.0.connections.When_clicking__Execute_workflow_.main.0.0.type:string',
        },
        {
          id: 'n8nWorkflow.workflows.0.createdAt:string',
        },
        {
          id: 'n8nWorkflow.workflows.0.id:string',
        },
        {
          id: 'n8nWorkflow.workflows.0.isArchived:bool',
        },
        {
          id: 'n8nWorkflow.workflows.0.meta.templateCredsSetupCompleted:bool',
        },
        {
          id: 'n8nWorkflow.workflows.0.name:string',
        },
        {
          id: 'n8nWorkflow.workflows.0.nodes.0.credentials.slackApi.id:string',
        },
        {
          id: 'n8nWorkflow.workflows.0.nodes.0.credentials.slackApi.name:string',
        },
        {
          id: 'n8nWorkflow.workflows.0.nodes.0.id:string',
        },
        {
          id: 'n8nWorkflow.workflows.0.nodes.0.name:string',
        },
        {
          id: 'n8nWorkflow.workflows.0.nodes.0.parameters.channelId.__rl:bool',
        },
        {
          id: 'n8nWorkflow.workflows.0.nodes.0.parameters.channelId.mode:string',
        },
        {
          id: 'n8nWorkflow.workflows.0.nodes.0.parameters.channelId.value:string',
        },
        {
          id: 'n8nWorkflow.workflows.0.nodes.0.parameters.otherOptions.includeLinkToWorkflow:bool',
        },
        {
          id: 'n8nWorkflow.workflows.0.nodes.0.parameters.select:string',
        },
        {
          id: 'n8nWorkflow.workflows.0.nodes.0.parameters.text:string',
        },
        {
          id: 'n8nWorkflow.workflows.0.nodes.0.position.0:f64',
        },
        {
          id: 'n8nWorkflow.workflows.0.nodes.0.position.1:f64',
        },
        {
          id: 'n8nWorkflow.workflows.0.nodes.0.type:string',
        },
        {
          id: 'n8nWorkflow.workflows.0.nodes.0.typeVersion:f64',
        },
        {
          id: 'n8nWorkflow.workflows.0.nodes.0.webhookId:string',
        },
        {
          id: 'n8nWorkflow.workflows.0.nodes.1.id:string',
        },
        {
          id: 'n8nWorkflow.workflows.0.nodes.1.name:string',
        },
        {
          id: 'n8nWorkflow.workflows.0.nodes.1.parameters.customFormat:string',
        },
        {
          id: 'n8nWorkflow.workflows.0.nodes.1.parameters.date:string',
        },
        {
          id: 'n8nWorkflow.workflows.0.nodes.1.parameters.format:string',
        },
        {
          id: 'n8nWorkflow.workflows.0.nodes.1.parameters.operation:string',
        },
        {
          id: 'n8nWorkflow.workflows.0.nodes.1.position.0:f64',
        },
        {
          id: 'n8nWorkflow.workflows.0.nodes.1.position.1:f64',
        },
        {
          id: 'n8nWorkflow.workflows.0.nodes.1.type:string',
        },
        {
          id: 'n8nWorkflow.workflows.0.nodes.1.typeVersion:f64',
        },
        {
          id: 'n8nWorkflow.workflows.0.nodes.2.id:string',
        },
        {
          id: 'n8nWorkflow.workflows.0.nodes.2.name:string',
        },
        {
          id: 'n8nWorkflow.workflows.0.nodes.2.parameters.rule.interval.0.field:string',
        },
        {
          id: 'n8nWorkflow.workflows.0.nodes.2.parameters.rule.interval.0.minutesInterval:f64',
        },
        {
          id: 'n8nWorkflow.workflows.0.nodes.2.position.0:f64',
        },
        {
          id: 'n8nWorkflow.workflows.0.nodes.2.position.1:f64',
        },
        {
          id: 'n8nWorkflow.workflows.0.nodes.2.type:string',
        },
        {
          id: 'n8nWorkflow.workflows.0.nodes.2.typeVersion:f64',
        },
        {
          id: 'n8nWorkflow.workflows.0.nodes.3.id:string',
        },
        {
          id: 'n8nWorkflow.workflows.0.nodes.3.name:string',
        },
        {
          id: 'n8nWorkflow.workflows.0.nodes.3.position.0:f64',
        },
        {
          id: 'n8nWorkflow.workflows.0.nodes.3.position.1:f64',
        },
        {
          id: 'n8nWorkflow.workflows.0.nodes.3.type:string',
        },
        {
          id: 'n8nWorkflow.workflows.0.nodes.3.typeVersion:f64',
        },
        {
          id: 'n8nWorkflow.workflows.0.settings.callerPolicy:string',
        },
        {
          id: 'n8nWorkflow.workflows.0.settings.executionOrder:string',
        },
        {
          id: 'n8nWorkflow.workflows.0.settings.timezone:string',
        },
        {
          id: 'n8nWorkflow.workflows.0.triggerCount:f64',
        },
        {
          id: 'n8nWorkflow.workflows.0.updatedAt:string',
        },
        {
          id: 'n8nWorkflow.workflows.0.versionId:string',
        },
      ];
      // --- WHEN
      const safeSchema = reverseSafeSchema(schemaInput);

      // --- THEN
      expect(safeSchema).toEqual({
        n8nWorkflow: {
          credentials: {
            '0': {
              createdAt: 'string',
              updatedAt: 'string',
              id: 'string',
              name: 'string',
              data: {
                accessToken: 'string',
              },
              type: 'string',
              isManaged: false,
            },
          },
          workflows: {
            '0': {
              createdAt: 'string',
              updatedAt: 'string',
              id: 'string',
              name: 'string',
              active: false,
              isArchived: false,
              nodes: {
                '0': {
                  parameters: {
                    select: 'string',
                    channelId: {
                      __rl: false,
                      value: 'string',
                      mode: 'string',
                    },
                    text: 'string',
                    otherOptions: {
                      includeLinkToWorkflow: false,
                    },
                  },
                  type: 'string',
                  typeVersion: 1,
                  position: {
                    '0': 1,
                    '1': 1,
                  },
                  id: 'string',
                  name: 'string',
                  webhookId: 'string',
                  credentials: {
                    slackApi: {
                      id: 'string',
                      name: 'string',
                    },
                  },
                },
                '1': {
                  parameters: {
                    operation: 'string',
                    date: 'string',
                    format: 'string',
                    customFormat: 'string',
                  },
                  type: 'string',
                  typeVersion: 1,
                  position: {
                    '0': 1,
                    '1': 1,
                  },
                  id: 'string',
                  name: 'string',
                },
                '2': {
                  parameters: {
                    rule: {
                      interval: {
                        '0': {
                          field: 'string',
                          minutesInterval: 1,
                        },
                      },
                    },
                  },
                  type: 'string',
                  typeVersion: 1,
                  position: {
                    '0': 1,
                    '1': 1,
                  },
                  id: 'string',
                  name: 'string',
                },
                '3': {
                  type: 'string',
                  typeVersion: 1,
                  position: {
                    '0': 1,
                    '1': 1,
                  },
                  id: 'string',
                  name: 'string',
                },
              },
              connections: {
                Date___Time: {
                  main: {
                    '0': {
                      '0': {
                        node: 'string',
                        type: 'string',
                        index: 1,
                      },
                    },
                  },
                },
                Schedule_Trigger: {
                  main: {
                    '0': {
                      '0': {
                        node: 'string',
                        type: 'string',
                        index: 1,
                      },
                    },
                  },
                },
                When_clicking__Execute_workflow_: {
                  main: {
                    '0': {
                      '0': {
                        node: 'string',
                        type: 'string',
                        index: 1,
                      },
                    },
                  },
                },
              },
              settings: {
                executionOrder: 'string',
                timezone: 'string',
                callerPolicy: 'string',
              },
              meta: {
                templateCredsSetupCompleted: false,
              },
              versionId: 'string',
              triggerCount: 1,
            },
          },
        },
      });
    });
  });
});
