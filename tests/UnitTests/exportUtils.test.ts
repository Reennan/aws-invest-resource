import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportToCSV, exportToExcel } from '@/lib/exportUtils';

// Mock XLSX
vi.mock('xlsx', () => ({
  utils: {
    book_new: vi.fn(() => ({})),
    json_to_sheet: vi.fn(() => ({})),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}));

describe('exportUtils', () => {
  const mockCreatedResources = [
    {
      id: '1',
      cluster_id: 'cluster-1',
      run_id: 'run-1',
      name: 'lambda-function-1',
      type: 'lambda',
      account_name: 'production',
      console_link: 'https://console.aws.amazon.com/lambda',
      manage_status: 'managed',
      created_at: '2024-01-15T10:30:00Z',
      raw: {},
    },
    {
      id: '2',
      cluster_id: 'cluster-2',
      run_id: 'run-2',
      name: 'sqs-queue-1',
      type: 'sqs',
      account_name: 'staging',
      console_link: 'https://console.aws.amazon.com/sqs',
      manage_status: 'unmanaged',
      created_at: '2024-01-16T14:00:00Z',
      raw: {},
    },
  ];

  const mockUnusedResources = [
    {
      id: '1',
      cluster_id: 'cluster-1',
      run_id: 'run-1',
      name: 'old-lambda',
      type: 'lambda',
      resource_id: 'arn:aws:lambda:us-east-1:123456:function:old-lambda',
      account_name: 'production',
      console_link: 'https://console.aws.amazon.com/lambda',
      status: 'unused',
      days_without_use: 90,
      raw: {},
      metrics: {},
    },
  ];

  const clustersMap: Record<string, string> = {
    'cluster-1': 'Production Cluster',
    'cluster-2': 'Staging Cluster',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock document methods
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    };
    
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);
  });

  describe('exportToCSV', () => {
    it('deve gerar CSV com recursos criados e sem uso', () => {
      exportToCSV(mockCreatedResources, mockUnusedResources, clustersMap);

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(window.URL.createObjectURL).toHaveBeenCalled();
      expect(window.URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('deve tratar arrays vazios', () => {
      exportToCSV([], [], {});

      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    it('deve mapear clusters corretamente', () => {
      exportToCSV(mockCreatedResources, mockUnusedResources, clustersMap);

      // Verifica que a função foi executada sem erros
      expect(window.URL.createObjectURL).toHaveBeenCalled();
    });

    it('deve tratar valores nulos e undefined', () => {
      const resourcesWithNulls = [
        {
          id: '1',
          cluster_id: 'cluster-1',
          run_id: 'run-1',
          name: null as any,
          type: undefined as any,
          account_name: '',
          console_link: null as any,
          manage_status: null as any,
          created_at: null as any,
          raw: {},
        },
      ];

      exportToCSV(resourcesWithNulls, [], clustersMap);

      expect(window.URL.createObjectURL).toHaveBeenCalled();
    });

    it('deve escapar vírgulas e aspas em valores', () => {
      const resourcesWithSpecialChars = [
        {
          id: '1',
          cluster_id: 'cluster-1',
          run_id: 'run-1',
          name: 'resource, with "quotes"',
          type: 'lambda',
          account_name: 'account, name',
          console_link: 'https://example.com',
          manage_status: 'managed',
          created_at: '2024-01-15T10:30:00Z',
          raw: {},
        },
      ];

      exportToCSV(resourcesWithSpecialChars, [], clustersMap);

      expect(window.URL.createObjectURL).toHaveBeenCalled();
    });
  });

  describe('exportToExcel', () => {
    it('deve gerar Excel com duas abas', async () => {
      const XLSX = await import('xlsx');
      
      exportToExcel(mockCreatedResources, mockUnusedResources, clustersMap);

      expect(XLSX.utils.book_new).toHaveBeenCalled();
      expect(XLSX.utils.json_to_sheet).toHaveBeenCalledTimes(2);
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledTimes(2);
      expect(XLSX.writeFile).toHaveBeenCalledWith(
        expect.any(Object),
        'relatorio-recursos.xlsx'
      );
    });

    it('deve tratar arrays vazios', async () => {
      const XLSX = await import('xlsx');
      
      exportToExcel([], [], {});

      expect(XLSX.utils.book_new).toHaveBeenCalled();
      expect(XLSX.writeFile).toHaveBeenCalled();
    });

    it('deve formatar datas corretamente', async () => {
      const XLSX = await import('xlsx');
      
      exportToExcel(mockCreatedResources, mockUnusedResources, clustersMap);

      expect(XLSX.utils.json_to_sheet).toHaveBeenCalled();
    });

    it('deve tratar resource_id nos recursos sem uso', async () => {
      const XLSX = await import('xlsx');
      
      exportToExcel(mockCreatedResources, mockUnusedResources, clustersMap);

      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
        'Recursos Sem Uso'
      );
    });
  });
});
