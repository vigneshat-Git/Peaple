import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const themeOptions = [
  { value: "light" as const, label: "Light", icon: Sun, description: "Classic light appearance" },
  { value: "dark" as const, label: "Dark", icon: Moon, description: "Reduced glare, easier on eyes" },
  { value: "system" as const, label: "System", icon: Monitor, description: "Match your device settings" },
];

const SettingsPage = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-foreground mb-6">Settings</h1>

      {/* Display Settings */}
      <section className="bg-card border rounded-md p-5 mb-4">
        <h2 className="text-base font-semibold text-foreground mb-1">Display</h2>
        <p className="text-sm text-muted-foreground mb-4">Choose how Peaple looks to you.</p>

        <div className="space-y-2">
          {themeOptions.map(opt => {
            const active = theme === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={`w-full flex items-center gap-3 p-3 rounded-md border text-left transition-colors duration-150 ${
                  active
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-secondary"
                }`}
              >
                <opt.icon className={`h-5 w-5 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} />
                <div>
                  <p className={`text-sm font-medium ${active ? "text-foreground" : "text-foreground"}`}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{opt.description}</p>
                </div>
                {active && (
                  <div className="ml-auto h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Account placeholder */}
      <section className="bg-card border rounded-md p-5">
        <h2 className="text-base font-semibold text-foreground mb-1">Account</h2>
        <p className="text-sm text-muted-foreground">Account settings coming soon.</p>
      </section>
    </div>
  );
};

export default SettingsPage;
