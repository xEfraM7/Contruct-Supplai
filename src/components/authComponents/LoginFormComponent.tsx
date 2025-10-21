"use client";

import { useState } from "react";
import { HardHat } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { signIn, signUp, signInWithGoogle } from "@/lib/actions/auth-actions";
import { loginSchema, registerSchema } from "@/lib/validations/auth";
import { ZodError } from "zod";

export function LoginFormComponent() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      const result = await signInWithGoogle();

      if (result.success && result.data?.url) {
        window.location.href = result.data.url;
      } else {
        setErrors({
          general: result.error || "Error al iniciar sesión con Google",
        });
      }
    } catch (err) {
      setErrors({ general: "Error al iniciar sesión con Google" });
      console.error("Google sign in error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      if (isLogin) {
        const validatedData = loginSchema.parse({ email, password });

        const result = await signIn(
          validatedData.email,
          validatedData.password,
          rememberMe
        );

        if (result.success) {
          router.push("/");
          router.refresh();
        } else {
          setErrors({ general: result.error || "Credenciales incorrectas" });
        }
      } else {
        const validatedData = registerSchema.parse({
          name,
          email,
          password,
          confirmPassword,
        });

        const result = await signUp(
          validatedData.email,
          validatedData.password,
          validatedData.name
        );

        if (result.success) {
          router.push("/");
          router.refresh();
        } else {
          setErrors({ general: result.error || "Error al registrarse" });
        }
      }
    } catch (err) {
      if (err instanceof ZodError) {
        const fieldErrors: Record<string, string> = {};
        if (err.issues && Array.isArray(err.issues)) {
          err.issues.forEach((issue) => {
            const path = issue.path[0] as string;
            fieldErrors[path] = issue.message;
          });
        }
        setErrors(fieldErrors);
      } else {
        setErrors({ general: "Ocurrió un error inesperado" });
        console.error("Auth error:", err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 bg-primary rounded-lg">
          <HardHat className="w-7 h-7 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">BuildPro</h2>
          <p className="text-sm text-muted-foreground">Construction CRM</p>
        </div>
      </div>

      {/* Welcome Text */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {isLogin ? "Welcome to BuildPro" : "Create your account"}
        </h1>
        <p className="text-muted-foreground">
          {isLogin
            ? "Please sign in to continue"
            : "Start managing your projects"}
        </p>
      </div>

      {/* Login / Register Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="name">Full company name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Graphical solutions inc."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`h-11 ${errors.name ? "border-red-500" : ""}`}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`h-11 ${errors.email ? "border-red-500" : ""}`}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`h-11 ${errors.password ? "border-red-500" : ""}`}
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`h-11 ${
                  errors.confirmPassword ? "border-red-500" : ""
                }`}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>
          )}
        </div>

        {isLogin && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <Label
                htmlFor="remember"
                className="text-sm font-normal cursor-pointer"
              >
                Remember me
              </Label>
            </div>
          </div>
        )}

        {errors.general && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
            {errors.general}
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-11 text-base font-medium"
          disabled={isLoading}
        >
          {isLoading ? "Cargando..." : isLogin ? "Sign In" : "Sign Up"}
        </Button>

        {isLogin && (
          <>
            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Social Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 bg-transparent"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>
          </>
        )}
      </form>

      {/* Switch login/register */}
      <div className="text-center text-sm">
        {isLogin ? (
          <>
            <span className="text-muted-foreground">
              Dont have an account?{" "}
            </span>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className="text-primary hover:underline font-medium"
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            <span className="text-muted-foreground">
              Already have an account?{" "}
            </span>
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </button>
          </>
        )}
      </div>
    </div>
  );
}
