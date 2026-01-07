"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

interface BlogCardProps {
  slug: string;
  image: string;
  category: string;
  tags: string[];
  date: string;
  title: string;
  alt?: string;
}

const BlogCard = ({
  slug,
  image,
  category,
  tags,
  date,
  title,
  alt = "Blog post image",
}: BlogCardProps) => {
  return (
    <Link href={`/blog/${slug}`} className="block">
      <article className=" group overflow-hidden transition-shadow duration-300 cursor-pointer">
        {/* Image */}
        <div className="relative w-full aspect-[1/1] bg-gray-100 rounded-2xl overflow-hidden">
          <Image
            src={image}
            alt={alt}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Content */}
        <div className="transition-all duration-300">
          {/* Tags and Date */}
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            {tags.length > 0 ? (
              <span className="text-tertiary font-bold text-base">
                {tags.join(", ")}
              </span>
            ) : (
              <span className="text-tertiary font-bold text-base">
                {category}
              </span>
            )}
            <span className="text-gray-500 font-semibold text-sm sm:text-base">
              {date}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-tertiary font-semibold text-lg mt-2 underline">
            {title}
          </h3>
        </div>
      </article>
    </Link>
  );
};

export default BlogCard;
