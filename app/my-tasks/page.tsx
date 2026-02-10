'use client';

import NavBar from '@/components/navbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUser } from '@clerk/nextjs';
import { Calendar, User } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSupabase } from '@/lib/supabase/SupabaseProvider';
import { Task } from '@/lib/supabase/models';

export default function MyTasksPage() {
    const { user } = useUser();
    const { supabase } = useSupabase();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchMyTasks() {
            if (!user || !supabase) return;
            try {
                const { data, error } = await supabase
                    .from('tasks')
                    .select(`
            *,
            columns!inner (
              board_id,
              boards!inner (
                title
              )
            )
          `)
                    .eq('assignee', user.id)
                    .order('due_date', { ascending: true });

                if (error) throw error;
                setTasks(data || []);
            } catch (error) {
                console.error('Error fetching tasks:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchMyTasks();
    }, [user, supabase]);

    function getPriorityColor(priority: 'low' | 'medium' | 'high'): string {
        switch (priority) {
            case 'high':
                return 'bg-red-500';
            case 'medium':
                return 'bg-yellow-500';
            case 'low':
                return 'bg-green-500';
            default:
                return 'bg-yellow-500';
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <NavBar boardTitle="My Tasks" />
            <main className="container mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">My Assigned Tasks</h1>

                {loading ? (
                    <div className="text-center py-10">Loading tasks...</div>
                ) : tasks.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center p-10 text-gray-500">
                            <p>You satisfy all requirements! No tasks assigned to you.</p>
                            <Button className="mt-4" asChild>
                                <Link href="/dashboard">Back to Dashboard</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {tasks.map((task: any) => (
                            <Card key={task.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge variant="outline" className="mb-2">
                                            {task.columns.boards.title}
                                        </Badge>
                                        <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`} title={`Priority: ${task.priority}`} />
                                    </div>

                                    <h3 className="font-semibold text-lg mb-1">{task.title}</h3>
                                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                                        {task.description || 'No description'}
                                    </p>

                                    <div className="flex items-center justify-between text-xs text-gray-500 mt-4 pt-4 border-t">
                                        <div className="flex items-center gap-2">
                                            {task.due_date && (
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>{new Date(task.due_date).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                            {task.label && (
                                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 min-w-0 truncate max-w-[80px]">
                                                    {task.label}
                                                </Badge>
                                            )}
                                        </div>

                                        <Link
                                            href={`/boards/${task.columns.board_id}`}
                                            className="text-blue-600 hover:underline"
                                        >
                                            View Board
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
