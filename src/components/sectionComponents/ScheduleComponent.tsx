"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  Clock,
  Plus,
  MapPin,
  Users,
  AlertTriangle,
  CheckCircle,
  Wrench,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

// Tipos para eventos de construcción
interface ConstructionEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  startTime: string;
  endTime: string;
  type:
    | "meeting"
    | "inspection"
    | "delivery"
    | "milestone"
    | "maintenance"
    | "safety";
  priority: "low" | "medium" | "high" | "critical";
  location: string;
  assignedTo: string[];
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  projectId?: string;
}

const eventTypeConfig = {
  meeting: { icon: Users, color: "bg-blue-500", label: "Reunión" },
  inspection: { icon: CheckCircle, color: "bg-green-500", label: "Inspección" },
  delivery: { icon: Truck, color: "bg-orange-500", label: "Entrega" },
  milestone: { icon: AlertTriangle, color: "bg-purple-500", label: "Hito" },
  maintenance: { icon: Wrench, color: "bg-yellow-500", label: "Mantenimiento" },
  safety: { icon: AlertTriangle, color: "bg-red-500", label: "Seguridad" },
};

const priorityConfig = {
  low: { color: "bg-gray-500", label: "Baja" },
  medium: { color: "bg-blue-500", label: "Media" },
  high: { color: "bg-orange-500", label: "Alta" },
  critical: { color: "bg-red-500", label: "Crítica" },
};

export function ScheduleComponent() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");

  // Datos de ejemplo para eventos de construcción
  const [events] = useState<ConstructionEvent[]>([
    {
      id: "1",
      title: "Inspección de Cimientos",
      description:
        "Revisión estructural de los cimientos del edificio principal",
      date: new Date(2024, 9, 25),
      startTime: "09:00",
      endTime: "11:00",
      type: "inspection",
      priority: "high",
      location: "Obra Principal - Sector A",
      assignedTo: ["Ing. García", "Arq. López"],
      status: "scheduled",
      projectId: "PROJ-001",
    },
    {
      id: "2",
      title: "Entrega de Materiales",
      description: "Recepción de acero estructural y cemento",
      date: new Date(2024, 9, 26),
      startTime: "07:00",
      endTime: "09:00",
      type: "delivery",
      priority: "medium",
      location: "Almacén Principal",
      assignedTo: ["Supervisor Martín"],
      status: "scheduled",
    },
    {
      id: "3",
      title: "Reunión de Avance Semanal",
      description: "Revisión del progreso y planificación de la próxima semana",
      date: new Date(2024, 9, 28),
      startTime: "14:00",
      endTime: "15:30",
      type: "meeting",
      priority: "medium",
      location: "Oficina de Obra",
      assignedTo: ["Todo el equipo"],
      status: "scheduled",
    },
    {
      id: "4",
      title: "Capacitación de Seguridad",
      description: "Entrenamiento mensual en protocolos de seguridad",
      date: new Date(2024, 9, 30),
      startTime: "08:00",
      endTime: "10:00",
      type: "safety",
      priority: "critical",
      location: "Aula de Capacitación",
      assignedTo: ["Todos los trabajadores"],
      status: "scheduled",
    },
  ]);

  // Generar calendario
  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);

    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const calendarDays = generateCalendar();

  // Obtener eventos para una fecha específica
  const getEventsForDate = (date: Date) => {
    return events.filter(
      (event) => event.date.toDateString() === date.toDateString()
    );
  };

  // Estadísticas calculadas
  const todayEvents = getEventsForDate(new Date());
  const thisWeekEvents = events.filter((event) => {
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    const weekEnd = new Date(
      today.setDate(today.getDate() - today.getDay() + 6)
    );
    return event.date >= weekStart && event.date <= weekEnd;
  });
  const overdueTasks = events.filter(
    (event) => event.date < new Date() && event.status !== "completed"
  );

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
            Agenda de Construcción
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona eventos, inspecciones y entregas del proyecto
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            value={viewMode}
            onValueChange={(value: "month" | "week" | "day") =>
              setViewMode(value)
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Mes</SelectItem>
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="day">Día</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Evento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Evento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    placeholder="Ej: Inspección de estructura"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Tipo de Evento</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meeting">Reunión</SelectItem>
                      <SelectItem value="inspection">Inspección</SelectItem>
                      <SelectItem value="delivery">Entrega</SelectItem>
                      <SelectItem value="milestone">Hito</SelectItem>
                      <SelectItem value="maintenance">Mantenimiento</SelectItem>
                      <SelectItem value="safety">Seguridad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="date">Fecha</Label>
                    <Input id="date" type="date" />
                  </div>
                  <div>
                    <Label htmlFor="priority">Prioridad</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Prioridad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baja</SelectItem>
                        <SelectItem value="medium">Media</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="critical">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="startTime">Hora Inicio</Label>
                    <Input id="startTime" type="time" />
                  </div>
                  <div>
                    <Label htmlFor="endTime">Hora Fin</Label>
                    <Input id="endTime" type="time" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="location">Ubicación</Label>
                  <Input
                    id="location"
                    placeholder="Ej: Obra Principal - Sector A"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    placeholder="Detalles del evento..."
                  />
                </div>
                <Button className="w-full">Crear Evento</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Schedule Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-card-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentDate(
                    new Date(
                      currentDate.getFullYear(),
                      currentDate.getMonth() - 1
                    )
                  )
                }
              >
                ←
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Hoy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentDate(
                    new Date(
                      currentDate.getFullYear(),
                      currentDate.getMonth() + 1
                    )
                  )
                }
              >
                →
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-4">
              {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
                <div
                  key={day}
                  className="p-2 text-center text-sm font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                const dayEvents = getEventsForDate(day);
                const isCurrentMonth =
                  day.getMonth() === currentDate.getMonth();
                const isToday =
                  day.toDateString() === new Date().toDateString();
                const isSelected =
                  selectedDate?.toDateString() === day.toDateString();

                return (
                  <div
                    key={index}
                    className={`
                      min-h-[80px] p-1 border border-border/50 cursor-pointer transition-colors
                      ${isCurrentMonth ? "bg-background" : "bg-muted/30"}
                      ${isToday ? "bg-primary/10 border-primary" : ""}
                      ${isSelected ? "bg-primary/20" : ""}
                      hover:bg-muted/50
                    `}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div
                      className={`text-sm ${
                        isCurrentMonth
                          ? "text-foreground"
                          : "text-muted-foreground"
                      } ${isToday ? "font-bold" : ""}`}
                    >
                      {day.getDate()}
                    </div>
                    <div className="space-y-1 mt-1">
                      {dayEvents.slice(0, 2).map((event) => {
                        const EventIcon = eventTypeConfig[event.type].icon;
                        return (
                          <div
                            key={event.id}
                            className={`text-xs p-1 rounded text-white truncate ${
                              eventTypeConfig[event.type].color
                            }`}
                            title={event.title}
                          >
                            <EventIcon className="w-3 h-3 inline mr-1" />
                            {event.title}
                          </div>
                        );
                      })}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayEvents.length - 2} más
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Próximos Eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {events
                .filter((event) => event.date >= new Date())
                .sort((a, b) => a.date.getTime() - b.date.getTime())
                .slice(0, 5)
                .map((event) => {
                  const EventIcon = eventTypeConfig[event.type].icon;
                  return (
                    <div
                      key={event.id}
                      className="border border-border rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`p-1 rounded ${
                              eventTypeConfig[event.type].color
                            }`}
                          >
                            <EventIcon className="w-3 h-3 text-white" />
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">
                              {event.title}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {event.date.toLocaleDateString("es-ES")} •{" "}
                              {event.startTime}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            priorityConfig[event.priority].color
                          } text-white`}
                        >
                          {priorityConfig[event.priority].label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </div>
                      {event.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              {events.filter((event) => event.date >= new Date()).length ===
                0 && (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                  <p className="text-lg font-medium text-muted-foreground">
                    Sin eventos programados
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Tus próximos eventos aparecerán aquí
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Eventos Hoy
                </p>
                <p className="text-3xl font-bold text-card-foreground">
                  {todayEvents.length}
                </p>
                <p className="text-xs mt-2 text-muted-foreground">
                  {todayEvents.length === 0
                    ? "Sin eventos hoy"
                    : `${todayEvents.length} evento${
                        todayEvents.length > 1 ? "s" : ""
                      } programado${todayEvents.length > 1 ? "s" : ""}`}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Esta Semana
                </p>
                <p className="text-3xl font-bold text-card-foreground">
                  {thisWeekEvents.length}
                </p>
                <p className="text-xs mt-2 text-muted-foreground">
                  Eventos programados
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Tareas Vencidas
                </p>
                <p className="text-3xl font-bold text-red-500">
                  {overdueTasks.length}
                </p>
                <p className="text-xs mt-2 text-muted-foreground">
                  {overdueTasks.length === 0
                    ? "Sin tareas vencidas"
                    : "Requieren atención"}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Inspecciones
                </p>
                <p className="text-3xl font-bold text-green-500">
                  {events.filter((e) => e.type === "inspection").length}
                </p>
                <p className="text-xs mt-2 text-muted-foreground">
                  Programadas este mes
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Details Modal */}
      {selectedDate && (
        <Card className="mt-6 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">
              Eventos para{" "}
              {selectedDate.toLocaleDateString("es-ES", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getEventsForDate(selectedDate).map((event) => {
                const EventIcon = eventTypeConfig[event.type].icon;
                return (
                  <div
                    key={event.id}
                    className="border border-border rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            eventTypeConfig[event.type].color
                          }`}
                        >
                          <EventIcon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{event.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {event.startTime} - {event.endTime}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge
                          variant="secondary"
                          className={`${
                            priorityConfig[event.priority].color
                          } text-white`}
                        >
                          {priorityConfig[event.priority].label}
                        </Badge>
                        <Badge variant="outline">
                          {eventTypeConfig[event.type].label}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{event.assignedTo.join(", ")}</span>
                      </div>
                    </div>

                    {event.description && (
                      <p className="text-sm text-muted-foreground mt-3 p-3 bg-muted/50 rounded">
                        {event.description}
                      </p>
                    )}
                  </div>
                );
              })}
              {getEventsForDate(selectedDate).length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No hay eventos programados para esta fecha
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
