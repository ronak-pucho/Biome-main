import { motion } from "framer-motion";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { Button } from "@/components/ui/button";
import { BadgeCheck, Bell, Mail, User } from "lucide-react";

export default function ProfilePage() {
  const profile = {
    name: "John Doe",
    email: "john@example.com",
    tier: "Gold",
  };

  const stats = [
    { label: "Total Savings", value: "₹24,580" },
    { label: "Cashback", value: "₹3,240" },
    { label: "Orders", value: "32" },
    { label: "Alerts", value: "5" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-amber-50/30 to-white">
      <Header />

      <main className="container py-12">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-4xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground mt-2">Manage your account details and preferences.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-white rounded-2xl border border-amber-100 p-6"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-bold text-foreground">{profile.name}</p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
                      <BadgeCheck className="w-4 h-4" />
                      {profile.tier}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Mail className="w-4 h-4" />
                    <span>{profile.email}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 w-full sm:w-auto">
                <Button variant="outline" className="flex-1 sm:flex-none">
                  Edit Profile
                </Button>
                <Button className="flex-1 sm:flex-none bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
                  Upgrade
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              {stats.map((s) => (
                <div key={s.label} className="rounded-xl border border-amber-100 bg-amber-50/40 p-4">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="mt-1 text-lg font-bold text-foreground">{s.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <h2 className="text-xl font-bold text-foreground">Preferences</h2>
              <p className="text-sm text-muted-foreground mt-1">
                These are placeholders for now. We’ll wire them to real settings next.
              </p>
              <div className="mt-5 space-y-3">
                {[
                  { title: "Email notifications", icon: Mail, value: "Enabled" },
                  { title: "Push notifications", icon: Bell, value: "Enabled" },
                  { title: "Weekly summary", icon: Bell, value: "Disabled" },
                ].map((row) => {
                  const Icon = row.icon;
                  return (
                    <div
                      key={row.title}
                      className="flex items-center justify-between gap-4 rounded-xl border border-amber-100 bg-white p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-900">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{row.title}</p>
                          <p className="text-sm text-muted-foreground">{row.value}</p>
                        </div>
                      </div>
                      <Button variant="outline">Change</Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.section>

          <motion.aside
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl border border-amber-100 p-6"
          >
            <h2 className="text-xl font-bold text-foreground">Quick actions</h2>
            <div className="mt-5 space-y-3">
              <Button variant="outline" className="w-full justify-start">
                🔔 View notifications
              </Button>
              <Button variant="outline" className="w-full justify-start">
                🎯 Manage price alerts
              </Button>
              <Button variant="outline" className="w-full justify-start">
                🧾 Purchase history
              </Button>
              <Button variant="outline" className="w-full justify-start">
                ⚙️ Account settings
              </Button>
            </div>

            <div className="mt-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 p-5 text-white">
              <p className="text-sm font-semibold opacity-95">Member tier</p>
              <p className="mt-1 text-2xl font-bold">{profile.tier}</p>
              <p className="mt-2 text-sm opacity-90">Unlock higher cashback and priority deal alerts.</p>
              <Button className="mt-4 w-full bg-white text-orange-600 hover:bg-gray-100 font-semibold">
                Explore benefits
              </Button>
            </div>
          </motion.aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}

