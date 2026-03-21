import { SentencePair } from "@/models/SentencePair";
// @ts-ignore – pako has no bundled types but works fine in RN
import pako from "pako";

export async function parseSpreadsheet(uri: string, name: string): Promise<SentencePair[]> {
  const lowerName = (name || "").toLowerCase();

  if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) {
    return parseXLSX(uri);
  }
  // CSV and anything else
  return parseCSV(uri);
}

// ─── CSV ─────────────────────────────────────────────────────────────────────

async function parseCSV(uri: string): Promise<SentencePair[]> {
  const response = await fetch(uri);
  if (!response.ok) throw new Error(`Could not read file (status ${response.status})`);
  const content = await response.text();

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

// ─── XLSX ────────────────────────────────────────────────────────────────────

async function parseXLSX(uri: string): Promise<SentencePair[]> {
  const response = await fetch(uri);
  if (!response.ok) throw new Error(`Could not read file (status ${response.status})`);
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  const zip = unzipXLSX(bytes);

  const sharedStringsXML = zip["xl/sharedStrings.xml"];
  const sheetXML = zip["xl/worksheets/sheet1.xml"];

  if (!sheetXML) {
    throw new Error("Could not find sheet data in XLSX. Please re-save the file as CSV and try again.");
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

// Synchronous XLSX unzip using pako for deflate decompression
function unzipXLSX(bytes: Uint8Array): Record<string, string> {
  const files: Record<string, string> = {};
  const targets = new Set(["xl/sharedStrings.xml", "xl/worksheets/sheet1.xml"]);

  let offset = 0;
  while (offset + 30 < bytes.length) {
    const sig =
      (bytes[offset] |
      (bytes[offset + 1] << 8) |
      (bytes[offset + 2] << 16) |
      (bytes[offset + 3] << 24)) >>> 0;

    if (sig !== 0x04034b50) break;

    const compression = bytes[offset + 8] | (bytes[offset + 9] << 8);
    const compressedSize =
      (bytes[offset + 18] |
      (bytes[offset + 19] << 8) |
      (bytes[offset + 20] << 16) |
      (bytes[offset + 21] << 24)) >>> 0;
    const fileNameLength = bytes[offset + 26] | (bytes[offset + 27] << 8);
    const extraLength = bytes[offset + 28] | (bytes[offset + 29] << 8);

    const fileNameBytes = bytes.slice(offset + 30, offset + 30 + fileNameLength);
    const fileName = new TextDecoder().decode(fileNameBytes);
    const dataStart = offset + 30 + fileNameLength + extraLength;
    const compressedData = bytes.slice(dataStart, dataStart + compressedSize);

    if (targets.has(fileName)) {
      let text = "";
      if (compression === 0) {
        text = new TextDecoder("utf-8").decode(compressedData);
      } else if (compression === 8) {
        try {
          const decompressed = pako.inflateRaw(compressedData);
          text = new TextDecoder("utf-8").decode(decompressed);
        } catch {
          // skip if decompression fails
        }
      }
      if (text) files[fileName] = text;
    }

    offset = dataStart + compressedSize;
  }

  return files;
}

// ─── XML parsers ──────────────────────────────────────────────────────────────

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
  const cellRegex =
    /<c\s[^>]*r="([A-Z]+)\d+"[^>]*(?:\s+t="([^"]*)")?[^>]*>(?:<v>([\s\S]*?)<\/v>|<is><t>([\s\S]*?)<\/t><\/is>)?<\/c>/g;

  let rowMatch;
  while ((rowMatch = rowRegex.exec(xml)) !== null) {
    const rowContent = rowMatch[1];
    const cells: Record<string, string> = {};

    let cellMatch;
    cellRegex.lastIndex = 0;
    while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
      const col = cellMatch[1];
      const type = cellMatch[2];
      const val = cellMatch[3];
      const inlineStr = cellMatch[4];

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
