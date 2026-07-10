import React from 'react';
import { useDroppable } from '@dnd-kit/core';

interface DroppableCellProps {
  date: string;
  slotMinutes: number;
  isToday: boolean;
  isHour: boolean;
  style?: React.CSSProperties;
}

export const DroppableCell: React.FC<DroppableCellProps> = ({
  date,
  slotMinutes,
  isToday,
  isHour,
  style,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell-${date}-${slotMinutes}`,
    data: {
      date,
      slotMinutes,
      type: 'grid-cell',
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 relative transition-colors duration-100 border-r
        ${isHour ? 'border-cc-border-default' : 'border-cc-border-subtle'}
        ${isToday ? 'bg-cc-grid-today' : ''}
        ${isOver ? '!bg-cc-accent-subtle' : ''}`}
      style={{
        borderRightColor: isOver ? 'var(--border-accent)' : undefined,
        boxShadow: isOver ? 'inset 0 0 0 1px var(--border-accent)' : undefined,
        ...style,
      }}
      data-date={date}
      data-slot-minutes={slotMinutes}
    />
  );
};
