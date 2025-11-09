"use client";
import NavBar from "@/components/ui/navbar";
import { Button } from "@/components/ui/button";
import { useBoards } from "@/lib/hooks/useBoards";
import { useUser } from "@clerk/nextjs";
import { Loader2, Plus } from "lucide-react";

export default function DashboardPage() {
  const { user } = useUser();

  const { createBoard, boards, loading, error } = useBoards();

  const handleCreateBoard = async () => {
    await createBoard({ title: "New Board" });
  };

  if (loading) {
    return (
      <div>
        <Loader2 /> <span>Loading your boards...</span>
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <h2>Error loading boards</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Welcome back,{" "}
            {user?.firstName ?? user?.emailAddresses[0].emailAddress}! 👋
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your boards today.
          </p>
          <Button className="w-full sm:w-auto" onClick={handleCreateBoard}>
            <Plus />
            Create New Board
          </Button>
        </div>
      </main>
    </div>
  );
}
