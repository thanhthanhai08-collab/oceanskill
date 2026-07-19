const maxEntryBytes = 1024 * 1024;
const maxExpandedBytes = 5 * 1024 * 1024;
const maxArchiveEntries = 128;
const maxCompressionRatio = 200;

export function preflightSkillZip(bytes: Uint8Array) {
  if (bytes.byteLength < 22) throw new Error("invalid_bundle_zip");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const earliestEocd = Math.max(0, bytes.byteLength - 65_557);
  let eocd = -1;
  for (let offset = bytes.byteLength - 22; offset >= earliestEocd; offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) { eocd = offset; break; }
  }
  if (eocd < 0) throw new Error("invalid_bundle_zip");

  const diskNumber = view.getUint16(eocd + 4, true);
  const centralDisk = view.getUint16(eocd + 6, true);
  const diskEntries = view.getUint16(eocd + 8, true);
  const totalEntries = view.getUint16(eocd + 10, true);
  const centralSize = view.getUint32(eocd + 12, true);
  const centralOffset = view.getUint32(eocd + 16, true);
  const commentLength = view.getUint16(eocd + 20, true);
  if (diskNumber !== 0 || centralDisk !== 0 || diskEntries !== totalEntries) throw new Error("invalid_bundle_multidisk");
  if (totalEntries === 0 || totalEntries === 0xffff || totalEntries > maxArchiveEntries) throw new Error("invalid_bundle_entry_count");
  if (centralSize === 0xffffffff || centralOffset === 0xffffffff || centralOffset + centralSize > eocd) throw new Error("invalid_bundle_zip64");
  if (eocd + 22 + commentLength > bytes.byteLength) throw new Error("invalid_bundle_zip");

  let offset = centralOffset;
  let expandedBytes = 0;
  for (let index = 0; index < totalEntries; index += 1) {
    if (offset + 46 > eocd || view.getUint32(offset, true) !== 0x02014b50) throw new Error("invalid_bundle_zip");
    const flags = view.getUint16(offset + 8, true);
    const method = view.getUint16(offset + 10, true);
    const compressed = view.getUint32(offset + 20, true);
    const expanded = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const entryCommentLength = view.getUint16(offset + 32, true);
    const startDisk = view.getUint16(offset + 34, true);
    if ((flags & 0x1) !== 0) throw new Error("invalid_bundle_encrypted");
    if (method !== 0 && method !== 8) throw new Error("invalid_bundle_compression_method");
    if (startDisk !== 0 || compressed === 0xffffffff || expanded === 0xffffffff) throw new Error("invalid_bundle_zip64");
    if (expanded > maxEntryBytes) throw new Error("invalid_bundle_expanded_size");
    expandedBytes += expanded;
    if (expandedBytes > maxExpandedBytes) throw new Error("invalid_bundle_expanded_size");
    if (expanded > 0 && (compressed === 0 || expanded / compressed > maxCompressionRatio)) throw new Error("invalid_bundle_compression_ratio");
    offset += 46 + nameLength + extraLength + entryCommentLength;
  }
  if (offset !== centralOffset + centralSize) throw new Error("invalid_bundle_zip");
}
