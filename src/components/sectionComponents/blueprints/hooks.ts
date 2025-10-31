import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { parseAnalysisResult } from "./utils";

/**
 * Hook to fetch project information
 */
export const useProject = (projectId: string) => {
  return useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) throw new Error("Failed to fetch project");
      return response.json();
    },
  });
};

/**
 * Hook to fetch blueprints for a project
 */
export const useBlueprints = (projectId: string) => {
  return useQuery({
    queryKey: ["blueprints", projectId],
    queryFn: async () => {
      const response = await fetch(`/api/blueprints?project_id=${projectId}`);
      if (!response.ok) throw new Error("Failed to fetch blueprints");
      return response.json();
    },
  });
};

/**
 * Hook to fetch analyses for a specific blueprint
 */
export const useAnalyses = (blueprintId: string | null) => {
  return useQuery({
    queryKey: ["analyses", blueprintId],
    queryFn: async () => {
      if (!blueprintId) return { analyses: [] };
      const response = await fetch(
        `/api/blueprint-analyses?blueprint_id=${blueprintId}`
      );
      if (!response.ok) throw new Error("Failed to fetch analyses");
      return response.json();
    },
    enabled: !!blueprintId,
  });
};

/**
 * Hook to analyze blueprints with mutation
 */
export const useAnalyzeBlueprint = (
  projectId: string,
  onSuccess: (result: string) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      fileUrl,
      fileName,
      prompt,
      category,
      blueprintId,
      uploadMode,
    }: {
      fileUrl: string;
      fileName: string;
      prompt: string;
      category: string;
      blueprintId?: string;
      uploadMode: "new" | "existing";
    }) => {
      // Enviar solo la URL, no el archivo
      const response = await fetch("/api/analyze-blueprints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileUrl,
          fileName,
          category,
          prompt,
        }),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(
          `Server returned non-JSON response (${response.status}): ${text.substring(0, 200)}`
        );
      }

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || "Unexpected error");
      }

      return {
        result: json.result,
        blueprintId,
        fileUrl,
        fileName,
        category,
        prompt,
        uploadMode,
      };
    },
    onSuccess: async (data) => {
      // Parse and return result
      parseAnalysisResult(data.result);
      onSuccess(data.result);

      let blueprintId = data.blueprintId;

      // Save blueprint if new upload - ya está subido a Supabase, solo guardar metadata
      if (data.uploadMode === "new") {
        // El archivo ya está en Supabase Storage, solo guardar el registro en la BD
        const blueprintResponse = await fetch("/api/blueprints/metadata", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_id: projectId,
            file_name: data.fileName,
            file_url: data.fileUrl,
            category: data.category || "General",
          }),
        });

        if (blueprintResponse.ok) {
          const blueprintData = await blueprintResponse.json();
          blueprintId = blueprintData.blueprint.id;
        }
      }

      // Save analysis
      if (blueprintId) {
        await fetch("/api/blueprint-analyses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            blueprint_id: blueprintId,
            category: data.category || "General",
            prompt: data.prompt,
            result: data.result,
          }),
        });
      }

      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["blueprints", projectId] });
      queryClient.invalidateQueries({ queryKey: ["analyses"] });
    },
  });
};
