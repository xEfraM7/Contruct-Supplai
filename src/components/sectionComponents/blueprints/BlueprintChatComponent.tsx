"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Trash2, MessageSquare } from "lucide-react";
import { ChatMessage } from "./types";
import { cn } from "@/lib/utils";

interface BlueprintChatProps {
  blueprintId: string;
  blueprintName: string;
}

export function BlueprintChat({
  blueprintId,
  blueprintName,
}: BlueprintChatProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último mensaje
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Inicializar chat
  useEffect(() => {
    async function initChat() {
      try {
        setInitializing(true);
        setError(null);

        const res = await fetch("/api/chat-blueprints/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blueprint_id: blueprintId }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Error al inicializar chat");
        }

        const data = await res.json();
        setSessionId(data.session_id);

        // Cargar historial si existe
        if (!data.is_new) {
          await loadHistory(data.session_id);
        }
      } catch (err) {
        console.error("Error inicializando chat:", err);
        let errorMessage = "Error al inicializar chat";
        
        if (err instanceof Error) {
          if (err.message.includes("timeout")) {
            errorMessage = "⏱️ El plano está tardando mucho en procesarse. Esto puede ocurrir con PDFs muy grandes. Por favor, intenta con un archivo más pequeño o espera unos minutos y recarga la página.";
          } else {
            errorMessage = err.message;
          }
        }
        
        setError(errorMessage);
      } finally {
        setInitializing(false);
      }
    }

    initChat();
  }, [blueprintId]);

  // Cargar historial
  async function loadHistory(sid: string) {
    try {
      const res = await fetch(
        `/api/chat-blueprints/history?session_id=${sid}`
      );
      if (!res.ok) throw new Error("Error al cargar historial");

      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error("Error cargando historial:", err);
    }
  }

  // Enviar mensaje
  async function sendMessage() {
    if (!input.trim() || !sessionId || loading) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);
    setError(null);

    // Agregar mensaje del usuario a UI inmediatamente
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: userMessage,
      createdAt: Date.now() / 1000,
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch("/api/chat-blueprints/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          message: userMessage,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al enviar mensaje");
      }

      const data = await res.json();

      // Agregar respuesta del asistente
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.message,
        createdAt: Date.now() / 1000,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Error enviando mensaje:", err);
      setError(
        err instanceof Error ? err.message : "Error al enviar mensaje"
      );
      // Remover mensaje temporal del usuario en caso de error
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
    } finally {
      setLoading(false);
    }
  }

  // Limpiar chat
  async function clearChat() {
    if (!sessionId) return;

    if (
      !confirm(
        "¿Estás seguro de que quieres eliminar esta conversación? Esta acción no se puede deshacer."
      )
    ) {
      return;
    }

    try {
      await fetch("/api/chat-blueprints/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });

      // Reiniciar estado
      setMessages([]);
      setSessionId(null);

      // Reinicializar
      window.location.reload();
    } catch (err) {
      console.error("Error limpiando chat:", err);
      setError("Error al limpiar el chat");
    }
  }

  // Manejar Enter para enviar
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (initializing) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground font-medium">Inicializando chat...</p>
          <div className="text-sm text-muted-foreground mt-4 text-center max-w-md space-y-2">
            <p>📄 Subiendo plano a OpenAI</p>
            <p>🔍 Indexando contenido del PDF</p>
            <p>💬 Creando conversación</p>
            <p className="text-xs mt-4 text-yellow-600">
              ⏱️ Esto puede tomar 10-30 segundos para PDFs pequeños, o hasta 2 minutos para archivos grandes
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !sessionId) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <MessageSquare className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-red-500 font-semibold mb-2">Error</p>
          <p className="text-muted-foreground text-center">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="mt-4"
            variant="outline"
          >
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-card-foreground">
              Chat con IA
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              📄 {blueprintName}
            </p>
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpiar
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Mensajes */}
        <div className="h-[500px] overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground font-medium">
                ¡Hola! Pregúntame sobre el plano
              </p>
              <p className="text-sm text-muted-foreground mt-2 max-w-md">
                Puedo ayudarte a encontrar información específica, calcular
                cantidades, verificar costos y más.
              </p>
              <div className="mt-6 space-y-2 text-left">
                <p className="text-xs text-muted-foreground font-semibold">
                  Ejemplos de preguntas:
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• ¿Cuántos outlets necesito en total?</li>
                  <li>• ¿Dónde van los switches de 3-way?</li>
                  <li>• ¿Tengo suficiente cable en inventario?</li>
                  <li>• ¿Cuál es el costo estimado del proyecto?</li>
                </ul>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg p-3 whitespace-pre-wrap",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-card-foreground"
                    )}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      Escribiendo...
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Error message */}
        {error && sessionId && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-border p-4">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu pregunta... (Shift+Enter para nueva línea)"
              className="flex-1 min-h-[60px] max-h-[120px] resize-none"
              disabled={loading}
            />
            <Button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="self-end"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            💡 Tip: Puedo buscar información específica en el plano y usar tu
            inventario para calcular costos
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
