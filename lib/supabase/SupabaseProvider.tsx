"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { SupabaseClient, createClient } from "@supabase/supabase-js";
import { useSession } from "@clerk/nextjs";

type SupabaseContext = {
  supabase: SupabaseClient | null;
  isLoaded: boolean;
};
const Context = createContext<SupabaseContext>({
  supabase: null,
  isLoaded: false,
});

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session } = useSession();
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [configError, setConfigError] = useState<string | null>(null);
  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      const message =
        "Missing Supabase configuration. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.";
      console.error(message);
      setConfigError(message);
      setSupabase(null);
      setIsLoaded(true);
      return;
    }

    setConfigError(null);

    const client = createClient(supabaseUrl, supabaseAnonKey, {
      accessToken: async () =>
        session ? await session.getToken().catch(() => null) : null,
    });

    setSupabase(client);
    setIsLoaded(true);
  }, [session?.id]);

  return (
    <Context.Provider value={{ supabase, isLoaded }}>
      {configError ? (
        <div>{configError}</div>
      ) : !isLoaded ? (
        <div>Loading...</div>
      ) : (
        children
      )}
    </Context.Provider>
  );
}

export const useSupabase = () => {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error("useSupabase needs to be inside the provider");
  }
  return context;
};
