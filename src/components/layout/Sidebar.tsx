import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { useTagGroupStore } from '../../stores/useTagGroupStore';
import { useTaskStore } from '../../stores/useTaskStore';
import { useUIStore } from '../../stores/useUIStore';
import { useSettingsStore } from '../../stores/useSettingsStore';

export const Sidebar: React.FC = () => {
  const { tagGroups, selectedTagGroupId, select: selectGroup, create: createGroup } = useTagGroupStore();
  const { tasks, selectedTaskId, select: selectTask } = useTaskStore();
  const sidebarOpen = useUIStore(s => s.sidebarOpen);
  const openCreateTask = useUIStore(s => s.openCreateTask);
  const showToast = useUIStore(s => s.showToast);

  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');

  const unscheduledTasks = tasks.filter(t => t.status === 'unscheduled');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  const handleCreateGroup = async () => {
    const group = await createGroup({ name: '新标签组', color: '#6c7aef', emoji: '📌' });
    showToast(`✅ 已创建标签组「${group.name}」`, 'success');
  };

  const handleEditGroup = (id: string, name: string) => {
    setEditingGroup(id);
    setNewGroupName(name);
  };

  const handleSaveGroup = async (id: string) => {
    if (newGroupName.trim()) {
      await useTagGroupStore.getState().update(id, { name: newGroupName.trim() });
    }
    setEditingGroup(null);
  };

  return (
    <div
      className={`w-sidebar min-w-sidebar bg-cc-panel border-r border-cc-border-default flex flex-col overflow-y-auto flex-shrink-0
        transition-all duration-[220ms] ${sidebarOpen ? '' : 'ml-[-240px] opacity-0 pointer-events-none'}`}
    >
      {/* 标签组 */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-caption-em text-cc-text-tertiary tracking-[0.02em]">标签组</span>
          <Button variant="subtle" onClick={handleCreateGroup}>+</Button>
        </div>

        {tagGroups.map(group => (
          <div key={group.id}>
            <div
              className={`flex items-center gap-2 px-[10px] py-[5px] rounded-cc-md cursor-pointer transition-colors duration-100
                ${selectedTagGroupId === group.id ? 'bg-cc-accent-subtle text-cc-text-primary' : 'text-cc-text-secondary hover:bg-cc-surface-hover'}`}
              onClick={() => selectGroup(group.id === selectedTagGroupId ? null : group.id)}
              onDoubleClick={() => !group.isDefault && handleEditGroup(group.id, group.name)}
            >
              <span className="w-[10px] h-[10px] rounded-cc-full flex-shrink-0" style={{ background: group.color }} />
              {editingGroup === group.id ? (
                <input
                  className="flex-1 bg-cc-surface border border-cc-border-default rounded-cc-sm px-1 py-0 text-body outline-none"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  onBlur={() => handleSaveGroup(group.id)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveGroup(group.id)}
                  autoFocus
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <span className="text-body-em flex-1 truncate">{group.emoji} {group.name}</span>
              )}
              {group.isWork && <span className="text-micro text-cc-text-tertiary">💼</span>}
            </div>

            {/* 标签组下的任务 */}
            {tasks.filter(t => t.tagGroupId === group.id && t.status !== 'completed').map(task => (
              <div
                key={task.id}
                className={`pl-7 pr-[10px] py-1 text-body text-cc-text-tertiary cursor-pointer rounded-cc-sm whitespace-nowrap overflow-hidden text-ellipsis hover:bg-cc-surface-hover hover:text-cc-text-secondary
                  ${selectedTaskId === task.id ? 'text-cc-text-primary bg-cc-accent-subtle' : ''}`}
                onClick={() => selectTask(task.id === selectedTaskId ? null : task.id)}
              >
                {task.name}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="h-[1px] bg-cc-border-subtle mx-3 my-2" />

      {/* 未安排 */}
      <div className="px-3 pb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-caption-em text-cc-text-tertiary tracking-[0.02em]">未安排</span>
          {unscheduledTasks.length > 0 && (
            <span className="text-micro text-cc-text-tertiary">{unscheduledTasks.length}</span>
          )}
        </div>
        {unscheduledTasks.map(task => (
          <div
            key={task.id}
            className={`pl-3 pr-[10px] py-1 text-body text-cc-text-tertiary cursor-pointer rounded-cc-sm whitespace-nowrap overflow-hidden text-ellipsis hover:bg-cc-surface-hover hover:text-cc-text-secondary
              ${selectedTaskId === task.id ? 'text-cc-text-primary bg-cc-accent-subtle' : ''}`}
            onClick={() => selectTask(task.id === selectedTaskId ? null : task.id)}
          >
            {task.name}
          </div>
        ))}
        {unscheduledTasks.length === 0 && (
          <div className="pl-3 py-1 text-caption text-cc-text-disabled">暂无未安排任务</div>
        )}
      </div>

      <div className="h-[1px] bg-cc-border-subtle mx-3 my-2" />

      {/* 已完成 */}
      <div className="px-3 pb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-caption-em text-cc-text-tertiary tracking-[0.02em]">已完成</span>
        </div>
        {completedTasks.map(task => (
          <div
            key={task.id}
            className="pl-3 pr-[10px] py-1 text-body text-cc-text-disabled cursor-pointer rounded-cc-sm whitespace-nowrap overflow-hidden text-ellipsis line-through opacity-50 hover:bg-cc-surface-hover"
            onClick={() => selectTask(task.id === selectedTaskId ? null : task.id)}
          >
            ✅ {task.name}
          </div>
        ))}
        {completedTasks.length === 0 && (
          <div className="pl-3 py-1 text-caption text-cc-text-disabled">暂无已完成任务</div>
        )}
      </div>

      {/* 新建任务按钮 */}
      <div className="px-3 pb-4 mt-auto">
        <button
          className="w-full py-[6px] bg-[rgba(39,166,68,0.12)] text-[#27a644] border border-[rgba(39,166,68,0.20)]
            rounded-cc-md text-body-em cursor-pointer transition-all duration-120 hover:bg-[rgba(39,166,68,0.20)]
            active:scale-[0.97]"
          onClick={openCreateTask}
        >
          + 新建任务
        </button>
      </div>
    </div>
  );
};
