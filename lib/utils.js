import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import * as Yup from "yup";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const getLoginValidationSchema = (t) =>
  Yup.object({
    email: Yup.string().email().required(t("email_is_required_key")),
    password: Yup.string().required(t("Password_is_required_key")),
  });
