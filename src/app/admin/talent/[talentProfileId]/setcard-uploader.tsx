"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PrimaryButton } from "@/components/ui";

export function SetcardUploader(props: { talentProfileId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  async function upload() {
    const file = inputRef.current?.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);

    setUploading(true);
    await fetch(`/api/admin/talent/${props.talentProfileId}/setcard`, { method: "POST", body: form });
    setUploading(false);

    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/*"
        className="block w-full text-sm text-black/60 file:mr-3 file:rounded-lg file:border-0 file:bg-black/5 file:px-3 file:py-2 file:text-sm file:font-medium file:text-black/70"
      />
      <div className="mt-3">
        <PrimaryButton onClick={upload} disabled={uploading}>
          {uploading ? "Uploading..." : "Upload"}
        </PrimaryButton>
      </div>
    </div>
  );
}

