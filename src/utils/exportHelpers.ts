// Export helpers for different file formats

export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) {
    alert('Brak danych do eksportu');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(';'),
    ...data.map(row => headers.map(header => {
      const value = row[header];
      // Escape values that contain semicolons or quotes
      if (typeof value === 'string' && (value.includes(';') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value ?? '';
    }).join(';'))
  ].join('\n');

  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
};

export const exportToTXT = (data: any[], filename: string, title: string) => {
  if (data.length === 0) {
    alert('Brak danych do eksportu');
    return;
  }

  const headers = Object.keys(data[0]);
  const colWidths = headers.map(h => {
    const headerLen = h.length;
    const maxDataLen = Math.max(...data.map(row => String(row[h] ?? '').length));
    return Math.max(headerLen, maxDataLen) + 2;
  });

  const separator = colWidths.map(w => '-'.repeat(w)).join('+');
  const headerRow = headers.map((h, i) => h.padEnd(colWidths[i])).join('|');
  const dataRows = data.map(row =>
    headers.map((h, i) => String(row[h] ?? '').padEnd(colWidths[i])).join('|')
  );

  const txtContent = [
    title,
    '='.repeat(title.length),
    '',
    headerRow,
    separator,
    ...dataRows,
    separator,
    '',
    `Wygenerowano: ${new Date().toLocaleString('pl-PL')}`
  ].join('\n');

  downloadFile(txtContent, filename, 'text/plain;charset=utf-8;');
};

export const exportToExcel = (data: any[], filename: string, sheetName: string) => {
  if (data.length === 0) {
    alert('Brak danych do eksportu');
    return;
  }

  // Create XML for Excel 2003 format (compatible with most Excel versions)
  const headers = Object.keys(data[0]);
  
  const xmlHeader = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${escapeXML(sheetName)}">
  <Table>`;

  const xmlHeaderRow = `   <Row>${headers.map(h => 
    `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXML(h)}</Data></Cell>`
  ).join('')}</Row>`;

  const xmlDataRows = data.map(row => 
    `   <Row>${headers.map(h => {
      const value = row[h];
      const type = typeof value === 'number' ? 'Number' : 'String';
      return `<Cell><Data ss:Type="${type}">${escapeXML(String(value ?? ''))}</Data></Cell>`;
    }).join('')}</Row>`
  ).join('\n');

  const xmlFooter = `
  </Table>
 </Worksheet>
</Workbook>`;

  const xmlContent = xmlHeader + xmlHeaderRow + '\n' + xmlDataRows + xmlFooter;
  
  downloadFile(xmlContent, filename, 'application/vnd.ms-excel;charset=utf-8;');
};

const escapeXML = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const downloadFile = (content: string, filename: string, mimeType: string) => {
  const BOM = '\uFEFF'; // UTF-8 BOM for proper encoding in Excel
  const blob = new Blob([BOM + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
