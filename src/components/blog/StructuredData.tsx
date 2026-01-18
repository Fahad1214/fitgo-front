import * as prismic from "@prismicio/client";
import { asText } from "@prismicio/client";
import type { BlogDocument } from "../../../prismicio-types";

interface StructuredDataProps {
  post: BlogDocument;
  author?: {
    name: string | null;
    image?: string | null;
  } | null;
}

export default function StructuredData({ post, author }: StructuredDataProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://fitgo.com";
  const postUrl = `${siteUrl}/blog/${post.uid}`;
  const featuredImage = post.data.image;
  const imageUrl = featuredImage?.url
    ? prismic.asImageSrc(featuredImage, { width: 1200 })
    : undefined;

  // Extract featured snippet target text for abstract
  const featuredSnippetText = post.data.feature_snippet_target
    ? extractTextFromAnswer(post.data.feature_snippet_target)
    : null;

  // Article schema
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": post.data.schema_type || "Article",
    headline: asText(post.data.title) || "",
    description: post.data.meta_description || asText(post.data.description) || "",
    ...(featuredSnippetText && { abstract: featuredSnippetText }),
    image: imageUrl ? [imageUrl] : [],
    datePublished: post.data.publish_date || post.first_publication_date,
    dateModified: post.last_publication_date,
    author: author
      ? {
          "@type": "Person",
          name: author.name || "FitGo",
          ...(author.image && { image: author.image }),
        }
      : {
          "@type": "Person",
          name: asText(post.data.author_name) || "FitGo",
        },
    publisher: {
      "@type": "Organization",
      name: "FitGo",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/Logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
  };

  // FAQPage schema if FAQs exist
  const faqSchema =
    post.data.faq && post.data.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: post.data.faq
            .filter((faq) => faq.question && faq.answer)
            .map((faq) => ({
              "@type": "Question",
              name: asText(faq.question) || "",
              acceptedAnswer: {
                "@type": "Answer",
                text: extractTextFromAnswer(faq.answer),
              },
            })),
        }
      : null;

  // QAPage schema for quick_answer (AEO optimization)
  const qaPageSchema = post.data.quick_answer
    ? (() => {
        const answerText = post.data.quick_answer;
        if (!answerText.trim()) return null;
        return {
          "@context": "https://schema.org",
          "@type": "QAPage",
          mainEntity: {
            "@type": "Question",
            name: asText(post.data.title) || "What is this about?",
            acceptedAnswer: {
              "@type": "Answer",
              text: answerText,
            },
          },
        };
      })()
    : null;

  // BreadcrumbList schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${siteUrl}/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: asText(post.data.title) || "Post",
        item: postUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      {qaPageSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(qaPageSchema) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}

function extractTextFromAnswer(answer: prismic.RichTextField | null): string {
  if (!answer) return "";
  if (typeof answer === "string") return answer;
  // Use asText helper which properly handles RichTextField structure
  return asText(answer).trim();
}
