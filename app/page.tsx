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
  Award,
  CalendarDays,
  CarFront,
  Clock3,
  CreditCard,
  DollarSign,
  Download,
  FileText,
  Landmark,
  LoaderCircle,
  Phone,
  ReceiptText,
  Trash2,
  UserRound,
} from 'lucide-react';

import { AuctionSimulationSection } from '@/components/simulator/auction-sections';
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
const ADVISORS = [
  { name: 'Percy Flores', phone: '963 845 676' },
  { name: 'Miriam Valer', phone: '907 715 021' },
  { name: 'Hiromi Sato', phone: '972 211 532' },
  { name: 'Wilmer Chapoñan', phone: '' },
  { name: 'Jhosue Pajuelo', phone: '906 083 677' },
  { name: 'Fanny Bravo', phone: '994 295 923' },
  { name: 'Yasser Ortega', phone: '921 409 523' },
] as const;

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
  const [administrationRate, setAdministrationRate] = useState(0.21);
  const [advisorName, setAdvisorName] = useState('Percy Flores');
  const [advisorPhone, setAdvisorPhone] = useState('963 845 676');
  const [clientName, setClientName] = useState('Julian Robles Paredes');
  const [proposalDate] = useState(() =>
    new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Lima',
    }).format(new Date()),
  );
  const [exchangeRateInput, setExchangeRateInput] = useState(
    String(DEFAULT_EXCHANGE_RATE),
  );
  const [exchangeRate, setExchangeRate] = useState(DEFAULT_EXCHANGE_RATE);
  const [groupProgress, setGroupProgress] = useState(MIN_SIMULATOR_VALUE);
  const [auctionMonth, setAuctionMonth] = useState(MIN_SIMULATOR_VALUE);
  const [auctionPayments, setAuctionPayments] = useState(12);
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const financingSummaryRef = useRef<HTMLElement>(null);
  const auctionSummaryRef = useRef<HTMLDivElement>(null);
  const [downloadingSummary, setDownloadingSummary] = useState<
    'financing' | 'auction' | null
  >(null);
  const [downloadError, setDownloadError] = useState('');
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

  const updateAdvisor = (name: string) => {
    const advisor = ADVISORS.find((item) => item.name === name);
    setAdvisorName(name);
    setAdvisorPhone(advisor?.phone ?? '');
  };

  const downloadSummary = async (summary: 'financing' | 'auction') => {
    const node = summary === 'financing'
      ? financingSummaryRef.current
      : auctionSummaryRef.current?.querySelector<HTMLElement>('section');
    if (!node || downloadingSummary) return;

    setDownloadingSummary(summary);
    setDownloadError('');
    try {
      await document.fonts.ready;
      const { getFontEmbedCSS, toBlob, toSvg } = await import('html-to-image');
      const options = {
        preferredFontFormat: 'woff2',
        includeQueryParams: true,
      };
      const fontEmbedCSS = await getFontEmbedCSS(node, options);
      const { width, height } = node.getBoundingClientRect();
      const outputWidth = 1200;
      const outputHeight = Math.ceil(height * outputWidth / width);
      let blob: Blob | null;

      if (summary === 'auction') {
        const images = [...node.querySelectorAll('img')];
        await Promise.all(
          images.map((image) => {
            if (image.complete) return Promise.resolve();
            return Promise.race([
              image.decode().catch(() => undefined),
              new Promise<void>((resolve) => window.setTimeout(resolve, 2_000)),
            ]);
          }),
        );
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() => resolve()),
          ),
        );
        blob = await toBlob(node, {
          ...options,
          width,
          height,
          canvasWidth: outputWidth,
          canvasHeight: outputHeight,
          pixelRatio: 1,
          backgroundColor: '#ffffff',
          fontEmbedCSS,
          skipAutoScale: true,
        });
      } else {
        const fontAttribute = 'data-summary-export-font-size';
        const elements = [node, ...node.querySelectorAll<HTMLElement | SVGElement>('*')];
        const previousAttributes = elements.map((element) =>
          element.getAttribute(fontAttribute),
        );
        let svgUrl: string;

        // Preserve fractional font sizes that the image renderer rounds down.
        try {
          elements.forEach((element) => {
            element.setAttribute(fontAttribute, getComputedStyle(element).fontSize);
          });
          svgUrl = await toSvg(node, {
            ...options,
            width,
            height,
            backgroundColor: '#ffffff',
            fontEmbedCSS,
          });
        } finally {
          elements.forEach((element, index) => {
            const previous = previousAttributes[index];
            if (previous === null) element.removeAttribute(fontAttribute);
            else element.setAttribute(fontAttribute, previous);
          });
        }

        const svg = new DOMParser().parseFromString(
          decodeURIComponent(svgUrl.slice(svgUrl.indexOf(',') + 1)),
          'image/svg+xml',
        );
        svg.querySelectorAll<HTMLElement | SVGElement>(`[${fontAttribute}]`).forEach(
          (element) => {
            element.style.fontSize = element.getAttribute(fontAttribute)!;
            element.removeAttribute(fontAttribute);
          },
        );
        // Keep the header's final margin outside its natural height, as on the page.
        const header = svg.querySelector<HTMLElement>('header');
        if (header) header.style.height = 'auto';
        const image = new window.Image();
        image.decoding = 'async';
        image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg.documentElement))}`;
        await image.decode();
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        const canvas = document.createElement('canvas');
        canvas.width = outputWidth;
        canvas.height = outputHeight;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('No se pudo crear la imagen');
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, 'image/png'),
        );
      }
      if (!blob) throw new Error('No se generó la imagen');

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = summary === 'financing'
        ? 'plan-de-financiamiento.png'
        : 'remate-y-ultimas-cuotas.png';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      console.error('No se pudo descargar el resumen:', error);
      setDownloadError('No se pudo descargar la imagen. Inténtalo nuevamente.');
    } finally {
      setDownloadingSummary(null);
    }
  };

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
    administrationRate,
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
  const raceFlagWidth = isDesktopTimeline ? 32 : 28;
  const timelineBarWidth = Math.max(planFigureWidth, 1);
  const startFlagPoleOffset = raceFlagWidth / 2;
  const endFlagPoleOffset = raceFlagWidth / 2;
  const startFlagLeft =
    (startMarkerPercent / 100) * timelineBarWidth - startFlagPoleOffset;
  const auctionFlagLeft =
    (auctionMarkerPercent / 100) * timelineBarWidth - raceFlagWidth / 2;
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
      <div className="mx-auto w-full max-w-5xl lg:max-w-[66rem]">
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
          <div className="grid gap-3 bg-transparent lg:col-span-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.6fr)_minmax(0,1fr)] lg:items-start lg:gap-4">
            <div className="grid gap-3 lg:contents">
              <section
                className="min-w-0 overflow-hidden rounded-2xl border border-sky-200/80 bg-white shadow-[0_8px_22px_rgb(15_73_122/12%)] lg:col-start-1 lg:row-start-1"
                aria-labelledby="certificateTitle"
              >
                <div className="relative overflow-hidden bg-gradient-to-br from-sky-50 via-blue-50 to-sky-100 px-3 py-2">
                  <div className="absolute -bottom-8 left-1/3 h-20 w-64 rotate-[-8deg] rounded-[50%] bg-white/40" />
                  <div className="relative flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center">
                      <h2
                        id="certificateTitle"
                        className="text-base font-bold tracking-tight text-slate-950"
                      >
                        Certificado
                      </h2>
                    </div>
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-sky-200 bg-white/75 text-primary shadow-sm backdrop-blur-sm">
                      <CreditCard className="size-4" aria-hidden="true" />
                    </span>
                  </div>
                </div>

                <div className="relative bg-white p-3 pt-2">
                  <div className="grid grid-cols-[minmax(0,2fr)_minmax(108px,0.9fr)] gap-2.5">
                    <div>
                      <Label
                        htmlFor="certificate"
                        className="mb-1 block text-xs font-medium text-slate-600"
                      >
                        Certificado
                      </Label>
                      <select
                        id="certificate"
                        name="certificate"
                        className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-base font-medium outline-none transition focus:border-primary focus:ring-3 focus:ring-primary/15 lg:text-sm"
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
                        className="mb-1 block whitespace-nowrap text-xs font-medium text-slate-600"
                      >
                        Avance de Grupo
                      </Label>
                      <select
                        id="groupProgress"
                        name="groupProgress"
                        className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-base font-medium outline-none transition focus:border-primary focus:ring-3 focus:ring-primary/15 lg:text-sm"
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

                  <fieldset className="mt-2 border-t border-sky-200 pt-1.5">
                    <legend className="mb-1 text-xs font-bold text-slate-900">
                      ADM.
                    </legend>
                    <div className="grid grid-cols-2 gap-2">
                      {[0.18, 0.21].map((rate) => {
                        const isSelected = administrationRate === rate;

                        return (
                          <button
                            key={rate}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => setAdministrationRate(rate)}
                            className={`h-8 rounded-lg border text-sm font-extrabold transition ${
                              isSelected
                                ? 'border-primary bg-primary text-white shadow-sm'
                                : 'border-sky-200 bg-sky-50 text-primary hover:bg-sky-100'
                            }`}
                          >
                            {Math.round(rate * 100)}%
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  <div className="mt-2 flex items-center justify-between gap-2 border-t border-sky-200 pt-2">
                    <Label
                      htmlFor="exchangeRate"
                      className="max-w-32 text-xs font-bold leading-tight text-slate-900"
                    >
                      Tipo de cambio referencial
                    </Label>
                    <div className="flex shrink-0 items-center justify-end gap-1.5">
                      <span className="text-xs font-medium text-slate-500">
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
                        className="h-8 w-[4.5rem] rounded-lg px-2 text-center text-base font-medium lg:text-sm"
                      />
                      <span className="text-xs font-medium text-slate-500">
                        PEN
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              <div className="grid min-w-0 gap-2 lg:col-start-3 lg:row-start-1 lg:flex lg:h-full lg:flex-col">
              <section
                className="min-w-0 rounded-2xl border border-sky-200/90 bg-white p-3 shadow-[0_8px_22px_rgb(15_73_122/10%)]"
                aria-labelledby="proposalDataTitle"
              >
                <h2
                  id="proposalDataTitle"
                  className="mb-2 border-l-4 border-sky-500 pl-2 text-base font-extrabold tracking-tight text-slate-950"
                >
                  Datos de la propuesta
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block" htmlFor="advisorName">
                    <span className="mb-1 block text-xs font-medium text-slate-500">
                      Asesor
                    </span>
                    <span className="flex h-9 items-center gap-1.5 rounded-lg bg-sky-50 px-2">
                      <UserRound
                        className="size-4 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      <select
                        id="advisorName"
                        name="advisorName"
                        value={advisorName}
                        onChange={(event) => updateAdvisor(event.target.value)}
                        className="min-w-0 flex-1 bg-transparent text-base font-medium text-slate-950 outline-none lg:text-sm"
                      >
                        {ADVISORS.map((advisor) => (
                          <option key={advisor.name} value={advisor.name}>
                            {advisor.name}
                          </option>
                        ))}
                      </select>
                    </span>
                  </label>
                  <label className="block" htmlFor="advisorPhone">
                    <span className="mb-1 block text-xs font-medium text-slate-500">
                      Teléfono
                    </span>
                    <span className="flex h-9 items-center gap-1.5 rounded-lg bg-sky-50 px-2">
                      <Phone
                        className="size-4 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      <input
                        id="advisorPhone"
                        name="advisorPhone"
                        type="tel"
                        inputMode="tel"
                        value={advisorPhone}
                        onChange={(event) => setAdvisorPhone(event.target.value)}
                        className="min-w-0 flex-1 bg-transparent text-base font-medium text-slate-950 outline-none lg:text-sm"
                      />
                    </span>
                  </label>
                  <label className="col-span-2 block" htmlFor="clientName">
                    <span className="mb-1 block text-xs font-medium text-slate-500">
                      Propuesta para
                    </span>
                    <span className="flex h-9 items-center gap-1.5 rounded-lg bg-sky-50 px-2">
                      <UserRound
                        className="size-4 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      <input
                        id="clientName"
                        name="clientName"
                        type="text"
                        value={clientName}
                        onChange={(event) => setClientName(event.target.value)}
                        className="min-w-0 flex-1 bg-transparent text-base font-medium text-slate-950 outline-none lg:text-sm"
                      />
                    </span>
                  </label>
                </div>
              </section>

              <div className="grid grid-cols-2 gap-2 lg:mt-auto">
                <Button
                  type="button"
                  variant="outline"
                  aria-label="Descargar Plan de Financiamiento (PNG)"
                  aria-busy={downloadingSummary === 'financing'}
                  disabled={downloadingSummary !== null}
                  onClick={() => downloadSummary('financing')}
                  className="min-w-0 border-sky-200 bg-white text-xs text-primary hover:bg-sky-50"
                >
                  {downloadingSummary === 'financing'
                    ? <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
                    : <Download className="size-3.5" aria-hidden="true" />}
                  {downloadingSummary === 'financing' ? 'Preparando...' : 'Descargar plan'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  aria-label="Descargar Remate y Últimas Cuotas (PNG)"
                  aria-busy={downloadingSummary === 'auction'}
                  disabled={downloadingSummary !== null}
                  onClick={() => downloadSummary('auction')}
                  className="min-w-0 border-sky-200 bg-white text-xs text-primary hover:bg-sky-50"
                >
                  {downloadingSummary === 'auction'
                    ? <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
                    : <Download className="size-3.5" aria-hidden="true" />}
                  {downloadingSummary === 'auction' ? 'Preparando...' : 'Descargar remate'}
                </Button>
              </div>
              {downloadError && (
                <p role="alert" className="text-xs text-destructive">{downloadError}</p>
              )}
              </div>

              <section
                ref={financingSummaryRef}
                className="min-w-0 overflow-hidden border border-sky-200/80 bg-white shadow-[0_8px_22px_rgb(15_73_122/12%)] lg:col-start-1 lg:row-start-2"
                aria-labelledby="certificateSummaryTitle"
                style={{
                  containerType: 'inline-size',
                  fontFamily: 'var(--font-geist-sans), Arial, Helvetica, sans-serif',
                }}
              >
                <div className="px-[4.5cqw] pb-[2cqw] pt-[3cqw]">
                  <div className="grid grid-cols-[0.9fr_1.2fr_0.9fr] items-center gap-[1.6cqw]">
                    <div className="relative min-w-0 pl-[3cqw]">
                      <span className="absolute inset-y-0 left-0 w-[0.75cqw] rounded-full bg-[#12b9e9]" aria-hidden="true" />
                      <strong className="block whitespace-nowrap text-[2.8cqw] font-extrabold leading-none tracking-[-0.025em] text-slate-950">
                        {advisorName || '—'}
                      </strong>
                      <span className="mt-[0.6cqw] block whitespace-nowrap text-[2.8cqw] font-extrabold leading-none text-slate-950">
                        {advisorPhone || '—'}
                      </span>
                    </div>
                    <div className="flex min-h-[7.4cqw] items-center gap-[1.8cqw] border-l border-[#0875e6] pl-[3.5cqw]">
                      <CalendarDays className="size-[5.2cqw] shrink-0 text-[#0875e6]" aria-hidden="true" />
                      <span className="text-[2.1cqw] font-extrabold leading-[1.05] tracking-[-0.025em] text-slate-950">
                        Fecha:
                        <strong className="mt-[0.35cqw] block whitespace-nowrap text-[2.8cqw] font-extrabold leading-none">{proposalDate}</strong>
                      </span>
                    </div>
                    <div className="relative h-[9.4cqw] w-full">
                      <Image src="/assets/pandero-auto-logo.png" alt="Pandero AUTO" fill sizes="128px" className="object-contain object-right" />
                    </div>
                  </div>

                  <div className="mt-[1.6cqw] inline-flex w-[60cqw] max-w-full items-center rounded-full bg-[linear-gradient(100deg,#0aa5e9_0%,#0754d8_100%)] px-[2.7cqw] py-[1.1cqw] text-[2.8cqw] leading-none tracking-[-0.02em] text-white shadow-sm">
                    <span className="mr-[1cqw] whitespace-nowrap font-normal">Cotización para:</span>
                    <strong className="truncate font-extrabold">{clientName || '—'}</strong>
                  </div>

                  <div className="mt-[2.6cqw] grid grid-cols-2 items-end">
                    <div className="min-w-0 pb-[1cqw] pl-[1.6cqw]">
                      <h2 id="certificateSummaryTitle" className="text-[6.3cqw] font-extrabold leading-[0.94] tracking-[-0.04em] text-slate-950">
                        Plan de<br />Financiamiento
                      </h2>
                      <span className="mt-[1.2cqw] block whitespace-nowrap text-[3cqw] font-medium leading-none text-slate-500">
                        Vehículos nuevos y seminuevos
                      </span>
                      <span className="mt-[2cqw] block h-[0.8cqw] w-[15cqw] rounded-full bg-[#086bff]" aria-hidden="true" />
                    </div>
                    <div className="relative h-[20cqw]">
                      <span className="absolute right-0 top-[-1cqw] h-[20cqw] w-[30cqw] rounded-t-full bg-[linear-gradient(135deg,#b4e4ff_0%,#edf8ff_75%,#ffffff_100%)]" aria-hidden="true" />
                      <div className="absolute bottom-[1cqw] right-[-1cqw] h-[18cqw] w-[24cqw]">
                        <Image src="/assets/financing-sedan-white.png" alt="Vehículo seminuevo" fill sizes="150px" className="object-contain object-right" />
                      </div>
                      <div className="absolute bottom-[-3cqw] left-[1.5cqw] z-10 h-[24.75cqw] w-[33cqw]">
                        <Image src="/assets/financing-suv-blue.png" alt="Vehículo nuevo" fill sizes="180px" className="object-contain object-left" />
                      </div>
                    </div>
                  </div>
                </div>

                <dl className="px-[4.5cqw] pb-[6cqw]" style={{ containerType: 'inline-size' }}>
                  <div className="grid grid-cols-[15%_39%_46%] items-center rounded-[5.5cqw] border-2 border-sky-400 bg-gradient-to-r from-sky-50 to-blue-50/90 px-[3.8cqw] py-[3.2cqw] shadow-[0_5px_14px_rgb(14_165_233/22%)]">
                    <span className="relative flex size-[11cqw] items-center justify-center text-sky-600">
                      <FileText className="size-[10cqw]" aria-hidden="true" />
                      <span className="absolute bottom-[-0.5cqw] right-[-0.5cqw] flex size-[5cqw] items-center justify-center rounded-full bg-sky-600 text-white">
                        <DollarSign className="size-[3.5cqw]" aria-hidden="true" />
                      </span>
                    </span>
                    <dt className="border-l border-sky-500 pl-[3cqw]">
                      <strong className="block whitespace-nowrap text-[5.2cqw] font-extrabold leading-none text-slate-950">Certificado</strong>
                      <span className="mt-[1.4cqw] block text-[4cqw] font-medium leading-[1.08] text-slate-500">Monto de<br />financiamiento</span>
                    </dt>
                    <dd className="border-l border-sky-500 pl-[3.5cqw] text-right tabular-nums">
                      <span className="block whitespace-nowrap text-[6.7cqw] font-extrabold leading-none tracking-tight text-[#0867ec]" style={{ fontSize: formatUsd(selectedCertificate.amountUsd).length > 10 ? '6cqw' : undefined }}>
                        {formatUsd(selectedCertificate.amountUsd)}
                      </span>
                      <span className="mt-[1.5cqw] block whitespace-nowrap text-[4.4cqw] font-semibold leading-none text-slate-600">
                        {formatPen(toPen(selectedCertificate.amountUsd))}
                      </span>
                    </dd>
                  </div>
                  <div className="mt-[2.2cqw] flex items-center justify-between gap-[2.5cqw] border-b border-sky-100 px-[1.5cqw] py-[1.4cqw]">
                    <div className="flex min-w-0 items-center gap-[4.2cqw]">
                      <span className="flex size-[8cqw] shrink-0 items-center justify-center rounded-[3.2cqw] bg-sky-50 text-primary">
                        <ReceiptText className="size-[5cqw]" aria-hidden="true" />
                      </span>
                      <dt className="text-[4.2cqw] font-normal leading-tight text-slate-950">
                        Cuota de inscripción
                      </dt>
                    </div>
                    <dd className="flex shrink-0 -translate-x-[1cqw] flex-col items-end text-right text-[5.5cqw] font-extrabold leading-none tracking-tight text-slate-950 tabular-nums">
                      <span className="whitespace-nowrap">
                        {formatUsd(registrationFee)}
                      </span>
                      <span className="mt-[1cqw] whitespace-nowrap text-[3.5cqw] font-medium leading-none text-slate-500">
                        (4% + IGV)
                      </span>
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-[2.5cqw] border-b border-sky-100 px-[1.5cqw] py-[1.4cqw]">
                    <div className="flex min-w-0 items-center gap-[4.2cqw]">
                      <span className="flex size-[8cqw] shrink-0 items-center justify-center rounded-[3.2cqw] bg-sky-50 text-primary">
                        <CalendarDays className="size-[5cqw]" aria-hidden="true" />
                      </span>
                      <dt className="text-[4.2cqw] font-normal leading-tight text-slate-950">
                        Cuota mensual
                      </dt>
                    </div>
                    <dd className="flex shrink-0 -translate-x-[1cqw] flex-col items-end text-right text-[5.5cqw] font-extrabold leading-none tracking-tight text-sky-600 tabular-nums">
                      <span className="whitespace-nowrap">
                        {formatUsd(monthlyPayment)}
                      </span>
                      <span className="mt-[1cqw] whitespace-nowrap text-[3.5cqw] font-medium leading-none text-slate-500">
                        {formatPen(toPen(monthlyPayment))}
                      </span>
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-[2.5cqw] border-b border-sky-100 px-[1.5cqw] py-[1.4cqw]">
                    <div className="flex min-w-0 items-center gap-[4.2cqw]">
                      <span className="flex size-[8cqw] shrink-0 items-center justify-center rounded-[3.2cqw] bg-sky-50 text-primary">
                        <Clock3 className="size-[5cqw]" aria-hidden="true" />
                      </span>
                      <dt className="text-[4.2cqw] font-normal leading-tight text-slate-950">
                        Plazo
                      </dt>
                    </div>
                    <dd className="-translate-x-[1cqw] whitespace-nowrap text-[5.5cqw] font-extrabold leading-none tracking-tight text-slate-950 tabular-nums">
                      {termMonths} meses
                    </dd>
                  </div>

                  <div className="grid grid-cols-3 border-b border-sky-100 py-[2.2cqw]">
                    {[
                      { icon: Landmark, text: <>Sin crédito<br />bancario</> },
                      { icon: CarFront, text: <>Tú eliges<br />la marca<br />y modelo</> },
                      { icon: Award, text: <>Más de<br />57 años de<br />trayectoria</> },
                    ].map(({ icon: BenefitIcon, text }, index) => (
                      <div key={index} className={`flex items-center gap-[2cqw] px-[1.2cqw] ${index > 0 ? 'border-l border-sky-300' : ''}`}>
                        <span className="flex size-[8.5cqw] shrink-0 items-center justify-center rounded-[3cqw] bg-sky-50 text-sky-600">
                          <BenefitIcon className="size-[5.8cqw]" aria-hidden="true" />
                        </span>
                        <strong className="whitespace-nowrap text-[3.2cqw] font-semibold leading-[1.12] text-slate-950">{text}</strong>
                      </div>
                    ))}
                  </div>

                  <div className="mt-[3cqw] overflow-hidden rounded-[5.5cqw] bg-[linear-gradient(105deg,#09a9e9_0%,#0878e7_54%,#0750cd_100%)] px-[4.7cqw] py-[3.6cqw] text-white shadow-md">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-[3cqw]">
                      <dt className="min-w-0 pr-1">
                        <span className="block text-[5.2cqw] font-extrabold leading-tight">
                          Inicia tu plan con
                        </span>
                        <span className="mt-[1cqw] block whitespace-nowrap text-[3.3cqw] font-medium leading-tight text-white/95">
                          Inscripción + primera cuota
                        </span>
                      </dt>
                      <dd className="flex self-stretch flex-col justify-center border-l border-white/70 pl-[4cqw] text-right font-bold tracking-tight tabular-nums">
                        <span className="block whitespace-nowrap text-[6.4cqw] font-extrabold leading-none">
                          {formatUsd(totalEntry)}
                        </span>
                        <span className="mt-[1.3cqw] block whitespace-nowrap text-[4.3cqw] font-medium leading-none text-white/90">
                          {formatPen(toPen(totalEntry))}
                        </span>
                      </dd>
                    </div>
                  </div>
                </dl>
              </section>

              <div
                className="grid grid-cols-2 items-stretch gap-3 px-3 py-2 lg:col-start-1 lg:row-start-3 lg:py-3"
                aria-label="Ilustraciones de aporte y sorteo"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-2xl border-2 border-sky-200/90 bg-gradient-to-br from-white to-sky-50/80 shadow-[0_5px_14px_rgb(14_165_233/14%)] ring-1 ring-white">
                  <Image
                    src="/assets/ilustracion-aporte.png"
                    alt="Aporte para el plan"
                    fill
                    sizes="(min-width: 1024px) 160px, 45vw"
                    className="translate-y-3 scale-[1.4] object-contain"
                    style={{
                      filter:
                        'contrast(1.24) saturate(1.08) drop-shadow(0 0 0.8px rgba(15,60,168,0.95)) drop-shadow(0 1px 0 rgba(15,60,168,0.8))',
                    }}
                  />
                </div>
                <div className="relative aspect-square w-full overflow-hidden rounded-2xl border-2 border-sky-200/90 bg-gradient-to-br from-white to-sky-50/80 shadow-[0_5px_14px_rgb(14_165_233/14%)] ring-1 ring-white">
                  <Image
                    src="/assets/ilustracion-sorteo.png"
                    alt="Sorteo del plan"
                    fill
                    sizes="(min-width: 1024px) 160px, 45vw"
                    className="object-contain"
                    style={{
                      filter:
                        'contrast(1.24) saturate(1.08) drop-shadow(0 0 0.8px rgba(15,60,168,0.95)) drop-shadow(0 1px 0 rgba(15,60,168,0.8))',
                    }}
                  />
                </div>
              </div>
            </div>

            <figure className="hidden min-w-0 lg:col-start-2 lg:row-start-2 lg:block">
              <Image
                src="/assets/pandero-sorteo-vertical.png"
                alt="Qué es Pandero y los beneficios del sorteo mensual"
                width={649}
                height={1479}
                sizes="(min-width: 1100px) 237px, (min-width: 1024px) 22vw, 1px"
                className="h-auto w-full object-contain"
              />
            </figure>

            <div className="flex flex-col gap-3 bg-transparent lg:contents">
              <div ref={auctionSummaryRef} className="min-w-0 lg:col-start-3 lg:row-start-2">
                  <AuctionSimulationSection
                    advisorName={advisorName}
                    advisorPhone={advisorPhone}
                    proposalDate={proposalDate}
                    auctionMonth={auctionMonth}
                    onMonthChange={updateAuctionMonth}
                    auctionPayments={auctionPayments}
                    onPaymentsChange={updateAuctionPayments}
                    auctionAmountUsd={formatUsd(auctionAmount)}
                    auctionAmountPen={formatPen(toPen(auctionAmount))}
                    paidPayments={paidPayments}
                    remainingPayments={remainingPayments}
                    optionARemainingPayments={proratedRemainingPayments}
                    optionAPaymentUsd={formatUsd(monthlyPayment)}
                    optionAPaymentPen={formatPen(toPen(monthlyPayment))}
                    optionBRemainingPayments={prorationRemainingPayments}
                    optionBPaymentUsd={formatUsd(proratedPayment)}
                    optionBPaymentPen={formatPen(toPen(proratedPayment))}
                  />
              </div>

              <section
                className="relative order-3 overflow-hidden rounded-3xl border border-cyan-200/80 bg-[radial-gradient(circle_at_50%_22%,rgba(56,189,248,0.5),transparent_34%),linear-gradient(180deg,#0f3ca8_0%,#075fd4_48%,#e0f2fe_100%)] px-3.5 pb-3.5 pt-0 shadow-[0_12px_28px_rgba(15,63,150,0.28)] ring-1 ring-white/40 min-[420px]:px-4 min-[420px]:pb-4 lg:col-start-3 lg:row-start-3"
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
                    className="absolute top-[178px] z-30 size-7 touch-none select-none border-0 bg-transparent p-0 cursor-ew-resize lg:top-[208px] lg:size-8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
                    style={{ left: startFlagLeft }}
                    onPointerDown={(event) => startTimelineDrag('start', event)}
                    onPointerMove={moveTimelineDrag}
                    onPointerUp={stopTimelineDrag}
                    onPointerCancel={stopTimelineDrag}
                    onKeyDown={(event) => handleTimelineKeyDown('start', event)}
                    aria-label={`Mover salida del plan. Avance de Grupo ${groupProgress}. Usa las flechas izquierda y derecha para ajustar.`}
                    title="Salida del plan"
                  >
                    <span className="absolute inset-1 rounded-full border-2 border-white bg-emerald-500 shadow-[0_0_10px_rgba(34,197,94,0.95)]" />
                  </button>

                  <button
                    type="button"
                    className="absolute top-[178px] z-30 size-7 touch-none select-none border-0 bg-transparent p-0 cursor-ew-resize lg:top-[208px] lg:size-8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
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
                    <span className="absolute inset-1 rounded-full border-2 border-white bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.95)]" />
                  </button>

                  <button
                    type="button"
                    className="absolute top-[178px] z-30 size-7 touch-none select-none border-0 bg-transparent p-0 cursor-ew-resize lg:top-[208px] lg:size-8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    style={{ left: endFlagLeft }}
                    onPointerDown={(event) => startTimelineDrag('end', event)}
                    onPointerMove={moveTimelineDrag}
                    onPointerUp={stopTimelineDrag}
                    onPointerCancel={stopTimelineDrag}
                    onKeyDown={(event) => handleTimelineKeyDown('end', event)}
                    aria-label={`Mover únicamente la llegada. ${auctionPayments} cuotas adelantadas. Usa las flechas izquierda y derecha para ajustar.`}
                    title="Llegada del plan"
                  >
                    <span className="absolute inset-1 rounded-full border-2 border-white bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.95)]" />
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
                  {timelineSummaryCards.some(
                    ({ key, isCompact }) => key !== 'advance' && isCompact,
                  ) && (
                    <div
                      className="mt-4 grid grid-cols-2 items-start gap-3 lg:mt-5"
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
                            .filter(
                              ({ key, isCompact }) =>
                                key !== 'advance' && isCompact,
                            )
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
