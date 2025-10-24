import * as React from "react";
import { cn } from "@/lib/utils";

export type DateInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
>;

const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ className, value, onChange, ...props }, ref) => {
    // Convert YYYY-MM-DD to MM/DD/YYYY for display
    const formatDateForDisplay = (dateStr: string) => {
      if (!dateStr) return "";
      const [year, month, day] = dateStr.split("-");
      return `${month}/${day}/${year}`;
    };

    // Convert MM/DD/YYYY to YYYY-MM-DD for storage
    const formatDateForStorage = (dateStr: string) => {
      if (!dateStr) return "";
      const parts = dateStr.replace(/\D/g, ""); // Remove non-digits
      if (parts.length >= 8) {
        const month = parts.substring(0, 2);
        const day = parts.substring(2, 4);
        const year = parts.substring(4, 8);
        return `${year}-${month}-${day}`;
      }
      return "";
    };

    const [displayValue, setDisplayValue] = React.useState(() =>
      value ? formatDateForDisplay(String(value)) : ""
    );

    React.useEffect(() => {
      if (value) {
        setDisplayValue(formatDateForDisplay(String(value)));
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let input = e.target.value.replace(/\D/g, ""); // Remove non-digits

      // Format as MM/DD/YYYY while typing
      if (input.length >= 2) {
        input = input.substring(0, 2) + "/" + input.substring(2);
      }
      if (input.length >= 5) {
        input = input.substring(0, 5) + "/" + input.substring(5, 9);
      }

      setDisplayValue(input);

      // Only trigger onChange when we have a complete date
      if (input.length === 10) {
        const storageFormat = formatDateForStorage(input);
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
      } else if (input.length === 0 && onChange) {
        // Clear the value
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

    return (
      <input
        type="text"
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        placeholder="MM/DD/YYYY"
        value={displayValue}
        onChange={handleChange}
        maxLength={10}
        ref={ref}
        {...props}
      />
    );
  }
);
DateInput.displayName = "DateInput";

export { DateInput };
