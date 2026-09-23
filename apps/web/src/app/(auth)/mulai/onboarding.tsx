'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { FaIcon } from '@/components/ui/font-awesome-icon';
import { OnboardingIllustration } from '@/components/onboarding/onboarding-illustration';
import { markIntroSeen } from '@/lib/auth/routes';
import { cn } from '@/lib/utils';

const SLIDES = [
  {
    title: 'Temukan teman di sekitarmu.',
    text: 'Ikuti atau buat ajakan sesuai minatmu.',
    cta: 'Lanjut',
    image: { src: '/images/onboarding-1-temukan-teman.webp', width: 820, height: 818 },
    icon: (
      <div className="relative flex size-44 items-center justify-center rounded-full bg-mint shadow-inner">
        <div className="flex size-24 items-center justify-center rounded-3xl bg-mint-strong text-primary shadow-xs">
          <FaIcon icon="fa-users" className="text-5xl" />
        </div>
        <div className="absolute -bottom-1 -right-1 flex size-12 items-center justify-center rounded-2xl bg-white shadow-md border border-border text-primary">
          <FaIcon icon="fa-location-dot" className="text-xl" />
        </div>
      </div>
    ),
  },
  {
    title: 'Pilih aktivitas yang kamu suka.',
    image: { src: '/images/onboarding-2-pilih-aktivitas.webp', width: 820, height: 666 },
    text: 'Dari ngopi, olahraga, hingga nonton film.',
    cta: 'Lanjut',
    icon: (
      <div className="relative flex size-44 items-center justify-center rounded-full bg-mint shadow-inner">
        <div className="flex size-24 items-center justify-center rounded-3xl bg-amber-100 text-amber-700 shadow-xs">
          <FaIcon icon="fa-mug-hot" className="text-5xl" />
        </div>
        <div className="absolute -bottom-1 -right-1 flex size-12 items-center justify-center rounded-2xl bg-white shadow-md border border-border text-primary">
          <FaIcon icon="fa-dumbbell" className="text-xl" />
        </div>
      </div>
    ),
  },
  {
    title: 'Aman dan nyaman.',
    image: { src: '/images/onboarding-3-aman-nyaman.webp', width: 820, height: 682 },
    text: 'Gunakan avatar, bertemu di tempat publik.',
    cta: 'Lanjut',
    icon: (
      <div className="relative flex size-44 items-center justify-center rounded-full bg-mint shadow-inner">
        <div className="flex size-24 items-center justify-center rounded-3xl bg-emerald-100 text-secondary shadow-xs">
          <FaIcon icon="fa-shield-halved" className="text-5xl" />
        </div>
        <div className="absolute -bottom-1 -right-1 flex size-12 items-center justify-center rounded-2xl bg-white shadow-md border border-border text-primary">
          <FaIcon icon="fa-user-secret" className="text-xl" />
        </div>
      </div>
    ),
  },
  {
    title: 'Mulai sekarang.',
    image: { src: '/images/onboarding-4-mulai-sekarang.webp', width: 820, height: 671 },
    text: 'Temukan momen baru, bersama orang baru.',
    cta: 'Mulai',
    icon: (
      <div className="relative flex size-44 items-center justify-center rounded-full bg-mint shadow-inner">
        <div className="flex size-24 items-center justify-center rounded-3xl bg-mint-strong text-primary shadow-xs">
          <FaIcon icon="fa-calendar-days" className="text-5xl text-primary" />
        </div>
        <div className="absolute -bottom-1 -right-1 flex size-12 items-center justify-center rounded-2xl bg-white shadow-md border border-border text-emerald-600">
          <FaIcon icon="fa-check" className="text-xl" />
        </div>
      </div>
    ),
  },
];

export function Onboarding() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialShowSplash = searchParams.get('splash') === '1';
  
  const [showSplash, setShowSplash] = React.useState(initialShowSplash);
  const [slideIndex, setSlideIndex] = React.useState(0);

  function finish(to = '/daftar') {
    markIntroSeen();
    router.push(to);
  }

  function handleNext() {
    if (slideIndex < SLIDES.length - 1) {
      setSlideIndex((prev) => prev + 1);
    } else {
      finish('/daftar');
    }
  }

  // SCREEN 1: SPLASH SCREEN
  if (showSplash) {
    return (
      <div className="flex flex-col items-center justify-between min-h-[560px] py-8 text-center animate-in fade-in">
        <div className="flex flex-col items-center gap-2 pt-6">
          <Logo withTagline className="h-16" />
          <p className="text-sm font-medium text-muted-foreground">
            Temukan teman, temukan tempat.
          </p>
        </div>

        {/* Ilustrasi splash: tanpa bingkai, menyatu dengan kanvas halaman. */}
        <div className="my-6 flex flex-col items-center justify-center">
          <Image
            src="/images/onboarding-1-temukan-teman.webp"
            alt="Temukan teman, temukan tempat"
            width={820}
            height={818}
            priority
            sizes="(max-width: 640px) 92vw, 420px"
            className="h-auto w-full max-w-[26rem]"
          />
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-mint px-4 py-1.5 text-xs font-semibold text-primary border border-mint-strong">
            <FaIcon icon="fa-sparkles" className="text-xs" />
            <span>Aktivitas lebih seru saat ada teman.</span>
          </div>
        </div>

        <div className="w-full flex flex-col gap-3">
          <Button fullWidth size="lg" onClick={() => setShowSplash(false)}>
            Mulai Jelajah
          </Button>
          <button
            type="button"
            onClick={() => finish('/masuk')}
            className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
          >
            Sudah punya akun? <span className="text-primary underline">Masuk</span>
          </button>
        </div>
      </div>
    );
  }

  const currentSlide = SLIDES[slideIndex] ?? SLIDES[0]!;
  const isLastSlide = slideIndex === SLIDES.length - 1;

  // SCREENS 2-5: ONBOARDING SLIDES
  return (
    <div className="flex flex-col justify-between min-h-[560px] py-4">
      {/* Header Skip button */}
      <div className="flex justify-end min-h-11">
        {!isLastSlide ? (
          <button
            type="button"
            onClick={() => finish('/daftar')}
            className="min-h-11 px-3 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
          >
            Lewati
          </button>
        ) : (
          <div className="min-h-11" />
        )}
      </div>

      {/* Slide Illustration & Content */}
      <div className="flex flex-col items-center text-center gap-6 my-auto">
        <OnboardingIllustration
          src={currentSlide.image.src}
          alt={currentSlide.title}
          width={currentSlide.image.width}
          height={currentSlide.image.height}
          fallback={currentSlide.icon}
        />

        <div className="flex flex-col gap-2 max-w-xs">
          <h1 className="tracking-tight text-foreground">
            {currentSlide.title}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {currentSlide.text}
          </p>
        </div>

        {/* 4 Dots Indicator */}
        <div className="flex items-center pt-2" role="group" aria-label="Indikator slide">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSlideIndex(i)}
              aria-label={`Pindah ke slide ${i + 1}`}
              aria-current={slideIndex === i ? 'true' : undefined}
              className="group flex size-11 items-center justify-center"
            >
              <span
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  slideIndex === i ? 'w-7 bg-primary' : 'w-2 bg-border group-hover:bg-muted-foreground/40',
                )}
              />
            </button>
          ))}
        </div>
      </div>

      {/* CTA Button */}
      <div className="w-full pt-4">
        <Button fullWidth size="lg" onClick={handleNext}>
          {currentSlide.cta}
        </Button>
      </div>
    </div>
  );
}
