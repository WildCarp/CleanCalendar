import React from 'react';
import { useDroppable } from '@dnd-kit/core';

interface DroppableCellProps {
  date: string;
  slotMinutes: number;
  style?: React.CSSProperties;
}

/**
 * 纯逻辑释放目标——无任何视觉样式。
 * 网格线由父级 CSS background 绘制。
 */
export const DroppableCell: React.FC<DroppableCellProps> = ({
  date,
  slotMinutes,
  style,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell-${date}-${slotMinutes}`,
    data: { date, slotMinutes, type: 'grid-cell' },
  });

  return (
    <div
      ref={setNodeRef}
      className="flex-shrink-0 relative"
      style={{
        outline: isOver ? '1px solid var(--border-accent)' : undefined,
        backgroundColor: isOver ? 'var(--accent-subtle)' : undefined,
        ...style,
      }}
      data-date={date}
      data-slot-minutes={slotMinutes}
    />
  );
};
