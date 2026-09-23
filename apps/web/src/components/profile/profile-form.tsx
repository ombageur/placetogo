'use client';

import * as React from 'react';
import { fieldErrors, profileInputSchema, type AvatarId, type CityId, type InterestId, type MyProfile } from '@placetogo/shared';
import { AvatarPicker } from './avatar-picker';
import { InterestsPicker } from './interests-picker';
import { CitySelect } from './city-select';
import { Button } from '@/components/ui/button';
import { ApiError, saveMyProfile } from '@/lib/api';

const BIO_MAX = 100;

export function ProfileForm({
  initial,
  submitLabel,
  onSaved,
}: {
  initial?: MyProfile | null;
  submitLabel: string;
  onSaved: (profile: MyProfile) => void;
}) {
  const [avatarId, setAvatarId] = React.useState<AvatarId | undefined>(initial?.avatarId);
  const [displayName, setDisplayName] = React.useState(initial?.displayName ?? '');
  const [bio, setBio] = React.useState(initial?.bio ?? '');
  const [cityId, setCityId] = React.useState<CityId | ''>(initial?.cityId ?? '');
  const [cityVisible, setCityVisible] = React.useState(initial?.cityVisible ?? true);
  const [interests, setInterests] = React.useState<InterestId[]>(initial?.interests ?? []);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const parsed = profileInputSchema.safeParse({ avatarId, displayName, bio, cityId, cityVisible, interests });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error.issues));
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const saved = await saveMyProfile(parsed.data);
      onSaved(saved);
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setErrors((err as ApiError & { fields?: Record<string, string> }).fields ?? {});
        setFormError('Periksa kembali data yang kamu isi.');
      } else {
        setFormError('Gagal menyimpan profil. Coba lagi beberapa saat lagi.');
      }
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <AvatarPicker value={avatarId} onChange={setAvatarId} error={errors.avatarId} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="displayName" className="text-sm font-semibold text-foreground">
          Nama panggilan
        </label>
        <input
          id="displayName"
          name="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Contoh: KopiSenja"
          aria-invalid={errors.displayName ? true : undefined}
          aria-describedby={errors.displayName ? 'displayName-error' : undefined}
          className="min-h-11 w-full rounded-xl border border-border-strong bg-background px-4 text-base text-foreground placeholder:text-muted-foreground aria-[invalid=true]:border-danger"
        />
        {errors.displayName && (
          <p id="displayName-error" role="alert" className="text-sm font-medium text-danger">
            {errors.displayName}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="bio" className="text-sm font-semibold text-foreground">
          Tentang saya
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          maxLength={BIO_MAX}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Suka ngopi, buku, dan obrolan santai."
          aria-invalid={errors.bio ? true : undefined}
          aria-describedby="bio-counter"
          className="w-full resize-none rounded-xl border border-border-strong bg-background px-4 py-2.5 text-base text-foreground placeholder:text-muted-foreground aria-[invalid=true]:border-danger"
        />
        <p id="bio-counter" className="text-right text-sm text-muted-foreground">
          {bio.length}/{BIO_MAX}
        </p>
        {errors.bio && (
          <p role="alert" className="text-sm font-medium text-danger">
            {errors.bio}
          </p>
        )}
      </div>

      <CitySelect value={cityId} onChange={setCityId} error={errors.cityId} />

      <button
        type="button"
        role="switch"
        aria-checked={cityVisible}
        onClick={() => setCityVisible((v) => !v)}
        className="flex min-h-11 items-center justify-between gap-3 rounded-2xl border border-border p-3 text-left"
      >
        <span>
          <span className="block text-sm font-semibold text-foreground">Tampilkan kota di profil publik</span>
          <span className="block text-sm text-muted-foreground">Bila dimatikan, kotamu hanya terlihat oleh kamu sendiri.</span>
        </span>
        <span
          aria-hidden="true"
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${cityVisible ? 'bg-primary' : 'bg-border-strong'}`}
        >
          <span
            className={`absolute top-0.5 size-5 rounded-full bg-background transition-transform ${cityVisible ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
          />
        </span>
      </button>

      <InterestsPicker value={interests} onChange={setInterests} error={errors.interests} />

      {formError && (
        <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger-soft-foreground">
          {formError}
        </p>
      )}

      <Button type="submit" fullWidth size="lg" loading={loading}>
        {submitLabel}
      </Button>
    </form>
  );
}
