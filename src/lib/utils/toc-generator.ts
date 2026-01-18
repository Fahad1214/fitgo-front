import type { RichTextField } from "@prismicio/client";
import { asText } from "@prismicio/client";

export interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface PrismicBlock {
  type?: string;
  block_type?: string;
  kind?: string;
  nodeType?: string;
  text?: string;
  spans?: PrismicSpan[];
  children?: PrismicBlock[];
  items?: PrismicBlock[];
  content?: PrismicBlock[];
  [key: string]: unknown;
}

interface PrismicSpan {
  text?: string;
  [key: string]: unknown;
}

interface PrismicBodyWithContent {
  content?: PrismicBlock[];
  blocks?: PrismicBlock[];
  [key: string]: unknown;
}

export function generateTableOfContents(
  body: RichTextField | null | undefined
): TOCItem[] {
  if (!body) {
    if (process.env.NODE_ENV === "development") {
      console.log("TOC Generator: No body provided");
    }
    return [];
  }
  
  // Prismic RichTextField is directly an array of blocks
  // Handle both array format and edge cases
  let blocks: PrismicBlock[] = [];
  
  if (Array.isArray(body)) {
    blocks = body as PrismicBlock[];
    if (process.env.NODE_ENV === "development") {
      console.log("TOC Generator: Body is array, length:", blocks.length);
    }
  } else if (body && typeof body === "object") {
    const bodyWithContent = body as PrismicBodyWithContent;
    // Sometimes it might be wrapped
    if (Array.isArray(bodyWithContent.content)) {
      blocks = bodyWithContent.content;
      if (process.env.NODE_ENV === "development") {
        console.log("TOC Generator: Found content array, length:", blocks.length);
      }
    } else if (Array.isArray(bodyWithContent.blocks)) {
      blocks = bodyWithContent.blocks;
      if (process.env.NODE_ENV === "development") {
        console.log("TOC Generator: Found blocks array, length:", blocks.length);
      }
    } else {
      // Debug: Log unexpected structure
      if (process.env.NODE_ENV === "development") {
        console.log("TOC Generator: Unexpected body structure:", {
          type: typeof body,
          keys: Object.keys(body || {}),
          body: JSON.stringify(body, null, 2).substring(0, 500)
        });
      }
      return [];
    }
  } else {
    if (process.env.NODE_ENV === "development") {
      console.log("TOC Generator: Body is not array or object, type:", typeof body);
    }
    return [];
  }

  if (blocks.length === 0) {
    if (process.env.NODE_ENV === "development") {
      console.log("TOC Generator: No blocks found");
    }
    return [];
  }
  
  if (process.env.NODE_ENV === "development") {
    console.log("TOC Generator: Processing", blocks.length, "blocks");
    console.log("TOC Generator: First block structure:", {
      type: blocks[0]?.type,
      keys: blocks[0] ? Object.keys(blocks[0]) : [],
      sample: JSON.stringify(blocks[0], null, 2).substring(0, 300)
    });
  }

  const tocItems: TOCItem[] = [];
  let headingCounter = 0;

  const traverse = (blockArray: PrismicBlock[]): void => {
    if (!Array.isArray(blockArray)) return;
    
    for (const block of blockArray) {
      if (!block || typeof block !== "object") continue;

      // Prismic heading blocks have type: "heading1", "heading2", etc.
      const blockType = block.type;
      
      // Also check for alternative type properties
      const altType = block.block_type || block.kind || block.nodeType;
      const finalType = blockType || altType;
      
      if (process.env.NODE_ENV === "development" && !blockType && altType) {
        console.log("TOC Generator: Found block with alternative type:", altType, block);
      }
      
      if (
        finalType === "heading1" ||
        finalType === "heading2" ||
        finalType === "heading3" ||
        finalType === "heading4" ||
        finalType === "heading5" ||
        finalType === "heading6" ||
        finalType === "h1" ||
        finalType === "h2" ||
        finalType === "h3" ||
        finalType === "h4" ||
        finalType === "h5" ||
        finalType === "h6"
      ) {
        headingCounter++;
        
        // Extract level from type (e.g., "heading2" -> 2, "h2" -> 2)
        let level = 1;
        if (finalType.startsWith("heading")) {
          level = parseInt(finalType.replace("heading", "")) || 1;
        } else if (finalType.startsWith("h")) {
          level = parseInt(finalType.replace("h", "")) || 1;
        }
        
        // Extract text from Prismic block structure
        // Prismic blocks typically have text directly or in spans
        let text = "";
        
        // First try: direct text property
        if (block.text) {
          text = block.text;
        }
        // Second try: extract from spans array (Prismic's standard structure)
        else if (block.spans && Array.isArray(block.spans)) {
          // Spans contain the text fragments
          // The actual text is usually in block.text, but spans have the formatting
          // If block.text exists, use it; otherwise reconstruct from spans
          text = block.text || block.spans
            .map((span: PrismicSpan) => {
              // Spans might have text directly or reference positions
              return span.text || "";
            })
            .filter(Boolean)
            .join("");
        }
        // Third try: extract from children (for nested structures)
        else if (block.children && Array.isArray(block.children)) {
          text = block.children
            .map((child: PrismicBlock) => {
              if (typeof child === "object" && child !== null) {
                const childText = typeof child.text === "string" ? child.text : "";
                const childContent = typeof child.content === "string" ? child.content : "";
                return childText || childContent || "";
              }
              return "";
            })
            .filter(Boolean)
            .join("");
        }
        // Fourth try: asText helper doesn't work on individual blocks, skip this
        
        // Final fallback: try to find any text property
        if (!text && typeof block === "object") {
          const textProps = ["text", "content", "value", "label"];
          for (const prop of textProps) {
            if (block[prop] && typeof block[prop] === "string") {
              text = block[prop];
              break;
            }
          }
        }
        
        const id = `heading-${headingCounter}`;

        if (text.trim()) {
          tocItems.push({ id, text: text.trim(), level });
          if (process.env.NODE_ENV === "development") {
            console.log("TOC Generator: Found heading", level, "-", text.trim());
          }
        } else {
          if (process.env.NODE_ENV === "development") {
            console.log("TOC Generator: Heading found but no text:", block);
          }
        }
      }

      // Recursively check items array (for nested structures like lists)
      if (block.items && Array.isArray(block.items)) {
        traverse(block.items);
      }
      
      // Also check for nested content
      if (block.content && Array.isArray(block.content)) {
        traverse(block.content);
      }
      
      // Check for children array
      if (block.children && Array.isArray(block.children)) {
        traverse(block.children);
      }
    }
  };

  traverse(blocks);

  // Debug logging
  if (process.env.NODE_ENV === "development") {
    console.log("TOC Generator: Found", tocItems.length, "headings");
    if (tocItems.length === 0 && blocks.length > 0) {
      console.log("TOC Generator: Blocks found but no headings detected");
      console.log("TOC Generator: Block types found:", blocks.map(b => ({
        type: b?.type,
        block_type: b?.block_type,
        kind: b?.kind,
        nodeType: b?.nodeType,
        keys: b ? Object.keys(b) : []
      })));
      console.log("TOC Generator: First 3 blocks:", blocks.slice(0, 3).map(b => 
        JSON.stringify(b, null, 2).substring(0, 200)
      ));
    }
  }

  return tocItems;
}
