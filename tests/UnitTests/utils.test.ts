import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn (className merger)', () => {
  it('deve mesclar classes simples', () => {
    const result = cn('class1', 'class2');
    expect(result).toBe('class1 class2');
  });

  it('deve remover classes duplicadas do Tailwind', () => {
    const result = cn('px-2 py-1', 'px-4');
    expect(result).toBe('py-1 px-4');
  });

  it('deve lidar com condicionais', () => {
    const result = cn('base-class', false && 'hidden-class', 'visible-class');
    expect(result).toBe('base-class visible-class');
  });

  it('deve lidar com undefined e null', () => {
    const result = cn('class1', undefined, null, 'class2');
    expect(result).toBe('class1 class2');
  });

  it('deve mesclar classes de objetos', () => {
    const result = cn('base', { active: true, disabled: false });
    expect(result).toBe('base active');
  });

  it('deve lidar com arrays de classes', () => {
    const result = cn(['class1', 'class2'], 'class3');
    expect(result).toBe('class1 class2 class3');
  });

  it('deve lidar com string vazia', () => {
    const result = cn('', 'class1');
    expect(result).toBe('class1');
  });

  it('deve lidar com múltiplos objetos condicionais', () => {
    const isActive = true;
    const isDisabled = false;
    const result = cn(
      'base',
      { 'bg-blue-500': isActive },
      { 'opacity-50': isDisabled }
    );
    expect(result).toBe('base bg-blue-500');
  });

  it('deve sobrescrever classes conflitantes do Tailwind', () => {
    const result = cn('text-red-500', 'text-blue-500');
    expect(result).toBe('text-blue-500');
  });

  it('deve manter classes não conflitantes', () => {
    const result = cn('text-red-500', 'bg-blue-500');
    expect(result).toBe('text-red-500 bg-blue-500');
  });

  it('deve lidar com classes de tamanho', () => {
    const result = cn('w-4', 'h-4', 'w-8');
    expect(result).toBe('h-4 w-8');
  });

  it('deve lidar com classes de espaçamento', () => {
    const result = cn('p-2', 'p-4');
    expect(result).toBe('p-4');
  });

  it('deve lidar com todas as entradas vazias', () => {
    const result = cn('', undefined, null, false);
    expect(result).toBe('');
  });

  it('deve lidar com classes de hover e focus', () => {
    const result = cn('hover:bg-red-500', 'hover:bg-blue-500');
    expect(result).toBe('hover:bg-blue-500');
  });

  it('deve manter variantes diferentes', () => {
    const result = cn('hover:bg-red-500', 'focus:bg-blue-500');
    expect(result).toBe('hover:bg-red-500 focus:bg-blue-500');
  });
});
