import { createClient } from "@/prismicio";
import { asHTML, asText } from "@prismicio/client";
import type { LocationsDocument } from "../../prismicio-types";

export interface Location {
  id: string;
  slug: string;
  name: string;
  address: string;
  hours: string;
  rating: number;
  image: string;
  imageAlt?: string;
  features: string[];
  details?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  ownerName?: string;
}

/**
 * Extract list items from Prismic rich text field
 */
function extractListItems(richTextField: any): string[] {
  if (!richTextField) return [];
  
  const items: string[] = [];
  
  // Traverse the rich text structure to find list items
  const traverse = (blocks: any[]): void => {
    if (!blocks || !Array.isArray(blocks)) return;
    
    for (const block of blocks) {
      if (block.type === "list-item" || block.type === "o-list-item") {
        // Extract text from list item spans
        let text = "";
        if (block.spans && Array.isArray(block.spans)) {
          // Get text from spans
          text = block.text || "";
        } else {
          text = block.text || "";
        }
        
        if (text.trim()) {
          items.push(text.trim());
        }
      }
      
      // Recursively check items array (for nested lists)
      if (block.items && Array.isArray(block.items)) {
        traverse(block.items);
      }
    }
  };
  
  // Rich text is an array of blocks
  if (Array.isArray(richTextField)) {
    traverse(richTextField);
  }
  
  // If no list items found, try parsing HTML as fallback
  if (items.length === 0) {
    const html = asHTML(richTextField) || "";
    // Extract text from <li> tags
    const liMatches = html.match(/<li[^>]*>(.*?)<\/li>/gi);
    if (liMatches) {
      liMatches.forEach((li) => {
        const text = li.replace(/<[^>]*>/g, "").trim();
        if (text) items.push(text);
      });
    } else {
      // Fallback: extract plain text and split by newlines or common delimiters
      const plainText = html.replace(/<[^>]*>/g, " ").trim();
      if (plainText) {
        const splitItems = plainText
          .split(/\n|,|;|•/)
          .map((item) => item.trim())
          .filter((item) => item.length > 0);
        items.push(...splitItems);
      }
    }
  }
  
  return items;
}

/**
 * Transform Prismic location document to Location format
 */
function transformLocation(doc: LocationsDocument): Location {
  const imageUrl = doc.data.feature_image?.url || "";
  const imageAlt = doc.data.feature_image?.alt || asText(doc.data.title) || "";
  const title = asText(doc.data.title) || "";
  
  // Extract features from rich text (supports list items)
  const features = extractListItems(doc.data.features);
  
  // Format timings - timestamp field might be used for time range
  // For now, default to 24/7, but you can customize based on your needs
  let hours = "24/7";
  if (doc.data.timings) {
    // If you want to format the timestamp, you can do:
    // const date = new Date(doc.data.timings);
    // hours = date.toLocaleTimeString();
    // For now, keeping default
    hours = "24/7";
  }
  
  // Get address from GeoPoint coordinates
  // Note: You might want to add a separate address field in Prismic
  // or use reverse geocoding to convert coordinates to address
  let address = "Address not available";
  if (
    doc.data.location?.latitude != null &&
    doc.data.location?.longitude != null &&
    typeof doc.data.location.latitude === "number" &&
    typeof doc.data.location.longitude === "number"
  ) {
    // Using coordinates as address for now
    // In production, you might want to reverse geocode these coordinates
    address = `${doc.data.location.latitude.toFixed(4)}, ${doc.data.location.longitude.toFixed(4)}`;
  }
  
  // Get rating from reviews field
  const rating = doc.data.reviews || 0;
  
  // Get details as HTML
  const details = asHTML(doc.data.details) || undefined;
  
  return {
    id: doc.id,
    slug: doc.uid,
    name: title,
    address: address,
    hours: hours,
    rating: rating,
    image: imageUrl,
    imageAlt: imageAlt,
    features: features,
    details: details,
    location:
      doc.data.location &&
      doc.data.location.latitude != null &&
      doc.data.location.longitude != null &&
      typeof doc.data.location.latitude === "number" &&
      typeof doc.data.location.longitude === "number"
        ? {
            latitude: doc.data.location.latitude,
            longitude: doc.data.location.longitude,
          }
        : undefined,
    ownerName: asText(doc.data.owner_name) || undefined,
  };
}

/**
 * Get all locations from Prismic
 */
export async function getAllLocations(): Promise<Location[]> {
  const client = createClient();

  try {
    const response = await client.getAllByType("locations", {
      orderings: [
        {
          field: "document.first_publication_date",
          direction: "desc",
        },
      ],
    });

    return response.map(transformLocation);
  } catch (error) {
    console.error("Error fetching locations:", error);
    return [];
  }
}

/**
 * Get a single location by slug
 */
export async function getLocationBySlug(
  slug: string
): Promise<Location | null> {
  const client = createClient();

  try {
    const doc = await client.getByUID("locations", slug);

    if (!doc) {
      return null;
    }

    return transformLocation(doc);
  } catch (error) {
    console.error("Error fetching location:", error);
    return null;
  }
}

