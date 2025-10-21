"use server";

import { headers } from "next/headers";
import { auth } from "../auth";

export const signUp = async (email: string, password: string, name: string) => {
  try {
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
        callbackURL: "/overview",
      },
      headers: await headers(),
    });

    return { success: true, data: result };
  } catch (error: any) {
    return { 
      success: false, 
      error: error?.message || "Error al registrarse" 
    };
  }
};

export const signIn = async (email: string, password: string, rememberMe: boolean = false) => {
  try {
    const result = await auth.api.signInEmail({
      body: {
        email,
        password,
        callbackURL: "/overview",
        rememberMe,
      },
      headers: await headers(),
    });

    return { success: true, data: result };
  } catch (error: any) {
    return { 
      success: false, 
      error: error?.message || "Credenciales incorrectas" 
    };
  }
};

export const signOut = async () => {
  const result = await auth.api.signOut({
    headers: await headers(),
  });

  return result;
};

export const signInWithGoogle = async () => {
  try {
    const result = await auth.api.signInSocial({
      body: {
        provider: "google",
        callbackURL: "/overview",
      },
      headers: await headers(),
    });

    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Error al iniciar sesión con Google",
    };
  }
};
