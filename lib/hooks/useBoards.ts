"use client";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import {
  boardDataService,
  boardService,
  columnService,
  taskService,
} from "../services";
import { Board, ColumnWithTasks, Task } from "../supabase/models";
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

  useEffect(() => {
    if (user) {
      loadBoards();
    }
  }, [user, supabase]);

  async function loadBoards() {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const data = await boardService.getBoards(supabase!, user.id);
      setBoards(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load board.");
    } finally {
      setLoading(false);
    }
  }

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>();

  useEffect(() => {
    if (boardId) {
      loadBoard();
    }
  }, [boardId, supabase]);

  async function loadBoard() {
    if (!boardId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await boardDataService.getBoardWithColumns(
        supabase!,
        boardId
      );
      setBoard(data.board);
      setColumns(data.columsWithTasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load boards.");
    } finally {
      setLoading(false);
    }
  }

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
      assignee?: string;
      dueDate?: string;
      priority: "low" | "medium" | "high";
    }
  ) {
    try {
      const newTask = await taskService.createTask(supabase!, {
        title: taskData.title,
        description: taskData.description || null,
        assignee: taskData.assignee || null,
        due_date: taskData.dueDate || null,
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

  return {
    board,
    columns,
    loading,
    error,
    updateBoard,
    createRealTask,
    setColumns,
    moveTask,
    createColumn,
    updateColumn,
  };
}
