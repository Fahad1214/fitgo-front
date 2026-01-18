"use client";

import { ChevronDown, Instagram, Linkedin, Youtube } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { TOCItem } from "@/lib/utils/toc-generator";

interface TableOfContentsProps {
  items: TOCItem[];
  variant?: "mobile" | "desktop" | "both";
}

export default function TableOfContents({
  items,
  variant = "both",
}: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [isScrolling, setIsScrolling] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Get scroll offset based on screen size
  // Mobile/Tablet: navbar (73px) + TOC button (~56px) = ~130px, use 160px for safety
  // Desktop: navbar (~96px) = 100px offset
  const getScrollOffset = useCallback(() => {
    if (typeof window === "undefined") return 100;
    return window.innerWidth < 1024 ? 450 : 100;
  }, []);

  // Function to find the active heading based on scroll position
  const findActiveHeading = useCallback(() => {
    if (isScrolling) return;

    const offset = getScrollOffset();
    const scrollPosition = window.scrollY + offset;
    let currentActive: { id: string; offset: number } | null = null;

    for (const item of items) {
      const element = document.getElementById(item.id);
      if (element) {
        const elementTop = element.offsetTop;
        // Check if this heading has passed the scroll position
        if (elementTop <= scrollPosition) {
          if (!currentActive || elementTop > currentActive.offset) {
            currentActive = { id: item.id, offset: elementTop };
          }
        }
      }
    }

    if (currentActive) {
      setActiveId(currentActive.id);
    }
  }, [items, isScrolling, getScrollOffset]);

  useEffect(() => {
    // Use scroll event for more accurate detection
    const handleScroll = () => {
      if (isScrolling) return;
      findActiveHeading();
    };

    // Initial check - use setTimeout to avoid calling setState synchronously
    const timeoutId = setTimeout(() => {
      findActiveHeading();
    }, 0);

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [findActiveHeading, isScrolling]);

  // Don't render if no items
  if (!items || items.length === 0) {
    if (process.env.NODE_ENV === "development") {
      console.warn("TableOfContents: Not rendering - no items provided", {
        items,
        length: items?.length,
        variant
      });
    }
    return null;
  }
  
  // Log when TOC is rendering
  if (process.env.NODE_ENV === "development") {
    console.log("TableOfContents: Rendering with", items.length, "items", { variant, items });
  }

  const handleLinkClick = (item: TOCItem) => {
    // Set active ID immediately and disable observer temporarily
    setActiveId(item.id);
    setIsScrolling(true);
    const element = document.getElementById(item.id);
    if (element) {
      const offset = getScrollOffset();
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
      // Close dropdown on mobile/tablet after clicking
      setIsOpen(false);
      // Re-enable observer after scroll completes
      setTimeout(() => {
        setIsScrolling(false);
        // Manually check which heading should be active
        const checkActiveHeading = () => {
          const viewportTop = window.scrollY + offset;
          let closestHeading: {
            id: string;
            distance: number;
          } | null = null;

          for (const tocItem of items) {
            const el = document.getElementById(tocItem.id);
            if (el) {
              const elTop = el.offsetTop;
              const distance = Math.abs(elTop - viewportTop);
              if (!closestHeading || distance < closestHeading.distance) {
                closestHeading = {
                  id: tocItem.id,
                  distance,
                };
              }
            }
          }

          if (closestHeading) {
            setActiveId(closestHeading.id);
          }
        };
        checkActiveHeading();
      }, 500);
    }
  };

  const tocList = (
    <ul className="space-y-2">
      {items.map((item) => {
        if (!item || !item.text || !item.id) return null;
        return (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick(item);
              }}
              className={`block py-1.5 text-sm border-l-4 transition-colors cursor-pointer ${
                activeId === item.id
                  ? "text-primary border-primary font-semibold bg-primary/5"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent"
              }`}
            >
              <span className="pl-5 block lg:max-w-[288px]">
                {item.text}
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );

  const showMobile = variant === "mobile" || variant === "both";
  const showDesktop = variant === "desktop" || variant === "both";

  // Social media links
  const socialLinks = [
    {
      name: "Instagram",
      Icon: Instagram,
      href: "#",
      hoverColor: "hover:bg-pink-600",
    },
    {
      name: "Youtube",
      Icon: Youtube,
      href: "#",
      hoverColor: "hover:bg-red-600",
    },
    {
      name: "LinkedIn",
      Icon: Linkedin,
      href: "#",
      hoverColor: "hover:bg-blue-700",
    },
  ];

  return (
    <>
      {/* Mobile/Tablet: Sticky dropdown button at top */}
      {showMobile && (
        <nav
          className="lg:hidden sticky top-16 z-40 bg-white w-full border-b border-gray-200 shadow-sm"
          aria-label="Table of contents"
        >
          <button
            className="w-full justify-between rounded-none border-0 border-b border-gray-200 bg-white hover:bg-gray-50 pt-5 pb-3 px-4 flex items-center"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="font-semibold text-gray-900">
              Table of Contents
            </span>
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>
          {isOpen && (
            <div className="max-h-[60vh] overflow-y-auto bg-white border-t border-gray-200">
              <div className="p-4">{tocList}</div>
            </div>
          )}
        </nav>
      )}

      {/* Desktop: Sidebar sticky */}
      {showDesktop && (
        <nav
          className="hidden lg:block sticky top-24"
          aria-label="Table of contents"
        >
          <div className="mb-8 flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Table of Contents
              </h2>
              {items && items.length > 0 ? (
                <div>
                  {tocList}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  No headings found in content
                </p>
              )}
            </div>
          </div>

          {/* Social Links */}
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Follow Us
            </h3>
            <div className="flex flex-wrap gap-2">
              {socialLinks.map(({ name, Icon, href, hoverColor }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={name}
                  className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 text-gray-700 transition-colors duration-200 ${hoverColor} hover:text-white`}
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </nav>
      )}
    </>
  );
}
