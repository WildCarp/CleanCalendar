import { useState, useEffect } from 'react';
import type { Breakpoint } from '../types';

/** 响应式断点检测 */
export function useResponsive(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>('desktop');

  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      if (w >= 1024) setBp('desktop');
      else if (w >= 768) setBp('tablet');
      else setBp('mobile');
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return bp;
}
