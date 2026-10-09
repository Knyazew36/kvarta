import { ArrowRightIcon } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'

import { to } from '@/shared/config/paths'
import { ErrorText } from '@/shared/ui/rb/ErrorText'
import { Reveal, SplitHeadline } from '@/shared/ui/rb/motion'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { Spinner } from '@/shared/ui/shadcn/spinner'
import { EntryShell } from '@/widgets/entry-shell/EntryShell'

const SUBMIT_DELAY_MS = 700

// ── Страница ────────────────────────────────────────────────────────────────

// Организация у пользователя одна: создаётся сразу после регистрации, дальше — первые шаги
const OrgCreatePage = () => {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const orgName = name.trim()
    if (!orgName) {
      setError('Введите название организации')
      return
    }
    setPending(true)
    // Короткая пауза с индикатором: мгновенный переход выглядит как сбой, а не как успех
    window.setTimeout(() => navigate(to.onboarding('org-new'), { state: { orgName } }), SUBMIT_DELAY_MS)
  }

  return (
    <EntryShell>
      <div className="mx-auto flex w-full max-w-xl flex-col gap-10 py-6 md:py-12">
        <header className="flex flex-col gap-6">
          <Reveal className="text-caption text-smoke">Шаг 1 из 2 · организация</Reveal>
          <SplitHeadline text="Создадим организацию" delay={0.1} className="brand-display text-[44px] md:text-[64px]" />
          <Reveal delay={0.35} className="text-body text-slate">
            В ней будут объекты, брони, задачи и команда. Название видят гости и сотрудники — его можно изменить в настройках.
          </Reveal>
        </header>

        <Reveal delay={0.5}>
          <form className="flex flex-col gap-8" onSubmit={submit} noValidate>
            <div className="flex flex-col gap-2">
              <Label htmlFor="org-name" className="text-body-sm font-medium">
                Название организации
              </Label>
              <Input
                id="org-name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  setError(null)
                }}
                placeholder="Например, «Волна»"
                autoFocus
                aria-invalid={!!error}
                aria-describedby={error ? 'org-name-error' : undefined}
                className="text-body h-12"
              />
              <ErrorText id="org-name-error">{error}</ErrorText>
            </div>

            <Button type="submit" className="group shadow-control h-12" disabled={pending}>
              {pending ? (
                <>
                  <Spinner /> Создаём организацию
                </>
              ) : (
                <>
                  Создать организацию <ArrowRightIcon className="transition-transform duration-300 group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>
        </Reveal>
      </div>
    </EntryShell>
  )
}

export default OrgCreatePage
