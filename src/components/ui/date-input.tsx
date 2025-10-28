import * as React from "react";
import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";

export type DateInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
>;

const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ className, value, onChange, ...props }, ref) => {
    const dateInputRef = React.useRef<HTMLInputElement>(null);
    
    // Merge refs
    React.useImperativeHandle(ref, () => dateInputRef.current as HTMLInputElement);

    // Convert YYYY-MM-DD to MM-DD-YYYY for display
    const formatDateForDisplay = (dateStr: string) => {
      if (!dateStr) return "";
      const [year, month, day] = dateStr.split("-");
      if (!year || !month || !day) return "";
      return `${month}-${day}-${year}`;
    };

    // Convert MM-DD-YYYY to YYYY-MM-DD for storage
    const formatDateForStorage = (dateStr: string) => {
      if (!dateStr) return "";
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const [month, day, year] = parts;
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
      return "";
    };

    const displayValue = value ? formatDateForDisplay(String(value)) : "";

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // El input type="date" devuelve YYYY-MM-DD
      if (onChange) {
        onChange(e);
      }
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value.replace(/[^\d-]/g, ""); // Solo números y guiones

      // Auto-format mientras escribe: MM-DD-YYYY
      const parts = input.split("-");
      let formatted = "";

      if (parts[0]) {
        // Mes (máximo 2 dígitos)
        formatted = parts[0].substring(0, 2);
      }
      if (parts.length > 1 && parts[1]) {
        // Día (máximo 2 dígitos)
        formatted += "-" + parts[1].substring(0, 2);
      }
      if (parts.length > 2 && parts[2]) {
        // Año (máximo 4 dígitos)
        formatted += "-" + parts[2].substring(0, 4);
      }

      // Si tiene formato completo MM-DD-YYYY, convertir y actualizar
      if (formatted.length === 10) {
        const storageFormat = formatDateForStorage(formatted);
        if (storageFormat && onChange) {
          const syntheticEvent = {
            ...e,
            target: {
              ...e.target,
              value: storageFormat,
            },
          } as React.ChangeEvent<HTMLInputElement>;
          onChange(syntheticEvent);
        }
      } else if (formatted.length === 0 && onChange) {
        // Limpiar valor
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            value: "",
          },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    };

    const openCalendar = () => {
      if (dateInputRef.current) {
        dateInputRef.current.showPicker?.();
      }
    };

    return (
      <div className="relative">
        {/* Input visible con formato MM-DD-YYYY */}
        <input
          type="text"
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          placeholder="MM-DD-YYYY"
          value={displayValue}
          onChange={handleTextChange}
          maxLength={10}
          {...props}
        />

        {/* Icono de calendario que abre el picker */}
        <button
          type="button"
          onClick={openCalendar}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          tabIndex={-1}
        >
          <Calendar className="w-4 h-4" />
        </button>

        {/* Input date oculto para el calendario nativo */}
        <input
          ref={dateInputRef}
          type="date"
          className="absolute inset-0 opacity-0 cursor-pointer"
          value={value}
          onChange={handleDateChange}
          tabIndex={-1}
          style={{ pointerEvents: "none" }}
        />
      </div>
    );
  }
);
DateInput.displayName = "DateInput";

export { DateInput };
