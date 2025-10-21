"use client";

import { useEffect, useState } from "react";
import { ChevronUp, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface User {
  name: string;
  email: string;
}

export function UserProfile() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    
    // Obtener datos del usuario desde Supabase
    const getSession = async () => {
      try {
        // Intentar obtener la sesión con reintentos
        let session = null;
        let attempts = 0;
        const maxAttempts = 5;
        
        while (!session && attempts < maxAttempts) {
          const { data } = await supabase.auth.getSession();
          session = data.session;
          
          if (!session && attempts < maxAttempts - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          attempts++;
        }
        
        if (session?.user) {
          setUser({
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || "Usuario",
            email: session.user.email || "",
          });
        } else {
          window.location.href = '/login';
        }
      } catch (err) {
        console.error("Error obteniendo sesión:", err);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || "Usuario",
          email: session.user.email || "",
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      window.location.href = "/login";
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading || !user) {
    return (
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-sidebar-primary/50 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-sidebar-primary/50 rounded animate-pulse w-24" />
            <div className="h-2 bg-sidebar-primary/30 rounded animate-pulse w-32" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-sidebar-border relative">
      <button
        onClick={() => setShowUserMenu(!showUserMenu)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-sidebar-accent/50 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground text-sm font-semibold">
          {getInitials(user.name)}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-medium text-sidebar-foreground truncate">
            {user.name}
          </p>
          <p className="text-xs text-sidebar-foreground/60 truncate">
            {user.email}
          </p>
        </div>
        <ChevronUp
          className={cn(
            "w-4 h-4 text-sidebar-foreground/60 transition-transform",
            showUserMenu && "rotate-180"
          )}
        />
      </button>

      {showUserMenu && (
        <div className="absolute bottom-full left-4 right-4 mb-2 bg-sidebar border border-sidebar-border rounded-lg shadow-lg overflow-hidden">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-sidebar-accent/50 transition-colors text-sm text-sidebar-foreground"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
