"use client";
import { useUser } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import {
  boardDataService,
  boardMemberService,
  boardService,
  columnService,
  taskService,
  labelService
} from "../services";
import {
  AppUser,
  Board,
  BoardMember,
  ColumnWithTasks,
  Comment,
  Label,
  Task,
} from "../supabase/models";
import { useSupabase } from "../supabase/SupabaseProvider";

export type BoardWithTaskCount = Board & { taskCount: number };

export function useBoards() {
  const { user } = useUser();
  const { supabase } = useSupabase();
  const [boards, setBoards] = useState<Board[]>([]);
  const [boardTaskCounts, setBoardTaskCounts] = useState<
    Record<string, number>
  >({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>();

  const loadBoards = useCallback(async () => {
    if (!user || !supabase) return;
    try {
      setLoading(true);
      setError(null);
      const data = await boardService.getBoardsForUser(supabase, user.id);
      setBoards(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load board.");
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  useEffect(() => {
    if (!supabase || boards.length === 0) {
      setBoardTaskCounts({});
      return;
    }

    let isMounted = true;

    const fetchTaskCounts = async () => {
      try {
        const counts = await Promise.all(
          boards.map(async (board) => {
            const tasks = await taskService.getTasksByBoard(supabase, board.id);
            return { boardId: board.id, count: tasks.length };
          })
        );

        if (!isMounted) return;

        setBoardTaskCounts(
          counts.reduce((acc, { boardId, count }) => {
            acc[boardId] = count;
            return acc;
          }, {} as Record<string, number>)
        );
      } catch (err) {
        console.error("Failed to load task counts", err);
      }
    };

    fetchTaskCounts();

    return () => {
      isMounted = false;
    };
  }, [boards, supabase]);

  async function createBoard(boardData: {
    title: string;
    description?: string;
    color?: string;
  }) {
    if (!user) throw new Error("User not authenticated");

    try {
      const newBoard = await boardDataService.createBoardWithDefaultColumns(
        supabase!,
        {
          ...boardData,
          userId: user.id,
        }
      );
      setBoards((prev) => [newBoard, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create board.");
    }
  }

  async function deleteBoard(boardId: string) {
    try {
      await boardService.deleteBoard(supabase!, boardId);
      setBoards((prev) => prev.filter((board) => board.id !== boardId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete board.");
    }
  }

  const boardsWithTaskCount: BoardWithTaskCount[] = boards.map(
    (board: Board) => ({
      ...board,
      taskCount: boardTaskCounts[board.id] ?? 0,
    })
  );

  return {
    boards,
    boardsWithTaskCount,
    boardTaskCounts,
    loading,
    error,
    createBoard,
    deleteBoard,
  };
}

export function useBoard(boardId: string) {
  const { supabase } = useSupabase();
  const { user } = useUser();
  const [board, setBoard] = useState<Board | null>(null);
  const [columns, setColumns] = useState<ColumnWithTasks[]>([]);
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>();

  const loadBoard = useCallback(async (withLoading = false) => {
    if (!boardId || !supabase) return;
    try {
      if (withLoading) setLoading(true);
      setError(null);
      const data = await boardDataService.getBoardWithColumns(
        supabase,
        boardId
      );
      setBoard(data.board);
      setColumns(data.columsWithTasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load boards.");
    } finally {
      if (withLoading) setLoading(false);
    }
  }, [boardId, supabase]);

  const loadMembers = useCallback(async () => {
    if (!boardId || !supabase) return;
    try {
      const data = await boardMemberService.getMembers(supabase, boardId);
      setMembers(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load board members."
      );
    }
  }, [boardId, supabase]);

  const loadLabels = useCallback(async () => {
    if (!boardId || !supabase) return;
    try {
      const data = await labelService.getLabels(supabase, boardId);
      if (data.length === 0) {
        // Auto-initialize defaults if no labels exist
        const defaults = [
          { name: 'Bug', color: '#ef4444' },
          { name: 'Feature', color: '#3b82f6' },
          { name: 'Enhancement', color: '#22c55e' },
          { name: 'Documentation', color: '#f97316' },
          { name: 'High Priority', color: '#ec4899' },
        ];
        const newLabels = [];
        for (const label of defaults) {
          try {
            const created = await labelService.createLabel(supabase, boardId, label.name, label.color);
            newLabels.push(created);
          } catch (e) {
            console.error("Failed to auto-create label", label.name, e);
          }
        }
        setLabels(newLabels.filter(l => l !== undefined) as any[]);
      } else {
        // Deduplicate labels based on name and board_id (though we just check by ID usually, but here name/color to be safe if duplicates exist)
        // Or simply by ID if the DB returns distinct rows.
        // Assuming the "double" issue is due to duplicates in DB, we filter by unique ID here first.
        const uniqueLabels = Array.from(new Map(data.map(item => [item.id, item])).values());

        // If the user says "twice", maybe we have 2 rows with same name but different IDs?
        // Let's deduce unique by ID first.
        // If duplicates exist in DB, they have different IDs. We should dedupe by NAME to clean up UI.
        const uniqueByName = Array.from(new Map(uniqueLabels.map(item => [item.name, item])).values());

        setLabels(uniqueByName);
      }
    } catch (err) {
      console.error("Failed to load labels", err);
    }
  }, [boardId, supabase]);

  async function createLabel(name: string, color: string) {
    if (!board || !supabase) return;
    try {
      const newLabel = await labelService.createLabel(supabase, board.id, name, color);
      setLabels(prev => [...prev, newLabel]);
      return newLabel;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create label");
    }
  }

  async function deleteLabel(labelId: string) {
    if (!board || !supabase) return;
    try {
      await labelService.deleteLabel(supabase, labelId);
      setLabels(prev => prev.filter(l => l.id !== labelId));
      loadBoard(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete label");
    }
  }

  useEffect(() => {
    loadBoard(true);
  }, [loadBoard]);

  useEffect(() => {
    loadMembers();
    loadLabels();
  }, [loadMembers, loadLabels]);

  useEffect(() => {
    if (!supabase || !boardId) return;

    const channel = supabase
      .channel(`board-realtime-${boardId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "boards", filter: `id=eq.${boardId}` },
        () => {
          loadBoard(false);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "columns",
          filter: `board_id=eq.${boardId}`,
        },
        () => {
          loadBoard(false);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload) => {
          const columnId =
            (payload as { new?: { column_id?: string } }).new?.column_id ||
            (payload as { old?: { column_id?: string } }).old?.column_id;
          if (!columnId) return;
          if (columns.some((column) => column.id === columnId)) {
            loadBoard(false);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "board_members",
          filter: `board_id=eq.${boardId}`,
        },
        () => {
          loadMembers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, boardId, columns, loadBoard, loadMembers]);

  async function updateBoard(boardId: string, updates: Partial<Board>) {
    try {
      const updatedBoard = await boardService.updateBoard(
        supabase!,
        boardId,
        updates
      );
      setBoard(updatedBoard);
      return updatedBoard;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update the board."
      );
    }
  }

  async function createRealTask(
    columnId: string,
    taskData: {
      title: string;
      description?: string;
      dueDate?: string;
      priority: "low" | "medium" | "high";
      attachmentUrl?: string | null;
      assignee?: string | null;
      labelIds?: string[];
    }
  ) {
    try {
      const newTask = await taskService.createTask(
        supabase!,
        columnId,
        taskData.title,
        taskData.description,
        taskData.dueDate,
        taskData.priority,
        taskData.attachmentUrl,
        taskData.assignee,
        taskData.labelIds
      );

      setColumns((prev) =>
        prev.map((col) =>
          col.id === columnId ? { ...col, tasks: [...col.tasks, newTask] } : col
        )
      );
      return newTask;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create the task."
      );
    }
  }

  async function moveTask(
    taskId: string,
    newColumnId: string,
    newOrder: number
  ) {
    try {
      await taskService.moveTask(supabase!, taskId, newColumnId, newOrder);

      setColumns((prev) => {
        const newColumns = [...prev];

        //Find and remove task from the old column
        let tasktoMove: Task | null = null;
        for (const col of newColumns) {
          const taskIndex = col.tasks.findIndex((task) => task.id === taskId);
          if (taskIndex !== -1) {
            tasktoMove = col.tasks[taskIndex];
            col.tasks.splice(taskIndex, 1);
            break;
          }
        }

        if (tasktoMove) {
          // Add task to new column
          const targetColumn = newColumns.find((col) => col.id === newColumnId);
          if (targetColumn) {
            targetColumn.tasks.splice(newOrder, 0, tasktoMove);
          }
        }

        return newColumns;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to move the task.");
    }
  }

  async function updateTask(
    taskId: string,
    updates: {
      title?: string;
      description?: string | null;
      dueDate?: string | null;
      priority?: "low" | "medium" | "high";
      attachmentUrl?: string | null;
      assignee?: string | null;
    }
  ) {
    try {
      const updatedTask = await taskService.updateTask(supabase!, taskId, {
        title: updates.title,
        description: updates.description ?? null,
        due_date: updates.dueDate ?? null,
        attachment_url: updates.attachmentUrl ?? null,
        priority: updates.priority,
        assignee: updates.assignee ?? null,
      });

      setColumns((prev) =>
        prev.map((col) =>
          col.id === updatedTask.column_id
            ? {
              ...col,
              tasks: col.tasks.map((task) =>
                task.id === taskId ? { ...task, ...updatedTask } : task
              ),
            }
            : col
        )
      );

      return updatedTask;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task.");
    }
  }

  async function assignLabel(taskId: string, labelId: string) {
    if (!supabase) return;
    try {
      await taskService.assignLabel(supabase, taskId, labelId);
      await loadBoard(false); // Reload board to reflect label changes
    } catch (err) {
      console.error("Failed to assign label", err);
      setError(err instanceof Error ? err.message : "Failed to assign label");
    }
  }

  async function removeLabel(taskId: string, labelId: string) {
    if (!supabase) return;
    try {
      await taskService.removeLabel(supabase, taskId, labelId);
      await loadBoard(false);
    } catch (err) {
      console.error("Failed to remove label", err);
      setError(err instanceof Error ? err.message : "Failed to remove label");
    }
  }

  async function deleteTask(taskId: string) {
    try {
      await taskService.deleteTask(supabase!, taskId);
      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          tasks: col.tasks.filter((task) => task.id !== taskId),
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task.");
    }
  }

  async function createColumn(title: string) {
    if (!board || !user) throw new Error("Board is not loaded");

    try {
      const newColumn = await columnService.createColumn(supabase!, {
        title,
        board_id: board.id,
        sort_order: columns.length,
        user_id: user.id,
      });
      setColumns((prev) => [...prev, { ...newColumn, tasks: [] }]);
      return newColumn;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create column.");
    }
  }

  async function updateColumn(columnId: string, title: string) {
    try {
      const updatedColumn = await columnService.updateColumnTitle(
        supabase!,
        columnId,
        title
      );
      setColumns((prev) =>
        prev.map((col) =>
          col.id === columnId ? { ...col, ...updatedColumn } : col
        )
      );

      return updatedColumn;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create column.");
    }
  }

  async function inviteMember(userId: string) {
    if (!board) throw new Error("Board is not loaded");

    const normalizedUserId = userId.trim();
    if (!normalizedUserId) {
      throw new Error("Invite user ID is required");
    }

    try {
      const newMember = await boardMemberService.inviteMember(supabase!, {
        board_id: board.id,
        external_user_id: normalizedUserId,
        user_id: null,
        role: "member",
      });
      setMembers((prev) => [...prev, newMember]);
      return newMember;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to invite member."
      );
    }
  }

  async function removeMember(memberId: string) {
    try {
      await boardMemberService.removeMember(supabase!, memberId);
      setMembers((prev) => prev.filter((member) => member.id !== memberId));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to remove member."
      );
    }
  }

  async function searchUsers(query: string): Promise<AppUser[]> {
    try {
      const response = await fetch(
        `/api/users/search?q=${encodeURIComponent(query)}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = (await response.json()) as { users: AppUser[] };
      return data.users || [];
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to search users."
      );
      return [];
    }
  }

  return {
    board,
    columns,
    members,
    loading,
    error,
    updateBoard,
    createRealTask,
    setColumns,
    moveTask,
    updateTask,
    deleteTask,
    createColumn,
    updateColumn,
    inviteMember,
    removeMember,
    loadMembers,
    searchUsers,
    async sendInvitation(targetUser: {
      id: string;
      username?: string | null;
      email?: string | null;
      fullName?: string | null;
    }, role: 'viewer' | 'member' | 'owner' = 'member') {
      if (!board || !user) throw new Error("Board is not loaded");
      try {
        setError(null);
        await fetch("/api/invitations/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            invitedUserId: targetUser.id,
            boardId: board.id,
            boardTitle: board.title,
            inviterName: user.username || user.emailAddresses[0]?.emailAddress,
            role,
          }),
        });
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to send invitation."
        );
        return false;
      }
    },
    async updateMemberRole(memberId: string, role: string) {
      if (!board) return;
      try {
        await fetch(`/api/boards/${board.id}/members`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberId, role, boardId: board.id }),
        });
        // Optimistic update
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: role as any } : m));
      } catch (err) {
        console.error("Failed to update member role", err);
        setError("Failed to update member role");
      }
    },
    labels,
    createLabel,
    deleteLabel,
    assignLabel,
    removeLabel,
    loadLabels
  };
}
