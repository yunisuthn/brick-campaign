import { ChevronDown, ChevronRight, type LucideIcon, Pencil } from 'lucide-react';
import { Link } from 'react-router';
import { IconTile } from '@/components/marks';
import { PageHeader, Screen } from '@/components/Screen';
import { sections } from '@/components/sections';
import { Button } from '@/components/ui/button';
import { useTranslation } from '../i18n/I18nProvider.js';
import type { TranslationKey } from '../i18n/translations.js';

/** A sentence, and the interface labels its placeholders name: `{action}` → a button's label. */
interface Line {
  text: TranslationKey;
  labels?: Record<string, TranslationKey>;
}

interface Topic {
  title: TranslationKey;
  /** The section the topic happens in: its icon heads the topic, its link ends it. */
  section?: string;
  steps: ReadonlyArray<Line>;
  note?: Line;
}

const topics: ReadonlyArray<Topic> = [
  {
    title: 'guide.campaign.title',
    section: '/campagnes',
    steps: [
      {
        text: 'guide.campaign.step1',
        labels: { section: 'nav.campaigns', action: 'campaigns.newLink' },
      },
      { text: 'guide.campaign.step2', labels: { action: 'campaigns.createButton' } },
      { text: 'guide.campaign.step3', labels: { picker: 'shell.currentCampaign' } },
      { text: 'guide.campaign.step4', labels: { action: 'campaigns.editRates' } },
    ],
    note: { text: 'guide.campaign.note' },
  },
  {
    title: 'guide.people.title',
    section: '/mouleurs',
    steps: [
      {
        text: 'guide.people.step1',
        labels: {
          moulders: 'nav.moulders',
          riceFields: 'nav.riceFields',
          clients: 'nav.clients',
          more: 'nav.more',
        },
      },
      {
        text: 'guide.people.step2',
        labels: {
          newMoulder: 'moulders.newLink',
          newRiceField: 'riceFields.newLink',
          newClient: 'clients.newLink',
        },
      },
      { text: 'guide.people.step3' },
    ],
    note: { text: 'guide.people.note', labels: { action: 'moulders.retireMoulder' } },
  },
  {
    title: 'guide.production.title',
    section: '/productions',
    steps: [
      {
        text: 'guide.production.step1',
        labels: { section: 'nav.productions', action: 'productions.newLink' },
      },
      { text: 'guide.production.step2' },
      { text: 'guide.production.step3' },
      { text: 'guide.production.step4' },
    ],
    note: { text: 'guide.production.note' },
  },
  {
    title: 'guide.payment.title',
    section: '/versements',
    steps: [
      {
        text: 'guide.payment.step1',
        labels: { section: 'nav.payments', action: 'payments.newLink' },
      },
      { text: 'guide.payment.step2' },
      {
        text: 'guide.payment.step3',
        labels: {
          vatsy: 'payments.type.vatsy',
          advance: 'payments.type.advance',
          fee: 'payments.type.fee',
          settlement: 'payments.type.settlement',
        },
      },
    ],
    note: { text: 'guide.payment.note' },
  },
  {
    title: 'guide.kiln.title',
    section: '/lots',
    steps: [
      {
        text: 'guide.kiln.step1',
        labels: { section: 'nav.kilnBatches', action: 'kilnBatches.newLink' },
      },
      { text: 'guide.kiln.step2', labels: { action: 'kilnBatches.loadAction' } },
      { text: 'guide.kiln.step3', labels: { action: 'contractorWorks.addLink' } },
      { text: 'guide.kiln.step4' },
    ],
    note: { text: 'guide.kiln.note' },
  },
  {
    title: 'guide.sale.title',
    section: '/ventes',
    steps: [
      { text: 'guide.sale.step1', labels: { section: 'nav.sales', action: 'sales.newLink' } },
      { text: 'guide.sale.step2', labels: { action: 'deliveries.addTrip' } },
      { text: 'guide.sale.step3', labels: { action: 'salePayments.addPaymentLink' } },
      {
        text: 'guide.sale.step4',
        labels: {
          ordered: 'sales.status.ordered',
          delivered: 'sales.status.delivered',
          partiallyPaid: 'sales.status.partiallyPaid',
          paid: 'sales.status.paid',
        },
      },
    ],
    note: { text: 'guide.sale.note' },
  },
  {
    title: 'guide.expense.title',
    section: '/depenses',
    steps: [
      {
        text: 'guide.expense.step1',
        labels: { section: 'nav.expenses', action: 'expenses.newLink' },
      },
      { text: 'guide.expense.step2' },
      { text: 'guide.expense.step3' },
    ],
  },
  {
    title: 'guide.end.title',
    section: '/soldes',
    steps: [
      { text: 'guide.end.step1', labels: { section: 'nav.balances' } },
      { text: 'guide.end.step2', labels: { action: 'balances.settle' } },
      {
        text: 'guide.end.step3',
        labels: { section: 'nav.campaigns', action: 'campaigns.closeCampaign' },
      },
    ],
    note: { text: 'guide.end.note' },
  },
  {
    title: 'guide.fix.title',
    steps: [
      { text: 'guide.fix.step1' },
      { text: 'guide.fix.step2', labels: { action: 'common.save' } },
      { text: 'guide.fix.step3' },
    ],
    note: { text: 'guide.fix.note' },
  },
];

/**
 * How each task is done, step by step, for whoever has forgotten or never learned it
 * (reference document, section 10.14). One topic per task in the order of the season, folded
 * until opened; nothing is read from the API, so it needs no campaign.
 */
export function GuidePage() {
  const { t } = useTranslation();
  return (
    <Screen>
      <PageHeader title={t('nav.guide')} subtitle={t('guide.subtitle')} />
      <div className="flex flex-col gap-3">
        {topics.map((topic) => (
          <TopicCard key={topic.title} topic={topic} />
        ))}
      </div>
    </Screen>
  );
}

function TopicCard({ topic }: { topic: Topic }) {
  const { t } = useTranslation();
  const section = sections.find((s) => s.to === topic.section);
  const icon: LucideIcon = section?.icon ?? Pencil;
  const say = ({ text, labels = {} }: Line) =>
    t(text, Object.fromEntries(Object.entries(labels).map(([name, key]) => [name, t(key)])));

  return (
    <details className="group rounded-xl border bg-card text-card-foreground shadow-sm">
      <summary className="flex min-h-15 cursor-pointer list-none items-center gap-3 rounded-xl px-4 py-2.5 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
        <IconTile icon={icon} />
        <h2 className="grow text-[15px] leading-snug font-medium">{t(topic.title)}</h2>
        <ChevronDown
          aria-hidden="true"
          className="size-[18px] shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="flex flex-col gap-4 border-t px-4 pt-4 pb-5">
        <ol className="flex flex-col gap-3">
          {topic.steps.map((step, index) => (
            <li key={step.text} className="flex gap-3 text-sm leading-relaxed">
              <span
                aria-hidden="true"
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
              >
                {index + 1}
              </span>
              <span className="pt-0.5">{say(step)}</span>
            </li>
          ))}
        </ol>
        {topic.note && (
          <p className="rounded-[10px] bg-tile px-3 py-2.5 text-sm text-muted-foreground">
            {say(topic.note)}
          </p>
        )}
        {section && (
          <Button asChild variant="outline" className="self-start">
            <Link to={section.to}>
              {t('guide.open', { section: t(section.key) })}
              <ChevronRight aria-hidden="true" />
            </Link>
          </Button>
        )}
      </div>
    </details>
  );
}
