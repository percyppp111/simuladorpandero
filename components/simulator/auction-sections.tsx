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
  auctionAmountUsd: string;
  auctionAmountPen: string;
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
      className="bg-transparent lg:col-span-1"
      aria-labelledby="auctionMonthTitle"
    >
      <div className="h-full rounded-t-3xl border-x border-t border-primary/15 bg-card p-3 min-[420px]:p-4 lg:rounded-tr-none lg:border-r-0">
        <div className="mb-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <div className="flex min-w-0 items-center gap-1">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              3
            </span>
            <div className="grid min-w-0 content-start gap-0.5 pt-px">
              <h2
                id="auctionMonthTitle"
                className="whitespace-nowrap text-xs font-bold leading-tight tracking-tight min-[360px]:text-sm lg:text-base"
              >
                Mes de remate
              </h2>
              <p className="text-[11px] leading-tight text-muted-foreground">
                Decide cuándo avanzar.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 justify-self-end">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary/[0.07] text-primary">
              <CalendarDays className="size-4" aria-hidden="true" />
            </span>
            <label className="sr-only" htmlFor="auctionMonth">
              Seleccionar mes de remate
            </label>
            <span className="relative block">
              <select
                id="auctionMonth"
                name="auctionMonth"
                value={auctionMonth}
                onChange={(event) => onMonthChange(Number(event.target.value))}
                className="h-9 w-[5.5rem] appearance-none rounded-xl border border-primary/15 bg-primary/[0.08] pl-2.5 pr-7 text-xs font-bold text-primary outline-none transition-colors focus:border-primary focus:ring-3 focus:ring-primary/20"
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
              className={`h-8 min-w-0 rounded-lg px-1 text-xs font-semibold shadow-none transition-colors duration-150 active:translate-y-0 lg:h-9 lg:text-sm ${
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
  auctionAmountUsd,
  auctionAmountPen,
  optionARemainingPayments,
  optionAPaymentUsd,
  optionAPaymentPen,
  optionBRemainingPayments,
  optionBPaymentUsd,
  optionBPaymentPen,
}: AuctionPaymentsSectionProps) {
  return (
    <>
      <section
        className="bg-transparent lg:col-span-1"
        aria-labelledby="auctionPaymentsTitle"
      >
        <div className="h-full border-x border-t border-primary/15 bg-card p-3 min-[420px]:p-4 lg:rounded-tr-3xl">
          <div className="mb-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
            <div className="flex min-w-0 items-center gap-1">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                4
              </span>
              <div className="grid min-w-0 content-start gap-0.5 pt-px">
                <h2
                  id="auctionPaymentsTitle"
                  className="whitespace-nowrap text-xs font-bold leading-tight tracking-tight min-[360px]:text-sm lg:text-base"
                >
                  Cuotas de remate
                </h2>
                <p className="text-[11px] leading-tight text-muted-foreground">
                  Tú defines el monto
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 justify-self-end">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary/[0.07] text-primary">
                <CircleDollarSign className="size-4.5" aria-hidden="true" />
              </span>
              <label className="sr-only" htmlFor="auctionPayments">
                Seleccionar cuotas de remate
              </label>
              <span className="relative block">
                <select
                  id="auctionPayments"
                  name="auctionPayments"
                  value={auctionPayments}
                  onChange={(event) =>
                    onPaymentsChange(Number(event.target.value))
                  }
                  className="h-9 w-24 appearance-none rounded-xl border border-primary/15 bg-primary/[0.08] pl-2 pr-6 text-xs font-bold text-primary outline-none transition-colors focus:border-primary focus:ring-3 focus:ring-primary/20"
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
                className={`h-8 min-w-0 rounded-lg px-1 text-xs font-semibold shadow-none transition-colors duration-150 active:translate-y-0 lg:h-9 lg:text-sm ${
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

      <section
        className="bg-transparent lg:col-span-2"
        aria-labelledby="auctionCapitalTitle"
      >
        <div className="rounded-b-3xl border border-cyan-300 bg-gradient-to-br from-sky-500 via-primary to-blue-800 p-3 text-white shadow-md min-[420px]:p-4">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2">
            <span className="flex size-9 items-center justify-center rounded-full bg-white/15 text-white">
              <Banknote className="size-4.5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <h2
                id="auctionCapitalTitle"
                className="whitespace-nowrap text-base font-bold tracking-tight text-white lg:text-lg"
              >
                Capital de Remate
              </h2>
              <span className="mt-1 block whitespace-nowrap text-left text-sm font-medium not-italic leading-none text-white/90">
                {auctionPayments} cuotas × US${' '}
                {optionAPaymentUsd.replace(/^\$/, '')}
              </span>
            </span>
            <span className="min-w-0 text-right">
              <strong className="block max-w-full whitespace-nowrap text-base font-bold tracking-tight text-white tabular-nums min-[360px]:text-lg min-[640px]:text-xl">
                {auctionAmountUsd}
              </strong>
              <span className="mt-0.5 block max-w-full whitespace-nowrap text-xs font-medium text-white/85 tabular-nums">
                {auctionAmountPen}
              </span>
            </span>
          </div>
        </div>
        <div className="mt-3 space-y-3 rounded-3xl border border-primary/15 bg-card p-3 shadow-sm">
          <div>
            <div className="border-b border-primary/15 px-1 pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-extrabold leading-tight tracking-tight text-primary">
                    Adapta tus últimas cuotas a tu objetivo
                  </h3>
                  <span
                    className="mt-1 block h-0.5 w-36 rounded-full bg-amber-400"
                    aria-hidden="true"
                  />
                </div>
                <span className="flex size-10 shrink-0 -rotate-6 items-center justify-center rounded-full bg-amber-100 text-primary">
                  <Flag className="size-6 fill-current" aria-hidden="true" />
                </span>
              </div>
            </div>
          </div>
          <dl className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
            <div className="rounded-3xl border border-sky-200 bg-card p-3 shadow-sm">
              <dt className="grid min-w-0 grid-cols-2 items-center gap-x-2 border-b border-primary/15 pb-2">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-blue-600">
                    <TrendingUp className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <strong className="block truncate text-lg font-bold text-primary">
                      Opción A
                    </strong>
                    <span className="block truncate text-sm font-medium text-foreground/80">
                      Mantener cuota
                    </span>
                  </span>
                </span>
                <span className="inline-flex w-fit max-w-full min-w-0 items-center justify-center justify-self-center gap-1.5 rounded-2xl bg-sky-100 px-2 py-1.5 text-center text-[9px] font-semibold leading-tight text-blue-600">
                  <Star
                    className="size-3 shrink-0 fill-current"
                    aria-hidden="true"
                  />
                  <span className="min-w-0">Termina antes</span>
                </span>
              </dt>
              <dd className="grid grid-cols-2 divide-x divide-primary/15 pt-2 text-center">
                <span className="px-2">
                  <span className="block text-xs text-muted-foreground">
                    Cuotas restantes
                  </span>
                  <strong className="mt-1 block text-3xl font-bold leading-none tracking-tight">
                    {optionARemainingPayments}
                  </strong>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    cuotas
                  </span>
                </span>
                <span className="min-w-0 px-2">
                  <span className="block text-xs text-muted-foreground">
                    Cuota mensual
                  </span>
                  <strong className="mt-1 block truncate text-xl font-bold text-primary">
                    {optionAPaymentUsd}
                  </strong>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {optionAPaymentPen}
                  </span>
                </span>
              </dd>
            </div>
            <div className="rounded-3xl border border-emerald-200 bg-card p-3 shadow-sm">
              <dt className="grid min-w-0 grid-cols-2 items-center gap-x-2 border-b border-primary/15 pb-2">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                    <TrendingDown className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <strong className="block truncate text-lg font-bold text-primary">
                      Opción B
                    </strong>
                    <span className="block truncate text-sm font-medium text-foreground/80">
                      Reducir cuota
                    </span>
                  </span>
                </span>
                <span className="inline-flex w-fit max-w-full min-w-0 items-center justify-center justify-self-center gap-1.5 rounded-2xl bg-emerald-100/80 px-2 py-1.5 text-center text-[9px] font-semibold leading-tight text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                  <Leaf className="size-3 shrink-0" aria-hidden="true" />
                  <span className="min-w-0">Cuota más cómoda</span>
                </span>
              </dt>
              <dd className="grid grid-cols-2 divide-x divide-primary/15 pt-2 text-center">
                <span className="px-2">
                  <span className="block text-xs text-muted-foreground">
                    Cuotas restantes
                  </span>
                  <strong className="mt-1 block text-3xl font-bold leading-none tracking-tight">
                    {optionBRemainingPayments}
                  </strong>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    cuotas
                  </span>
                </span>
                <span className="min-w-0 px-2">
                  <span className="block text-xs text-muted-foreground">
                    Cuota mensual
                  </span>
                  <strong className="mt-1 block truncate text-xl font-bold text-primary">
                    {optionBPaymentUsd}
                  </strong>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {optionBPaymentPen}
                  </span>
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </>
  );
}
