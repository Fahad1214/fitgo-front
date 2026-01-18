import { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/utils/url-utils";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/auth/",
          "/profile/",
          "/login/",
          "/slice-simulator/",
          "/_shop/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/api/",
          "/auth/",
          "/profile/",
          "/login/",
          "/slice-simulator/",
          "/_shop/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
