interface ExportData {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  type: string;
}

interface ExportResult {
  filename: string;
  data: string;
  mimeType: string;
}

export const exportToJSON = (data: ExportData[]): ExportResult => {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `astral-money-export-${timestamp}.json`;
  const jsonData = JSON.stringify(data, null, 2);
  
  return {
    filename,
    data: jsonData,
    mimeType: 'application/json'
  };
};

export const exportToCSV = (data: ExportData[]): ExportResult => {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `astral-money-export-${timestamp}.csv`;
  
  const headers = ['ID', 'Amount', 'Description', 'Category', 'Date', 'Type'];
  const csvRows = [headers.join(',')];
  
  data.forEach(row => {
    const values = [
      row.id,
      row.amount,
      `"${row.description.replace(/"/g, '""')}"`, // Escape quotes
      row.category,
      row.date,
      row.type
    ];
    csvRows.push(values.join(','));
  });
  
  return {
    filename,
    data: data.length > 0 ? csvRows.join('\n') : headers.join(','),
    mimeType: 'text/csv'
  };
};

export const downloadFile = (result: ExportResult): void => {
  const blob = new Blob([result.data], { type: result.mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = result.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};