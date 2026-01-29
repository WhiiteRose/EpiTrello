"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const clerkJwtTemplate = process.env.NEXT_PUBLIC_CLERK_JWT_TEMPLATE;

  const configError = useMemo(() => {
    if (!supabaseUrl || !supabaseAnonKey) {
      return "Missing Supabase configuration. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.";
    }
    return null;
  }, [supabaseUrl, supabaseAnonKey]);

  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const isLoaded = !configError && supabase !== null;

  useEffect(() => {
    if (configError) return;

    let cancelled = false;

    (async () => {
      const token = session
        ? await session
            .getToken(
              clerkJwtTemplate ? { template: clerkJwtTemplate } : undefined
            )
            .catch(() => null)
        : null;
      if (cancelled) return;

      const client = createClient(supabaseUrl!, supabaseAnonKey!, {
        accessToken: async () => token,
      });

      setSupabase(client);
    })();

    return () => {
      cancelled = true;
    };
  }, [session, configError, supabaseUrl, supabaseAnonKey, clerkJwtTemplate]);

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
