"use client";

import Image from "next/image";
import {useMemo, useState, useTransition} from "react";
import type {SkillReview, SkillReviewStats} from "@/lib/skills/reviews";

type Labels = Readonly<{
  title: string;
  writeTitle: string;
  writeDescription: string;
  placeholder: string;
  submit: string;
  update: string;
  basedOn: string;
  empty: string;
  loginRequired: string;
  saveFailed: string;
}>;

function Stars({rating, size = "text-sm"}: {readonly rating: number; readonly size?: string}) {
  return (
    <span className="inline-flex text-primary" aria-label={`${rating}/5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={`material-symbols-outlined ${size}`} style={{fontVariationSettings: star <= rating ? "'FILL' 1" : "'FILL' 0"}}>
          star
        </span>
      ))}
    </span>
  );
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "OS";
}

export default function SkillReviews({skillId, locale, initialReviews, initialStats, initialOwnReview, labels}: {
  readonly skillId: string;
  readonly locale: string;
  readonly initialReviews: SkillReview[];
  readonly initialStats: SkillReviewStats;
  readonly initialOwnReview: SkillReview | null;
  readonly labels: Labels;
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [stats, setStats] = useState(initialStats);
  const [ownReview, setOwnReview] = useState(initialOwnReview);
  const [rating, setRating] = useState(initialOwnReview?.rating ?? 5);
  const [body, setBody] = useState(initialOwnReview?.body ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const maxCount = useMemo(() => Math.max(1, ...Object.values(stats.distribution)), [stats.distribution]);
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }), [locale]);

  const submit = () => {
    setMessage(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/skills/${skillId}/reviews`, {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({rating, body}),
        });
        const json = await response.json() as {reviews?: SkillReview[]; stats?: SkillReviewStats; ownReview?: SkillReview; error?: string; detail?: string};
        if (response.status === 401) {
          setMessage(labels.loginRequired);
          return;
        }
        if (!response.ok || !json.reviews || !json.stats || !json.ownReview) {
          setMessage(json.error ? `${labels.saveFailed} (${json.error}${typeof json.detail === "string" ? `:${json.detail}` : ""})` : labels.saveFailed);
          return;
        }
        setReviews(json.reviews);
        setStats(json.stats);
        setOwnReview(json.ownReview);
        setRating(json.ownReview.rating);
        setBody(json.ownReview.body);
      } catch {
        setMessage(labels.saveFailed);
      }
    });
  };

  return (
    <section className="space-y-6" id="reviews">
      <h2 className="px-2 font-geist text-xl font-bold">{labels.title} ({stats.count})</h2>

      <div className="rounded-2xl border border-white/10 bg-surface-container-low/55 p-8">
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-3">
          <div className="text-center">
            <p className="font-geist text-5xl font-bold text-primary">{stats.count ? stats.average.toFixed(1) : "0.0"}</p>
            <div className="my-2 flex justify-center"><Stars rating={Math.round(stats.average)} size="text-2xl" /></div>
            <p className="text-sm text-on-surface-variant">{labels.basedOn.replace("{count}", String(stats.count))}</p>
          </div>
          <div className="space-y-3 md:col-span-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.distribution[star as 1 | 2 | 3 | 4 | 5];
              const width = `${Math.round((count / maxCount) * 100)}%`;
              return (
                <div key={star} className="grid grid-cols-[44px_1fr_40px] items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-on-surface-variant">{star}<span className="material-symbols-outlined text-[15px] text-primary">star</span></span>
                  <span className="h-2 overflow-hidden rounded-full bg-surface-container-highest"><span className="block h-full rounded-full bg-primary transition-all" style={{width}} /></span>
                  <span className="text-right text-on-surface-variant">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-primary/20 bg-surface-container-low/55 p-6">
        <div>
          <h3 className="font-bold">{labels.writeTitle}</h3>
          <p className="mt-1 text-sm text-on-surface-variant">{labels.writeDescription}</p>
        </div>
        <div className="mt-4 flex gap-1 text-primary">
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} type="button" onClick={() => setRating(star)} className="transition hover:scale-110" aria-label={`${star}/5`}>
              <span className="material-symbols-outlined text-3xl" style={{fontVariationSettings: star <= rating ? "'FILL' 1" : "'FILL' 0"}}>star</span>
            </button>
          ))}
        </div>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={labels.placeholder}
          maxLength={1000}
          className="mt-4 min-h-32 w-full resize-none rounded-xl border border-white/10 bg-surface-container-lowest p-4 text-on-surface outline-none transition placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary"
        />
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-on-surface-variant">{message}</p>
          <button type="button" onClick={submit} disabled={isPending} className="btn-payment rounded-full px-8 py-3 font-bold hover:brightness-105 disabled:opacity-70">
            {isPending ? "..." : ownReview ? labels.update : labels.submit}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.length ? reviews.map((review) => (
          <article key={review.id} className="rounded-2xl border border-white/10 bg-surface-container-low/55 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-secondary-container font-bold text-on-secondary-container">
                  {review.reviewer_avatar_url ? (
                    <Image src={review.reviewer_avatar_url} alt="" fill unoptimized sizes="40px" className="object-cover" />
                  ) : (
                    initials(review.reviewer_name)
                  )}
                </div>
                <div>
                  <p className="font-bold">{review.reviewer_name}</p>
                  <p className="text-xs text-on-surface-variant">
                    <time dateTime={review.updated_at}>{dateFormatter.format(new Date(review.updated_at))}</time>
                  </p>
                </div>
              </div>
              <Stars rating={review.rating} />
            </div>
            {review.body && <p className="mt-4 leading-7 text-on-surface-variant">{review.body}</p>}
          </article>
        )) : (
          <p className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-on-surface-variant">{labels.empty}</p>
        )}
      </div>
    </section>
  );
}
