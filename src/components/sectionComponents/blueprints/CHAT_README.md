# Sistema de Chat para Análisis de Planos

## 📋 Descripción

Sistema de chat conversacional que permite a los usuarios hacer preguntas específicas sobre planos de construcción usando OpenAI Conversations API y GPT-5.

## 🏗️ Arquitectura

### Componentes Principales

1. **BlueprintChatComponent.tsx** - Interfaz de usuario del chat
2. **API Endpoints**:
   - `/api/chat-blueprints/init` - Inicializar sesión de chat
   - `/api/chat-blueprints/message` - Enviar mensaje
   - `/api/chat-blueprints/history` - Obtener historial
   - `/api/chat-blueprints/cleanup` - Limpiar recursos

### Base de Datos

**Tabla: `blueprint_chat_sessions`**
```sql
- id: UUID (PK)
- blueprint_id: UUID (FK -> blueprints)
- user_id: UUID (FK -> auth.users)
- conversation_id: TEXT (OpenAI Conversation ID)
- vector_store_id: TEXT (OpenAI Vector Store ID)
- openai_file_id: TEXT (OpenAI File ID)
- title: TEXT
- is_active: BOOLEAN
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

## 🔄 Flujo de Funcionamiento

### 1. Inicialización (Primera vez)

```typescript
POST /api/chat-blueprints/init
Body: { blueprint_id: "uuid" }

Proceso:
1. Verificar si existe sesión activa
2. Descargar blueprint desde Supabase
3. Subir PDF a OpenAI Files API
4. Crear Vector Store
5. Indexar archivo en Vector Store
6. Crear Conversation en OpenAI
7. Guardar sesión en BD
```

### 2. Enviar Mensaje

```typescript
POST /api/chat-blueprints/message
Body: { session_id: "uuid", message: "texto" }

Proceso:
1. Obtener sesión de BD
2. Agregar mensaje del usuario a Conversation
3. Obtener inventario del usuario
4. Crear Response usando Responses API
   - Usa conversation_id (mantiene contexto)
   - Usa vector_store_id (busca en plano)
   - Incluye inventario en instructions
5. Extraer respuesta del asistente
6. Retornar mensaje
```

### 3. Cargar Historial

```typescript
GET /api/chat-blueprints/history?session_id=uuid

Proceso:
1. Obtener sesión de BD
2. Listar items de la Conversation desde OpenAI
3. Formatear mensajes
4. Retornar historial
```

### 4. Limpiar Recursos

```typescript
POST /api/chat-blueprints/cleanup
Body: { session_id: "uuid" }

Proceso:
1. Eliminar Conversation de OpenAI
2. Eliminar Vector Store de OpenAI
3. Eliminar File de OpenAI
4. Marcar sesión como inactiva en BD
```

## 🎯 Ventajas vs Sistema Anterior

| Aspecto | Análisis Inicial | Chat |
|---------|------------------|------|
| **Propósito** | Análisis completo estructurado | Preguntas específicas |
| **Duración** | 30-60 segundos | 5-10 segundos |
| **Formato** | Markdown con secciones fijas | Conversacional |
| **Contexto** | Solo inventario | Inventario + historial + análisis |
| **Vector Store** | Crea y elimina cada vez | Reutiliza en toda la sesión |
| **Costo** | Alto (indexación completa) | Bajo (solo queries) |

## 💡 Características Clave

### Reutilización de Recursos
- El Vector Store se crea UNA VEZ por sesión
- Se reutiliza para todas las preguntas
- Ahorro significativo de tiempo y costos

### Contexto Persistente
- OpenAI mantiene el historial automáticamente
- No necesitas pasar todo el contexto cada vez
- Conversación natural y fluida

### Integración con Inventario
- Cada mensaje incluye el inventario actualizado
- Respuestas con costos reales
- Verificación de disponibilidad

### File Search
- Búsqueda semántica en el PDF
- Encuentra información específica
- Cita ubicaciones exactas

## 🔧 Uso en el Frontend

```typescript
import { BlueprintChat } from "@/components/sectionComponents/blueprints";

<BlueprintChat 
  blueprintId="uuid-del-plano"
  blueprintName="Electrical_Plan_Floor1.pdf"
/>
```

## 📝 Ejemplos de Preguntas

```
Usuario: "¿Cuántos outlets necesito en total?"
AI: Busca en el plano, cuenta outlets, responde con número exacto

Usuario: "¿Tengo suficiente cable en inventario?"
AI: Consulta plano + inventario, calcula necesidades vs disponible

Usuario: "¿Dónde van los switches de 3-way?"
AI: Busca en PDF, identifica ubicaciones específicas

Usuario: "¿Cuál es el costo total si compro todo nuevo?"
AI: Calcula basado en análisis + precios de inventario

Usuario: "Explícame el circuito de la cocina"
AI: Analiza sección específica del plano, explica conexiones
```

## 🚀 Mejoras Futuras

1. **Streaming Responses**: Respuestas en tiempo real
2. **Sugerencias de Preguntas**: Basadas en el plano
3. **Análisis Comparativo**: Entre múltiples planos
4. **Export de Conversaciones**: Guardar como PDF/Markdown
5. **Voice Input**: Preguntas por voz
6. **Image Generation**: Diagramas explicativos

## 🔒 Seguridad

- RLS habilitado en `blueprint_chat_sessions`
- Solo el usuario puede ver/modificar sus sesiones
- Validación de permisos en cada endpoint
- Limpieza automática de recursos

## 📊 Monitoreo

- Logs detallados en cada endpoint
- Tracking de duración de indexación
- Conteo de mensajes por sesión
- Estado de recursos de OpenAI

## 🐛 Troubleshooting

### Error: "File indexing timeout"
**Causas:**
- El PDF es muy grande (>50MB)
- El PDF tiene muchas páginas (>100)
- El PDF contiene imágenes de alta resolución
- Problemas de red con OpenAI

**Soluciones:**
1. Reducir el tamaño del PDF (comprimir imágenes)
2. Dividir el PDF en secciones más pequeñas
3. Aumentar `maxAttempts` en `/api/chat-blueprints/init/route.ts` (actualmente 120 segundos)
4. Aumentar `maxDuration` (actualmente 180 segundos)
5. Esperar unos minutos y reintentar

### Error: "Sesión no encontrada"
- La sesión fue eliminada o expiró
- Solución: Reinicializar chat

### Error: "Conversation not found"
- Recursos de OpenAI fueron eliminados manualmente
- Solución: Limpiar sesión y crear nueva

## 📚 Referencias

- [OpenAI Conversations API](https://platform.openai.com/docs/api-reference/conversations)
- [OpenAI Responses API](https://platform.openai.com/docs/api-reference/responses)
- [Vector Stores](https://platform.openai.com/docs/api-reference/vector-stores)
