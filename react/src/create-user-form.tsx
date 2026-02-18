import type { CSSProperties, Dispatch, FormEvent, SetStateAction } from 'react';
import { useState, useMemo } from 'react';

interface CreateUserFormProps {
  setUserWasCreated: Dispatch<SetStateAction<boolean>>;
}

function CreateUserForm({ setUserWasCreated }: CreateUserFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [apiError, setApiError] = useState('');
  const [usernameError, setUsernameError] = useState('');

  // derive token from path (last segment of pathname)
  const token = useMemo(() => {
    // token may be provided as last segment of the path or as a query param
    const url = new URL(window.location.href);
    const fromQuery = url.searchParams.get('token');
    if (fromQuery) {
      return fromQuery;
    }
    const parts = window.location.pathname.split('/').filter(Boolean);
    return parts[parts.length - 1] || '';
  }, []);

  // client-side password criteria checks
  const criteria = useMemo(() => {
    const errors: string[] = [];
    if (password.length < 10) {
      errors.push('Password must be at least 10 characters long');
    }
    if (password.length > 24) {
      errors.push('Password must be at most 24 characters long');
    }
    if (password.includes(' ')) {
      errors.push('Password cannot contain spaces');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    return errors;
  }, [password]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setApiError('');
    setUsernameError('');

    // basic client validation
    let hasError = false;
    if (!username.trim()) {
      setUsernameError('Username is required');
      hasError = true;
    }
    if (criteria.length > 0) {
      hasError = true;
    }
    if (hasError) {
      return;
    }

    try {
      const res = await fetch(
        'https://api.challenge.hennge.com/password-validation-challenge-api/001/challenge-signup',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ username, password }),
        }
      );

      if (res.status === 200) {
        setUserWasCreated(true);
        return;
      }
      if (res.status === 401 || res.status === 403) {
        setApiError('Not authenticated to access this resource.');
        return;
      }
      if (res.status === 500) {
        setApiError('Something went wrong, please try again.');
        return;
      }
      if (res.status === 422) {
        const data = await res.json();
        if (data && Array.isArray(data.errors)) {
          if (data.errors.includes('not_allowed')) {
            setApiError(
              'Sorry, the entered password is not allowed, please try a different one.'
            );
            return;
          }
        }
        // fallback generic
        setApiError('Something went wrong, please try again.');
        return;
      }
      // other status fallback
      setApiError('Something went wrong, please try again.');
    } catch (err) {
      setApiError('Something went wrong, please try again.');
    }
  };

  return (
    <div style={formWrapper}>
      <form style={form} onSubmit={handleSubmit} noValidate>
        {apiError && <div style={apiErrorStyle}>{apiError}</div>}

        <label htmlFor="username" style={formLabel}>
          Username
        </label>
        <input
          id="username"
          name="username"
          style={formInput}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          aria-invalid={!!usernameError}
        />
        {usernameError && (
          <div style={errorItem}>{usernameError}</div>
        )}

        <label htmlFor="password" style={formLabel}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          style={formInput}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={criteria.length > 0}
        />

        {password.length > 0 && criteria.length > 0 && (
          <ul style={errorList}>
            {criteria.map((err, idx) => (
              <li key={idx} style={errorItem}>
                {err}
              </li>
            ))}
          </ul>
        )}

        <button style={formButton} type="submit">
          Create User
        </button>
      </form>
    </div>
  );
}

export { CreateUserForm };

const formWrapper: CSSProperties = {
  maxWidth: '500px',
  width: '80%',
  backgroundColor: '#efeef5',
  padding: '24px',
  borderRadius: '8px',
};

const form: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const formLabel: CSSProperties = {
  fontWeight: 700,
};

const formInput: CSSProperties = {
  outline: 'none',
  padding: '8px 16px',
  height: '40px',
  fontSize: '14px',
  backgroundColor: '#f8f7fa',
  border: '1px solid rgba(0, 0, 0, 0.12)',
  borderRadius: '4px',
};

const formButton: CSSProperties = {
  outline: 'none',
  borderRadius: '4px',
  border: '1px solid rgba(0, 0, 0, 0.12)',
  backgroundColor: '#7135d2',
  color: 'white',
  fontSize: '16px',
  fontWeight: 500,
  height: '40px',
  padding: '0 8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: '8px',
  alignSelf: 'flex-end',
  cursor: 'pointer',
};

const apiErrorStyle: CSSProperties = {
  color: 'red',
  fontWeight: 600,
};

const errorList: CSSProperties = {
  color: 'red',
  margin: 0,
  paddingLeft: '20px',
};

const errorItem: CSSProperties = {};

