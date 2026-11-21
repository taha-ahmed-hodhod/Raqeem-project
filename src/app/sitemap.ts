import type { MetadataRoute } from "next";
import { getPublicEnv } from "@/lib/env";

const PUBLIC_PATHS = [
  "",
  "/about",
  "/portfolio",
  "/how-it-works",
  "/pricing",
  "/order",
  "/track",
  "/faq",
  "/contact",
  "/privacy",
  "/terms",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const { NEXT_PUBLIC_APP_URL } = getPublicEnv();
  const baseUrl = NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  const lastModified = new Date();

  const entries: MetadataRoute.Sitemap = [];

  for (const routePath of PUBLIC_PATHS) {
    const arUrl = `${baseUrl}/ar${routePath}`;
    const enUrl = `${baseUrl}/en${routePath}`;

    entries.push({
      url: arUrl,
      lastModified,
      changeFrequency: routePath === "" ? "weekly" : "monthly",
      priority: routePath === "" ? 1.0 : routePath === "/order" ? 0.9 : 0.7,
      alternates: {
        languages: {
          ar: arUrl,
          en: enUrl,
        },
      },
    });

    entries.push({
      url: enUrl,
      lastModified,
      changeFrequency: routePath === "" ? "weekly" : "monthly",
      priority: routePath === "" ? 0.9 : routePath === "/order" ? 0.85 : 0.65,
      alternates: {
        languages: {
          ar: arUrl,
          en: enUrl,
        },
      },
    });
  }

  return entries;
}
