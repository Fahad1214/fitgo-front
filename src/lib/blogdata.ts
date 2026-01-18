import { createClient } from "@/prismicio";
import { asHTML, asText } from "@prismicio/client";
import type { BlogDocument } from "../../prismicio-types";

export interface FAQItem {
  question: string;
  answer: string;
}

export interface RelatedQuestionItem {
  question: string;
  answer: string;
}

export interface KeyTakeawayItem {
  takeaway: string;
}

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
  // SEO Fields
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  secondaryKeywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  noIndex?: boolean;
  // AEO Fields
  quickAnswer?: string;
  faq?: FAQItem[];
  relatedQuestions?: RelatedQuestionItem[];
  keyTakeaways?: KeyTakeawayItem[];
  featureSnippetTarget?: string;
  tableOfContents?: boolean;
  schemaType?: string;
  readingTime?: number;
  publishDate?: string;
}

/**
 * Transform Prismic blog document to BlogPost format
 */
function transformBlogPost(doc: BlogDocument): BlogPost {
  const imageUrl = doc.data.image?.url || "/BlogPage.png";
  const imageAlt = doc.data.image?.alt || asText(doc.data.title) || "";
  const ogImageUrl = doc.data.og_image?.url || imageUrl;

  // Transform FAQ items
  const faqItems: FAQItem[] = (doc.data.faq || []).map((item) => ({
    question: asText(item.question) || "",
    answer: asHTML(item.answer) || "",
  }));

  // Transform Related Questions items
  const relatedQuestionsItems: RelatedQuestionItem[] = (doc.data.related_questions || []).map((item) => ({
    question: asText(item.question) || "",
    answer: asHTML(item.answer) || "",
  }));

  // Transform Key Takeaways items
  const keyTakeawaysItems: KeyTakeawayItem[] = (doc.data.key_takeways || []).map((item) => ({
    takeaway: asHTML(item.takeaway) || "",
  }));

  // Get canonical URL
  let canonicalUrl: string | undefined;
  if (doc.data.cannonical_url) {
    // Prismic link fields can be external links (with url) or document links
    if (doc.data.cannonical_url.link_type === "Web" && doc.data.cannonical_url.url) {
      canonicalUrl = doc.data.cannonical_url.url;
    } else if (doc.data.cannonical_url.link_type === "Document") {
      // For document links, you might want to resolve them using your route resolver
      // For now, we'll skip document links for canonical URLs
      canonicalUrl = undefined;
    }
  }

  return {
    id: doc.id,
    slug: doc.uid,
    image: imageUrl,
    category: doc.data.content_category || "Blog",
    tags: doc.tags || [],
    date: doc.first_publication_date
      ? new Date(doc.first_publication_date).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })
      : "",
    title: asText(doc.data.title) || "",
    subtitle: undefined,
    description: asText(doc.data.description) || undefined,
    alt: imageAlt,
    content: asHTML(doc.data.content) || "",
    author: asText(doc.data.author_name) || undefined,
    // SEO Fields
    metaTitle: doc.data.meta_title || undefined,
    metaDescription: doc.data.meta_description || undefined,
    focusKeyword: doc.data.focus_keyword || undefined,
    secondaryKeywords: doc.data.secondary_keywords || undefined,
    canonicalUrl: canonicalUrl,
    ogImage: ogImageUrl,
    noIndex: doc.data.no_index || false,
    // AEO Fields
    quickAnswer: doc.data.quick_answer || undefined,
    faq: faqItems.length > 0 ? faqItems : undefined,
    relatedQuestions: relatedQuestionsItems.length > 0 ? relatedQuestionsItems : undefined,
    keyTakeaways: keyTakeawaysItems.length > 0 ? keyTakeawaysItems : undefined,
    featureSnippetTarget: asHTML(doc.data.feature_snippet_target) || undefined,
    tableOfContents: doc.data.table_of_contents || false,
    schemaType: doc.data.schema_type || undefined,
    readingTime: doc.data.reading_time || undefined,
    publishDate: doc.data.publish_date
      ? new Date(doc.data.publish_date).toISOString()
      : undefined,
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
 * Get raw blog document by slug (for metadata generation and PrismicRichText)
 */
export async function getBlogDocumentBySlug(
  slug: string
): Promise<BlogDocument | null> {
  const client = createClient();

  try {
    const doc = await client.getByUID("blog", slug);
    return doc || null;
  } catch (error) {
    console.error("Error fetching blog document:", error);
    return null;
  }
}

/**
 * Get blog document by slug (alias for consistency)
 */
export async function getBlogPostByUID(
  uid: string
): Promise<BlogDocument | null> {
  return getBlogDocumentBySlug(uid);
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

/**
 * Get related blog posts as raw documents (for RelatedPosts component)
 */
export async function getRelatedBlogPostsDocuments(
  currentSlug: string,
  limit: number = 3
): Promise<BlogDocument[]> {
  const client = createClient();

  try {
    const currentPost = await client.getByUID("blog", currentSlug);
    const currentTags = currentPost?.tags || [];

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
        .slice(0, limit);
    }

    const response = await client.getAllByType("blog", {
      orderings: [
        {
          field: "document.first_publication_date",
          direction: "desc",
        },
      ],
    });

    const relatedDocs = response
      .filter((doc) => {
        if (doc.uid === currentSlug) {
          return false;
        }
        const docTags = doc.tags || [];
        return docTags.some((tag) => currentTags.includes(tag));
      })
      .slice(0, limit);

    return relatedDocs;
  } catch (error) {
    console.error("Error fetching related blog posts:", error);
    return [];
  }
}
