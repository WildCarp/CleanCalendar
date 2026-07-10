import { useEffect, useState } from 'react';

/**
 * 响应式断点检测
 * 根据不同屏幕宽度返回当前断点
 */
type Breakpoint = 'desktop' | 'tablet' | 'mobile';

export function useResponsive(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>(getBreakpoint());

  useEffect(() => {
    const handler = () => setBp(getBreakpoint());
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return bp;
}

function getBreakpoint(): Breakpoint {
  const w = window.innerWidth;
  if (w >= 1024) return 'desktop';
  if (w >= 768) return 'tablet';
  return 'mobile';
}

/**
 * 判断是否是桌面端
 */
export function useIsDesktop(): boolean {
  return useResponsive() === 'desktop';
}

/**
 * 判断是否是移动端
 */
export function useIsMobile(): boolean {
  return useResponsive() === 'mobile';
}
