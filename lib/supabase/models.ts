export interface Board {
  id: string;
  title: string;
  description: string | null;
  color: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Column {
  id: string;
  board_id: string;
  title: string;
  sort_order: number;
  created_at: string;
  user_id: string;
}

export type ColumnWithTasks = Column & {
  tasks: Task[];
};

export interface Label {
  id: string;
  board_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Task {
  id: string;
  column_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: 'low' | 'medium' | 'high';
  assignee?: string | null;
  attachment_url?: string | null;
  sort_order: number;
  created_at: string;
  labels?: Label[];
}

export interface BoardMember {
  id: string;
  board_id: string;
  user_id: string | null;
  external_user_id?: string | null;
  user_email?: string | null;
  role: 'owner' | 'member' | 'viewer';
  created_at: string;
}

export interface AppUser {
  id: string;
  username?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  fullName?: string | null;
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string | null;
  content: string;
  created_at: string;
  user?: AppUser; // Optional for when we join with users table or fetch separately
}
