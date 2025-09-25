import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ResourceCreated {
  id: string;
  cluster_id: string;
  run_id: string;
  name: string;
  type: string;
  account_name: string;
  console_link: string;
  manage_status: string;
  created_at: string;
  raw: any;
}

interface ResourceUnused {
  id: string;
  cluster_id: string;
  run_id: string;
  name: string;
  type: string;
  resource_id: string;
  account_name: string;
  console_link: string;
  status: string;
  days_without_use: number;
  raw: any;
  metrics: any;
}

export const exportToCSV = (
  createdResources: ResourceCreated[],
  unusedResources: ResourceUnused[],
  clustersMap: Record<string, string>
) => {
  // Preparar dados dos recursos criados
  const createdData = createdResources.map(resource => ({
    'Nome': resource.name || '',
    'Tipo': resource.type || '',
    'Cluster': clustersMap[resource.cluster_id] || '',
    'Conta': resource.account_name || '',
    'Data de Criação': resource.created_at ? format(new Date(resource.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '',
    'Status': resource.manage_status || '',
    'Link do Console': resource.console_link || ''
  }));

  // Preparar dados dos recursos sem uso
  const unusedData = unusedResources.map(resource => ({
    'Nome': resource.name || '',
    'Tipo': resource.type || '',
    'Cluster': clustersMap[resource.cluster_id] || '',
    'Conta': resource.account_name || '',
    'Dias sem Uso': resource.days_without_use || 0,
    'Status': resource.status || '',
    'Link do Console': resource.console_link || ''
  }));

  // Converter para CSV
  const csvCreated = convertToCSV(createdData);
  const csvUnused = convertToCSV(unusedData);

  // Criar arquivo combinado
  const combinedCSV = `RECURSOS CRIADOS\n${csvCreated}\n\nRECURSOS SEM USO\n${csvUnused}`;

  // Download com BOM para melhor compatibilidade
  downloadFile(combinedCSV, 'relatorio-recursos.csv', 'text/csv;charset=utf-8');
};

export const exportToExcel = (
  createdResources: ResourceCreated[],
  unusedResources: ResourceUnused[],
  clustersMap: Record<string, string>
) => {
  // Preparar dados dos recursos criados
  const createdData = createdResources.map(resource => ({
    'Nome': resource.name || '',
    'Tipo': resource.type || '',
    'Cluster': clustersMap[resource.cluster_id] || '',
    'Conta': resource.account_name || '',
    'Data de Criação': resource.created_at ? format(new Date(resource.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '',
    'Status': resource.manage_status || '',
    'Link do Console': resource.console_link || ''
  }));

  // Preparar dados dos recursos sem uso
  const unusedData = unusedResources.map(resource => ({
    'Nome': resource.name || '',
    'Tipo': resource.type || '',
    'Cluster': clustersMap[resource.cluster_id] || '',
    'Conta': resource.account_name || '',
    'Dias sem Uso': resource.days_without_use || 0,
    'Status': resource.status || '',
    'Link do Console': resource.console_link || ''
  }));

  // Criar workbook
  const workbook = XLSX.utils.book_new();

  // Adicionar planilha de recursos criados
  const createdWorksheet = XLSX.utils.json_to_sheet(createdData);
  XLSX.utils.book_append_sheet(workbook, createdWorksheet, 'Recursos Criados');

  // Adicionar planilha de recursos sem uso
  const unusedWorksheet = XLSX.utils.json_to_sheet(unusedData);
  XLSX.utils.book_append_sheet(workbook, unusedWorksheet, 'Recursos Sem Uso');

  // Download
  XLSX.writeFile(workbook, 'relatorio-recursos.xlsx');
};

const convertToCSV = (data: any[]): string => {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escapar aspas duplas e envolver em aspas se contém vírgula
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  return csvContent;
};

const downloadFile = (content: string, filename: string, mimeType: string) => {
  // Adicionar BOM para CSVs para melhor compatibilidade com caracteres especiais
  const BOM = '\uFEFF';
  const contentWithBOM = mimeType.includes('csv') ? BOM + content : content;
  
  const blob = new Blob([contentWithBOM], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};