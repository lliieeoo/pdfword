export interface PdfTextItem {
  text: string;
  fontSize?: number;
  fontName?: string;
  pageNum: number;
}

export interface PdfParseResult {
  text: string;
  items: PdfTextItem[];
  numPages: number;
}

export interface TableCell {
  text: string;
}

export interface TableRow {
  cells: TableCell[];
}

export interface TableData {
  rows: TableRow[];
  pageNum: number;
}
