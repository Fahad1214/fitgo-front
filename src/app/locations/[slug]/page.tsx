import React from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getLocationBySlug, getAllLocations } from "@/lib/locationdata";

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
  const locations = await getAllLocations();
  return locations.map((location) => ({
    slug: location.slug,
  }));
}

const LocationDetailPage = async ({ params }: PageProps) => {
  const { slug } = await params;
  const location = await getLocationBySlug(slug);

  if (!location) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      {/* Top Section: Title, Info on Left; Hero Image on Right */}
      <div className="bg-gray-light sm:pt-48 pt-12 lg:pb-6 pb-12 px-5">
        <div className="max-w-[1380px] mx-auto px-5 sm:px-0 mb-8 sm:mb-0">
          {/* Back to Locations Button */}
          <Link
            href="/locations"
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
            Back to Locations
          </Link>
        </div>
        <div className="grid grid-cols-1 max-w-[1380px] mx-auto px-5 sm:px-0 lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
          {/* Left: Title, Info */}
          <div className="flex flex-col justify-center">
            <h1 className="text-tertiary-light font-semibold text-3xl sm:text-4xl lg:text-5xl mb-4">
              {location.name}
            </h1>
            
            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-yellow-400 text-2xl">⭐</span>
              <span className="text-tertiary font-semibold text-xl">{location.rating}</span>
            </div>

            {/* Address */}
            <div className="flex items-start gap-3 mb-4">
              <svg className="w-5 h-5 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-tertiary text-lg font-semibold">{location.address}</p>
            </div>

            {/* Hours */}
            <div className="flex items-start gap-3 mb-4">
              <svg className="w-5 h-5 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-tertiary text-lg font-semibold">{location.hours}</p>
            </div>

            {/* Owner Name */}
            {location.ownerName && (
              <div className="mb-4">
                <p className="text-tertiary font-semibold text-base sm:text-lg">
                  Owner: {location.ownerName}
                </p>
              </div>
            )}

            {/* Features */}
            {location.features.length > 0 && (
              <div className="mb-6">
                <h3 className="text-tertiary-light font-semibold text-xl mb-3">Features:</h3>
                <div className="flex flex-wrap gap-2">
                  {location.features.map((feature, index) => (
                    <span
                      key={index}
                      className="bg-orange-100 text-orange-700 text-sm px-3 py-1 rounded font-semibold"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Hero Image */}
          <div className="relative w-full aspect-square bg-gray-100 rounded-2xl overflow-hidden shadow-lg">
            {location.image ? (
              <Image
                src={location.image}
                alt={location.imageAlt || location.name}
                fill
                className="object-cover aspect-square"
                priority
              />
            ) : (
              <div className="h-full flex items-center justify-center text-8xl bg-gradient-to-r from-orange-500 to-orange-600">
                🏋️
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Details Content */}
      {location.details && (
        <div className="max-w-[1380px] mx-auto px-5 sm:px-0 pb-12 sm:py-12">
          <article className="max-w-4xl mx-auto">
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
              dangerouslySetInnerHTML={{ __html: processConsecutiveImages(location.details) }}
            />
          </article>
        </div>
      )}

      {/* Map Section */}
      {location.location &&
        location.location.latitude != null &&
        location.location.longitude != null && (
          <section className="py-12 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold mb-8 text-center text-gray-900">Find Us on the Map</h2>
              <div className="bg-gray-200 h-96 rounded-lg flex items-center justify-center relative">
                {/* You can integrate Google Maps or another mapping service here */}
                <div className="text-center text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <p className="text-lg mb-2">
                    Coordinates: {location.location.latitude.toFixed(4)}, {location.location.longitude.toFixed(4)}
                  </p>
                  <p className="text-sm">Map integration coming soon</p>
                </div>
              </div>
            </div>
          </section>
        )}
    </div>
  );
};

export default LocationDetailPage;

