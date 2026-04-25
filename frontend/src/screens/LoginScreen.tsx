import React, { useState } from 'react'

interface LoginScreenProps {
  onLogin: (email: string, password: string) => Promise<void>
  onDevLogin?: (email: string) => Promise<void>
  onNavigateToRegister: () => void
  showDevLogin?: boolean
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
                                                          onLogin,
                                                          onDevLogin,
                                                          onNavigateToRegister,
                                                          showDevLogin = false,
                                                        }) => {
  const [email, setEmail] = useState('demo@pokefood.local')
  const [password, setPassword] = useState('password123')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')

    try {
      setIsSubmitting(true)
      await onLogin(email, password)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Login failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDevLoginClick = async () => {
    if (!onDevLogin) return

    setErrorMessage('')
    try {
      setIsSubmitting(true)
      await onDevLogin(email)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Dev login failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
      <main className="min-h-screen bg-[var(--color-surface)] px-4 py-8 text-[var(--color-on-surface)] md:px-8">
        <section className="mx-auto w-full max-w-xl rounded-2xl border border-[var(--color-outline)] bg-[var(--color-surface-container)] p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold">Pokefood Login</h1>
          <p className="mt-3 text-xs text-[var(--color-on-surface-variant)] md:text-sm">
            Sign in to create and view your Pokefoods.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-xs text-[var(--color-on-surface)] md:text-sm">
              Email
              <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 block w-full rounded-lg border border-[var(--color-outline)] bg-[var(--color-surface-container-high)] px-3 py-2 outline-none transition focus:border-[var(--color-primary)]"
              />
            </label>

            <label className="block text-xs text-[var(--color-on-surface)] md:text-sm">
              Password
              <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 block w-full rounded-lg border border-[var(--color-outline)] bg-[var(--color-surface-container-high)] px-3 py-2 outline-none transition focus:border-[var(--color-primary)]"
              />
            </label>

            {errorMessage && (
                <p className="text-xs text-[var(--color-error)] md:text-sm">{errorMessage}</p>
            )}

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-[var(--color-primary)] px-4 py-3 text-xs text-[var(--color-on-primary)] transition hover:brightness-110 disabled:opacity-60 md:text-sm"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>

            {showDevLogin && (
                <button
                    type="button"
                    onClick={handleDevLoginClick}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-[var(--color-outline)] bg-[var(--color-surface-container-high)] px-4 py-3 text-xs text-[var(--color-on-surface)] transition hover:border-[var(--color-primary)] disabled:opacity-60 md:text-sm"
                >
                  Dev Login (npm dev only)
                </button>
            )}

            <div className="pt-4 border-t border-[var(--color-outline)] mt-4">
              <button
                  type="button"
                  onClick={onNavigateToRegister}
                  className="w-full text-xs text-[var(--color-primary)] hover:underline md:text-sm"
              >
                Don't have an account? Register here
              </button>
            </div>
          </form>
        </section>
      </main>
  )
}
