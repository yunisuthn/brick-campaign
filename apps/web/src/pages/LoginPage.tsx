import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { TextField } from '@/components/fields';
import { LangSwitcher } from '@/components/LangSwitcher';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { type Credentials, useLogin, useSession } from '../session/useSession.js';

/**
 * The only screen with nothing around it: the mark, the name, and the two fields in a card,
 * the language switch in the corner since the shell that carries it is not there yet.
 */
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

  const submit = form.handleSubmit((credentials) =>
    login.mutate(credentials, { onSuccess: () => void navigate(from, { replace: true }) }),
  );

  return (
    <div className="ui flex min-h-dvh flex-col bg-background">
      <div className="flex justify-end px-4 py-3">
        <LangSwitcher />
      </div>
      <main className="mx-auto flex w-full max-w-sm grow flex-col justify-center gap-6 px-4 pb-16">
        <div className="flex flex-col items-center gap-3 text-center">
          <span
            aria-hidden="true"
            className="flex size-14 items-center justify-center rounded-xl bg-primary text-xl font-bold text-primary-foreground"
          >
            B
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t('shell.appName')}</h1>
            <p className="text-muted-foreground">{t('session.tagline')}</p>
          </div>
        </div>
        <Card className="px-5 py-5">
          <form onSubmit={submit} noValidate className="flex flex-col gap-4">
            <TextField
              label={t('session.emailLabel')}
              type="email"
              autoComplete="username"
              error={errors.email ?? loginRefusal.fields.email}
              registration={form.register('email', { required: t('session.emailRequired') })}
            />
            <TextField
              label={t('session.passwordLabel')}
              type="password"
              autoComplete="current-password"
              error={errors.password ?? loginRefusal.fields.password}
              registration={form.register('password', {
                required: t('session.passwordRequired'),
              })}
            />
            {loginRefusal.message && (
              <p role="alert" className="text-sm text-destructive">
                {t('session.loginFailedPrefix')} {loginRefusal.message}
              </p>
            )}
            <Button type="submit" disabled={login.isPending}>
              {t('session.submit')}
            </Button>
          </form>
        </Card>
      </main>
    </div>
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
