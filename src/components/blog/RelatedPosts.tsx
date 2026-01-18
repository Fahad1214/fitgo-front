import Image from "next/image";
import Link from "next/link";
import { asText } from "@prismicio/client";
import type { BlogDocument } from "../../../prismicio-types";

interface RelatedPostsProps {
  posts: BlogDocument[];
  currentPostUID: string;
}

export default function RelatedPosts({
  posts,
  currentPostUID,
}: RelatedPostsProps) {
  if (!posts || posts.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
        Related Posts
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts
          .filter((post) => post.uid !== currentPostUID)
          .slice(0, 3)
          .map((post) => {
            const imageUrl = post.data.image?.url || "/BlogPage.jpg";
            const title = asText(post.data.title) || "";
            const description = asText(post.data.description) || "";

            return (
              <Link
                key={post.id}
                href={`/blog/${post.uid}`}
                className="group block bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="relative aspect-video overflow-hidden">
                  <Image
                    src={imageUrl}
                    alt={title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {title}
                  </h3>
                  {description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {description}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
      </div>
    </section>
  );
}
