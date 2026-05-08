"use client";

import { X } from "lucide-react";

interface Props {
  tags: string[];
  activeTag: string;
  onTagClick: (tag: string) => void;
}

export default function TagFilter({ tags, activeTag, onTagClick }: Props) {
  if (tags.length === 0) return null;

  return (
    <div className="flex gap-2 flex-wrap">
      {activeTag && (
        <button
          onClick={() => onTagClick("")}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-indigo-600 text-white text-xs font-medium"
        >
          #{activeTag}
          <X className="w-3 h-3" />
        </button>
      )}
      {tags
        .filter((t) => t !== activeTag)
        .slice(0, 20)
        .map((tag) => (
          <button
            key={tag}
            onClick={() => onTagClick(tag)}
            className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-medium text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition"
          >
            #{tag}
          </button>
        ))}
    </div>
  );
}
