export type BlogPost = {
  id: string;
  date: string;
  readTime: number;
  emoji: string;
};

export const blogPosts: BlogPost[] = [
  {
    id: "storage",
    date: "2026-05-12",
    readTime: 4,
    emoji: "🏺",
  },
  {
    id: "benefits",
    date: "2026-04-28",
    readTime: 6,
    emoji: "💛",
  },
  {
    id: "recipes",
    date: "2026-03-15",
    readTime: 5,
    emoji: "🥄",
  },
];
