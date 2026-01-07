"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

const categories = [
  "All Resources",
  "Swag Ideas & Strategy",
  "Brand Engagement",
  "Case Studies",
  "How-To Guides",
];

const RightArrowIcon = () => (
  <svg
    width="21"
    height="16"
    viewBox="0 0 21 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M11.664 0.824219L18.6624 7.82262M18.6624 7.82262L11.664 14.821M18.6624 7.82262L0 7.82261"
      stroke="#151515"
      strokeWidth="2.3328"
    />
  </svg>
);

interface BlogPageHeroSectionProps {
  selectedCategory?: string;
}

const BlogPageHeroSection = ({ selectedCategory = "All Resources" }: BlogPageHeroSectionProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleCategoryClick = (category: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (category === "All Resources") {
      params.delete("category");
    } else {
      params.set("category", category);
    }
    
    router.push(`/blog?${params.toString()}`);
  };

  return (
    <div className="max-w-[1380px] mx-auto sm:px-5 xl:px-0 py-12 sm:py-16">
      <div className="grid grid-cols-1 items-center lg:grid-cols-3 gap-8 lg:gap-12">
        {/* Left Side - Categories */}
        <div className="col-span-1 p-5 sm:p-0">
          <h2 className="text-tertiary-light font-bold text-xl mb-6">
            Categories
          </h2>
          <ul className="flex flex-col gap-4">
            {categories.map((category, index) => {
              const isActive = category === selectedCategory;
              return (
                <li key={index}>
                  <button
                    onClick={() => handleCategoryClick(category)}
                    className="flex items-center w-full text-left cursor-pointer group"
                  >
                    <span
                      className={`!font-semibold transition-colors duration-300 text-lg sm:text-4xl ${
                        isActive
                          ? "text-tertiary !font-bold"
                          : "text-tertiary-light hover:text-tertiary"
                      }`}
                    >
                      {category}
                    </span>
                    <div className="flex-shrink-0 ml-4 transition-transform text-tertiary-light duration-300 opacity-80 group-hover:opacity-100 group-hover:translate-x-2">
                      <RightArrowIcon />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Right Side - Hero Image */}
        <div className="col-span-2">
          <div className="relative w-full rounded-2xl overflow-hidden">
            <Image
              src="/BlogPage.jpg"
              alt="Blog hero image"
              width={1200}
              height={800}
              className="w-full  aspect-square sm:aspect-auto object-cover"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPageHeroSection;
