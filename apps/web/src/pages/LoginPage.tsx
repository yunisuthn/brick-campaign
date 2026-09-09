import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { ApiError } from '../api/client.js';
import { type Credentials, useLogin, useSession } from '../session/useSession.js';

/** The API does not say which of the two is wrong, neither does the screen. */
function loginErrorMessage(error: Error): string {
  if (error instanceof ApiError && error.status === 401) return 'Email ou mot de passe incorrect.';
  return `Connexion impossible : ${error.message}`;
}

export function LoginPage() {
  const session = useSession();
  const login = useLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const from = readFrom(location.state);
  const form = useForm<Credentials>({ defaultValues: { email: '', password: '' } });

  // Already signed in (typed the URL by hand, or came back): nothing to do here.
  if (session.data) return <Navigate to={from} replace />;

  const submit = form.handleSubmit((credentials) =>
    login.mutate(credentials, { onSuccess: () => navigate(from, { replace: true }) }),
  );

  return (
    <main style={{ padding: '1rem', maxWidth: '24rem', margin: '0 auto' }}>
      <h1>Briqueterie</h1>
      <form onSubmit={submit} noValidate>
        <label style={{ display: 'block', marginBottom: '0.75rem' }}>
          Email
          <input
            type="email"
            autoComplete="username"
            inputMode="email"
            style={{ display: 'block', width: '100%', boxSizing: 'border-box' }}
            {...form.register('email', { required: 'L’email est requis.' })}
          />
        </label>
        <label style={{ display: 'block', marginBottom: '0.75rem' }}>
          Mot de passe
          <input
            type="password"
            autoComplete="current-password"
            style={{ display: 'block', width: '100%', boxSizing: 'border-box' }}
            {...form.register('password', { required: 'Le mot de passe est requis.' })}
          />
        </label>
        {(form.formState.errors.email ?? form.formState.errors.password) && (
          <p role="alert" style={{ color: 'var(--error)' }}>
            {form.formState.errors.email?.message ?? form.formState.errors.password?.message}
          </p>
        )}
        {login.isError && (
          <p role="alert" style={{ color: 'var(--error)' }}>
            {loginErrorMessage(login.error)}
          </p>
        )}
        <button type="submit" disabled={login.isPending}>
          Se connecter
        </button>
      </form>
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
