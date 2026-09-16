import { useState } from 'react';
import { Link } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { membersText } from './moulderFields.js';
import { useMoulders } from './useMoulders.js';

export function MouldersPage() {
  const [includeInactive, setIncludeInactive] = useState(false);
  const moulders = useMoulders(includeInactive);
  const { t } = useTranslation();

  return (
    <main className="page-wide">
      <h1>{t('moulders.title')}</h1>
      <p className="actions">
        <Link to="/mouleurs/nouveau">{t('moulders.newLink')}</Link>
        <label className="actions">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(event) => setIncludeInactive(event.target.checked)}
          />
          {t('moulders.showRetired')}
        </label>
      </p>
      {moulders.isPending && <p role="status">{t('common.loading')}</p>}
      {moulders.isError && (
        <p role="alert">
          {t('common.loadFailedPrefix')} {apiErrorMessage(moulders.error)}
        </p>
      )}
      {moulders.isSuccess &&
        (moulders.data.length === 0 ? (
          <p>{t('moulders.none')}</p>
        ) : (
          <ul className="rows">
            {moulders.data.map((moulder) => (
              <li key={moulder.id} className={`row-split${moulder.active ? '' : ' is-retired'}`}>
                <Link to={`/mouleurs/${moulder.id}`}>{moulder.name}</Link>
                <span>
                  {membersText(moulder.memberCount, t)}
                  {!moulder.active && t('moulders.retiredSuffix')}
                </span>
              </li>
            ))}
          </ul>
        ))}
    </main>
  );
}
