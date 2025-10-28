import { forwardRef } from "react";
import { DateInput } from "@/components/ui/date-input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { themeColors } from "@/lib/theme";

interface FormDateInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
  required?: boolean;
  helperText?: string;
}

export const FormDateInput = forwardRef<HTMLInputElement, FormDateInputProps>(
  ({ label, error, required, helperText, className, ...props }, ref) => {
    return (
      <div className="grid gap-2">
        {label && (
          <Label htmlFor={props.id}>
            {label}
            {required && <span className={`${themeColors.status.error.text} ml-1`}>*</span>}
          </Label>
        )}
        <DateInput
          ref={ref}
          className={cn(error && "border-red-500", className)}
          {...props}
        />
        {error && <p className={`text-sm ${themeColors.status.error.text}`}>{error}</p>}
        {helperText && !error && (
          <p className="text-sm text-muted-foreground">{helperText}</p>
        )}
      </div>
    );
  }
);

FormDateInput.displayName = "FormDateInput";
