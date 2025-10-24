import * as React from "react";
import { cn } from "@/lib/utils";

export type DateInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
>;

const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ className, value, onChange, ...props }, ref) => {
    // El input type="date" usa internamente YYYY-MM-DD
    // pero el navegador lo muestra en el formato local del usuario
    // En USA, automáticamente se muestra como MM/DD/YYYY
    
    return (
      <input
        type="date"
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        value={value}
        onChange={onChange}
        ref={ref}
        {...props}
      />
    );
  }
);
DateInput.displayName = "DateInput";

export { DateInput };
