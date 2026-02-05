"use client";
import { useUser } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import {
    boardDataService,
    boardMemberService,
    boardService,
    columnService,
    taskService,
} from "../services";
import {
    AppUser,
    Board,
    BoardMember,
    ColumnWithTasks,
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

  useEffect(() => {
    loadBoard(true);
  }, [loadBoard]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

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
    }
  ) {
    try {
      const newTask = await taskService.createTask(supabase!, {
        title: taskData.title,
        description: taskData.description || null,
        due_date: taskData.dueDate || null,
        attachment_url: taskData.attachmentUrl || null,
        column_id: columnId,
        sort_order:
          columns.find((col) => col.id === columnId)?.tasks.length || 0,
        priority: taskData.priority || "medium",
      });

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
    }
  ) {
    try {
      const updatedTask = await taskService.updateTask(supabase!, taskId, {
        title: updates.title,
        description: updates.description ?? null,
        due_date: updates.dueDate ?? null,
        attachment_url: updates.attachmentUrl ?? null,
        priority: updates.priority,
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
    }) {
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
  };
}
