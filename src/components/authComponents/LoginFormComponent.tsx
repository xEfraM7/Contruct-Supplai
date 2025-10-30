"use client";

import { useState } from "react";
import { HardHat, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { signInWithGoogle } from "@/lib/actions/auth-actions";
import { loginSchema, registerSchema } from "@/lib/validations/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export function LoginFormComponent() {
  const [isLogin, setIsLogin] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);
  const [generalError, setGeneralError] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Credenciales incorrectas");
      }

      return result;
    },
    onSuccess: () => {
      window.location.href = "/overview";
    },
    onError: (error: Error) => {
      setGeneralError(error.message);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          name: data.name,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Error al registrarse");
      }

      return result;
    },
    onSuccess: () => {
      window.location.href = "/overview";
    },
    onError: (error: Error) => {
      setGeneralError(error.message);
    },
  });

  const googleSignInMutation = useMutation({
    mutationFn: async () => {
      const result = await signInWithGoogle();

      if (!result.success || !result.data?.url) {
        throw new Error(result.error || "Error al iniciar sesión con Google");
      }

      return result.data.url;
    },
    onSuccess: (url) => {
      window.location.href = url;
    },
    onError: (error: Error) => {
      setGeneralError(error.message);
    },
  });

  const onLoginSubmit = (data: LoginFormData) => {
    setGeneralError("");
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormData) => {
    setGeneralError("");
    registerMutation.mutate(data);
  };

  const handleGoogleSignIn = () => {
    setGeneralError("");
    googleSignInMutation.mutate();
  };

  const isLoading =
    loginMutation.isPending ||
    registerMutation.isPending ||
    googleSignInMutation.isPending;

  return (
    <div className="space-y-8">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 bg-primary rounded-lg">
          <HardHat className="w-7 h-7 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Construct Supplia
          </h2>
          <p className="text-sm text-muted-foreground">Construction CRM</p>
        </div>
      </div>

      {/* Welcome Text */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {isLogin ? "Welcome to Construct Supplia" : "Create your account"}
        </h1>
        <p className="text-muted-foreground">
          {isLogin
            ? "Please sign in to continue"
            : "Start managing your projects"}
        </p>
      </div>

      {/* Login / Register Form */}
      <form
        onSubmit={
          isLogin
            ? loginForm.handleSubmit(onLoginSubmit)
            : registerForm.handleSubmit(onRegisterSubmit)
        }
        className="space-y-6"
      >
        <div className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="name">Full company name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Graphical solutions inc."
                {...registerForm.register("name")}
                className={`h-11 ${
                  registerForm.formState.errors.name ? "border-red-500" : ""
                }`}
              />
              {registerForm.formState.errors.name && (
                <p className="text-sm text-red-600">
                  {registerForm.formState.errors.name.message}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              {...(isLogin
                ? loginForm.register("email")
                : registerForm.register("email"))}
              className={`h-11 ${
                (
                  isLogin
                    ? loginForm.formState.errors.email
                    : registerForm.formState.errors.email
                )
                  ? "border-red-500"
                  : ""
              }`}
            />
            {isLogin
              ? loginForm.formState.errors.email && (
                  <p className="text-sm text-red-600">
                    {loginForm.formState.errors.email.message}
                  </p>
                )
              : registerForm.formState.errors.email && (
                  <p className="text-sm text-red-600">
                    {registerForm.formState.errors.email.message}
                  </p>
                )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                {...(isLogin
                  ? loginForm.register("password")
                  : registerForm.register("password"))}
                className={`h-11 pr-10 ${
                  (
                    isLogin
                      ? loginForm.formState.errors.password
                      : registerForm.formState.errors.password
                  )
                    ? "border-red-500"
                    : ""
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {isLogin
              ? loginForm.formState.errors.password && (
                  <p className="text-sm text-red-600">
                    {loginForm.formState.errors.password.message}
                  </p>
                )
              : registerForm.formState.errors.password && (
                  <p className="text-sm text-red-600">
                    {registerForm.formState.errors.password.message}
                  </p>
                )}
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repeat your password"
                  {...registerForm.register("confirmPassword")}
                  className={`h-11 pr-10 ${
                    registerForm.formState.errors.confirmPassword
                      ? "border-red-500"
                      : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {registerForm.formState.errors.confirmPassword && (
                <p className="text-sm text-red-600">
                  {registerForm.formState.errors.confirmPassword.message}
                </p>
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

        {generalError && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
            {generalError}
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
