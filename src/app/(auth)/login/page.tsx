'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/libs/supabase/client';
import { checkUserExists } from './actions';

export default function LoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<'identifier' | 'login' | 'register'>(
    'identifier'
  );
  const [identifier, setIdentifier] = useState('');
  const [realEmail, setRealEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const supabase = createClient();

  const handleGoogleLogin = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  };

  const getPasswordStrength = () => {
    if (!password) {
      return { label: '', color: 'bg-transparent' };
    }
    if (password.length < 6) {
      return { label: 'Terlalu Pendek', color: 'bg-destructive' };
    }
    let strength = 0;
    if (/[a-zA-Z]/.test(password)) {
      strength++;
    }
    if (/[0-9]/.test(password)) {
      strength++;
    }
    if (/[^a-zA-Z0-9]/.test(password)) {
      strength++;
    }

    if (strength === 1) {
      return { label: 'Lemah', color: 'bg-yellow-500' };
    }
    if (strength === 2) {
      return { label: 'Sedang', color: 'bg-blue-500' };
    }
    return { label: 'Kuat', color: 'bg-green-500' };
  };

  const handleCheckIdentifier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) {
      setErrorMsg('Masukkan email atau no handphone terlebih dahulu');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await checkUserExists(identifier);
      if (res.exists && res.email) {
        setRealEmail(res.email);
        setStep('login');
      } else {
        setStep('register');
      }
    } catch {
      setErrorMsg('Gagal mengecek data. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: realEmail || identifier,
        password,
      });
      if (error) {
        setErrorMsg('Password salah atau akun tidak ditemukan.');
      } else {
        router.push('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!fullName) {
      setErrorMsg('Nama lengkap wajib diisi');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password minimal 6 karakter');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Konfirmasi password tidak cocok');
      return;
    }

    setLoading(true);
    try {
      // Jika identifier sepertinya bukan format email (misal: angka semua dan mulai 08), buat dummy email agar bisa register dengan password
      let emailToRegister = identifier;
      const isPhoneLike = /^[0-9+]+$/.test(identifier);
      if (isPhoneLike && !identifier.includes('@')) {
        emailToRegister = `${identifier}@ecofindummy.com`; // Fallback jika Supabase Auth belum config SMS OTP password
      }

      const { error } = await supabase.auth.signUp({
        email: emailToRegister,
        password,
        options: {
          data: {
            full_name: fullName,
            phone_number: isPhoneLike ? identifier : undefined,
          },
        },
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        // Otomatis arahkan ke dashboard setelah daftar sukses
        router.push('/dashboard');
      }
    } catch {
      setErrorMsg('Gagal mendaftar. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength();

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Link
        href="/"
        className="absolute top-4 left-4 inline-flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:top-8 md:left-8"
      >
        <svg
          className="mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Kembali ke Beranda
      </Link>
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-8 text-card-foreground shadow-lg">
        <h2 className="mb-6 text-center text-3xl font-bold tracking-tight">
          {step === 'identifier' && 'Masuk ke Ecofin'}
          {step === 'login' && 'Masukkan Password'}
          {step === 'register' && 'Buat Akun Baru'}
        </h2>

        <div className="space-y-4">
          {step === 'identifier' && (
            <>
              <Button
                variant="outline"
                className="text-md h-12 w-full gap-2"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Masuk Cepat dengan Google
              </Button>

              <div className="relative flex items-center py-5">
                <div className="grow border-t border-border" />
                <span className="shrink px-6 text-sm text-muted-foreground">
                  atau
                </span>
                <div className="grow border-t border-border" />
              </div>

              <form onSubmit={handleCheckIdentifier} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email atau No. Handphone
                  </Label>
                  <Input
                    id="email"
                    type="text"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                    }}
                    className="h-12"
                    placeholder="08123xxx / email@anda.com"
                    disabled={loading}
                  />
                </div>
                {errorMsg && (
                  <p className="text-sm text-destructive">{errorMsg}</p>
                )}

                <Button
                  type="submit"
                  className="text-md h-12 w-full font-semibold"
                  disabled={loading}
                >
                  {loading ? 'Memuat...' : 'Lanjutkan'}
                </Button>
              </form>
            </>
          )}

          {step === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <p className="mb-4 text-center text-sm text-muted-foreground">
                Melanjutkan sebagai{' '}
                <span className="font-semibold text-foreground">
                  {identifier}
                </span>
              </p>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                  }}
                  className="h-12"
                  placeholder="******"
                  disabled={loading}
                />
              </div>

              {errorMsg && (
                <p className="text-sm text-destructive">{errorMsg}</p>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-1/3"
                  onClick={() => {
                    setStep('identifier');
                  }}
                  disabled={loading}
                >
                  Kembali
                </Button>
                <Button
                  type="submit"
                  className="h-12 w-2/3 font-semibold"
                  disabled={loading}
                >
                  {loading ? 'Memuat...' : 'Masuk'}
                </Button>
              </div>
            </form>
          )}

          {step === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <p className="mb-2 text-center text-sm text-muted-foreground">
                Akun belum terdaftar. Silakan lengkapi data Anda.
              </p>

              <div className="space-y-2">
                <Label htmlFor="fullname">Nama Lengkap</Label>
                <Input
                  id="fullname"
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                  }}
                  className="h-12"
                  placeholder="Budi Santoso"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-password">Buat Password</Label>
                <Input
                  id="reg-password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                  }}
                  className="h-12"
                  placeholder="Minimal 6 karakter"
                  disabled={loading}
                />
                {password.length > 0 && (
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className={`h-full ${strength.color} transition-all duration-300`}
                        style={{
                          width:
                            password.length < 6
                              ? '33%'
                              : strength.label === 'Sedang'
                                ? '66%'
                                : strength.label === 'Kuat'
                                  ? '100%'
                                  : '33%',
                        }}
                      />
                    </div>
                    <span className="w-24 text-right text-xs font-medium text-muted-foreground">
                      {strength.label}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Konfirmasi Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                  }}
                  className="h-12"
                  placeholder="Ketik ulang password"
                  disabled={loading}
                />
              </div>

              {errorMsg && (
                <p className="text-sm text-destructive">{errorMsg}</p>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-1/3"
                  onClick={() => {
                    setStep('identifier');
                  }}
                  disabled={loading}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="h-12 w-2/3 font-semibold"
                  disabled={loading}
                >
                  {loading ? 'Memuat...' : 'Daftar'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
