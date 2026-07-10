import { create } from 'zustand';
import { db } from '../utils/db';
import { generateId } from '../utils/id';
import type { TagGroup } from '../types';

interface TagGroupStore {
  tagGroups: TagGroup[];
  selectedTagGroupId: string | null;
  loading: boolean;

  load: () => Promise<void>;
  create: (data: Partial<TagGroup>) => Promise<TagGroup>;
  update: (id: string, data: Partial<TagGroup>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  select: (id: string | null) => void;
  reorder: (ids: string[]) => Promise<void>;
}

export const useTagGroupStore = create<TagGroupStore>((set, get) => ({
  tagGroups: [],
  selectedTagGroupId: null,
  loading: true,

  load: async () => {
    const groups = await db.tagGroups.orderBy('sortOrder').toArray();
    set({ tagGroups: groups, loading: false });

    // 如果没有默认标签组，创建一个
    if (groups.length === 0) {
      const defaultGroup: TagGroup = {
        id: generateId(),
        name: '默认',
        color: '#6c7aef',
        emoji: '📋',
        isWork: false,
        isDefault: true,
        createdAt: Date.now(),
        sortOrder: 0,
      };
      await db.tagGroups.put(defaultGroup);
      set({ tagGroups: [defaultGroup] });
    }
  },

  create: async (data) => {
    const groups = get().tagGroups;
    const newGroup: TagGroup = {
      id: generateId(),
      name: data.name || '新标签组',
      color: data.color || '#6c7aef',
      emoji: data.emoji || '📌',
      isWork: data.isWork ?? false,
      isDefault: false,
      createdAt: Date.now(),
      sortOrder: groups.length,
    };
    await db.tagGroups.put(newGroup);
    set({ tagGroups: [...groups, newGroup] });
    return newGroup;
  },

  update: async (id, data) => {
    const groups = get().tagGroups.map(g =>
      g.id === id ? { ...g, ...data } : g,
    );
    const updated = groups.find(g => g.id === id);
    if (updated) {
      await db.tagGroups.put(updated);
      set({ tagGroups: groups });
    }
  },

  remove: async (id) => {
    const group = get().tagGroups.find(g => g.id === id);
    if (!group || group.isDefault) return;

    // 将该标签组的任务移到默认标签组
    const defaultGroup = get().tagGroups.find(g => g.isDefault);
    if (defaultGroup) {
      const tasks = await db.tasks.where('tagGroupId').equals(id).toArray();
      for (const task of tasks) {
        task.tagGroupId = defaultGroup.id;
        await db.tasks.put(task);
      }
    }

    await db.tagGroups.delete(id);
    set({
      tagGroups: get().tagGroups.filter(g => g.id !== id),
      selectedTagGroupId: get().selectedTagGroupId === id ? null : get().selectedTagGroupId,
    });
  },

  select: (id) => set({ selectedTagGroupId: id }),

  reorder: async (ids) => {
    const groups = get().tagGroups;
    const updated = ids.map((id, i) => {
      const g = groups.find(gg => gg.id === id);
      return g ? { ...g, sortOrder: i } : null;
    }).filter(Boolean) as TagGroup[];

    for (const g of updated) {
      await db.tagGroups.put(g);
    }
    set({ tagGroups: updated });
  },
}));
