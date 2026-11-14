import {
  Banknote,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  Flag,
  Info,
  Leaf,
  Star,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { MIN_SIMULATOR_VALUE } from '@/lib/simulator';

const AUCTION_MONTH_MAX = 18;
const AUCTION_MONTH_PRESETS = [1, 3, 6, 9, 12, 18] as const;
const AUCTION_PAYMENTS_MAX = 35;
const AUCTION_PAYMENT_PRESETS = [5, 10, 15, 20, 25, 30] as const;
const AUCTION_MONTH_OPTIONS = Array.from(
  { length: AUCTION_MONTH_MAX },
  (_, index) => index + MIN_SIMULATOR_VALUE,
);
const AUCTION_PAYMENT_OPTIONS = Array.from(
  { length: AUCTION_PAYMENTS_MAX },
  (_, index) => index + MIN_SIMULATOR_VALUE,
);

type AuctionMonthSectionProps = {
  auctionMonth: number;
  onMonthChange: (month: number) => void;
};

type AuctionPaymentsSectionProps = {
  auctionPayments: number;
  onPaymentsChange: (payments: number) => void;
};

type AuctionCapitalSectionProps = {
  auctionPayments: number;
  auctionAmountUsd: string;
  auctionAmountPen: string;
  optionAPaymentUsd: string;
};

type AuctionOptionsSectionProps = {
  optionARemainingPayments: number;
  optionAPaymentUsd: string;
  optionAPaymentPen: string;
  optionBRemainingPayments: number;
  optionBPaymentUsd: string;
  optionBPaymentPen: string;
};

export function AuctionMonthSection({
  auctionMonth,
  onMonthChange,
}: AuctionMonthSectionProps) {
  return (
    <section
      className="bg-transparent"
      aria-labelledby="auctionMonthTitle"
    >
      <div className="h-full border-b border-primary/10 bg-card p-3 min-[420px]:p-4">
        <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <div className="flex min-w-0 items-center gap-1">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/[0.07] text-primary">
              <CalendarDays className="size-4" aria-hidden="true" />
            </span>
            <div className="grid min-w-0 content-start gap-0.5 pt-px">
              <h2
                id="auctionMonthTitle"
                className="whitespace-nowrap text-sm font-extrabold leading-tight tracking-tight min-[360px]:text-base"
              >
                Mes de adjudicación
              </h2>
              <p className="text-xs font-medium leading-tight text-muted-foreground">
                Decide cuándo avanzar.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 justify-self-end">
            <label className="sr-only" htmlFor="auctionMonth">
              Seleccionar mes de adjudicación
            </label>
            <span className="relative block">
              <select
                id="auctionMonth"
                name="auctionMonth"
                value={auctionMonth}
                onChange={(event) => onMonthChange(Number(event.target.value))}
                className="h-10 w-[5.75rem] appearance-none rounded-xl border border-primary/15 bg-primary/[0.08] pl-2.5 pr-7 text-sm font-extrabold text-primary outline-none transition-colors focus:border-primary focus:ring-3 focus:ring-primary/20"
              >
                {AUCTION_MONTH_OPTIONS.map((month) => (
                  <option key={month} value={month}>
                    Mes {month}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-primary"
                aria-hidden="true"
              />
            </span>
          </div>
        </div>
        <div className="grid grid-cols-6 gap-1">
          {AUCTION_MONTH_PRESETS.map((month) => (
            <Button
              key={month}
              type="button"
              size="sm"
              variant={auctionMonth === month ? 'default' : 'outline'}
              className={`h-9 min-w-0 rounded-xl px-1 text-sm font-bold shadow-none transition-colors duration-150 active:translate-y-0 ${
                auctionMonth === month
                  ? ''
                  : 'border-border/80 bg-background/80 hover:bg-muted'
              }`}
              onClick={() => onMonthChange(month)}
              aria-pressed={auctionMonth === month}
            >
              {month}
            </Button>
          ))}
        </div>
        {auctionMonth > MIN_SIMULATOR_VALUE && (
          <p className="mt-1.5 flex items-center gap-1.5 border-t border-primary/10 pt-1.5 text-[10px] leading-snug text-muted-foreground">
            <Info className="size-3 shrink-0" aria-hidden="true" />
            Chance de adjudicar por sorteo antes del remate
          </p>
        )}
      </div>
    </section>
  );
}

export function AuctionPaymentsSection({
  auctionPayments,
  onPaymentsChange,
}: AuctionPaymentsSectionProps) {
  return (
    <section
      className="bg-transparent"
      aria-labelledby="auctionPaymentsTitle"
    >
      <div className="h-full border-b border-primary/10 bg-card p-3 min-[420px]:p-4">
        <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <div className="flex min-w-0 items-center gap-1">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/[0.07] text-primary">
              <CircleDollarSign className="size-4.5" aria-hidden="true" />
            </span>
            <div className="grid min-w-0 content-start gap-0.5 pt-px">
              <h2
                id="auctionPaymentsTitle"
                className="whitespace-nowrap text-sm font-extrabold leading-tight tracking-tight min-[360px]:text-base"
              >
                Cuotas a adelantar
              </h2>
              <p className="text-xs font-medium leading-tight text-muted-foreground">
                Tú defines el monto
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 justify-self-end">
            <label className="sr-only" htmlFor="auctionPayments">
              Seleccionar cuotas a adelantar
            </label>
            <span className="relative block">
              <select
                id="auctionPayments"
                name="auctionPayments"
                value={auctionPayments}
                onChange={(event) =>
                  onPaymentsChange(Number(event.target.value))
                }
                className="h-10 w-28 appearance-none rounded-xl border border-primary/15 bg-primary/[0.08] pl-2.5 pr-7 text-sm font-extrabold text-primary outline-none transition-colors focus:border-primary focus:ring-3 focus:ring-primary/20"
              >
                {AUCTION_PAYMENT_OPTIONS.map((payments) => (
                  <option key={payments} value={payments}>
                    {payments} Cuotas
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-primary"
                aria-hidden="true"
              />
            </span>
          </div>
        </div>
        <div className="grid grid-cols-6 gap-1">
          {AUCTION_PAYMENT_PRESETS.map((payments) => (
            <Button
              key={payments}
              type="button"
              size="sm"
              variant={auctionPayments === payments ? 'default' : 'outline'}
              className={`h-9 min-w-0 rounded-xl px-1 text-sm font-bold shadow-none transition-colors duration-150 active:translate-y-0 ${
                auctionPayments === payments
                  ? ''
                  : 'border-border/80 bg-background/80 hover:bg-muted'
              }`}
              onClick={() => onPaymentsChange(payments)}
              aria-pressed={auctionPayments === payments}
            >
              {payments}
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AuctionCapitalSection({
  auctionPayments,
  auctionAmountUsd,
  auctionAmountPen,
  optionAPaymentUsd,
}: AuctionCapitalSectionProps) {
  return (
    <section
      className="bg-card px-3 pb-3 pt-3 min-[420px]:px-4 min-[420px]:pb-4 min-[420px]:pt-4"
      aria-labelledby="auctionCapitalTitle"
    >
      <div className="rounded-2xl border border-cyan-300 bg-gradient-to-br from-sky-500 via-primary to-blue-800 p-3.5 text-white shadow-md min-[420px]:p-4">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2.5 max-[389px]:gap-x-1.5">
          <span className="flex size-10 items-center justify-center rounded-xl bg-white/15 text-white max-[389px]:size-9">
            <Banknote className="size-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <h2
              id="auctionCapitalTitle"
              className="whitespace-nowrap text-lg font-extrabold tracking-tight text-white max-[389px]:text-[17px] min-[420px]:text-xl"
            >
              Capital de Remate
            </h2>
            <span className="mt-1 block whitespace-nowrap text-left text-sm font-medium not-italic leading-none text-white/90 max-[389px]:text-xs min-[420px]:text-[15px]">
              {auctionPayments} cuotas × US${' '}
              {optionAPaymentUsd.replace(/^\$/, '')}
            </span>
          </span>
          <span className="min-w-0 text-right">
            <strong className="block max-w-full whitespace-nowrap text-xl font-extrabold leading-none tracking-tight text-white tabular-nums max-[389px]:text-lg min-[420px]:text-2xl">
              {auctionAmountUsd}
            </strong>
            <span className="mt-1 block max-w-full whitespace-nowrap text-sm font-medium leading-none text-white/90 tabular-nums max-[389px]:text-xs">
              {auctionAmountPen}
            </span>
          </span>
        </div>
      </div>
    </section>
  );
}

export function AuctionOptionsSection({
  optionARemainingPayments,
  optionAPaymentUsd,
  optionAPaymentPen,
  optionBRemainingPayments,
  optionBPaymentUsd,
  optionBPaymentPen,
}: AuctionOptionsSectionProps) {
  return (
    <section aria-labelledby="auctionOptionsTitle">
      <div className="space-y-3 rounded-3xl border border-primary/15 bg-card p-3.5 shadow-sm min-[420px]:p-4">
        <div>
          <div className="border-b border-primary/15 px-1 pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3
                  id="auctionOptionsTitle"
                  className="max-w-[28rem] text-xl font-extrabold leading-tight tracking-tight text-primary min-[420px]:text-2xl lg:text-[28px]"
                >
                  Adapta tus últimas cuotas a tu objetivo
                </h3>
                <span
                  className="mt-1 block h-0.5 w-36 rounded-full bg-amber-400"
                  aria-hidden="true"
                />
              </div>
              <span className="flex size-11 shrink-0 -rotate-6 items-center justify-center rounded-full bg-amber-100 text-primary">
                <Flag className="size-6 fill-current" aria-hidden="true" />
              </span>
            </div>
          </div>
        </div>
        <dl className="space-y-2">
          <div className="rounded-3xl border border-sky-300 bg-gradient-to-br from-sky-100 via-blue-50 to-white p-3.5 shadow-[0_7px_18px_rgb(14_165_233/16%)] min-[420px]:p-4 lg:p-5">
            <dt className="flex min-w-0 items-center gap-2 border-b border-primary/15 pb-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/80 text-blue-600 shadow-sm lg:size-11">
                <TrendingUp className="size-5.5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex min-w-0 items-center gap-2">
                  <strong className="shrink-0 whitespace-nowrap text-lg font-extrabold leading-tight text-primary min-[380px]:text-xl lg:text-[22px]">
                    Opción A
                  </strong>
                  <span className="inline-flex w-fit max-w-full shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl border border-blue-300 bg-blue-100/95 px-2.5 py-2 text-center text-[11px] font-extrabold leading-none text-blue-700 shadow-md min-[360px]:text-xs lg:text-sm">
                    <Star
                      className="size-4 shrink-0 fill-current"
                      aria-hidden="true"
                    />
                    <span className="whitespace-nowrap">Termina antes</span>
                  </span>
                </span>
                <span className="block whitespace-nowrap text-base font-medium text-foreground/80 lg:text-lg">
                  Mantener cuota actual
                </span>
              </span>
            </dt>
            <dd className="grid grid-cols-2 divide-x divide-primary/15 pt-3 text-center">
              <span className="px-2">
                <span className="block text-sm font-medium text-muted-foreground lg:text-base">
                  Cuotas restantes
                </span>
                <strong className="mt-1.5 block text-4xl font-extrabold leading-none tracking-tight lg:text-[44px]">
                  {optionARemainingPayments}
                </strong>
                <span className="mt-1 block text-sm font-medium text-muted-foreground lg:text-base">
                  cuotas
                </span>
              </span>
              <span className="min-w-0 px-2">
                <span className="block text-sm font-medium text-muted-foreground lg:text-base">
                  Cuota mensual
                </span>
                <strong className="mt-1.5 block truncate text-2xl font-extrabold leading-none tracking-tight text-primary lg:text-[32px]">
                  {optionAPaymentUsd}
                </strong>
                <span className="mt-1.5 block truncate text-sm font-medium text-muted-foreground lg:text-lg">
                  {optionAPaymentPen}
                </span>
              </span>
            </dd>
          </div>
          <div className="rounded-3xl border border-emerald-300 bg-gradient-to-br from-emerald-100 via-green-50 to-white p-3.5 shadow-[0_7px_18px_rgb(16_185_129/16%)] min-[420px]:p-4 lg:p-5">
            <dt className="flex min-w-0 items-center gap-2 border-b border-primary/15 pb-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/80 text-emerald-700 shadow-sm dark:bg-emerald-950/50 dark:text-emerald-300 lg:size-11">
                <TrendingDown className="size-5.5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex min-w-0 items-center gap-2">
                  <strong className="shrink-0 whitespace-nowrap text-lg font-extrabold leading-tight text-primary min-[380px]:text-xl lg:text-[22px]">
                    Opción B
                  </strong>
                  <span className="inline-flex w-fit max-w-full shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl border border-emerald-300 bg-emerald-100/95 px-2.5 py-2 text-center text-[11px] font-extrabold leading-none text-emerald-800 shadow-md min-[360px]:text-xs dark:bg-emerald-950/50 dark:text-emerald-300 lg:text-sm">
                    <Leaf className="size-4 shrink-0" aria-hidden="true" />
                    <span className="whitespace-nowrap">Cuota más cómoda</span>
                  </span>
                </span>
                <span className="block whitespace-nowrap text-base font-medium text-foreground/80 lg:text-lg">
                  Reducir cuota
                </span>
              </span>
            </dt>
            <dd className="grid grid-cols-2 divide-x divide-primary/15 pt-3 text-center">
              <span className="px-2">
                <span className="block text-sm font-medium text-muted-foreground lg:text-base">
                  Cuotas restantes
                </span>
                <strong className="mt-1.5 block text-4xl font-extrabold leading-none tracking-tight lg:text-[44px]">
                  {optionBRemainingPayments}
                </strong>
                <span className="mt-1 block text-sm font-medium text-muted-foreground lg:text-base">
                  cuotas
                </span>
              </span>
              <span className="min-w-0 px-2">
                <span className="block text-sm font-medium text-muted-foreground lg:text-base">
                  Cuota mensual
                </span>
                <strong className="mt-1.5 block truncate text-2xl font-extrabold leading-none tracking-tight text-primary lg:text-[32px]">
                  {optionBPaymentUsd}
                </strong>
                <span className="mt-1.5 block truncate text-sm font-medium text-muted-foreground lg:text-lg">
                  {optionBPaymentPen}
                </span>
              </span>
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
