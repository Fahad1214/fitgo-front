import { MetadataRoute } from "next";
import { getAllBlogPosts } from "@/lib/blogdata";
import { getAllLocations } from "@/lib/locationdata";
import { getBaseUrl } from "@/lib/utils/url-utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const currentDate = new Date();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/locations`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact-us`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  // Dynamic blog posts
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const blogPosts = await getAllBlogPosts();
    blogPages = blogPosts
      .filter((post) => !post.noIndex) // Exclude posts with no_index enabled
      .map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: post.publishDate
          ? new Date(post.publishDate)
          : currentDate,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
  } catch (error) {
    console.error("Error fetching blog posts for sitemap:", error);
  }

  // Dynamic location pages
  let locationPages: MetadataRoute.Sitemap = [];
  try {
    const locations = await getAllLocations();
    locationPages = locations.map((location) => ({
      url: `${baseUrl}/locations/${location.slug}`,
      lastModified: currentDate,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error("Error fetching locations for sitemap:", error);
  }

  return [...staticPages, ...blogPages, ...locationPages];
}
