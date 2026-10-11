import { PlusIcon, RefreshCwIcon } from 'lucide-react'
import { Link } from 'react-router'

import { useCurrentUser } from '@/entities/auth'
import { useOrganizations } from '@/entities/organization'
import { ROUTES } from '@/shared/config/paths'
import { Reveal, SplitHeadline } from '@/shared/ui/rb/motion'
import { StateView } from '@/shared/ui/rb/StateView'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { EntryShell } from '@/widgets/entry-shell/EntryShell'

import { PendingInvite } from './components/PendingInvite'
import { WorkspaceList } from './components/WorkspaceList'

// Выбор организации: сюда попадает тот, у кого их несколько. С одной вход идёт сразу в кабинет, без них — на создание
const WorkspacesPage = () => {
  const { data: user } = useCurrentUser()
  const { data, isPending, isError, refetch, isRefetching } = useOrganizations()
  const organizations = data?.data ?? []
  const state = isPending ? 'loading' : isError ? 'error' : organizations.length === 0 ? 'empty' : 'ok'

  return (
    <EntryShell>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 py-6 md:py-12">
        <header className="flex flex-col gap-5">
          {user && (
            <Reveal className="text-caption text-smoke">
              {user.name} · {user.email}
            </Reveal>
          )}
          <SplitHeadline text="Где работаем сегодня?" delay={0.1} className="brand-display text-[44px] md:text-[76px]" />
        </header>

        {state === 'ok' ? (
          <>
            <WorkspaceList organizations={organizations} />
            <PendingInvite />
            <Reveal delay={0.9}>
              <Link
                to={ROUTES.ORG_NEW}
                className="text-body-sm text-slate hover:text-foreground inline-flex w-fit items-center gap-2 underline-offset-4 hover:underline"
              >
                <PlusIcon className="size-4" aria-hidden /> Создать свою организацию
              </Link>
            </Reveal>
          </>
        ) : (
          <StateView
            state={state}
            skeleton="cards"
            empty={{
              title: 'Вы пока ни в одной организации',
              description: 'Создайте свою, чтобы вести объекты, или откройте ссылку-приглашение от владельца — организация появится здесь.',
              action: (
                <Button size="sm" className="shadow-control" asChild>
                  <Link to={ROUTES.ORG_NEW}>
                    <PlusIcon /> Создать организацию
                  </Link>
                </Button>
              ),
            }}
            error={{
              title: 'Список организаций не загрузился',
              description: 'Проверьте соединение. Если вы знаете ссылку на кабинет, она продолжит работать.',
              action: (
                <Button variant="outline" size="sm" disabled={isRefetching} onClick={() => refetch()}>
                  <RefreshCwIcon /> Повторить
                </Button>
              ),
            }}
          />
        )}
      </div>
    </EntryShell>
  )
}

export default WorkspacesPage
