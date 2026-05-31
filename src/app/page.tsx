import { Hero } from "@/components/home/hero";
import { BentoGrid } from "@/components/home/bento-grid";
import { StackedCards } from "@/components/home/stacked-cards";
import { Trending } from "@/components/home/trending";
import { ScrollProgressBar } from "@/components/effects/scroll-progress";

export default function Home() {
  return (
    <>
      <ScrollProgressBar />
      <Hero />
      <BentoGrid />
      <StackedCards />
      <Trending />
    </>
  );
}
