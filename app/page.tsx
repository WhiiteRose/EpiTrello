import Navbar from "@/components/ui/navbar";
import Image from "next/image";

export default function Home() {
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100">
        <Navbar />
      </div>
    </>
  );
}
