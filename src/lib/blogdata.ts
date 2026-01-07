import { createClient } from "@/prismicio";
import { asHTML, asText } from "@prismicio/client";
import type { BlogDocument } from "../../prismicio-types";

export interface BlogPost {
  id: string;
  slug: string;
  image: string;
  category: string;
  tags: string[];
  date: string;
  title: string;
  subtitle?: string;
  description?: string;
  alt?: string;
  content?: string;
  author?: string;
}

/**
 * Transform Prismic blog document to BlogPost format
 */
function transformBlogPost(doc: BlogDocument): BlogPost {
  const imageUrl = doc.data.image?.url || "/BlogPage.png";
  const imageAlt = doc.data.image?.alt || asText(doc.data.title) || "";

  return {
    id: doc.id,
    slug: doc.uid,
    image: imageUrl,
    category: "Blog", // Keep for backward compatibility
    tags: doc.tags || [], // Get tags from Prismic document
    date: doc.first_publication_date
      ? new Date(doc.first_publication_date).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })
      : "",
    title: asText(doc.data.title) || "",
    subtitle: undefined, // Add subtitle field in Prismic if needed
    description: asText(doc.data.description) || undefined,
    alt: imageAlt,
    content: asHTML(doc.data.content) || "",
    author: asText(doc.data.author_name) || undefined,
  };
}

/**
 * Get all blog posts from Prismic
 */
export async function getAllBlogPosts(): Promise<BlogPost[]> {
  const client = createClient();

  try {
    const response = await client.getAllByType("blog", {
      orderings: [
        {
          field: "document.first_publication_date",
          direction: "desc",
        },
      ],
    });

    return response.map(transformBlogPost);
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return [];
  }
}

/**
 * Get a single blog post by slug
 */
export async function getBlogPostBySlug(
  slug: string
): Promise<BlogPost | null> {
  const client = createClient();

  try {
    const doc = await client.getByUID("blog", slug);

    if (!doc) {
      return null;
    }

    return transformBlogPost(doc);
  } catch (error) {
    console.error("Error fetching blog post:", error);
    return null;
  }
}

/**
 * Get related blog posts with matching tags (excluding the current post)
 */
export async function getRelatedBlogPosts(
  currentSlug: string,
  limit: number = 3
): Promise<BlogPost[]> {
  const client = createClient();

  try {
    // First, get the current post to access its tags
    const currentPost = await client.getByUID("blog", currentSlug);
    const currentTags = currentPost?.tags || [];

    // If no tags, return empty array or fallback to any posts
    if (currentTags.length === 0) {
      const response = await client.getAllByType("blog", {
        orderings: [
          {
            field: "document.first_publication_date",
            direction: "desc",
          },
        ],
      });

      return response
        .filter((doc) => doc.uid !== currentSlug)
        .slice(0, limit)
        .map(transformBlogPost);
    }

    // Get all blog posts
    const response = await client.getAllByType("blog", {
      orderings: [
        {
          field: "document.first_publication_date",
          direction: "desc",
        },
      ],
    });

    // Filter posts that have at least one matching tag
    const relatedDocs = response
      .filter((doc) => {
        // Exclude the current post
        if (doc.uid === currentSlug) {
          return false;
        }

        // Check if there's at least one matching tag
        const docTags = doc.tags || [];
        return docTags.some((tag) => currentTags.includes(tag));
      })
      .slice(0, limit)
      .map(transformBlogPost);

    // Return only posts with matching tags (no fallback to unrelated posts)
    return relatedDocs;
  } catch (error) {
    console.error("Error fetching related blog posts:", error);
    return [];
  }
}
