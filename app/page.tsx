'use client';

import Image from 'next/image';
import {
  Fragment,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  CalendarDays,
  Clock3,
  Coins,
  CreditCard,
  ReceiptText,
  Trash2,
  WalletCards,
} from 'lucide-react';

import {
  AuctionCapitalSection,
  AuctionMonthSection,
  AuctionOptionsSection,
  AuctionPaymentsSection,
} from '@/components/simulator/auction-sections';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  calculateMonthlyFeeUsd,
  calculatePlan,
  calculateProratedPayment,
  calculateRegistrationUsd,
  calculateTermMonths,
  calculateTotalEntryUsd,
  CERTIFICATES,
  convertUsdToPen,
  DEFAULT_EXCHANGE_RATE,
  formatPen,
  formatUsd,
  GROUP_PROGRESS_OPTIONS,
  MIN_SIMULATOR_VALUE,
  normalizeGroupProgress,
  SCENARIO_NAMES,
  TOTAL_TERM_MONTHS,
} from '@/lib/simulator';

type SavedScenario = {
  name: (typeof SCENARIO_NAMES)[number];
  certificate: number;
  registrationFee: number;
  monthlyPayment: number;
  totalEntry: number;
  groupProgress: number;
  auctionMonth: number;
  auctionPayments: number;
  auctionAmount: number;
  remainingPayments: number;
  exchangeRate: number;
};

type ComparisonRow = {
  label: string;
  emphasis?: boolean;
  primary: (scenario: SavedScenario) => string;
  secondary?: (scenario: SavedScenario) => string;
};

type TimelineDragKind = 'start' | 'linked' | 'end';
type TimelineSegmentKey = 'advance' | 'paid' | 'remaining' | 'advanced';
type TimelineSegmentDisplay = 'full' | 'number' | 'hidden';

type TimelineDragSnapshot = {
  kind: TimelineDragKind;
  pointerId: number;
  originX: number;
  barWidth: number;
  groupProgress: number;
  auctionMonth: number;
  auctionPayments: number;
};

const TIMELINE_AUCTION_MONTH_MAX = 18;
const TIMELINE_AUCTION_PAYMENTS_MAX = 35;

const clampTimelineValue = (value: number, minimum: number, maximum: number) =>
  Math.min(Math.max(value, minimum), maximum);

function TimelineSegmentLabel({
  label,
  value,
  segment,
  onDisplayChange,
}: {
  label: string;
  value: number;
  segment: TimelineSegmentKey;
  onDisplayChange: (
    segment: TimelineSegmentKey,
    display: TimelineSegmentDisplay,
  ) => void;
}) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const fullLabelRef = useRef<HTMLSpanElement>(null);
  const numberRef = useRef<HTMLElement>(null);
  const [display, setDisplay] = useState<TimelineSegmentDisplay>('hidden');

  useLayoutEffect(() => {
    const container = containerRef.current;
    const fullLabel = fullLabelRef.current;
    const number = numberRef.current;
    if (!container || !fullLabel || !number) return;

    const measure = () => {
      const availableWidth = container.getBoundingClientRect().width;
      const fullLabelWidth = fullLabel.getBoundingClientRect().width;
      const numberWidth = number.getBoundingClientRect().width;
      const nextDisplay =
        availableWidth >= fullLabelWidth
          ? 'full'
          : availableWidth >= numberWidth
            ? 'number'
            : 'hidden';

      setDisplay((current) =>
        current === nextDisplay ? current : nextDisplay,
      );
      onDisplayChange(segment, nextDisplay);
    };

    const observer = new ResizeObserver(measure);
    observer.observe(container);
    observer.observe(fullLabel);
    observer.observe(number);
    measure();

    return () => observer.disconnect();
  }, [label, onDisplayChange, segment, value]);

  return (
    <span
      ref={containerRef}
      className="relative flex h-full w-full min-w-0 items-center justify-center overflow-hidden"
    >
      <span
        ref={fullLabelRef}
        className="invisible absolute inline-flex w-max flex-col items-center justify-center whitespace-nowrap px-1.5"
        aria-hidden="true"
      >
        <span className="text-[9px] font-bold leading-none min-[420px]:text-[10px] lg:text-xs">
          {label}
        </span>
        <strong className="text-xl font-extrabold leading-none min-[420px]:text-2xl">
          {value}
        </strong>
      </span>
      <strong
        ref={numberRef}
        className="invisible absolute w-max whitespace-nowrap px-1 text-xl font-extrabold leading-none min-[420px]:text-2xl"
        aria-hidden="true"
      >
        {value}
      </strong>

      {display === 'full' && (
        <span className="inline-flex max-w-full flex-col items-center justify-center whitespace-nowrap px-1.5">
          <span className="text-[9px] font-bold leading-none min-[420px]:text-[10px] lg:text-xs">
            {label}
          </span>
          <strong className="text-xl font-extrabold leading-none min-[420px]:text-2xl">
            {value}
          </strong>
        </span>
      )}
      {display === 'number' && (
        <strong className="whitespace-nowrap px-1 text-xl font-extrabold leading-none min-[420px]:text-2xl">
          {value}
        </strong>
      )}
    </span>
  );
}

export default function Home() {
  const [certificateId, setCertificateId] = useState(CERTIFICATES[0].id);
  const [exchangeRateInput, setExchangeRateInput] = useState(
    String(DEFAULT_EXCHANGE_RATE),
  );
  const [exchangeRate, setExchangeRate] = useState(DEFAULT_EXCHANGE_RATE);
  const [groupProgress, setGroupProgress] = useState(MIN_SIMULATOR_VALUE);
  const [auctionMonth, setAuctionMonth] = useState(MIN_SIMULATOR_VALUE);
  const [auctionPayments, setAuctionPayments] = useState(12);
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const planFigureRef = useRef<HTMLElement>(null);
  const planBarRef = useRef<HTMLDivElement>(null);
  const timelineDragRef = useRef<TimelineDragSnapshot | null>(null);
  const [planFigureWidth, setPlanFigureWidth] = useState(0);
  const [isDesktopTimeline, setIsDesktopTimeline] = useState(false);
  const [timelineSegmentDisplays, setTimelineSegmentDisplays] = useState<
    Record<TimelineSegmentKey, TimelineSegmentDisplay>
  >({
    advance: 'hidden',
    paid: 'hidden',
    remaining: 'hidden',
    advanced: 'hidden',
  });

  const updateTimelineSegmentDisplay = useCallback(
    (segment: TimelineSegmentKey, display: TimelineSegmentDisplay) => {
      setTimelineSegmentDisplays((current) =>
        current[segment] === display
          ? current
          : { ...current, [segment]: display },
      );
    },
    [],
  );

  useEffect(() => {
    const figure = planFigureRef.current;
    if (!figure) return;

    const updateWidth = () => setPlanFigureWidth(figure.clientWidth);
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(figure);

    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const desktopQuery = window.matchMedia('(min-width: 1024px)');
    const updateDesktopTimeline = () =>
      setIsDesktopTimeline(desktopQuery.matches);

    updateDesktopTimeline();
    desktopQuery.addEventListener('change', updateDesktopTimeline);

    return () =>
      desktopQuery.removeEventListener('change', updateDesktopTimeline);
  }, []);
  const selectedCertificate =
    CERTIFICATES.find((certificate) => certificate.id === certificateId) ??
    CERTIFICATES[0];
  const registrationFee = calculateRegistrationUsd(
    selectedCertificate.amountUsd,
  );
  const termMonths = calculateTermMonths(groupProgress);
  const monthlyPayment = calculateMonthlyFeeUsd(
    selectedCertificate.amountUsd,
    termMonths,
  );
  const totalEntry = calculateTotalEntryUsd(
    selectedCertificate.amountUsd,
    monthlyPayment,
  );
  const {
    avanceGrupo: groupAdvance,
    cuotasPagadas: paidPayments,
    cuotasAdelantadas: advancedPayments,
    cuotasRestantes: remainingPayments,
  } = calculatePlan(auctionMonth, auctionPayments, groupProgress);
  const planTimelineMonths =
    groupAdvance + paidPayments + remainingPayments + advancedPayments;
  const startMarkerPercent = (groupAdvance / planTimelineMonths) * 100;
  const auctionMarkerPercent =
    ((groupAdvance + paidPayments) / planTimelineMonths) * 100;
  const endMarkerPercent =
    ((groupAdvance + paidPayments + remainingPayments) / planTimelineMonths) *
    100;
  const raceFlagWidth = isDesktopTimeline ? 72 : 60;
  const auctionFlagWidth = isDesktopTimeline ? 210 : 170;
  const timelineBarWidth = Math.max(planFigureWidth, 1);
  const startFlagPoleOffset = raceFlagWidth * 0.12;
  const endFlagPoleOffset = raceFlagWidth * 0.17;
  const startFlagLeft =
    (startMarkerPercent / 100) * timelineBarWidth - startFlagPoleOffset;
  const auctionFlagLeft =
    (auctionMarkerPercent / 100) * timelineBarWidth -
    auctionFlagWidth * 0.16;
  const endFlagLeft =
    (endMarkerPercent / 100) * timelineBarWidth - endFlagPoleOffset;
  const auctionAmount = monthlyPayment * advancedPayments;
  const timelineSummaryCards = [
    {
      key: 'advance' as const,
      label: 'Avance',
      value: groupAdvance,
      className: 'border-slate-300 text-slate-600',
      style: {
        backgroundColor: 'rgb(226 232 240)',
        backgroundImage:
          'radial-gradient(ellipse at 88% 118%, rgb(148 163 184 / 35%) 0 34%, transparent 35%), linear-gradient(145deg, rgb(248 250 252), rgb(226 232 240))',
      },
      isCompact: timelineSegmentDisplays.advance !== 'full',
    },
    {
      key: 'paid' as const,
      label: 'Pagadas',
      value: paidPayments,
      className: 'border-emerald-300 text-white',
      style: {
        backgroundColor: 'rgb(22 163 74)',
        backgroundImage:
          'radial-gradient(ellipse at 25% 118%, rgb(132 204 22 / 85%) 0 34%, transparent 35%), linear-gradient(145deg, rgb(74 222 128) 0%, rgb(22 163 74) 45%, rgb(21 128 61) 100%)',
      },
      isCompact: timelineSegmentDisplays.paid !== 'full',
    },
    {
      key: 'remaining' as const,
      label: 'Restantes',
      value: remainingPayments,
      className: 'border-blue-300 text-white',
      style: {
        backgroundColor: 'rgb(29 78 216)',
        backgroundImage:
          'radial-gradient(ellipse at 92% 118%, rgb(14 165 233 / 90%) 0 36%, transparent 37%), linear-gradient(145deg, rgb(14 165 233) 0%, rgb(37 99 235) 48%, rgb(30 64 175) 100%)',
      },
      isCompact: timelineSegmentDisplays.remaining !== 'full',
    },
    {
      key: 'advanced' as const,
      label: 'Adelantadas',
      value: advancedPayments,
      className: 'border-primary/60 text-slate-500',
      style: {
        backgroundColor: 'rgb(248 250 252 / 88%)',
        backgroundImage:
          'repeating-linear-gradient(135deg, rgb(100 116 139 / 42%) 0, rgb(100 116 139 / 42%) 1.5px, transparent 1.5px, transparent 8px)',
      },
      isCompact: timelineSegmentDisplays.advanced !== 'full',
    },
  ];
  const {
    cuotasRestantes: proratedRemainingPayments,
    cuotasRestantesProrrateo: prorationRemainingPayments,
    cuotaProrrateadaUsd: proratedPayment,
  } = calculateProratedPayment(
    auctionMonth,
    advancedPayments,
    monthlyPayment,
    termMonths,
  );
  const toPen = (value: number) => convertUsdToPen(value, exchangeRate);

  const updateAuctionMonth = (month: number) => {
    const adjustedPlan = calculatePlan(month, auctionPayments, groupProgress);
    setAuctionMonth(adjustedPlan.cuotasPagadas);
    setAuctionPayments(adjustedPlan.cuotasAdelantadas);
  };

  const updateAuctionPayments = (payments: number) => {
    const adjustedPlan = calculatePlan(auctionMonth, payments, groupProgress);
    setAuctionPayments(adjustedPlan.cuotasAdelantadas);
  };

  const updateGroupProgress = (progress: number) => {
    const normalizedProgress = normalizeGroupProgress(progress);
    const adjustedPlan = calculatePlan(
      auctionMonth,
      auctionPayments,
      normalizedProgress,
    );

    setGroupProgress(normalizedProgress);
    setAuctionPayments(adjustedPlan.cuotasAdelantadas);
  };

  const applyStartTimelineOffset = (
    initialGroupProgress: number,
    initialAuctionMonth: number,
    offset: number,
  ) => {
    const fixedAuctionPosition =
      initialGroupProgress + initialAuctionMonth - MIN_SIMULATOR_VALUE;
    const minimumGroupAdvance = Math.max(
      0,
      fixedAuctionPosition - TIMELINE_AUCTION_MONTH_MAX,
    );
    const maximumGroupAdvance = Math.min(
      GROUP_PROGRESS_OPTIONS.length - MIN_SIMULATOR_VALUE,
      fixedAuctionPosition - MIN_SIMULATOR_VALUE,
    );
    const initialGroupAdvance = initialGroupProgress - MIN_SIMULATOR_VALUE;
    const nextGroupAdvance = clampTimelineValue(
      initialGroupAdvance + offset,
      minimumGroupAdvance,
      maximumGroupAdvance,
    );
    const nextAuctionMonth = fixedAuctionPosition - nextGroupAdvance;

    setGroupProgress(nextGroupAdvance + MIN_SIMULATOR_VALUE);
    setAuctionMonth(nextAuctionMonth);
  };

  const applyLinkedTimelineOffset = (
    initialAuctionMonth: number,
    initialAuctionPayments: number,
    offset: number,
  ) => {
    const minimumOffset = Math.max(
      MIN_SIMULATOR_VALUE - initialAuctionMonth,
      initialAuctionPayments - TIMELINE_AUCTION_PAYMENTS_MAX,
    );
    const maximumOffset = Math.min(
      TIMELINE_AUCTION_MONTH_MAX - initialAuctionMonth,
      initialAuctionPayments - MIN_SIMULATOR_VALUE,
    );
    const nextOffset = clampTimelineValue(offset, minimumOffset, maximumOffset);

    setAuctionMonth(initialAuctionMonth + nextOffset);
    setAuctionPayments(initialAuctionPayments - nextOffset);
  };

  const applyEndTimelineOffset = (
    initialGroupProgress: number,
    initialAuctionMonth: number,
    initialAuctionPayments: number,
    offset: number,
  ) => {
    const maximumPayments = Math.min(
      TIMELINE_AUCTION_PAYMENTS_MAX,
      TOTAL_TERM_MONTHS -
        (initialGroupProgress - MIN_SIMULATOR_VALUE) -
        initialAuctionMonth,
    );
    const nextPayments = clampTimelineValue(
      initialAuctionPayments - offset,
      MIN_SIMULATOR_VALUE,
      maximumPayments,
    );

    setAuctionPayments(nextPayments);
  };

  const startTimelineDrag = (
    kind: TimelineDragKind,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    const bar = planBarRef.current;
    if (!bar) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    timelineDragRef.current = {
      kind,
      pointerId: event.pointerId,
      originX: event.clientX,
      barWidth: bar.getBoundingClientRect().width,
      groupProgress,
      auctionMonth,
      auctionPayments,
    };
  };

  const moveTimelineDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = timelineDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId || drag.barWidth <= 0) {
      return;
    }

    event.preventDefault();
    const offset = Math.round(
      ((event.clientX - drag.originX) / drag.barWidth) * TOTAL_TERM_MONTHS,
    );

    if (drag.kind === 'start') {
      applyStartTimelineOffset(drag.groupProgress, drag.auctionMonth, offset);
      return;
    }

    if (drag.kind === 'end') {
      applyEndTimelineOffset(
        drag.groupProgress,
        drag.auctionMonth,
        drag.auctionPayments,
        offset,
      );
      return;
    }

    applyLinkedTimelineOffset(drag.auctionMonth, drag.auctionPayments, offset);
  };

  const stopTimelineDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = timelineDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    timelineDragRef.current = null;
  };

  const handleTimelineKeyDown = (
    kind: TimelineDragKind,
    event: ReactKeyboardEvent<HTMLButtonElement>,
  ) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

    event.preventDefault();
    const offset = event.key === 'ArrowRight' ? 1 : -1;

    if (kind === 'start') {
      applyStartTimelineOffset(groupProgress, auctionMonth, offset);
      return;
    }

    if (kind === 'end') {
      applyEndTimelineOffset(
        groupProgress,
        auctionMonth,
        auctionPayments,
        offset,
      );
      return;
    }

    applyLinkedTimelineOffset(auctionMonth, auctionPayments, offset);
  };

  const removeScenario = (scenarioIndex: number) => {
    setSavedScenarios((currentScenarios) =>
      currentScenarios
        .filter((_, index) => index !== scenarioIndex)
        .map((scenario, index) => ({
          ...scenario,
          name: SCENARIO_NAMES[index],
        })),
    );
  };

  const comparisonRows: ComparisonRow[] = [
    {
      label: 'Certificado',
      primary: (scenario) => formatUsd(scenario.certificate),
      secondary: (scenario) =>
        formatPen(scenario.certificate * scenario.exchangeRate),
    },
    {
      label: 'Ingreso total',
      emphasis: true,
      primary: (scenario) => formatUsd(scenario.totalEntry),
      secondary: (scenario) =>
        formatPen(scenario.totalEntry * scenario.exchangeRate),
    },
    {
      label: 'Remate',
      primary: (scenario) => `Mes ${scenario.auctionMonth}`,
    },
    {
      label: 'Cuotas',
      primary: (scenario) => String(scenario.auctionPayments),
    },
    {
      label: 'Capital',
      emphasis: true,
      primary: (scenario) => formatUsd(scenario.auctionAmount),
      secondary: (scenario) =>
        formatPen(scenario.auctionAmount * scenario.exchangeRate),
    },
    {
      label: 'Restantes',
      primary: (scenario) => String(scenario.remainingPayments),
    },
    {
      label: 'Avance de Grupo',
      primary: (scenario) => String(scenario.groupProgress),
    },
  ];

  return (
    <main className="min-h-screen bg-background px-3 py-3 sm:px-5 sm:py-4">
      <div className="mx-auto w-full max-w-5xl lg:max-w-[49rem]">
        <header className="mb-3 border-b pb-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">
              Pandero
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Simulador de remate
            </h1>
          </div>
        </header>

        <div className="grid gap-0 bg-transparent lg:grid-cols-12">
          <div className="grid gap-3 bg-transparent lg:col-span-12 lg:grid-cols-[minmax(300px,21rem)_minmax(0,1fr)] lg:items-stretch lg:gap-4">
            <div className="grid gap-3 lg:self-start">
              <section
                className="overflow-hidden rounded-[1.75rem] border border-sky-200/80 bg-white shadow-[0_8px_22px_rgb(15_73_122/12%)]"
                aria-labelledby="certificateTitle"
              >
                <div className="relative overflow-hidden bg-gradient-to-br from-sky-50 via-blue-50 to-sky-100 px-4 pb-5 pt-4">
                  <div className="absolute -bottom-8 left-1/3 h-20 w-64 rotate-[-8deg] rounded-[50%] bg-white/40" />
                  <div className="relative flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center">
                      <h2
                        id="certificateTitle"
                        className="text-xl font-bold tracking-tight text-slate-950"
                      >
                        Certificado
                      </h2>
                    </div>
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-sky-200 bg-white/75 text-primary shadow-sm backdrop-blur-sm">
                      <CreditCard className="size-6" aria-hidden="true" />
                    </span>
                  </div>
                </div>

                <div className="relative -mt-2 rounded-t-[1.7rem] bg-white px-4 pb-4 pt-5">
                  <div className="grid grid-cols-[minmax(0,2fr)_minmax(108px,0.9fr)] gap-2.5">
                    <div>
                      <Label
                        htmlFor="certificate"
                        className="mb-1.5 block text-sm font-medium text-slate-600"
                      >
                        Certificado
                      </Label>
                      <select
                        id="certificate"
                        name="certificate"
                        className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base font-medium outline-none transition focus:border-primary focus:ring-3 focus:ring-primary/15"
                        value={certificateId}
                        onChange={(event) =>
                          setCertificateId(event.target.value)
                        }
                      >
                        {CERTIFICATES.map((certificate) => (
                          <option key={certificate.id} value={certificate.id}>
                            {formatUsd(certificate.amountUsd)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label
                        htmlFor="groupProgress"
                        className="mb-1.5 block whitespace-nowrap text-sm font-medium text-slate-600"
                      >
                        Avance de Grupo
                      </Label>
                      <select
                        id="groupProgress"
                        name="groupProgress"
                        className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base font-medium outline-none transition focus:border-primary focus:ring-3 focus:ring-primary/15"
                        value={groupProgress}
                        onChange={(event) =>
                          updateGroupProgress(Number(event.target.value))
                        }
                      >
                        {GROUP_PROGRESS_OPTIONS.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-sky-200 pt-3">
                    <Label
                      htmlFor="exchangeRate"
                      className="max-w-32 text-sm font-bold leading-tight text-slate-900"
                    >
                      Tipo de cambio referencial
                    </Label>
                    <div className="flex shrink-0 items-center justify-end gap-1.5">
                      <span className="text-sm font-medium text-slate-500">
                        1 USD =
                      </span>
                      <Input
                        id="exchangeRate"
                        name="exchangeRate"
                        type="number"
                        inputMode="decimal"
                        enterKeyHint="done"
                        min="0.01"
                        step="0.01"
                        value={exchangeRateInput}
                        onChange={(event) => {
                          const input = event.target.value;
                          const value = Number.parseFloat(input);

                          setExchangeRateInput(input);
                          if (Number.isFinite(value) && value > 0) {
                            setExchangeRate(value);
                          }
                        }}
                        onBlur={(event) => {
                          const value = Number.parseFloat(
                            event.currentTarget.value,
                          );

                          if (!Number.isFinite(value) || value <= 0) {
                            setExchangeRateInput(String(exchangeRate));
                          }
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            event.currentTarget.blur();
                          }
                        }}
                        className="h-10 w-[4.75rem] rounded-xl px-2 text-center text-base font-medium"
                      />
                      <span className="text-sm font-medium text-slate-500">
                        PEN
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              <section
                className="overflow-hidden rounded-[1.75rem] border border-sky-200/80 bg-white shadow-[0_8px_22px_rgb(15_73_122/12%)]"
                aria-labelledby="certificateSummaryTitle"
              >
                <div className="relative overflow-hidden bg-gradient-to-r from-sky-500 via-blue-600 to-blue-800 px-4 py-4 text-white">
                  <div className="absolute -bottom-8 right-4 h-20 w-52 rotate-[-8deg] rounded-[50%] bg-sky-300/20" />
                  <div className="relative flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-base font-extrabold text-primary shadow-md">
                        1
                      </span>
                      <span className="h-10 w-px shrink-0 bg-white/70" />
                      <span className="min-w-0">
                        <h2
                          id="certificateSummaryTitle"
                          className="text-xl font-extrabold leading-none tracking-tight lg:text-[17px]"
                        >
                          Plan de Financiamiento
                        </h2>
                        <span className="mt-1.5 block text-xs font-medium leading-tight text-white/90">
                          Resumen Pandero 0KM y Seminuevos
                        </span>
                      </span>
                    </div>
                    <Coins className="size-8 shrink-0" aria-hidden="true" />
                  </div>
                </div>

                <dl className="px-3.5 pb-4 pt-3">
                  <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 rounded-2xl border-2 border-sky-300 bg-gradient-to-r from-sky-50 to-blue-50/90 px-3 py-3 shadow-[0_5px_14px_rgb(14_165_233/16%)]">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/80 text-primary shadow-sm">
                      <WalletCards className="size-6" aria-hidden="true" />
                    </span>
                    <dt className="border-l border-sky-300 pl-2.5 text-base font-bold leading-tight text-slate-950">
                      Certificado
                    </dt>
                    <dd className="min-w-0 text-right tabular-nums">
                      <span className="block whitespace-nowrap text-xl font-extrabold leading-none tracking-tight text-primary">
                        {formatUsd(selectedCertificate.amountUsd)}
                      </span>
                      <span className="mt-1 block whitespace-nowrap text-sm font-medium leading-none text-slate-600">
                        {formatPen(toPen(selectedCertificate.amountUsd))}
                      </span>
                    </dd>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 border-b border-sky-100 py-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-primary">
                        <ReceiptText className="size-4.5" aria-hidden="true" />
                      </span>
                      <dt className="text-[15px] font-medium text-slate-800">
                        C. de Inscripción
                      </dt>
                    </div>
                    <dd className="whitespace-nowrap text-right text-lg font-extrabold tracking-tight text-slate-950 tabular-nums">
                      {formatUsd(registrationFee)}
                      <span className="ml-1 text-xs font-medium text-slate-500">
                        (4% + IGV)
                      </span>
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-b border-sky-100 py-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-primary">
                        <CalendarDays className="size-4.5" aria-hidden="true" />
                      </span>
                      <dt className="text-[15px] font-medium text-slate-800">
                        Cuota mensual
                      </dt>
                    </div>
                    <dd className="whitespace-nowrap text-right text-lg font-extrabold tracking-tight text-sky-600 tabular-nums">
                      {formatUsd(monthlyPayment)}
                      <span className="ml-1 text-xs font-medium text-slate-500">
                        {formatPen(toPen(monthlyPayment))}
                      </span>
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-b border-sky-100 py-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-primary">
                        <Clock3 className="size-4.5" aria-hidden="true" />
                      </span>
                      <dt className="text-[15px] font-medium text-slate-800">
                        Plazo
                      </dt>
                    </div>
                    <dd className="whitespace-nowrap text-lg font-extrabold tracking-tight text-slate-950 tabular-nums">
                      {termMonths} meses
                    </dd>
                  </div>
                  <div className="relative mt-3 overflow-hidden rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-blue-800 px-3.5 py-3.5 text-white shadow-md">
                    <span className="absolute inset-y-0 left-[58%] w-16 skew-x-[-28deg] bg-sky-400/25" />
                    <div className="relative flex items-center justify-between gap-3">
                      <dt className="min-w-0">
                        <span className="block text-lg font-extrabold leading-tight">
                          Total para ingreso
                        </span>
                        <span className="mt-1 block text-[11px] font-medium leading-tight text-white/85">
                          (C. de Inscripción + 1ra Cuota)
                        </span>
                      </dt>
                      <dd className="text-right font-bold tracking-tight tabular-nums">
                        <span className="block whitespace-nowrap text-2xl font-extrabold leading-none">
                          {formatUsd(totalEntry)}
                        </span>
                        <span className="mt-1 block whitespace-nowrap text-base font-medium leading-none text-white/90">
                          {formatPen(toPen(totalEntry))}
                        </span>
                      </dd>
                    </div>
                  </div>
                </dl>
              </section>
            </div>

            <div className="flex flex-col gap-3 bg-transparent lg:self-start">
              <div className="order-1 overflow-hidden rounded-3xl border border-primary/15 bg-card shadow-sm">
                <div className="grid gap-0">
                  <AuctionMonthSection
                    auctionMonth={auctionMonth}
                    onMonthChange={updateAuctionMonth}
                  />

                  <AuctionPaymentsSection
                    auctionPayments={auctionPayments}
                    onPaymentsChange={updateAuctionPayments}
                  />

                  <AuctionCapitalSection
                    auctionPayments={auctionPayments}
                    auctionAmountUsd={formatUsd(auctionAmount)}
                    auctionAmountPen={formatPen(toPen(auctionAmount))}
                    optionAPaymentUsd={formatUsd(monthlyPayment)}
                  />
                </div>
              </div>

              <section
                className="relative order-2 overflow-hidden rounded-3xl border border-cyan-200/80 bg-[radial-gradient(circle_at_50%_22%,rgba(56,189,248,0.5),transparent_34%),linear-gradient(180deg,#0f3ca8_0%,#075fd4_48%,#e0f2fe_100%)] px-3.5 pb-3.5 pt-0 shadow-[0_12px_28px_rgba(15,63,150,0.28)] ring-1 ring-white/40 min-[420px]:px-4 min-[420px]:pb-4"
                aria-label="Plan de cuotas"
              >
                <figure
                  ref={planFigureRef}
                  className="relative pt-48 lg:pt-56"
                  aria-label={`${groupAdvance} meses de avance, ${paidPayments} cuotas pagadas con sorteo mensual, ${advancedPayments} adelantadas y ${remainingPayments} restantes. Adjudicación por remate en el mes ${auctionMonth}`}
                >
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 z-10 h-48 overflow-hidden lg:h-56"
                    aria-hidden="true"
                  >
                    <Image
                      src="/assets/remate-suv-neon.png"
                      alt=""
                      width={1774}
                      height={887}
                      className="absolute -left-[6%] top-0 h-full w-[94%] object-contain object-left"
                    />
                    <Image
                      src="/assets/remate-slogan-neon.png"
                      alt=""
                      width={2172}
                      height={724}
                      className="absolute right-[-3%] top-3 h-auto w-[48%] object-contain lg:top-5"
                    />
                  </div>

                  <button
                    type="button"
                    className="absolute top-[132px] z-30 size-[60px] touch-none select-none border-0 bg-transparent p-0 cursor-ew-resize lg:top-[152px] lg:size-[72px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
                    style={{ left: startFlagLeft }}
                    onPointerDown={(event) => startTimelineDrag('start', event)}
                    onPointerMove={moveTimelineDrag}
                    onPointerUp={stopTimelineDrag}
                    onPointerCancel={stopTimelineDrag}
                    onKeyDown={(event) => handleTimelineKeyDown('start', event)}
                    aria-label={`Mover salida del plan. Avance de Grupo ${groupProgress}. Usa las flechas izquierda y derecha para ajustar.`}
                    title="Salida del plan"
                  >
                    <Image
                      src="/assets/remate-inicio-bandera.png"
                      alt=""
                      width={1536}
                      height={1024}
                      unoptimized
                      className="absolute inset-0 size-full object-contain object-bottom"
                    />
                  </button>

                  <span
                    className="pointer-events-none absolute top-[176px] z-[25] h-24 w-16 -translate-x-1/2 lg:top-[205px] lg:h-28 lg:w-20"
                    style={{
                      left: `${auctionMarkerPercent}%`,
                    }}
                    aria-hidden="true"
                  >
                    <Image
                      src="/assets/remate-marcador-acelera.png"
                      alt=""
                      width={512}
                      height={900}
                      unoptimized
                      className="size-full object-contain"
                    />
                  </span>

                  <button
                    type="button"
                    className="absolute top-[236px] z-30 h-[57px] w-[170px] touch-none select-none border-0 bg-transparent p-0 cursor-ew-resize lg:top-[274px] lg:h-[70px] lg:w-[210px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
                    style={{ left: auctionFlagLeft }}
                    onPointerDown={(event) =>
                      startTimelineDrag('linked', event)
                    }
                    onPointerMove={moveTimelineDrag}
                    onPointerUp={stopTimelineDrag}
                    onPointerCancel={stopTimelineDrag}
                    onKeyDown={(event) =>
                      handleTimelineKeyDown('linked', event)
                    }
                    aria-label={`Mover Adjudicación y Fin juntos. Mes de remate ${auctionMonth}, ${auctionPayments} cuotas de remate. Usa las flechas izquierda y derecha para ajustar.`}
                    title="Desliza para mover Adjudicación y Fin juntos"
                  >
                    <Image
                      src="/assets/remate-adjudicacion-acelera.png"
                      alt=""
                      width={2172}
                      height={724}
                      unoptimized
                      className="absolute left-0 top-0 h-[57px] w-[170px] max-w-none object-contain lg:h-[70px] lg:w-[210px]"
                    />
                  </button>

                  <button
                    type="button"
                    className="absolute top-[132px] z-30 size-[60px] touch-none select-none border-0 bg-transparent p-0 cursor-ew-resize lg:top-[152px] lg:size-[72px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    style={{ left: endFlagLeft }}
                    onPointerDown={(event) => startTimelineDrag('end', event)}
                    onPointerMove={moveTimelineDrag}
                    onPointerUp={stopTimelineDrag}
                    onPointerCancel={stopTimelineDrag}
                    onKeyDown={(event) => handleTimelineKeyDown('end', event)}
                    aria-label={`Mover únicamente la llegada. ${auctionPayments} cuotas adelantadas. Usa las flechas izquierda y derecha para ajustar.`}
                    title="Llegada del plan"
                  >
                    <Image
                      src="/assets/remate-fin-bandera.png"
                      alt=""
                      width={1536}
                      height={1024}
                      unoptimized
                      className="absolute inset-0 size-full object-contain object-bottom"
                    />
                  </button>

                  <div ref={planBarRef} className="relative">
                    <div className="flex h-[60px] w-full overflow-hidden rounded-xl border-2 border-cyan-200 bg-muted shadow-[0_0_10px_rgba(34,211,238,0.75),0_0_24px_rgba(37,99,235,0.55)] lg:h-[66px]">
                      {groupAdvance > 0 && (
                        <span
                          className="flex h-full min-w-0 items-center justify-center overflow-hidden text-center text-slate-600"
                          style={{
                            width: `${(groupAdvance / planTimelineMonths) * 100}%`,
                            backgroundColor: 'rgb(226 232 240)',
                            backgroundImage:
                              'radial-gradient(ellipse at 88% 118%, rgb(148 163 184 / 35%) 0 34%, transparent 35%), linear-gradient(145deg, rgb(248 250 252), rgb(226 232 240))',
                          }}
                          title={`Meses de Avance: ${groupAdvance}`}
                        >
                          <TimelineSegmentLabel
                            label="Avance"
                            value={groupAdvance}
                            segment="advance"
                            onDisplayChange={updateTimelineSegmentDisplay}
                          />
                        </span>
                      )}
                      <span
                        className="flex h-full min-w-0 items-center justify-center overflow-hidden text-center text-white"
                        style={{
                          width: `${(paidPayments / planTimelineMonths) * 100}%`,
                          backgroundColor: 'rgb(22 163 74)',
                          backgroundImage:
                            'radial-gradient(ellipse at 25% 118%, rgb(132 204 22 / 85%) 0 34%, transparent 35%), linear-gradient(145deg, rgb(74 222 128) 0%, rgb(22 163 74) 45%, rgb(21 128 61) 100%)',
                        }}
                        title={`Pagadas: ${paidPayments}. Periodo con sorteo mensual`}
                      >
                        <TimelineSegmentLabel
                          label="Pagadas"
                          value={paidPayments}
                          segment="paid"
                          onDisplayChange={updateTimelineSegmentDisplay}
                        />
                      </span>
                      <span
                        className="flex h-full min-w-0 items-center justify-center overflow-hidden border-l-2 border-orange-400 text-center text-white"
                        style={{
                          width: `${(remainingPayments / planTimelineMonths) * 100}%`,
                          backgroundColor: 'rgb(29 78 216)',
                          backgroundImage:
                            'radial-gradient(ellipse at 92% 118%, rgb(14 165 233 / 90%) 0 36%, transparent 37%), linear-gradient(145deg, rgb(14 165 233) 0%, rgb(37 99 235) 48%, rgb(30 64 175) 100%)',
                        }}
                        title={`Restantes: ${remainingPayments}`}
                      >
                        <TimelineSegmentLabel
                          label="Restantes"
                          value={remainingPayments}
                          segment="remaining"
                          onDisplayChange={updateTimelineSegmentDisplay}
                        />
                      </span>
                      <span
                        className="flex h-full min-w-0 items-center justify-center overflow-hidden border-l-2 border-primary/60 text-center text-slate-500"
                        style={{
                          width: `${(advancedPayments / planTimelineMonths) * 100}%`,
                          backgroundColor: 'rgb(248 250 252 / 88%)',
                          backgroundImage:
                            'repeating-linear-gradient(135deg, rgb(100 116 139 / 42%) 0, rgb(100 116 139 / 42%) 1.5px, transparent 1.5px, transparent 8px)',
                        }}
                        title={`Adelantadas y abonadas: ${advancedPayments}`}
                      >
                        <TimelineSegmentLabel
                          label="Adelantadas"
                          value={advancedPayments}
                          segment="advanced"
                          onDisplayChange={updateTimelineSegmentDisplay}
                        />
                      </span>
                    </div>

                    <span
                      className={`${groupProgress === MIN_SIMULATOR_VALUE ? 'rounded-l-xl' : ''} pointer-events-none absolute inset-y-0 z-20 border-2 border-cyan-300`}
                      style={{
                        left: `calc(${startMarkerPercent}% - 1px)`,
                        width: `calc(${endMarkerPercent - startMarkerPercent}% + 2px)`,
                        boxShadow:
                          'inset 0 0 0 1px rgb(255 255 255 / 70%), 0 0 10px rgb(34 211 238 / 55%)',
                      }}
                      title="Plazo de financiamiento: cuotas pagadas y cuotas restantes"
                      aria-hidden="true"
                    />
                  </div>
                  {timelineSummaryCards.some(({ isCompact }) => isCompact) && (
                    <div
                      className="mt-12 grid grid-cols-2 items-start gap-3 lg:mt-16"
                      aria-label="Resumen de cuotas no visible en la barra"
                    >
                      {[
                        timelineSummaryCards.slice(0, 2),
                        timelineSummaryCards.slice(2),
                      ].map((group, groupIndex) => (
                        <div
                          key={groupIndex === 0 ? 'left' : 'right'}
                          className={`flex min-w-0 gap-1.5 ${groupIndex === 0 ? 'flex-row items-stretch justify-start' : 'flex-col items-end min-[540px]:flex-row min-[540px]:justify-end'}`}
                        >
                          {group
                            .filter(({ isCompact }) => isCompact)
                            .map(({ key, label, value, className, style }) => (
                              <span
                                key={key}
                                className={`${className} ${groupIndex === 0 ? 'flex min-w-0 max-w-[5.5rem] flex-1 basis-0 flex-col items-center justify-center gap-0.5 text-center' : 'inline-flex max-w-full items-center gap-1.5'} rounded-xl border px-2 py-1.5 shadow-sm`}
                                style={style}
                              >
                                <strong className="whitespace-nowrap text-[11px] font-bold leading-none min-[420px]:text-xs">
                                  {label}
                                </strong>
                                <strong className="text-base font-extrabold leading-none tabular-nums">
                                  {value}
                                </strong>
                              </span>
                            ))}
                        </div>
                      ))}
                    </div>
                  )}
                </figure>
              </section>

              <div className="order-3">
                <AuctionOptionsSection
                  optionARemainingPayments={proratedRemainingPayments}
                  optionAPaymentUsd={formatUsd(monthlyPayment)}
                  optionAPaymentPen={formatPen(toPen(monthlyPayment))}
                  optionBRemainingPayments={prorationRemainingPayments}
                  optionBPaymentUsd={formatUsd(proratedPayment)}
                  optionBPaymentPen={formatPen(toPen(proratedPayment))}
                />
              </div>
            </div>
          </div>

          {savedScenarios.length > 0 && (
            <section
              className="bg-card p-3 lg:col-span-12"
              aria-labelledby="comparisonTitle"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="section-number">6</span>
                  <h2 id="comparisonTitle" className="section-title">
                    Comparar escenarios
                  </h2>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {savedScenarios.length} de 3
                </span>
              </div>

              <div className="grid gap-2 sm:hidden">
                {savedScenarios.map((scenario, index) => (
                  <article
                    key={scenario.name}
                    className="overflow-hidden rounded-lg border"
                  >
                    <div className="flex items-center justify-between bg-muted/70 px-2.5 py-1.5">
                      <strong className="text-sm">{scenario.name}</strong>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground"
                        onClick={() => removeScenario(index)}
                        aria-label={`Eliminar ${scenario.name}`}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                    <dl className="divide-y">
                      {comparisonRows.map((row) => (
                        <div
                          key={row.label}
                          className={`grid grid-cols-[1fr_auto] items-center gap-3 px-2.5 py-1.5 ${row.emphasis ? 'bg-primary/[0.04]' : ''}`}
                        >
                          <dt
                            className={`text-xs ${row.emphasis ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}
                          >
                            {row.label}
                          </dt>
                          <dd className="text-right text-xs">
                            <strong
                              className={`block ${row.emphasis ? 'text-primary' : ''}`}
                            >
                              {row.primary(scenario)}
                            </strong>
                            {row.secondary && (
                              <span className="block text-[11px] text-muted-foreground">
                                {row.secondary(scenario)}
                              </span>
                            )}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </article>
                ))}
              </div>

              <div
                className="hidden overflow-hidden rounded-lg border text-xs sm:grid"
                style={{
                  gridTemplateColumns: `minmax(78px, 0.8fr) repeat(${savedScenarios.length}, minmax(0, 1fr))`,
                }}
              >
                <div className="flex items-center bg-muted/70 px-2 py-1.5 font-medium text-muted-foreground">
                  Dato
                </div>
                {savedScenarios.map((scenario, index) => (
                  <div
                    key={scenario.name}
                    className="flex min-w-0 items-center justify-between gap-1 border-l bg-muted/70 px-2 py-1.5"
                  >
                    <strong className="truncate">{scenario.name}</strong>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="shrink-0 text-muted-foreground"
                      onClick={() => removeScenario(index)}
                      aria-label={`Eliminar ${scenario.name}`}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}

                {comparisonRows.map((row) => (
                  <Fragment key={row.label}>
                    <div
                      className={`border-t px-2 py-1.5 leading-tight text-muted-foreground ${row.emphasis ? 'bg-primary/[0.04] font-semibold text-foreground' : ''}`}
                    >
                      {row.label}
                    </div>
                    {savedScenarios.map((scenario) => (
                      <div
                        key={`${row.label}-${scenario.name}`}
                        className={`min-w-0 border-t border-l px-2 py-1.5 leading-tight ${row.emphasis ? 'bg-primary/[0.04]' : ''}`}
                      >
                        <strong
                          className={`block break-words ${row.emphasis ? 'text-primary' : ''}`}
                        >
                          {row.primary(scenario)}
                        </strong>
                        {row.secondary && (
                          <span className="mt-0.5 block break-words text-[10px] text-muted-foreground">
                            {row.secondary(scenario)}
                          </span>
                        )}
                      </div>
                    ))}
                  </Fragment>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
