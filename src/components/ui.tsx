"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  X,
  Check,
  Eye,
  EyeOff,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";

/* ==============================================================================
   SHARED UI PRIMITIVES — Talent Portal
   Design tokens live in src/app/globals.css.
   All primitives: neutral surfaces, Moss accents, Manrope UI font.
   Editorial Instrument Serif must be opted-in per usage.

   BACKWARD COMPATIBILITY:
   PrimaryButton, SecondaryButton, Card, Chip, StatusBadge, Modal,
   AvatarCropperModal, PortalLoadingScreen, FullScreenLoadingOverlay
   are still exported with the same props APIs.
   ============================================================================== */

/* ------------------------------------------------------------------------------
   1. Button — 4 variants + 2 sizes, one API.
   Default height 44px. Moss filled for primary.
   ---------------------------------------------------------------------------- */
export type ButtonVariant = "primary" | "secondary" | "tertiary" | "destructive";
export type ButtonSize = "md" | "sm";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  asChild?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  rightIcon,
  className = "",
  disabled,
  children,
  ...rest
}: ButtonProps) {
  const isMd = size === "md";

  const base =
    "relative inline-flex items-center justify-center select-none font-sans font-semibold whitespace-nowrap rounded-[var(--radius-md)] transition-colors duration-[var(--duration-base)] ease-[var(--ease-out)] focus-visible:outline-none disabled:cursor-not-allowed disabled:active:translate-y-0 active:translate-y-px";

  const sizing = isMd
    ? "h-[44px] px-5 text-[14px] tracking-[0.01em]"
    : "h-[36px] px-3.5 text-[13px]";

  const byVariant: Record<ButtonVariant, string> = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    tertiary: "btn-tertiary",
    destructive: "btn-destructive",
  };

  const spinner = loading ? (
    <span
      aria-hidden
      className="pointer-events-none mr-2 h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin"
    />
  ) : null;

  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`${base} ${sizing} ${byVariant[variant]} ${className}`}
    >
      {loading ? spinner : leftIcon ? <span className="mr-2 -ml-0.5 flex">{leftIcon}</span> : null}
      <span className="leading-none">{children}</span>
      {!loading && rightIcon ? <span className="ml-2 -mr-0.5 flex">{rightIcon}</span> : null}
    </button>
  );
}

// ---------- Backward-compat aliases (PrimaryButton / SecondaryButton) ----------
export interface LegacyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  small?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
export function PrimaryButton({ small, className = "", ...rest }: LegacyButtonProps) {
  return <Button variant="primary" size={small ? "sm" : "md"} className={className} {...rest} />;
}
export function SecondaryButton({ small, className = "", ...rest }: LegacyButtonProps) {
  return <Button variant="secondary" size={small ? "sm" : "md"} className={className} {...rest} />;
}

/* ------------------------------------------------------------------------------
   2. Card — neutral surface. No glass. Radius 12, 1px mist border, subtle shadow.
   ---------------------------------------------------------------------------- */
export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  padding?: "none" | "sm" | "md" | "lg";
  padded?: boolean;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerRight?: React.ReactNode;
  right?: React.ReactNode;
  titleRight?: React.ReactNode;
  role?: string;
  ariaLabelledby?: string;
}

export function Card({
  className = "",
  padded,
  padding = padded === false ? "none" : "md",
  title,
  subtitle,
  headerRight,
  right,
  titleRight,
  role,
  ariaLabelledby,
  children,
  ...rest
}: CardProps) {
  const actionsSlot = (headerRight ?? right ?? titleRight) ? (
    <div className="shrink-0 flex items-center gap-2">
      {titleRight ? <div>{titleRight}</div> : null}
      {headerRight ? <div>{headerRight}</div> : right ? <div>{right}</div> : null}
    </div>
  ) : null;
  const padBySize: Record<NonNullable<CardProps["padding"]>, string> = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      role={role}
      aria-labelledby={ariaLabelledby}
      className={`rounded-[var(--radius-lg)] border border-[var(--color-mist)] bg-[var(--color-surface)] text-[var(--color-ink)] shadow-[0_1px_3px_rgba(23,25,24,0.05)] ${padBySize[padding]} ${className}`}
      {...rest}
    >
      {title || actionsSlot ? (
        <div className="flex items-start justify-between gap-4 border-b border-[var(--color-mist)] pb-4 mb-5">
          <div className="min-w-0">
            {title ? (
              <h3 id={ariaLabelledby} className="t-h4 text-[var(--color-ink)]">
                {title}
              </h3>
            ) : null}
            {subtitle ? (
              <div className="mt-1 t-body-sm text-[var(--color-graphite)]">{subtitle}</div>
            ) : null}
          </div>
          {actionsSlot}
        </div>
      ) : null}
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------------------
   3. Chip — pills for tags / statuses / compact filters. Radius-full, short.
   ---------------------------------------------------------------------------- */
export type ChipVariant = "default" | "brand" | "success" | "warning" | "error" | "info";

export interface ChipProps {
  label?: React.ReactNode;
  children?: React.ReactNode;
  variant?: ChipVariant;
  className?: string;
  title?: string;
}

export function Chip({ label, children, variant = "default", className = "", title }: ChipProps) {
  const resolvedLabel = label ?? children;
  const byVariant: Record<ChipVariant, string> = {
    default:
      "bg-[var(--color-surface-subtle)] text-[var(--color-charcoal)] border border-[var(--color-border-soft)]",
    brand:
      "bg-[var(--color-brand-light)] text-[var(--color-brand-dark)] border border-[color-mix(in_oklab,var(--color-brand-light),var(--color-brand)_20%)]",
    success:
      "bg-[var(--color-success-bg)] text-[var(--color-success)] border border-[color-mix(in_oklab,var(--color-success-bg),var(--color-success)_18%)]",
    warning:
      "bg-[var(--color-warning-bg)] text-[var(--color-warning)] border border-[color-mix(in_oklab,var(--color-warning-bg),var(--color-warning)_18%)]",
    error:
      "bg-[var(--color-error-bg)] text-[var(--color-error)] border border-[color-mix(in_oklab,var(--color-error-bg),var(--color-error)_18%)]",
    info: "bg-[var(--color-info-bg)] text-[var(--color-info)] border border-[color-mix(in_oklab,var(--color-info-bg),var(--color-info)_18%)]",
  };

  return (
    <span
      title={title}
      className={`inline-flex items-center rounded-full px-3 h-7 t-body-sm font-medium tracking-0 ${byVariant[variant]} ${className}`}
    >
      {resolvedLabel}
    </span>
  );
}

/* ------------------------------------------------------------------------------
   4. Badge — tiny metadata pill (smaller than Chip, 20px height).
   ---------------------------------------------------------------------------- */
export function Badge({
  label,
  children,
  variant,
  tone = "default",
  className = "",
}: {
  label?: React.ReactNode;
  children?: React.ReactNode;
  tone?: "default" | "brand";
  variant?: "default" | "brand";
  className?: string;
}) {
  const resolvedLabel = label ?? children;
  return (
    <span
      className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 t-caption font-semibold bg-[var(--color-brand-light)] text-[var(--color-brand-dark)] border border-[color-mix(in_oklab,var(--color-brand-light),var(--color-brand)_15%)] ${className}`}
    >
      {resolvedLabel}
    </span>
  );
}

/* ------------------------------------------------------------------------------
   5. StatusBadge — legacy mapping preserved, re-skinned with semantic chips.
   ---------------------------------------------------------------------------- */
export function StatusBadge({ status, className }: { status: string | null | undefined; className?: string }) {
  const s = (status ?? "").toLowerCase();
  if (!s) return null;
  if (s === "accepted" || s === "approved" || s === "verified")
    return <Chip label={status} variant="success" className={className} />;
  if (s === "pending" || s === "awaiting" || s === "in_review" || s === "review")
    return <Chip label={status} variant="warning" className={className} />;
  if (s === "rejected" || s === "denied" || s === "failed")
    return <Chip label={status} variant="error" className={className} />;
  if (s === "active" || s === "live" || s === "published")
    return <Chip label={status} variant="brand" className={className} />;
  return <Chip label={status} variant="default" className={className} />;
}

/* ------------------------------------------------------------------------------
   6. Label + Input (44-48px) + Textarea + Select
   ---------------------------------------------------------------------------- */
export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function Label({ htmlFor, required, children, className = "", ...rest }: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={`mb-2 block t-label text-[var(--color-graphite)] ${className}`}
      {...rest}
    >
      {children}
      {required ? <span className="ml-1 text-[var(--color-error)]">*</span> : null}
    </label>
  );
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string | boolean;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

const inputShell =
  "group w-full h-[46px] rounded-[var(--radius-md)] border bg-[var(--color-surface)] text-[var(--color-ink)] flex items-center transition-colors duration-[var(--duration-base)] ease-[var(--ease-out)] focus-within:border-[var(--color-brand)]";
const inputCls =
  "w-full h-full bg-transparent outline-none border-0 px-4 t-body placeholder:text-[var(--color-stone)] disabled:opacity-50";

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { error, leftAddon, rightAddon, className = "", id, ...rest },
  ref
) {
  const borderColor = error
    ? "border-[var(--color-error)] focus-within:border-[var(--color-error)]"
    : "border-[var(--color-mist)]";
  return (
    <div className={`${inputShell} ${borderColor} ${className}`}>
      {leftAddon ? <span className="pl-3 pr-1 text-[var(--color-stone)]">{leftAddon}</span> : null}
      <input ref={ref} id={id} className={inputCls} {...rest} />
      {rightAddon ? <span className="pr-3 pl-1 text-[var(--color-stone)]">{rightAddon}</span> : null}
    </div>
  );
});

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string | boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { error, className = "", ...rest },
  ref
) {
  const border = error
    ? "border-[var(--color-error)] focus:border-[var(--color-error)]"
    : "border-[var(--color-mist)] focus:border-[var(--color-brand)]";
  return (
    <textarea
      ref={ref}
      className={`w-full min-h-[112px] rounded-[var(--radius-md)] border bg-[var(--color-surface)] p-3.5 t-body text-[var(--color-ink)] placeholder:text-[var(--color-stone)] transition-colors duration-[var(--duration-base)] ease-[var(--ease-out)] outline-none disabled:opacity-50 resize-y ${border} ${className}`}
      {...rest}
    />
  );
});

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string | boolean;
  children: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { error, children, className = "", ...rest },
  ref
) {
  const border = error ? "border-[var(--color-error)]" : "border-[var(--color-mist)]";
  return (
    <div className="relative">
      <select
        ref={ref}
        {...rest}
        className={`w-full h-[46px] appearance-none rounded-[var(--radius-md)] border bg-[var(--color-surface)] px-4 pr-10 t-body text-[var(--color-ink)] outline-none transition-colors duration-[var(--duration-base)] ease-[var(--ease-out)] focus:border-[var(--color-brand)] disabled:opacity-50 ${border} ${className}`}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-[var(--color-stone)]"
      />
    </div>
  );
});

/* ------------------------------------------------------------------------------
   7. PasswordInput — show/hide toggle.
   ---------------------------------------------------------------------------- */
export function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <Input
      {...props}
      type={show ? "text" : "password"}
      rightAddon={
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-graphite)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-subtle)]"
          aria-label={show ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      }
    />
  );
}

/* ------------------------------------------------------------------------------
   8. Checkbox — Moss-filled checked, mist border, 18px.
   ---------------------------------------------------------------------------- */
export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  onCheckedChange?: (checked: boolean) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function Checkbox({ id, label, description, className = "", onCheckedChange, onChange, checked, ...rest }: CheckboxProps) {
  const innerId = id ?? React.useId();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e);
    onCheckedChange?.(e.target.checked);
  };
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <div className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
        <input
          id={innerId}
          type="checkbox"
          checked={checked}
          className="peer absolute inset-0 h-full w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          onChange={handleChange}
          {...rest}
        />
        <div className="pointer-events-none h-[18px] w-[18px] rounded-[var(--radius-sm)] border border-[var(--color-mist)] bg-[var(--color-surface)] peer-checked:border-[var(--color-brand)] peer-checked:bg-[var(--color-brand)] transition-colors duration-[var(--duration-fast)] flex items-center justify-center">
          <Check className="h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={3} />
        </div>
      </div>
      {label ? (
        <label htmlFor={innerId} className="cursor-pointer select-none">
          <div className="t-body text-[var(--color-ink)]">{label}</div>
          {description ? <div className="mt-0.5 t-body-sm text-[var(--color-stone)]">{description}</div> : null}
        </label>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------------------
   9. Toggle (Switch) — 26px tall. Moss track when ON, mist when OFF. No text.
   ---------------------------------------------------------------------------- */
export interface ToggleProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  className?: string;
  label?: React.ReactNode;
}

export function Toggle({
  checked,
  onChange,
  onCheckedChange,
  disabled,
  id,
  className = "",
  ...aria
}: ToggleProps) {
  const resolvedOnChange = (next: boolean) => {
    onChange?.(next);
    onCheckedChange?.(next);
  };
  const track = checked
    ? "bg-[var(--color-brand)] border-[var(--color-brand)]"
    : "bg-[var(--color-mist)] border-[var(--color-mist)]";
  const translate = checked ? "translate-x-[22px]" : "translate-x-[2px]";
  const inputId = id ?? React.useId();
  return (
    <div className={`inline-flex items-center ${className}`}>
      <label
        htmlFor={inputId}
        className={`relative inline-flex h-[26px] w-[48px] items-center rounded-full border transition-colors duration-[var(--duration-base)] ease-[var(--ease-out)] ${track} ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        <span
          aria-hidden
          className={`pointer-events-none h-[20px] w-[20px] rounded-full bg-white shadow-[0_1px_3px_rgba(23,25,24,0.18)] transition-transform duration-[var(--duration-base)] ease-[var(--ease-out)] ${translate}`}
        />
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          className="sr-only"
          onChange={(e) => resolvedOnChange(e.target.checked)}
          {...aria}
        />
      </label>
    </div>
  );
}

/* ------------------------------------------------------------------------------
   10. IconButton — 44px square, hover surface-subtle. Moss focus.
   ---------------------------------------------------------------------------- */
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "subtle" | "ghost";
  size?: "md" | "sm";
  label: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export function IconButton({
  variant = "default",
  size = "md",
  label,
  icon,
  children,
  className = "",
  ...rest
}: IconButtonProps) {
  const sizeVal = (typeof size === "number" ? "md" : size) as "md" | "sm";
  const s = sizeVal === "md" ? "h-11 w-11" : "h-9 w-9";
  const base = "inline-flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-charcoal)] transition-colors duration-[var(--duration-base)] ease-[var(--ease-out)] disabled:opacity-40 disabled:cursor-not-allowed";
  const v = {
    default: "bg-[var(--color-surface-subtle)] hover:bg-[color-mix(in_oklab,var(--color-surface-subtle),var(--color-ink)_4%)]",
    subtle: "bg-transparent hover:bg-[var(--color-surface-subtle)]",
    ghost: "bg-transparent hover:text-[var(--color-ink)]",
  }[variant];
  const resolvedIcon = icon ?? children;
  return (
    <button type="button" aria-label={label} {...rest} className={`${base} ${s} ${v} ${className}`}>
      <span className="flex h-5 w-5 items-center justify-center">{resolvedIcon}</span>
    </button>
  );
}

/* ------------------------------------------------------------------------------
   11. Avatar — initials fallback, neutral ring. Sizes: sm(32)/md(40)/lg(56)/xl(96).
   ---------------------------------------------------------------------------- */
export interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  shape?: "square" | "circle";
  className?: string;
  alt?: string;
  fallbackInitials?: string | null | undefined;
}

export function Avatar({ src, name, size = "md", shape = "square", className = "", alt, fallbackInitials }: AvatarProps) {
  const szMap = { sm: 32, md: 40, lg: 56, xl: 96 } as const;
  const px = szMap[size];
  const radius = shape === "circle" ? "rounded-full" : "rounded-[var(--radius-lg)]";
  const initials = useMemo(() => {
    const trimmed = (name ?? "").trim();
    if (trimmed) {
      const parts = trimmed.split(/\s+/).filter(Boolean);
      if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "";
      if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    // name empty -> prefer explicit fallbackInitials prop (if non-empty string)
    const fb = typeof fallbackInitials === "string" ? fallbackInitials.trim() : "";
    return fb ? fb.slice(0, 2).toUpperCase() : "";
  }, [name, fallbackInitials]);

  return (
    <div
      className={`relative shrink-0 overflow-hidden border border-[var(--color-mist)] bg-[var(--color-surface-subtle)] text-[var(--color-charcoal)] ${radius} ${className}`}
      style={{ width: px, height: px }}
    >
      {src ? (
        <Image
          src={src}
          alt={alt ?? name ?? "Avatar"}
          fill
          sizes={`${px}px`}
          className="object-cover"
        />
      ) : initials ? (
        <div
          className="flex h-full w-full items-center justify-center font-semibold"
          style={{ fontSize: Math.round(px / 2.6), letterSpacing: "0.02em" }}
        >
          {initials}
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------------------
   12. SectionHeader — label (11px caps stone) + ink heading + right action.
   ---------------------------------------------------------------------------- */
export interface SectionHeaderProps {
  label?: React.ReactNode;
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  id?: string;
}

export function SectionHeader({
  label,
  eyebrow,
  title,
  description,
  action,
  className = "",
  id,
}: SectionHeaderProps) {
  const resolvedLabel = label ?? eyebrow;
  return (
    <div className={`flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between ${className}`}>
      <div className="min-w-0">
        {resolvedLabel ? (
          <div id={id ? `${id}-label` : undefined} className="t-label text-[var(--color-stone)] mb-1.5">
            {resolvedLabel}
          </div>
        ) : null}
        <h2 id={id} className="t-h2 text-[var(--color-ink)]">
          {title}
        </h2>
        {description ? <p className="mt-2 t-body text-[var(--color-graphite)] max-w-2xl">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0 mt-3 sm:mt-0">{action}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------------------------
   13. DataField + DataGroup — structured editorial data, kills the 16-card mess.
   DataField: label (11px caps stone) / value (ink Manrope). Mist separator inside group.
   ---------------------------------------------------------------------------- */
export interface DataFieldProps {
  label: React.ReactNode;
  value?: React.ReactNode;
  valueNode?: React.ReactNode; // alternative full node rendering (e.g. chips)
  hint?: React.ReactNode;
  span?: 1 | 2 | 3;
  action?: React.ReactNode;
  className?: string;
}

export function DataField({ label, value, valueNode, hint, span = 1, action, className = "" }: DataFieldProps) {
  const colCls = span === 1 ? "sm:col-span-1" : span === 2 ? "sm:col-span-2" : "sm:col-span-3";
  return (
    <div className={`min-w-0 py-3.5 border-b border-[var(--color-border-soft)] last:border-b-0 ${colCls} ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="t-label text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--color-stone)] leading-none">
            {label}
          </div>
          <div className="mt-2 text-[14.5px] leading-6 text-[var(--color-ink)] font-sans break-words">
            {valueNode ?? (
              <>
                {value ?? <span className="text-[var(--color-stone)] text-[13px] italic">—</span>}
              </>
            )}
          </div>
          {hint ? <div className="mt-1 t-body-sm text-[var(--color-stone)]">{hint}</div> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}

export interface DataGroupProps {
  label?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
  id?: string;
  children: React.ReactNode;
}

export function DataGroup({
  label,
  title,
  description,
  action,
  columns = 2,
  className = "",
  id,
  children,
}: DataGroupProps) {
  const grid =
    columns === 1
      ? "grid grid-cols-1"
      : columns === 2
      ? "grid grid-cols-1 sm:grid-cols-2 sm:gap-x-10 lg:gap-x-16"
      : "grid grid-cols-1 sm:grid-cols-3 sm:gap-x-10";
  return (
    <section id={id} className={`scroll-mt-24 ${className}`}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between mb-4">
        <div className="min-w-0">
          {label ? <div className="t-label text-[var(--color-stone)] mb-1.5">{label}</div> : null}
          <h3 className="t-h3 text-[var(--color-ink)]">{title}</h3>
          {description ? <p className="mt-1.5 t-body text-[var(--color-graphite)] max-w-2xl">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0 mt-2 sm:mt-0">{action}</div> : null}
      </div>
      <Card padding="none" className="overflow-hidden">
        <div className={`px-5 sm:px-6 ${grid}`}>{children}</div>
      </Card>
    </section>
  );
}

/* ------------------------------------------------------------------------------
   14. TalentHeader + TalentPhoto — profile hero (Spec #16).
   TalentHeader: left photo (TalentPhoto 160px) + editorial name/alias/meta + action bar with 1 primary, 2 tertiary.
   ---------------------------------------------------------------------------- */
export interface TalentPhotoProps {
  src?: string | null;
  photoSrc?: string | null;
  name?: string | null;
  size?: "md" | "lg";
  onClick?: () => void;
  onPhotoEdit?: () => void;
  editable?: boolean;
  photoEditable?: boolean;
  className?: string;
  fallbackInitials?: string;
  photoFallbackInitials?: string;
}

export function TalentPhoto({
  src,
  photoSrc,
  name,
  size = "lg",
  onClick,
  onPhotoEdit,
  editable,
  photoEditable,
  className = "",
  fallbackInitials,
  photoFallbackInitials,
}: TalentPhotoProps) {
  const resolvedSrc = src ?? photoSrc ?? null;
  const resolvedEditable = (editable ?? photoEditable) ? true : false;
  const resolvedInitials = (fallbackInitials ?? photoFallbackInitials) as string | undefined;
  const resolvedClick = onClick ?? onPhotoEdit;
  const px = size === "lg" ? 176 : 120;
  return (
    <div
      onClick={resolvedClick}
      className={`relative overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-mist)] bg-[var(--color-surface-subtle)] ${
        resolvedEditable && resolvedClick ? "cursor-pointer hover:border-[var(--color-brand)] transition-colors" : ""
      } ${className}`}
      style={{ width: px, height: px, aspectRatio: "1 / 1" }}
      role={resolvedClick ? "button" : undefined}
      tabIndex={resolvedClick ? 0 : undefined}
    >
      {resolvedSrc ? (
        <Image
          src={resolvedSrc}
          alt={name ? `${name} talent photo` : "Talent photo"}
          fill
          sizes={`${px}px`}
          className="object-cover"
          unoptimized
        />
      ) : resolvedInitials ? (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand to-brand-light text-white font-editorial text-4xl tracking-tight">
          {String(resolvedInitials).slice(0, 2).toUpperCase()}
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center t-label text-[var(--color-stone)]">
          No photo
        </div>
      )}
      {resolvedEditable ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/40 to-transparent py-3 px-4 t-body text-white opacity-0 hover:opacity-100 transition-opacity">
          Click to edit
        </div>
      ) : null}
    </div>
  );
}

export interface TalentHeaderProps {
  photoUrl?: string | null;
  photoSrc?: string | null;
  name: string;
  alias?: string | null;
  meta?: React.ReactNode;
  statusBadge?: React.ReactNode;
  primaryAction?: { label: string; onClick?: () => void; href?: string; icon?: React.ReactNode; disabled?: boolean; external?: boolean };
  secondaryActions?: {
    label: string;
    onClick?: () => void;
    href?: string;
    icon?: React.ReactNode;
    disabled?: boolean;
    external?: boolean;
  }[];
  onPhotoClick?: () => void;
  onPhotoEdit?: () => void;
  photoEditable?: boolean;
  className?: string;
  photoFallbackInitials?: string;
}

export function TalentHeader({
  photoUrl,
  photoSrc,
  name,
  alias,
  meta,
  statusBadge,
  primaryAction,
  secondaryActions = [],
  onPhotoClick,
  onPhotoEdit,
  photoEditable,
  className = "",
  photoFallbackInitials,
}: TalentHeaderProps) {
  const resolvedPhotoSrc = photoUrl ?? photoSrc ?? null;
  const resolvedPhotoEdit = onPhotoClick ?? onPhotoEdit;
  const [secondary, ...tertiaries] = secondaryActions;
  return (
    <section
      aria-label="Talent profile header"
      className={`relative ${className}`}
    >
      <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-10 py-4 sm:py-6">
        <div className="flex shrink-0 flex-col items-center gap-2 md:items-start">
          <TalentPhoto
            src={resolvedPhotoSrc}
            fallbackInitials={photoFallbackInitials}
            name={name}
            size="lg"
            onClick={resolvedPhotoEdit}
            editable={photoEditable}
          />
          {statusBadge}
        </div>

        <div className="min-w-0 flex-1 flex flex-col justify-between">
          <div className="flex flex-col">
            <h1 className="font-editorial text-[42px] leading-[1.05] sm:text-[44px] text-[var(--color-ink)] tracking-[-0.01em] break-words">
              {name}
            </h1>
            {alias ? (
              <div className="mt-2 text-[14px] leading-6 text-[var(--color-graphite)] font-sans font-medium">
                {alias}
              </div>
            ) : null}
            {meta ? (
              <div className="mt-4 text-[13px] leading-5 text-[var(--color-graphite)] font-sans font-numeric flex flex-wrap items-center gap-x-3 gap-y-2">
                {Array.isArray(meta)
                  ? meta.map((item, idx) => (
                      <span key={idx} className="inline-flex items-center gap-3">
                        {item}
                        {idx < meta.length - 1 ? (
                          <span aria-hidden className="h-1 w-1 rounded-full bg-[var(--color-mist)] inline-block" />
                        ) : null}
                      </span>
                    ))
                  : meta}
              </div>
            ) : null}
          </div>

          {(primaryAction || secondaryActions.length > 0) && (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {primaryAction ? (
                primaryAction.href ? (
                  <Button
                    asChild
                    variant="primary"
                    leftIcon={primaryAction.icon}
                    disabled={primaryAction.disabled}
                    onClick={primaryAction.onClick}
                  >
                    <a
                      href={primaryAction.href}
                      target={primaryAction.external ? "_blank" : undefined}
                      rel={primaryAction.external ? "noopener noreferrer" : undefined}
                    >
                      {primaryAction.label}
                    </a>
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    leftIcon={primaryAction.icon}
                    disabled={primaryAction.disabled}
                    onClick={primaryAction.onClick}
                  >
                    {primaryAction.label}
                  </Button>
                )
              ) : null}
              {secondary ? (
                secondary.href ? (
                  <Button
                    key="secondary"
                    variant="secondary"
                    leftIcon={secondary.icon}
                    disabled={secondary.disabled}
                    onClick={secondary.onClick}
                    asChild
                  >
                    <a
                      href={secondary.href}
                      target={secondary.external ? "_blank" : undefined}
                      rel={secondary.external ? "noopener noreferrer" : undefined}
                    >
                      {secondary.label}
                    </a>
                  </Button>
                ) : (
                  <Button
                    key="secondary"
                    variant="secondary"
                    leftIcon={secondary.icon}
                    disabled={secondary.disabled}
                    onClick={secondary.onClick}
                  >
                    {secondary.label}
                  </Button>
                )
              ) : null}
              {tertiaries.map((a, i) =>
                a.href ? (
                  <Button
                    key={`tertiary-${i}`}
                    variant="tertiary"
                    leftIcon={a.icon}
                    disabled={a.disabled}
                    onClick={a.onClick}
                    asChild
                  >
                    <a
                      href={a.href}
                      target={a.external ? "_blank" : undefined}
                      rel={a.external ? "noopener noreferrer" : undefined}
                    >
                      {a.label}
                    </a>
                  </Button>
                ) : (
                  <Button
                    key={`tertiary-${i}`}
                    variant="tertiary"
                    leftIcon={a.icon}
                    disabled={a.disabled}
                    onClick={a.onClick}
                  >
                    {a.label}
                  </Button>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------------
   15. Tabs — horizontal, underline indicator in Moss. No filled pills.
   ---------------------------------------------------------------------------- */
export interface TabItem {
  id: string;
  label: React.ReactNode;
  count?: number | string;
}
export interface TabsProps {
  tabs: TabItem[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, value, onChange, className = "" }: TabsProps) {
  return (
    <div
      role="tablist"
      className={`flex flex-wrap items-center gap-2 border-b border-[var(--color-mist)] ${className}`}
    >
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(t.id)}
            className={`group relative inline-flex items-center gap-2 h-11 px-4 t-body font-medium transition-colors duration-[var(--duration-base)] ease-[var(--ease-out)] ${
              active ? "text-[var(--color-ink)]" : "text-[var(--color-graphite)] hover:text-[var(--color-ink)]"
            }`}
          >
            <span>{t.label}</span>
            {typeof t.count !== "undefined" ? (
              <span
                className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 t-caption font-semibold ${
                  active ? "bg-[var(--color-brand-light)] text-[var(--color-brand-dark)]" : "bg-[var(--color-surface-subtle)] text-[var(--color-graphite)]"
                }`}
              >
                {t.count}
              </span>
            ) : null}
            <span
              aria-hidden
              className={`absolute inset-x-3 -bottom-px h-0.5 rounded-full transition-all duration-[var(--duration-base)] ease-[var(--ease-out)] ${
                active ? "bg-[var(--color-brand)] opacity-100" : "opacity-0 group-hover:opacity-40 group-hover:bg-[var(--color-mist)]"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------------------
   16. Modal — clean surface, no glass. Radius-12, raised shadow, mist border.
   Overlay: flat translucent black (no blur). Close at z-20 above content.
   ---------------------------------------------------------------------------- */
export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  titleClassName?: string;
  description?: React.ReactNode;
  subtitle?: React.ReactNode;
  subtitleClassName?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  widthClassName?: string;
  footer?: React.ReactNode;
  padding?: "sm" | "md" | "lg";
  role?: string;
  ariaLabelledby?: string;
  children?: React.ReactNode;
  hideClose?: boolean;
  disableOverlayClose?: boolean;
  className?: string;
  bodyClassName?: string;
  glass?: boolean;
  formClassName?: string;
}

export function Modal({
  open,
  onClose,
  title,
  titleClassName,
  description,
  subtitle,
  subtitleClassName,
  maxWidth,
  widthClassName,
  footer,
  padding = "md",
  role = "dialog",
  ariaLabelledby,
  children,
  hideClose,
  disableOverlayClose,
  className = "",
  bodyClassName,
  glass,
  formClassName,
}: ModalProps) {
  const maxW: Record<NonNullable<ModalProps["maxWidth"]>, string> = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    "2xl": "max-w-5xl",
  };
  const pad = padding === "sm" ? "p-4" : padding === "lg" ? "p-8" : "p-6";
  const padX = padding === "sm" ? "px-4" : padding === "lg" ? "px-8" : "px-6";
  const padT = padding === "sm" ? "pt-4" : padding === "lg" ? "pt-8" : "pt-6";
  const padB = padding === "sm" ? "pb-4" : padding === "lg" ? "pb-8" : "pb-6";
  const padClose = padding === "sm" ? "pr-9" : padding === "lg" ? "pr-11" : "pr-10";
  const widthClass = widthClassName ?? (maxWidth ? maxW[maxWidth] : maxW.md);
  const titleId = ariaLabelledby ?? React.useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-[rgba(23,25,24,0.48)] animate-[fade-in_150ms_ease-out]"
        onClick={() => (disableOverlayClose ? undefined : onClose())}
      />
      {/* content */}
      <div
        role={role}
        aria-modal="true"
        aria-labelledby={title && !ariaLabelledby ? titleId : ariaLabelledby}
        className={`relative w-full ${widthClass} max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-mist)] bg-[var(--color-surface)] shadow-[0_8px_24px_rgba(23,25,24,0.08)] ${className} ${formClassName ?? ""} ${bodyClassName ?? ""}`}
      >
        {!hideClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute right-3 top-3 z-20 h-9 w-9 inline-flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-graphite)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-subtle)] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}

        {title || description || subtitle ? (
          <div className={`${padX} ${padT} ${padClose} mb-4 flex-shrink-0`}>
            {title ? (
              <h2 id={titleId} className={`t-h3 text-[var(--color-ink)] ${titleClassName ?? ""}`}>
                {title}
              </h2>
            ) : null}
            {subtitle ? <p className={`mt-1.5 t-body text-[var(--color-graphite)] ${subtitleClassName ?? ""}`}>{subtitle}</p> : null}
            {description ? <p className="mt-1.5 t-body text-[var(--color-graphite)]">{description}</p> : null}
          </div>
        ) : null}

        <div className={`flex-1 min-h-0 overflow-y-auto ${padX} ${title || description || subtitle ? "" : padT} ${padB}`}>
          <div className={title || description || subtitle ? "mt-2" : ""}>{children}</div>
        </div>

        {footer ? (
          <div className={`${padX} ${padB} flex-shrink-0 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end border-t border-[var(--color-mist)] pt-4`}>
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------------
   17. AvatarCropperModal — KEEPS FULL EXISTING pointer-logic intact.
   Only skin changes (inherits neutral Modal; glass styling removed).
   ---------------------------------------------------------------------------- */
export interface AvatarCropperModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (croppedDataUrl: string) => Promise<void> | void;
  imageFile: File | null;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  glass?: boolean;
}

export function AvatarCropperModal({ open, onClose, onSave, imageFile }: AvatarCropperModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [imgDim, setImgDim] = useState<{ w: number; h: number } | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ startX: number; startY: number; ox: number; oy: number } | null>(
    null
  );
  const cropSize = 320;

  useEffect(() => {
    if (!open || !imageFile) {
      setImgUrl(null);
      setImgDim(null);
      setScale(1);
      setOffset({ x: 0, y: 0 });
      setError(null);
      return;
    }
    let revoked = false;
    const url = URL.createObjectURL(imageFile);
    const img = new (Image as unknown as new () => HTMLImageElement)();
    img.onload = () => {
      if (revoked) return;
      const { width, height } = img;
      setImgUrl(url);
      setImgDim({ w: width, h: height });
      const minD = Math.min(width, height);
      const s = cropSize / minD;
      setScale(s);
      setOffset({
        x: (cropSize - width * s) / 2,
        y: (cropSize - height * s) / 2,
      });
    };
    img.onerror = () => setError("Failed to load image. Please try another file.");
    img.src = url;
    return () => {
      revoked = true;
      URL.revokeObjectURL(url);
    };
  }, [open, imageFile]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale((prev) => {
      const next = Math.max(0.2, Math.min(5, prev * (e.deltaY < 0 ? 1.08 : 1 / 1.08)));
      return next;
    });
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!imgUrl) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setDrag({ startX: e.clientX, startY: e.clientY, ox: offset.x, oy: offset.y });
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag) return;
    setOffset({ x: drag.ox + (e.clientX - drag.startX), y: drag.oy + (e.clientY - drag.startY) });
  };
  const onPointerUp = (e: React.PointerEvent) => {
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    setDrag(null);
  };

  const renderCanvas = useCallback(() => {
    if (!canvasRef.current || !imgDim || !imgUrl) return;
    const canvas = canvasRef.current;
    canvas.width = cropSize;
    canvas.height = cropSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, cropSize, cropSize);
    const img = new (Image as unknown as new () => HTMLImageElement)();
    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, cropSize, cropSize);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, cropSize, cropSize);
      ctx.clip();
      ctx.translate(offset.x, offset.y);
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      ctx.restore();
    };
    img.src = imgUrl;
  }, [imgDim, imgUrl, offset, scale]);

  const handleSave = useCallback(async () => {
    if (!canvasRef.current) return;
    setSaving(true);
    setError(null);
    try {
      renderCanvas();
      await new Promise((r) => setTimeout(r, 60));
      const dataUrl = canvasRef.current.toDataURL("image/jpeg", 0.92);
      await onSave(dataUrl);
      onClose();
    } catch (err: any) {
      setError(err?.message ?? "Failed to save avatar.");
    } finally {
      setSaving(false);
    }
  }, [onSave, onClose, renderCanvas]);

  const safeImgDim = imgDim;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Crop profile photo"
      description="Drag to reposition. Scroll to zoom. Your photo will be cropped to a clean square."
      maxWidth="sm"
      padding="md"
      className="role-glass-edit-form"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" loading={saving} onClick={handleSave}>
            Save photo
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center gap-4">
        <div
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="relative overflow-hidden touch-none select-none cursor-grab active:cursor-grabbing rounded-[var(--radius-lg)] border border-[var(--color-mist)] bg-[var(--color-surface-subtle)]"
          style={{ width: cropSize, height: cropSize, maxWidth: "100%", aspectRatio: "1 / 1" }}
        >
          {imgUrl ? (
            <img
              src={imgUrl}
              alt=""
              draggable={false}
              className="absolute top-0 left-0 pointer-events-none will-change-transform origin-top-left"
              style={{
                transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
              }}
              onLoad={() => safeImgDim && null}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center t-label text-[var(--color-stone)]">
              Loading…
            </div>
          )}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[inherit]"
            style={{
              boxShadow:
                "0 0 0 1px rgba(255,255,255,0.6) inset, 0 0 0 9999px rgba(23,25,24,0.28)",
            }}
          />
        </div>
        <div className="w-full">
          <Label>Zoom</Label>
          <input
            type="range"
            min={safeImgDim ? (cropSize / Math.max(safeImgDim.w, safeImgDim.h)).toFixed(3) : "0.3"}
            max="4"
            step="0.01"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="w-full accent-[var(--color-brand)]"
          />
          <div className="mt-2 flex items-center justify-between t-caption text-[var(--color-stone)]">
            <span>Scroll or drag the slider to adjust</span>
            <span>{Math.round(scale * 100)}%</span>
          </div>
        </div>
        {error ? (
          <div className="w-full rounded-[var(--radius-md)] border border-[color-mix(in_oklab,var(--color-error-bg),var(--color-error)_20%)] bg-[var(--color-error-bg)] px-3 py-2 t-body-sm text-[var(--color-error)]">
            {error}
          </div>
        ) : null}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </Modal>
  );
}

/* ------------------------------------------------------------------------------
   18. SettingsSection — one row of settings controls + mist separator below.
   Left: label + description · Right: control + optional secondary save/action.
   ---------------------------------------------------------------------------- */
export interface SettingsSectionProps {
  label?: React.ReactNode;
  title?: React.ReactNode;
  eyebrow?: React.ReactNode;
  description?: React.ReactNode;
  control?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  noDivider?: boolean;
}

export function SettingsSection({
  label,
  title,
  eyebrow,
  description,
  control,
  children,
  footer,
  action,
  className = "",
  noDivider,
}: SettingsSectionProps) {
  const resolvedTitle = title ?? label;
  const resolvedControl = control ?? children;
  const resolvedAction = action ?? footer;
  return (
    <div
      className={`grid grid-cols-1 gap-4 py-6 md:grid-cols-12 md:gap-8 ${
        noDivider ? "" : "border-b border-[var(--color-border-soft)] last:border-b-0"
      } ${className}`}
    >
      <div className="md:col-span-5 min-w-0">
        {eyebrow ? <div className="t-label text-[var(--color-stone)] mb-1.5">{eyebrow}</div> : null}
        <div className="t-h4 text-[var(--color-ink)]">{resolvedTitle}</div>
        {description ? <p className="mt-1.5 t-body-sm text-[var(--color-graphite)] leading-relaxed">{description}</p> : null}
      </div>
      <div className="md:col-span-7 flex flex-col items-start gap-3">
        <div className="w-full flex items-center justify-start md:justify-end gap-4 flex-wrap">
          {resolvedControl}
        </div>
        {resolvedAction ? <div className="w-full flex justify-end">{resolvedAction}</div> : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------------
   19. Settings Nav Sidebar — Account / Appearance / Privacy / Showcase / Notifications / Security.
   Sticky on desktop, horizontal scrollable chips on mobile.
   ---------------------------------------------------------------------------- */
export interface SettingsNavItem {
  id?: string;
  key?: string;
  label: string;
  icon?: React.ReactNode;
}
export interface SettingsNavProps {
  items: SettingsNavItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export function SettingsNav({ items, active, onChange, className = "" }: SettingsNavProps) {
  const keyOf = (it: SettingsNavItem) => (it.id ?? it.key ?? String(it.label));
  return (
    <nav aria-label="Settings" className={`${className}`}>
      <div className="t-label text-[var(--color-stone)] mb-3">Settings</div>
      <div className="md:hidden -mx-1 px-1 flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {items.map((it) => {
          const id = keyOf(it);
          const isActive = id === active;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`inline-flex items-center gap-1.5 h-9 px-3 whitespace-nowrap rounded-full t-body-sm border transition-colors ${
                isActive
                  ? "bg-[var(--color-brand)] text-white border-transparent"
                  : "bg-[var(--color-surface)] text-[var(--color-charcoal)] border-[var(--color-mist)]"
              }`}
            >
              {it.icon}
              {it.label}
            </button>
          );
        })}
      </div>
      <ul className="hidden md:flex flex-col gap-0.5 sticky top-6">
        {items.map((it) => {
          const id = keyOf(it);
          const isActive = id === active;
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onChange(id)}
                aria-current={isActive ? "page" : undefined}
                className={`group relative w-full flex items-center gap-3 rounded-[var(--radius-md)] h-10 px-3 t-body transition-colors duration-[var(--duration-base)] ${
                  isActive
                    ? "text-[var(--color-brand-dark)] bg-[var(--color-brand-light)] font-semibold"
                    : "text-[var(--color-charcoal)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-subtle)]"
                }`}
              >
                <span
                  aria-hidden
                  className={`absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-[var(--color-brand)] ${
                    isActive ? "opacity-100" : "opacity-0"
                  }`}
                />
                {it.icon ? <span className="h-4 w-4">{it.icon}</span> : null}
                {it.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/* ------------------------------------------------------------------------------
   20. EmptyState — neutral illustration/title + description + optional CTA.
   ---------------------------------------------------------------------------- */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] border border-dashed border-[var(--color-mist)] bg-[var(--color-surface)] py-14 px-6 flex flex-col items-center justify-center text-center ${className}`}
    >
      {icon ? (
        <div className="h-12 w-12 rounded-full bg-[var(--color-surface-subtle)] text-[var(--color-stone)] flex items-center justify-center mb-4">
          {icon}
        </div>
      ) : null}
      <h3 className="t-h4 text-[var(--color-ink)]">{title}</h3>
      {description ? <p className="mt-2 t-body text-[var(--color-graphite)] max-w-md">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------------------------
   21. Toast (single) + ToastViewport — WCAG live region, semantic variant tones.
   ---------------------------------------------------------------------------- */
export type ToastTone = "success" | "warning" | "error" | "info" | "default";
export interface ToastItem {
  id: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  tone?: ToastTone;
  durationMs?: number;
}
export interface ToastViewportProps {
  items: ToastItem[];
  onDismiss: (id: string) => void;
}

const toneIcons: Record<ToastTone, React.ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-[var(--color-success)]" />,
  warning: <AlertTriangle className="h-5 w-5 text-[var(--color-warning)]" />,
  error: <AlertCircle className="h-5 w-5 text-[var(--color-error)]" />,
  info: <Info className="h-5 w-5 text-[var(--color-info)]" />,
  default: <Info className="h-5 w-5 text-[var(--color-graphite)]" />,
};
const toneRing: Record<ToastTone, string> = {
  success: "border-l-[var(--color-success)]",
  warning: "border-l-[var(--color-warning)]",
  error: "border-l-[var(--color-error)]",
  info: "border-l-[var(--color-info)]",
  default: "border-l-[var(--color-mist)]",
};

export function ToastViewport({ items, onDismiss }: ToastViewportProps) {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[110] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
    >
      {items.map((t) => (
        <ToastCard key={t.id} toast={t} onClose={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastCard({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  const tone = toast.tone ?? "default";
  const ttl = toast.durationMs ?? 4000;
  useEffect(() => {
    if (ttl <= 0) return;
    const h = setTimeout(onClose, ttl);
    return () => clearTimeout(h);
  }, [ttl, onClose]);
  return (
    <div
      role="status"
      className={`pointer-events-auto w-full sm:max-w-sm rounded-[var(--radius-md)] border border-[var(--color-mist)] border-l-4 ${toneRing[tone]} bg-[var(--color-surface)] p-4 shadow-[0_8px_24px_rgba(23,25,24,0.08)] flex gap-3 items-start`}
    >
      <div className="mt-0.5">{toneIcons[tone]}</div>
      <div className="min-w-0 flex-1">
        <div className="t-body font-semibold text-[var(--color-ink)]">{toast.title}</div>
        {toast.description ? (
          <div className="mt-0.5 t-body-sm text-[var(--color-graphite)]">{toast.description}</div>
        ) : null}
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onClose}
        className="shrink-0 h-7 w-7 inline-flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-stone)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-ink)]"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/* Convenience hook (client only) — returns [items, pushToast, dismiss] */
export function useToasts() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);
  const push = useCallback(
    (t: Omit<ToastItem, "id"> & { id?: string }) => {
      const id = t.id ?? Math.random().toString(36).slice(2);
      setItems((prev) => [...prev, { id, ...t }]);
      return id;
    },
    []
  );
  return useMemo(() => ({ items, push, dismiss }), [items, push, dismiss]);
}

/* ------------------------------------------------------------------------------
   22. PortalLoadingScreen + FullScreenLoadingOverlay (legacy preserved, re-skinned)
   No photo wallpaper, no glass, no Leigacy logo, no gold spinner.
   ---------------------------------------------------------------------------- */
export function PortalLoadingScreen({
  title,
  label,
  message,
  minHeight,
}: {
  title?: string;
  label?: string;
  message?: string;
  minHeight?: string;
}) {
  const displayTitle = title ?? label;
  return (
    <div
      className="flex min-h-screen w-full items-center justify-center bg-[var(--color-bg)]"
      style={{ minHeight: minHeight }}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex flex-col items-center text-center gap-4 px-6 max-w-sm">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="inline-block h-8 w-8 rounded-[10px] bg-[var(--color-brand)]"
            style={{
              backgroundImage:
                "linear-gradient(135deg, var(--color-brand) 0%, var(--color-brand-dark) 100%)",
            }}
          />
          <div className="t-h4 font-editorial tracking-[-0.005em] text-[var(--color-ink)]">
            Talent Portal
          </div>
        </div>
        <div
          className="mt-2 h-1.5 w-48 overflow-hidden rounded-full bg-[var(--color-surface-subtle)]"
          role="status"
          aria-label={displayTitle ?? "Loading"}
        >
          <div
            aria-hidden
            className="h-full w-1/3 rounded-full bg-[var(--color-brand)]"
            style={{
              animation: "tp-indeterminate 1.1s ease-in-out infinite",
            }}
          />
        </div>
        <div className="mt-4 t-h4 text-[var(--color-ink)]">{displayTitle ?? "Loading…"}</div>
        {message ? <div className="t-body-sm text-[var(--color-stone)]">{message}</div> : null}
      </div>
      <style>{`@keyframes tp-indeterminate{0%{margin-left:-33%;}100%{margin-left:100%;}}`}</style>
    </div>
  );
}

export function FullScreenLoadingOverlay({
  open,
  title,
  label,
  message,
  zIndex = 100,
}: {
  open?: boolean;
  title?: string;
  label?: string;
  message?: string;
  zIndex?: number;
}) {
  if (open === false) return null;
  const displayTitle = title ?? label;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-surface)]/95"
      style={{ zIndex }}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex flex-col items-center text-center gap-4 px-6 max-w-sm">
        <div
          className="h-10 w-10 rounded-full border-2 border-[var(--color-brand-light)] border-t-[var(--color-brand)] animate-spin"
          role="status"
        />
        <div className="t-h4 text-[var(--color-ink)]">{displayTitle ?? "Please wait…"}</div>
        {message ? <div className="t-body-sm text-[var(--color-stone)] max-w-xs">{message}</div> : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------------
   23. Dropdown — minimal shell. Menu aligns to trigger, click-outside closes.
   Items: label + icon + danger + onClick.
   ---------------------------------------------------------------------------- */
export interface DropdownItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
}
export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: "start" | "end";
  className?: string;
}

export function Dropdown({ trigger, items, align = "end", className = "" }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative inline-block ${className}`}>
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>
      {open ? (
        <div
          role="menu"
          className={`absolute top-full mt-2 ${
            align === "end" ? "right-0 origin-top-right" : "left-0 origin-top-left"
          } min-w-[220px] overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-mist)] bg-[var(--color-surface)] py-1 shadow-[0_8px_24px_rgba(23,25,24,0.08)]`}
        >
          {items.map((it) => (
            <button
              key={it.id}
              type="button"
              role="menuitem"
              disabled={it.disabled}
              onClick={() => {
                if (it.disabled) return;
                it.onClick?.();
                setOpen(false);
              }}
              className={`w-full flex items-center gap-3 h-10 px-3 t-body transition-colors ${
                it.danger
                  ? "text-[var(--color-error)] hover:bg-[var(--color-error-bg)]"
                  : "text-[var(--color-ink)] hover:bg-[var(--color-surface-subtle)]"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {it.icon ? <span className="h-4 w-4">{it.icon}</span> : null}
              {it.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------------------
   24. AlertBanner — inline banners for success/warning/error/info pages.
   ---------------------------------------------------------------------------- */
export function AlertBanner({
  tone = "info",
  title,
  children,
  onDismiss,
  className = "",
}: {
  tone?: ToastTone;
  title?: React.ReactNode;
  children?: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}) {
  const byTone: Record<ToastTone, string> = {
    success: "bg-[var(--color-success-bg)] border-[color-mix(in_oklab,var(--color-success-bg),var(--color-success)_20%)] text-[var(--color-success)]",
    warning: "bg-[var(--color-warning-bg)] border-[color-mix(in_oklab,var(--color-warning-bg),var(--color-warning)_20%)] text-[var(--color-warning)]",
    error: "bg-[var(--color-error-bg)] border-[color-mix(in_oklab,var(--color-error-bg),var(--color-error)_20%)] text-[var(--color-error)]",
    info: "bg-[var(--color-info-bg)] border-[color-mix(in_oklab,var(--color-info-bg),var(--color-info)_20%)] text-[var(--color-info)]",
    default:
      "bg-[var(--color-surface-subtle)] border-[var(--color-mist)] text-[var(--color-charcoal)]",
  };
  return (
    <div
      role="status"
      className={`flex gap-3 rounded-[var(--radius-md)] border px-4 py-3 ${byTone[tone]} ${className}`}
    >
      <div className="mt-0.5 shrink-0">{toneIcons[tone]}</div>
      <div className="min-w-0 flex-1 t-body">
        {title ? <div className="font-semibold">{title}</div> : null}
        {children}
      </div>
      {onDismiss ? (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          className="shrink-0 h-7 w-7 inline-flex items-center justify-center rounded-[var(--radius-sm)] opacity-70 hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
