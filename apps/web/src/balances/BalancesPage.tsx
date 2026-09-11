import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { formatAmount, formatBricks } from '../format.js';
import {
  type ContractorBalance,
  type MoulderBalance,
  useContractorBalances,
  useMoulderBalances,
} from './useBalances.js';

export function BalancesPage() {
  const { campaign } = useCurrentCampaign();

  return (
    <main className="page-wide">
      <h1>Soldes{campaign && ` · Campagne ${campaign.year}`}</h1>
      {campaign ? (
        <Balances campaignId={campaign.id} />
      ) : (
        <p>
          Aucune campagne : <Link to="/campagnes/nouvelle">créez la première</Link> pour suivre les
          soldes.
        </p>
      )}
    </main>
  );
}

function Balances({ campaignId }: { campaignId: string }) {
  const moulders = useMoulderBalances(campaignId);
  const contractors = useContractorBalances(campaignId);

  const failed = [moulders, contractors].find((query) => query.isError);
  if (failed)
    return (
      <p role="alert">Chargement impossible : {failed.error && apiErrorMessage(failed.error)}</p>
    );
  if (!moulders.isSuccess || !contractors.isSuccess) return <p role="status">Chargement…</p>;

  return (
    <>
      <section aria-labelledby="moulders">
        <h2 id="moulders">Mouleurs</h2>
        {moulders.data.length === 0 ? (
          <p>Aucun mouleur avec une saisie sur cette campagne.</p>
        ) : (
          <ul className="rows">
            {moulders.data.map((line) => (
              <li key={line.moulderId}>
                <BalanceCard
                  name={line.name}
                  work={formatBricks(line.bricks)}
                  balance={line}
                  missingRate="Tarif de moulage à fixer"
                />
              </li>
            ))}
          </ul>
        )}
      </section>
      <section aria-labelledby="contractors">
        <h2 id="contractors">Prestataires</h2>
        {contractors.data.length === 0 ? (
          <p>Aucune prestation ni versement sur cette campagne.</p>
        ) : (
          <ul className="rows">
            {contractors.data.map((line) => (
              <li key={line.contractorName}>
                <BalanceCard
                  name={line.contractorName}
                  work={contractorWork(line)}
                  balance={line}
                  missingRate="Tarif de prestation à fixer"
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function contractorWork(line: ContractorBalance): string {
  const parts: string[] = [];
  if (line.bricksByType.transport > 0) {
    parts.push(`${formatBricks(line.bricksByType.transport)} transportées`);
  }
  if (line.bricksByType.kiln_loading > 0) {
    parts.push(`${formatBricks(line.bricksByType.kiln_loading)} enfournées`);
  }
  return parts.length === 0 ? 'Aucune prestation' : parts.join(' · ');
}

interface BalanceCardProps {
  name: string;
  work: string;
  balance: Pick<MoulderBalance, 'earned' | 'paid' | 'due'>;
  /** Said instead of an amount when the rate the line needs is not fixed yet. */
  missingRate: string;
}

/**
 * What is earned, and so what is due, is unknown while the campaign rate is not fixed
 * (reference document, section 4). The screen says so; it never shows a zero in its place.
 */
function BalanceCard({ name, work, balance, missingRate }: BalanceCardProps) {
  return (
    <>
      <strong>{name}</strong>
      <span className="sub">{work}</span>
      <dl className="facts">
        <Line label="Gagné">
          {balance.earned === null ? <em>{missingRate}</em> : formatAmount(balance.earned)}
        </Line>
        <Line label="Versé">{formatAmount(balance.paid)}</Line>
        <Line label={balance.due !== null && balance.due < 0 ? 'Trop versé' : 'Reste dû'}>
          {balance.due === null ? (
            <em>Inconnu tant que le tarif n’est pas fixé</em>
          ) : (
            formatAmount(Math.abs(balance.due))
          )}
        </Line>
      </dl>
    </>
  );
}

function Line({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </>
  );
}
