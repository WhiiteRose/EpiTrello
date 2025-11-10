"use client";
import NavBar from "@/components/navbar";
import { useBoard } from "@/lib/hooks/useBoards";
import { useParams } from "next/navigation";

export default function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const { board } = useBoard(id);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar boardTitle={board?.title} />
    </div>
  );
}
