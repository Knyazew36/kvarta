import { getRoleLabel } from '@/entities/organization'
import { cn } from '@/shared/lib/utils'
import { ErrorText } from '@/shared/ui/rb/ErrorText'

// Короткая подсказка под названием роли; полный список прав — рядом, в «Что будет видно»
const ROLE_TEXT: Record<string, string> = {
  manager: 'Брони, календарь, задачи команды, объекты и команда',
  administrator: 'Брони, календарь и задачи команды',
  employee: 'Только свои задачи',
}

type RoleRadioProps<Role extends string> = {
  value: Role
  onChange: (role: Role) => void
  // Роли, которые текущий пользователь может назначить (assignable_roles)
  roles: readonly Role[]
  error?: { message?: string }
}

// Поле роли для диалогов приглашения и доступа; в форму подключается через Controller
export const RoleRadio = <Role extends string>({ value, onChange, roles, error }: RoleRadioProps<Role>) => (
  <div className="flex flex-col gap-2">
    <span className="text-body-sm font-medium">Роль</span>
    <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Роль">
      {roles.map((role) => (
        <button
          key={role}
          type="button"
          role="radio"
          aria-checked={value === role}
          onClick={() => onChange(role)}
          className={cn(
            'flex flex-col items-start gap-1 rounded-2xl p-4 text-left outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30',
            value === role ? 'bg-foreground text-background' : 'bg-mist hover:bg-ash/40',
          )}
        >
          <span className="text-body-sm font-medium">{getRoleLabel(role)}</span>
          {ROLE_TEXT[role] && <span className={cn('text-caption', value === role ? 'opacity-70' : 'text-smoke')}>{ROLE_TEXT[role]}</span>}
        </button>
      ))}
    </div>
    <ErrorText errors={error} />
  </div>
)
