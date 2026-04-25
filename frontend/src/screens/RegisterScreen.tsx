import React, { useState } from 'react'

interface RegisterScreenProps {
  onRegister: (email: string, password: string) => Promise<void>
  onBackToLogin: () => void
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onRegister, onBackToLogin }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(''); setIsSubmitting(true)
    try {
      await onRegister(email, password)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Register failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
      <main className="min-h-screen bg-[var(--color-surface)] px-4 py-8 text-[var(--color-on-surface)] md:px-8">
        <section className="mx-auto w-full max-w-xl rounded-2xl border border-[var(--color-outline)] bg-[var(--color-surface-container)] p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold">Create Account</h1>
          <p className="mt-3 text-xs text-[var(--color-on-surface-variant)] md:text-sm">Join Pokefood to start your collection.</p>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-xs md:text-sm">Email
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 block w-full rounded-lg border border-[var(--color-outline)] bg-[var(--color-surface-container-high)] px-3 py-2 outline-none focus:border-[var(--color-primary)]" />
            </label>
            <label className="block text-xs md:text-sm">Password
              <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 block w-full rounded-lg border border-[var(--color-outline)] bg-[var(--color-surface-container-high)] px-3 py-2 outline-none focus:border-[var(--color-primary)]" />
            </label>
            {errorMessage && <p className="text-xs text-[var(--color-error)]">{errorMessage}</p>}
            <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-[var(--color-primary)] px-4 py-3 text-[var(--color-on-primary)] hover:brightness-110 disabled:opacity-60 transition">
              {isSubmitting ? 'Creating account...' : 'Register'}
            </button>
            <button type="button" onClick={onBackToLogin} className="w-full text-xs text-[var(--color-primary)] hover:underline md:text-sm">
              Already have an account? Sign in
            </button>
          </form>
        </section>
      </main>
  )
}
