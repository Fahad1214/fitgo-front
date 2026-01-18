import { PrismicRichText } from "@prismicio/react";
import { format } from "date-fns";
import { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import BlogShareButton from "@/components/blog/BlogShareButton";
import Breadcrumbs from "@/components/blog/Breadcrumbs";
import FAQSection from "@/components/blog/FAQSection";
import FeaturedSnippetTarget from "@/components/blog/FeaturedSnippetTarget";  
import ReadingProgressBar from "@/components/blog/ReadingProgressBar";
import RelatedPosts from "@/components/blog/RelatedPosts";
import StructuredData from "@/components/blog/StructuredData";
import TableOfContents from "@/components/blog/TableOfContents";
import {
  getBlogPostByUID,
  getRelatedBlogPostsDocuments,
} from "@/lib/blogdata";
import { generateTableOfContents } from "@/lib/utils/toc-generator";
import { formatReadingTime } from "@/lib/utils/reading-time";
import { getBaseUrl } from "@/lib/utils/url-utils";
import { asText, asLink } from "@prismicio/client";
import type { BlogDocument } from "../../../../prismicio-types.d";

interface BlogPostProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: BlogPostProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostByUID(slug);
  if (!post) {
    return {};
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://fitgo.com";
  const pageUrl = `${siteUrl}/blog/${slug}`;

  return {
    title: post.data.meta_title || asText(post.data.title) || "",
    description: post.data.meta_description || asText(post.data.description) || "",
    keywords: post.data.focus_keyword
      ? [post.data.focus_keyword, post.data.secondary_keywords].filter(Boolean).join(", ")
      : undefined,
    alternates: {
      canonical: (() => {
        if (!post.data.cannonical_url) return pageUrl;
        const link = asLink(post.data.cannonical_url);
        if (typeof link === "string") return link;
        if (link && typeof link === "object" && "url" in link) {
          return (link as { url: string }).url;
        }
        return pageUrl;
      })(),
    },
    openGraph: {
      title: post.data.meta_title || asText(post.data.title) || "",
      description: post.data.meta_description || asText(post.data.description) || "",
      url: pageUrl,
      siteName: "FitGo",
      images: post.data.og_image?.url
        ? [
            {
              url: post.data.og_image.url,
              width: 1200,
              height: 630,
              alt: post.data.image_alt || asText(post.data.title) || "",
            },
          ]
        : post.data.image?.url
        ? [
            {
              url: post.data.image.url,
              width: 1200,
              height: 630,
              alt: post.data.image_alt || asText(post.data.title) || "",
            },
          ]
        : [],
      type: "article",
      publishedTime: post.data.publish_date || post.first_publication_date,
    },
    twitter: {
      card: "summary_large_image",
      title: post.data.meta_title || asText(post.data.title) || "",
      description: post.data.meta_description || asText(post.data.description) || "",
      images: [post.data.og_image?.url || post.data.image?.url || ""],
    },
    robots: {
      index: !post.data.no_index,
      follow: !post.data.no_index,
      googleBot: {
        index: !post.data.no_index,
        follow: !post.data.no_index,
      },
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostProps) {
  const { slug } = await params;
  const post = await getBlogPostByUID(slug);

  if (!post) {
    notFound();
  }

  // Get related posts
  let relatedPosts: BlogDocument[] = [];
  try {
    relatedPosts = await getRelatedBlogPostsDocuments(slug, 3);
  } catch {
    // Error fetching related posts - silently fail
  }

  const tocItems = generateTableOfContents(post.data.content);
  // Show TOC if: explicitly enabled OR if not set but has headings (default to showing if headings exist)
  const shouldShowTOC = tocItems.length > 0 && (post.data.table_of_contents !== false);
  
  const featuredImage = post.data.image;
  const publishDate = post.data.publish_date;
  const readingTime = post.data.reading_time;
  const category = post.data.content_category;
  const authorName = asText(post.data.author_name);

  // Counter to track heading order for ID assignment
  let headingCounter = 0;

  return (
    <>
      <ReadingProgressBar />
      <StructuredData
        post={post}
        author={
          authorName
            ? {
                name: authorName,
                image: undefined,
              }
            : null
        }
      />
      {/* Mobile/Tablet TOC - sticky at top, outside article container */}
      {shouldShowTOC && (
        <TableOfContents items={tocItems} variant="mobile" />
      )}
      <article className="container mx-auto px-4 py-12 max-w-7xl">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Blog", href: "/blog" },
            { label: asText(post.data.title) || "Post", href: `/blog/${slug}` },
          ]}
        />

        <header className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-3 mt-10 items-center gap-12">
          <div className="col-span-2 xl:col-span-1">
            {category && (
              <span className="inline-block px-3 py-1 text-sm font-semibold text-white bg-primary rounded-full mb-4">
                {category}
              </span>
            )}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {asText(post.data.title)}
            </h1>
            {post.data.description && (
              <p className="text-xl text-gray-600 mb-6">
                {asText(post.data.description)}
              </p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
              {publishDate && (
                <time dateTime={publishDate}>
                  {format(new Date(publishDate), "MMMM d, yyyy")}
                </time>
              )}
              {readingTime && <span>{formatReadingTime(readingTime)}</span>}
            </div>
            <div>
              {authorName && (
              <p className="text-tertiary font-semibold text-base sm:text-lg">
                  Written By {authorName}
              </p>
            )}
            </div>
          </div>
          {featuredImage?.url && (
            <div className="relative w-full col-span-2 xl:col-span-2 aspect-video mb-8 rounded-lg overflow-hidden">
            <Image
                src={featuredImage.url}
                alt={featuredImage.alt || asText(post.data.title) || "Featured image"}
              fill
                className="object-cover"
              priority
                sizes="(max-width: 768px) 100vw, 896px"
            />
          </div>
          )}
        </header>
        <div className="grid grid-cols-1 mt-5 lg:mt-20 lg:grid-cols-4 gap-8">
          {shouldShowTOC && (
            <aside className="hidden lg:block lg:col-span-1">
              <TableOfContents
                items={tocItems}
                variant="desktop"
              />
            </aside>
          )}
          <div
            id="blog-content"
            className={`max-w-none ${
              shouldShowTOC
                ? "lg:col-span-3"
                : "lg:col-span-4"
            } space-y-6 text-gray-800 leading-relaxed
            [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mb-5
            [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h2]:mb-5
            [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:mb-5
            [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:text-gray-900 [&_h4]:mb-5
            [&_h5]:text-base [&_h5]:font-semibold [&_h5]:text-gray-900 [&_h5]:mb-5
            [&_h6]:text-sm [&_h6]:font-semibold [&_h6]:text-gray-900 [&_h6]:mb-5
            [&_p]:text-base [&_p]:text-gray-800
            [&_li]:text-base [&_li]:text-gray-800 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5
            [&_a]:text-primary hover:[&_a]:text-primary/80
            [&_img]:aspect-[16/9] [&_img]:object-cover [&_img]:w-full [&_img]:max-h-[600px] [&_img]:rounded-lg`}
          >
            <FeaturedSnippetTarget
              featuredSnippetTarget={post.data.feature_snippet_target}
            />
            {post.data.content && (
              <PrismicRichText
                field={post.data.content}
                components={{
                  heading1: ({ children }) => {
                    headingCounter++;
                    const id = tocItems[headingCounter - 1]?.id;
                    return (
                      <h1 id={id} className="scroll-mt-24">
                        {children}
                      </h1>
                    );
                  },
                  heading2: ({ children }) => {
                    headingCounter++;
                    const id = tocItems[headingCounter - 1]?.id;
                    return (
                      <h2 id={id} className="scroll-mt-24">
                        {children}
                      </h2>
                    );
                  },
                  heading3: ({ children }) => {
                    headingCounter++;
                    const id = tocItems[headingCounter - 1]?.id;
                    return (
                      <h3 id={id} className="scroll-mt-24">
                        {children}
                      </h3>
                    );
                  },
                  heading4: ({ children }) => {
                    headingCounter++;
                    const id = tocItems[headingCounter - 1]?.id;
                    return (
                      <h4 id={id} className="scroll-mt-24">
                        {children}
                      </h4>
                    );
                  },
                  heading5: ({ children }) => {
                    headingCounter++;
                    const id = tocItems[headingCounter - 1]?.id;
                    return (
                      <h5 id={id} className="scroll-mt-24">
                        {children}
                      </h5>
                    );
                  },
                  heading6: ({ children }) => {
                    headingCounter++;
                    const id = tocItems[headingCounter - 1]?.id;
                    return (
                      <h6 id={id} className="scroll-mt-24">
                        {children}
                      </h6>
                    );
                  },
                }}
              />
            )}

            {post.data.key_takeways && post.data.key_takeways.length > 0 && (
              <div className="bg-accent-purple-light/30 border-l-4 border-primary p-6 mt-8 rounded-r-lg">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Key Takeaways
              </h2>
                <ul className="list-disc list-inside space-y-2">
                  {post.data.key_takeways.map((takeaway, index) => (
                    <li key={index} className="text-gray-700">
                      <PrismicRichText
                        field={takeaway.takeaway}
                        components={{
                          paragraph: ({ children }) => <>{children}</>,
                        }}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        <div className="mt-10 lg:mt-20 max-w-5xl flex mx-auto">
          <FAQSection faqs={post.data.faq} />
            </div>
        {relatedPosts.length > 0 && (
          <RelatedPosts posts={relatedPosts} currentPostUID={slug} />
          )}
        </article>
      <BlogShareButton
        title={asText(post.data.title) || ""}
        url={`${getBaseUrl()}/blog/${slug}`}
        excerpt={asText(post.data.description) || undefined}
      />
    </>
  );
}
