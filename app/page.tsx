'use client';

import { Fragment, useState } from 'react';
import { Car, Flag, Gift, Trash2 } from 'lucide-react';

import {
  AuctionMonthSection,
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
  const visiblePlanMonths = groupAdvance + paidPayments + remainingPayments;
  const auctionMarkerPercent =
    ((groupAdvance + paidPayments) / visiblePlanMonths) * 100;
  const paidCenterPercent =
    ((groupAdvance + paidPayments / 2) / visiblePlanMonths) * 100;
  const showRaffleGift = paidPayments >= 5;
  const auctionAmount = monthlyPayment * advancedPayments;
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
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-3 border-b pb-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
              Pandero
            </p>
            <h1 className="text-xl font-semibold tracking-tight">
              Simulador de remate
            </h1>
          </div>
        </header>

        <div className="grid gap-px overflow-hidden rounded-xl border bg-border lg:grid-cols-12">
          <section
            className="bg-card p-3 lg:col-span-12"
            aria-labelledby="certificateTitle"
          >
            <div className="grid gap-3 md:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.35fr)] md:gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="section-number">1</span>
                  <h2 id="certificateTitle" className="section-title">
                    Certificado
                  </h2>
                </div>
                <div className="space-y-2.5">
                  <div className="grid grid-cols-[minmax(0,2fr)_minmax(105px,0.7fr)] gap-2">
                    <div>
                      <Label
                        htmlFor="certificate"
                        className="mb-1 block text-[11px] text-muted-foreground"
                      >
                        Certificado
                      </Label>
                      <select
                        id="certificate"
                        name="certificate"
                        className="compact-select"
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
                        className="mb-1 block text-[11px] text-muted-foreground"
                      >
                        Avance de Grupo
                      </Label>
                      <select
                        id="groupProgress"
                        name="groupProgress"
                        className="compact-select"
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
                  <div className="flex items-center justify-between gap-2 border-t pt-2">
                    <Label
                      htmlFor="exchangeRate"
                      className="text-xs leading-tight"
                    >
                      Tipo de cambio referencial
                    </Label>
                    <div className="flex shrink-0 items-center justify-end gap-1.5">
                      <span className="text-xs text-muted-foreground">
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
                        className="h-9 w-[4.75rem] px-2 text-right font-medium"
                      />
                      <span className="text-xs text-muted-foreground">PEN</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-primary/20 bg-primary/[0.06] p-3 md:p-3.5">
                <div className="flex items-center gap-2">
                  <span className="section-number">2</span>
                  <h2 id="certificateSummaryTitle" className="section-title">
                    Resumen
                  </h2>
                </div>
                <dl className="mt-2 divide-y divide-primary/15">
                  <div className="flex items-end justify-between gap-3 pb-2">
                    <dt className="text-sm font-medium text-muted-foreground">
                      Certificado por
                    </dt>
                    <dd className="text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
                      {formatUsd(selectedCertificate.amountUsd)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 py-2">
                    <dt className="text-sm">C. de Inscripción</dt>
                    <dd className="text-right text-sm font-semibold">
                      {formatUsd(registrationFee)}
                      <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                        (4% + IGV)
                      </span>
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 py-2">
                    <dt className="text-sm">Cuota mensual</dt>
                    <dd className="text-right text-base font-semibold text-sky-600 dark:text-sky-400">
                      {formatUsd(monthlyPayment)}
                      <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                        {formatPen(toPen(monthlyPayment))}
                      </span>
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 py-2">
                    <dt className="text-sm">Plazo</dt>
                    <dd className="text-sm font-semibold">
                      {termMonths} meses
                    </dd>
                  </div>
                  <div className="-mx-1 mt-1 flex items-center justify-between gap-3 rounded-md bg-primary px-2.5 py-2.5 text-primary-foreground">
                    <dt className="text-sm font-semibold">
                      Total para ingreso
                    </dt>
                    <dd className="text-right font-bold tracking-tight">
                      <span className="block text-lg">
                        {formatUsd(totalEntry)}
                      </span>
                      <span className="block text-sm font-medium opacity-80">
                        {formatPen(toPen(totalEntry))}
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </section>

          <AuctionMonthSection
            auctionMonth={auctionMonth}
            onMonthChange={updateAuctionMonth}
          />

          <AuctionPaymentsSection
            auctionPayments={auctionPayments}
            onPaymentsChange={updateAuctionPayments}
            auctionAmountUsd={formatUsd(auctionAmount)}
            auctionAmountPen={formatPen(toPen(auctionAmount))}
            optionARemainingPayments={proratedRemainingPayments}
            optionAPaymentUsd={formatUsd(monthlyPayment)}
            optionAPaymentPen={formatPen(toPen(monthlyPayment))}
            optionBRemainingPayments={prorationRemainingPayments}
            optionBPaymentUsd={formatUsd(proratedPayment)}
            optionBPaymentPen={formatPen(toPen(proratedPayment))}
          />

          <section
            className="bg-card p-3 lg:col-span-12"
            aria-labelledby="planTitle"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="section-number">5</span>
              <h2 id="planTitle" className="section-title">
                Plan · {TOTAL_TERM_MONTHS} meses
              </h2>
            </div>
            <figure
              className="relative pt-10"
              aria-label={`${groupAdvance} meses de avance, ${paidPayments} cuotas pagadas con sorteo mensual, ${advancedPayments} adelantadas y ${remainingPayments} restantes. Adjudicación por remate en el mes ${auctionMonth}`}
            >
              <span
                className="absolute top-0 z-10 flex h-8 w-[116px] -translate-x-1/2 items-center justify-center gap-1.5 rounded-md bg-primary px-2 text-primary-foreground shadow-sm"
                style={{
                  left: `clamp(58px, ${auctionMarkerPercent}%, calc(100% - 58px))`,
                }}
              >
                <Flag className="size-3.5 fill-current" aria-hidden="true" />
                <span className="whitespace-nowrap text-[10px] font-medium">
                  Adelantadas
                </span>
                <strong className="text-sm">{advancedPayments}</strong>
              </span>
              <i
                className="absolute top-7 z-10 size-2 -translate-x-1/2 rotate-45 bg-primary"
                style={{
                  left: `clamp(15px, ${auctionMarkerPercent}%, calc(100% - 15px))`,
                }}
                aria-hidden="true"
              />
              <div className="flex h-16 w-full overflow-hidden rounded-lg border bg-muted">
                {groupAdvance > 0 && (
                  <span
                    className="flex h-full min-w-0 items-center justify-center bg-sky-300 px-1 text-center text-slate-900 dark:bg-sky-700 dark:text-white"
                    style={{
                      width: `${(groupAdvance / visiblePlanMonths) * 100}%`,
                    }}
                    title={`Meses de Avance: ${groupAdvance}`}
                  >
                    <span className="min-w-0 leading-tight">
                      <span className="block truncate text-[9px] font-medium">
                        {groupAdvance >= 6 ? 'Meses de Avance' : 'Avance'}
                      </span>
                      <strong className="block text-base">
                        {groupAdvance}
                      </strong>
                    </span>
                  </span>
                )}
                <span
                  className="flex h-full min-w-0 items-center justify-center px-0.5 text-center text-white"
                  style={{
                    width: `${(paidPayments / visiblePlanMonths) * 100}%`,
                    backgroundColor: 'rgb(71 85 105)',
                    backgroundImage:
                      'radial-gradient(circle, rgb(255 255 255 / 65%) 1px, transparent 1.5px)',
                    backgroundSize: '7px 7px',
                  }}
                  title={`Pagadas: ${paidPayments}. Periodo con sorteo mensual`}
                >
                  <span className="min-w-0 leading-tight">
                    <span className="block truncate text-[8px] font-medium">
                      Pagadas
                    </span>
                    <strong className="block text-base">{paidPayments}</strong>
                  </span>
                </span>
                <span
                  className="flex h-full min-w-0 items-center justify-center border-l border-card/60 bg-muted px-1 text-center text-foreground"
                  style={{
                    width: `${(remainingPayments / visiblePlanMonths) * 100}%`,
                  }}
                  title={`Restantes: ${remainingPayments}`}
                >
                  <span className="min-w-0 leading-tight">
                    <span className="block truncate text-[9px] font-medium">
                      Restantes
                    </span>
                    <strong className="block text-base">
                      {remainingPayments}
                    </strong>
                  </span>
                </span>
              </div>
              <span
                className="absolute top-[4.5rem] flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-card text-primary ring-2 ring-primary/30"
                style={{
                  left: `clamp(15px, ${auctionMarkerPercent}%, calc(100% - 15px))`,
                }}
                aria-hidden="true"
              >
                <Car className="size-4" />
              </span>
              {showRaffleGift && (
                <span
                  className="absolute top-[6.75rem] flex size-7 -translate-x-1/2 items-center justify-center rounded-full bg-slate-600 text-white ring-2 ring-card"
                  style={{
                    left: `clamp(15px, ${paidCenterPercent}%, calc(100% - 15px))`,
                  }}
                  title="Oportunidad de obtener el vehículo por sorteo"
                  aria-label="Oportunidad de obtener el vehículo por sorteo"
                >
                  <Gift className="size-4" aria-hidden="true" />
                </span>
              )}
              <figcaption
                className={`${showRaffleGift ? 'mt-8' : 'mt-1.5'} flex min-w-0 justify-end text-[10px]`}
              >
                <span className="whitespace-nowrap">
                  <strong className="text-primary">Mes {auctionMonth}</strong>
                  <span className="text-muted-foreground">
                    {' '}
                    · Adjudicación por remate
                  </span>
                </span>
              </figcaption>
            </figure>
          </section>

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
