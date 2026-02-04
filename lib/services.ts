import { SupabaseClient } from "@supabase/supabase-js";
import { Board, BoardMember, Column, Task } from "./supabase/models";

export const boardService = {
  async getBoard(supabase: SupabaseClient, boardId: string): Promise<Board> {
    const { data, error } = await supabase
      .from("boards")
      .select("*")
      .eq("id", boardId)
      .single();
    if (error) throw error;

    return data;
  },

  async getBoardsForUser(
    supabase: SupabaseClient,
    userId: string
  ): Promise<Board[]> {
    const { data: ownedBoards, error: ownedError } = await supabase
      .from("boards")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (ownedError) throw ownedError;

    const { data: memberRows, error: memberError } = await supabase
      .from("board_members")
      .select("board_id")
      .eq("user_id", userId);

    if (memberError) throw memberError;

    const memberBoardIds =
      memberRows?.map((row) => row.board_id).filter(Boolean) ?? [];

    if (memberBoardIds.length === 0) {
      return ownedBoards || [];
    }

    const { data: sharedBoards, error: sharedError } = await supabase
      .from("boards")
      .select("*")
      .in("id", memberBoardIds)
      .order("created_at", { ascending: false });

    if (sharedError) throw sharedError;

    const merged = [...(ownedBoards || []), ...(sharedBoards || [])];
    const seen = new Set<string>();
    return merged.filter((board) => {
      if (seen.has(board.id)) return false;
      seen.add(board.id);
      return true;
    });
  },

  async createBoard(
    supabase: SupabaseClient,

    board: Omit<Board, "id" | "created_at" | "updated_at">
  ): Promise<Board> {
    const { data, error } = await supabase
      .from("boards")
      .insert(board)
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  async updateBoard(
    supabase: SupabaseClient,

    boardId: string,
    updates: Partial<Board>
  ): Promise<Board> {
    const { data, error } = await supabase
      .from("boards")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", boardId)
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  async deleteBoard(supabase: SupabaseClient, boardId: string) {
    const { error } = await supabase.from("boards").delete().eq("id", boardId);
    if (error) throw error;
  },
};

export const columnService = {
  async getColumns(
    supabase: SupabaseClient,
    boardId: string
  ): Promise<Column[]> {
    const { data, error } = await supabase
      .from("columns")
      .select("*")
      .eq("board_id", boardId)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    return data || [];
  },

  async createColumn(
    supabase: SupabaseClient,

    column: Omit<Column, "id" | "created_at">
  ): Promise<Column> {
    const { data, error } = await supabase
      .from("columns")
      .insert(column)
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  async updateColumnTitle(
    supabase: SupabaseClient,
    columnId: string,
    title: string
  ): Promise<Column> {
    const { data, error } = await supabase
      .from("columns")
      .update({ title })
      .eq("id", columnId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

export const taskService = {
  async getTasksByBoard(
    supabase: SupabaseClient,
    boardId: string
  ): Promise<Task[]> {
    const { data, error } = await supabase
      .from("tasks")
      .select(`*, columns!inner(board_id)`)
      .eq("columns.board_id", boardId)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    return data || [];
  },

  async createTask(
    supabase: SupabaseClient,

    task: Omit<Task, "id" | "created_at" | "updated_at">
  ): Promise<Task> {
    const { data, error } = await supabase
      .from("tasks")
      .insert(task)
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  async moveTask(
    supabase: SupabaseClient,
    taskId: string,
    newColumnId: string,
    newOrder: number
  ) {
    const { data, error } = await supabase
      .from("tasks")
      .update({
        column_id: newColumnId,
        sort_order: newOrder,
      })
      .eq("id", taskId);

    if (error) throw error;

    return data;
  },

  async updateTask(
    supabase: SupabaseClient,
    taskId: string,
    updates: Partial<Omit<Task, "id" | "created_at">>
  ): Promise<Task> {
    const { data, error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", taskId)
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  async deleteTask(supabase: SupabaseClient, taskId: string) {
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (error) throw error;
  },
};

export const boardMemberService = {
  async getMembers(
    supabase: SupabaseClient,
    boardId: string
  ): Promise<BoardMember[]> {
    const { data, error } = await supabase
      .from("board_members")
      .select("*")
      .eq("board_id", boardId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return data || [];
  },

  async inviteMember(
    supabase: SupabaseClient,
    member: Omit<
      BoardMember,
      "id" | "created_at" | "user_email" | "user_id"
    > & { user_id?: string | null; external_user_id?: string | null }
  ): Promise<BoardMember> {
    const { data, error } = await supabase
      .from("board_members")
      .insert({
        user_id: member.user_id ?? null,
        external_user_id: member.external_user_id ?? member.user_id ?? null,
        board_id: member.board_id,
        role: member.role,
        user_email: member.user_email ?? null,
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  async removeMember(supabase: SupabaseClient, memberId: string) {
    const { error } = await supabase
      .from("board_members")
      .delete()
      .eq("id", memberId);
    if (error) throw error;
  },
};

export const boardDataService = {
  async getBoardWithColumns(supabase: SupabaseClient, boardId: string) {
    const [board, columns] = await Promise.all([
      boardService.getBoard(supabase, boardId),
      columnService.getColumns(supabase, boardId),
    ]);
    if (!board) throw new Error("Board not found");

    const tasks = await taskService.getTasksByBoard(supabase, boardId);

    const columsWithTasks = columns.map((column) => ({
      ...column,
      tasks: tasks.filter((task) => task.column_id === column.id),
    }));

    return {
      board,
      columsWithTasks,
    };
  },

  async createBoardWithDefaultColumns(
    supabase: SupabaseClient,
    boardData: {
      title: string;
      description?: string;
      color?: string;
      userId: string;
    }
  ) {
    const board = await boardService.createBoard(supabase, {
      title: boardData.title,
      description: boardData.description || null,
      color: boardData.color || "bg-blue-500",
      user_id: boardData.userId,
    });

    const defaultColumns = [
      { title: "To Do", sort_order: 0 },
      { title: "In Progress", sort_order: 1 },
      { title: "Review", sort_order: 2 },
      { title: "Done", sort_order: 3 },
    ];

    await Promise.all(
      defaultColumns.map((column) =>
        columnService.createColumn(supabase, {
          ...column,
          board_id: board.id,
          user_id: boardData.userId,
        })
      )
    );

    return board;
  },
};
