"use client";
import NavBar from "@/components/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useBoard } from "@/lib/hooks/useBoards";
import { ColumnWithTasks, Task } from "@/lib/supabase/models";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  rectIntersection,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlertTriangle, Calendar, Loader2, MoreHorizontal, Plus, User } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";

function DroppableColumn({
  column,
  children,
  onCreateTask,
  onEditColumn,
}: {
  column: ColumnWithTasks;
  children: React.ReactNode;
  onCreateTask: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onEditColumn: (column: ColumnWithTasks) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  return (
    <div
      ref={setNodeRef}
      className={`w-full lg:shrink-0 lg:w-80 ${
        isOver ? "bg-blue-50 rounded-lg" : ""
      }`}
    >
      <div
        className={`bf-white rounded-lg shadow-sm border ${
          isOver ? "ring-2 ring-blue-300" : ""
        }`}
      >
        {/* Column Header */}
        <div className="p-3 sm:p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x2 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                {column.title}
              </h3>
              <Badge variant="secondary" className="text-xs shrink-0">
                {column.tasks.length}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0"
              onClick={() => onEditColumn(column)}
            >
              <MoreHorizontal />
            </Button>
          </div>
        </div>
        {/* column content */}
        <div className="p-2">
          {children}{" "}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                className="w-full mt-3 text-gray-500 hover:text-gray-700"
              >
                <Plus />
                Add Task
              </Button>
            </DialogTrigger>

            <DialogContent className="w-[95vw] max-w-[425px] mx-auto">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <p className="text-sm text-gray-600">
                  Add a task to the board{" "}
                </p>
              </DialogHeader>
              <form className="space-y-4" onSubmit={onCreateTask}>
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Enter task title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Enter task description"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Assignee</Label>
                  <Input
                    id="assignee"
                    name="assignee"
                    placeholder="Who should do this ?"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select name="priority" defaultValue="medium">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["low", "medium", "high"].map((priority, key) => (
                        <SelectItem key={key} value={priority}>
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input type="date" id="dueDate" name="dueDate" />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="submit">Create Task</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}

function SortableTask({
  task,
  onEditTask,
}: {
  task: Task;
  onEditTask: (task: Task) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
  });

  const styles = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  function getPriorityColor(priority: "low" | "medium" | "high"): string {
    switch (priority) {
      case "high":
        return "bg-red-500";

      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-yellow-500";
    }
  }

  return (
    <div ref={setNodeRef} style={styles} {...listeners} {...attributes}>
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-3 sm:p-4">
          <div className="space-y-2 sm:space-y-3">
            {/* Task Header */}
            <div className="flex items-start justify-between">
              <h4 className="font-medium text-gray-900 text-sm leading-tight flex-1 min-w-0 pr-2">
                {task.title}
              </h4>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => onEditTask(task)}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
            {/*Task Description */}
            <p className="text-xs text-gray-600 line-clamp-2">
              {task.description || "No description."}
            </p>

            {/* Task Meta */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
                {task.assignee && (
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <User className="h-3 w-3" />
                    <span className="truncate">{task.assignee}</span>
                  </div>
                )}
                {task.due_date && (
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span className="truncate">{task.due_date}</span>
                  </div>
                )}
              </div>
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${getPriorityColor(
                  task.priority
                )}`}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TaskOverlay({ task }: { task: Task }) {
  function getPriorityColor(priority: "low" | "medium" | "high"): string {
    switch (priority) {
      case "high":
        return "bg-red-500";

      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-yellow-500";
    }
  }

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-3 sm:p-4">
        <div className="space-y-2 sm:space-y-3">
          {/* Task Header */}
          <div className="flex items-start justify-between">
            <h4 className="font-medium text-gray-900 text-sm leading-tight flex-1 min-w-0 pr-2">
              {task.title}
            </h4>
          </div>
          {/*Task Description */}
          <p className="text-xs text-gray-600 line-clamp-2">
            {task.description || "No description."}
          </p>

          {/* Task Meta */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
              {task.assignee && (
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <User className="h-3 w-3" />
                  <span className="truncate">{task.assignee}</span>
                </div>
              )}
              {task.due_date && (
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Calendar className="h-3 w-3" />
                  <span className="truncate">{task.due_date}</span>
                </div>
              )}
            </div>
            <div
              className={`w-2 h-2 rounded-full shrink-0 ${getPriorityColor(
                task.priority
              )}`}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();
  const {
    board,
    createColumn,
    updateBoard,
    columns,
    createRealTask,
    setColumns,
    moveTask,
    updateColumn,
    updateTask,
    deleteTask,
    members,
    inviteMember,
    loading,
    error,
  } = useBoard(id);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newColor, setNewColor] = useState("");

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCreatingColumn, setIsCreatingColumn] = useState(false);
  const [isEditingColumn, setIsEditingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [editingColumnTitle, setEditingColumnTitle] = useState("");
  const [editingColumn, setEditingColumn] = useState<ColumnWithTasks | null>(
    null
  );
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteUserId, setInviteUserId] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    assignee: "",
    dueDate: "",
    priority: "medium" as "low" | "medium" | "high",
  });

  const [filters, setFilters] = useState({
    priority: [] as string[],
    assignee: [] as string[],
    dueDate: null as string | null,
  });

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  function openEditTask(task: Task) {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || "",
      assignee: task.assignee || "",
      dueDate: task.due_date || "",
      priority: task.priority,
    });
    setIsEditingTask(true);
  }

  function handleFilterChange(
    type: "priority" | "assignee" | "dueDate",
    value: string | string[] | null
  ) {
    setFilters((prev) => ({
      ...prev,
      [type]: value,
    }));
  }

  function clearFilter() {
    setFilters({
      priority: [] as string[],
      assignee: [] as string[],
      dueDate: null as string | null,
    });
  }

  async function handleUpdateBoard(e: React.FormEvent) {
    e.preventDefault();

    if (!newTitle.trim() || !board) return;

    try {
      await updateBoard(board.id, {
        title: newTitle.trim(),
        color: newColor || board.color,
      });
      setIsEditingTitle(false);
    } catch {}
  }

  async function createTask(taskData: {
    title: string;
    description?: string;
    assignee?: string;
    dueDate?: string;
    priority: "low" | "medium" | "high";
  }) {
    const targetColumn = columns[0];
    if (!targetColumn) {
      throw new Error("No column available to add task");
    }

    await createRealTask(targetColumn.id, taskData);
  }

  async function handleCreateTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const taskData = {
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || undefined,
      assignee: (formData.get("assignee") as string) || undefined,
      dueDate: (formData.get("dueDate") as string) || undefined,
      priority:
        (formData.get("priority") as "low" | "medium" | "high") || "medium",
    };

    if (taskData.title.trim()) {
      await createTask(taskData);

      const trigger = document.querySelector(
        '[data-state="open"'
      ) as HTMLElement;
      if (trigger) trigger.click();
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const taskId = event.active.id as string;
    const task = columns
      .flatMap((col) => col.tasks)
      .find((task) => task.id === taskId);

    if (task) {
      setActiveTask(task);
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const sourceColumn = columns.find((col) =>
      col.tasks.some((task) => task.id === activeId)
    );

    const targetColumn = columns.find((col) =>
      col.tasks.some((task) => task.id === overId)
    );

    if (!sourceColumn || !targetColumn) return;

    if (sourceColumn.id === targetColumn.id) {
      const activeIndex = sourceColumn.tasks.findIndex(
        (task) => task.id === activeId
      );

      const overIndex = targetColumn.tasks.findIndex(
        (task) => task.id === overId
      );

      if (activeIndex !== overIndex) {
        setColumns((prev: ColumnWithTasks[]) => {
          const newColumns = [...prev];
          const column = newColumns.find((col) => col.id === sourceColumn.id);
          if (column) {
            const tasks = [...column.tasks];
            const [removed] = tasks.splice(activeIndex, 1);
            tasks.splice(overIndex, 0, removed);
            column.tasks = tasks;
          }

          return newColumns;
        });
      }
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    const targetColumn = columns.find((col) => col.id === overId);
    if (targetColumn) {
      const sourceColumn = columns.find((col) =>
        col.tasks.some((task) => task.id === taskId)
      );
      if (sourceColumn && sourceColumn.id !== targetColumn.id) {
        await moveTask(taskId, targetColumn.id, targetColumn.tasks.length);
      }
    } else {
      // check to see if were dropping on another task
      const sourceColumn = columns.find((col) =>
        col.tasks.some((task) => task.id === taskId)
      );
      const targetColumn = columns.find((col) =>
        col.tasks.some((task) => task.id === overId)
      );
      if (sourceColumn && targetColumn) {
        const oldIndex = sourceColumn.tasks.findIndex(
          (task) => task.id === taskId
        );

        const newIndex = targetColumn.tasks.findIndex(
          (task) => task.id === overId
        );

        if (oldIndex !== newIndex) {
          await moveTask(taskId, targetColumn.id, newIndex);
        }
      }
    }
  }

  async function handleCreateColumn(e: React.FormEvent) {
    e.preventDefault();

    if (!newColumnTitle.trim()) return;

    await createColumn(newColumnTitle.trim());

    setNewColumnTitle("");
    setIsCreatingColumn(false);
  }

  async function handleUpdateColumn(e: React.FormEvent) {
    e.preventDefault();

    if (!editingColumnTitle.trim() || !editingColumn) return;

    await updateColumn(editingColumn.id, editingColumnTitle.trim());

    setEditingColumnTitle("");
    setIsEditingColumn(false);
    setEditingColumn(null);
  }

  function handleEditColumn(column: ColumnWithTasks) {
    setIsEditingColumn(true);
    setEditingColumn(column);
    setEditingColumnTitle(column.title);
  }

  async function handleInviteSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setInviteError(null);
    setInviteSuccess(null);

    const normalizedUserId = inviteUserId.trim();
    if (!normalizedUserId) {
      setInviteError("User ID is required.");
      return;
    }

    if (user?.id && normalizedUserId === user.id) {
      setInviteError("You are already on this board.");
      return;
    }

    const result = await inviteMember(normalizedUserId);
    if (!result) {
      setInviteError("Failed to invite member.");
      return;
    }
    setInviteSuccess("Invite sent.");
    setInviteUserId("");
  }

  async function handleUpdateTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingTask) return;

    await updateTask(editingTask.id, {
      title: taskForm.title.trim(),
      description: taskForm.description.trim() || null,
      assignee: taskForm.assignee.trim() || null,
      dueDate: taskForm.dueDate || null,
      priority: taskForm.priority,
    });

    setIsEditingTask(false);
    setEditingTask(null);
  }

  async function handleDeleteTask() {
    if (!editingTask) return;
    await deleteTask(editingTask.id);
    setIsEditingTask(false);
    setEditingTask(null);
  }

  const filteredColumns = columns.map((column) => ({
    ...column,
    tasks: column.tasks.filter((task) => {
      // Filter by priority
      if (
        filters.priority.length > 0 &&
        !filters.priority.includes(task.priority)
      ) {
        return false;
      }

      // Filter by due date

      if (filters.dueDate && task.due_date) {
        const taskDate = new Date(task.due_date).toDateString();
        const filterDate = new Date(filters.dueDate).toDateString();

        if (taskDate !== filterDate) {
          return false;
        }
      }

      return true;
    }),
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar boardTitle="Loading board..." />
        <main className="container mx-auto px-4 py-6 sm:py-8">
          <div className="flex items-center gap-3 text-gray-700 mb-6">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm sm:text-base">
              Loading your board...
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="h-9 w-full sm:w-28 bg-gray-200 rounded animate-pulse" />
              <div className="h-9 w-full sm:w-24 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="lg:w-80">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                    <div className="h-5 w-6 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, taskIndex) => (
                      <div
                        key={taskIndex}
                        className="rounded-md border border-gray-100 p-3"
                      >
                        <div className="h-3 w-28 bg-gray-200 rounded animate-pulse mb-2" />
                        <div className="h-3 w-40 bg-gray-200 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            <Card className="lg:w-80 border-2 border-dashed border-gray-200">
              <CardContent className="p-4 sm:p-6 flex flex-col items-center justify-center min-h-[200px]">
                <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse mb-3" />
                <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-rose-50">
        <NavBar boardTitle="Board unavailable" />
        <main className="container mx-auto px-4 py-10 sm:py-16 flex items-center justify-center">
          <Card className="w-full max-w-xl border-rose-200/70 bg-white/80 shadow-lg backdrop-blur">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                    We couldn&apos;t load this board
                  </h2>
                  <p className="text-sm text-gray-600">
                    The board might be missing or you no longer have access.
                    Please try again or return to your dashboard.
                  </p>
                </div>
              </div>
              <div className="mt-5 rounded-lg border border-rose-100 bg-rose-50/70 p-3 text-xs sm:text-sm text-rose-700 break-words">
                {error}
              </div>
              <div className="mt-6 flex flex-col sm:flex-row gap-2">
                <Button onClick={() => window.location.reload()}>
                  Try again
                </Button>
                <Button asChild variant="outline">
                  <Link href="/dashboard">Back to dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <NavBar
          boardTitle={board?.title}
          onEditBoard={() => {
            setNewTitle(board?.title ?? "");
            setNewColor(board?.color ?? "");
            setIsEditingTitle(true);
          }}
          onFilterClick={() => {
            setIsFilterOpen(true);
          }}
          filterCount={Object.values(filters).reduce(
            (count, v) =>
              count + (Array.isArray(v) ? v.length : v !== null ? 1 : 0),
            0
          )}
        />
        <Dialog open={isEditingTitle} onOpenChange={setIsEditingTitle}>
          <DialogContent className="w-[95vw] max-w-[425px] mx-auto">
            <DialogHeader>
              <DialogTitle>Edit Board</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleUpdateBoard}>
              <div className="space-y-2">
                <Label htmlFor="boardTitle">Board Title</Label>
                <Input
                  id="boardTitle"
                  value={newTitle}
                  onChange={(event) => setNewTitle(event.target.value)}
                  placeholder="Enter board title..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Board Color</Label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {[
                    "bg-blue-500",
                    "bg-green-500",
                    "bg-yellow-500",
                    "bg-red-500",
                    "bg-purple-500",
                    "bg-pink-500",
                    "bg-indigo-500",
                    "bg-gray-500",
                    "bg-orange-500",
                    "bg-teal-500",
                    "bg-cyan-500",
                    "bg-emerald-500",
                  ].map((color, key) => (
                    <button
                      key={key}
                      type="button"
                      className={`w-8 h-8 rounded-full ${color} ${
                        color === newColor
                          ? "ring-2 ring-offset-2 ring-gray-900"
                          : ""
                      }`}
                      onClick={() => setNewColor(color)}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditingTitle(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <DialogContent className="w-[95vw] max-w-[425px] mx-auto">
            <DialogHeader>
              <DialogTitle>Filter Tasks</DialogTitle>
              <p className="text-sm text-gray-600">
                Filter tasks by priority, assignee, or due date
              </p>
            </DialogHeader>
            <div className="space-y-4 ">
              <div className="space-y-2">
                <Label>Priority</Label>
                <div className="flex flex-wrap gap-2">
                  {["low", "medium", "high"].map((priority, key) => (
                    <Button
                      onClick={() => {
                        const newPriorities = filters.priority.includes(
                          priority
                        )
                          ? filters.priority.filter((p) => p !== priority)
                          : [...filters.priority, priority];

                        handleFilterChange("priority", newPriorities);
                      }}
                      key={key}
                      variant={
                        filters.priority.includes(priority)
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                    >
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={filters.dueDate || ""}
                  onChange={(e) =>
                    handleFilterChange("dueDate", e.target.value || null)
                  }
                />
              </div>
              <div className="flex justify-between pt-4">
                <Button type="button" variant={"outline"} onClick={clearFilter}>
                  Clear Filters
                </Button>
                <Button type="button" onClick={() => setIsFilterOpen(false)}>
                  Apply Filters
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Board Content */}
        <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
          {/* Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Total Tasks: </span>
                {columns.reduce((sum, col) => sum + col.tasks.length, 0)}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <Plus />
                    Add Task
                  </Button>
                </DialogTrigger>

                <DialogContent className="w-[95vw] max-w-[425px] mx-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                    <p className="text-sm text-gray-600">
                      Add a task to the board{" "}
                    </p>
                  </DialogHeader>
                  <form className="space-y-4" onSubmit={handleCreateTask}>
                    <div className="space-y-2">
                      <Label>Title *</Label>
                      <Input
                        id="title"
                        name="title"
                        placeholder="Enter task title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder="Enter task description"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Assignee</Label>
                      <Input
                        id="assignee"
                        name="assignee"
                        placeholder="Who should do this ?"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select name="priority" defaultValue="medium">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["low", "medium", "high"].map((priority, key) => (
                            <SelectItem key={key} value={priority}>
                              {priority.charAt(0).toUpperCase() +
                                priority.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Due Date</Label>
                      <Input type="date" id="dueDate" name="dueDate" />
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="submit">Create Task</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => {
                  setInviteError(null);
                  setInviteSuccess(null);
                  setIsInviteOpen(true);
                }}
              >
                Invite
              </Button>
            </div>
          </div>

          {/* Board Columns */}

          <DndContext
            sensors={sensors}
            collisionDetection={rectIntersection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex flex-col lg:flex-row lg:space-x-6 lg:overflow-x-auto lg:pb-6 lg:px-2 lg:-mx-2 lg:[&::-webkit-scrollbar]:h-2 lg:[&::-webkit-scrollbar-track]:bg-gray-100 lg:[&::-webkit-scrollbar-thumb]:bg-gray-300 lg:[&::-webkit-scrollbar-thumb]:rounded-full space-y-4 lg:space-y-0">
              {filteredColumns.map((column, key) => (
                <DroppableColumn
                  key={key}
                  column={column}
                  onCreateTask={handleCreateTask}
                  onEditColumn={handleEditColumn}
                >
                  <SortableContext
                    items={column.tasks.map((task) => task.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3 ">
                      {column.tasks.map((task, key) => (
                        <SortableTask
                          task={task}
                          key={key}
                          onEditTask={openEditTask}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DroppableColumn>
              ))}

              <div className="w-full lg:shrink-0 lg:w-80">
                <Button
                  variant="outline"
                  className="w-full h-full min-h-[200px] border-dashed border-2 text-gray-500 hover:text-gray-700"
                  onClick={() => setIsCreatingColumn(true)}
                >
                  <Plus />
                  Add Another list
                </Button>
              </div>

              <DragOverlay>
                {activeTask ? <TaskOverlay task={activeTask} /> : null}
              </DragOverlay>
            </div>
          </DndContext>
        </main>
      </div>

      <Dialog open={isCreatingColumn} onOpenChange={setIsCreatingColumn}>
        <DialogContent className="w-[95vw] max-w-[425px] mx-auto">
          <DialogHeader>
            <DialogTitle>Create New Column</DialogTitle>
            <p className="text-sm text-gray-600">
              Add new column to organize your tasks
            </p>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleCreateColumn}>
            <div className="space-y-2">
              <Label>Column Title</Label>
              <Input
                id="columnTitle"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                placeholder="Enter column title.."
                required
              />
            </div>
            <div className="space-x-2 flex justify-end">
              <Button
                type="button"
                onClick={() => setIsCreatingColumn(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button type="submit">Create Column</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditingColumn} onOpenChange={setIsEditingColumn}>
        <DialogContent className="w-[95vw] max-w-[425px] mx-auto">
          <DialogHeader>
            <DialogTitle>Edit Column</DialogTitle>
            <p className="text-sm text-gray-600">
              Update the tile of your Column
            </p>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleUpdateColumn}>
            <div className="space-y-2">
              <Label>Column Title</Label>
              <Input
                id="columnTitle"
                value={editingColumnTitle}
                onChange={(e) => setEditingColumnTitle(e.target.value)}
                placeholder="Enter column title.."
                required
              />
            </div>
            <div className="space-x-2 flex justify-end">
              <Button
                type="button"
                onClick={() => {
                  setIsEditingColumn(false);
                  setEditingColumnTitle("");
                  setEditingColumn(null);
                }}
                variant="outline"
              >
                Cancel
              </Button>
              <Button type="submit">Edit Column</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="w-[95vw] max-w-[425px] mx-auto">
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
            <p className="text-sm text-gray-600">
              Invite someone by Clerk user ID to collaborate on this board.
            </p>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleInviteSubmit}>
            <div className="space-y-2">
              <Label>User ID</Label>
              <Input
                id="inviteUserId"
                value={inviteUserId}
                onChange={(event) => setInviteUserId(event.target.value)}
                placeholder="user_..."
                autoComplete="off"
                required
              />
              {user?.id && (
                <p className="text-xs text-gray-500">
                  Your user ID: <span className="font-mono">{user.id}</span>
                </p>
              )}
              {inviteError && (
                <p className="text-sm text-red-600">{inviteError}</p>
              )}
              {inviteSuccess && (
                <p className="text-sm text-green-600">{inviteSuccess}</p>
              )}
            </div>
            <div>
              <Label className="text-xs">Current Members</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {members.length === 0 ? (
                  <Badge variant="secondary" className="text-xs">
                    No members yet
                  </Badge>
                ) : (
                  members.map((member) => (
                    <Badge key={member.id} variant="secondary" className="text-xs">
                      {member.user_id}
                    </Badge>
                  ))
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsInviteOpen(false)}
              >
                Close
              </Button>
              <Button type="submit">Send Invite</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditingTask} onOpenChange={setIsEditingTask}>
        <DialogContent className="w-[95vw] max-w-[425px] mx-auto">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleUpdateTask}>
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={taskForm.title}
                onChange={(event) =>
                  setTaskForm((prev) => ({ ...prev, title: event.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={taskForm.description}
                onChange={(event) =>
                  setTaskForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Input
                value={taskForm.assignee}
                onChange={(event) =>
                  setTaskForm((prev) => ({
                    ...prev,
                    assignee: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={taskForm.priority}
                onValueChange={(value) =>
                  setTaskForm((prev) => ({
                    ...prev,
                    priority: value as "low" | "medium" | "high",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["low", "medium", "high"].map((priority, key) => (
                    <SelectItem key={key} value={priority}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={taskForm.dueDate}
                onChange={(event) =>
                  setTaskForm((prev) => ({
                    ...prev,
                    dueDate: event.target.value,
                  }))
                }
              />
            </div>
            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteTask}
              >
                Delete
              </Button>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditingTask(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
