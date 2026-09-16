import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { type Credentials, useLogin, useSession } from '../session/useSession.js';

export function LoginPage() {
  const session = useSession();
  const login = useLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const from = readFrom(location.state);
  const form = useForm<Credentials>({ defaultValues: { email: '', password: '' } });
  const { t } = useTranslation();

  // Already signed in (typed the URL by hand, or came back): nothing to do here.
  if (session.data) return <Navigate to={from} replace />;

  const loginRefusal = apiFormErrors(login, form);
  const { errors } = form.formState;
  const fieldProblem =
    errors.email ?? errors.password ?? loginRefusal.fields.email ?? loginRefusal.fields.password;

  const submit = form.handleSubmit((credentials) =>
    login.mutate(credentials, { onSuccess: () => navigate(from, { replace: true }) }),
  );

  return (
    <main className="page-centred">
      <div className="card login-card">
        <h1>{t('shell.appName')}</h1>
        <p className="sub">{t('session.tagline')}</p>
        <form onSubmit={submit} noValidate>
          <label>
            {t('session.emailLabel')}
            <input
              type="email"
              autoComplete="username"
              inputMode="email"
              {...form.register('email', { required: t('session.emailRequired') })}
            />
          </label>
          <label>
            {t('session.passwordLabel')}
            <input
              type="password"
              autoComplete="current-password"
              {...form.register('password', { required: t('session.passwordRequired') })}
            />
          </label>
          {fieldProblem && <p role="alert">{fieldProblem.message}</p>}
          {loginRefusal.message && (
            <p role="alert">
              {t('session.loginFailedPrefix')} {loginRefusal.message}
            </p>
          )}
          <button type="submit" disabled={login.isPending}>
            {t('session.submit')}
          </button>
        </form>
      </div>
    </main>
  );
}

/** Where the guard sent us from, if anywhere; the home page otherwise. */
function readFrom(state: unknown): string {
  if (typeof state === 'object' && state !== null && 'from' in state) {
    const { from } = state;
    if (typeof from === 'string' && from.startsWith('/')) return from;
  }
  return '/';
}
