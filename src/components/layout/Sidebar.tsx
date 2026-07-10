import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { useTagGroupStore } from '../../stores/useTagGroupStore';
import { useTaskStore } from '../../stores/useTaskStore';
import { useUIStore } from '../../stores/useUIStore';

const EMOJI_LIST = ['📋', '💼', '📚', '🏃', '🎮', '🍽', '💤', '🎯', '🎵', '✈', '🏠', '💡', '📝', '🔧', '❤', '🌟'];
const COLOR_LIST = ['#6c7aef', '#e5484d', '#27a644', '#e5a83e', '#f57c00', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

export const Sidebar: React.FC = () => {
  const { tagGroups, selectedTagGroupId, select: selectGroup, create: createGroup, update: updateGroup } = useTagGroupStore();
  const { tasks, selectedTaskId, select: selectTask } = useTaskStore();
  const sidebarOpen = useUIStore(s => s.sidebarOpen);
  const openCreateTask = useUIStore(s => s.openCreateTask);
  const showToast = useUIStore(s => s.showToast);

  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  // 创建标签组弹窗
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createEmoji, setCreateEmoji] = useState('📌');
  const [createColor, setCreateColor] = useState('#6c7aef');
  const [createIsWork, setCreateIsWork] = useState(false);

  const unscheduledTasks = tasks.filter(t => t.status === 'unscheduled');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  const toggleExpand = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId); else next.add(groupId);
      return next;
    });
  };

  const handleCreateGroup = async () => {
    if (!createName.trim()) {
      showToast('请输入标签组名称', 'warning');
      return;
    }
    const group = await createGroup({ name: createName.trim(), color: createColor, emoji: createEmoji, isWork: createIsWork });
    showToast(`✅ 已创建标签组「${group.name}」`, 'success');
    setShowCreateGroup(false);
    setCreateName('');
    setCreateEmoji('📌');
    setCreateColor('#6c7aef');
    setCreateIsWork(false);
  };

  const handleEditGroup = (id: string, name: string) => {
    setEditingGroup(id);
    setNewGroupName(name);
  };

  const handleSaveGroup = async (id: string) => {
    if (newGroupName.trim()) {
      await updateGroup(id, { name: newGroupName.trim() });
    }
    setEditingGroup(null);
  };

  const handleDeleteGroup = async (id: string) => {
    await useTagGroupStore.getState().remove(id);
    showToast('🗑️ 标签组已删除', 'info');
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
          <Button variant="subtle" onClick={() => setShowCreateGroup(true)}>+</Button>
        </div>

        {/* 创建标签组内嵌表单 */}
        {showCreateGroup && (
          <div className="mb-2 p-2 bg-cc-surface border border-cc-border-default rounded-cc-md flex flex-col gap-2">
            <input
              className="px-[6px] py-[4px] text-body bg-cc-canvas text-cc-text-primary border border-cc-border-default rounded-cc-sm outline-none"
              value={createName}
              onChange={e => setCreateName(e.target.value)}
              placeholder="标签组名称"
              autoFocus
            />
            <div className="flex gap-1 flex-wrap">
              {EMOJI_LIST.map(e => (
                <button
                  key={e}
                  className={`w-[24px] h-[24px] rounded-cc-sm text-[14px] flex items-center justify-center border ${createEmoji === e ? 'border-cc-accent bg-cc-accent-subtle' : 'border-transparent'}`}
                  onClick={() => setCreateEmoji(e)}
                >{e}</button>
              ))}
            </div>
            <div className="flex gap-1 flex-wrap">
              {COLOR_LIST.map(c => (
                <button
                  key={c}
                  className={`w-[20px] h-[20px] rounded-cc-full border-2 ${createColor === c ? 'border-cc-text-primary' : 'border-transparent'}`}
                  style={{ background: c }}
                  onClick={() => setCreateColor(c)}
                />
              ))}
            </div>
            <label className="flex items-center gap-2 text-caption text-cc-text-tertiary cursor-pointer">
              <input type="checkbox" checked={createIsWork} onChange={e => setCreateIsWork(e.target.checked)} className="accent-cc-accent" />
              工作标签
            </label>
            <div className="flex gap-2">
              <Button variant="success" onClick={handleCreateGroup}>创建</Button>
              <Button variant="ghost" onClick={() => setShowCreateGroup(false)}>取消</Button>
            </div>
          </div>
        )}

        {tagGroups.map(group => (
          <div key={group.id}>
            <div
              className={`flex items-center gap-1 px-[10px] py-[8px] rounded-cc-md cursor-pointer transition-colors duration-100 group
                ${selectedTagGroupId === group.id ? 'bg-cc-accent-subtle text-cc-text-primary' : 'text-cc-text-secondary hover:bg-cc-surface-hover'}`}
            >
              <span
                className="text-[12px] text-cc-text-disabled w-[22px] h-[22px] flex items-center justify-center cursor-pointer hover:bg-cc-surface-hover rounded-cc-sm flex-shrink-0 select-none"
                onClick={(e) => { e.stopPropagation(); toggleExpand(group.id); }}
              >
                {expandedGroups.has(group.id) ? '▾' : '▸'}
              </span>
              <span
                className="flex-1 flex items-center gap-2"
                onClick={() => selectGroup(group.id === selectedTagGroupId ? null : group.id)}
                onDoubleClick={() => !group.isDefault && handleEditGroup(group.id, group.name)}
              >
                <span className="w-[10px] h-[10px] rounded-cc-full flex-shrink-0" style={{ background: group.color }} />
                {editingGroup === group.id ? (
                  <input
                    className="flex-1 bg-cc-surface border border-cc-border-default rounded-cc-sm px-1 py-0 text-body outline-none min-w-0"
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
              </span>
              {!group.isDefault && selectedTagGroupId === group.id && (
                <button
                  className="hidden group-hover:inline text-[10px] text-cc-text-disabled hover:text-cc-error px-1"
                  onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }}
                  title="删除标签组"
                >✕</button>
              )}
            </div>

            {/* 标签组下的任务（折叠展开） */}
            {expandedGroups.has(group.id) && tasks.filter(t => t.tagGroupId === group.id && t.status !== 'completed').map(task => (
              <div
                key={task.id}
                className={`pl-9 pr-[10px] py-[6px] text-body text-cc-text-tertiary cursor-pointer rounded-cc-sm whitespace-nowrap overflow-hidden text-ellipsis hover:bg-cc-surface-hover hover:text-cc-text-secondary
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
            className={`pl-3 pr-[10px] py-[6px] text-body text-cc-text-tertiary cursor-pointer rounded-cc-sm whitespace-nowrap overflow-hidden text-ellipsis hover:bg-cc-surface-hover hover:text-cc-text-secondary
              ${selectedTaskId === task.id ? 'text-cc-text-primary bg-cc-accent-subtle' : ''}`}
            onClick={() => selectTask(task.id === selectedTaskId ? null : task.id)}
          >
            {task.name}
          </div>
        ))}
        {unscheduledTasks.length === 0 && (
          <div className="pl-3 py-[6px] text-caption text-cc-text-disabled">暂无未安排任务</div>
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
            className="pl-3 pr-[10px] py-[6px] text-body text-cc-text-disabled cursor-pointer rounded-cc-sm whitespace-nowrap overflow-hidden text-ellipsis line-through opacity-50 hover:bg-cc-surface-hover"
            onClick={() => selectTask(task.id === selectedTaskId ? null : task.id)}
          >
            ✅ {task.name}
          </div>
        ))}
        {completedTasks.length === 0 && (
          <div className="pl-3 py-[6px] text-caption text-cc-text-disabled">暂无已完成任务</div>
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
