// app/api/export/data/route.ts
import { NextResponse } from 'next/server';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export async function POST(req: Request) {
  try {
    // 1. URL se entityType aur format nikalein
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get('entityType');
    const format = searchParams.get('format');

    // 2. Request body se data nikalein (jo ek array hai)
    const data = await req.json();

    if (!data || !entityType || !format) {
      return NextResponse.json({ error: 'Missing data, entityType, or format' }, { status: 400 });
    }

    let output: string | Buffer;
    let contentType: string;
    let fileName: string;

    // Frontend se complex data ko aam data mein badlein
    const dataForExport = data.map((row: unknown) => {
      if (typeof row === 'object' && row !== null) {
        const newRow = { ...row } as Record<string, unknown>;
        // Arrays aur objects ko CSV/XLSX ke liye aasaan strings mein badlein
        Object.keys(newRow).forEach(key => {
          if (Array.isArray(newRow[key])) {
            newRow[key] = (newRow[key] as unknown[]).join(', ');
          } else if (typeof newRow[key] === 'object' && newRow[key] !== null) {
            newRow[key] = JSON.stringify(newRow[key]);
          }
        });
        return newRow;
      }
      return {};
    });


    if (format === 'csv') {
      output = Papa.unparse(dataForExport);
      contentType = 'text/csv';
      fileName = `${entityType}.csv`;
    } else if (format === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(dataForExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, entityType);
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      output = Buffer.from(buffer);
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      fileName = `${entityType}.xlsx`;
    } else {
      return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
    }

    // File download ke liye sahi headers ke saath response bhejें
    return new NextResponse(output, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error: unknown) {
    console.error('Export API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: 'Failed to export data.', details: errorMessage }, { status: 500 });
  }
}
