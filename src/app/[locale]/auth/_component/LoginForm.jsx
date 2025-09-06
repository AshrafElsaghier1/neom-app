"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { signIn } from "next-auth/react";
import { Label } from "@/components/ui/label";
import { Form, Formik } from "formik";
import { useTranslations } from "next-intl";
import { getLoginValidationSchema } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const t = useTranslations("loginPage");
  const router = useRouter();
  const handleSubmit = async (values, { setSubmitting }) => {
    setSubmitting(true);
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: values.email,
        password: values.password,
      });

      if (result?.error) {
        toast.error(result.error || t("Invalid_email_or_password_key"));
      } else {
        toast.success(t("Login_success_key"));
        router.push("/");
      }
    } catch (err) {
      console.error("Login error:", { err });
      toast.error(t("Login_error_key"));
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <Formik
      initialValues={{
        email: "",
        password: "",
      }}
      validationSchema={getLoginValidationSchema(t)}
      onSubmit={handleSubmit}
    >
      {({
        values,
        errors,
        touched,
        handleChange,
        handleBlur,
        isSubmitting,
      }) => (
        <Form className="space-y-4 max-w-[600px] max-auto">
          <div className="space-y-2">
            <Label htmlFor="email"> {t("email_key")}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-secondary" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t("Enter_email_key")}
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`pl-10 ${
                  errors.email && touched.email
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : ""
                }`}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password"> {t("Password_key")}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-secondary" />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`pl-10 pr-10 ${
                  errors.password && touched.password
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : ""
                }`}
              />
              <Button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-3 h-4 w-4 text-secondary   bg-transparent hover:bg-transparent cursor-pointer"
                disabled={isSubmitting}
                aria-label={showPassword ? "Hide password" : "Show password"}
                variant="default"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-secondary" />
                ) : (
                  <Eye className="h-4 w-4 text-secondary" />
                )}
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full cursor-pointer bg-main text-white hover:bg-main/80"
            disabled={isSubmitting}
          >
            {isSubmitting ? t("Signing_In_key") : t("Sign_In_key")}
          </Button>
        </Form>
      )}
    </Formik>
  );
}
