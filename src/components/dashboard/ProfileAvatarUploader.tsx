"use client";

import Image from "next/image";
import {useActionState} from "react";
import type {AvatarUploadState} from "@/app/[locale]/dashboard/actions";

export interface ProfileAvatarUploaderProps {
  readonly displayName: string;
  readonly email: string;
  readonly avatarUrl: string | null;
  readonly avatarInitial: string;
  readonly hint: string;
  readonly labels: Readonly<{
    choose: string;
    upload: string;
    uploading: string;
    updated: string;
  }>;
  readonly action: (previous: AvatarUploadState, formData: FormData) => Promise<AvatarUploadState>;
}

const initialState: AvatarUploadState = {status: "idle"};

export default function ProfileAvatarUploader({
  displayName,
  email,
  avatarUrl,
  avatarInitial,
  hint,
  labels,
  action,
}: ProfileAvatarUploaderProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const currentAvatarUrl = state.avatarUrl ?? avatarUrl;

  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-center">
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{displayName}</p>
        <p className="mt-1 text-sm text-on-surface-variant">{email}</p>
        <p className="mt-3 max-w-md text-xs leading-5 text-on-surface-variant">{hint}</p>
        <form action={formAction} className="mt-4">
          <label className="group inline-flex cursor-pointer items-center gap-4 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-3 transition hover:border-primary/60 hover:bg-primary/10">
            <span className="relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-primary/50 bg-gradient-to-br from-primary-container to-secondary-container font-geist text-3xl font-bold">
              {currentAvatarUrl ? <Image src={currentAvatarUrl} alt={displayName} fill unoptimized sizes="96px" className="object-cover" /> : avatarInitial}
              <span className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                <span className="material-symbols-outlined text-2xl text-white">photo_camera</span>
              </span>
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-on-surface">{isPending ? labels.uploading : labels.choose}</span>
              <span className="mt-1 block text-xs text-on-surface-variant">{labels.upload}</span>
            </span>
            <input
              name="avatar"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="sr-only"
              onChange={(event) => event.currentTarget.form?.requestSubmit()}
              disabled={isPending}
            />
          </label>
        </form>
        {state.status !== "idle" && (
          <p className={`mt-3 text-xs ${state.status === "success" ? "text-tertiary" : "text-error"}`}>
            {state.status === "success" ? labels.updated : state.message}
          </p>
        )}
      </div>
    </div>
  );
}
