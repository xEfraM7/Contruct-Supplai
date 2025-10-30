import * as React from "react";
import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";

export type DateInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
>;

const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ className, value, onChange, ...props }, ref) => {
    const textInputRef = React.useRef<HTMLInputElement>(null);
    const dateInputRef = React.useRef<HTMLInputElement>(null);
    const [textValue, setTextValue] = React.useState("");

    // Merge refs - expose the text input
    React.useImperativeHandle(
      ref,
      () => textInputRef.current as HTMLInputElement
    );

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
        if (year.length === 4) {
          return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        }
      }
      return "";
    };

    // Sync text value with prop value
    React.useEffect(() => {
      if (value) {
        setTextValue(formatDateForDisplay(String(value)));
      } else {
        setTextValue("");
      }
    }, [value]);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // El input type="date" devuelve YYYY-MM-DD
      const dateValue = e.target.value;
      
      // Actualizar el valor de texto con el formato MM-DD-YYYY
      if (dateValue) {
        setTextValue(formatDateForDisplay(dateValue));
      } else {
        setTextValue("");
      }
      
      // Llamar al onChange del formulario con el valor en formato YYYY-MM-DD
      if (onChange) {
        const syntheticEvent = {
          target: {
            value: dateValue,
            name: props.name || "",
          },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let input = e.target.value.replace(/[^\d]/g, ""); // Solo números

      // Auto-format mientras escribe: MM-DD-YYYY
      if (input.length >= 2) {
        input = input.substring(0, 2) + "-" + input.substring(2);
      }
      if (input.length >= 5) {
        input = input.substring(0, 5) + "-" + input.substring(5);
      }
      if (input.length > 10) {
        input = input.substring(0, 10);
      }

      setTextValue(input);

      // Si tiene formato completo MM-DD-YYYY, convertir y actualizar
      if (input.length === 10) {
        const storageFormat = formatDateForStorage(input);
        if (storageFormat && onChange) {
          const syntheticEvent = {
            target: {
              value: storageFormat,
              name: props.name || "",
            },
          } as React.ChangeEvent<HTMLInputElement>;
          onChange(syntheticEvent);
        }
      } else if (input.length === 0 && onChange) {
        // Limpiar valor
        const syntheticEvent = {
          target: {
            value: "",
            name: props.name || "",
          },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    };

    const openCalendar = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (dateInputRef.current) {
        dateInputRef.current.showPicker?.();
      }
    };

    return (
      <div className="relative">
        {/* Input visible con formato MM-DD-YYYY */}
        <input
          ref={textInputRef}
          type="text"
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          placeholder="MM-DD-YYYY"
          value={textValue}
          onChange={handleTextChange}
          disabled={props.disabled}
          name={props.name}
          id={props.id}
        />

        {/* Icono de calendario que abre el picker */}
        <button
          type="button"
          onClick={openCalendar}
          disabled={props.disabled}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          tabIndex={-1}
        >
          <Calendar className="w-4 h-4" />
        </button>

        {/* Input date oculto para el calendario nativo */}
        <input
          ref={dateInputRef}
          type="date"
          value={(value as string) || ""}
          onChange={handleDateChange}
          disabled={props.disabled}
          tabIndex={-1}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "1px",
            height: "1px",
            opacity: 0,
            pointerEvents: "none",
          }}
        />
      </div>
    );
  }
);
DateInput.displayName = "DateInput";

export { DateInput };
