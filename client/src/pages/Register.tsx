import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Radio } from 'lucide-react';
import config from '../config';

const { InputBoxClassName, ButtonClassNameGreen, InputLabel1 } = config;

const Register = () => {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [callsign, setCallsign] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (callsign.length < 3) {
      setError('Callsign must be at least 3 characters');
      return;
    }

    setSubmitting(true);
    try {
      await register(username, password, callsign);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-body-bg)] px-4">
      <div className="bg-[var(--color-card-bg)] border border-[var(--color-card-border)] p-8 rounded-2xl shadow-panel w-full max-w-md animate-scale-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center mb-3">
            <Radio className="w-6 h-6 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Create Account</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Join HamLog</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-danger-500/10 border border-danger-200 text-danger-500 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div>
            <label className={InputLabel1}>Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className={InputBoxClassName}
              required
              autoFocus
              minLength={3}
              maxLength={50}
            />
          </div>
          <div>
            <label className={InputLabel1}>Callsign</label>
            <input
              type="text"
              value={callsign}
              onChange={e => setCallsign(e.target.value.toUpperCase())}
              className={`${InputBoxClassName} font-mono uppercase`}
              required
              minLength={3}
              maxLength={12}
              placeholder="e.g. W1ABC"
            />
          </div>
          <div>
            <label className={InputLabel1}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={InputBoxClassName}
              required
              minLength={6}
            />
          </div>
          <div>
            <label className={InputLabel1}>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className={InputBoxClassName}
              required
              minLength={6}
            />
          </div>
          <button type="submit" disabled={submitting} className={`${ButtonClassNameGreen} w-full ${submitting ? 'opacity-60 cursor-not-allowed' : ''}`}>
            {submitting ? 'Creating account...' : 'Register'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">Log In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
