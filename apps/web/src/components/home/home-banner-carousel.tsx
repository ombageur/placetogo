'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FaIcon } from '@/components/ui/font-awesome-icon';

interface BannerSlide {
  id: string;
  tag: string;
  tagIcon: string;
  title: string;
  buttonText: string;
  href: string;
  imageSrc: string;
  accentColor: string;
}

const BANNER_SLIDES: BannerSlide[] = [
  {
    id: 'teman-baru',
    tag: 'Teman Baru',
    tagIcon: 'fa-user-group',
    title: 'Teman baru bisa dimulai dari satu obrolan.',
    buttonText: 'Cari Teman',
    href: '/jelajah',
    imageSrc: '/images/banner-teman-baru.webp',
    accentColor: 'from-emerald-900/80 via-emerald-900/40 to-transparent',
  },
  {
    id: 'aktivitas-baru',
    tag: 'Aktivitas Baru',
    tagIcon: 'fa-volleyball',
    title: 'Coba kegiatan baru, bareng orang baru.',
    buttonText: 'Jelajahi Aktivitas',
    href: '/jelajah',
    imageSrc: '/images/banner-aktivitas-baru.webp',
    accentColor: 'from-emerald-950/85 via-emerald-950/45 to-transparent',
  },
  {
    id: 'reward-venue',
    tag: 'Reward Venue',
    tagIcon: 'fa-coins',
    title: 'Ketemu di venue, dapat Coin.',
    buttonText: 'Lihat Reward',
    href: '/dompet',
    imageSrc: '/images/banner-reward-venue.webp',
    accentColor: 'from-emerald-950/85 via-emerald-950/45 to-transparent',
  },
];

export function HomeBannerCarousel() {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);

  const nextSlide = React.useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % BANNER_SLIDES.length);
  }, []);

  const prevSlide = React.useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + BANNER_SLIDES.length) % BANNER_SLIDES.length);
  }, []);

  React.useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [nextSlide, isPaused]);

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Promosi dan Fitur Utama"
      className="relative w-full overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm transition-all"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {BANNER_SLIDES.map((slide, index) => (
          <div
            key={slide.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} dari ${BANNER_SLIDES.length}`}
            className="relative min-w-full aspect-[16/9] sm:aspect-[21/9] flex items-center overflow-hidden"
          >
            {/* Background Image */}
            <Image
              src={slide.imageSrc}
              alt=""
              fill
              priority={index === 0}
              className="object-cover object-right"
            />

            {/* Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-transparent sm:from-background/90 sm:via-background/60" />

            {/* Content Container */}
            <div className="relative z-10 flex flex-col justify-center gap-2 p-5 sm:p-7 max-w-[68%] sm:max-w-[55%]">
              <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-mint px-2.5 py-0.5 text-[11px] font-bold text-primary border border-mint-strong/40 shadow-2xs">
                <FaIcon icon={slide.tagIcon} className="text-[10px]" />
                <span>{slide.tag}</span>
              </span>

              <h2 className="text-base sm:text-lg md:text-xl font-extrabold leading-snug tracking-tight text-foreground line-clamp-2">
                {slide.title}
              </h2>

              <div className="pt-1">
                <Link
                  href={slide.href}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground transition-all hover:bg-primary/90 hover:scale-[1.02] shadow-xs"
                >
                  <span>{slide.buttonText}</span>
                  <FaIcon icon="fa-arrow-right" className="text-[10px]" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-2.5 right-3 z-20 flex items-center gap-1.5">
        <button
          type="button"
          onClick={prevSlide}
          aria-label="Slide sebelumnya"
          className="flex size-11 items-center justify-center rounded-full bg-background/80 backdrop-blur-xs text-foreground hover:bg-background transition-colors border border-border shadow-2xs"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          type="button"
          onClick={nextSlide}
          aria-label="Slide berikutnya"
          className="flex size-11 items-center justify-center rounded-full bg-background/80 backdrop-blur-xs text-foreground hover:bg-background transition-colors border border-border shadow-2xs"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* Indicator Dots */}
      <div
        className="absolute bottom-3 left-5 z-20 flex items-center gap-1.5"
        role="group"
        aria-label="Indikator slide banner"
      >
        {BANNER_SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrentIndex(i)}
            aria-label={`Pindah ke banner ${i + 1}`}
            aria-current={currentIndex === i ? 'true' : undefined}
            className="group flex size-11 items-center justify-center"
          >
            <span
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                currentIndex === i ? 'w-5 bg-primary' : 'w-1.5 bg-foreground/25 group-hover:bg-foreground/40',
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
