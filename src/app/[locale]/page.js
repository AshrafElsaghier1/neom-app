import { getTranslations } from "next-intl/server";

export default async function HomePage() {
  const t = await getTranslations("login-page");
  return <h1 className="text-main-color  ">{t("title")}</h1>;
}
