'use client';

import { useState, useEffect } from 'react';
import { Folder, Plus, X, Check, Trash2 } from 'lucide-react';
import { getUserId } from '@/lib/auth';

interface Group {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  _count: {
    vocabulary: number;
  };
}

interface GroupManagerProps {
  selectedGroup: string | null;
  onGroupChange: (groupId: string | null) => void;
}

export default function GroupManager({ selectedGroup, onGroupChange }: GroupManagerProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#6B7280');
  const [loading, setLoading] = useState(false);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const colors = [
    '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280'
  ];

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups', {
        headers: {
          'x-user-id': getUserId()
        }
      });
      if (response.ok) {
        const data = await response.json();
        setGroups(data);
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group? Words in this group will not be deleted.')) {
      return;
    }

    try {
      const response = await fetch(`/api/groups?id=${groupId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': getUserId()
        }
      });

      if (response.ok) {
        setGroups(groups.filter(g => g.id !== groupId));
        if (selectedGroup === groupId) {
          onGroupChange(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete group:', error);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': getUserId()
        },
        body: JSON.stringify({
          name: newGroupName,
          color: newGroupColor
        })
      });

      if (response.ok) {
        const newGroup = await response.json();
        setGroups([...groups, { ...newGroup, _count: { vocabulary: 0 } }]);
        setNewGroupName('');
        setShowNewGroup(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create group');
      }
    } catch (error) {
      console.error('Failed to create group:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Word Groups</h3>
        <button
          onClick={() => setShowNewGroup(!showNewGroup)}
          className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-sm"
        >
          {showNewGroup ? <X size={16} /> : <Plus size={16} />}
        </button>
      </div>

      {showNewGroup && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-sm space-y-3">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Group name..."
            className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
          />
          <div className="flex items-center gap-2">
            {colors.map(color => (
              <button
                key={color}
                onClick={() => setNewGroupColor(color)}
                className={`w-6 h-6 rounded-sm border-2 ${
                  newGroupColor === color ? 'border-gray-800 dark:border-gray-200' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <button
            onClick={handleCreateGroup}
            disabled={loading || !newGroupName.trim()}
            className="w-full py-1.5 text-xs bg-gray-800 dark:bg-gray-600 text-white rounded-sm hover:bg-gray-700 dark:hover:bg-gray-500 disabled:opacity-50"
          >
            Create Group
          </button>
        </div>
      )}

      <div className="space-y-1">
        <button
          onClick={() => onGroupChange(null)}
          className={`w-full text-left px-3 py-2 text-sm rounded-sm transition-colors flex items-center justify-between ${
            selectedGroup === null
              ? 'bg-gray-100 text-gray-800 font-medium'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-2">
            <Folder size={14} className="text-gray-400" />
            <span>All Words</span>
          </div>
        </button>

        {groups.map(group => (
          <button
            key={group.id}
            onClick={() => onGroupChange(group.id)}
            className={`w-full text-left px-3 py-2 text-sm rounded-sm transition-colors flex items-center justify-between ${
              selectedGroup === group.id
                ? 'bg-gray-100 text-gray-800 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: group.color }}
              />
              <span>{group.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">{group._count.vocabulary}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteGroup(group.id);
                }}
                className="p-0.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-sm"
                title="Delete group"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}