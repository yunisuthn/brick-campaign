import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { type Credentials, useLogin, useSession } from '../session/useSession.js';

export function LoginPage() {
  const session = useSession();
  const login = useLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const from = readFrom(location.state);
  const form = useForm<Credentials>({ defaultValues: { email: '', password: '' } });

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
        {fieldProblem && (
          <p role="alert" style={{ color: 'var(--error)' }}>
            {fieldProblem.message}
          </p>
        )}
        {loginRefusal.message && (
          <p role="alert" style={{ color: 'var(--error)' }}>
            Connexion impossible : {loginRefusal.message}
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
