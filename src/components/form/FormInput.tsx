import { forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { themeColors } from "@/lib/theme";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
  helperText?: string;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, required, helperText, className, ...props }, ref) => {
    return (
      <div className="grid gap-2">
        {label && (
          <Label htmlFor={props.id}>
            {label}
            {required && <span className={`${themeColors.status.error.text} ml-1`}>*</span>}
          </Label>
        )}
        <Input
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

FormInput.displayName = "FormInput";
