"use client";

import { useEffect, useState } from "react";
import { ChevronUp, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { User } from "./types/dashboard-types";



export function UserProfile() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/settings");
      
      if (response.ok) {
        const data = await response.json();
        
        // Usar la misma lógica que settings para obtener el nombre
        const displayName = data.settings?.company_name || 
                           data.user?.user_metadata?.name || 
                           data.user?.user_metadata?.full_name ||
                           data.user?.email?.split('@')[0] || 
                           "Usuario";

        setUser({
          name: displayName,
          email: data.user?.email || data.settings?.email || "",
        });
      } else {
        // Fallback si falla la API
        setUser({
          name: "Usuario",
          email: "usuario@ejemplo.com"
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      // Fallback en caso de error
      setUser({
        name: "Usuario",
        email: "usuario@ejemplo.com"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      window.location.href = "/login";
    } catch (err) {
      console.error("Error at logout:", err);
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

  if (loading) {
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

  // Si no hay usuario después de cargar, mostrar usuario por defecto
  if (!user) {
    return (
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground text-sm font-semibold">
            U
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              Usuario
            </p>
            <p className="text-xs text-sidebar-foreground/60 truncate">
              Cargando...
            </p>
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
            Logout
          </button>
        </div>
      )}
    </div>
  );
}