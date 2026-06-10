'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { checkEmailAction, loginAction } from '../_actions/login.action';
import { EmailStep } from './EmailStep';
import { PasswordStep } from './PasswordStep';

type Step = 'email' | 'password';

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [isPending, startTransition] = useTransition();

  const passwordRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 'password') passwordRef.current?.focus();
  }, [step]);

  const emailError =
    emailTouched && !email.trim()
      ? 'Email is required.'
      : emailTouched && !isValidEmail(email)
        ? 'Enter a valid email address.'
        : '';

  const passwordError =
    passwordTouched && !password
      ? 'Password is required.'
      : passwordTouched && password.length < 6
        ? 'Password must be at least 6 characters.'
        : '';

  function handleEmailSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setEmailTouched(true);
    if (!email.trim() || !isValidEmail(email)) return;

    setError('');
    startTransition(async () => {
      const result = await checkEmailAction(email.trim());
      if (result.ok) {
        setStep('password');
      } else {
        setError(result.error);
      }
    });
  }

  function handlePasswordSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setPasswordTouched(true);
    if (!password || password.length < 6) return;

    setError('');
    startTransition(async () => {
      const result = await loginAction(email.trim(), password, callbackUrl);
      if (result) setError(result.error);
    });
  }

  function handleBack() {
    setStep('email');
    setPassword('');
    setPasswordTouched(false);
    setError('');
    setTimeout(() => emailRef.current?.focus(), 50);
  }

  return (
    <div className="relative overflow-hidden">
      {/* Step 1 — Email */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          step === 'email'
            ? 'translate-x-0 opacity-100'
            : 'pointer-events-none absolute inset-0 -translate-x-8 opacity-0'
        }`}
      >
        <EmailStep
          email={email}
          emailError={emailError}
          serverError={step === 'email' ? error : ''}
          isPending={isPending && step === 'email'}
          emailRef={emailRef}
          onChange={(v) => {
            setEmail(v);
            setError('');
          }}
          onBlur={() => setEmailTouched(true)}
          onSubmit={handleEmailSubmit}
        />
      </div>

      {/* Step 2 — Password */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          step === 'password'
            ? 'translate-x-0 opacity-100'
            : 'pointer-events-none absolute inset-0 translate-x-8 opacity-0'
        }`}
      >
        <PasswordStep
          email={email}
          password={password}
          passwordError={passwordError}
          serverError={step === 'password' ? error : ''}
          isPending={isPending && step === 'password'}
          passwordRef={passwordRef}
          onChange={(v) => {
            setPassword(v);
            setError('');
          }}
          onBlur={() => setPasswordTouched(true)}
          onSubmit={handlePasswordSubmit}
          onBack={handleBack}
        />
      </div>
    </div>
  );
}
