import { SidebarProvider } from '@/shared/ui/shadcn/animate-ui/components/radix/sidebar'
import { AppFooter } from '@/widgets/app-shell/AppFooter'
import { MobileNav } from '@/widgets/app-shell/MobileNav'
import { Topbar } from '@/widgets/app-shell/Topbar'
import { UserDropdown } from '@/widgets/user-dropdown/UserDropdown'

const Frame = ({ title, path, children, className }: { title: string; path: string; children: React.ReactNode; className?: string }) => (
  <section className="flex flex-col gap-4 rounded-card bg-card p-6">
    <div className="flex flex-col gap-1">
      <h3 className="section-heading text-heading-sm">{title}</h3>
      <code className="mono-label text-slate">{path}</code>
    </div>
    {/* Подложка-холст: оболочка кабинета живёт на canvas, на белом её элементы не видны */}
    <div className={className ?? 'overflow-hidden rounded-3xl bg-background'}>{children}</div>
  </section>
)

// Плашка «под контентом»: блюр нижнего меню виден только поверх чего-то пёстрого
const BlurBackdrop = () => (
  <div className="absolute inset-0 flex flex-col justify-end gap-3 p-4 pb-6" aria-hidden>
    <div className="h-12 rounded-3xl bg-card" />
    <div className="display-heading text-heading-lg">Заезд 14:00</div>
    <div className="flex gap-3">
      <div className="h-14 flex-1 rounded-3xl bg-foreground" />
      <div className="h-14 flex-1 rounded-3xl bg-success" />
      <div className="h-14 flex-1 rounded-3xl bg-attention" />
    </div>
  </div>
)

const ShellShowcase = () => (
  <div className="flex flex-col gap-6">
    <Frame title="Хедер кабинета" path="widgets/app-shell/Topbar">
      {/* SidebarTrigger внутри шапки требует контекст сайдбара */}
      <SidebarProvider className="min-h-0">
        <div className="w-full">
          <Topbar />
        </div>
      </SidebarProvider>
    </Frame>

    <Frame title="Профиль в хедере" path="widgets/user-dropdown/UserDropdown" className="flex flex-wrap items-center gap-4 rounded-3xl bg-background p-4">
      <UserDropdown className="bg-card" />
      <UserDropdown compact className="bg-card" />
    </Frame>

    <Frame title="Нижнее меню (mobile)" path="widgets/app-shell/MobileNav">
      <div className="relative mx-auto flex h-64 max-w-[390px] items-end overflow-hidden rounded-3xl bg-background p-3">
        <BlurBackdrop />
        <MobileNav inline className="relative w-full" />
      </div>
    </Frame>

    <Frame title="Футер кабинета" path="widgets/app-shell/AppFooter">
      <AppFooter className="pb-6 md:pb-6" />
    </Frame>
  </div>
)

export default ShellShowcase
