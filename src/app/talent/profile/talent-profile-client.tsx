"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import {
  AvatarCropperModal,
  Modal,
  PrimaryButton,
  SecondaryButton,
  TalentHeader,
  DataField,
  AlertBanner,
  Badge,
} from "@/components/ui";
import {
  GALLERY_FILE_INPUT_ACCEPT,
  MAX_GALLERY_ITEMS,
  MAX_PHOTO_UPLOAD_BYTES,
  galleryKindFromMimeType,
  maxGalleryUploadBytesForKind,
} from "@/lib/gallery-media";
import { roleBackLinkClass, roleShellClass } from "@/lib/role-ui-theme-shared";

type SocialLinkDTO = {
  platform: string;
  handle: string | null;
  url: string | null;
  followers: number | null;
};

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

type ProfileDTO = {
  id: string;
  displayName: string;
  alias: string | null;
  dateOfBirth: string | null;
  locationCity: string | null;
  locationCountry: string | null;
  avatarUpdatedAt: string | null;
  pendingAvatarUpdatedAt: string | null;
  avatarReviewStatus: "PENDING" | "APPROVED" | "DENIED" | null;
  avatarReviewNotes: string | null;
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
  aboutMe: string | null;
  updatedAt: string;
};

type SetcardDTO = { id: string; fileName: string; mimeType: string; createdAt: string } | null;

type GalleryItemDTO = {
  id: string;
  kind: "PHOTO" | "VIDEO";
  fileName: string | null;
  mimeType: string | null;
  createdAt: string;
  reviewStatus: "PENDING" | "APPROVED" | "DENIED";
  reviewNotes: string | null;
};

type ExperienceItemDTO = {
  id: string;
  kind: "PROJECT" | "CERTIFICATION" | "TITLE";
  title: string;
  role: string | null;
  when: string | null;
  createdAt: string;
};

const LIGHT_GLASS_FIELD_STYLE = {
  color: "rgba(255, 255, 255, 0.92)",
  WebkitTextFillColor: "rgba(255, 255, 255, 0.92)",
  colorScheme: "dark" as const,
};

const DARK_SELECT_OPTION_STYLE = {
  color: "rgba(16, 23, 16, 0.82)",
  backgroundColor: "#ffffff",
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

function getAge(dateOfBirthIso: string | null) {
  if (!dateOfBirthIso) return null;
  const dob = new Date(dateOfBirthIso);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age -= 1;
  return age;
}

function formatHeight(totalInches: number | null) {
  if (!totalInches) return null;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches - feet * 12);
  return `${feet}′${inches}″`;
}

function mediaReviewMeta(status: "PENDING" | "APPROVED" | "DENIED") {
  if (status === "PENDING") {
    return {
      label: "Pending review",
      className:
        "border border-warn/30 bg-warn-bg/70 text-warn-fg",
    };
  }
  if (status === "DENIED") {
    return {
      label: "Needs changes",
      className: "border border-error/30 bg-error-bg/70 text-error",
    };
  }
  return {
    label: "Approved",
    className: "border border-success/30 bg-success-bg/70 text-success-fg",
  };
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
    out[k] = convertMeasurementValue(prev[k], prev.unit, nextUnit);
  }
  return out;
}

type ExperienceKey = "" | "NONE" | "LT6M" | "6M_1Y" | "1_2Y" | "2_5Y" | "GT5Y";

type OfferProjectType = "PHOTO_SHOOT" | "VIDEO_SHOOT" | "PHOTO_VIDEO_SHOOT" | "PERFORMANCE" | "HOSTING" | "OTHER";

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

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const chars = parts.map((p) => p[0]?.toUpperCase()).filter(Boolean);
  return chars.join("") || "MP";
}

function platformStyles(platform: string) {
  const key = platform.trim().toLowerCase();
  if (key === "instagram") return { header: "bg-[#E1306C]" };
  if (key === "tiktok" || key === "tik tok") return { header: "bg-[#111111]" };
  if (key === "youtube") return { header: "bg-[#FF0000]" };
  if (key === "facebook") return { header: "bg-[#1877F2]" };
  if (key === "x" || key === "twitter") return { header: "bg-[#0F1419]" };
  return { header: "bg-brand" };
}

function PlatformIcon(props: { platform: string }) {
  const key = props.platform.trim().toLowerCase();
  const common = { className: "h-5 w-5", viewBox: "0 0 24 24", fill: "none" as const };

  if (key === "instagram") {
    return (
      <svg {...common} aria-hidden="true">
        <rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
        <circle cx="17" cy="7" r="1.2" fill="currentColor" />
      </svg>
    );
  }

  if (key === "tiktok" || key === "tik tok") {
    return (
      <svg {...common} aria-hidden="true">
        <path
          d="M14 4v9.2a3.8 3.8 0 1 1-3-3.7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 4c.9 2.7 2.8 4.5 5.5 5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (key === "youtube") {
    return (
      <svg {...common} aria-hidden="true">
        <rect x="4" y="7" width="16" height="10" rx="3" stroke="currentColor" strokeWidth="2" />
        <path d="M11 10l4 2-4 2v-4z" fill="currentColor" />
      </svg>
    );
  }

  if (key === "facebook") {
    return (
      <svg {...common} aria-hidden="true">
        <path
          d="M14 8h2V5h-2c-2.2 0-4 1.8-4 4v2H8v3h2v5h3v-5h2.4l.6-3H13V9c0-.6.4-1 1-1z"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (key === "x" || key === "twitter") {
    return (
      <svg {...common} aria-hidden="true">
        <path
          d="M7 5h3.4l3.1 4.1L17 5h2l-4.6 5.7L19 19h-3.4l-3.3-4.4L7 19H5l5.2-6.3L5 5h2z"
          fill="currentColor"
        />
      </svg>
    );
  }

  return (
    <svg {...common} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function TalentProfileClient(props: {
  glassThemeEnabled: boolean;
  user: { id: string; email: string; createdAt: string };
  publicShowcasePath?: string;
  profile: ProfileDTO;
  measurements: MeasurementsDTO | null;
  socialLinks: SocialLinkDTO[];
  galleryItems: GalleryItemDTO[];
  experienceItems: ExperienceItemDTO[];
  setcard: SetcardDTO;
  navRole?: "TALENT" | "PARTNER" | "ADMIN";
  workspace?: { agencyName: string; agencySub: string };
  readOnly?: boolean;
  backHref?: string;
  backLabel?: string;
  showNav?: boolean;
  assetAccess?: "private" | "public";
  basicInfoVisibility?: {
    showContactInfo?: boolean;
    showBasicInfo?: boolean;
  };
  firstApprovedAt: string | null;
  pendingReview: { id: string; submittedAt: string } | null;
  lastDecisionReview: {
    id: string;
    status: "APPROVED" | "REJECTED";
    reviewedAt: string | null;
    rejectionComment: string | null;
  } | null;
}) {
  const router = useRouter();
  const baseIsReadOnly = props.readOnly ?? false;
  const isReviewPending = Boolean(props.pendingReview);
  const isReadOnly = baseIsReadOnly || isReviewPending;
  const isPartnerView = (props.navRole ?? "TALENT") === "PARTNER";
  const showNav = props.showNav ?? true;
  const assetAccess = props.assetAccess ?? "private";
  const showContactInfo = props.basicInfoVisibility?.showContactInfo ?? true;
  const showBasicInfo = props.basicInfoVisibility?.showBasicInfo ?? true;
  const useSoftGlassSections = props.glassThemeEnabled && (props.navRole ?? "TALENT") !== "ADMIN";

  const age = useMemo(() => getAge(props.profile.dateOfBirth), [props.profile.dateOfBirth]);
  const location = props.profile.locationCity ?? "";
  const galleryApprovedCount = useMemo(
    () => props.galleryItems.filter((item) => item.reviewStatus === "APPROVED").length,
    [props.galleryItems],
  );
  const galleryPendingCount = useMemo(
    () => props.galleryItems.filter((item) => item.reviewStatus === "PENDING").length,
    [props.galleryItems],
  );
  const galleryNeedsChangesCount = useMemo(
    () => props.galleryItems.filter((item) => item.reviewStatus === "DENIED").length,
    [props.galleryItems],
  );
  const activeGalleryCount = galleryApprovedCount + galleryPendingCount;
  const showPendingAvatar = !isReadOnly && Boolean(props.profile.pendingAvatarUpdatedAt) && props.profile.avatarReviewStatus !== "APPROVED";
  const avatarVersion = showPendingAvatar ? props.profile.pendingAvatarUpdatedAt : props.profile.avatarUpdatedAt;
  const avatarRouteBase = assetAccess === "public" ? "/api/public/avatars" : "/api/avatars";
  const galleryRouteBase = assetAccess === "public" ? "/api/public/gallery" : "/api/gallery";
  const setcardRouteBase = assetAccess === "public" ? "/api/public/setcards" : "/api/setcards";
  const avatarSrc = avatarVersion
    ? `${avatarRouteBase}/${props.profile.id}${showPendingAvatar ? "?variant=pending&" : "?"}v=${encodeURIComponent(avatarVersion)}`
    : null;
  const visibleBasicInfoItems = [
    ...(showContactInfo
      ? [
          { label: "EMAIL ADDRESS", value: props.user.email },
          { label: "MOBILE NUMBER", value: props.profile.phoneNumber ?? "—" },
        ]
      : []),
    ...(showBasicInfo
      ? [
          { label: "EMPLOYMENT STATUS", value: props.profile.employmentStatus ?? "—" },
          { label: "EDUCATIONAL ATTAINMENT", value: props.profile.educationLevel ?? "—" },
          { label: "COLLEGE COURSE", value: props.profile.collegeCourse ?? "—" },
          { label: "NATIONALITY", value: props.profile.nationality ?? "—" },
        ]
      : []),
  ];
  const visibleAboutMe = showBasicInfo ? props.profile.aboutMe?.trim() ?? null : null;
  const photoFileInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const galleryCarouselRef = useRef<HTMLDivElement | null>(null);
  const galleryAutoScrollFlagsRef = useRef<{
    hover: boolean;
    pointerDown: boolean;
    focusWithin: boolean;
    scrollPauseUntil: number;
  }>({ hover: false, pointerDown: false, focusWithin: false, scrollPauseUntil: 0 });
  const galleryDragRef = useRef<{
    active: boolean;
    pointerId: number | null;
    startX: number;
    startScrollLeft: number;
    moved: boolean;
  }>({ active: false, pointerId: null, startX: 0, startScrollLeft: 0, moved: false });
  const gallerySuppressClickRef = useRef(false);
  const gallerySuppressTimeoutRef = useRef<number | null>(null);
  const galleryPointerItemIdRef = useRef<string | null>(null);
  const [galleryActiveId, setGalleryActiveId] = useState<string | null>(null);
  const [galleryBusy, setGalleryBusy] = useState(false);

  const [showMeasurements, setShowMeasurements] = useState(false);
  const [showSetcard, setShowSetcard] = useState(false);
  const [editVitals, setEditVitals] = useState(false);
  const [editBasic, setEditBasic] = useState(false);
  const [editSocial, setEditSocial] = useState(false);
  const [editPhoto, setEditPhoto] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [editExperience, setEditExperience] = useState(false);
  const [experienceKind, setExperienceKind] = useState<"PROJECT" | "CERTIFICATION" | "TITLE">("PROJECT");
  const [experienceTitle, setExperienceTitle] = useState("");
  const [experienceRole, setExperienceRole] = useState("");
  const [experienceWhen, setExperienceWhen] = useState("");
  const [experienceBusy, setExperienceBusy] = useState(false);
  const [editExperienceItem, setEditExperienceItem] = useState<ExperienceItemDTO | null>(null);
  const [editExperienceKind, setEditExperienceKind] = useState<"PROJECT" | "CERTIFICATION" | "TITLE">("PROJECT");
  const [editExperienceTitle, setEditExperienceTitle] = useState("");
  const [editExperienceRole, setEditExperienceRole] = useState("");
  const [editExperienceWhen, setEditExperienceWhen] = useState("");

  const [saving, setSaving] = useState(false);

  const [showOfferModal, setShowOfferModal] = useState(false);

  const [experienceItemsDraft, setExperienceItemsDraft] = useState<ExperienceItemDTO[]>(
    () => props.experienceItems.map((x) => ({ ...x })),
  );

  const [lastDecisionShown, setLastDecisionShown] = useState<
    { status: "APPROVED" | "REJECTED"; id: string } | null
  >(null);
  const [dismissedDecisionIds, setDismissedDecisionIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set<string>();
    try {
      const raw = window.localStorage.getItem("talent_profile_dismissed_decisions");
      if (!raw) return new Set<string>();
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set<string>(arr.filter((x): x is string => typeof x === "string"));
    } catch {
      /* ignore */
    }
    return new Set<string>();
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        "talent_profile_dismissed_decisions",
        JSON.stringify(Array.from(dismissedDecisionIds)),
      );
    } catch {
      /* ignore quota / private mode */
    }
  }, [dismissedDecisionIds]);
  useEffect(() => {
    if (!props.lastDecisionReview || isReviewPending) return;
    if (lastDecisionShown?.id === props.lastDecisionReview.id) return;
    setLastDecisionShown({ status: props.lastDecisionReview.status, id: props.lastDecisionReview.id });
    if (props.lastDecisionReview.status === "APPROVED") {
      const t = window.setTimeout(() => setLastDecisionShown(null), 15000);
      return () => window.clearTimeout(t);
    }
  }, [props.lastDecisionReview, isReviewPending, lastDecisionShown?.id]);

  const [confirmSubmitModal, setConfirmSubmitModal] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitFeedback, setReviewSubmitFeedback] = useState<
    | null
    | { kind: "error" | "info" | "success"; message: string }
  >(null);
  useEffect(() => {
    if (!reviewSubmitFeedback) return;
    if (reviewSubmitFeedback.kind === "success") {
      const t = window.setTimeout(() => setReviewSubmitFeedback(null), 6000);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setReviewSubmitFeedback(null), 10000);
    return () => window.clearTimeout(t);
  }, [reviewSubmitFeedback]);
  const [offerTitle, setOfferTitle] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [offerDate, setOfferDate] = useState("");
  const [offerStartTime, setOfferStartTime] = useState("");
  const [offerEndTime, setOfferEndTime] = useState("");
  const [offerAmountPhp, setOfferAmountPhp] = useState("");
  const [offerTransportAllowance, setOfferTransportAllowance] = useState(false);
  const [offerProjectType, setOfferProjectType] = useState<OfferProjectType>("PHOTO_SHOOT");
  const [offerSending, setOfferSending] = useState(false);
  const [offerFeedback, setOfferFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [shareFeedback, setShareFeedback] = useState<"copied" | "error" | null>(null);

  useEffect(() => {
    if (!shareFeedback) return;
    const timeout = window.setTimeout(() => setShareFeedback(null), 2200);
    return () => window.clearTimeout(timeout);
  }, [shareFeedback]);

  useEffect(() => {
    return () => {
      if (gallerySuppressTimeoutRef.current !== null) {
        window.clearTimeout(gallerySuppressTimeoutRef.current);
      }
    };
  }, []);

  async function sendOffer() {
    setOfferSending(true);
    setOfferFeedback(null);
    try {
      const amount = Number(offerAmountPhp);
      if (!offerDate) {
        setOfferFeedback({ kind: "error", message: "Please select a date." });
        return;
      }
      if (!offerStartTime || !offerEndTime) {
        setOfferFeedback({ kind: "error", message: "Please set a start and end time." });
        return;
      }
      if (!Number.isFinite(amount) || amount < 0) {
        setOfferFeedback({ kind: "error", message: "Please enter a valid amount in PHP." });
        return;
      }
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          talentId: props.user.id,
          title: offerTitle.trim() || "Offer",
          projectDate: offerDate,
          startTime: offerStartTime,
          endTime: offerEndTime,
          amountPhp: Math.round(amount),
          transportAllowance: offerTransportAllowance,
          projectType: offerProjectType,
          message: offerMessage.trim() ? offerMessage.trim() : null,
        }),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        setOfferFeedback({ kind: "error", message: msg || "Failed to send offer." });
        return;
      }
      setOfferFeedback({ kind: "success", message: "Offer submitted for admin approval." });
      setShowOfferModal(false);
      setOfferTitle("");
      setOfferMessage("");
      setOfferDate("");
      setOfferStartTime("");
      setOfferEndTime("");
      setOfferAmountPhp("");
      setOfferTransportAllowance(false);
      setOfferProjectType("PHOTO_SHOOT");
    } catch {
      setOfferFeedback({ kind: "error", message: "Failed to send offer." });
    } finally {
      setOfferSending(false);
    }
  }

  function copyShowcaseLink() {
    if (!props.publicShowcasePath) {
      setShareFeedback("error");
      return;
    }
    const origin =
      typeof window !== "undefined" &&
      window.location &&
      window.location.origin &&
      window.location.origin !== "null" &&
      window.location.origin !== ""
        ? window.location.origin
        : typeof window !== "undefined" && window.location
          ? `${window.location.protocol}//${window.location.host}${
              window.location.port ? `:${window.location.port}` : ""
            }`
          : "";
    const full = origin ? new URL(props.publicShowcasePath, origin).toString() : props.publicShowcasePath;

    let copied = false;

    try {
      const ta = document.createElement("textarea");
      ta.value = full;
      ta.setAttribute("readonly", "");
      ta.setAttribute("autocomplete", "off");
      ta.setAttribute("autocorrect", "off");
      ta.setAttribute("autocapitalize", "off");
      ta.setAttribute("spellcheck", "false");
      ta.style.position = "fixed";
      ta.style.top = "0";
      ta.style.left = "0";
      ta.style.width = "1px";
      ta.style.height = "1px";
      ta.style.padding = "0";
      ta.style.margin = "0";
      ta.style.border = "0";
      ta.style.outline = "none";
      ta.style.boxShadow = "none";
      ta.style.background = "transparent";
      ta.style.opacity = "0";
      ta.style.pointerEvents = "none";
      ta.style.userSelect = "text";
      document.body.appendChild(ta);
      const range = document.createRange();
      range.selectNodeContents(ta);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      try {
        copied = document.execCommand("copy");
      } catch (e1) {
        copied = false;
      }
      try {
        sel?.removeAllRanges();
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      } catch {}
      try {
        document.body.removeChild(ta);
      } catch {}
    } catch {}

    if (!copied && typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      navigator.clipboard
        .writeText(full)
        .then(() => setShareFeedback("copied"))
        .catch(() => setShareFeedback("error"));
      return;
    }

    setShareFeedback(copied ? "copied" : "error");
  }

  const galleryActiveIndex = useMemo(() => {
    if (!galleryActiveId) return -1;
    return props.galleryItems.findIndex((x) => x.id === galleryActiveId);
  }, [galleryActiveId, props.galleryItems]);
  const galleryActiveItem = galleryActiveIndex >= 0 ? props.galleryItems[galleryActiveIndex] : null;
  const canViewPreviousGalleryItem = galleryActiveIndex > 0;
  const canViewNextGalleryItem = galleryActiveIndex >= 0 && galleryActiveIndex < props.galleryItems.length - 1;

  function showPreviousGalleryItem() {
    if (!canViewPreviousGalleryItem) return;
    setGalleryActiveId(props.galleryItems[galleryActiveIndex - 1]?.id ?? null);
  }

  function showNextGalleryItem() {
    if (!canViewNextGalleryItem) return;
    setGalleryActiveId(props.galleryItems[galleryActiveIndex + 1]?.id ?? null);
  }

  function scrollGalleryBy(direction: -1 | 1) {
    const el = galleryCarouselRef.current;
    if (!el) return;
    const cardWidth = 144;
    const gap = 16;
    el.scrollBy({ left: direction * (cardWidth + gap) * 2, behavior: "smooth" });
  }

  function openGalleryItem(id: string) {
    if (galleryBusy) return;
    if (gallerySuppressClickRef.current) return;
    setGalleryActiveId(id);
  }

  function onGalleryPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const el = galleryCarouselRef.current;
    if (!el) return;
    if (e.button !== 0) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest("[data-gallery-ignore-click='true']")) {
      galleryPointerItemIdRef.current = null;
      return;
    }
    galleryPointerItemIdRef.current = target?.closest<HTMLElement>("[data-gallery-item-id]")?.dataset.galleryItemId ?? null;
    galleryAutoScrollFlagsRef.current.pointerDown = true;
    galleryDragRef.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startScrollLeft: el.scrollLeft,
      moved: false,
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  }

  function onGalleryPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = galleryCarouselRef.current;
    if (!el) return;
    const drag = galleryDragRef.current;
    if (!drag.active || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    if (!drag.moved && Math.abs(dx) >= 4) drag.moved = true;
    if (!drag.moved) return;
    galleryAutoScrollFlagsRef.current.scrollPauseUntil = Date.now() + 1500;
    el.scrollLeft = drag.startScrollLeft - dx;
    e.preventDefault();
  }

  function onGalleryPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const drag = galleryDragRef.current;
    const clickedGalleryItemId = !drag.moved ? galleryPointerItemIdRef.current : null;
    if (drag.active && drag.pointerId === e.pointerId && drag.moved) {
      gallerySuppressClickRef.current = true;
      if (gallerySuppressTimeoutRef.current !== null) {
        window.clearTimeout(gallerySuppressTimeoutRef.current);
      }
      gallerySuppressTimeoutRef.current = window.setTimeout(() => {
        gallerySuppressClickRef.current = false;
        gallerySuppressTimeoutRef.current = null;
      }, 250);
    }
    galleryAutoScrollFlagsRef.current.pointerDown = false;
    galleryDragRef.current.active = false;
    galleryDragRef.current.pointerId = null;
    galleryPointerItemIdRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    if (clickedGalleryItemId) {
      openGalleryItem(clickedGalleryItemId);
    }
  }

  function onGalleryWheel(e: React.WheelEvent<HTMLDivElement>) {
    const el = galleryCarouselRef.current;
    if (!el) return;
    const absX = Math.abs(e.deltaX);
    const absY = Math.abs(e.deltaY);
    if (absY > absX && !e.shiftKey) {
      el.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  }

  useEffect(() => {
    const el = galleryCarouselRef.current;
    if (!el) return;
    const node = el;
    if (props.galleryItems.length <= 1) return;
    if (galleryActiveId) return;
    if (typeof window === "undefined") return;

    const reducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    if (reducedMotion) return;
    const desktopViewport = window.matchMedia?.("(min-width: 768px)")?.matches ?? true;
    if (!desktopViewport) return;

    const speedPxPerMs = 0.04;
    let raf = 0;
    let last = performance.now();

    function isPaused() {
      const f = galleryAutoScrollFlagsRef.current;
      return (
        f.hover ||
        f.pointerDown ||
        f.focusWithin ||
        Date.now() < f.scrollPauseUntil
      );
    }

    function tick(now: number) {
      const dt = Math.max(0, Math.min(64, now - last));
      last = now;

      const maxScroll = node.scrollWidth - node.clientWidth;
      if (document.visibilityState === "visible" && maxScroll > 0 && !isPaused()) {
        node.scrollLeft += dt * speedPxPerMs;
        if (node.scrollLeft >= maxScroll - 1) node.scrollLeft = 0;
      }

      raf = window.requestAnimationFrame(tick);
    }

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [props.galleryItems.length, galleryActiveId]);

  useEffect(() => {
    if (galleryActiveIndex < 0) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setGalleryActiveId(null);
      if (e.key === "ArrowLeft") {
        if (galleryActiveIndex > 0) {
          const previousId = props.galleryItems[galleryActiveIndex - 1]?.id ?? null;
          setGalleryActiveId(previousId);
        }
      }
      if (e.key === "ArrowRight") {
        if (galleryActiveIndex < props.galleryItems.length - 1) {
          const nextId = props.galleryItems[galleryActiveIndex + 1]?.id ?? null;
          setGalleryActiveId(nextId);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [galleryActiveIndex, props.galleryItems]);

  async function uploadGalleryFiles(files: FileList | null) {
    if (isReadOnly) return;
    if (!files?.length) return;
    const remaining = MAX_GALLERY_ITEMS - activeGalleryCount;
    const selected = Array.from(files).slice(0, remaining);
    if (!selected.length) {
      window.alert(`Gallery is full (max ${MAX_GALLERY_ITEMS} items).`);
      return;
    }
    for (const file of selected) {
      const kind = galleryKindFromMimeType(file.type);
      if (!kind) {
        window.alert(`"${file.name}" is not supported. Upload JPG, PNG, WEBP, MP4, MOV, or WEBM files only.`);
        return;
      }
      if (file.size > maxGalleryUploadBytesForKind(kind)) {
        window.alert(
          `"${file.name}" is too large. Maximum size is ${kind === "VIDEO" ? "100 MB per video" : "10 MB per photo"}.`,
        );
        return;
      }
    }

    const form = new FormData();
    for (const f of selected) form.append("files", f);

    setGalleryBusy(true);
    try {
      const res = await fetch("/api/talent/profile/gallery", { method: "POST", body: form });
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        window.alert(msg || "Upload failed.");
        return;
      }
      router.refresh();
    } finally {
      setGalleryBusy(false);
    }
  }

  async function deleteGalleryItem(id: string) {
    if (isReadOnly) return;
    if (!id) return;
    setGalleryBusy(true);
    try {
      const res = await fetch(`/api/talent/profile/gallery/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        window.alert(msg || "Delete failed.");
        return;
      }
      if (galleryActiveId === id) setGalleryActiveId(null);
      router.refresh();
    } finally {
      setGalleryBusy(false);
    }
  }

  async function addExperienceItem() {
    if (isReadOnly) return;
    const title = experienceTitle.trim();
    if (!title) return;
    setExperienceBusy(true);
    try {
      const now = new Date().toISOString();
      const newId = `draft-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`;
      setExperienceItemsDraft((arr) => [
        {
          id: newId,
          kind: experienceKind,
          title,
          role: experienceRole.trim() ? experienceRole.trim() : null,
          when: experienceWhen.trim() ? experienceWhen.trim() : null,
          createdAt: now,
        },
        ...arr,
      ]);
      setExperienceTitle("");
      setExperienceRole("");
      setExperienceWhen("");
      setExperienceKind("PROJECT");
    } finally {
      setExperienceBusy(false);
    }
  }

  async function deleteExperienceItem(id: string) {
    if (isReadOnly) return;
    if (!id) return;
    setExperienceItemsDraft((arr) => arr.filter((x) => x.id !== id));
  }

  function openEditExperienceItem(item: ExperienceItemDTO) {
    setEditExperienceItem(item);
    setEditExperienceKind(item.kind);
    setEditExperienceTitle(item.title);
    setEditExperienceRole(item.role ?? "");
    setEditExperienceWhen(item.when ?? "");
  }

  async function updateExperienceItem() {
    if (isReadOnly) return;
    if (!editExperienceItem) return;
    const title = editExperienceTitle.trim();
    if (!title) return;
    setExperienceBusy(true);
    try {
      setExperienceItemsDraft((arr) =>
        arr.map((x) =>
          x.id === editExperienceItem.id
            ? {
                ...x,
                kind: editExperienceKind,
                title,
                role: editExperienceRole.trim() ? editExperienceRole.trim() : null,
                when: editExperienceWhen.trim() ? editExperienceWhen.trim() : null,
              }
            : x,
        ),
      );
      setEditExperienceItem(null);
    } finally {
      setExperienceBusy(false);
    }
  }

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
      aboutMe: props.profile.aboutMe ?? "",
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

  function saveVitals() {
    setSaving(false);
    setEditVitals(false);
  }

  function saveBasic() {
    setSaving(false);
    setEditBasic(false);
  }

  function saveSocial() {
    setSaving(false);
    setEditSocial(false);
  }

  function saveMeasurements() {
    setSaving(false);
    setShowMeasurements(false);
  }

  function buildSubmittedDraft() {
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
    const employmentStatus =
      basicForm.employmentChoice === "Other" ? basicForm.employmentOther.trim() : basicForm.employmentChoice.trim();
    const educationLevel =
      basicForm.educationChoice === "Other" ? basicForm.educationOther.trim() : basicForm.educationChoice.trim();

    const experienceItems = experienceItemsDraft.map((x) => ({
      id: x.id,
      kind: x.kind,
      title: x.title,
      role: x.role ?? null,
      when: x.when ?? null,
      createdAt: x.createdAt,
    }));

    return {
      identity: {
        displayName: basicForm.displayName.trim(),
        alias: basicForm.alias.trim() || null,
        dateOfBirth: basicForm.dateOfBirth ? new Date(basicForm.dateOfBirth).toISOString() : null,
        locationCity: basicForm.locationCity.trim() || null,
        locationCountry: basicForm.locationCountry.trim() || null,
        nationality: basicForm.nationality.trim() || null,
        phoneNumber: basicForm.phoneNumber.trim() || null,
        employmentStatus: employmentStatus || null,
        educationLevel: educationLevel || null,
        collegeCourse: basicForm.collegeCourse.trim() || null,
      },
      stats: {
        heightIn: heightIn,
        weightLbs: weightLbs,
        skinTone: skinTone || null,
        eyeColor: eyeColor || null,
        shirtSize: vitalsForm.shirtSize.trim() || null,
        pantsSize: vitalsForm.pantsSize.trim() || null,
        dressSize: vitalsForm.dressSize.trim() || null,
        shoeSize: vitalsForm.shoeSize === "" ? null : Number(vitalsForm.shoeSize),
        measurements: {
          unit: measurementsForm.unit as "in" | "cm",
          bust: measurementsForm.bust === "" ? null : Number(measurementsForm.bust),
          underBust: measurementsForm.underBust === "" ? null : Number(measurementsForm.underBust),
          naturalWaist: measurementsForm.naturalWaist === "" ? null : Number(measurementsForm.naturalWaist),
          hips: measurementsForm.hips === "" ? null : Number(measurementsForm.hips),
          waistToFloor: measurementsForm.waistToFloor === "" ? null : Number(measurementsForm.waistToFloor),
          hollowToHem: measurementsForm.hollowToHem === "" ? null : Number(measurementsForm.hollowToHem),
          shoulderWidth: measurementsForm.shoulderWidth === "" ? null : Number(measurementsForm.shoulderWidth),
          backLength: measurementsForm.backLength === "" ? null : Number(measurementsForm.backLength),
        },
        tattoos: vitalsForm.tattoos ?? null,
        tattooLocations: vitalsForm.tattooLocations.trim() || null,
        piercings: vitalsForm.piercings ?? null,
        piercingLocations: vitalsForm.piercingLocations.trim() || null,
        birthmarks: vitalsForm.birthmarks ?? null,
        birthmarkLocations: vitalsForm.birthmarkLocations.trim() || null,
      },
      credibility: {
        experienceYears: experienceYears,
        modelingTypes: vitalsForm.modelingTypes.length ? vitalsForm.modelingTypes : [],
        talents: vitalsForm.talents.length ? vitalsForm.talents : [],
        experienceItems,
      },
      social: {
        links: socialForm.map((l) => ({
          platform: l.platform,
          handle: l.handle.trim() || null,
          url: l.url.trim() || null,
          followers: l.followers === "" ? null : Number(l.followers),
        })),
      },
      bio: {
        aboutMe: basicForm.aboutMe.trim() || null,
      },
    };
  }

  const initialReviewBaseline = useMemo(() => {
    const baselineSocialLinks = props.socialLinks.map((l) => ({
      platform: l.platform,
      handle: l.handle ?? null,
      url: l.url ?? null,
      followers: l.followers ?? null,
    }));
    const baselineExperience = props.experienceItems.map((x) => ({
      id: x.id,
      kind: x.kind,
      title: x.title,
      role: x.role ?? null,
      when: x.when ?? null,
      createdAt: x.createdAt,
    }));
    const baselineMeasurements = {
      unit: (props.measurements?.unit as "in" | "cm") ?? "in",
      bust: props.measurements?.bust ?? null,
      underBust: props.measurements?.underBust ?? null,
      naturalWaist: props.measurements?.naturalWaist ?? null,
      hips: props.measurements?.hips ?? null,
      waistToFloor: props.measurements?.waistToFloor ?? null,
      hollowToHem: props.measurements?.hollowToHem ?? null,
      shoulderWidth: props.measurements?.shoulderWidth ?? null,
      backLength: props.measurements?.backLength ?? null,
    };
    const baseSkin = choiceWithOther(props.profile.skinTone, skinToneOptions);
    const baseEye = choiceWithOther(props.profile.eyeColor, eyeColorOptions);
    const baseWeightStr = props.profile.weightLbs ? String(Math.round(props.profile.weightLbs)) : "";
    const baseWeightPreset =
      baseWeightStr && weightOptions.includes(baseWeightStr) ? baseWeightStr : baseWeightStr ? "Other" : "";
    const baseWeightOther = baseWeightPreset === "Other" ? baseWeightStr : "";
    const baseEmployment = choiceWithOther(props.profile.employmentStatus, employmentStatusOptions);
    const baseEducation = choiceWithOther(props.profile.educationLevel, educationLevelOptions);
    return {
      identity: {
        displayName: props.profile.displayName ?? "",
        alias: props.profile.alias ?? null,
        dateOfBirth: props.profile.dateOfBirth ? new Date(props.profile.dateOfBirth).toISOString() : null,
        locationCity: props.profile.locationCity ?? null,
        locationCountry: props.profile.locationCountry ?? null,
        nationality: props.profile.nationality ?? null,
        phoneNumber: props.profile.phoneNumber ?? null,
        employmentStatus: props.profile.employmentStatus ?? null,
        educationLevel: props.profile.educationLevel ?? null,
        collegeCourse: props.profile.collegeCourse ?? null,
      },
      stats: {
        experienceKey: experienceKeyFromYears(props.profile.experienceYears),
        modelingTypes: props.profile.modelingTypes ?? [],
        talents: props.profile.talents ?? [],
        heightFeet: props.profile.heightIn ? String(Math.floor(props.profile.heightIn / 12)) : "",
        heightInches: props.profile.heightIn ? String(Math.round(props.profile.heightIn % 12)) : "",
        weightPreset: baseWeightPreset,
        weightOther: baseWeightOther,
        skinToneChoice: baseSkin.choice,
        skinToneOther: baseSkin.other,
        eyeColorChoice: baseEye.choice,
        eyeColorOther: baseEye.other,
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
        measurements: baselineMeasurements,
      },
      socialLinks: baselineSocialLinks,
      experienceItems: baselineExperience,
      aboutMe: props.profile.aboutMe ?? null,
      employmentChoice: baseEmployment.choice,
      employmentOther: baseEmployment.other,
      educationChoice: baseEducation.choice,
      educationOther: baseEducation.other,
    };
  }, [JSON.stringify(props.profile), JSON.stringify(props.measurements), JSON.stringify(props.socialLinks), JSON.stringify(props.experienceItems)]);

  const changedCategories = useMemo<Array<{ key: "identity" | "stats" | "credibility" | "social" | "bio"; code: string; label: string }>>(() => {
    if (isReviewPending || isReadOnly) return [];
    const categories: Array<{ key: "identity" | "stats" | "credibility" | "social" | "bio"; code: string; label: string }> = [];
    const b = initialReviewBaseline;

    const identityChanged =
      basicForm.displayName.trim() !== b.identity.displayName ||
      (basicForm.alias.trim() || null) !== b.identity.alias ||
      (basicForm.dateOfBirth ? new Date(basicForm.dateOfBirth).toISOString() : null) !== b.identity.dateOfBirth ||
      (basicForm.locationCity.trim() || null) !== b.identity.locationCity ||
      (basicForm.locationCountry.trim() || null) !== b.identity.locationCountry ||
      (basicForm.nationality.trim() || null) !== b.identity.nationality ||
      (basicForm.phoneNumber.trim() || null) !== b.identity.phoneNumber ||
      ((basicForm.employmentChoice === "Other" ? basicForm.employmentOther.trim() : basicForm.employmentChoice.trim()) || null) !==
        b.identity.employmentStatus ||
      ((basicForm.educationChoice === "Other" ? basicForm.educationOther.trim() : basicForm.educationChoice.trim()) || null) !==
        b.identity.educationLevel ||
      (basicForm.collegeCourse.trim() || null) !== b.identity.collegeCourse;
    if (identityChanged) categories.push({ key: "identity", code: "A", label: "Identity" });

    const bioChanged = (basicForm.aboutMe.trim() || null) !== b.aboutMe;
    if (bioChanged) categories.push({ key: "bio", code: "E", label: "Bio" });

    const curHeightIn =
      vitalsForm.heightFeet && vitalsForm.heightInches
        ? Number(vitalsForm.heightFeet) * 12 + Number(vitalsForm.heightInches)
        : null;
    const curWeightLbs = vitalsForm.weightPreset
      ? Number(vitalsForm.weightPreset)
      : vitalsForm.weightOther.trim()
        ? Number(vitalsForm.weightOther)
        : null;
    const baseHeightIn = b.stats.heightFeet && b.stats.heightInches
      ? Number(b.stats.heightFeet) * 12 + Number(b.stats.heightInches)
      : null;
    const baseWeightLbs = b.stats.weightPreset
      ? Number(b.stats.weightPreset)
      : b.stats.weightOther.trim()
        ? Number(b.stats.weightOther)
        : null;
    const statsChanged =
      vitalsForm.experienceKey !== b.stats.experienceKey ||
      JSON.stringify([...vitalsForm.modelingTypes].sort()) !== JSON.stringify([...b.stats.modelingTypes].sort()) ||
      JSON.stringify([...vitalsForm.talents].sort()) !== JSON.stringify([...b.stats.talents].sort()) ||
      curHeightIn !== baseHeightIn ||
      curWeightLbs !== baseWeightLbs ||
      ((vitalsForm.skinToneChoice === "Other" ? vitalsForm.skinToneOther.trim() : vitalsForm.skinToneChoice.trim()) || null) !==
        ((b.stats.skinToneChoice === "Other" ? b.stats.skinToneOther.trim() : b.stats.skinToneChoice.trim()) || null) ||
      ((vitalsForm.eyeColorChoice === "Other" ? vitalsForm.eyeColorOther.trim() : vitalsForm.eyeColorChoice.trim()) || null) !==
        ((b.stats.eyeColorChoice === "Other" ? b.stats.eyeColorOther.trim() : b.stats.eyeColorChoice.trim()) || null) ||
      vitalsForm.shirtSize !== b.stats.shirtSize ||
      vitalsForm.pantsSize !== b.stats.pantsSize ||
      vitalsForm.dressSize !== b.stats.dressSize ||
      (vitalsForm.shoeSize === "" ? null : Number(vitalsForm.shoeSize)) !==
        (b.stats.shoeSize === "" ? null : Number(b.stats.shoeSize)) ||
      vitalsForm.tattoos !== b.stats.tattoos ||
      (vitalsForm.tattooLocations.trim() || null) !== (b.stats.tattooLocations.trim() || null) ||
      vitalsForm.piercings !== b.stats.piercings ||
      (vitalsForm.piercingLocations.trim() || null) !== (b.stats.piercingLocations.trim() || null) ||
      vitalsForm.birthmarks !== b.stats.birthmarks ||
      (vitalsForm.birthmarkLocations.trim() || null) !== (b.stats.birthmarkLocations.trim() || null) ||
      measurementsForm.unit !== b.stats.measurements.unit ||
      (measurementsForm.bust === "" ? null : Number(measurementsForm.bust)) !== b.stats.measurements.bust ||
      (measurementsForm.underBust === "" ? null : Number(measurementsForm.underBust)) !== b.stats.measurements.underBust ||
      (measurementsForm.naturalWaist === "" ? null : Number(measurementsForm.naturalWaist)) !== b.stats.measurements.naturalWaist ||
      (measurementsForm.hips === "" ? null : Number(measurementsForm.hips)) !== b.stats.measurements.hips ||
      (measurementsForm.waistToFloor === "" ? null : Number(measurementsForm.waistToFloor)) !== b.stats.measurements.waistToFloor ||
      (measurementsForm.hollowToHem === "" ? null : Number(measurementsForm.hollowToHem)) !== b.stats.measurements.hollowToHem ||
      (measurementsForm.shoulderWidth === "" ? null : Number(measurementsForm.shoulderWidth)) !== b.stats.measurements.shoulderWidth ||
      (measurementsForm.backLength === "" ? null : Number(measurementsForm.backLength)) !== b.stats.measurements.backLength;
    if (statsChanged) categories.push({ key: "stats", code: "B", label: "Stats" });

    const draftCredExpItems = experienceItemsDraft
      .map((x) => ({ id: x.id, kind: x.kind, title: x.title, role: x.role, when: x.when, createdAt: x.createdAt }))
      .sort((a, bItem) => bItem.createdAt.localeCompare(a.createdAt));
    const baseCredExpItems = b.experienceItems
      .map((x) => ({ id: x.id, kind: x.kind, title: x.title, role: x.role, when: x.when, createdAt: x.createdAt }))
      .sort((a, bItem) => bItem.createdAt.localeCompare(a.createdAt));
    const credChanged =
      vitalsForm.experienceKey !== b.stats.experienceKey ||
      JSON.stringify([...vitalsForm.modelingTypes].sort()) !== JSON.stringify([...b.stats.modelingTypes].sort()) ||
      JSON.stringify([...vitalsForm.talents].sort()) !== JSON.stringify([...b.stats.talents].sort()) ||
      JSON.stringify(draftCredExpItems) !== JSON.stringify(baseCredExpItems);
    if (credChanged && !categories.find((c) => c.key === "stats")) {
      if (credChanged) categories.push({ key: "credibility", code: "C", label: "Credibility" });
    } else if (credChanged && !categories.find((c) => c.key === "credibility")) {
      const onlyStatsShared =
        vitalsForm.experienceKey === b.stats.experienceKey &&
        JSON.stringify([...vitalsForm.modelingTypes].sort()) === JSON.stringify([...b.stats.modelingTypes].sort()) &&
        JSON.stringify([...vitalsForm.talents].sort()) === JSON.stringify([...b.stats.talents].sort());
      if (!onlyStatsShared) {
        categories.push({ key: "credibility", code: "C", label: "Credibility" });
      }
    }
    if (categories.find((c) => c.key === "stats") && !categories.find((c) => c.key === "credibility")) {
      const onlyCredChanged = JSON.stringify(draftCredExpItems) !== JSON.stringify(baseCredExpItems);
      if (onlyCredChanged) {
        categories.push({ key: "credibility", code: "C", label: "Credibility" });
      }
    }

    const draftSocial = socialForm
      .map((l) => ({
        platform: l.platform,
        handle: l.handle.trim() || null,
        url: l.url.trim() || null,
        followers: l.followers === "" ? null : Number(l.followers),
      }))
      .sort((a, c) => a.platform.localeCompare(c.platform));
    const baseSocial = [...b.socialLinks].sort((a, c) => a.platform.localeCompare(c.platform));
    if (JSON.stringify(draftSocial) !== JSON.stringify(baseSocial)) {
      categories.push({ key: "social", code: "D", label: "Social" });
    }
    return categories;
  }, [vitalsForm, basicForm, socialForm, measurementsForm, experienceItemsDraft, initialReviewBaseline, isReviewPending, isReadOnly]);

  const hasUnsavedChanges = changedCategories.length > 0;

  function discardReviewChanges() {
    if (!window.confirm("Discard all profile changes since last submit?")) return;
    const b = initialReviewBaseline;
    setBasicForm({
      displayName: b.identity.displayName,
      alias: b.identity.alias ?? "",
      dateOfBirth: b.identity.dateOfBirth ? b.identity.dateOfBirth.slice(0, 10) : "",
      locationCity: b.identity.locationCity ?? "",
      locationCountry: b.identity.locationCountry ?? "",
      phoneNumber: b.identity.phoneNumber ?? "",
      employmentChoice: b.employmentChoice,
      employmentOther: b.employmentOther,
      educationChoice: b.educationChoice,
      educationOther: b.educationOther,
      collegeCourse: b.identity.collegeCourse ?? "",
      nationality: b.identity.nationality ?? "",
      aboutMe: b.aboutMe ?? "",
    });
    setVitalsForm((prev) => ({
      ...prev,
      experienceKey: b.stats.experienceKey,
      modelingTypes: b.stats.modelingTypes,
      talents: b.stats.talents,
      heightFeet: b.stats.heightFeet,
      heightInches: b.stats.heightInches,
      weightPreset: b.stats.weightPreset,
      weightOther: b.stats.weightOther,
      skinToneChoice: b.stats.skinToneChoice,
      skinToneOther: b.stats.skinToneOther,
      eyeColorChoice: b.stats.eyeColorChoice,
      eyeColorOther: b.stats.eyeColorOther,
      shirtSize: b.stats.shirtSize,
      pantsSize: b.stats.pantsSize,
      dressSize: b.stats.dressSize,
      shoeSize: b.stats.shoeSize,
      tattoos: b.stats.tattoos,
      tattooLocations: b.stats.tattooLocations,
      piercings: b.stats.piercings,
      piercingLocations: b.stats.piercingLocations,
      birthmarks: b.stats.birthmarks,
      birthmarkLocations: b.stats.birthmarkLocations,
    }));
    setMeasurementsForm({
      unit: b.stats.measurements.unit as "in" | "cm",
      bust: b.stats.measurements.bust === null ? "" : String(b.stats.measurements.bust),
      underBust: b.stats.measurements.underBust === null ? "" : String(b.stats.measurements.underBust),
      naturalWaist: b.stats.measurements.naturalWaist === null ? "" : String(b.stats.measurements.naturalWaist),
      hips: b.stats.measurements.hips === null ? "" : String(b.stats.measurements.hips),
      waistToFloor: b.stats.measurements.waistToFloor === null ? "" : String(b.stats.measurements.waistToFloor),
      hollowToHem: b.stats.measurements.hollowToHem === null ? "" : String(b.stats.measurements.hollowToHem),
      shoulderWidth: b.stats.measurements.shoulderWidth === null ? "" : String(b.stats.measurements.shoulderWidth),
      backLength: b.stats.measurements.backLength === null ? "" : String(b.stats.measurements.backLength),
    });
    setSocialForm(
      b.socialLinks.map((l) => ({
        platform: l.platform,
        handle: l.handle ?? "",
        url: l.url ?? "",
        followers: l.followers === null ? "" : String(l.followers),
      })),
    );
    setExperienceItemsDraft(props.experienceItems.map((x) => ({ ...x })));
  }

  async function submitForReview() {
    if (isReviewPending || isReadOnly) return;
    if (!changedCategories.length) {
      setReviewSubmitFeedback({ kind: "info", message: "No changes detected, nothing to submit." });
      setConfirmSubmitModal(false);
      return;
    }
    setReviewSubmitting(true);
    setReviewSubmitFeedback(null);
    try {
      const body = buildSubmittedDraft();
      const res = await fetch("/api/talent/profile/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        if (res.status === 409) {
          setReviewSubmitFeedback({
            kind: "error",
            message: msg || "A review is already pending. Refresh the page to see the latest.",
          });
        } else if (res.status === 400) {
          setReviewSubmitFeedback({ kind: "info", message: msg || "No changes detected, nothing to submit." });
        } else {
          setReviewSubmitFeedback({ kind: "error", message: msg || "Failed to submit changes." });
        }
        return;
      }
      setReviewSubmitFeedback({ kind: "success", message: "Profile changes submitted for management review!" });
      setConfirmSubmitModal(false);
      router.refresh();
    } catch {
      setReviewSubmitFeedback({ kind: "error", message: "Failed to submit changes." });
    } finally {
      setReviewSubmitting(false);
    }
  }

  const socialReach = useMemo(() => {
    const nums = props.socialLinks
      .map((x) => (typeof x.followers === "number" && Number.isFinite(x.followers) ? x.followers : null))
      .filter((x): x is number => x !== null);
    return {
      total: nums.reduce((sum, v) => sum + v, 0),
      hasAny: nums.length > 0,
    };
  }, [props.socialLinks]);

  const socialReachLabel = useMemo(() => {
    if (!socialReach.hasAny) return "—";
    try {
      return new Intl.NumberFormat(undefined, { notation: "compact" }).format(socialReach.total);
    } catch {
      return socialReach.total.toLocaleString();
    }
  }, [socialReach.hasAny, socialReach.total]);

  return (
    <div
      className={[
        roleShellClass(props.glassThemeEnabled),
        useSoftGlassSections ? "talent-glass-soft" : "",
      ].join(" ")}
    >
      {showNav ? <AppNav role={props.navRole ?? "TALENT"} workspace={props.workspace} /> : null}

      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        {props.backHref ? (
          <div className="mb-4">
            <a href={props.backHref} className={["text-sm font-medium", roleBackLinkClass(props.glassThemeEnabled)].join(" ")}>
              {props.backLabel ?? "← Back"}
            </a>
          </div>
        ) : null}

        <TalentHeader
          photoSrc={avatarSrc}
          photoFallbackInitials={initials(props.profile.displayName)}
          onPhotoEdit={isReadOnly ? undefined : () => photoFileInputRef.current?.click()}
          name={props.profile.displayName}
          alias={props.profile.alias ?? undefined}
          meta={[
            age !== null ? `${age} years old` : null,
            location ?? null,
            socialReachLabel ? `Social reach ${socialReachLabel}` : null,
          ].filter((v): v is string => Boolean(v))}
          primaryAction={
            isPartnerView
              ? { label: "View Measurements", onClick: () => setShowMeasurements(true) }
              : {
                  label: "View Measurements",
                  onClick: () => setShowMeasurements(true),
                }
          }
          secondaryActions={
            isPartnerView
              ? [
                  { label: "View Setcard", onClick: () => setShowSetcard(true) },
                  ...(props.publicShowcasePath
                    ? [
                        { label: "Open Showcase", onClick: () => window.open(props.publicShowcasePath, "_blank", "noreferrer"), external: true },
                        {
                          label: "Copy Showcase Link",
                          onClick: copyShowcaseLink,
                          icon: (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                          ),
                        },
                      ]
                    : []),
                ]
              : [
                  { label: "View Setcard", onClick: () => setShowSetcard(true) },
                  ...(props.publicShowcasePath
                    ? [
                        { label: "Open Showcase", onClick: () => window.open(props.publicShowcasePath, "_blank", "noreferrer"), external: true },
                      ]
                    : []),
                  {
                    label: "Copy Showcase Link",
                    onClick: copyShowcaseLink,
                    icon: (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    ),
                  },
                ]
          }
        />
        {shareFeedback ? (
          <div className="mt-3 t-body-sm text-center lg:text-right" style={{ color: "var(--color-graphite)" }}>
            {shareFeedback === "copied" ? "Showcase link copied to clipboard." : "Could not copy the link."}
          </div>
        ) : null}
        {!isReadOnly && props.profile.avatarReviewStatus && props.profile.avatarReviewStatus !== "APPROVED" ? (
          <div className="mt-4">
            <AlertBanner tone={props.profile.avatarReviewStatus === "PENDING" ? "warning" : "error"}>
              <div className="font-semibold">{mediaReviewMeta(props.profile.avatarReviewStatus).label}</div>
              <div className="mt-0.5 text-[13px] opacity-90">
                {props.profile.avatarReviewStatus === "PENDING"
                  ? "Your latest profile photo is waiting for admin approval before it goes live."
                  : props.profile.avatarReviewNotes ||
                    "Please upload a different photo and submit it again."}
              </div>
            </AlertBanner>
          </div>
        ) : null}

        {reviewSubmitFeedback ? (
          <div className="mt-4">
            <AlertBanner
              tone={
                reviewSubmitFeedback.kind === "success"
                  ? "success"
                  : reviewSubmitFeedback.kind === "error"
                    ? "error"
                    : "warning"
              }
            >
              <div className="font-semibold">
                {reviewSubmitFeedback.kind === "success"
                  ? "Submitted"
                  : reviewSubmitFeedback.kind === "error"
                    ? "Could not submit"
                    : "Note"}
              </div>
              <div className="mt-0.5 text-[13px] opacity-90">{reviewSubmitFeedback.message}</div>
            </AlertBanner>
          </div>
        ) : null}

        {props.pendingReview ? (
          <div className="mt-4">
            <AlertBanner tone="warning">
              <div className="font-semibold flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="w-4 h-4 opacity-80" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Changes awaiting management review
              </div>
              <div className="mt-0.5 text-[13px] opacity-90 leading-snug">
                Your profile edits were submitted{" "}
                <span className="font-medium">
                  {new Date(props.pendingReview.submittedAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
                . All profile edits are locked until your management makes a decision. Once reviewed, you&apos;ll be able to make changes and submit again.
              </div>
            </AlertBanner>
          </div>
        ) : null}

        {!props.pendingReview &&
        lastDecisionShown?.status === "APPROVED" &&
        !dismissedDecisionIds.has(lastDecisionShown.id) ? (
          <div className="mt-4">
            <AlertBanner
              tone="success"
              onDismiss={() =>
                setDismissedDecisionIds((prev) => {
                  const next = new Set(prev);
                  next.add(lastDecisionShown.id);
                  return next;
                })
              }
            >
              <div className="font-semibold">Changes approved</div>
              <div className="mt-0.5 text-[13px] opacity-90 leading-snug">
                Your profile changes were approved by your management
                {props.lastDecisionReview?.reviewedAt
                  ? ` on ${new Date(props.lastDecisionReview.reviewedAt).toLocaleDateString(undefined, {
                      dateStyle: "medium",
                    })}`
                  : ""}
                .
              </div>
            </AlertBanner>
          </div>
        ) : null}

        {!props.pendingReview &&
        lastDecisionShown?.status === "REJECTED" &&
        !dismissedDecisionIds.has(lastDecisionShown.id) ? (
          <div className="mt-4">
            <AlertBanner
              tone="error"
              onDismiss={() =>
                setDismissedDecisionIds((prev) => {
                  const next = new Set(prev);
                  next.add(lastDecisionShown.id);
                  return next;
                })
              }
            >
              <div className="font-semibold">Changes requested by management</div>
              <div className="mt-0.5 text-[13px] opacity-90 leading-snug">
                Your profile changes were rejected. Review the note below, make the requested updates, and submit again.
              </div>
            </AlertBanner>
            {props.lastDecisionReview?.rejectionComment ? (
              <div className="mt-2 rounded-2xl border border-red-200/70 bg-red-50/60 px-4 py-3 text-[13.5px] leading-relaxed text-red-900/90">
                <div className="text-[10px] font-semibold tracking-widest uppercase text-red-800/70 mb-1.5">
                  Management note
                </div>
                <div className="whitespace-pre-wrap break-words">{props.lastDecisionReview.rejectionComment}</div>
              </div>
            ) : (
              <div className="mt-2 rounded-2xl border border-black/10 bg-black/[0.02] px-4 py-3 text-[13px] text-black/55">
                No comment provided.
              </div>
            )}
          </div>
        ) : null}

        <div className="mt-10 sm:mt-14 flex flex-col">
          {/* Vitals (editorial, flowing, grouped) */}
          <section className="scroll-mt-24" aria-labelledby="section-vitals">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between pb-6 border-b border-[var(--color-border-soft)]">
              <div className="min-w-0">
                <div className="t-label text-[var(--color-stone)] mb-1">Profile</div>
                <h2 id="section-vitals" className="t-h2 text-[var(--color-ink)]">
                  Vitals
                </h2>
                <p className="mt-1.5 t-body text-[var(--color-graphite)] max-w-2xl">
                  Last updated {fmtDate(props.profile.updatedAt)}
                </p>
              </div>
              <div className="shrink-0 mt-2 sm:mt-0">
                {isReadOnly ? null : <SecondaryButton onClick={() => setEditVitals(true)}>Edit</SecondaryButton>}
              </div>
            </div>

            <div className="py-8 space-y-10">
              {/* Professional */}
              <div>
                <div className="mb-3 text-[11px] font-semibold tracking-[0.16em] uppercase text-[var(--color-graphite)] leading-none">
                  Professional
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 sm:gap-x-10">
                  <DataField label="Modeling experience" value={experienceLabelFromYears(props.profile.experienceYears)} />
                  <DataField
                    span={2}
                    label="Type of modeling"
                    value={props.profile.modelingTypes.length ? props.profile.modelingTypes.join(", ") : "—"}
                  />
                  <DataField
                    span={3}
                    label="Talents"
                    value={props.profile.talents.length ? props.profile.talents.join(", ") : "—"}
                  />
                </div>
              </div>

              {/* Physical */}
              <div>
                <div className="mb-3 text-[11px] font-semibold tracking-[0.16em] uppercase text-[var(--color-graphite)] leading-none">
                  Physical
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 sm:gap-x-10">
                  <DataField label="Height" value={formatHeight(props.profile.heightIn) ?? "—"} />
                  <DataField label="Weight" value={props.profile.weightLbs ? `${props.profile.weightLbs} lbs` : "—"} />
                  <DataField label="Skin tone" value={props.profile.skinTone ?? "—"} />
                  <DataField label="Eye color" value={props.profile.eyeColor ?? "—"} />
                  <DataField label="Shirt size" value={props.profile.shirtSize ?? "—"} />
                  <DataField label="Pants size" value={props.profile.pantsSize ?? "—"} />
                  <DataField label="Dress size" value={props.profile.dressSize ?? "—"} />
                  <DataField label="Shoe size" value={props.profile.shoeSize ? String(props.profile.shoeSize) : "—"} />
                </div>
              </div>

              {/* Distinguishing Features */}
              <div>
                <div className="mb-3 text-[11px] font-semibold tracking-[0.16em] uppercase text-[var(--color-graphite)] leading-none">
                  Distinguishing Features
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 sm:gap-x-10">
                  <DataField
                    label="Tattoos"
                    value={props.profile.tattoos === null ? "—" : props.profile.tattoos ? "Yes" : "No"}
                  />
                  <DataField span={2} label="Tattoo locations" value={props.profile.tattooLocations ?? "—"} />
                  <DataField
                    label="Piercings"
                    value={props.profile.piercings === null ? "—" : props.profile.piercings ? "Yes" : "No"}
                  />
                  <DataField span={2} label="Piercing locations" value={props.profile.piercingLocations ?? "—"} />
                  <DataField
                    label="Birthmarks"
                    value={props.profile.birthmarks === null ? "—" : props.profile.birthmarks ? "Yes" : "No"}
                  />
                  <DataField span={2} label="Birthmark locations" value={props.profile.birthmarkLocations ?? "—"} />
                </div>
              </div>
            </div>
          </section>

          {/* Basic Information (editorial flowing section) */}
          {visibleBasicInfoItems.length ? (
            <section
              aria-labelledby="section-basic"
              className="scroll-mt-24 pt-10 sm:pt-14 border-t border-[var(--color-border-soft)]"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between pb-6 border-b border-[var(--color-border-soft)]">
                <div className="min-w-0">
                  <div className="t-label text-[var(--color-stone)] mb-1">Profile</div>
                  <h2 id="section-basic" className="t-h2 text-[var(--color-ink)]">
                    Basic Information
                  </h2>
                  <p className="mt-1.5 t-body text-[var(--color-graphite)] max-w-2xl">
                    Last updated {fmtDate(props.profile.updatedAt)}
                  </p>
                </div>
                <div className="shrink-0 mt-2 sm:mt-0">
                  {isReadOnly ? null : <SecondaryButton onClick={() => setEditBasic(true)}>Edit</SecondaryButton>}
                </div>
              </div>
              <div className="py-8 grid grid-cols-1 sm:grid-cols-2 sm:gap-x-10 lg:gap-x-16">
                {visibleBasicInfoItems.map((item) => (
                  <DataField key={item.label} label={item.label} value={item.value} />
                ))}
              </div>
              {visibleAboutMe ? (
                <div className="pb-8 border-t border-[var(--color-border-soft)] pt-7">
                  <div className="t-label text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--color-stone)] leading-none">
                    ABOUT ME
                  </div>
                  <div className="mt-3.5 text-[14.5px] leading-[1.75] text-[var(--color-ink)] font-sans whitespace-pre-wrap break-words max-w-[72ch]">
                    {visibleAboutMe}
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          {/* Social Media Reach — platform tiles directly on canvas, no outer wrapper card */}
          <section
            aria-labelledby="section-social"
            className="scroll-mt-24 pt-10 sm:pt-14 border-t border-[var(--color-border-soft)]"
          >
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between pb-6 border-b border-[var(--color-border-soft)]">
              <div className="min-w-0">
                <div className="t-label text-[var(--color-stone)] mb-1">Audience</div>
                <h2 id="section-social" className="t-h2 text-[var(--color-ink)]">
                  Social Media Reach
                </h2>
                <p className="mt-1.5 t-body text-[var(--color-graphite)] max-w-2xl">
                  Last updated {fmtDate(props.profile.updatedAt)}
                </p>
              </div>
              <div className="shrink-0 mt-2 sm:mt-0">
                {isReadOnly ? null : <SecondaryButton onClick={() => setEditSocial(true)}>Edit</SecondaryButton>}
              </div>
            </div>

            <div className="py-8 grid grid-cols-1 gap-3 md:grid-cols-3">
              {props.socialLinks.map((l) => (
                <div key={l.platform} className="overflow-hidden rounded-[var(--radius-lg)] border border-mist bg-surface shadow-sm">
                  <div
                    className={[
                      "flex items-center gap-2 px-4 py-2.5 text-white",
                      platformStyles(l.platform).header,
                    ].join(" ")}
                  >
                    <PlatformIcon platform={l.platform} />
                    <div className="t-body font-semibold">{l.platform}</div>
                  </div>
                  <div className="px-4 py-3.5">
                    <div className="t-body font-medium text-ink">{l.handle ? `@${l.handle}` : "—"}</div>
                    <div className="mt-1 t-body-sm text-stone">
                      {l.followers !== null ? `${l.followers.toLocaleString()} followers` : "Followers —"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Gallery — controls sit flush on canvas; carousel inside Card surface */}
          <section
            aria-labelledby="section-gallery"
            className="scroll-mt-24 pt-10 sm:pt-14 border-t border-[var(--color-border-soft)]"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between pb-6 border-b border-[var(--color-border-soft)]">
              <div className="min-w-0">
                <div className="t-label text-[var(--color-stone)] mb-1">Portfolio</div>
                <h2 id="section-gallery" className="t-h2 text-[var(--color-ink)]">
                  Gallery
                </h2>
                <p className="mt-1.5 t-body font-numeric text-[var(--color-graphite)] max-w-2xl">
                  {isReadOnly
                    ? `${props.galleryItems.length}/${MAX_GALLERY_ITEMS} item${props.galleryItems.length === 1 ? "" : "s"}`
                    : `${galleryApprovedCount} live · ${galleryPendingCount} pending${galleryNeedsChangesCount ? ` · ${galleryNeedsChangesCount} needs changes` : ""}`}
                </p>
              </div>
              <div className="shrink-0 mt-1 sm:mt-0 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => scrollGalleryBy(-1)}
                  disabled={props.galleryItems.length <= 1}
                  aria-label="Scroll gallery left"
                  className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-[8px] border border-[var(--color-mist)] bg-[var(--color-surface)] text-[var(--color-ink)] transition hover:bg-[var(--color-surface-subtle)] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span aria-hidden className="text-[18px] leading-none -mt-0.5">‹</span>
                </button>
                <button
                  type="button"
                  onClick={() => scrollGalleryBy(1)}
                  disabled={props.galleryItems.length <= 1}
                  aria-label="Scroll gallery right"
                  className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-[8px] border border-[var(--color-mist)] bg-[var(--color-surface)] text-[var(--color-ink)] transition hover:bg-[var(--color-surface-subtle)] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span aria-hidden className="text-[18px] leading-none -mt-0.5">›</span>
                </button>
                {!isReadOnly ? (
                  <SecondaryButton
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={galleryBusy || activeGalleryCount >= MAX_GALLERY_ITEMS}
                  >
                    Add media
                  </SecondaryButton>
                ) : null}
              </div>
            </div>

            <div className="py-8">
              {!isReadOnly ? (
                <>
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept={GALLERY_FILE_INPUT_ACCEPT}
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = e.currentTarget.files;
                      uploadGalleryFiles(files);
                      e.currentTarget.value = "";
                    }}
                  />
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
                </>
              ) : null}

              <div className="relative mt-3 min-w-0">
                <div
                  ref={galleryCarouselRef}
                  className="no-scrollbar flex w-full min-w-0 max-w-full items-start gap-4 overflow-x-auto overscroll-x-contain scroll-smooth py-2 snap-x snap-mandatory cursor-grab active:cursor-grabbing"
                  style={{ touchAction: "pan-y" }}
                  onPointerDown={onGalleryPointerDown}
                  onPointerMove={onGalleryPointerMove}
                  onPointerUp={onGalleryPointerUp}
                  onPointerCancel={onGalleryPointerUp}
                  onWheel={onGalleryWheel}
                  onMouseEnter={() => {
                    galleryAutoScrollFlagsRef.current.hover = true;
                  }}
                  onMouseLeave={() => {
                    galleryAutoScrollFlagsRef.current.hover = false;
                  }}
                  onFocusCapture={() => {
                    galleryAutoScrollFlagsRef.current.focusWithin = true;
                  }}
                  onBlurCapture={(e) => {
                    const next = e.relatedTarget as Node | null;
                    if (!next || !e.currentTarget.contains(next)) {
                      galleryAutoScrollFlagsRef.current.focusWithin = false;
                    }
                  }}
                  onScroll={() => {
                    galleryAutoScrollFlagsRef.current.scrollPauseUntil = Date.now() + 1500;
                  }}
                >
                {props.galleryItems.map((p) => (
                  <div
                    key={p.id}
                    data-gallery-item-id={p.id}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openGalleryItem(p.id);
                      }
                    }}
                    className="group relative h-44 w-36 shrink-0 snap-center overflow-hidden rounded-[var(--radius-md)] border border-mist bg-surface transition-transform duration-[var(--duration-base)] ease-[var(--ease-out)] hover:-translate-y-1 hover:shadow-raised focus:outline-none focus:ring-2 focus:ring-brand-light focus:ring-offset-2 focus:ring-offset-bg"
                  >
                    {p.kind === "VIDEO" ? (
                      <>
                        <video
                          src={`${galleryRouteBase}/${p.id}?v=${encodeURIComponent(p.createdAt)}`}
                          className="h-full w-full object-cover bg-black"
                          muted
                          playsInline
                          preload="metadata"
                        />
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                          <div className="rounded-full bg-black/50 px-3 py-2 text-xs font-semibold text-white">Play</div>
                        </div>
                      </>
                    ) : (
                      <Image
                        alt={p.fileName ?? "Gallery photo"}
                        src={`${galleryRouteBase}/${p.id}?v=${encodeURIComponent(p.createdAt)}`}
                        fill
                        sizes="144px"
                        className="object-cover"
                        unoptimized
                      />
                    )}
                    {!isReadOnly && p.reviewStatus !== "APPROVED" ? (
                      <div
                        className={[
                          "pointer-events-none absolute left-2 top-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                          mediaReviewMeta(p.reviewStatus).className,
                        ].join(" ")}
                      >
                        {mediaReviewMeta(p.reviewStatus).label}
                      </div>
                    ) : null}
                    {!isReadOnly ? (
                      <button
                        type="button"
                        onClick={() => deleteGalleryItem(p.id)}
                        disabled={galleryBusy}
                        data-gallery-ignore-click="true"
                        className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-1 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100 disabled:opacity-40"
                        aria-label={`Remove ${p.kind === "VIDEO" ? "video" : "photo"}`}
                      >
                        ✕
                      </button>
                    ) : null}
                  </div>
                ))}

                {!isReadOnly && activeGalleryCount < MAX_GALLERY_ITEMS ? (
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={galleryBusy}
                    className="flex h-44 w-36 shrink-0 snap-center items-center justify-center rounded-[var(--radius-md)] border border-dashed border-mist bg-surface-subtle text-[13px] font-medium text-stone transition hover:bg-surface disabled:opacity-50"
                  >
                    + Add
                  </button>
                ) : null}
                </div>
              </div>
              {!isReadOnly ? (
                <div className="mt-3 text-[12px] leading-5 text-[var(--color-stone)]">
                  Photos up to 10 MB. Videos up to 100 MB. Max {MAX_GALLERY_ITEMS} gallery items.
                </div>
              ) : null}
              {!isReadOnly && (galleryPendingCount || galleryNeedsChangesCount) ? (
                <div className="mt-4 grid gap-2">
                  {props.galleryItems
                    .filter((item) => item.reviewStatus !== "APPROVED")
                    .map((item) => (
                      <div
                        key={`${item.id}-review`}
                        className={[
                          "rounded-2xl border px-4 py-3 text-sm",
                          mediaReviewMeta(item.reviewStatus).className,
                        ].join(" ")}
                      >
                        <div className="font-semibold">
                          {item.fileName ?? `${item.kind === "VIDEO" ? "Video" : "Photo"}`} · {mediaReviewMeta(item.reviewStatus).label}
                        </div>
                        <div className="mt-1 text-current/90">
                          {item.reviewStatus === "PENDING"
                            ? `This ${item.kind === "VIDEO" ? "video" : "photo"} is hidden from management until an admin approves it.`
                            : item.reviewNotes || `Please replace this ${item.kind === "VIDEO" ? "video" : "photo"} and upload a new version.`}
                        </div>
                      </div>
                    ))}
                </div>
              ) : null}
            </div>
          </section>

          {/* Experience & Certifications (clean row/list treatment, not cards) */}
          <section
            aria-labelledby="section-experience"
            className="scroll-mt-24 pt-10 sm:pt-14 border-t border-[var(--color-border-soft)]"
          >
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between pb-6 border-b border-[var(--color-border-soft)]">
              <div className="min-w-0">
                <div className="t-label text-[var(--color-stone)] mb-1">Profile</div>
                <h2 id="section-experience" className="t-h2 text-[var(--color-ink)]">
                  Experience &amp; Certifications
                </h2>
              </div>
              <div className="shrink-0 mt-2 sm:mt-0">
                {isReadOnly ? null : (
                  <SecondaryButton
                    type="button"
                    onClick={() =>
                      setEditExperience((p) => {
                        const next = !p;
                        if (!next) setEditExperienceItem(null);
                        return next;
                      })
                    }
                  >
                    {editExperience ? "Done" : "Add / Edit"}
                  </SecondaryButton>
                )}
              </div>
            </div>

            {!isReadOnly && editExperience ? (
              <div className="pt-6 grid gap-3">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <label className="rounded-2xl border border-black/10 px-4 py-3">
                    <div className="text-[10px] font-semibold tracking-widest text-black/40">
                      TYPE
                    </div>
                    <select
                      value={experienceKind}
                      onChange={(e) => setExperienceKind(e.target.value as "PROJECT" | "CERTIFICATION" | "TITLE")}
                      className="mt-1 w-full bg-transparent text-sm font-medium outline-none text-black/80"
                      disabled={experienceBusy}
                    >
                      <option value="TITLE">Title</option>
                      <option value="CERTIFICATION">Certification</option>
                      <option value="PROJECT">Project</option>
                    </select>
                  </label>
                  <label className="rounded-2xl border border-black/10 px-4 py-3 md:col-span-2">
                    <div className="text-[10px] font-semibold tracking-widest text-black/40">
                      TITLE
                    </div>
                    <input
                      className="mt-1 w-full bg-transparent text-sm font-medium outline-none text-black/80 placeholder:text-black/38"
                      value={experienceTitle}
                      onChange={(e) => setExperienceTitle(e.target.value)}
                      placeholder="e.g., Product Photoshoot / Miss Universe Taguig 2025"
                      disabled={experienceBusy}
                    />
                  </label>
                  <label className="rounded-2xl border border-black/10 px-4 py-3">
                    <div className="text-[10px] font-semibold tracking-widest text-black/40">
                      WHEN
                    </div>
                    <input
                      className="mt-1 w-full bg-transparent text-sm font-medium outline-none text-black/80 placeholder:text-black/38"
                      value={experienceWhen}
                      onChange={(e) => setExperienceWhen(e.target.value)}
                      placeholder="e.g., May 2025"
                      disabled={experienceBusy}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <label className="rounded-2xl border border-black/10 px-4 py-3 md:col-span-3">
                    <div className="text-[10px] font-semibold tracking-widest text-black/40">
                      ROLE (OPTIONAL)
                    </div>
                    <input
                      className="mt-1 w-full bg-transparent text-sm font-medium outline-none text-black/80 placeholder:text-black/38"
                      value={experienceRole}
                      onChange={(e) => setExperienceRole(e.target.value)}
                      placeholder="e.g., Model, Host, Brand Ambassador"
                      disabled={experienceBusy}
                    />
                  </label>
                  <div className="flex items-end justify-end">
                    <PrimaryButton onClick={addExperienceItem} disabled={experienceBusy || !experienceTitle.trim()} className="w-full md:w-auto">
                      {experienceBusy ? "Saving..." : "Add"}
                    </PrimaryButton>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="pt-8">
              {experienceItemsDraft.map((x) => {
                const meta = [x.role, x.when].filter(Boolean).join(" · ");
                return (
                  <div
                    key={x.id}
                    className="flex items-start justify-between gap-4 py-5 border-b border-[var(--color-border-soft)] last:border-b-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
                        <div className="min-w-0 truncate text-[15px] leading-6 font-semibold text-[var(--color-ink)]">
                          {x.title}
                        </div>
                        <Badge>
                          {x.kind === "PROJECT" ? "Project" : x.kind === "TITLE" ? "Title" : "Certification"}
                        </Badge>
                      </div>
                      <div className="mt-1.5 text-[13.5px] leading-5 text-[var(--color-graphite)]">
                        {meta || `Added ${fmtDate(x.createdAt)}`}
                      </div>
                    </div>
                    {!isReadOnly && editExperience ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEditExperienceItem(x)}
                          disabled={experienceBusy}
                          className="h-8 px-2.5 rounded-[var(--radius-sm)] border border-mist bg-surface text-[12px] font-semibold text-graphite hover:bg-surface-subtle disabled:opacity-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteExperienceItem(x.id)}
                          disabled={experienceBusy}
                          className="h-8 px-2.5 rounded-[var(--radius-sm)] border border-mist bg-surface text-[12px] font-semibold text-error hover:bg-error-bg/40 disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}

              {!experienceItemsDraft.length ? (
                <div className="pt-10 pb-4 text-center t-body text-stone">
                  No items yet.
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>

      {galleryActiveIndex >= 0 ? (
        <div
          data-role-glass-overlay="true"
          className="fixed inset-0 z-50 bg-[rgba(23,25,24,0.92)]"
          onClick={(e) => {
            if (e.target === e.currentTarget) setGalleryActiveId(null);
          }}
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/70 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/70 to-transparent" />

          <div className="absolute left-4 top-4 text-sm font-medium text-white/85">
            {props.galleryItems.length ? `${galleryActiveIndex + 1} of ${props.galleryItems.length}` : null}
          </div>

          <button
            type="button"
            onClick={() => setGalleryActiveId(null)}
            className="absolute right-4 top-4 z-[60] inline-flex h-[44px] w-[44px] items-center justify-center rounded-[var(--radius-md)] bg-white/10 text-white ring-1 ring-white/15 backdrop-blur-0 transition hover:bg-white/18"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          <div className="absolute inset-0 flex items-center justify-center px-4 py-16 sm:px-8">
            <div className="relative flex h-full w-full max-w-6xl items-center justify-center">
              <button
                type="button"
                onClick={showPreviousGalleryItem}
                disabled={!canViewPreviousGalleryItem}
                className="absolute left-0 z-20 inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/45 text-3xl font-light text-white shadow-lg transition hover:bg-black/60 disabled:opacity-35 sm:left-3"
                aria-label="Previous item"
              >
                ‹
              </button>

              <div className="relative mx-14 flex h-full max-h-[min(82vh,900px)] w-full max-w-5xl items-center justify-center overflow-hidden rounded-3xl border border-white/12 bg-black/30 shadow-[0_24px_80px_rgba(0,0,0,0.4)]">
                {galleryActiveItem?.kind === "VIDEO" ? (
                  <video
                    src={`${galleryRouteBase}/${galleryActiveItem.id}?v=${encodeURIComponent(galleryActiveItem.createdAt)}`}
                    className="h-full w-full object-contain"
                    controls
                    autoPlay
                    playsInline
                  />
                ) : galleryActiveItem ? (
                  <div className="relative h-full w-full">
                    <Image
                      alt={galleryActiveItem.fileName ?? "Gallery photo"}
                      src={`${galleryRouteBase}/${galleryActiveItem.id}?v=${encodeURIComponent(galleryActiveItem.createdAt)}`}
                      fill
                      sizes="100vw"
                      className="object-contain"
                      unoptimized
                      priority
                    />
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                onClick={showNextGalleryItem}
                disabled={!canViewNextGalleryItem}
                className="absolute right-0 z-20 inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/45 text-3xl font-light text-white shadow-lg transition hover:bg-black/60 disabled:opacity-35 sm:right-3"
                aria-label="Next item"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <Modal
        open={Boolean(editExperienceItem)}
        title="Edit Experience"
        subtitle="Update your title, certification, or project."
        onClose={() => {
          if (experienceBusy) return;
          setEditExperienceItem(null);
        }}
        widthClassName="max-w-3xl"
      >
        <div className="grid gap-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <label className="rounded-2xl border border-black/10 px-4 py-3">
              <div className="text-[10px] font-semibold tracking-widest text-black/40">TYPE</div>
              <select
                value={editExperienceKind}
                onChange={(e) => setEditExperienceKind(e.target.value as "PROJECT" | "CERTIFICATION" | "TITLE")}
                className="mt-1 w-full bg-transparent text-sm font-medium text-black/80 outline-none"
                disabled={experienceBusy}
              >
                <option value="TITLE">Title</option>
                <option value="CERTIFICATION">Certification</option>
                <option value="PROJECT">Project</option>
              </select>
            </label>
            <label className="rounded-2xl border border-black/10 px-4 py-3 md:col-span-2">
              <div className="text-[10px] font-semibold tracking-widest text-black/40">TITLE</div>
              <input
                className="mt-1 w-full bg-transparent text-sm font-medium text-black/80 outline-none"
                value={editExperienceTitle}
                onChange={(e) => setEditExperienceTitle(e.target.value)}
                placeholder="e.g., Product Photoshoot / Miss Universe Taguig 2025"
                disabled={experienceBusy}
              />
            </label>
            <label className="rounded-2xl border border-black/10 px-4 py-3">
              <div className="text-[10px] font-semibold tracking-widest text-black/40">WHEN</div>
              <input
                className="mt-1 w-full bg-transparent text-sm font-medium text-black/80 outline-none"
                value={editExperienceWhen}
                onChange={(e) => setEditExperienceWhen(e.target.value)}
                placeholder="e.g., May 2025"
                disabled={experienceBusy}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <label className="rounded-2xl border border-black/10 px-4 py-3 md:col-span-4">
              <div className="text-[10px] font-semibold tracking-widest text-black/40">ROLE (OPTIONAL)</div>
              <input
                className="mt-1 w-full bg-transparent text-sm font-medium text-black/80 outline-none"
                value={editExperienceRole}
                onChange={(e) => setEditExperienceRole(e.target.value)}
                placeholder="e.g., Model, Host, Brand Ambassador"
                disabled={experienceBusy}
              />
            </label>
          </div>

          <div className="mt-2 flex items-center justify-end gap-2">
            <SecondaryButton type="button" onClick={() => setEditExperienceItem(null)} disabled={experienceBusy}>
              Cancel
            </SecondaryButton>
            <PrimaryButton
              type="button"
              onClick={updateExperienceItem}
              disabled={experienceBusy || !editExperienceTitle.trim()}
            >
              {experienceBusy ? "Saving..." : "Save"}
            </PrimaryButton>
          </div>
        </div>
      </Modal>

      <Modal
        open={showMeasurements}
        title="Measurements"
        subtitle={`All measurements in ${measurementsForm.unit === "in" ? "inches" : "cm"}`}
        onClose={() => setShowMeasurements(false)}
        widthClassName="max-w-2xl"
      >
        <div className="mb-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-black/60">Update your measurements anytime.</div>
          <select
            value={measurementsForm.unit}
            onChange={(e) => {
              const nextUnit = e.target.value as "in" | "cm";
              setMeasurementsForm((p) => convertMeasurementsForm(p, nextUnit));
            }}
            className="h-11 rounded-[var(--radius-md)] border-mist bg-surface px-3 text-sm text-graphite outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
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
            <label
              key={f.key}
              className="rounded-2xl px-4 py-3 border border-black/10 bg-white"
            >
              <div className="text-[10px] font-semibold tracking-widest text-black/45">{f.label}</div>
              <input
                inputMode="decimal"
                className="mt-1 w-full bg-transparent text-lg font-medium outline-none placeholder:text-black/38 text-black/80"
                value={(measurementsForm as unknown as Record<string, string | number>)[f.key] as string | number}
                onChange={isReadOnly ? undefined : (e) => setMeasurementsForm((p) => ({ ...p, [f.key]: e.target.value }))}
                readOnly={isReadOnly}
                placeholder="—"
              />
            </label>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <SecondaryButton onClick={() => setShowMeasurements(false)} disabled={saving}>
            {isReadOnly ? "Close" : "Cancel"}
          </SecondaryButton>
          {!isReadOnly ? (
            <PrimaryButton onClick={saveMeasurements} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </PrimaryButton>
          ) : null}
        </div>
      </Modal>

      <Modal
        open={showSetcard}
        title="Model Setcard"
        subtitle={props.profile.displayName}
        onClose={() => setShowSetcard(false)}
        widthClassName="max-w-5xl"
      >
        {props.setcard ? (
          <div className="grid gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mt-0.5 text-xs text-stone">Uploaded {fmtDate(props.setcard.createdAt)}</div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <a
                  href={`${setcardRouteBase}/${props.setcard.id}?download=1`}
                  className="h-10 inline-flex w-full items-center justify-center rounded-[var(--radius-md)] border border-mist bg-surface px-4 text-sm font-medium text-graphite hover:bg-surface-subtle sm:w-auto"
                >
                  Download
                </a>
                <a
                  href={`${setcardRouteBase}/${props.setcard.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="h-10 inline-flex w-full items-center justify-center rounded-[var(--radius-md)] bg-brand px-4 text-sm font-medium text-white sm:w-auto"
                >
                  Open in new tab
                </a>
              </div>
            </div>

            {props.setcard.mimeType.toLowerCase().includes("pdf") ? (
              <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
                <iframe
                  title="Setcard"
                  src={`${setcardRouteBase}/${props.setcard.id}#view=FitH`}
                  className="h-[72vh] w-full"
                />
              </div>
            ) : (
              <div className="relative h-[72vh] w-full overflow-hidden rounded-2xl border border-black/10 bg-white">
                <Image
                  alt="Setcard"
                  src={`${setcardRouteBase}/${props.setcard.id}`}
                  fill
                  sizes="(min-width: 1024px) 960px, 100vw"
                  className="object-contain"
                  unoptimized
                />
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-black/5 bg-white p-10 text-center">
            <div className="text-sm font-semibold text-black/70">No setcard uploaded yet</div>
            <div className="mt-1 text-sm text-black/50">Your admin will upload your setcard.</div>
          </div>
        )}
      </Modal>

      <Modal
        open={showOfferModal}
        title="Send Offer"
        subtitle={props.profile.displayName}
        onClose={() => setShowOfferModal(false)}
        widthClassName="max-w-2xl"
      >
        {offerFeedback ? (
          <div
            className={[
              "mb-4 rounded-2xl border px-4 py-3 text-sm",
              offerFeedback.kind === "success"
                ? "border-success/30 bg-success-bg/70 text-success-fg"
                : "border-red-200 bg-red-50 text-red-900",
            ].join(" ")}
          >
            {offerFeedback.message}
          </div>
        ) : null}
        <div className="grid grid-cols-1 gap-3">
          <label>
            <div className="text-xs font-semibold text-white/58">Title</div>
            <input
              className="role-glass-input mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm text-white placeholder:text-white/55 outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
              style={LIGHT_GLASS_FIELD_STYLE}
              value={offerTitle}
              onChange={(e) => setOfferTitle(e.target.value)}
              placeholder="Commercial shoot - May 20"
            />
          </label>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="md:col-span-1">
              <div className="text-xs font-semibold text-white/58">Date</div>
              <input
                type="date"
                className="role-glass-input mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm text-white placeholder:text-white/55 outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
                style={LIGHT_GLASS_FIELD_STYLE}
                value={offerDate}
                onChange={(e) => setOfferDate(e.target.value)}
              />
            </label>
            <label className="md:col-span-1">
              <div className="text-xs font-semibold text-white/58">Start time</div>
              <input
                type="time"
                className="role-glass-input mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm text-white placeholder:text-white/55 outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
                style={LIGHT_GLASS_FIELD_STYLE}
                value={offerStartTime}
                onChange={(e) => setOfferStartTime(e.target.value)}
              />
            </label>
            <label className="md:col-span-1">
              <div className="text-xs font-semibold text-white/58">End time</div>
              <input
                type="time"
                className="role-glass-input mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm text-white placeholder:text-white/55 outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
                style={LIGHT_GLASS_FIELD_STYLE}
                value={offerEndTime}
                onChange={(e) => setOfferEndTime(e.target.value)}
              />
            </label>
          </div>

          <label>
            <div className="text-xs font-semibold text-white/58">Amount (PHP)</div>
            <div className="mt-1 flex overflow-hidden rounded-xl border border-black/10 bg-white focus-within:border-emerald-700">
              <div className="flex items-center px-3 text-sm font-semibold text-black/50">₱</div>
              <input
                inputMode="numeric"
                  className="w-full px-3 py-2 text-sm text-black/80 placeholder:text-black/38 outline-none"
                value={offerAmountPhp}
                onChange={(e) => setOfferAmountPhp(e.target.value)}
                placeholder="10000"
              />
            </div>
          </label>

          <label className="flex items-center gap-2 text-sm text-white/80">
            <input
              type="checkbox"
              checked={offerTransportAllowance}
              onChange={(e) => setOfferTransportAllowance(e.target.checked)}
            />
            Add transportation allowance
          </label>

          <label>
            <div className="text-xs font-semibold text-white/58">Project type</div>
            <select
              className="role-glass-input mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-black/80 outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
              value={offerProjectType}
              onChange={(e) => setOfferProjectType(e.target.value as OfferProjectType)}
            >
              <option value="PHOTO_SHOOT" style={DARK_SELECT_OPTION_STYLE}>Photoshoot</option>
              <option value="VIDEO_SHOOT" style={DARK_SELECT_OPTION_STYLE}>Video shoot</option>
              <option value="PHOTO_VIDEO_SHOOT" style={DARK_SELECT_OPTION_STYLE}>Photo and video shoot</option>
              <option value="PERFORMANCE" style={DARK_SELECT_OPTION_STYLE}>Performance</option>
              <option value="HOSTING" style={DARK_SELECT_OPTION_STYLE}>Hosting</option>
              <option value="OTHER" style={DARK_SELECT_OPTION_STYLE}>Other</option>
            </select>
          </label>
          <label>
            <div className="text-xs font-semibold text-white/58">Message</div>
            <textarea
              className="role-glass-input mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm text-white placeholder:text-white/55 outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
              style={LIGHT_GLASS_FIELD_STYLE}
              value={offerMessage}
              onChange={(e) => setOfferMessage(e.target.value)}
              rows={5}
              placeholder="Shoot details, call time, location, usage, etc."
            />
          </label>
        </div>
        <div className="mt-4 rounded-[var(--radius-lg)] border-mist bg-surface-subtle px-4 py-3 text-sm text-stone">
          Note: Admin has visibility on this offer and must approve it before the talent receives it.
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <SecondaryButton onClick={() => setShowOfferModal(false)} disabled={offerSending}>
            Cancel
          </SecondaryButton>
          <PrimaryButton onClick={sendOffer} disabled={offerSending}>
            {offerSending ? "Sending..." : "Send"}
          </PrimaryButton>
        </div>
      </Modal>

      {!isReadOnly ? (
        <AvatarCropperModal
          open={editPhoto}
          imageFile={photoFile}
          title="Edit Profile Photo"
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
            const res = await fetch("/api/talent/profile/avatar", { method: "POST", body: form });
            if (!res.ok) {
              const msg = await res.text().catch(() => "");
              window.alert(msg || "Upload failed.");
              throw new Error(msg || "Upload failed.");
            }
            router.refresh();
          }}
        />
      ) : null}

      <Modal
        open={editVitals}
        title="Edit Vitals"
        onClose={() => setEditVitals(false)}
        widthClassName="max-w-3xl"
      >
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
            <div className="text-xs font-semibold text-black/50">Weight (lbs)</div>
            <select
              className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
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
        open={editBasic}
        title="Edit Basic Information"
        onClose={() => setEditBasic(false)}
        widthClassName="max-w-3xl"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block">
            <div className="text-xs font-semibold text-black/50">Display name</div>
            <input
              className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
              value={basicForm.displayName}
              onChange={(e) => setBasicForm((p) => ({ ...p, displayName: e.target.value }))}
            />
          </label>
          <label className="block">
            <div className="text-xs font-semibold text-black/50">Alias</div>
            <input
              className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
              value={basicForm.alias}
              onChange={(e) => setBasicForm((p) => ({ ...p, alias: e.target.value }))}
            />
          </label>
          <label className="block">
            <div className="text-xs font-semibold text-black/50">Date of birth</div>
            <input
              type="date"
              className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
              value={basicForm.dateOfBirth}
              onChange={(e) => setBasicForm((p) => ({ ...p, dateOfBirth: e.target.value }))}
            />
          </label>
          <label className="block">
            <div className="text-xs font-semibold text-black/50">Mobile number</div>
            <input
              className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
              value={basicForm.phoneNumber}
              onChange={(e) => setBasicForm((p) => ({ ...p, phoneNumber: e.target.value }))}
            />
          </label>
          <label className="block">
            <div className="text-xs font-semibold text-black/50">City</div>
            <input
              className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
              value={basicForm.locationCity}
              onChange={(e) => setBasicForm((p) => ({ ...p, locationCity: e.target.value }))}
            />
          </label>
          <label className="block">
            <div className="text-xs font-semibold text-black/50">Country</div>
            <input
              className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
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
          <label className="block">
            <div className="text-xs font-semibold text-black/50">College course</div>
            <input
              className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
              value={basicForm.collegeCourse}
              onChange={(e) => setBasicForm((p) => ({ ...p, collegeCourse: e.target.value }))}
            />
          </label>
          <label className="block">
            <div className="text-xs font-semibold text-black/50">Nationality</div>
            <input
              className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
              value={basicForm.nationality}
              onChange={(e) => setBasicForm((p) => ({ ...p, nationality: e.target.value }))}
            />
          </label>
          <label className="block md:col-span-2">
            <div className="text-xs font-semibold text-black/50">About me</div>
            <textarea
              rows={6}
              className="mt-1 w-full resize-y rounded-xl border border-black/10 px-3 py-2 text-sm leading-relaxed outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
              placeholder="Introduce yourself — background, niche, passions, what you're looking for, etc."
              value={basicForm.aboutMe}
              onChange={(e) => setBasicForm((p) => ({ ...p, aboutMe: e.target.value }))}
            />
            <div className="mt-1 text-[10px] text-black/40">
              {basicForm.aboutMe.length} / 4000 characters
            </div>
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

      <Modal
        open={editSocial}
        title="Edit Social Media Reach"
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
                <div className="text-sm font-semibold text-black/80">
                  {l.platform}
                </div>
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
                    placeholder="username"
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
                    placeholder="0"
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
                    placeholder="https://"
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
        open={confirmSubmitModal}
        title="Submit profile changes for review"
        onClose={() => (reviewSubmitting ? null : setConfirmSubmitModal(false))}
        widthClassName="max-w-xl"
      >
        <div className="space-y-3 text-[14px] leading-relaxed text-black/75">
          <p>
            You&apos;re submitting changes to the following categories. Once submitted, you won&apos;t be able to
            edit your profile until your management has reviewed it.
          </p>
          <div className="rounded-2xl border border-black/10 bg-black/[0.02] px-4 py-3">
            <div className="text-[10px] font-semibold tracking-[0.16em] uppercase text-black/40 mb-2">
              Changed categories
            </div>
            <div className="flex flex-wrap gap-2">
              {changedCategories.map((c) => (
                <span
                  key={c.key}
                  className="inline-flex items-center gap-1.5 rounded-full bg-black px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white"
                >
                  <span className="opacity-70">{c.code}</span>
                  <span>{c.label}</span>
                </span>
              ))}
            </div>
          </div>
          <p className="text-[13px] text-black/60">
            Gallery photos and media are reviewed separately by platform admins and are not included here.
          </p>
        </div>
        <div className="mt-6 flex items-center justify-end gap-2">
          <SecondaryButton
            onClick={() => setConfirmSubmitModal(false)}
            disabled={reviewSubmitting}
          >
            Cancel
          </SecondaryButton>
          <PrimaryButton
            onClick={() => {
              void submitForReview();
            }}
            disabled={reviewSubmitting}
          >
            {reviewSubmitting ? "Submitting..." : "Confirm submission"}
          </PrimaryButton>
        </div>
      </Modal>

      {hasUnsavedChanges && !isReviewPending && !isReadOnly ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-col items-stretch gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-3.5">
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <div className="text-[11px] font-semibold tracking-[0.16em] uppercase text-black/45 shrink-0">
                Unsubmitted changes
              </div>
              <div className="flex min-w-0 flex-wrap gap-1.5">
                {changedCategories.map((c) => (
                  <span
                    key={c.key}
                    className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-black/[0.03] px-2 py-0.5 text-[11px] font-semibold text-black/70"
                  >
                    <span className="opacity-60">{c.code}</span>
                    <span>{c.label}</span>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex shrink-0 items-center justify-end gap-2">
              <SecondaryButton
                onClick={discardReviewChanges}
                disabled={reviewSubmitting}
                className="h-9 px-3.5 text-[12.5px]"
              >
                Discard changes
              </SecondaryButton>
              <PrimaryButton
                onClick={() => setConfirmSubmitModal(true)}
                disabled={reviewSubmitting}
                className="h-9 px-3.5 text-[12.5px]"
              >
                Submit for review
              </PrimaryButton>
            </div>
          </div>
        </div>
      ) : null}

      {hasUnsavedChanges && !isReviewPending && !isReadOnly ? (
        <div aria-hidden="true" className="h-20 sm:h-16" />
      ) : null}
    </div>
  );
}
