import React from 'react';
import { useDroppable } from '@dnd-kit/core';

interface DroppableCellProps {
  date: string;
  slotMinutes: number;
  isToday: boolean;
  isHour: boolean;
}

export const DroppableCell: React.FC<DroppableCellProps> = ({
  date,
  slotMinutes,
  isToday,
  isHour,
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
      className={`border-r relative transition-colors duration-100
        ${isHour ? 'border-b border-cc-border-default' : 'border-b border-cc-border-subtle'}
        ${isToday ? 'bg-cc-grid-today' : ''}
        ${isOver ? 'bg-cc-accent-subtle border-accent' : ''}`}
      style={{
        borderColor: isOver ? 'var(--border-accent)' : undefined,
        boxShadow: isOver ? 'inset 0 0 0 1px var(--border-accent)' : undefined,
      }}
      data-date={date}
      data-slot-minutes={slotMinutes}
    />
  );
};
