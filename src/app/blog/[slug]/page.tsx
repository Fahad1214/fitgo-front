import React from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getBlogPostBySlug, getRelatedBlogPosts } from "@/lib/blogdata";

/**
 * Process HTML content to wrap consecutive images in a flex container
 */
function processConsecutiveImages(html: string): string {
  if (!html) return "";
  
  // Match patterns where two img tags appear consecutively
  // This handles cases like: <img...><img...> or <p><img...></p><p><img...></p>
  
  // Helper function to process image tag for aspect ratio
  const processImageForAspectRatio = (imgTag: string): string => {
    // Remove w-full class
    let processed = imgTag.replace(/\s*w-full\s*/g, ' ');
    
    // Add object-cover and w-full h-full classes
    if (processed.includes('class="')) {
      processed = processed.replace(/class="([^"]*)"/, 'class="$1 object-cover w-full h-full"');
    } else if (processed.includes("class='")) {
      processed = processed.replace(/class='([^']*)'/, "class='$1 object-cover w-full h-full'");
    } else {
      processed = processed.replace(/>$/, ' class="object-cover w-full h-full">');
    }
    
    return processed;
  };
  
  // Pattern 1: Images in consecutive paragraphs: <p><img...></p><p><img...></p>
  let processed = html.replace(
    /<p[^>]*>\s*(<img[^>]*>)\s*<\/p>\s*<p[^>]*>\s*(<img[^>]*>)\s*<\/p>/g,
    (match, img1, img2) => {
      const img1Processed = processImageForAspectRatio(img1);
      const img2Processed = processImageForAspectRatio(img2);
      return `<div class="flex flex-col sm:flex-row gap-4 my-4 sm:my-8 w-full"><div class="flex-1 aspect-square overflow-hidden rounded-lg">${img1Processed}</div><div class="flex-1 aspect-square overflow-hidden rounded-lg">${img2Processed}</div></div>`;
    }
  );
  
  // Pattern 2: Direct consecutive images: <img...><img...>
  processed = processed.replace(
    /(<img[^>]*>)\s*(<img[^>]*>)/g,
    (match, img1, img2) => {
      // Check if these images are not already wrapped
      if (match.includes('flex flex-col')) {
        return match;
      }
      const img1Processed = processImageForAspectRatio(img1);
      const img2Processed = processImageForAspectRatio(img2);
      return `<div class="flex flex-col sm:flex-row gap-4 my-4 sm:my-8 w-full"><div class="flex-1 aspect-square overflow-hidden rounded-lg">${img1Processed}</div><div class="flex-1 aspect-square overflow-hidden rounded-lg">${img2Processed}</div></div>`;
    }
  );
  
  return processed;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const { getAllBlogPosts } = await import("@/lib/blogdata");
  const posts = await getAllBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

const BlogDetailPage = async ({ params }: PageProps) => {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedBlogPosts(slug, 3);

  return (
    <div className="min-h-screen">
      {/* Top Section: Title, Subtitle, Author on Left; Hero Image on Right */}
      <div className="bg-gray-light sm:pt-48 pt-12 lg:pb-6 pb-12 px-5">
        <div className="max-w-[1380px] mx-auto px-5 sm:px-0 mb-8 sm:mb-0">
          {/* Back to Blog Button */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-tertiary font-semibold hover:opacity-80 transition-opacity mb-8"
          >
            <svg
              width="21"
              height="16"
              viewBox="0 0 21 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="rotate-180"
            >
              <path
                d="M11.664 0.824219L18.6624 7.82262M18.6624 7.82262L11.664 14.821M18.6624 7.82262L0 7.82261"
                stroke="#151515"
                strokeWidth="2.3328"
              />
            </svg>
            Back to Blogs
          </Link>
        </div>
        <div className="grid grid-cols-1 max-w-[1380px] mx-auto px-5 sm:px-0 lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
          {/* Left: Title, Subtitle, Author */}
          <div className="flex flex-col justify-center">
            <h1 className="text-tertiary-light font-semibold text-3xl sm:text-4xl lg:text-5xl mb-4">
              {post.title}
            </h1>
            {post.description && (
              <p className="text-tertiary text-lg font-semibold sm:text-xl mb-6">
                {post.description}
              </p>
            )}
            {post.author && (
              <p className="text-tertiary font-semibold text-base sm:text-lg">
                Written By {post.author}
              </p>
            )}
          </div>

          {/* Right: Hero Image */}
          <div className="relative w-full aspect-square bg-gray-100 rounded-2xl overflow-hidden shadow-lg">
            <Image
              src={post.image}
              alt={post.alt || post.title}
              fill
              className="object-cover aspect-square"
              priority
            />
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 max-w-[1380px] mx-auto px-5 pb-12 sm:py-12 lg:grid-cols-3 gap-8 lg:gap-12">
        {/* Left Column: Sidebar */}
        <aside className="lg:col-span-1">
          {/* In This Article Button */}
          <button className="w-full bg-primary text-white group font-semibold text-base sm:text-lg py-4 px-6 flex items-center justify-between mb-8">
            <span>In This Article</span>
            <svg
              width="21"
              height="16"
              viewBox="0 0 21 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="transition-transform duration-300 group-hover:translate-x-2"
            >
              <path
                d="M11.664 0.824219L18.6624 7.82262M18.6624 7.82262L11.664 14.821M18.6624 7.82262L0 7.82261"
                stroke="white"
                strokeWidth="2.3328"
              />
            </svg>
          </button>

          {/* Related Content */}
          <div>
            <h2 className="text-[#444444] font-semibold  text-xl sm:text-2xl mb-6">
              Related Content
            </h2>
            <div className="flex flex-col gap-6">
              {relatedPosts.length > 0 ? (
                relatedPosts.map((relatedPost, index) => (
                  <React.Fragment key={relatedPost.id}>
                    <Link href={`/blog/${relatedPost.slug}`} className="group cursor-pointer">
                      <div className="flex gap-4">
                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-gray-200 overflow-hidden">
                          <Image
                            src={relatedPost.image}
                            alt={relatedPost.alt || relatedPost.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-[#606060] text-sm mb-1">
                            {relatedPost.tags.length > 0
                              ? relatedPost.tags.join(", ")
                              : relatedPost.category}
                          </p>
                          <h3 className="text-tertiary font-semibold text-base sm:text-lg group-hover:opacity-80 transition-opacity line-clamp-2">
                            {relatedPost.title}
                          </h3>
                        </div>
                      </div>
                    </Link>
                    {index < relatedPosts.length - 1 && (
                      <div className="h-px bg-gray-200"></div>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <p className="text-gray-500">No related posts found.</p>
              )}
            </div>
          </div>
        </aside>

        {/* Right Column: Main Content */}
        <article className="lg:col-span-2">
          <div
            className="prose prose-lg max-w-none 
              prose-headings:text-tertiary-light prose-headings:font-semibold 
              prose-h2:text-tertiary-light prose-h2:leading-tight prose-h2:text-[28px] sm:prose-h2:text-[36px] prose-h2:mb-5 sm:prose-h2:mb-[28px]
              prose-p:text-tertiary prose-p:font-semibold prose-p:leading-relaxed 
              prose-a:text-primary prose-a:font-semibold prose-a:no-underline hover:prose-a:underline
              prose-strong:text-tertiary prose-strong:font-semibold 
              prose-ul:text-tertiary prose-ol:text-tertiary 
              prose-li:text-tertiary prose-li:font-semibold prose-li:marker:text-tertiary prose-li:marker:font-semibold
              prose-img:rounded-lg prose-img:shadow-lg prose-img:w-full prose-img:my-4 sm:prose-img:my-8
              prose-blockquote:text-tertiary prose-blockquote:border-l-primary
              prose-code:text-tertiary prose-pre:bg-gray-100
              prose-hr:border-tertiary"
            dangerouslySetInnerHTML={{ __html: processConsecutiveImages(post.content || "") }}
          />
          {relatedPosts.length > 0 && (
            <div className="my-24">
              <h2 className="text-tertiary-light font-semibold  text-xl sm:text-2xl mb-6">
                Related Content
              </h2>
              <div className="flex flex-row gap-7 flex-wrap">
                {relatedPosts.map((relatedPost) => (
                  <Link
                    key={relatedPost.id}
                    href={`/blog/${relatedPost.slug}`}
                    className="group cursor-pointer"
                  >
                    <div className="flex flex-col min-w-[250px] max-w-[250px]">
                      <div className="relative aspect-square flex-shrink-0 bg-gray-200 overflow-hidden">
                        <Image
                          src={relatedPost.image}
                          alt={relatedPost.alt || relatedPost.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-[#606060] text-sm mt-3">
                          {relatedPost.tags.length > 0
                            ? relatedPost.tags.join(", ")
                            : relatedPost.category}
                        </p>
                        <h3 className="text-tertiary font-semibold text-base sm:text-lg mt-2 group-hover:opacity-80 transition-opacity line-clamp-2">
                          {relatedPost.title}
                        </h3>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>
    </div>
  );
};

export default BlogDetailPage;
