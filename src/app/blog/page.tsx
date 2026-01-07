
import BlogCard from '@/components/BlogPage/BlogCard';
import BlogPageHeroSection from '@/components/BlogPage/BlogPageHeroSection';
import { getAllBlogPosts } from '@/lib/blogdata';


interface BlogPageProps {
  searchParams: Promise<{ category?: string }>;
}

const BlogPage = async ({ searchParams }: BlogPageProps) => {
  const { category } = await searchParams;
  const allBlogPosts = await getAllBlogPosts();

  // Filter posts based on selected category
  const filteredPosts = category && category !== "All Resources"
    ? allBlogPosts.filter((post) => 
        post.tags.some((tag) => tag === category)
      )
    : allBlogPosts;

  return (
    <div className='sm:pt-48 pt-12 lg:pb-6 pb-12 sm:min-h-[600px] lg:min-h-[700px]'>
      <BlogPageHeroSection selectedCategory={category || "All Resources"} />
      
      {/* Blog Cards Grid */}
      <div className="max-w-[1380px] mx-auto px-5 my-20">
        {filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-6">
            {filteredPosts.map((post) => (
              <BlogCard
                key={post.id}
                slug={post.slug}
                image={post.image}
                category={post.category}
                tags={post.tags}
                date={post.date}
                title={post.title}
                alt={post.alt}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-tertiary font-semibold text-lg">
              No blog posts found for this category.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default BlogPage