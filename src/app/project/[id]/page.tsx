import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { projects } from "@/data/projects";
import { getCategoryById, getCategoryColor } from "@/data/categories";
import { ProjectDetailClient } from "@/components/project-detail-client";

// ===== Static Generation =====
export function generateStaticParams() {
  return projects.map((p) => ({ id: p.id }));
}

// ===== Dynamic SEO Metadata =====
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const project = projects.find((p) => p.id === id);
  if (!project) return { title: "项目未找到" };

  const cat = getCategoryById(project.category);
  const avgScore = (project.scores.features + project.scores.easeOfUse + project.scores.documentation + project.scores.community + project.scores.performance) / 5;

  return {
    title: `${project.name} — ${cat?.nameCN ?? "营销工具"}`,
    description: project.descriptionCN,
    keywords: [...project.tags, project.language, cat?.nameCN ?? ""],
    openGraph: {
      title: `${project.name} — MarTech Open Hub`,
      description: project.descriptionCN,
      type: "website",
      url: `https://martech-open-hub.vercel.app/project/${project.id}`,
    },
    twitter: {
      card: "summary",
      title: `${project.name} — MarTech Open Hub`,
      description: project.descriptionCN,
    },
    other: {
      "application-name": project.name,
      "apple-mobile-web-app-title": project.name,
    },
  };
}

// ===== Helper =====
function avgScore(scores: { features: number; easeOfUse: number; documentation: number; community: number; performance: number }) {
  return (scores.features + scores.easeOfUse + scores.documentation + scores.community + scores.performance) / 5;
}

// ===== Server Component =====
export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = projects.find((p) => p.id === id);

  if (!project) {
    notFound();
  }

  const cat = getCategoryById(project.category);
  const catColor = getCategoryColor(project.category);
  const avg = avgScore(project.scores);
  const related = projects.filter((p) => project.relatedProjects.includes(p.id)).slice(0, 3);

  // JSON-LD structured data (rendered server-side for SEO)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: project.name,
    description: project.descriptionCN,
    url: project.url,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Cross-platform",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: avg.toFixed(1),
      bestRating: "10",
      worstRating: "0",
      ratingCount: project.stars.toString(),
    },
    author: {
      "@type": "Organization",
      name: project.fullName.split("/")[0],
    },
    dateCreated: project.createdAt,
    dateModified: project.lastUpdated,
    license: project.license ? `https://spdx.org/licenses/${project.license}` : undefined,
    keywords: project.tags.join(", "),
    softwareHelp: project.homepage ? { "@type": "CreativeWork", url: project.homepage } : undefined,
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* JSON-LD (server-rendered for crawlers) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Client-side interactive content */}
      <ProjectDetailClient
        project={project}
        catName={cat?.nameCN ?? "分类"}
        catColor={catColor}
        avgScore={avg}
        related={related}
      />
    </div>
  );
}
