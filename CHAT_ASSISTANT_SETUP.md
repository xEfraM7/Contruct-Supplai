# Chat Assistant con OpenAI Assistants API - Guía de Configuración

## 📋 Descripción

Se ha implementado un sistema de chat interactivo usando la API de Assistants de OpenAI que permite a los usuarios hacer preguntas sobre sus blueprints, análisis y proyectos en tiempo real.

## 🎯 Características

- **Chat flotante**: Botón flotante en la esquina inferior derecha que abre el chat
- **Contexto inteligente**: El assistant tiene acceso a:
  - Información del proyecto actual
  - Inventario del usuario
  - Blueprint seleccionado
  - Análisis recientes
  - Resultado del análisis actual
- **Conversaciones persistentes**: Mantiene el contexto de la conversación
- **Interfaz moderna**: UI limpia con mensajes en tiempo real

## 🚀 Configuración

### 1. Variables de Entorno

Agrega la siguiente variable a tu archivo `.env`:

```env
OPENAI_ASSISTANT_ID=""  # Opcional - se creará automáticamente si no existe
```

**Nota**: Si no proporcionas un `OPENAI_ASSISTANT_ID`, el sistema creará automáticamente un nuevo assistant en la primera ejecución y te mostrará el ID en los logs. Puedes copiar ese ID y agregarlo a tu `.env` para reutilizar el mismo assistant.

### 2. Crear un Assistant Manualmente (Opcional)

Si prefieres crear el assistant manualmente en el dashboard de OpenAI:

1. Ve a [platform.openai.com/assistants](https://platform.openai.com/assistants)
2. Crea un nuevo Assistant con:
   - **Name**: Blueprint Analysis Assistant
   - **Model**: gpt-4o
   - **Instructions**:
     ```
     You are an expert construction estimator and blueprint analyst. You help users understand their construction blueprints, provide cost estimates, identify discrepancies, and answer questions about their projects.

     Key responsibilities:
     - Answer questions about blueprint analyses
     - Provide cost estimates based on user's inventory
     - Explain technical details in clear language
     - Help identify potential issues or discrepancies
     - Suggest solutions and best practices

     When referencing costs, always use the user's inventory data when available. Be concise but thorough in your responses.
     ```
   - **Tools**: File Search (habilitado)
3. Copia el Assistant ID y agrégalo a tu `.env`

## 📁 Archivos Creados

### 1. `src/components/sectionComponents/blueprints/ChatAssistant.tsx`
Componente React del chat flotante con:
- UI de mensajes
- Input con soporte para Enter/Shift+Enter
- Estados de carga
- Scroll automático

### 2. `src/app/api/assistant-chat/route.ts`
API route que maneja:
- Creación/recuperación de threads de conversación
- Contexto del usuario (proyecto, inventario, blueprints)
- Ejecución del assistant
- Manejo de respuestas

## 💡 Uso

### En la Aplicación

1. El botón de chat aparece automáticamente en la esquina inferior derecha
2. Haz clic para abrir el chat
3. Escribe tu pregunta y presiona Enter
4. El assistant responderá con contexto de tu proyecto actual

### Ejemplos de Preguntas

- "¿Cuánto costaría este proyecto con mi inventario actual?"
- "¿Qué items me faltan para completar este blueprint?"
- "Explícame las discrepancias encontradas"
- "¿Cuáles son los RFIs más importantes?"
- "Dame un resumen del análisis técnico"

## 🔧 Integración con el Sistema Existente

El chat se integra automáticamente con:

1. **Análisis de Blueprints**: Usa la misma API de OpenAI que el análisis existente
2. **Inventario**: Accede al inventario del usuario para respuestas precisas
3. **Contexto del Proyecto**: Conoce el proyecto actual y sus detalles
4. **Blueprints**: Puede referenciar blueprints específicos y sus análisis

## 🎨 Personalización

### Cambiar la Posición del Chat

En `ChatAssistant.tsx`, modifica las clases:
```tsx
// Botón flotante
className="fixed bottom-6 right-6 ..."

// Ventana de chat
className="fixed bottom-6 right-6 w-96 h-[600px] ..."
```

### Modificar el Comportamiento del Assistant

Edita las instrucciones en `src/app/api/assistant-chat/route.ts`:
```typescript
instructions: `Tu nuevo prompt aquí...`
```

## 🔒 Seguridad

- Las conversaciones se almacenan temporalmente en memoria
- Solo el usuario autenticado puede acceder a su contexto
- Los threads de OpenAI se limpian automáticamente después de 60 días

## 📊 Almacenamiento de Conversaciones (Opcional)

Para producción, considera implementar:

1. **Redis**: Para almacenar conversationId → threadId
2. **Base de Datos**: Para persistir historial de conversaciones
3. **Supabase**: Tabla `chat_conversations` con:
   ```sql
   CREATE TABLE chat_conversations (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES auth.users(id),
     project_id UUID REFERENCES projects(id),
     thread_id TEXT NOT NULL,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );
   ```

## 🐛 Troubleshooting

### El assistant no responde
- Verifica que `OPENAI_API_KEY` esté configurada
- Revisa los logs del servidor para ver el estado del run
- Asegúrate de que el modelo `gpt-4o` esté disponible en tu cuenta

### Errores de timeout
- Aumenta `maxAttempts` en `route.ts`
- Verifica la carga de la API de OpenAI

### El contexto no se carga
- Verifica que el usuario esté autenticado
- Revisa que los datos del proyecto/inventario existan en Supabase

## 📝 Notas Adicionales

- El sistema usa `gpt-4o` por defecto (puedes cambiarlo a `gpt-4-turbo` o `gpt-3.5-turbo`)
- Los threads se mantienen en memoria durante la sesión del servidor
- Para producción, implementa un sistema de caché más robusto
- El assistant puede tardar 2-5 segundos en responder dependiendo de la complejidad

## 🎉 ¡Listo!

El sistema de chat está completamente integrado y listo para usar. Los usuarios ahora pueden hacer preguntas sobre sus blueprints y recibir respuestas contextuales en tiempo real.
