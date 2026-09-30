"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AvatarCropperModal, Card, Modal, PrimaryButton, SecondaryButton } from "@/components/ui";
import { MAX_PHOTO_UPLOAD_BYTES } from "@/lib/gallery-media";

type MeasurementsDTO = {
  unit: "in" | "cm";
  bust: number | null;
  underBust: number | null;
  naturalWaist: number | null;
  hips: number | null;
  waistToFloor: number | null;
  hollowToHem: number | null;
  shoulderWidth: number | null;
  backLength: number | null;
  updatedAt: string;
};

type SocialLinkDTO = {
  platform: string;
  handle: string | null;
  url: string | null;
  followers: number | null;
};

type ProfileDTO = {
  id: string;
  displayName: string;
  alias: string | null;
  dateOfBirth: string | null;
  locationCity: string | null;
  locationCountry: string | null;
  phoneNumber: string | null;
  employmentStatus: string | null;
  educationLevel: string | null;
  collegeCourse: string | null;
  nationality: string | null;
  experienceYears: number | null;
  modelingTypes: string[];
  talents: string[];
  heightIn: number | null;
  weightLbs: number | null;
  skinTone: string | null;
  eyeColor: string | null;
  shirtSize: string | null;
  pantsSize: string | null;
  dressSize: string | null;
  shoeSize: number | null;
  tattoos: boolean | null;
  tattooLocations: string | null;
  piercings: boolean | null;
  piercingLocations: string | null;
  birthmarks: boolean | null;
  birthmarkLocations: string | null;
  updatedAt: string;
  avatarUpdatedAt: string | null;
};

const SOCIAL_PLATFORM_OPTIONS = ["Instagram", "Tiktok", "YouTube", "Facebook", "X"] as const;

function createEmptySocialLink(platform: string) {
  return {
    platform,
    handle: "",
    url: "",
    followers: "",
  };
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatHeight(totalInches: number | null) {
  if (!totalInches) return null;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches - feet * 12);
  return `${feet}′${inches}″`;
}

const measurementFieldKeys = [
  "bust",
  "underBust",
  "naturalWaist",
  "hips",
  "waistToFloor",
  "hollowToHem",
  "shoulderWidth",
  "backLength",
] as const;

type MeasurementsFormState = {
  unit: "in" | "cm";
  bust: string | number;
  underBust: string | number;
  naturalWaist: string | number;
  hips: string | number;
  waistToFloor: string | number;
  hollowToHem: string | number;
  shoulderWidth: string | number;
  backLength: string | number;
};

function convertMeasurementValue(raw: unknown, from: "in" | "cm", to: "in" | "cm") {
  if (raw === null || raw === undefined) return "";
  const text = String(raw).trim();
  if (!text) return "";
  const n = Number(text);
  if (!Number.isFinite(n)) return text;
  if (from === to) return text;

  const factor = from === "in" && to === "cm" ? 2.54 : 1 / 2.54;
  const converted = n * factor;
  const decimals = to === "cm" ? 1 : 2;
  const rounded = Math.round(converted * 10 ** decimals) / 10 ** decimals;
  return String(rounded);
}

function convertMeasurementsForm(prev: MeasurementsFormState, nextUnit: "in" | "cm") {
  if (prev.unit === nextUnit) return prev;
  const out: MeasurementsFormState = { ...prev, unit: nextUnit };
  for (const k of measurementFieldKeys) {
    (out as any)[k] = convertMeasurementValue((prev as any)[k], prev.unit, nextUnit);
  }
  return out;
}

function initialsFromName(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const a = parts[0]?.[0] ?? "";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : parts[0]?.[1] ?? "";
  return (a + b).toUpperCase() || "—";
}

type ExperienceKey = "" | "NONE" | "LT6M" | "6M_1Y" | "1_2Y" | "2_5Y" | "GT5Y";

const experienceOptions: Array<{ key: ExperienceKey; label: string }> = [
  { key: "", label: "Select..." },
  { key: "NONE", label: "None" },
  { key: "LT6M", label: "Less than 6 months" },
  { key: "6M_1Y", label: "6 months – 1 year" },
  { key: "1_2Y", label: "1 – 2 years" },
  { key: "2_5Y", label: "2 – 5 years" },
  { key: "GT5Y", label: "More than 5 years" },
];

const modelingTypeOptions = [
  "Runway/Catwalk",
  "Fashion",
  "Commercial",
  "Editorial",
  "Beauty",
  "Lifestyle",
  "Fitness",
  "Swimwear",
  "Lingerie/Boudoir",
  "Product",
] as const;

const talentOptions = [
  "Acting",
  "Hosting/Public Speaking",
  "Voiceover",
  "Singing",
  "Dancing",
  "Musical Instruments",
  "Culinary",
  "Traditional Arts",
] as const;

const eyeColorOptions = ["Brown", "Hazel", "Blue", "Green", "Gray", "Amber", "Black", "Other"] as const;
const skinToneOptions = ["Very Fair", "Fair", "Light", "Medium", "Tan", "Deep", "Other"] as const;

const shirtSizeOptions = ["XS", "S", "M", "L", "XL", "XXL"] as const;
const dressSizeOptions = ["0", "2", "4", "6", "8", "10", "12", "14", "16", "18"] as const;
const employmentStatusOptions = ["Self-Employed", "Freelancer", "Employed", "Student", "Other"] as const;
const educationLevelOptions = ["High School", "Undergraduate", "Graduate", "Postgraduate", "Other"] as const;

function numberOptions(start: number, end: number, step: number) {
  const out: string[] = [];
  for (let v = start; v <= end; v += step) out.push(String(v));
  return out;
}

function toggleValue(list: string[], value: string) {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

const shoeSizeOptions = [
  ...numberOptions(4, 13, 1).flatMap((n) => [n, `${n}.5`]),
  "14",
  "15",
];

const weightOptions = numberOptions(80, 250, 5);

function choiceWithOther(value: string | null, options: readonly string[]) {
  if (!value) return { choice: "", other: "" };
  if (options.includes(value)) return { choice: value, other: "" };
  return { choice: "Other", other: value };
}

function experienceKeyFromYears(years: number | null) {
  if (years === null) return "NONE" as const;
  if (years < 0.5) return "LT6M" as const;
  if (years < 1.5) return "6M_1Y" as const;
  if (years < 2.5) return "1_2Y" as const;
  if (years < 5.5) return "2_5Y" as const;
  return "GT5Y" as const;
}

function experienceYearsFromKey(key: ExperienceKey) {
  if (key === "") return undefined;
  if (key === "NONE") return null;
  if (key === "LT6M") return 0;
  if (key === "6M_1Y") return 1;
  if (key === "1_2Y") return 2;
  if (key === "2_5Y") return 4;
  return 6;
}

function experienceLabelFromYears(years: number | null) {
  const key = experienceKeyFromYears(years);
  const found = experienceOptions.find((o) => o.key === key);
  return found?.label ?? "—";
}

function InfoTile(props: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white px-4 py-3 shadow-sm">
      <div className="text-[10px] font-semibold tracking-widest text-black/40">{props.label}</div>
      <div className="mt-1 text-sm font-medium text-black/80">{props.value}</div>
    </div>
  );
}

export function AdminTalentEditor(props: {
  profile: ProfileDTO;
  measurements: MeasurementsDTO | null;
  socialLinks: SocialLinkDTO[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [editVitals, setEditVitals] = useState(false);
  const [editBasic, setEditBasic] = useState(false);
  const [editSocial, setEditSocial] = useState(false);
  const [editMeasurements, setEditMeasurements] = useState(false);
  const [editPhoto, setEditPhoto] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const photoFileInputRef = useRef<HTMLInputElement | null>(null);

  const avatarUrl = useMemo(() => {
    if (!props.profile.avatarUpdatedAt) return null;
    return `/api/avatars/${props.profile.id}?v=${encodeURIComponent(props.profile.avatarUpdatedAt)}`;
  }, [props.profile.avatarUpdatedAt, props.profile.id]);

  const initials = useMemo(() => initialsFromName(props.profile.displayName), [props.profile.displayName]);

  const [vitalsForm, setVitalsForm] = useState<{
    experienceKey: ExperienceKey;
    modelingTypes: string[];
    modelingOtherInput: string;
    talents: string[];
    talentsOtherInput: string;
    heightFeet: string;
    heightInches: string;
    weightPreset: string;
    weightOther: string;
    skinToneChoice: string;
    skinToneOther: string;
    eyeColorChoice: string;
    eyeColorOther: string;
    shirtSize: string;
    pantsSize: string;
    dressSize: string;
    shoeSize: string;
    tattoos: boolean | null;
    tattooLocations: string;
    piercings: boolean | null;
    piercingLocations: string;
    birthmarks: boolean | null;
    birthmarkLocations: string;
  }>(() => ({
    ...(() => {
      const skin = choiceWithOther(props.profile.skinTone, skinToneOptions);
      const eye = choiceWithOther(props.profile.eyeColor, eyeColorOptions);
      const weightStr = props.profile.weightLbs ? String(Math.round(props.profile.weightLbs)) : "";
      const weightPreset = weightStr && weightOptions.includes(weightStr) ? weightStr : weightStr ? "Other" : "";
      const weightOther = weightPreset === "Other" ? weightStr : "";
      return {
        skinToneChoice: skin.choice,
        skinToneOther: skin.other,
        eyeColorChoice: eye.choice,
        eyeColorOther: eye.other,
        weightPreset,
        weightOther,
      };
    })(),
    experienceKey: experienceKeyFromYears(props.profile.experienceYears),
    modelingTypes: props.profile.modelingTypes,
    modelingOtherInput: "",
    talents: props.profile.talents,
    talentsOtherInput: "",
    heightFeet: props.profile.heightIn ? String(Math.floor(props.profile.heightIn / 12)) : "",
    heightInches: props.profile.heightIn ? String(Math.round(props.profile.heightIn % 12)) : "",
    shirtSize: props.profile.shirtSize ?? "",
    pantsSize: props.profile.pantsSize ?? "",
    dressSize: props.profile.dressSize ?? "",
    shoeSize: props.profile.shoeSize ? String(props.profile.shoeSize) : "",
    tattoos: props.profile.tattoos,
    tattooLocations: props.profile.tattooLocations ?? "",
    piercings: props.profile.piercings,
    piercingLocations: props.profile.piercingLocations ?? "",
    birthmarks: props.profile.birthmarks,
    birthmarkLocations: props.profile.birthmarkLocations ?? "",
  }));

  const [basicForm, setBasicForm] = useState(() => {
    const employment = choiceWithOther(props.profile.employmentStatus, employmentStatusOptions);
    const education = choiceWithOther(props.profile.educationLevel, educationLevelOptions);
    return {
      displayName: props.profile.displayName ?? "",
      alias: props.profile.alias ?? "",
      dateOfBirth: props.profile.dateOfBirth ? props.profile.dateOfBirth.slice(0, 10) : "",
      locationCity: props.profile.locationCity ?? "",
      locationCountry: props.profile.locationCountry ?? "",
      phoneNumber: props.profile.phoneNumber ?? "",
      employmentChoice: employment.choice,
      employmentOther: employment.other,
      educationChoice: education.choice,
      educationOther: education.other,
      collegeCourse: props.profile.collegeCourse ?? "",
      nationality: props.profile.nationality ?? "",
    };
  });

  const [socialForm, setSocialForm] = useState(() =>
    props.socialLinks.map((l) => ({
      platform: l.platform,
      handle: l.handle ?? "",
      url: l.url ?? "",
      followers: l.followers ?? "",
    })),
  );
  const missingSocialPlatforms = useMemo(
    () =>
      SOCIAL_PLATFORM_OPTIONS.filter(
        (platform) => !socialForm.some((link) => link.platform.trim().toLowerCase() === platform.toLowerCase()),
      ),
    [socialForm],
  );

  const [measurementsForm, setMeasurementsForm] = useState<MeasurementsFormState>(() => ({
    unit: props.measurements?.unit ?? "in",
    bust: props.measurements?.bust ?? "",
    underBust: props.measurements?.underBust ?? "",
    naturalWaist: props.measurements?.naturalWaist ?? "",
    hips: props.measurements?.hips ?? "",
    waistToFloor: props.measurements?.waistToFloor ?? "",
    hollowToHem: props.measurements?.hollowToHem ?? "",
    shoulderWidth: props.measurements?.shoulderWidth ?? "",
    backLength: props.measurements?.backLength ?? "",
  }));

  const vitalsUpdated = useMemo(() => fmtDate(props.profile.updatedAt), [props.profile.updatedAt]);

  async function saveBasic() {
    setSaving(true);
    const employmentStatus =
      basicForm.employmentChoice === "Other" ? basicForm.employmentOther.trim() : basicForm.employmentChoice.trim();
    const educationLevel =
      basicForm.educationChoice === "Other" ? basicForm.educationOther.trim() : basicForm.educationChoice.trim();

    await fetch(`/api/admin/talent/${props.profile.id}/profile/basic`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        displayName: basicForm.displayName.trim() ? basicForm.displayName.trim() : null,
        alias: basicForm.alias.trim() ? basicForm.alias.trim() : null,
        dateOfBirth: basicForm.dateOfBirth ? new Date(basicForm.dateOfBirth).toISOString() : null,
        locationCity: basicForm.locationCity.trim() ? basicForm.locationCity.trim() : null,
        locationCountry: basicForm.locationCountry.trim() ? basicForm.locationCountry.trim() : null,
        phoneNumber: basicForm.phoneNumber.trim() ? basicForm.phoneNumber.trim() : null,
        employmentStatus: employmentStatus ? employmentStatus : null,
        educationLevel: educationLevel ? educationLevel : null,
        collegeCourse: basicForm.collegeCourse.trim() ? basicForm.collegeCourse.trim() : null,
        nationality: basicForm.nationality.trim() ? basicForm.nationality.trim() : null,
      }),
    });
    setSaving(false);
    setEditBasic(false);
    router.refresh();
  }

  async function saveVitals() {
    setSaving(true);
    const experienceYears = experienceYearsFromKey(vitalsForm.experienceKey);
    const heightIn =
      vitalsForm.heightFeet && vitalsForm.heightInches
        ? Number(vitalsForm.heightFeet) * 12 + Number(vitalsForm.heightInches)
        : null;
    const weightLbs = vitalsForm.weightPreset
      ? Number(vitalsForm.weightPreset)
      : vitalsForm.weightOther.trim()
        ? Number(vitalsForm.weightOther)
        : null;

    const skinTone =
      vitalsForm.skinToneChoice === "Other"
        ? vitalsForm.skinToneOther.trim()
        : vitalsForm.skinToneChoice.trim();
    const eyeColor =
      vitalsForm.eyeColorChoice === "Other" ? vitalsForm.eyeColorOther.trim() : vitalsForm.eyeColorChoice.trim();

    await fetch(`/api/admin/talent/${props.profile.id}/profile/vitals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        experienceYears: experienceYears,
        modelingTypes: vitalsForm.modelingTypes.length ? vitalsForm.modelingTypes : null,
        talents: vitalsForm.talents.length ? vitalsForm.talents : null,
        heightIn: heightIn,
        weightLbs: weightLbs,
        skinTone: skinTone ? skinTone : null,
        eyeColor: eyeColor ? eyeColor : null,
        shirtSize: vitalsForm.shirtSize.trim() ? vitalsForm.shirtSize.trim() : null,
        pantsSize: vitalsForm.pantsSize.trim() ? vitalsForm.pantsSize.trim() : null,
        dressSize: vitalsForm.dressSize.trim() ? vitalsForm.dressSize.trim() : null,
        shoeSize: vitalsForm.shoeSize === "" ? null : Number(vitalsForm.shoeSize),
        tattoos: vitalsForm.tattoos ?? null,
        tattooLocations: vitalsForm.tattooLocations.trim() ? vitalsForm.tattooLocations.trim() : null,
        piercings: vitalsForm.piercings ?? null,
        piercingLocations: vitalsForm.piercingLocations.trim() ? vitalsForm.piercingLocations.trim() : null,
        birthmarks: vitalsForm.birthmarks ?? null,
        birthmarkLocations: vitalsForm.birthmarkLocations.trim() ? vitalsForm.birthmarkLocations.trim() : null,
      }),
    });
    setSaving(false);
    setEditVitals(false);
    router.refresh();
  }

  async function saveSocial() {
    setSaving(true);
    await fetch(`/api/admin/talent/${props.profile.id}/profile/social`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        links: socialForm.map((l) => ({
          platform: l.platform,
          handle: l.handle.trim() ? l.handle.trim() : null,
          url: l.url.trim() ? l.url.trim() : null,
          followers: l.followers === "" ? null : Number(l.followers),
        })),
      }),
    });
    setSaving(false);
    setEditSocial(false);
    router.refresh();
  }

  async function saveMeasurements() {
    setSaving(true);
    await fetch(`/api/admin/talent/${props.profile.id}/profile/measurements`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        unit: measurementsForm.unit,
        bust: measurementsForm.bust === "" ? null : Number(measurementsForm.bust),
        underBust: measurementsForm.underBust === "" ? null : Number(measurementsForm.underBust),
        naturalWaist: measurementsForm.naturalWaist === "" ? null : Number(measurementsForm.naturalWaist),
        hips: measurementsForm.hips === "" ? null : Number(measurementsForm.hips),
        waistToFloor: measurementsForm.waistToFloor === "" ? null : Number(measurementsForm.waistToFloor),
        hollowToHem: measurementsForm.hollowToHem === "" ? null : Number(measurementsForm.hollowToHem),
        shoulderWidth: measurementsForm.shoulderWidth === "" ? null : Number(measurementsForm.shoulderWidth),
        backLength: measurementsForm.backLength === "" ? null : Number(measurementsForm.backLength),
      }),
    });
    setSaving(false);
    setEditMeasurements(false);
    router.refresh();
  }

  return (
    <div className="grid gap-6">
      <Card
        title="Model Profile"
        right={<div className="text-xs text-black/40">Last updated {vitalsUpdated}</div>}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => photoFileInputRef.current?.click()}
            className="group flex items-center gap-3 text-left"
            aria-label="Edit profile photo"
          >
            <div className="h-16 w-16 overflow-hidden rounded-full border border-black/10 bg-gradient-to-br from-emerald-950 via-emerald-800 to-emerald-600 shadow-sm ring-2 ring-transparent transition group-hover:ring-emerald-300/50 group-focus-visible:ring-emerald-300/60">
              {avatarUrl ? (
                <img alt="Profile photo" src={avatarUrl} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-white/90">
                  {initials}
                </div>
              )}
            </div>
            <div>
              <div className="text-xs font-semibold tracking-widest text-black/40">PROFILE PHOTO</div>
              <div className="mt-1 text-xs text-black/50">
                {props.profile.avatarUpdatedAt ? `Updated ${fmtDate(props.profile.avatarUpdatedAt)}` : "Not set"}
              </div>
              <div className="mt-1 text-xs text-black/40 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                Click to edit
              </div>
            </div>
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <InfoTile label="DISPLAY NAME" value={props.profile.displayName} />
          <InfoTile label="ALIAS" value={props.profile.alias ?? "—"} />
          <InfoTile
            label="LOCATION"
            value={[props.profile.locationCity, props.profile.locationCountry].filter(Boolean).join(", ") || "—"}
          />
          <InfoTile label="EXPERIENCE" value={experienceLabelFromYears(props.profile.experienceYears)} />
          <InfoTile label="HEIGHT" value={formatHeight(props.profile.heightIn) ?? "—"} />
          <InfoTile label="WEIGHT" value={props.profile.weightLbs ? `${props.profile.weightLbs} lbs` : "—"} />
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        <SecondaryButton onClick={() => setEditBasic(true)}>Edit Basic</SecondaryButton>
        <SecondaryButton onClick={() => setEditVitals(true)}>Edit Vitals</SecondaryButton>
        <SecondaryButton onClick={() => setEditMeasurements(true)}>Edit Measurements</SecondaryButton>
        <SecondaryButton onClick={() => setEditSocial(true)}>Edit Social</SecondaryButton>
      </div>

      <input
        ref={photoFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.currentTarget.files?.[0] ?? null;
          if (file) {
            setPhotoFile(file);
            setEditPhoto(true);
          }
          e.currentTarget.value = "";
        }}
      />

      <AvatarCropperModal
        open={editPhoto}
        imageFile={photoFile}
        title="Admin: Edit Profile Photo"
        subtitle={props.profile.displayName}
        onClose={() => {
          setEditPhoto(false);
          setPhotoFile(null);
        }}
        onSave={async (croppedDataUrl) => {
          const commaIdx = croppedDataUrl.indexOf(",");
          const base64 = commaIdx >= 0 ? croppedDataUrl.slice(commaIdx + 1) : croppedDataUrl;
          const byteChars = atob(base64);
          const bytes = new Uint8Array(byteChars.length);
          for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
          const mimeMatch = /^data:([^;]+);/.exec(croppedDataUrl);
          const mimeType = mimeMatch?.[1] ?? "image/jpeg";
          const blob = new Blob([bytes], { type: mimeType });
          if (blob.size > MAX_PHOTO_UPLOAD_BYTES) {
            const msg = "Profile photo is too large. Maximum size is 10 MB.";
            window.alert(msg);
            throw new Error(msg);
          }
          const file = new File([blob], "avatar.jpg", { type: mimeType });
          const form = new FormData();
          form.append("file", file);
          const res = await fetch(`/api/admin/talent/${props.profile.id}/avatar`, { method: "POST", body: form });
          if (!res.ok) {
            const msg = await res.text().catch(() => "");
            window.alert(msg || "Upload failed.");
            throw new Error(msg || "Upload failed.");
          }
          router.refresh();
        }}
      />

      <Modal open={editBasic} title="Admin: Edit Basic Info" onClose={() => setEditBasic(false)} widthClassName="max-w-3xl">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block">
            <div className="text-xs font-semibold text-black/50">Display name</div>
            <input
              className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
              value={basicForm.displayName}
              onChange={(e) => setBasicForm((p) => ({ ...p, displayName: e.target.value }))}
            />
          </label>
          <label className="block">
            <div className="text-xs font-semibold text-black/50">Alias</div>
            <input
              className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
              value={basicForm.alias}
              onChange={(e) => setBasicForm((p) => ({ ...p, alias: e.target.value }))}
            />
          </label>
          <label className="block">
            <div className="text-xs font-semibold text-black/50">Date of birth</div>
            <input
              type="date"
              className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
              value={basicForm.dateOfBirth}
              onChange={(e) => setBasicForm((p) => ({ ...p, dateOfBirth: e.target.value }))}
            />
          </label>
          <label className="block">
            <div className="text-xs font-semibold text-black/50">Mobile number</div>
            <input
              className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
              value={basicForm.phoneNumber}
              onChange={(e) => setBasicForm((p) => ({ ...p, phoneNumber: e.target.value }))}
            />
          </label>
          <label className="block">
            <div className="text-xs font-semibold text-black/50">City</div>
            <input
              className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
              value={basicForm.locationCity}
              onChange={(e) => setBasicForm((p) => ({ ...p, locationCity: e.target.value }))}
            />
          </label>
          <label className="block">
            <div className="text-xs font-semibold text-black/50">Country</div>
            <input
              className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
              value={basicForm.locationCountry}
              onChange={(e) => setBasicForm((p) => ({ ...p, locationCountry: e.target.value }))}
            />
          </label>
          <label className="block">
            <div className="text-xs font-semibold text-black/50">Employment status</div>
            <select
              className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
              value={basicForm.employmentChoice}
              onChange={(e) => setBasicForm((p) => ({ ...p, employmentChoice: e.target.value }))}
            >
              <option value="">—</option>
              {employmentStatusOptions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            {basicForm.employmentChoice === "Other" ? (
              <input
                className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
                placeholder="Enter employment status"
                value={basicForm.employmentOther}
                onChange={(e) => setBasicForm((p) => ({ ...p, employmentOther: e.target.value }))}
              />
            ) : null}
          </label>
          <label className="block">
            <div className="text-xs font-semibold text-black/50">Educational attainment</div>
            <select
              className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
              value={basicForm.educationChoice}
              onChange={(e) => setBasicForm((p) => ({ ...p, educationChoice: e.target.value }))}
            >
              <option value="">—</option>
              {educationLevelOptions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            {basicForm.educationChoice === "Other" ? (
              <input
                className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
                placeholder="Enter education level"
                value={basicForm.educationOther}
                onChange={(e) => setBasicForm((p) => ({ ...p, educationOther: e.target.value }))}
              />
            ) : null}
          </label>
          <label className="block md:col-span-2">
            <div className="text-xs font-semibold text-black/50">College course</div>
            <input
              className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
              value={basicForm.collegeCourse}
              onChange={(e) => setBasicForm((p) => ({ ...p, collegeCourse: e.target.value }))}
            />
          </label>
          <label className="block md:col-span-2">
            <div className="text-xs font-semibold text-black/50">Nationality</div>
            <input
              className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
              value={basicForm.nationality}
              onChange={(e) => setBasicForm((p) => ({ ...p, nationality: e.target.value }))}
            />
          </label>
        </div>
        <div className="mt-6 flex items-center justify-end gap-2">
          <SecondaryButton onClick={() => setEditBasic(false)} disabled={saving}>
            Cancel
          </SecondaryButton>
          <PrimaryButton onClick={saveBasic} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </PrimaryButton>
        </div>
      </Modal>

      <Modal open={editVitals} title="Admin: Edit Vitals" onClose={() => setEditVitals(false)} widthClassName="max-w-3xl">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <label className="block">
            <div className="text-xs font-semibold text-black/50">Modeling experience</div>
            <select
              className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
              value={vitalsForm.experienceKey}
              onChange={(e) => setVitalsForm((p) => ({ ...p, experienceKey: e.target.value as ExperienceKey }))}
            >
              {experienceOptions.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <div className="text-xs font-semibold text-black/50">Height (ft)</div>
              <select
                className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
                value={vitalsForm.heightFeet}
                onChange={(e) => setVitalsForm((p) => ({ ...p, heightFeet: e.target.value }))}
              >
                <option value="">—</option>
                {numberOptions(4, 7, 1).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <div className="text-xs font-semibold text-black/50">Height (in)</div>
              <select
                className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
                value={vitalsForm.heightInches}
                onChange={(e) => setVitalsForm((p) => ({ ...p, heightInches: e.target.value }))}
              >
                <option value="">—</option>
                {numberOptions(0, 11, 1).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="md:col-span-2">
            <div className="text-xs font-semibold text-stone">Type of modeling experience</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {[...modelingTypeOptions, ...vitalsForm.modelingTypes.filter((x) => !modelingTypeOptions.includes(x as never))].map(
                (opt) => {
                  const selected = vitalsForm.modelingTypes.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setVitalsForm((p) => ({ ...p, modelingTypes: toggleValue(p.modelingTypes, opt) }))}
                      className={[
                        "h-10 inline-flex items-center rounded-[var(--radius-sm)] border px-4 text-sm font-medium",
                        selected
                          ? "bg-brand text-white"
                          : "border-mist bg-surface text-graphite hover:bg-surface-subtle",
                      ].join(" ")}
                    >
                      {opt}
                    </button>
                  );
                },
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                className="h-11 w-full rounded-[var(--radius-md)] border-mist bg-surface px-3 text-sm text-ink placeholder:text-stone outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
                placeholder="Add other"
                value={vitalsForm.modelingOtherInput}
                onChange={(e) => setVitalsForm((p) => ({ ...p, modelingOtherInput: e.target.value }))}
              />
              <SecondaryButton
                type="button"
                onClick={() =>
                  setVitalsForm((p) => {
                    const v = p.modelingOtherInput.trim();
                    if (!v) return p;
                    if (p.modelingTypes.includes(v)) return { ...p, modelingOtherInput: "" };
                    return { ...p, modelingTypes: [...p.modelingTypes, v], modelingOtherInput: "" };
                  })
                }
              >
                Add
              </SecondaryButton>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="text-xs font-semibold text-stone">Talents</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {[...talentOptions, ...vitalsForm.talents.filter((x) => !talentOptions.includes(x as never))].map((opt) => {
                const selected = vitalsForm.talents.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setVitalsForm((p) => ({ ...p, talents: toggleValue(p.talents, opt) }))}
                    className={[
                      "h-10 inline-flex items-center rounded-[var(--radius-sm)] border px-4 text-sm font-medium",
                      selected
                        ? "bg-brand text-white"
                        : "border-mist bg-surface text-graphite hover:bg-surface-subtle",
                    ].join(" ")}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                className="h-11 w-full rounded-[var(--radius-md)] border-mist bg-surface px-3 text-sm text-ink placeholder:text-stone outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
                placeholder="Add other"
                value={vitalsForm.talentsOtherInput}
                onChange={(e) => setVitalsForm((p) => ({ ...p, talentsOtherInput: e.target.value }))}
              />
              <SecondaryButton
                type="button"
                onClick={() =>
                  setVitalsForm((p) => {
                    const v = p.talentsOtherInput.trim();
                    if (!v) return p;
                    if (p.talents.includes(v)) return { ...p, talentsOtherInput: "" };
                    return { ...p, talents: [...p.talents, v], talentsOtherInput: "" };
                  })
                }
              >
                Add
              </SecondaryButton>
            </div>
          </div>

          <label className="block">
            <div className="text-xs font-semibold text-stone">Weight (lbs)</div>
            <select
              className="mt-1 h-11 w-full rounded-[var(--radius-md)] border-mist bg-surface px-3 text-sm text-graphite outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
              value={vitalsForm.weightPreset}
              onChange={(e) => setVitalsForm((p) => ({ ...p, weightPreset: e.target.value }))}
            >
              <option value="">—</option>
              {weightOptions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
              <option value="Other">Other</option>
            </select>
            {vitalsForm.weightPreset === "Other" ? (
              <input
                inputMode="numeric"
                className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
                placeholder="Enter weight"
                value={vitalsForm.weightOther}
                onChange={(e) => setVitalsForm((p) => ({ ...p, weightOther: e.target.value }))}
              />
            ) : null}
          </label>

          <label className="block">
            <div className="text-xs font-semibold text-black/50">Shoe size</div>
            <select
              className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
              value={vitalsForm.shoeSize}
              onChange={(e) => setVitalsForm((p) => ({ ...p, shoeSize: e.target.value }))}
            >
              <option value="">—</option>
              {shoeSizeOptions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <div className="text-xs font-semibold text-black/50">Skin tone</div>
            <select
              className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
              value={vitalsForm.skinToneChoice}
              onChange={(e) => setVitalsForm((p) => ({ ...p, skinToneChoice: e.target.value }))}
            >
              <option value="">—</option>
              {skinToneOptions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            {vitalsForm.skinToneChoice === "Other" ? (
              <input
                className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
                placeholder="Enter skin tone"
                value={vitalsForm.skinToneOther}
                onChange={(e) => setVitalsForm((p) => ({ ...p, skinToneOther: e.target.value }))}
              />
            ) : null}
          </label>

          <label className="block">
            <div className="text-xs font-semibold text-black/50">Eye color</div>
            <select
              className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
              value={vitalsForm.eyeColorChoice}
              onChange={(e) => setVitalsForm((p) => ({ ...p, eyeColorChoice: e.target.value }))}
            >
              <option value="">—</option>
              {eyeColorOptions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            {vitalsForm.eyeColorChoice === "Other" ? (
              <input
                className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
                placeholder="Enter eye color"
                value={vitalsForm.eyeColorOther}
                onChange={(e) => setVitalsForm((p) => ({ ...p, eyeColorOther: e.target.value }))}
              />
            ) : null}
          </label>

          <label className="block">
            <div className="text-xs font-semibold text-black/50">Shirt size</div>
            <select
              className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
              value={vitalsForm.shirtSize}
              onChange={(e) => setVitalsForm((p) => ({ ...p, shirtSize: e.target.value }))}
            >
              <option value="">—</option>
              {shirtSizeOptions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <div className="text-xs font-semibold text-black/50">Pants size</div>
            <select
              className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
              value={vitalsForm.pantsSize}
              onChange={(e) => setVitalsForm((p) => ({ ...p, pantsSize: e.target.value }))}
            >
              <option value="">—</option>
              {numberOptions(22, 40, 1).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <div className="text-xs font-semibold text-black/50">Dress size</div>
            <select
              className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
              value={vitalsForm.dressSize}
              onChange={(e) => setVitalsForm((p) => ({ ...p, dressSize: e.target.value }))}
            >
              <option value="">—</option>
              {dressSizeOptions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-2xl border border-black/10 p-4 md:col-span-2">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="block">
                <div className="text-xs font-semibold text-black/50">Tattoos</div>
                <select
                  className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
                  value={vitalsForm.tattoos === null ? "" : vitalsForm.tattoos ? "yes" : "no"}
                  onChange={(e) =>
                    setVitalsForm((p) => ({
                      ...p,
                      tattoos: e.target.value === "" ? null : e.target.value === "yes",
                      tattooLocations: e.target.value === "yes" ? p.tattooLocations : "",
                    }))
                  }
                >
                  <option value="">—</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
                {vitalsForm.tattoos ? (
                  <input
                    className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
                    placeholder="Locations"
                    value={vitalsForm.tattooLocations}
                    onChange={(e) => setVitalsForm((p) => ({ ...p, tattooLocations: e.target.value }))}
                  />
                ) : null}
              </label>

              <label className="block">
                <div className="text-xs font-semibold text-black/50">Piercings</div>
                <select
                  className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
                  value={vitalsForm.piercings === null ? "" : vitalsForm.piercings ? "yes" : "no"}
                  onChange={(e) =>
                    setVitalsForm((p) => ({
                      ...p,
                      piercings: e.target.value === "" ? null : e.target.value === "yes",
                      piercingLocations: e.target.value === "yes" ? p.piercingLocations : "",
                    }))
                  }
                >
                  <option value="">—</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
                {vitalsForm.piercings ? (
                  <input
                    className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
                    placeholder="Locations"
                    value={vitalsForm.piercingLocations}
                    onChange={(e) => setVitalsForm((p) => ({ ...p, piercingLocations: e.target.value }))}
                  />
                ) : null}
              </label>

              <label className="block">
                <div className="text-xs font-semibold text-black/50">Birthmarks</div>
                <select
                  className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
                  value={vitalsForm.birthmarks === null ? "" : vitalsForm.birthmarks ? "yes" : "no"}
                  onChange={(e) =>
                    setVitalsForm((p) => ({
                      ...p,
                      birthmarks: e.target.value === "" ? null : e.target.value === "yes",
                      birthmarkLocations: e.target.value === "yes" ? p.birthmarkLocations : "",
                    }))
                  }
                >
                  <option value="">—</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
                {vitalsForm.birthmarks ? (
                  <input
                    className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
                    placeholder="Locations"
                    value={vitalsForm.birthmarkLocations}
                    onChange={(e) => setVitalsForm((p) => ({ ...p, birthmarkLocations: e.target.value }))}
                  />
                ) : null}
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <SecondaryButton onClick={() => setEditVitals(false)} disabled={saving}>
            Cancel
          </SecondaryButton>
          <PrimaryButton onClick={saveVitals} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </PrimaryButton>
        </div>
      </Modal>

      <Modal
        open={editSocial}
        title="Admin: Edit Social Links"
        onClose={() => setEditSocial(false)}
        widthClassName="max-w-3xl"
      >
        <div className="grid grid-cols-1 gap-3">
          {missingSocialPlatforms.length ? (
            <div className="rounded-2xl border border-dashed border-black/10 bg-black/[0.02] px-4 py-4">
              <div className="text-xs font-semibold tracking-widest text-black/40">ADD PLATFORM</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {missingSocialPlatforms.map((platform) => (
                  <SecondaryButton
                    key={platform}
                    type="button"
                    onClick={() => setSocialForm((p) => [...p, createEmptySocialLink(platform)])}
                    disabled={saving}
                    className="px-4 py-2 text-xs"
                  >
                    Add {platform}
                  </SecondaryButton>
                ))}
              </div>
            </div>
          ) : null}

          {socialForm.map((l, idx) => (
            <div key={`${l.platform}-${idx}`} className="rounded-2xl border border-black/10 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold">{l.platform}</div>
                <button
                  type="button"
                  onClick={() => setSocialForm((p) => p.filter((_, i) => i !== idx))}
                  disabled={saving}
                  className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-black/60 hover:bg-black/5 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
              <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-3">
                <label className="block md:col-span-2">
                  <div className="text-xs font-semibold text-black/50">Handle</div>
                  <input
                    className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
                    value={l.handle}
                    onChange={(e) =>
                      setSocialForm((p) =>
                        p.map((x, i) => (i === idx ? { ...x, handle: e.target.value } : x)),
                      )
                    }
                  />
                </label>
                <label className="block">
                  <div className="text-xs font-semibold text-black/50">Followers</div>
                  <input
                    inputMode="numeric"
                    className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
                    value={l.followers}
                    onChange={(e) =>
                      setSocialForm((p) =>
                        p.map((x, i) => (i === idx ? { ...x, followers: e.target.value } : x)),
                      )
                    }
                  />
                </label>
                <label className="block md:col-span-3">
                  <div className="text-xs font-semibold text-black/50">URL</div>
                  <input
                    className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
                    value={l.url}
                    onChange={(e) =>
                      setSocialForm((p) => p.map((x, i) => (i === idx ? { ...x, url: e.target.value } : x)))
                    }
                  />
                </label>
              </div>
            </div>
          ))}

          {!socialForm.length ? (
            <div className="rounded-2xl border border-black/10 bg-black/[0.02] px-4 py-6 text-center text-sm text-black/60">
              No social platforms selected yet.
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <SecondaryButton onClick={() => setEditSocial(false)} disabled={saving}>
            Cancel
          </SecondaryButton>
          <PrimaryButton onClick={saveSocial} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </PrimaryButton>
        </div>
      </Modal>

      <Modal
        open={editMeasurements}
        title="Admin: Edit Measurements"
        onClose={() => setEditMeasurements(false)}
        widthClassName="max-w-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-black/60">All measurements in {measurementsForm.unit === "in" ? "inches" : "cm"}</div>
          <select
            value={measurementsForm.unit}
            onChange={(e) => {
              const nextUnit = e.target.value as "in" | "cm";
              setMeasurementsForm((p) => convertMeasurementsForm(p, nextUnit));
            }}
            className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
          >
            <option value="in">in</option>
            <option value="cm">cm</option>
          </select>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { key: "bust", label: "BUST" },
            { key: "underBust", label: "UNDER BUST" },
            { key: "naturalWaist", label: "NATURAL WAIST" },
            { key: "hips", label: "FULL HIPS" },
            { key: "waistToFloor", label: "WAIST TO FLOOR" },
            { key: "hollowToHem", label: "HOLLOW TO HEM" },
            { key: "shoulderWidth", label: "SHOULDER WIDTH" },
            { key: "backLength", label: "BACK LENGTH" },
          ].map((f) => (
            <label key={f.key} className="rounded-2xl border border-black/10 px-4 py-3">
              <div className="text-[10px] font-semibold tracking-widest text-black/40">{f.label}</div>
              <input
                inputMode="decimal"
                className="mt-1 w-full bg-transparent text-lg font-medium text-black/80 outline-none"
                value={(measurementsForm as unknown as Record<string, string | number>)[f.key] as string | number}
                onChange={(e) => setMeasurementsForm((p) => ({ ...p, [f.key]: e.target.value }))}
                placeholder="—"
              />
            </label>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <SecondaryButton onClick={() => setEditMeasurements(false)} disabled={saving}>
            Cancel
          </SecondaryButton>
          <PrimaryButton onClick={saveMeasurements} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </PrimaryButton>
        </div>
      </Modal>
    </div>
  );
}
