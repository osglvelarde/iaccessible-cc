import { MODULE_GROUPS, MODULES } from "@/lib/constants";
import ModuleCard from "@/components/cc/ModuleCard";
import ScanMonitorCard from "@/components/cc/ScanMonitorCard";
import DisabledModuleCard from "@/components/cc/DisabledModuleCard";
import RecentModules from "@/components/cc/RecentModules";
import IntroCard from "@/components/cc/IntroCard";

export default function Home() {
  // TODO inject real RBAC; for now enable all as example
  const access: Record<string, boolean> = Object.fromEntries(MODULES.map(m => [m.key, true]));

  return (
    <main>
      <IntroCard />
      <RecentModules className="mt-4 mb-6" />
      
      {MODULE_GROUPS.map((group, groupIndex) => (
        <section key={group.title} className={groupIndex > 0 ? "mt-8" : ""}>
          <h2 className="text-2xl font-semibold tracking-tight mb-4">{group.title}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {group.modules.map(m => {
              if (!access[m.key]) {
                return <DisabledModuleCard key={m.key} title={m.title} desc={m.desc} />;
              }
              
              // Use ScanMonitorCard for scan monitor module
              if (m.key === 'scanMonitor') {
                return <ScanMonitorCard key={m.key} title={m.title} desc={m.desc} href={m.href} />;
              }
              
              // Use regular ModuleCard for all other modules
              return <ModuleCard key={m.key} title={m.title} desc={m.desc} href={m.href} />;
            })}
          </div>
        </section>
      ))}
    </main>
  );
}

