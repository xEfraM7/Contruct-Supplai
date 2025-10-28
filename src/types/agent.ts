export interface Agent {
  id: string;
  agent_id: string;
  agent_name: string;
  voice_id: string;
  voice_model: string;
  language: string;
  llm_id: string;
  is_active: boolean;
  created_at: string;
}

export interface CreateAgentFormData {
  agent_name: string;
  voice_id: string;
  language: string;
}
