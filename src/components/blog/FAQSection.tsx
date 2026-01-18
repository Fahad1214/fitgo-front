"use client";

import { PrismicRichText } from "@prismicio/react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { BlogDocumentDataFaqItem } from "../../../prismicio-types";
import { asText } from "@prismicio/client";

interface FAQSectionProps {
  faqs?: BlogDocumentDataFaqItem[];
}

export default function FAQSection({ faqs }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!faqs || faqs.length === 0) {
    return null;
  }

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="w-full min-w-0">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Frequently Asked Questions
      </h2>
      <div className="space-y-3">
        {faqs.map((faq, index) => {
          if (!faq.question || !faq.answer) return null;
          const isOpen = openIndex === index;
          const questionText = asText(faq.question);

          return (
            <motion.div
              key={index}
              initial={false}
              animate={{
                backgroundColor: isOpen ? "#ffffff" : "#f9fafb",
                boxShadow: isOpen
                  ? "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
                  : "none",
              }}
              transition={{ duration: 0.2 }}
              className="rounded-lg border border-gray-200 overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full cursor-pointer list-none p-5 md:p-6 flex items-start justify-between gap-3 text-left"
              >
                <span className="text-lg font-semibold text-gray-900 break-words flex-1">
                  {questionText}
                </span>
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="flex-shrink-0"
                >
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </motion.div>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial="collapsed"
                    animate="open"
                    exit="collapsed"
                    variants={{
                      open: {
                        opacity: 1,
                        height: "auto",
                        transition: {
                          height: {
                            duration: 0.3,
                            ease: [0.04, 0.62, 0.23, 0.98],
                          },
                          opacity: {
                            duration: 0.25,
                            delay: 0.1,
                          },
                        },
                      },
                      collapsed: {
                        opacity: 0,
                        height: 0,
                        transition: {
                          height: {
                            duration: 0.3,
                            ease: [0.04, 0.62, 0.23, 0.98],
                          },
                          opacity: {
                            duration: 0.2,
                          },
                        },
                      },
                    }}
                    className="overflow-hidden"
                  >
                    <motion.div
                      initial={{ y: -10 }}
                      animate={{ y: 0 }}
                      exit={{ y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="px-5 md:px-6 pb-5 md:pb-6"
                    >
                      <div className="text-gray-700 prose prose-sm max-w-none break-words w-full min-w-0">
                        <PrismicRichText
                          field={faq.answer}
                          components={{
                            paragraph: ({ children }) => (
                              <p className="mb-3 last:mb-0 break-words">
                                {children}
                              </p>
                            ),
                            preformatted: ({ node }) => (
                              <p className="mb-3 last:mb-0 break-words whitespace-pre-wrap">
                                {node.text}
                              </p>
                            ),
                            list: ({ children }) => (
                              <ul className="mb-3 last:mb-0 break-words">
                                {children}
                              </ul>
                            ),
                            listItem: ({ children }) => (
                              <li className="break-words">{children}</li>
                            ),
                          }}
                        />
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
