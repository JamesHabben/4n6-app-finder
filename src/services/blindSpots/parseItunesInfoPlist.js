import { detectFormat, parse } from '@plist/plist';
import { PlistFormat } from '@plist/common';

const FORMAT_LABELS = {
  [PlistFormat.BINARY]: 'binary plist',
  [PlistFormat.XML]: 'XML plist',
  [PlistFormat.OPENSTEP]: 'OpenStep plist',
};

export const WRONG_PLIST_MESSAGE =
  'This does not look like an iTunes backup Info.plist. Use the Info.plist in the backup folder root, next to Manifest.plist.';

function isPlainObject(value) {
  return Boolean(
    value
    && typeof value === 'object'
    && !Array.isArray(value)
    && !(value instanceof Date)
    && !(value instanceof ArrayBuffer)
    && !ArrayBuffer.isView(value)
  );
}

function toArrayBuffer(value) {
  if (value instanceof ArrayBuffer) {
    return value;
  }
  if (ArrayBuffer.isView(value)) {
    return value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);
  }
  return null;
}

function asString(value) {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' || typeof value === 'bigint') {
    return String(value);
  }
  return '';
}

function asDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }
  if (typeof value === 'string' && value) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return null;
}

function asBundleId(value) {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  if (isPlainObject(value) && asString(value.CFBundleIdentifier)) {
    return asString(value.CFBundleIdentifier);
  }
  return '';
}

function looksLikeItunesBackupInfoPlist(obj) {
  if (obj.CFBundleExecutable || obj.CFBundlePackageType === 'APPL' || obj.CFBundlePackageType === 'FMWK') {
    return false;
  }
  if (obj.BackupKeyBag != null || obj.ManifestKey != null) {
    return false;
  }

  return Boolean(
    asString(obj['Product Type'])
    || (asString(obj['Product Version']) && (
      asString(obj['Device Name'])
      || asString(obj['Unique Identifier'])
      || asString(obj['Target Identifier'])
    ))
  );
}

function extractItunesMetadataFields(dict) {
  return {
    itemName: asString(dict.itemName) || asString(dict.bundleDisplayName) || asString(dict.title),
    version: asString(dict.bundleShortVersionString) || asString(dict.bundleVersion),
    publisher: asString(dict.artistName),
    genre: asString(dict.genre),
  };
}

function parseItunesMetadata(value) {
  if (isPlainObject(value)) {
    return extractItunesMetadataFields(value);
  }

  const buffer = toArrayBuffer(value);
  if (!buffer || buffer.byteLength < 8) {
    return null;
  }

  try {
    const inner = parse(buffer);
    if (isPlainObject(inner)) {
      return extractItunesMetadataFields(inner);
    }
  } catch {
    return null;
  }

  return null;
}

function compactIdentifiers(identifiers) {
  return Object.fromEntries(
    Object.entries(identifiers).filter(([, value]) => Boolean(value))
  );
}

export function parseItunesInfoPlist(buffer, fileName = '') {
  let parsed;

  try {
    parsed = parse(buffer);
  } catch {
    throw new Error('Could not parse this file as an Apple property list.');
  }

  if (!isPlainObject(parsed)) {
    throw new Error('This plist does not contain a dictionary.');
  }

  if (!looksLikeItunesBackupInfoPlist(parsed)) {
    throw new Error(WRONG_PLIST_MESSAGE);
  }

  let formatLabel = 'plist';
  try {
    formatLabel = FORMAT_LABELS[detectFormat(buffer)] || formatLabel;
  } catch {
    // Keep the generic label if format detection fails.
  }

  const applications = isPlainObject(parsed.Applications) ? parsed.Applications : {};
  const installed = Array.isArray(parsed['Installed Applications'])
    ? parsed['Installed Applications']
    : [];

  const bundleIds = new Set();
  installed.forEach(item => {
    const bundleId = asBundleId(item);
    if (bundleId) {
      bundleIds.add(bundleId);
    }
  });
  Object.keys(applications).forEach(key => {
    if (key) {
      bundleIds.add(key);
    }
  });

  const apps = [...bundleIds]
    .map(bundleId => {
      const entry = isPlainObject(applications[bundleId]) ? applications[bundleId] : {};
      const meta = parseItunesMetadata(entry.iTunesMetadata) || {};
      const name = meta.itemName
        || asString(entry.CFBundleDisplayName)
        || asString(entry.CFBundleName);

      return {
        bundleId,
        name,
        version: meta.version || '',
        publisher: meta.publisher || '',
        genre: meta.genre || '',
      };
    })
    .sort((a, b) => {
      const left = a.name || a.bundleId;
      const right = b.name || b.bundleId;
      return left.localeCompare(right);
    });

  return {
    source: {
      fileName,
      format: formatLabel,
      platform: 'apple',
    },
    device: {
      name: asString(parsed['Device Name']) || asString(parsed['Display Name']),
      displayName: asString(parsed['Display Name']),
      productName: asString(parsed['Product Name']),
      productType: asString(parsed['Product Type']),
      productVersion: asString(parsed['Product Version']),
      buildVersion: asString(parsed['Build Version']),
      lastBackupDate: asDate(parsed['Last Backup Date']),
      itunesVersion: asString(parsed['iTunes Version']),
      identifiers: compactIdentifiers({
        serialNumber: asString(parsed['Serial Number']),
        uniqueIdentifier: asString(parsed['Unique Identifier']) || asString(parsed['Target Identifier']),
        imei: asString(parsed.IMEI),
        imei2: asString(parsed['IMEI 2']) || asString(parsed.IMEI2),
        meid: asString(parsed.MEID),
        iccid: asString(parsed.ICCID),
        phoneNumber: asString(parsed['Phone Number']),
      }),
    },
    apps,
  };
}
