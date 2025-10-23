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
});
