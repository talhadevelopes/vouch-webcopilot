"use client";

import { useMutation } from "@tanstack/react-query";
import { GoogleLogin } from "@react-oauth/google";
import { motion } from "framer-motion";
import { KeyRound, LogIn, Mail, Sparkles, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { apiFetch, setAuthTokens } from "@/lib/api";
import type { LoginResponse } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";

type LoginFormValues = {
  name: string;
  email: string;
  password: string;
  otpCode: string;
};

export default function LoginPage() {
  const setUser = useAuthStore((state) => state.setUser);
  const setTokens = useAuthStore((state) => state.setTokens);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<LoginFormValues>({
    defaultValues: {
      name: "Demo User",
      email: "demo@vouch.app",
      password: "demo1234",
      otpCode: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (values: LoginFormValues) =>
      apiFetch<LoginResponse>("/auth/register", {
        method: "POST",
        body: values,
      }),
    onSuccess: (data) => {
      setUser(data.user);
      setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      setAuthTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      router.push("/dashboard");
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (values: Pick<LoginFormValues, "email" | "password">) =>
      apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: values,
      }),
    onSuccess: (data) => {
      setUser(data.user);
      setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      setAuthTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      router.push("/dashboard");
    },
  });

  const demoMutation = useMutation({
    mutationFn: async () =>
      apiFetch<LoginResponse>("/auth/demo-login", {
        method: "POST",
      }),
    onSuccess: (data) => {
      setUser(data.user);
      setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      setAuthTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      router.push("/dashboard");
    },
  });

  const otpRequestMutation = useMutation({
    mutationFn: async (email: string) =>
      apiFetch<{ email: string }>("/auth/otp/request", {
        method: "POST",
        body: { email },
      }),
  });

  const otpVerifyMutation = useMutation({
    mutationFn: async (values: { email: string; code: string }) =>
      apiFetch<LoginResponse>("/auth/otp/verify", {
        method: "POST",
        body: values,
      }),
    onSuccess: (data) => {
      setUser(data.user);
      setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      setAuthTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      router.push("/dashboard");
    },
  });

  const googleMutation = useMutation({
    mutationFn: async (idToken: string) =>
      apiFetch<LoginResponse>("/auth/google", {
        method: "POST",
        body: { idToken },
      }),
    onSuccess: (data) => {
      setUser(data.user);
      setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      setAuthTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      router.push("/dashboard");
    },
  });

  const loading =
    registerMutation.isPending ||
    loginMutation.isPending ||
    demoMutation.isPending ||
    otpRequestMutation.isPending ||
    otpVerifyMutation.isPending ||
    googleMutation.isPending;
  const errorMessage =
    (registerMutation.error as Error | null)?.message ||
    (loginMutation.error as Error | null)?.message ||
    (demoMutation.error as Error | null)?.message ||
    (otpRequestMutation.error as Error | null)?.message ||
    (otpVerifyMutation.error as Error | null)?.message ||
    (googleMutation.error as Error | null)?.message ||
    "";

  return (
    <main className="container">
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        style={{ maxWidth: 520, margin: "48px auto" }}
      >
        <h1>Login</h1>
        <p>Sign in to access your Vouch dashboard.</p>

        <form className="grid" onSubmit={handleSubmit((values) => registerMutation.mutate(values))}>
          <input
            className="input"
            type="text"
            placeholder="Name"
            {...register("name", { required: "Name is required" })}
          />
          {errors.name ? <p className="error-text">{errors.name.message}</p> : null}
          <input
            className="input"
            type="email"
            placeholder="Email"
            {...register("email", { required: "Email is required" })}
          />
          {errors.email ? <p className="error-text">{errors.email.message}</p> : null}
          <input
            className="input"
            type="password"
            placeholder="Password"
            {...register("password", {
              required: "Password is required",
              minLength: { value: 8, message: "Minimum 8 characters" },
            })}
          />
          {errors.password ? <p className="error-text">{errors.password.message}</p> : null}
          <button className="btn btn-primary" disabled={loading} type="submit">
            <UserPlus size={16} />
            {loading ? "Working..." : "Register"}
          </button>
        </form>

        <div className="button-row">
          <button
            className="btn btn-ghost"
            disabled={loading}
            onClick={() => {
              const values = getValues();
              loginMutation.mutate({ email: values.email, password: values.password });
            }}
            type="button"
          >
            <LogIn size={16} />
            Login
          </button>
          <button className="btn btn-ghost" disabled={loading} onClick={() => demoMutation.mutate()} type="button">
            <Sparkles size={16} />
            Demo Login
          </button>
        </div>

        <hr />
        <h3>Login with OTP</h3>
        <div className="button-row">
          <button
            className="btn btn-ghost"
            disabled={loading}
            onClick={() => otpRequestMutation.mutate(getValues().email)}
            type="button"
          >
            <Mail size={16} />
            Send OTP
          </button>
          <input className="input" placeholder="Enter 6-digit OTP" {...register("otpCode")} />
          <button
            className="btn btn-ghost"
            disabled={loading}
            onClick={() => otpVerifyMutation.mutate({ email: getValues().email, code: getValues().otpCode })}
            type="button"
          >
            <KeyRound size={16} />
            Verify OTP
          </button>
        </div>

        <hr />
        <h3>Google Login</h3>
        <p className="muted-text">Use your Google account to sign in quickly.</p>
        <div style={{ marginTop: 8 }}>
          <GoogleLogin
            onSuccess={(credentialResponse) => {
              const token = credentialResponse.credential || "";
              if (!token) return;
              googleMutation.mutate(token);
            }}
            onError={() => {
              // no-op: mutation error handling already drives UI
            }}
          />
        </div>

        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
      </motion.div>
    </main>
  );
}
