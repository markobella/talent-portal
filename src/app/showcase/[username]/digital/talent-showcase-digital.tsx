"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

export type ShowcaseThemeKey =
  | "classic"
  | "noir"
  | "stone"
  | "deepink"
  | "clay"
  | "burgundy";

const SHOWCASE_THEMES: { key: ShowcaseThemeKey; label: string }[] = [
  { key: "classic", label: "Classic" },
  { key: "noir", label: "Noir Editorial" },
  { key: "stone", label: "Stone & Ink" },
  { key: "deepink", label: "Deep Ink Blue" },
  { key: "clay", label: "Clay & Terracotta" },
  { key: "burgundy", label: "Cream & Burgundy" },
];

const THEME_VARS: Record<ShowcaseThemeKey, Record<string, string>> = {
  classic: {
    "--color-bg": "#EFE9DD",
    "--color-bg-alt": "#E7DFC9",
    "--color-bg-hero": "#E7DFC9",
    "--color-bg-tile": "#E2D8BF",
    "--color-bg-focus": "#EBE2CA",
    "--color-ink": "#17140F",
    "--color-ink-2": "#2E2A24",
    "--color-ink-3": "#4A4A44",
    "--color-muted-1": "#6D6152",
    "--color-muted-2": "#8B7A5A",
    "--color-accent": "#6B1E23",
    "--color-data": "#9C8552",
    "--color-border-1": "#D9D1BC",
    "--color-border-2": "#C9BFA6",
    "--color-dotted": "#B8AE94",
    "--color-compcard-bg": "#14110D",
    "--color-compcard-hover": "#1C1813",
    "--color-ink-strong": "#14110D",
    "--color-ink-strong-alpha": "rgba(20, 17, 13, 0.3)",
    "--color-timeline-dot-halo": "rgba(231, 223, 201, 1)",
    "--color-data-halo": "rgba(156, 133, 82, 0.18)",
    "--color-scrim-hero-mid": "rgba(239, 233, 221, 0.85)",
    "--color-scrim-hero-end": "rgba(239, 233, 221, 1)",
    "--color-rail-fill": "rgba(201, 191, 166, 0.6)",
    "--color-cursor-bg": "rgba(20, 17, 13, 0.82)",
    "--color-cursor-ink": "#F3EFE8",
    "--color-play-icon-bg": "rgba(0, 0, 0, 0.45)",
    "--color-play-icon-bg-hover": "rgba(0, 0, 0, 0.6)",
    "--color-lightbox-scrim": "rgba(0, 0, 0, 0.92)",
    "--color-moss": "#24584E",
  },
  noir: {
    "--color-bg": "#141210",
    "--color-bg-alt": "#1C1A17",
    "--color-bg-hero": "#1C1A17",
    "--color-bg-tile": "#1F1D1A",
    "--color-bg-focus": "#24221F",
    "--color-ink": "#F3EFE8",
    "--color-ink-2": "#E5DED2",
    "--color-ink-3": "#C8C0B2",
    "--color-muted-1": "#B0A89A",
    "--color-muted-2": "#9C9488",
    "--color-accent": "#C5A059",
    "--color-data": "#9C9488",
    "--color-border-1": "#33302B",
    "--color-border-2": "#3F3B35",
    "--color-dotted": "#4A4741",
    "--color-compcard-bg": "#F3EFE8",
    "--color-compcard-hover": "#E5DED2",
    "--color-ink-strong": "#0C0B0A",
    "--color-ink-strong-alpha": "rgba(243, 239, 232, 0.3)",
    "--color-timeline-dot-halo": "rgba(28, 26, 23, 1)",
    "--color-data-halo": "rgba(197, 160, 89, 0.18)",
    "--color-scrim-hero-mid": "rgba(20, 18, 16, 0.7)",
    "--color-scrim-hero-end": "rgba(20, 18, 16, 1)",
    "--color-rail-fill": "rgba(63, 59, 53, 0.8)",
    "--color-cursor-bg": "rgba(243, 239, 232, 0.88)",
    "--color-cursor-ink": "#141210",
    "--color-play-icon-bg": "rgba(243, 239, 232, 0.35)",
    "--color-play-icon-bg-hover": "rgba(243, 239, 232, 0.55)",
    "--color-lightbox-scrim": "rgba(0, 0, 0, 0.94)",
    "--color-moss": "#1F3A5F",
  },
  stone: {
    "--color-bg": "#EDEBE6",
    "--color-bg-alt": "#E2DFD8",
    "--color-bg-hero": "#E2DFD8",
    "--color-bg-tile": "#DBD7CF",
    "--color-bg-focus": "#E6E3DB",
    "--color-ink": "#1C1C1C",
    "--color-ink-2": "#2C2C2A",
    "--color-ink-3": "#484844",
    "--color-muted-1": "#6C6C66",
    "--color-muted-2": "#868278",
    "--color-accent": "#3A3A34",
    "--color-data": "#9C9488",
    "--color-border-1": "#D3CFC5",
    "--color-border-2": "#C4C0B5",
    "--color-dotted": "#B4B0A4",
    "--color-compcard-bg": "#1C1C1C",
    "--color-compcard-hover": "#2A2A27",
    "--color-ink-strong": "#10100E",
    "--color-ink-strong-alpha": "rgba(28, 28, 28, 0.3)",
    "--color-timeline-dot-halo": "rgba(226, 223, 216, 1)",
    "--color-data-halo": "rgba(156, 148, 136, 0.18)",
    "--color-scrim-hero-mid": "rgba(237, 235, 230, 0.85)",
    "--color-scrim-hero-end": "rgba(237, 235, 230, 1)",
    "--color-rail-fill": "rgba(196, 192, 181, 0.7)",
    "--color-cursor-bg": "rgba(28, 28, 28, 0.82)",
    "--color-cursor-ink": "#F3EFE8",
    "--color-play-icon-bg": "rgba(0, 0, 0, 0.45)",
    "--color-play-icon-bg-hover": "rgba(0, 0, 0, 0.6)",
    "--color-lightbox-scrim": "rgba(0, 0, 0, 0.92)",
    "--color-moss": "#3A3A34",
  },
  deepink: {
    "--color-bg": "#EFE9DD",
    "--color-bg-alt": "#E5DECF",
    "--color-bg-hero": "#E5DECF",
    "--color-bg-tile": "#DDD4C3",
    "--color-bg-focus": "#E9E2D1",
    "--color-ink": "#16202E",
    "--color-ink-2": "#232E3E",
    "--color-ink-3": "#3E4959",
    "--color-muted-1": "#555F6E",
    "--color-muted-2": "#74776A",
    "--color-accent": "#1F3A5F",
    "--color-data": "#8B8368",
    "--color-border-1": "#D6CDBC",
    "--color-border-2": "#C4B9A4",
    "--color-dotted": "#B0A692",
    "--color-compcard-bg": "#16202E",
    "--color-compcard-hover": "#1E2B3D",
    "--color-ink-strong": "#0E1620",
    "--color-ink-strong-alpha": "rgba(22, 32, 46, 0.3)",
    "--color-timeline-dot-halo": "rgba(229, 222, 207, 1)",
    "--color-data-halo": "rgba(139, 131, 104, 0.18)",
    "--color-scrim-hero-mid": "rgba(239, 233, 221, 0.85)",
    "--color-scrim-hero-end": "rgba(239, 233, 221, 1)",
    "--color-rail-fill": "rgba(196, 185, 164, 0.7)",
    "--color-cursor-bg": "rgba(22, 32, 46, 0.84)",
    "--color-cursor-ink": "#F3EFE8",
    "--color-play-icon-bg": "rgba(0, 0, 0, 0.45)",
    "--color-play-icon-bg-hover": "rgba(0, 0, 0, 0.6)",
    "--color-lightbox-scrim": "rgba(0, 0, 0, 0.92)",
    "--color-moss": "#1F3A5F",
  },
  clay: {
    "--color-bg": "#F1E7DA",
    "--color-bg-alt": "#E8DBC8",
    "--color-bg-hero": "#E8DBC8",
    "--color-bg-tile": "#E0D0B9",
    "--color-bg-focus": "#ECDDC8",
    "--color-ink": "#2B211A",
    "--color-ink-2": "#3C3027",
    "--color-ink-3": "#594A3E",
    "--color-muted-1": "#6F5D4D",
    "--color-muted-2": "#8C785D",
    "--color-accent": "#9C4A2E",
    "--color-data": "#B08D57",
    "--color-border-1": "#DED0BC",
    "--color-border-2": "#CDBDA5",
    "--color-dotted": "#BFA98B",
    "--color-compcard-bg": "#2B211A",
    "--color-compcard-hover": "#3C3027",
    "--color-ink-strong": "#1A130E",
    "--color-ink-strong-alpha": "rgba(43, 33, 26, 0.3)",
    "--color-timeline-dot-halo": "rgba(232, 219, 200, 1)",
    "--color-data-halo": "rgba(176, 141, 87, 0.2)",
    "--color-scrim-hero-mid": "rgba(241, 231, 218, 0.85)",
    "--color-scrim-hero-end": "rgba(241, 231, 218, 1)",
    "--color-rail-fill": "rgba(205, 189, 165, 0.7)",
    "--color-cursor-bg": "rgba(43, 33, 26, 0.84)",
    "--color-cursor-ink": "#F3EFE8",
    "--color-play-icon-bg": "rgba(0, 0, 0, 0.45)",
    "--color-play-icon-bg-hover": "rgba(0, 0, 0, 0.6)",
    "--color-lightbox-scrim": "rgba(0, 0, 0, 0.92)",
    "--color-moss": "#9C4A2E",
  },
  burgundy: {
    "--color-bg": "#F7F0E4",
    "--color-bg-alt": "#EEE3CC",
    "--color-bg-hero": "#EEE3CC",
    "--color-bg-tile": "#E6D7BA",
    "--color-bg-focus": "#F1E7D0",
    "--color-ink": "#241814",
    "--color-ink-2": "#36261F",
    "--color-ink-3": "#534037",
    "--color-muted-1": "#6C574B",
    "--color-muted-2": "#8C7458",
    "--color-accent": "#722F37",
    "--color-data": "#B08D57",
    "--color-border-1": "#DFD3BC",
    "--color-border-2": "#CDBDA1",
    "--color-dotted": "#BFA782",
    "--color-compcard-bg": "#241814",
    "--color-compcard-hover": "#32231C",
    "--color-ink-strong": "#160D09",
    "--color-ink-strong-alpha": "rgba(36, 24, 20, 0.3)",
    "--color-timeline-dot-halo": "rgba(238, 227, 204, 1)",
    "--color-data-halo": "rgba(176, 141, 87, 0.2)",
    "--color-scrim-hero-mid": "rgba(247, 240, 228, 0.85)",
    "--color-scrim-hero-end": "rgba(247, 240, 228, 1)",
    "--color-rail-fill": "rgba(205, 189, 161, 0.7)",
    "--color-cursor-bg": "rgba(36, 24, 20, 0.84)",
    "--color-cursor-ink": "#F7F0E4",
    "--color-play-icon-bg": "rgba(0, 0, 0, 0.45)",
    "--color-play-icon-bg-hover": "rgba(0, 0, 0, 0.6)",
    "--color-lightbox-scrim": "rgba(0, 0, 0, 0.92)",
    "--color-moss": "#722F37",
  },
};

function buildThemeStyles() {
  const rootVars = THEME_VARS.classic;
  const rootLines: string[] = [];
  Object.entries(rootVars).forEach(([k, v]) => rootLines.push(`  ${k}: ${v};`));
  const scopeBlocks: string[] = [];
  (Object.keys(THEME_VARS) as ShowcaseThemeKey[]).forEach((themeKey) => {
    if (themeKey === "classic") return;
    const vars = THEME_VARS[themeKey];
    const lines = Object.entries(vars).map(([k, v]) => `    ${k}: ${v};`);
    scopeBlocks.push(`  [data-theme="${themeKey}"] {\n${lines.join("\n")}\n  }`);
  });
  return `:root {\n${rootLines.join("\n")}\n}\n${scopeBlocks.join("\n")}\n`;
}

type ShowcaseProfile = {
  id: string;
  displayName: string;
  alias: string | null;
  email: string;
  dateOfBirth: string | null;
  locationCity: string | null;
  locationCountry: string | null;
  avatarUpdatedAt: string | null;
  phoneNumber: string | null;
  employmentStatus: string | null;
  educationLevel: string | null;
  collegeCourse: string | null;
  nationality: string | null;
  showcaseShowBasicInfo: boolean;
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
  firstApprovedAt: string | null;
  theme?: ShowcaseThemeKey | null;
};

type ShowcaseMeasurements = {
  unit: "in" | "cm";
  bust: number | null;
  underBust: number | null;
  naturalWaist: number | null;
  hips: number | null;
  waistToFloor: number | null;
  hollowToHem: number | null;
  shoulderWidth: number | null;
  backLength: number | null;
} | null;

type ShowcaseGalleryItem = {
  id: string;
  storagePath?: string | null;
  kind: "PHOTO" | "VIDEO";
  fileName: string | null;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  createdAt: string;
};

type ShowcaseExperienceItem = {
  id: string;
  kind: "PROJECT" | "CERTIFICATION" | "TITLE";
  title: string;
  role: string | null;
  when: string | null;
};

type ShowcaseSocialLink = {
  platform: string;
  handle: string | null;
  url: string | null;
  followers: number | null;
};

type ShowcaseSetcard = {
  id: string;
  fileName: string;
  mimeType: string;
  createdAt: string;
} | null;

export type TalentShowcaseDigitalProps = {
  avatarSrc: string | null;
  galleryRouteBase: string;
  avatarRouteBase: string;
  setcardRouteBase: string;
  profile: ShowcaseProfile;
  partnerTheme: ShowcaseThemeKey | null;
  partner: {
    id: string | null;
    name: string | null;
    logoUpdatedAt: string | null;
  } | null;
  measurements: ShowcaseMeasurements;
  socialLinks: ShowcaseSocialLink[];
  galleryItems: ShowcaseGalleryItem[];
  experienceItems: ShowcaseExperienceItem[];
  setcard: ShowcaseSetcard;
  showContactInfo: boolean;
};

function formatHeight(totalInches: number | null) {
  if (!totalInches) return null;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches - feet * 12);
  return `${feet}'${inches}"`;
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

function fmtIn(num: number | null, unit: "in" | "cm") {
  if (num === null || num === undefined) return null;
  return `${Math.round(Number(num))}${unit === "in" ? '"' : " cm"}`;
}

function fmtDate(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function PlatformInitials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const chars = parts.map((p) => p[0]?.toUpperCase()).filter(Boolean);
  return chars.join("") || "MP";
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);
  return reduced;
}

function useScrollReveal() {
  const reduced = useReducedMotion();
  const registeredRef = useRef<Set<Element>>(new Set());

  useEffect(() => {
    if (reduced) return;
    const markIn = (t: HTMLElement) => {
      t.classList.add("sr-in");
      Object.assign(t.style, srInStyle);
      registeredRef.current.delete(t);
    };
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            markIn(entry.target as HTMLElement);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: "0px 0px -20px 0px" },
    );
    const targets = Array.from(document.querySelectorAll<HTMLElement>(".sr-target"));
    targets.forEach((t) => {
      if (!registeredRef.current.has(t)) {
        registeredRef.current.add(t);
        const rect = t.getBoundingClientRect();
        const inViewAlready =
          rect.top <= window.innerHeight * 0.95 && rect.bottom >= window.innerHeight * 0.05;
        if (inViewAlready) {
          markIn(t);
          return;
        }
        observer.observe(t);
      }
    });
    return () => observer.disconnect();
  }, [reduced]);

  return { reduced };
}

const srHiddenStyle: React.CSSProperties = {
  opacity: 0,
  transform: "translateY(16px)",
  transition: "opacity 560ms cubic-bezier(0.22, 0.61, 0.36, 1), transform 560ms cubic-bezier(0.22, 0.61, 0.36, 1)",
  willChange: "opacity, transform",
};

const srInStyle: React.CSSProperties = {
  opacity: 1,
  transform: "translateY(0)",
};

function applySrStyle(reduced: boolean, el: HTMLElement | null) {
  if (!el || reduced) return;
  if (el.classList.contains("sr-in")) {
    Object.assign(el.style, srInStyle);
  }
}

function useSrStyle(reduced: boolean) {
  return useCallback(
    (delayMs = 0): React.CSSProperties => {
      if (reduced) return {};
      return {
        ...srHiddenStyle,
        transitionDelay: `${delayMs}ms, ${delayMs}ms`,
      };
    },
    [reduced],
  );
}

export function TalentShowcaseDigital(props: TalentShowcaseDigitalProps) {
  const [viewerActiveIndex, setViewerActiveIndex] = useState<number | null>(null);
  const [measurementsExpanded, setMeasurementsExpanded] = useState(false);
  const [heroEntranceReady, setHeroEntranceReady] = useState(false);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [customCursor, setCustomCursor] = useState<{ visible: boolean; x: number; y: number }>({
    visible: false,
    x: 0,
    y: 0,
  });
  const viewerSwipeStartX = useRef<number | null>(null);
  const heroRef = useRef<HTMLElement | null>(null);
  const portfolioSectionRef = useRef<HTMLElement | null>(null);
  const specsSectionRef = useRef<HTMLElement | null>(null);
  const experienceSectionRef = useRef<HTMLElement | null>(null);
  const socialSectionRef = useRef<HTMLElement | null>(null);
  const cursorRaf = useRef<number | null>(null);
  const cursorTarget = useRef({ x: 0, y: 0, visible: false });

  const photoGallery = props.galleryItems.filter((g) => g.kind === "PHOTO");
  const portfolioItems: ShowcaseGalleryItem[] = photoGallery.slice(1);
  const hero = photoGallery[0] ?? null;

  const portfolioPhotoCount = portfolioItems.filter((i) => i.kind === "PHOTO").length;
  const portfolioVideoCount = portfolioItems.filter((i) => i.kind === "VIDEO").length;

  const age = getAge(props.profile.dateOfBirth);
  const location = [props.profile.locationCity, props.profile.locationCountry].filter(Boolean).join(", ");
  const representation = props.profile.nationality ?? null;
  const unit = props.measurements?.unit ?? "in";

  const avatarSrc = useMemo(
    () =>
      props.profile.avatarUpdatedAt
        ? `${props.avatarRouteBase}/${props.profile.id}?v=${encodeURIComponent(props.profile.avatarUpdatedAt)}`
        : props.avatarSrc,
    [props.avatarRouteBase, props.profile.id, props.profile.avatarUpdatedAt, props.avatarSrc],
  );

  const viewerItems: ShowcaseGalleryItem[] = photoGallery;
  const viewerIndex = viewerActiveIndex;
  const viewerItem =
    viewerIndex !== null ? viewerItems[viewerIndex] ?? null : null;

  const reducedMotion = useReducedMotion();
  useScrollReveal();

  const sectionRefs = [
    { ref: heroRef, label: "Hero" },
    { ref: portfolioSectionRef, label: "Portfolio" },
    { ref: specsSectionRef, label: "Specs" },
    { ref: experienceSectionRef, label: "Experience" },
    { ref: socialSectionRef, label: "Social" },
  ];

  useEffect(() => {
    const timer = setTimeout(() => setHeroEntranceReady(true), 80);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = sectionRefs.findIndex((s) => s.ref.current === entry.target);
            if (idx >= 0) setActiveSectionIndex(idx);
          }
        });
      },
      { threshold: 0.35, rootMargin: "-10% 0px -40% 0px" },
    );
    sectionRefs.forEach((s) => s.ref.current && observer.observe(s.ref.current));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const animate = () => {
      cursorRaf.current = null;
      setCustomCursor((prev) => {
        const tx = cursorTarget.current.x;
        const ty = cursorTarget.current.y;
        const tv = cursorTarget.current.visible;
        const nx = prev.x + (tx - prev.x) * 0.28;
        const ny = prev.y + (ty - prev.y) * 0.28;
        if (Math.abs(tx - prev.x) < 0.5 && Math.abs(ty - prev.y) < 0.5 && tv === prev.visible) {
          return { visible: tv, x: tx, y: ty };
        }
        return { visible: tv, x: nx, y: ny };
      });
    };
    const schedule = () => {
      if (cursorRaf.current === null) cursorRaf.current = requestAnimationFrame(animate);
    };
    const i = setInterval(schedule, 16);
    return () => {
      clearInterval(i);
      if (cursorRaf.current !== null) cancelAnimationFrame(cursorRaf.current);
    };
  }, []);

  const viewerPrev = useCallback(() => {
    setViewerActiveIndex((v) =>
      v === null ? v : Math.max(0, v - 1),
    );
  }, []);
  const viewerNext = useCallback(() => {
    setViewerActiveIndex((v) =>
      v === null ? v : Math.min(viewerItems.length - 1, v + 1),
    );
  }, [viewerItems.length]);

  const viewerClose = useCallback(() => setViewerActiveIndex(null), []);

  useEffect(() => {
    if (viewerActiveIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        viewerClose();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        viewerNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        viewerPrev();
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [viewerActiveIndex, viewerClose, viewerNext, viewerPrev]);

  const preloadViewerAdjacents = useCallback(() => {
    if (viewerIndex === null) return;
    [viewerIndex - 1, viewerIndex + 1].forEach((i) => {
      const it = viewerItems[i];
      if (!it) return;
      const fetchId = it.storagePath ?? it.id;
      const src = `${props.galleryRouteBase}/${fetchId}?v=${encodeURIComponent(it.createdAt)}`;
      if (it.kind === "PHOTO") {
        const prefetch = document.createElement("link");
        prefetch.rel = "preload";
        prefetch.as = "image";
        prefetch.href = src;
        document.head.appendChild(prefetch);
      } else if (it.kind === "VIDEO") {
        const vid = document.createElement("video");
        vid.src = src;
        vid.preload = "metadata";
      }
    });
  }, [viewerIndex, viewerItems, props.galleryRouteBase]);

  useEffect(() => {
    preloadViewerAdjacents();
  }, [preloadViewerAdjacents]);

  const socialByPlatform: Record<string, ShowcaseSocialLink | undefined> = {};
  let totalSocialReach = 0;
  props.socialLinks.forEach((l) => {
    socialByPlatform[l.platform.toLowerCase()] = l;
    if (l.followers !== null && l.followers !== undefined) {
      totalSocialReach += l.followers;
    }
  });
  const totalSocialReachFormatted = totalSocialReach > 0
    ? new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(totalSocialReach)
    : null;

  const displayNameWords = props.profile.displayName.split(" ");

  const onTilePointerMove = (e: React.PointerEvent) => {
    cursorTarget.current = { x: e.clientX, y: e.clientY, visible: true };
  };
  const onTilePointerEnter = () => {
    cursorTarget.current.visible = true;
  };
  const onTilePointerLeave = () => {
    cursorTarget.current.visible = false;
  };

  const srBase = (staggerDelay = 0): React.CSSProperties => {
    if (reducedMotion) return {};
    return {
      ...srHiddenStyle,
      transitionDelay: `${staggerDelay}ms`,
    };
  };

  const srAttrs = "sr-target sr-hidden";

  const allowedThemes: ShowcaseThemeKey[] = useMemo(() => SHOWCASE_THEMES.map((t) => t.key), []);
  const [resolvedTheme, setResolvedTheme] = useState<ShowcaseThemeKey>("classic");

  useEffect(() => {
    const allowed = allowedThemes;
    const talentTheme: ShowcaseThemeKey =
      props.profile.theme && allowed.includes(props.profile.theme as ShowcaseThemeKey)
        ? (props.profile.theme as ShowcaseThemeKey)
        : "classic";
    const partnerTheme: ShowcaseThemeKey | null =
      props.partnerTheme && allowed.includes(props.partnerTheme as ShowcaseThemeKey)
        ? (props.partnerTheme as ShowcaseThemeKey)
        : null;
    const base: ShowcaseThemeKey = partnerTheme ?? talentTheme;
    setResolvedTheme(base);
  }, [props.profile.theme, props.partnerTheme, allowedThemes]);

  const stylesCss = useMemo(() => buildThemeStyles(), []);

  return (
    <div
      data-theme={resolvedTheme}
      className="min-h-screen bg-[var(--color-bg)] relative overflow-x-hidden"
    >
      <style dangerouslySetInnerHTML={{ __html: stylesCss }} />
      <style>{`
        .sr-target.sr-in {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
        @media (max-width: 1023px) {
          .editorial-progress-rail { display: none !important; }
        }
        @media (hover: none) {
          .editorial-cursor-follower { display: none !important; }
          .gallery-tile-wrapper { cursor: pointer !important; }
        }
        @media (hover: hover) {
          .gallery-tile-wrapper { cursor: none !important; }
        }
        .dropcap::first-letter {
          font-family: var(--font-fraunces), Georgia, serif;
          font-weight: 400;
          font-size: clamp(56px, 8vw, 88px);
          line-height: 0.82;
          float: left;
          padding-top: 6px;
          padding-right: 10px;
          color: var(--color-accent);
          letter-spacing: -0.02em;
        }
        @media (max-width: 640px) {
          .dropcap::first-letter {
            font-size: clamp(44px, 10vw, 58px);
            padding-right: 8px;
            padding-top: 4px;
          }
        }
      `}</style>

      <div
        className="editorial-progress-rail fixed z-30 pointer-events-none"
        style={{ right: "28px", top: "12vh", height: "76vh", width: "2px" }}
      >
        <div className="absolute inset-0 rounded-full" style={{ backgroundColor: "var(--color-rail-fill)" }} />
        <div
          className="absolute left-0 top-0 w-full rounded-full transition-all duration-500 ease-out"
          style={{
            height: `${sectionRefs.length > 1 ? (activeSectionIndex / (sectionRefs.length - 1)) * 100 : 0}%`,
            backgroundColor: "var(--color-data)",
          }}
        />
        {sectionRefs.map((s, i) => {
          const isActive = i <= activeSectionIndex;
          return (
            <div
              key={s.label}
              ref={(el) => {
                if (!el) return;
                const dot = el;
                dot.style.position = "absolute";
                dot.style.left = "50%";
                dot.style.top = `${(i / Math.max(sectionRefs.length - 1, 1)) * 100}%`;
                dot.style.transform = "translate(-50%, -50%)";
                dot.style.width = "11px";
                dot.style.height = "11px";
                dot.style.borderRadius = "9999px";
                dot.style.backgroundColor = isActive ? "var(--color-data)" : "var(--color-border-2)";
                dot.style.transition = "background-color 400ms ease-out, box-shadow 400ms ease-out";
                dot.style.boxShadow = isActive
                  ? `0 0 0 4px var(--color-data-halo)`
                  : `0 0 0 4px var(--color-bg)`;
                dot.title = s.label;
                dot.style.cursor = "default";
                dot.setAttribute("role", "presentation");
              }}
            />
          );
        })}
      </div>

      <div
        className="editorial-cursor-follower fixed z-40 pointer-events-none rounded-full flex items-center justify-center"
        style={{
          width: "64px",
          height: "64px",
          left: customCursor.x - 32,
          top: customCursor.y - 32,
          backgroundColor: "var(--color-cursor-bg)",
          backdropFilter: "blur(4px)",
          opacity: customCursor.visible ? 1 : 0,
          transform: customCursor.visible ? "scale(1)" : "scale(0.6)",
          transition: "opacity 220ms ease-out, transform 220ms ease-out",
        }}
      >
        <span
          className="font-mono leading-none"
          style={{
            color: "var(--color-cursor-ink)",
            fontSize: "10px",
            letterSpacing: "0.18em",
            fontWeight: 500,
          }}
        >
          VIEW
        </span>
      </div>

      <div className="mx-auto max-w-[1400px] px-6 sm:px-10 pb-20">
        <section
          ref={heroRef}
          aria-label="Talent identity"
          className="mt-4 grid grid-cols-12 gap-0 items-stretch border border-[var(--color-border-1)] bg-[var(--color-bg-hero)]"
        >
          <div className="col-span-12 md:col-span-7 relative md:border-r border-[var(--color-border-1)] overflow-hidden flex flex-col">
            <div className="relative w-full aspect-[4/5] md:aspect-auto md:flex md:flex-1 md:min-h-0">
              {hero ? (
                <button
                  type="button"
                  onClick={() => setViewerActiveIndex(0)}
                  className="group relative block w-full h-full overflow-hidden bg-[var(--color-bg-tile)] focus:outline-none gallery-tile-wrapper"
                  onPointerMove={onTilePointerMove}
                  onPointerEnter={onTilePointerEnter}
                  onPointerLeave={onTilePointerLeave}
                >
                  <Image
                    src={`${props.galleryRouteBase}/${hero.storagePath ?? hero.id}?v=${encodeURIComponent(hero.createdAt)}`}
                    alt={hero.fileName ?? "Primary editorial photo"}
                    fill
                    sizes="(min-width: 1024px) 58vw, (min-width: 768px) 58vw, 100vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.015]"
                    unoptimized
                    priority
                  />
                </button>
              ) : avatarSrc ? (
                <Image
                  src={avatarSrc}
                  alt={props.profile.displayName}
                  fill
                  sizes="(min-width: 1024px) 58vw, (min-width: 768px) 58vw, 100vw"
                  className="object-cover"
                  unoptimized
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-editorial text-[64px] bg-[var(--color-moss)]" style={{ color: "var(--color-cursor-ink)" }}>
                  {PlatformInitials(props.profile.displayName)}
                </div>
              )}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(to bottom, transparent 0%, transparent 72%, var(--color-scrim-hero-mid) 88%, var(--color-scrim-hero-end) 100%)",
                }}
                aria-hidden
              />
              <div className="absolute bottom-8 left-8 right-8 sm:bottom-10 sm:left-10 sm:right-10 max-w-full">
                <div
                  className={`${srAttrs}`}
                  style={srBase(160)}
                >
                  <div className="font-mono text-[11px] font-medium tracking-[0.28em] uppercase text-[var(--color-accent)] leading-none mb-3 sm:mb-4">
                    TALENT PROFILE
                  </div>
                </div>
                <h1
                  className={`font-editorial leading-[0.92] tracking-[-0.025em] text-[var(--color-ink)] font-normal break-words hyphens-auto ${srAttrs}`}
                  style={{
                    ...srBase(220),
                    fontFamily: "var(--font-fraunces), var(--font-serif)",
                    fontSize: "clamp(40px, 8.5vw, 84px)",
                  }}
                >
                  {displayNameWords.map((w, i) => (
                    <span
                      key={i}
                      className="block max-w-full overflow-hidden text-ellipsis"
                      style={
                        reducedMotion || !heroEntranceReady
                          ? undefined
                          : {
                              display: "block",
                              opacity: 0,
                              transform: "translateY(20px)",
                              animation: `heroNameIn 620ms cubic-bezier(0.22, 0.61, 0.36, 1) ${180 + i * 130}ms forwards`,
                            }
                      }
                    >
                      <style>{`
                        @keyframes heroNameIn {
                          to { opacity: 1; transform: translateY(0); }
                        }
                      `}</style>
                      {w}
                    </span>
                  ))}
                </h1>
                <div
                  className={`mt-5 sm:mt-6 font-mono text-[12px] sm:text-[14px] font-medium text-[var(--color-ink-3)] tracking-[0.04em] uppercase flex flex-wrap items-baseline gap-x-5 gap-y-2 ${srAttrs}`}
                  style={srBase(420)}
                >
                  {[
                    location || null,
                    representation || null,
                    age !== null ? `${age} yrs` : null,
                    totalSocialReachFormatted ? `${totalSocialReachFormatted} reach` : null,
                  ]
                    .filter((v): v is string => Boolean(v))
                    .reduce<{ part: string }[]>((acc, part, idx, arr) => {
                      if (idx > 0 && idx < arr.length) {
                        const prev = acc[acc.length - 1];
                        prev.part = `${prev.part}\u00A0·`;
                      }
                      acc.push({ part });
                      return acc;
                    }, [])
                    .map(({ part }, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-baseline whitespace-nowrap overflow-hidden text-ellipsis min-w-0 max-w-full"
                      >
                        {part}
                      </span>
                    ))}
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 md:col-span-5 p-6 sm:p-8 md:p-8 lg:p-10 xl:p-12 flex flex-col justify-between">
            <div className="flex-1 flex flex-col min-w-0">
              <div className="relative pb-8 sm:pb-14 overflow-x-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-px bg-[var(--color-muted-2)]" aria-hidden />
                {[
                  {
                    label: "HEIGHT", value: formatHeight(props.profile.heightIn), leftTick: true },
                  {
                    label: "WEIGHT", value: props.profile.weightLbs ? `${props.profile.weightLbs} lbs` : null, leftTick: true },
                  {
                    label: "SHOE / SHIRT",
                    value: [props.profile.shoeSize ? String(props.profile.shoeSize) : null, props.profile.shirtSize]
                      .filter(Boolean)
                      .join(" · ") || null,
                    leftTick: true,
                  },
                  {
                    label: "EYES / SKIN",
                    value: [props.profile.eyeColor, props.profile.skinTone].filter(Boolean).join(" · ") || null,
                    leftTick: true,
                  },
                  {
                    label: "TATTOOS / PIERCINGS",
                    value: [
                      props.profile.tattoos === null ? null : props.profile.tattoos ? "Yes" : "None",
                      props.profile.piercings === null ? null : props.profile.piercings ? "Yes" : "None",
                    ]
                      .filter((v) => v !== null && v !== "")
                      .join(" · ") || null,
                    leftTick: true,
                  },
                  {
                    label: "BIRTHMARKS",
                    value: props.profile.birthmarks === null ? null : props.profile.birthmarks ? "Yes" : "None",
                    leftTick: true,
                  },
                  {
                    label: "EXPERIENCE",
                    value: props.profile.experienceYears ? `${props.profile.experienceYears} yrs` : null,
                    leftTick: true,
                  },
                ]
                  .filter((r) => r.value !== null && r.value !== "")
                  .map((row, idx, arr) => (
                    <div
                      key={row.label}
                      className={[
                        "flex flex-col pl-0 relative min-w-0 sr-target",
                        idx === arr.length - 1 ? "" : "pb-[22px] sm:pb-[28px] mb-[22px] sm:mb-[28px] border-b border-[var(--color-border-1)]"
                      ].filter(Boolean).join(" ")}
                      style={srBase(260 + idx * 60)}
                    >
                      <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                        {row.leftTick ? (
                          <span className="relative flex-shrink-0 mt-1.5 w-0 inline-block">
                            <span className="block w-4 h-px bg-[#8B7A5A]" />
                          </span>
                        ) : (
                          <span className="w-4 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-[10px] font-medium tracking-[0.24em] uppercase text-[var(--color-muted-1)] leading-[1.2] mb-2 sm:mb-4">
                            {row.label}
                          </div>
                          <div className="font-editorial text-[24px] sm:text-[30px] md:text-[32px] leading-[1.05] text-[var(--color-ink)] font-normal whitespace-nowrap overflow-hidden text-ellipsis">
                            {row.value}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {props.partner?.id ? (
              <div className="pt-4 sm:pt-6 border-t" style={{ borderColor: "var(--color-border-2)" }}>
                <div className="font-mono text-[10px] font-medium tracking-[0.24em] uppercase text-[var(--color-muted-1)] leading-none mb-3">
                  MANAGED BY
                </div>
                <div className="flex items-center gap-3 min-w-0">
                  {props.partner.logoUpdatedAt ? (
                    <div className="flex-shrink-0 h-6 w-6 rounded-md overflow-hidden bg-[var(--color-surface-subtle)]">
                      <img
                        alt=""
                        src={`/api/public/partner-logos/${encodeURIComponent(props.partner.id)}?v=${encodeURIComponent(props.partner.logoUpdatedAt)}`}
                        className="h-6 w-6 object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 h-6 w-6 rounded-md flex items-center justify-center bg-[var(--color-accent)]/10">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                    </div>
                  )}
                  <div className="min-w-0 font-mono text-[11px] font-medium tracking-[0.16em] uppercase text-[var(--color-ink)] leading-none truncate">
                    {props.partner.name ?? "Agency"}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="pt-8 mt-2 border-t border-[var(--color-border-1)]">
              <div
              onClick={() => {
                const el = document.getElementById("measurements-disclosure-trigger");
                if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                setMeasurementsExpanded(true);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  const el = document.getElementById("measurements-disclosure-trigger");
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                  setMeasurementsExpanded(true);
                }
              }}
              className="font-sans text-[12px] font-medium text-[var(--color-muted-1)] flex items-center gap-2 mb-5 cursor-pointer select-none"
            >
              Full body measurements below
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {props.setcard ? (
              <a
                href={`${props.setcardRouteBase}/${props.setcard.id}?download=1`}
                className="no-underline block w-full"
              >
                <button
                  type="button"
                  className="w-full h-14 sm:h-[52px] bg-[var(--color-compcard-bg)] font-mono text-[11px] font-medium tracking-[0.22em] uppercase inline-flex items-center justify-center gap-2 transition-colors hover:bg-[var(--color-compcard-hover)]" style={{ color: "var(--color-cursor-ink)" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  DOWNLOAD COMP CARD
                </button>
              </a>
            ) : null}
            </div>
          </div>
        </section>

        {portfolioItems.length ? (
          <section
            ref={portfolioSectionRef}
            aria-label="Portfolio"
            className="mt-10 sm:mt-12 lg:mt-16 -mx-6 sm:-mx-10 px-6 sm:px-10 py-10 sm:py-12 lg:py-14 bg-[var(--color-bg)]"
          >
            <div className="flex items-end justify-between gap-4 mb-8 sm:mb-10 min-w-0">
              <div className="min-w-0">
                <div
                  className={`font-mono text-[10px] font-medium tracking-[0.28em] uppercase text-[var(--color-accent)] leading-none mb-3 sm:mb-4 ${srAttrs}`}
                  style={srBase()}
                >
                  01 — PORTFOLIO
                </div>
                <h2
                  className={`font-editorial text-[32px] sm:text-[44px] lg:text-[56px] leading-[1.02] tracking-[-0.015em] text-[var(--color-ink)] font-normal ${srAttrs}`}
                  style={srBase(80)}
                >
                  Portfolio
                </h2>
              </div>
              <div
                className={`font-mono text-[11px] font-medium tracking-[0.22em] uppercase text-[var(--color-muted-1)] leading-none flex-shrink-0 ${srAttrs}`}
                style={srBase(140)}
              >
                {portfolioPhotoCount > 0 && portfolioVideoCount > 0
                  ? `${String(portfolioPhotoCount).padStart(2, "0")} photos · ${String(portfolioVideoCount).padStart(2, "0")} videos`
                  : portfolioVideoCount === 0
                    ? `${String(portfolioPhotoCount).padStart(2, "0")} photos`
                    : `${String(portfolioVideoCount).padStart(2, "0")} videos`}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {portfolioItems.map((media, i) => {
                const w = media.width && media.width > 0 ? media.width : 1600;
                const h = media.height && media.height > 0 ? media.height : 2000;
                const isVideo = media.kind === "VIDEO";
                const fetchId = media.storagePath ?? media.id;
                const mediaSrc = `${props.galleryRouteBase}/${fetchId}?v=${encodeURIComponent(media.createdAt)}`;
                const stagger = Math.min(i, 14) * 40;
                return (
                  <button
                    key={media.id}
                    type="button"
                    onClick={() => setViewerActiveIndex(i + 1)}
                    className={`group relative block w-full overflow-hidden bg-[var(--color-bg-tile)] focus:outline-none gallery-tile-wrapper sr-target`}
                    style={{
                      ...srBase(stagger),
                      aspectRatio: "4 / 5",
                    }}
                    onPointerMove={onTilePointerMove}
                    onPointerEnter={onTilePointerEnter}
                    onPointerLeave={onTilePointerLeave}
                  >
                    {isVideo ? (
                      <video
                        src={mediaSrc}
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        poster={mediaSrc}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
                      />
                    ) : (
                      <Image
                        src={mediaSrc}
                        alt={media.fileName ?? `Portfolio photo ${i + 1}`}
                        width={w}
                        height={h}
                        sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 33vw, 50vw"
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
                        unoptimized
                      />
                    )}
                    {isVideo ? (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full backdrop-blur-sm shadow-lg transition" style={{ backgroundColor: "var(--color-play-icon-bg)", color: "var(--color-cursor-ink)" }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-play-icon-bg-hover)")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--color-play-icon-bg)")}>
                          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 translate-x-[1px]">
                            <path d="M8 5.14v13.72c0 .79.87 1.27 1.54.84l11.31-6.86a1 1 0 0 0 0-1.68L9.54 4.3C8.87 3.87 8 4.35 8 5.14z" />
                          </svg>
                        </div>
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {props.profile.aboutMe && props.profile.aboutMe.trim() && portfolioItems.length ? (
          <section
            aria-label="About me"
            className="mt-10 sm:mt-12 lg:mt-16 -mx-6 sm:-mx-10 px-6 sm:px-10 bg-[var(--color-bg-alt)] py-10 sm:py-12 lg:py-14"
          >
            <div className="mx-auto max-w-[960px]">
              <div
                className={`font-mono text-[10px] font-medium tracking-[0.28em] uppercase text-[var(--color-accent)] leading-none mb-4 sm:mb-5 ${srAttrs}`}
                style={srBase()}
              >
                ABOUT
              </div>
              <div
                className={`font-sans text-[15px] sm:text-[17px] md:text-[18px] leading-[1.78] text-[var(--color-ink-2)] whitespace-pre-wrap max-w-[64ch] break-words ${srAttrs}`}
                style={srBase(100)}
              >
                {props.profile.aboutMe.trim()}
              </div>
              <div
                className={`mt-6 sm:mt-8 flex items-center gap-4 ${srAttrs}`}
                style={srBase(200)}
              >
                <span className="h-px w-12 bg-[#9C8552]/70" />
                <span
                  className="font-mono text-[10px] font-medium tracking-[0.28em] uppercase text-[var(--color-muted-1)] leading-none"
                >
                  PERSONAL NOTE
                </span>
              </div>
            </div>
          </section>
        ) : null}

        <section
          ref={specsSectionRef}
          aria-label="Measurements"
          className="mt-10 sm:mt-12 lg:mt-16 -mx-6 sm:-mx-10 px-6 sm:px-10 py-10 sm:py-12 lg:py-14 bg-[var(--color-bg)] border-t border-b border-[var(--color-border-1)] overflow-x-hidden"
        >
          <div className="max-w-[1400px] mx-auto">
            <div className="mb-10 sm:mb-12 md:mb-14">
              <div
                className={`font-mono text-[10px] font-medium tracking-[0.28em] uppercase text-[var(--color-accent)] leading-none mb-3 sm:mb-4 ${srAttrs}`}
                style={srBase()}
              >
                02 — SPECS / MEASUREMENTS
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMeasurementsExpanded((v) => !v)}
              aria-expanded={measurementsExpanded}
              aria-controls="measurements-disclosure-panel"
              id="measurements-disclosure-trigger"
              className="w-full pt-6 sm:pt-8 pb-5 sm:pb-6 md:pt-10 md:pb-8 px-4 sm:px-0 grid grid-cols-12 gap-3 sm:gap-6 items-start sm:items-center text-left focus:outline-none focus:bg-[var(--color-bg-focus)] transition-colors"
            >
              <div className="col-span-12 sm:col-span-3 flex items-center justify-between sm:justify-start sm:block mb-2 sm:mb-0 min-w-0 gap-2">
                <div className="font-mono text-[10px] font-medium tracking-[0.28em] uppercase text-[var(--color-accent)] leading-none">
                  SPECS / MEASUREMENTS
                </div>
                <span className="sm:hidden inline-flex items-center gap-1.5">
                  <span className="inline-flex font-mono text-[10px] font-medium tracking-[0.24em] uppercase text-[var(--color-accent)] leading-none">
                    {measurementsExpanded ? "COLLAPSE" : "EXPAND"}
                  </span>
                  <span
                    aria-hidden
                    className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center transition-transform duration-300" style={{ transform: measurementsExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </span>
              </div>
              <div className="col-span-12 sm:col-span-8 min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-4 sm:gap-x-6 md:gap-x-8 gap-y-2 font-sans text-[var(--color-ink)]">
                  <span className="inline-flex items-baseline gap-1.5 sm:gap-2 min-w-0">
                    <span className="font-editorial text-[20px] sm:text-[22px] md:text-[24px] leading-none text-[var(--color-ink)] font-normal whitespace-nowrap overflow-hidden text-ellipsis">
                      {fmtIn(props.measurements?.bust ?? null, unit) ?? "—"}
                    </span>
                    <span className="font-mono text-[10px] font-medium tracking-[0.24em] uppercase text-[var(--color-muted-1)]">
                      BUST
                    </span>
                  </span>
                  <span className="inline-flex items-baseline gap-1.5 sm:gap-2 min-w-0">
                    <span className="font-editorial text-[20px] sm:text-[22px] md:text-[24px] leading-none text-[var(--color-ink)] font-normal whitespace-nowrap overflow-hidden text-ellipsis">
                      {fmtIn(props.measurements?.naturalWaist ?? null, unit) ?? "—"}
                    </span>
                    <span className="font-mono text-[10px] font-medium tracking-[0.24em] uppercase text-[var(--color-muted-1)]">
                      WAIST
                    </span>
                  </span>
                  <span className="inline-flex items-baseline gap-1.5 sm:gap-2 min-w-0">
                    <span className="font-editorial text-[20px] sm:text-[22px] md:text-[24px] leading-none text-[var(--color-ink)] font-normal whitespace-nowrap overflow-hidden text-ellipsis">
                      {fmtIn(props.measurements?.hips ?? null, unit) ?? "—"}
                    </span>
                    <span className="font-mono text-[10px] font-medium tracking-[0.24em] uppercase text-[var(--color-muted-1)]">
                      HIPS
                    </span>
                  </span>
                  <span className="inline-flex items-baseline gap-1.5 sm:gap-2 min-w-0">
                    <span className="font-editorial text-[20px] sm:text-[22px] md:text-[24px] leading-none text-[var(--color-ink)] font-normal whitespace-nowrap overflow-hidden text-ellipsis">
                      {formatHeight(props.profile.heightIn) ?? "—"}
                    </span>
                    <span className="font-mono text-[10px] font-medium tracking-[0.24em] uppercase text-[var(--color-muted-1)]">
                      HEIGHT
                    </span>
                  </span>
                </div>
              </div>
              <div className="hidden sm:flex col-span-1 justify-end items-center gap-2 sm:gap-3">
                <span className="inline-flex font-mono text-[10px] font-medium tracking-[0.24em] uppercase text-[var(--color-accent)] leading-none">
                  {measurementsExpanded ? "COLLAPSE" : "EXPAND"}
                </span>
                <span
                  aria-hidden
                  className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center transition-transform duration-300" style={{ transform: measurementsExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
            </button>

            <div
              id="measurements-disclosure-panel"
              role="region"
              aria-labelledby="measurements-disclosure-trigger"
              className={measurementsExpanded ? "" : "hidden"}
            >
              <div className="pb-4 sm:pb-6 lg:pb-8 border-t border-[var(--color-border-1)] pt-6 px-4 sm:px-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 sm:gap-x-10 lg:gap-x-16 min-w-0">
                  <div className="min-w-0">
                    {[
                      { label: "BUST", value: fmtIn(props.measurements?.bust ?? null, unit) },
                      { label: "NATURAL WAIST", value: fmtIn(props.measurements?.naturalWaist ?? null, unit) },
                      { label: "WAIST TO FLOOR", value: fmtIn(props.measurements?.waistToFloor ?? null, unit) },
                      { label: "SHOULDER WIDTH", value: fmtIn(props.measurements?.shoulderWidth ?? null, unit) },
                    ]
                      .filter((r) => r.value !== null)
                      .map((row, i) => (
                        <div
                          key={row.label}
                          className={`py-3 sm:py-4 flex items-baseline justify-between gap-4 min-w-0 sr-target`}
                          style={{
                            ...srBase(i * 60),
                            borderBottom: "1px dotted var(--color-dotted)",
                          }}
                        >
                          <span className="font-mono text-[10px] font-medium tracking-[0.24em] uppercase text-[var(--color-muted-1)] leading-none whitespace-nowrap overflow-hidden text-ellipsis flex-shrink-0">
                            {row.label}
                          </span>
                          <span className="font-editorial text-[17px] sm:text-[18px] md:text-[20px] leading-none text-[var(--color-ink)] font-normal whitespace-nowrap overflow-hidden text-ellipsis min-w-0">
                            {row.value}
                          </span>
                        </div>
                      ))}
                  </div>
                  <div className="min-w-0 mt-2 sm:mt-0">
                    {[
                      { label: "UNDER BUST", value: fmtIn(props.measurements?.underBust ?? null, unit) },
                      { label: "FULL HIPS", value: fmtIn(props.measurements?.hips ?? null, unit) },
                      { label: "HOLLOW TO HEM", value: fmtIn(props.measurements?.hollowToHem ?? null, unit) },
                      { label: "BACK LENGTH", value: fmtIn(props.measurements?.backLength ?? null, unit) },
                    ]
                      .filter((r) => r.value !== null)
                      .map((row, i) => (
                        <div
                          key={row.label}
                          className={`py-3 sm:py-4 flex items-baseline justify-between gap-4 min-w-0 sr-target`}
                          style={{
                            ...srBase(40 + i * 60),
                            borderBottom: "1px dotted var(--color-dotted)",
                          }}
                        >
                          <span className="font-mono text-[10px] font-medium tracking-[0.24em] uppercase text-[var(--color-muted-1)] leading-none whitespace-nowrap overflow-hidden text-ellipsis flex-shrink-0">
                            {row.label}
                          </span>
                          <span className="font-editorial text-[17px] sm:text-[18px] md:text-[20px] leading-none text-[var(--color-ink)] font-normal whitespace-nowrap overflow-hidden text-ellipsis min-w-0">
                            {row.value}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {props.experienceItems.length ? (
          <section
            ref={experienceSectionRef}
            aria-label="Experience"
            className="mt-10 sm:mt-12 lg:mt-16 -mx-6 sm:-mx-10 px-6 sm:px-10 py-10 sm:py-12 lg:py-14 bg-[var(--color-bg-alt)] border-t border-[var(--color-border-1)]"
          >
            <div className="max-w-[1400px] mx-auto px-4 sm:px-0">
              <div className="mb-10 sm:mb-12 md:mb-14">
                <div
                  className={`font-mono text-[10px] font-medium tracking-[0.28em] uppercase text-[var(--color-accent)] leading-none mb-3 sm:mb-4 ${srAttrs}`}
                  style={srBase()}
                >
                  03 — PROFILE
                </div>
                <h2
                  className={`font-editorial text-[32px] sm:text-[44px] lg:text-[56px] leading-[1.02] tracking-[-0.015em] text-[var(--color-ink)] font-normal ${srAttrs}`}
                  style={srBase(80)}
                >
                  Experience
                </h2>
              </div>

              <div className="relative">
                <div className="absolute left-[5px] top-1 bottom-1 w-px bg-[var(--color-border-2)]" aria-hidden />
                <div className="space-y-8 sm:space-y-10 md:space-y-12 min-w-0">
                  {props.experienceItems.slice().reverse().map((x, idx) => {
                    const whenLabel = (() => {
                      if (!x.when) return null;
                      const d = new Date(x.when);
                      if (!Number.isNaN(d.getTime())) {
                        const sameYearOnly = x.when.length === 4 || x.when.match(/^\d{4}$/);
                        if (sameYearOnly) return String(d.getFullYear());
                        return d.toLocaleDateString(undefined, { year: "numeric", month: "short" });
                      }
                      return x.when;
                    })();
                    const kindLabel =
                      x.kind === "PROJECT" ? "PROJECT" : x.kind === "TITLE" ? "TITLE" : "CERTIFICATION";
                    const description =
                      x.role
                        ? x.role
                        : x.kind === "TITLE"
                        ? "Regional pageant placement."
                        : x.kind === "PROJECT"
                        ? "Runway presentation for national apparel brand."
                        : x.kind === "CERTIFICATION"
                        ? "Completed an 8-session advanced runway training program."
                        : null;
                    return (
                      <div
                        key={x.id}
                        className={`relative pl-8 sm:pl-10 md:pl-12 min-w-0 sr-target`}
                        style={srBase(idx * 80)}
                      >
                        <span
                          className="absolute left-0 top-[6px] w-[11px] h-[11px] rounded-full bg-[var(--color-accent)] shadow-[0_0_0_4px_var(--color-timeline-dot-halo)]" aria-hidden
                        />
                        <div className="font-mono text-[11px] sm:text-[12px] font-medium tracking-[0.16em] uppercase text-[var(--color-accent)] leading-none mb-2 sm:mb-3 whitespace-nowrap overflow-hidden text-ellipsis">
                          {whenLabel ?? "—"}
                        </div>
                        <h3
                          className="font-editorial text-[24px] sm:text-[28px] md:text-[32px] leading-[1.05] tracking-[-0.01em] text-[var(--color-ink)] font-normal break-words"
                          style={{ fontFamily: "var(--font-fraunces), var(--font-serif)" }}
                        >
                          {x.title}
                        </h3>
                        <div className="mt-3 inline-flex items-center border px-2 py-[3px] max-w-full overflow-hidden" style={{ borderColor: "var(--color-ink-strong-alpha)" }}>
                          <span className="font-mono text-[10px] font-medium tracking-[0.28em] uppercase text-[var(--color-ink)] leading-none whitespace-nowrap overflow-hidden text-ellipsis">
                            {kindLabel}
                          </span>
                        </div>
                        {description ? (
                          <p className="mt-4 font-sans text-[13px] sm:text-[14px] leading-6 text-[var(--color-ink-3)]">
                            {description}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {props.socialLinks.length ? (
          <section
            ref={socialSectionRef}
            aria-label="Social"
            className="mt-10 sm:mt-12 lg:mt-16 -mx-6 sm:-mx-10 px-6 sm:px-10 py-10 sm:py-12 lg:py-14 bg-[var(--color-bg)] border-t border-[var(--color-border-1)]"
          >
            <div className="max-w-[1400px] mx-auto px-4 sm:px-0">
              <div
                className={`font-mono text-[10px] font-medium tracking-[0.28em] uppercase text-[var(--color-accent)] leading-none mb-3 sm:mb-4 ${srAttrs}`}
                style={srBase()}
              >
                04 — REACH
              </div>

              <div
                className={`mb-12 sm:mb-16 md:mb-20 ${srAttrs}`}
                style={srBase(80)}
              >
                <div
                  className="font-editorial font-normal tracking-[-0.018em] text-[var(--color-ink)] leading-[0.95]"
                  style={{
                    fontFamily: "var(--font-fraunces), var(--font-serif)",
                    fontSize: "clamp(44px, 8.5vw, 96px)",
                  }}
                >
                  {totalSocialReachFormatted ?? "—"}
                </div>
                <div className="mt-3 sm:mt-4 font-mono text-[11px] sm:text-[12px] font-medium tracking-[0.16em] uppercase text-[var(--color-muted-1)] leading-none">
                  Combined audience across platforms
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-y-8 sm:gap-y-10 gap-x-8 sm:gap-x-10 md:gap-x-12 lg:gap-x-16 items-baseline">
                {[
                  { key: "instagram", label: "INSTAGRAM" },
                  { key: "tiktok", label: "TIKTOK" },
                  { key: "facebook", label: "FACEBOOK" },
                  { key: "youtube", label: "YOUTUBE" },
                  { key: "x", label: "X" },
                ].map((entry, idx) => {
                  const link = socialByPlatform[entry.key];
                  const followers =
                    link?.followers !== null && link?.followers !== undefined
                      ? link.followers
                      : 0;
                  const followersFormatted =
                    followers > 0
                      ? new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 0 }).format(followers)
                      : null;
                  const handleDisplay = link?.handle ? (
                    <span className="font-editorial text-[13px] sm:text-[14px] md:text-[15px] text-[var(--color-ink-3)] font-normal leading-tight break-words">
                      {entry.key === "facebook" || entry.key === "youtube"
                        ? link.handle.replace(/^@/, "")
                        : `@${link.handle.replace(/^@/, "")}`}
                    </span>
                  ) : null;
                  const content = (
                    <div
                      className={`flex flex-col items-start min-w-0 sm:min-w-0 sr-target`}
                      style={srBase(140 + idx * 80)}
                    >
                      <div className="font-mono text-[9px] sm:text-[10px] font-medium tracking-[0.26em] uppercase text-[var(--color-accent)] leading-none mb-2 sm:mb-3 whitespace-nowrap overflow-hidden text-ellipsis">
                        {entry.label}
                      </div>
                      <div
                        className="font-editorial font-normal tracking-[-0.01em] text-[var(--color-ink)] leading-none"
                        style={{
                          fontFamily: "var(--font-fraunces), var(--font-serif)",
                          fontSize: "clamp(34px, 3.2vw, 44px)",
                        }}
                      >
                        {followersFormatted ?? "—"}
                      </div>
                      {handleDisplay ? (
                        <div className="mt-2 sm:mt-3 min-w-0">{handleDisplay}</div>
                      ) : null}
                      {followers > 0 ? (
                        <div className="mt-1 sm:mt-2 font-mono text-[10px] font-medium tracking-[0.16em] uppercase text-[var(--color-muted-2)] leading-none">
                          {entry.key === "youtube" ? "subscribers" : "followers"}
                        </div>
                      ) : null}
                    </div>
                  );
                  return link?.url ? (
                    <a
                      key={entry.key}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block no-underline transition-opacity hover:opacity-80 min-w-0 flex-shrink-0"
                    >
                      {content}
                    </a>
                  ) : (
                    <div key={entry.key} className="block opacity-70 min-w-0 flex-shrink-0">
                      {content}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        ) : null}

        {(() => {
          const alwaysRows: { label: string; value: string | null }[] = [
            { label: "Nationality", value: props.profile.nationality },
          ];
          const gatedBasicRows: { label: string; value: string | null }[] = props.profile.showcaseShowBasicInfo
            ? [
                { label: "Employment status", value: props.profile.employmentStatus },
                { label: "Education", value: props.profile.educationLevel },
                { label: "Course of study", value: props.profile.collegeCourse },
              ]
            : [];
          const basicRows = [...alwaysRows, ...gatedBasicRows];
          const contactRows: { label: string; value: string | null; href?: string }[] = props.showContactInfo
            ? [
                { label: "Email", value: props.profile.email, href: props.profile.email ? `mailto:${props.profile.email}` : undefined },
                { label: "Mobile", value: props.profile.phoneNumber, href: props.profile.phoneNumber ? `tel:${props.profile.phoneNumber.replace(/\s+/g, "")}` : undefined },
              ]
            : [];

          const hasBasic = basicRows.some((r) => r.value && r.value.trim() !== "");
          const hasContact = contactRows.some((r) => r.value && r.value.trim() !== "");
          if (!hasBasic && !hasContact) return null;

          return (
            <section
              aria-label="Profile details"
              className="mt-10 sm:mt-12 lg:mt-16 -mx-6 sm:-mx-10 px-6 sm:px-10 py-10 sm:py-12 lg:py-14 bg-[var(--color-bg-alt)] border-t border-[var(--color-border-1)]"
            >
              <div className="max-w-[1400px] mx-auto px-4 sm:px-0">
                <div className="mb-10 sm:mb-12 md:mb-14">
                  <div
                    className={`font-mono text-[10px] font-medium tracking-[0.28em] uppercase text-[var(--color-accent)] leading-none mb-3 sm:mb-4 ${srAttrs}`}
                    style={srBase()}
                  >
                    05 — DETAILS
                  </div>
                  <h2
                    className={`font-editorial text-[32px] sm:text-[44px] lg:text-[56px] leading-[1.02] tracking-[-0.015em] text-[var(--color-ink)] font-normal ${srAttrs}`}
                    style={srBase(80)}
                  >
                    Profile
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 sm:gap-12 md:gap-16 min-w-0">
                  {hasBasic ? (
                    <div className="min-w-0 sr-target" style={srBase(200)}>
                      <div className="font-mono text-[10px] font-medium tracking-[0.24em] uppercase text-[var(--color-muted-1)] leading-none mb-5 sm:mb-6">
                        Basic information
                      </div>
                      <dl className="min-w-0">
                        {basicRows
                          .filter((r) => r.value && r.value.trim() !== "")
                          .map((row, i, arr) => (
                            <div
                              key={row.label}
                              className={[
                                "py-3 sm:py-4 flex items-baseline justify-between gap-6 min-w-0",
                                i !== arr.length - 1 ? "border-b" : "",
                              ].filter(Boolean).join(" ")}
                              style={{ borderColor: "var(--color-border-1)" }}
                            >
                              <dt className="font-mono text-[10px] font-medium tracking-[0.22em] uppercase text-[var(--color-muted-1)] leading-none whitespace-nowrap overflow-hidden text-ellipsis flex-shrink-0">
                                {row.label}
                              </dt>
                              <dd className="font-sans text-[15px] sm:text-[16px] leading-6 text-[var(--color-ink)] text-right whitespace-nowrap overflow-hidden text-ellipsis min-w-0 max-w-[60%]">
                                {row.value}
                              </dd>
                            </div>
                          ))}
                      </dl>
                    </div>
                  ) : null}

                  {hasContact ? (
                    <div className="min-w-0 sr-target" style={srBase(280)}>
                      <div className="font-mono text-[10px] font-medium tracking-[0.24em] uppercase text-[var(--color-muted-1)] leading-none mb-5 sm:mb-6">
                        Contact
                      </div>
                      <dl className="min-w-0">
                        {contactRows
                          .filter((r) => r.value && r.value.trim() !== "")
                          .map((row, i, arr) => {
                            const content = (
                              <div
                                key={row.label}
                                className={[
                                  "py-3 sm:py-4 flex items-baseline justify-between gap-6 min-w-0",
                                  i !== arr.length - 1 ? "border-b" : "",
                                ].filter(Boolean).join(" ")}
                                style={{ borderColor: "var(--color-border-1)" }}
                              >
                                <dt className="font-mono text-[10px] font-medium tracking-[0.22em] uppercase text-[var(--color-muted-1)] leading-none whitespace-nowrap overflow-hidden text-ellipsis flex-shrink-0">
                                  {row.label}
                                </dt>
                                <dd className="font-sans text-[15px] sm:text-[16px] leading-6 text-[var(--color-ink)] text-right whitespace-nowrap overflow-hidden text-ellipsis min-w-0 max-w-[60%]">
                                  {row.value}
                                </dd>
                              </div>
                            );
                            return row.href ? (
                              <a
                                key={row.label}
                                href={row.href}
                                className="block no-underline transition-opacity hover:opacity-80"
                              >
                                {content}
                              </a>
                            ) : (
                              content
                            );
                          })}
                      </dl>
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          );
        })()}
      </div>

      {viewerItem ? (
        <div
          className="fixed inset-0 z-50 backdrop-blur-sm"
          style={{ backgroundColor: "var(--color-lightbox-scrim)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) viewerClose();
          }}
          role="dialog"
          aria-modal="true"
          aria-label={`Portfolio photo ${viewerIndex! + 1} of ${viewerItems.length}`}
          onPointerDown={(e) => {
            if (e.pointerType === "touch" || e.pointerType === "pen") {
              viewerSwipeStartX.current = e.clientX;
            }
          }}
          onPointerUp={(e) => {
            const start = viewerSwipeStartX.current;
            if (start === null) return;
            const dx = e.clientX - start;
            const threshold = 50;
            if (dx > threshold) viewerPrev();
            else if (dx < -threshold) viewerNext();
            viewerSwipeStartX.current = null;
          }}
        >
          <button
            type="button"
            onClick={viewerClose}
            className="absolute right-4 sm:right-6 top-4 sm:top-6 z-[60] inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/15 transition hover:bg-white/18"
            aria-label="Close viewer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <div className="absolute left-4 sm:left-6 top-5 sm:top-6 font-mono text-[11px] sm:text-[12px] font-medium tracking-[0.14em] uppercase text-white/85 whitespace-nowrap">
            {viewerIndex !== null
              ? `${viewerIndex + 1} / ${viewerItems.length}`
              : null}
          </div>
          <div className="absolute inset-0 flex items-center justify-center px-4 py-16 sm:px-8 sm:py-20">
            <div className="relative flex h-full w-full max-w-[1600px] items-center justify-center">
              <button
                type="button"
                onClick={viewerPrev}
                disabled={viewerIndex === 0}
                className="absolute left-0 sm:-left-2 z-20 inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-3xl font-light text-white shadow-lg ring-1 ring-white/15 transition hover:bg-black/70 disabled:opacity-30 disabled:cursor-default"
                aria-label="Previous photo"
              >
                ‹
              </button>
              <div className="relative mx-12 sm:mx-16 flex h-full w-full items-center justify-center">
                {viewerItem.kind === "VIDEO" ? (
                  <video
                    src={`${props.galleryRouteBase}/${viewerItem.storagePath ?? viewerItem.id}?v=${encodeURIComponent(viewerItem.createdAt)}`}
                    className="max-h-full max-w-full w-auto h-auto object-contain rounded-sm"
                    controls
                    autoPlay
                    playsInline
                    preload="auto"
                  />
                ) : (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <Image
                      alt={viewerItem.fileName ?? "Portfolio photo"}
                      src={`${props.galleryRouteBase}/${viewerItem.storagePath ?? viewerItem.id}?v=${encodeURIComponent(viewerItem.createdAt)}`}
                      width={viewerItem.width ?? 2400}
                      height={viewerItem.height ?? 3000}
                      sizes="100vw"
                      className="w-auto h-auto max-h-[84vh] max-w-full object-contain"
                      style={{ aspectRatio: viewerItem.width && viewerItem.height ? `${viewerItem.width} / ${viewerItem.height}` : undefined }}
                      unoptimized
                      priority
                    />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={viewerNext}
                disabled={viewerIndex !== null && viewerIndex >= viewerItems.length - 1}
                className="absolute right-0 sm:-right-2 z-20 inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-3xl font-light text-white shadow-lg ring-1 ring-white/15 transition hover:bg-black/70 disabled:opacity-30 disabled:cursor-default"
                aria-label="Next photo"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
