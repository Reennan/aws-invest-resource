import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePagination } from '@/hooks/usePagination';

describe('usePagination', () => {
  const mockData = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }));

  it('deve inicializar com valores corretos', () => {
    const { result } = renderHook(() => 
      usePagination({ data: mockData, itemsPerPage: 10 })
    );

    expect(result.current.currentPage).toBe(1);
    expect(result.current.totalPages).toBe(3);
    expect(result.current.totalItems).toBe(25);
    expect(result.current.currentData).toHaveLength(10);
  });

  it('deve navegar para próxima página', () => {
    const { result } = renderHook(() => 
      usePagination({ data: mockData, itemsPerPage: 10 })
    );

    act(() => {
      result.current.goToNextPage();
    });

    expect(result.current.currentPage).toBe(2);
    expect(result.current.currentData).toHaveLength(10);
    expect(result.current.startIndex).toBe(11);
  });

  it('deve navegar para página anterior', () => {
    const { result } = renderHook(() => 
      usePagination({ data: mockData, itemsPerPage: 10 })
    );

    act(() => {
      result.current.goToPage(2);
    });

    act(() => {
      result.current.goToPreviousPage();
    });

    expect(result.current.currentPage).toBe(1);
  });

  it('deve ir para uma página específica', () => {
    const { result } = renderHook(() => 
      usePagination({ data: mockData, itemsPerPage: 10 })
    );

    act(() => {
      result.current.goToPage(3);
    });

    expect(result.current.currentPage).toBe(3);
    expect(result.current.currentData).toHaveLength(5);
    expect(result.current.endIndex).toBe(25);
  });

  it('não deve ultrapassar limites de página', () => {
    const { result } = renderHook(() => 
      usePagination({ data: mockData, itemsPerPage: 10 })
    );

    act(() => {
      result.current.goToPage(10);
    });

    expect(result.current.currentPage).toBe(3);

    act(() => {
      result.current.goToPage(-5);
    });

    expect(result.current.currentPage).toBe(1);
  });

  it('deve verificar hasNextPage e hasPreviousPage corretamente', () => {
    const { result } = renderHook(() => 
      usePagination({ data: mockData, itemsPerPage: 10 })
    );

    expect(result.current.hasNextPage).toBe(true);
    expect(result.current.hasPreviousPage).toBe(false);

    act(() => {
      result.current.goToPage(2);
    });

    expect(result.current.hasNextPage).toBe(true);
    expect(result.current.hasPreviousPage).toBe(true);

    act(() => {
      result.current.goToPage(3);
    });

    expect(result.current.hasNextPage).toBe(false);
    expect(result.current.hasPreviousPage).toBe(true);
  });

  it('deve resetar para primeira página', () => {
    const { result } = renderHook(() => 
      usePagination({ data: mockData, itemsPerPage: 10 })
    );

    act(() => {
      result.current.goToPage(3);
    });

    act(() => {
      result.current.resetPage();
    });

    expect(result.current.currentPage).toBe(1);
  });
});
