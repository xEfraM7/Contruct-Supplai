-- ============================================================================
-- CHAT CONVERSATIONS TABLE (OPCIONAL)
-- ============================================================================
-- Esta migración es OPCIONAL. El sistema funciona sin ella usando memoria.
-- Úsala solo si quieres persistir el historial de conversaciones.
-- ============================================================================

-- Tabla para almacenar conversaciones de chat
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  blueprint_id UUID REFERENCES blueprints(id) ON DELETE SET NULL,
  thread_id TEXT NOT NULL UNIQUE,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para almacenar mensajes individuales
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id 
  ON chat_conversations(user_id);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_project_id 
  ON chat_conversations(project_id);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_thread_id 
  ON chat_conversations(thread_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id 
  ON chat_messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at 
  ON chat_messages(created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para chat_conversations
CREATE POLICY "Users can view their own conversations"
  ON chat_conversations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
  ON chat_conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON chat_conversations
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
  ON chat_conversations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas RLS para chat_messages
CREATE POLICY "Users can view messages from their conversations"
  ON chat_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND chat_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their conversations"
  ON chat_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND chat_conversations.user_id = auth.uid()
    )
  );

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_chat_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER update_chat_conversation_timestamp
  BEFORE UPDATE ON chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_conversation_timestamp();

-- Función para actualizar last_message_at cuando se crea un mensaje
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar last_message_at
CREATE TRIGGER update_conversation_last_message
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- ============================================================================
-- COMENTARIOS Y NOTAS
-- ============================================================================

COMMENT ON TABLE chat_conversations IS 
'Almacena las conversaciones de chat entre usuarios y el assistant de OpenAI. Cada conversación está vinculada a un thread_id de OpenAI.';

COMMENT ON TABLE chat_messages IS 
'Almacena los mensajes individuales de cada conversación. Incluye tanto mensajes del usuario como respuestas del assistant.';

COMMENT ON COLUMN chat_conversations.thread_id IS 
'ID del thread de OpenAI Assistants API. Se usa para mantener el contexto de la conversación.';

COMMENT ON COLUMN chat_conversations.title IS 
'Título opcional de la conversación, puede generarse automáticamente del primer mensaje.';

COMMENT ON COLUMN chat_conversations.last_message_at IS 
'Timestamp del último mensaje en la conversación. Se actualiza automáticamente.';

-- ============================================================================
-- QUERIES ÚTILES
-- ============================================================================

-- Ver todas las conversaciones de un usuario con conteo de mensajes
-- SELECT 
--   c.id,
--   c.title,
--   c.created_at,
--   c.last_message_at,
--   COUNT(m.id) as message_count
-- FROM chat_conversations c
-- LEFT JOIN chat_messages m ON m.conversation_id = c.id
-- WHERE c.user_id = auth.uid()
-- GROUP BY c.id
-- ORDER BY c.last_message_at DESC;

-- Ver mensajes de una conversación específica
-- SELECT 
--   role,
--   content,
--   created_at
-- FROM chat_messages
-- WHERE conversation_id = 'conversation-uuid-here'
-- ORDER BY created_at ASC;

-- Limpiar conversaciones antiguas (más de 30 días sin actividad)
-- DELETE FROM chat_conversations
-- WHERE last_message_at < NOW() - INTERVAL '30 days';
