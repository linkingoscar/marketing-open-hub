import { MetadataRoute } from "next";
import { projects } from "@/data/projects";
import { categories } from "@/data/categories";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://martech-open-hub.vercel.app";

  const staticPages = [
    { url: base, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1 },
    { url: `${base}/compare`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
  ];

  const categoryPages = categories.map((c) => ({
    url: `${base}/category/${c.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const projectPages = projects.map((p) => ({
    url: `${base}/project/${p.id}`,
    lastModified: new Date(p.lastUpdated),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...categoryPages, ...projectPages];
}
