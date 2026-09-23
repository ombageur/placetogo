import type { AvatarId, CityId, InterestId } from '@placetogo/shared';

const ONBOARDING_STORAGE_KEY = 'placetogo_onboarding_draft';

export interface OnboardingDraft {
  avatarId?: AvatarId;
  locationGranted?: boolean;
  coords?: { lat: number; lng: number };
  interests?: InterestId[];
  cityId?: CityId;
}

const DEFAULT_DRAFT: OnboardingDraft = {
  avatarId: 'cat',
  locationGranted: false,
  interests: ['ngobrol', 'kuliner', 'olahraga'],
  cityId: 'surabaya',
};

export function getOnboardingDraft(): OnboardingDraft {
  if (typeof window === 'undefined') return DEFAULT_DRAFT;
  try {
    const raw = sessionStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return DEFAULT_DRAFT;
    return { ...DEFAULT_DRAFT, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_DRAFT;
  }
}

export function saveOnboardingDraft(patch: Partial<OnboardingDraft>): OnboardingDraft {
  if (typeof window === 'undefined') return DEFAULT_DRAFT;
  try {
    const current = getOnboardingDraft();
    const updated = { ...current, ...patch };
    sessionStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return DEFAULT_DRAFT;
  }
}

export function clearOnboardingDraft(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(ONBOARDING_STORAGE_KEY);
  } catch {
    // ignore
  }
}
