import { Link } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { CONTRACT_TYPE_KEY, surfaceText } from './riceFieldFields.js';
import { useRiceFields } from './useRiceFields.js';

export function RiceFieldsPage() {
  const fields = useRiceFields();
  const { t } = useTranslation();

  return (
    <main className="page-wide">
      <h1>{t('riceFields.title')}</h1>
      <p>
        <Link to="/rizieres/nouvelle">{t('riceFields.newLink')}</Link>
      </p>
      {fields.isPending && <p role="status">{t('common.loading')}</p>}
      {fields.isError && (
        <p role="alert">
          {t('common.loadFailedPrefix')} {apiErrorMessage(fields.error)}
        </p>
      )}
      {fields.isSuccess &&
        (fields.data.length === 0 ? (
          <p>{t('riceFields.none')}</p>
        ) : (
          <ul className="rows">
            {fields.data.map((field) => (
              <li key={field.id}>
                <Link to={`/rizieres/${field.id}`}>{field.name}</Link>
                <span className="sub">
                  {field.location} · {surfaceText(field.surfaceM2, t)} ·{' '}
                  {t('riceFields.contractPrefix')}{' '}
                  {t(CONTRACT_TYPE_KEY[field.contractType]).toLowerCase()}
                </span>
              </li>
            ))}
          </ul>
        ))}
    </main>
  );
}
