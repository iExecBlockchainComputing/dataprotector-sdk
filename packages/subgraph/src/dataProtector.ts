import {
  JSONValue,
  JSONValueKind,
  Result,
  TypedMap,
  json,
} from '@graphprotocol/graph-ts';
import { Dataset as DatasetContract } from '../generated/DatasetRegistry/Dataset';
import { DatasetSchema as DatasetSchemaEvent } from '../generated/DataProtector/DataProtector';
import { ProtectedData, SchemaEntry } from '../generated/schema';
import { AUTHORIZED_CHARACTERS } from './types';

const PATH_SEPARATOR = '.';
const DataSchemaEntryType = [
  'boolean', // dataprotector v0 schema for boolean
  'number', // dataprotector v0 schema for integers in safe integers range
  'string',
  'bool',
  'i128',
  'f64',
  // MIME types supported by dataprotector
  'application/octet-stream',
  'application/pdf',
  'application/xml',
  'application/zip',
  'audio/midi',
  'audio/mpeg',
  'audio/x-wav',
  'image/bmp',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/mpeg',
  'video/x-msvideo',
];

export function handleDatasetSchema(event: DatasetSchemaEvent): void {
  const protectedDataAddress = event.params.dataset;
  let contract = DatasetContract.bind(protectedDataAddress);

  let protectedData = ProtectedData.load(protectedDataAddress);
  if (!protectedData) {
    protectedData = new ProtectedData(protectedDataAddress);
  }
  protectedData.owner = contract.owner().toHex();
  protectedData.name = contract.m_datasetName();
  protectedData.jsonSchema = event.params.schema;
  protectedData.schema = new Array<string>();
  protectedData.isIncludedInSubscription = false;
  protectedData.isRentable = false;
  protectedData.isForSale = false;
  protectedData.multiaddr = contract.m_datasetMultiaddr();
  protectedData.checksum = contract.m_datasetChecksum();
  protectedData.creationTimestamp = event.block.timestamp;
  protectedData.transactionHash = event.transaction.hash;
  protectedData.blockNumber = event.block.number;

  const schema: Result<JSONValue, boolean> = json.try_fromString(
    event.params.schema
  );

  if (schema.isOk) {
    const availableSchema: TypedMap<string, JSONValue> =
      schema.value.toObject();

    const entries = recursiveParse(availableSchema);
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const entryId = entry.path + ':' + entry.type.toString(); // create a unique protectedDataAddress for the entry
      let entryEntity = SchemaEntry.load(entryId);
      if (!entryEntity) {
        entryEntity = new SchemaEntry(entryId);
      }
      entryEntity.path = entry.path;
      entryEntity.type = entry.type.toString() || '';
      entryEntity.save();

      const schema = protectedData.schema;
      schema.push(entryEntity.id);
      protectedData.schema = schema;
    }
  }
  protectedData.save();
}

class ISchemaEntry {
  path: string;
  type: string;
}

function recursiveParse(
  typedMap: TypedMap<string, JSONValue>,
  parentPath: string = ''
): Array<ISchemaEntry> {
  let accumulator: Array<ISchemaEntry> = new Array();
  for (let i = 0; i < typedMap.entries.length; i++) {
    const entry = typedMap.entries[i];
    const path = `${parentPath !== '' ? parentPath + PATH_SEPARATOR : ''}${
      entry.key
    }`;

    if (entry.key.trim() === '' || containsSpecialCharacters(entry.key)) {
      continue;
    }

    if (entry.value.kind == JSONValueKind.OBJECT) {
      const object = entry.value.toObject();
      for (let i = 0; i < object.entries.length; i++) {
        accumulator = accumulator.concat(recursiveParse(object, path));
      }
    } else if (entry.value.kind == JSONValueKind.STRING) {
      if (DataSchemaEntryType.includes(entry.value.toString())) {
        accumulator = accumulator.concat([
          {
            path,
            type: entry.value.toString(),
          },
        ]);
      }
    }
  }
  return accumulator;
}

function containsSpecialCharacters(str: string): boolean {
  for (let i = 0; i < str.length; i++) {
    if (!AUTHORIZED_CHARACTERS.includes(str[i])) {
      return true;
    }
  }
  return false;
}
