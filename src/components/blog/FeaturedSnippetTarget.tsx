import { PrismicRichText } from "@prismicio/react";
import type { RichTextField } from "@prismicio/client";

interface FeaturedSnippetTargetProps {
  featuredSnippetTarget?: RichTextField | null;
}

export default function FeaturedSnippetTarget({
  featuredSnippetTarget,
}: FeaturedSnippetTargetProps) {
  if (!featuredSnippetTarget) return null;

  return (
    <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-l-4 border-primary p-6 mb-8 rounded-r-lg">
      <PrismicRichText
        field={featuredSnippetTarget}
        components={{
          paragraph: ({ children }) => (
            <p className="text-tertiary font-semibold text-base leading-relaxed mb-0">
              {children}
            </p>
          ),
        }}
      />
    </div>
  );
}
