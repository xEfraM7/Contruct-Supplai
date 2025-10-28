"use client";

import { useState } from "react";
import { toast } from "sonner";

interface FormData {
  agent_name: string;
  voice_id: string;
  language: string;
}

export function useCreateAgentDialog(onSuccess: () => void) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    agent_name: "",
    voice_id: "11labs-Adrian",
    language: "es-ES",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.agent_name) {
      toast.error("Please enter an agent name");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        agent_name: formData.agent_name,
        voice_id: formData.voice_id,
        voice_model: "eleven_multilingual_v2",
        language: formData.language,
        auto_create_llm: true,
      };

      const response = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Agent created successfully");
        onSuccess();
        setFormData({
          agent_name: "",
          voice_id: "11labs-Adrian",
          language: "es-ES",
        });
      } else {
        toast.error(data.error || "Error creating agent");
      }
    } catch (error) {
      console.error("Error creating agent:", error);
      toast.error("Error creating agent");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return {
    loading,
    formData,
    handleSubmit,
    handleChange,
  };
}
