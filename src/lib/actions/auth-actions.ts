"use server";

import { createSupabaseServerClient } from "../supabase/server";

export const signUp = async (email: string, password: string, name: string) => {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
};

export const signIn = async (email: string, password: string) => {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
};

export const signOut = async () => {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signOut();
  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
};

export const signInWithGoogle = async () => {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`,
    },
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    data,
  };
};
