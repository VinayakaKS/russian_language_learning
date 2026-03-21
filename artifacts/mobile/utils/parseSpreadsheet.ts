import * as FileSystem from "expo-file-system";
import { SentencePair } from "@/models/SentencePair";

export async function parseSpreadsheet(uri: string, name: string): Promise<SentencePair[]> {
  const lowerName = name.toLowerCase();

  if (lowerName.endsWith(".csv")) {
    return parseCSV(uri);
  } else if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) {
    return parseXLSX(uri);
  }
  throw new Error("Unsupported file format. Please use .xlsx or .csv");
}

async function parseCSV(uri: string): Promise<SentencePair[]> {
  const content = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const pairs: SentencePair[] = [];

  for (const line of lines) {
    const cols = parseCSVLine(line);
    if (cols.length >= 2 && cols[0].trim() && cols[1].trim()) {
      pairs.push({ english: cols[0].trim(), russian: cols[1].trim() });
    }
  }
  return pairs;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

async function parseXLSX(uri: string): Promise<SentencePair[]> {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const pairs = await extractXLSXPairs(bytes);
    return pairs;
  } catch (err) {
    throw new Error("Failed to parse XLSX file. Please try a CSV file instead.");
  }
}

async function extractXLSXPairs(bytes: Uint8Array): Promise<SentencePair[]> {
  const zip = await unzipXLSX(bytes);

  const sharedStringsXML = zip["xl/sharedStrings.xml"];
  const sheetXML = zip["xl/worksheets/sheet1.xml"];

  if (!sheetXML) {
    throw new Error("Could not find sheet data in XLSX file.");
  }

  const sharedStrings = sharedStringsXML ? parseSharedStrings(sharedStringsXML) : [];
  const rows = parseSheet(sheetXML, sharedStrings);

  const pairs: SentencePair[] = [];
  for (const row of rows) {
    if (row.length >= 2 && row[0]?.trim() && row[1]?.trim()) {
      pairs.push({ english: row[0].trim(), russian: row[1].trim() });
    }
  }
  return pairs;
}

async function unzipXLSX(bytes: Uint8Array): Promise<Record<string, string>> {
  const files: Record<string, string> = {};

  let offset = 0;
  while (offset < bytes.length - 4) {
    const sig = (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
    if (sig !== 0x04034b50) break;

    const compression = bytes[offset + 8] | (bytes[offset + 9] << 8);
    const compressedSize = bytes[offset + 18] | (bytes[offset + 19] << 8) | (bytes[offset + 20] << 16) | (bytes[offset + 21] << 24);
    const uncompressedSize = bytes[offset + 22] | (bytes[offset + 23] << 8) | (bytes[offset + 24] << 16) | (bytes[offset + 25] << 24);
    const fileNameLength = bytes[offset + 26] | (bytes[offset + 27] << 8);
    const extraLength = bytes[offset + 28] | (bytes[offset + 29] << 8);

    const fileNameBytes = bytes.slice(offset + 30, offset + 30 + fileNameLength);
    const fileName = new TextDecoder().decode(fileNameBytes);
    const dataStart = offset + 30 + fileNameLength + extraLength;
    const compressedData = bytes.slice(dataStart, dataStart + compressedSize);

    const targetNames = ["xl/sharedStrings.xml", "xl/worksheets/sheet1.xml"];
    if (targetNames.includes(fileName)) {
      if (compression === 0) {
        files[fileName] = new TextDecoder("utf-8").decode(compressedData);
      } else if (compression === 8) {
        try {
          const ds = new DecompressionStream("deflate-raw");
          const writer = ds.writable.getWriter();
          const reader = ds.readable.getReader();
          writer.write(compressedData);
          writer.close();

          const chunks: Uint8Array[] = [];
          let done = false;
          while (!done) {
            const { value, done: d } = await reader.read();
            if (value) chunks.push(value);
            done = d;
          }
          const total = chunks.reduce((acc, c) => acc + c.length, 0);
          const result = new Uint8Array(total);
          let pos = 0;
          for (const chunk of chunks) {
            result.set(chunk, pos);
            pos += chunk.length;
          }
          files[fileName] = new TextDecoder("utf-8").decode(result);
        } catch {
          // skip if decompression fails
        }
      }
    }

    offset = dataStart + compressedSize;
  }

  return files;
}

function parseSharedStrings(xml: string): string[] {
  const strings: string[] = [];
  const siRegex = /<si>([\s\S]*?)<\/si>/g;
  const tRegex = /<t[^>]*>([\s\S]*?)<\/t>/g;

  let siMatch;
  while ((siMatch = siRegex.exec(xml)) !== null) {
    const siContent = siMatch[1];
    let combined = "";
    let tMatch;
    tRegex.lastIndex = 0;
    while ((tMatch = tRegex.exec(siContent)) !== null) {
      combined += tMatch[1];
    }
    strings.push(decodeXMLEntities(combined));
  }
  return strings;
}

function parseSheet(xml: string, sharedStrings: string[]): string[][] {
  const rows: string[][] = [];
  const rowRegex = /<row[^>]*>([\s\S]*?)<\/row>/g;
  const cellRegex = /<c\s[^>]*r="([A-Z]+)(\d+)"[^>]*(?:t="([^"]*)")?[^>]*>(?:<v>([\s\S]*?)<\/v>)?(?:<is><t>([\s\S]*?)<\/t><\/is>)?<\/c>/g;

  let rowMatch;
  while ((rowMatch = rowRegex.exec(xml)) !== null) {
    const rowContent = rowMatch[1];
    const cells: Record<string, string> = {};

    let cellMatch;
    cellRegex.lastIndex = 0;
    while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
      const col = cellMatch[1];
      const type = cellMatch[3];
      const val = cellMatch[4];
      const inlineStr = cellMatch[5];

      let cellValue = "";
      if (inlineStr !== undefined) {
        cellValue = decodeXMLEntities(inlineStr);
      } else if (type === "s" && val !== undefined) {
        const idx = parseInt(val, 10);
        cellValue = sharedStrings[idx] ?? "";
      } else if (val !== undefined) {
        cellValue = decodeXMLEntities(val);
      }
      cells[col] = cellValue;
    }

    const sortedCols = Object.keys(cells).sort();
    if (sortedCols.length > 0) {
      const maxCol = sortedCols[sortedCols.length - 1];
      const maxColNum = colNameToNum(maxCol);
      const row: string[] = [];
      for (let i = 1; i <= maxColNum; i++) {
        row.push(cells[numToColName(i)] ?? "");
      }
      rows.push(row);
    }
  }
  return rows;
}

function colNameToNum(col: string): number {
  let num = 0;
  for (const c of col) {
    num = num * 26 + (c.charCodeAt(0) - 64);
  }
  return num;
}

function numToColName(num: number): string {
  let name = "";
  while (num > 0) {
    const rem = (num - 1) % 26;
    name = String.fromCharCode(65 + rem) + name;
    num = Math.floor((num - 1) / 26);
  }
  return name;
}

function decodeXMLEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}
