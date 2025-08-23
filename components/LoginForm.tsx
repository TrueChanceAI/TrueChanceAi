"use client";

import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { LoginSchema } from "@/validation/auth.validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useSignIn } from "@/hooks/auth";

interface LoginFormValues {
  email: string;
  password: string;
}

const LoginForm = () => {
  const { t } = useLanguage();
  const { signIn, isLoading, error } = useSignIn();
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (
    values: LoginFormValues,
    { setSubmitting, setFieldError }: any
  ) => {
    try {
      await signIn(values);
    } catch (error) {
      setFieldError("general", "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white">
          {t("auth.welcomeBack")}
        </h1>
        <p className="text-white/70">{t("auth.signInToAccount")}</p>
      </div>

      {/* Formik Form */}
      <Formik
        initialValues={{
          email: "",
          password: "",
        }}
        validationSchema={LoginSchema}
        onSubmit={handleSubmit}
      >
        {({
          values,
          errors,
          touched,
          isSubmitting,
          setFieldValue,
          setFieldTouched,
        }) => (
          <Form className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white font-medium">
                {t("auth.emailAddress")}
              </Label>
              <Field name="email">
                {({ field, meta }: any) => (
                  <Input
                    {...field}
                    id="email"
                    type="email"
                    placeholder={t("auth.emailPlaceholder")}
                    className={cn(
                      "bg-white/10 border-white/20 text-white placeholder:text-white/50",
                      "focus:bg-white/20 focus:border-white/40",
                      "transition-all duration-200",
                      meta.touched &&
                        meta.error &&
                        "border-red-400 focus:border-red-400"
                    )}
                    disabled={isLoading}
                    onChange={(e) => {
                      field.onChange(e);
                      setFieldValue("email", e.target.value);
                    }}
                    onBlur={(e) => {
                      field.onBlur(e);
                      setFieldTouched("email", true);
                    }}
                  />
                )}
              </Field>
              <ErrorMessage name="email">
                {(msg) => <p className="text-red-400 text-sm">{msg}</p>}
              </ErrorMessage>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white font-medium">
                {t("auth.password")}
              </Label>
              <div className="relative">
                <Field name="password">
                  {({ field, meta }: any) => (
                    <Input
                      {...field}
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t("auth.passwordPlaceholder")}
                      className={cn(
                        "bg-white/10 border-white/20 text-white placeholder:text-white/50 pr-12",
                        "focus:bg-white/20 focus:border-white/40",
                        "transition-all duration-200",
                        meta.touched &&
                          meta.error &&
                          "border-red-400 focus:border-red-400"
                      )}
                      disabled={isLoading}
                      onChange={(e) => {
                        field.onChange(e);
                        setFieldValue("password", e.target.value);
                      }}
                      onBlur={(e) => {
                        field.onBlur(e);
                        setFieldTouched("password", true);
                      }}
                    />
                  )}
                </Field>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
              </div>
              <ErrorMessage name="password">
                {(msg) => <p className="text-red-400 text-sm">{msg}</p>}
              </ErrorMessage>
            </div>

            {/* General Error */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                <p className="text-red-400 text-sm text-center">
                  {(error?.response as any)?.data?.error ||
                    (error?.response as any)?.message ||
                    error?.message ||
                    "Something went wrong"}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg cursor-pointer"
              disabled={isLoading || isSubmitting}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t("auth.signingIn")}
                </div>
              ) : (
                t("auth.signIn")
              )}
            </Button>
          </Form>
        )}
      </Formik>

      {/* Links */}
      <div className="text-center space-y-3">
        <div className="text-sm">
          <span className="text-white/70">{t("auth.dontHaveAccount")} </span>
          <Link
            href="/signup"
            className="text-purple-300 hover:text-purple-200 font-medium transition-colors"
          >
            {t("auth.signUp")}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
