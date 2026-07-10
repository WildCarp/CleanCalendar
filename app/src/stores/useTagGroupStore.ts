// ============================================================
// CleanCalendar — 标签组 Store
// ============================================================

import { create } from 'zustand';
import type { TagGroup } from '../types';
import { getAllTagGroups, saveTagGroup, deleteTagGroup } from '../utils/db';
import { generateId, now } from '../utils/id';

interface TagGroupState {
  groups: TagGroup[];
  loaded: boolean;

  load: () => Promise<void>;
  create: (data: Partial<TagGroup>) => Promise<TagGroup>;
  update: (id: string, data: Partial<TagGroup>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  reorder: (fromIndex: number, toIndex: number) => void;
}

export const useTagGroupStore = create<TagGroupState>((set, get) => ({
  groups: [],
  loaded: false,

  load: async () => {
    const groups = await getAllTagGroups();
    // 如果没有默认标签组，创建
    if (!groups.find(g => g.isDefault)) {
      const defaultGroup: TagGroup = {
        id: generateId(),
        name: '默认',
        color: '#6b7280',
        emoji: '📋',
        isWork: false,
        isDefault: true,
        createdAt: now(),
        sortOrder: 0,
      };
      await saveTagGroup(defaultGroup);
      groups.unshift(defaultGroup);
    }
    set({ groups, loaded: true });
  },

  create: async (data) => {
    const group: TagGroup = {
      id: generateId(),
      name: data.name || '新标签组',
      color: data.color || '#6b7280',
      emoji: data.emoji || '📌',
      isWork: data.isWork ?? false,
      isDefault: false,
      createdAt: now(),
      sortOrder: get().groups.length,
    };
    await saveTagGroup(group);
    set(state => ({ groups: [...state.groups, group] }));
    return group;
  },

  update: async (id, data) => {
    const groups = get().groups.map(g =>
      g.id === id ? { ...g, ...data } : g
    );
    const updated = groups.find(g => g.id === id);
    if (updated) await saveTagGroup(updated);
    set({ groups });
  },

  remove: async (id) => {
    const group = get().groups.find(g => g.id === id);
    if (!group || group.isDefault) return;
    await deleteTagGroup(id);
    set(state => ({ groups: state.groups.filter(g => g.id !== id) }));
  },

  reorder: (fromIndex, toIndex) => {
    const groups = [...get().groups];
    const [moved] = groups.splice(fromIndex, 1);
    groups.splice(toIndex, 0, moved);
    groups.forEach((g, i) => { g.sortOrder = i; });
    groups.forEach(g => saveTagGroup(g));
    set({ groups });
  },
}));
