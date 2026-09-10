import { Link } from 'react-router';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { formatBricks, formatDate } from '../format.js';
import { useMoulders } from '../moulders/useMoulders.js';
import { useRiceFields } from '../rice-fields/useRiceFields.js';
import { useProductions } from './useProductions.js';

export function ProductionsPage() {
  const { campaign } = useCurrentCampaign();

  return (
    <main style={{ padding: '1rem' }}>
      <h1>Productions{campaign && ` · Campagne ${campaign.year}`}</h1>
      {campaign ? (
        <ProductionList campaignId={campaign.id} />
      ) : (
        <p>
          Aucune campagne : <Link to="/campagnes/nouvelle">créez la première</Link> avant de saisir
          une production.
        </p>
      )}
    </main>
  );
}

/**
 * The API gives ids; the names come from the reference lists, retired moulders included since
 * an old entry can name a moulder who has left since.
 */
function ProductionList({ campaignId }: { campaignId: string }) {
  const productions = useProductions(campaignId);
  const moulders = useMoulders(true);
  const riceFields = useRiceFields();

  const failed = [productions, moulders, riceFields].find((query) => query.isError);
  if (failed) return <p role="alert">Chargement impossible : {failed.error?.message}</p>;
  if (!productions.isSuccess || !moulders.isSuccess || !riceFields.isSuccess) {
    return <p role="status">Chargement…</p>;
  }
  if (productions.data.length === 0) return <p>Aucune production saisie.</p>;

  const moulderName = new Map(moulders.data.map((m) => [m.id, m.name]));
  const fieldName = new Map(riceFields.data.map((f) => [f.id, f.name]));

  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {productions.data.map((production) => (
        <li
          key={production.id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '1rem',
            padding: '0.75rem 1rem',
            marginBottom: '0.5rem',
            background: 'white',
            borderRadius: '0.5rem',
          }}
        >
          <span>
            <strong>{moulderName.get(production.moulderId) ?? 'Mouleur inconnu'}</strong>
            <span style={{ display: 'block', fontSize: '0.875rem' }}>
              {formatDate(production.date)} ·{' '}
              {fieldName.get(production.riceFieldId) ?? 'Rizière inconnue'}
            </span>
          </span>
          <span style={{ whiteSpace: 'nowrap' }}>{formatBricks(production.quantity)}</span>
        </li>
      ))}
    </ul>
  );
}
