"use client";
import { createContext, useContext, useEffect, useState, useMemo } from "react";
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
      const message = "Missing Supabase configuration.";
      console.error(message);
      setConfigError(message);
      setIsLoaded(true);
      return;
    }

    const client = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        fetch: async (url, options = {}) => {
          const clkToken = await session?.getToken({ template: "supabase" });
          const headers = new Headers(options.headers);
          if (clkToken) {
            headers.set("Authorization", `Bearer ${clkToken}`);
          }
          return fetch(url, { ...options, headers });
        },
      },
    });

    setSupabase(client);
    setConfigError(null);
    setIsLoaded(true);
  }, [session]);

  const value = useMemo(
    () => ({
      supabase,
      isLoaded,
    }),
    [supabase, isLoaded]
  );

  return (
    <Context.Provider value={value}>
      {configError ? (
        <div className="p-4 text-red-500 font-bold">{configError}</div>
      ) : !isLoaded ? (
        <div className="flex items-center justify-center h-screen">
          Loading...
        </div>
      ) : (
        children
      )}
    </Context.Provider>
  );
}

export const useSupabase = () => {
  const context = useContext(Context);
  if (!context) {
    throw new Error("useSupabase needs to be inside the provider");
  }
  return context;
};
