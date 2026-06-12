import { useEffect, useState, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────
type AdminUser = {
  _id: string; firstName: string; lastName: string; email: string;
  createdAt: string; expenseCount: number; expenseTotal: number;
  noteCount: number; friendCount: number;
};
type AdminExpense = {
  _id: string; name: string; amount: number; date: string;
  type: "send" | "receive"; paymentMethod?: string; notes?: string;
  isDisabled?: boolean; user?: { firstName: string; lastName: string; email: string } | null;
};
type AdminNote = {
  _id: string; title: string; content: string; updatedAt: string;
  user?: { firstName: string; lastName: string; email: string } | null;
};
type ChartMonth = { month: string; sent: number; received: number; users: number };
type Stats = {
  userCount: number; expenseCount: number; noteCount: number;
  friendCount: number; sendTotal: number; receiveTotal: number;
  sendCount: number; receiveCount: number; newUsersThisWeek: number;
  chartMonths: ChartMonth[];
  paymentMethods: { name: string; value: number }[];
};
type Tab = "overview" | "users" | "expenses" | "notes";

// ─── Config ───────────────────────────────────────────────────────────────────
const API = (import.meta.env.VITE_API_URL as string | undefined) || "/api";

async function adminFetch(path: string, token: string, opts?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(opts?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ─── Util ─────────────────────────────────────────────────────────────────────
const fmt = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const fmtCur = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const initials = (f: string, l: string) => `${f?.[0] ?? ""}${l?.[0] ?? ""}`.toUpperCase();
const avatarColor = (email: string) => {
  const colors = ["#7c3aed","#3b82f6","#10b981","#f59e0b","#ef4444","#ec4899","#06b6d4","#8b5cf6"];
  let h = 0; for (const c of email) h = (h * 31 + c.charCodeAt(0)) % colors.length;
  return colors[h];
};

function exportCSV(rows: any[], filename: string) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]).filter(k => typeof rows[0][k] !== "object");
  const csv = [keys.join(","), ...rows.map(r => keys.map(k => JSON.stringify(r[k] ?? "")).join(","))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = filename;
  a.click();
}

// ─── Toast ────────────────────────────────────────────────────────────────────
type ToastItem = { id: number; msg: string; type: "success" | "error" };
let toastId = 0;

function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const show = (msg: string, type: "success" | "error" = "success") => {
    const id = ++toastId;
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  };
  return { toasts, show };
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({ msg, onConfirm, onCancel }: { msg: string; onConfirm(): void; onCancel(): void }) {
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center" }}>
      <div style={{ background:"#1e1b3a",border:"1px solid rgba(255,255,255,0.15)",borderRadius:16,padding:"32px 28px",maxWidth:360,textAlign:"center",boxShadow:"0 24px 60px rgba(0,0,0,0.5)" }}>
        <div style={{ fontSize:40,marginBottom:12 }}>⚠️</div>
        <p style={{ color:"#f0f0ff",fontSize:15,marginBottom:24 }}>{msg}</p>
        <div style={{ display:"flex",gap:12,justifyContent:"center" }}>
          <button onClick={onCancel} style={{ padding:"10px 24px",borderRadius:10,border:"1px solid rgba(255,255,255,0.2)",background:"transparent",color:"#ccc",cursor:"pointer",fontSize:14,fontWeight:600 }}>Cancel</button>
          <button onClick={onConfirm} style={{ padding:"10px 24px",borderRadius:10,border:"none",background:"#ef4444",color:"#fff",cursor:"pointer",fontSize:14,fontWeight:700 }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── User Detail Modal ────────────────────────────────────────────────────────
function UserDetailModal({ user, token, onClose, onUserUpdated }: { user: AdminUser; token: string; onClose(): void; onUserUpdated?(): void }) {
  const [tab, setTab] = useState<"expenses"|"notes"|"friends">("expenses");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminFetch(`/admin/users/${user._id}/${tab}`, token)
      .then(d => setData(d.expenses || d.notes || d.friends || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [tab, user._id, token]);

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:900,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:"#13112b",border:"1px solid rgba(255,255,255,0.12)",borderRadius:20,width:"100%",maxWidth:680,maxHeight:"85vh",display:"flex",flexDirection:"column",boxShadow:"0 32px 80px rgba(0,0,0,0.6)" }}>
        {/* Header */}
        <div style={{ padding:"24px 28px 0",borderBottom:"1px solid rgba(255,255,255,0.08)",paddingBottom:20 }}>
          <div style={{ display:"flex",alignItems:"center",gap:16,marginBottom:16 }}>
            <div style={{ width:52,height:52,borderRadius:"50%",background:avatarColor(user.email),display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:"#fff" }}>{initials(user.firstName,user.lastName)}</div>
            <div style={{ flex:1 }}>
              <div style={{ color:"#f0f0ff",fontSize:18,fontWeight:800 }}>{user.firstName} {user.lastName}</div>
              <div style={{ color:"rgba(255,255,255,0.5)",fontSize:13 }}>{user.email} · Joined {fmt(user.createdAt)}</div>
            </div>
            <button onClick={onClose} style={{ background:"rgba(255,255,255,0.08)",border:"none",color:"#aaa",borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center" }}>×</button>
          </div>
          <div style={{ display:"flex",gap:16 }}>
            {[{label:"Expenses",val:user.expenseCount,icon:"💸"},{label:"Total Spent",val:fmtCur(user.expenseTotal),icon:"📊"},{label:"Notes",val:user.noteCount,icon:"📝"},{label:"Friends",val:user.friendCount,icon:"👥"}].map(s=>(
              <div key={s.label} style={{ flex:1,background:"rgba(255,255,255,0.05)",borderRadius:10,padding:"10px 12px",textAlign:"center" }}>
                <div style={{ fontSize:18 }}>{s.icon}</div>
                <div style={{ color:"#f0f0ff",fontWeight:700,fontSize:16 }}>{s.val}</div>
                <div style={{ color:"rgba(255,255,255,0.45)",fontSize:11 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display:"flex",gap:4,marginTop:16 }}>
            {(["expenses","notes","friends"] as const).map(t => (
              <button key={t} onClick={()=>setTab(t)} style={{ flex:1,padding:"10px",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:13,transition:"all 0.2s",background:tab===t?"linear-gradient(135deg,#7c3aed,#3b82f6)":"rgba(255,255,255,0.05)",color:tab===t?"#fff":"rgba(255,255,255,0.5)" }}>
                {t === "expenses" ? "💸 Expenses" : t === "notes" ? "📝 Notes" : "👥 Friends"}
              </button>
            ))}
          </div>
        </div>
        {/* Body */}
        <div style={{ flex:1,overflowY:"auto",padding:"16px 28px 24px" }}>
          {loading && <div style={{ textAlign:"center",color:"rgba(255,255,255,0.4)",padding:40 }}>Loading…</div>}
          {!loading && data.length === 0 && <div style={{ textAlign:"center",color:"rgba(255,255,255,0.4)",padding:40 }}>No {tab} found.</div>}
          {!loading && tab === "expenses" && data.map((e:any) => (
            <div key={e._id} style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ width:36,height:36,borderRadius:10,background:e.type==="send"?"rgba(239,68,68,0.15)":"rgba(16,185,129,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18 }}>{e.type==="send"?"📤":"📥"}</div>
              <div style={{ flex:1 }}>
                <div style={{ color:"#f0f0ff",fontWeight:600,fontSize:14 }}>{e.name}</div>
                <div style={{ color:"rgba(255,255,255,0.4)",fontSize:12 }}>{fmt(e.date)} {e.paymentMethod ? `· ${e.paymentMethod}` : ""}</div>
              </div>
              <div style={{ color:e.type==="send"?"#f87171":"#34d399",fontWeight:700,fontSize:15 }}>{e.type==="send"?"-":"+"}₹{e.amount.toLocaleString()}</div>
            </div>
          ))}
          {!loading && tab === "notes" && data.map((n:any) => (
            <div key={n._id} style={{ padding:"14px",background:"rgba(255,255,255,0.03)",borderRadius:12,marginBottom:10,border:"1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ color:"#f0f0ff",fontWeight:700,marginBottom:6 }}>📄 {n.title}</div>
              <div style={{ color:"rgba(255,255,255,0.5)",fontSize:13,lineHeight:1.5 }}>{n.content || <em>Empty note</em>}</div>
              <div style={{ color:"rgba(255,255,255,0.3)",fontSize:11,marginTop:8 }}>{fmt(n.updatedAt)}</div>
            </div>
          ))}
          {!loading && tab === "friends" && data.map((f:any) => (
            <div key={f._id} style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ width:36,height:36,borderRadius:10,background:"rgba(236,72,153,0.15)",color:"#ec4899",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18 }}>👤</div>
              <div style={{ flex:1 }}>
                <div style={{ color:"#f0f0ff",fontWeight:600,fontSize:14 }}>{f.name}</div>
                <div style={{ color:"rgba(255,255,255,0.4)",fontSize:12 }}>{f.phone || "No phone"} {f.email ? `· ${f.email}` : ""}</div>
              </div>
              <button onClick={async () => {
                if (window.confirm(`Delete friend "${f.name}"?`)) {
                  try {
                    await adminFetch(`/admin/friends/${f._id}`, token, { method: "DELETE" });
                    setData(prev => prev.filter(p => p._id !== f._id));
                    if (onUserUpdated) onUserUpdated();
                  } catch (e) { alert("Failed to delete friend"); }
                }
              }} style={{ padding:"6px 12px",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:8,color:"#fca5a5",cursor:"pointer",fontSize:12,fontWeight:600 }}>Delete</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────
function AdminLogin({ onLogin }: { onLogin(t: string): void }) {
  const [email, setEmail] = useState("admin@gmail.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await fetch(`${API}/admin/login`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({email,password}) });
      const d = await res.json();
      if (!res.ok || !d.success) { setError(d.message || "Invalid credentials"); }
      else { sessionStorage.setItem("admin_token", d.token); onLogin(d.token); }
    } catch { setError("Could not connect to server"); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight:"100vh",display:"flex",background:"linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%)",fontFamily:"'Inter','Segoe UI',sans-serif" }}>
      {/* Left panel */}
      <div style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:48 }}>
        <div style={{ position:"relative",background:"rgba(255,255,255,0.05)",backdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:28,padding:"52px 44px",width:"100%",maxWidth:440,boxShadow:"0 32px 80px rgba(0,0,0,0.5)" }}>
          {/* Glow */}
          <div style={{ position:"absolute",top:-60,left:"50%",transform:"translateX(-50%)",width:160,height:160,borderRadius:"50%",background:"radial-gradient(circle,rgba(124,58,237,0.4) 0%,transparent 70%)",filter:"blur(20px)",pointerEvents:"none" }} />

          <div style={{ textAlign:"center",marginBottom:40,position:"relative" }}>
            <div style={{ display:"inline-flex",alignItems:"center",justifyContent:"center",width:72,height:72,borderRadius:22,background:"linear-gradient(135deg,#7c3aed,#3b82f6)",fontSize:34,marginBottom:20,boxShadow:"0 8px 32px rgba(124,58,237,0.5)" }}>🛡️</div>
            <h1 style={{ color:"#fff",fontSize:28,fontWeight:900,margin:0,letterSpacing:-0.5 }}>Admin Portal</h1>
            <p style={{ color:"rgba(255,255,255,0.45)",fontSize:14,margin:"8px 0 0" }}>Notes App · Control Center</p>
          </div>

          <form onSubmit={submit}>
            {[{id:"a-email",label:"Email Address",type:showPass?"email":"email",icon:"✉️",val:email,set:setEmail},].map(f=>(
              <div key={f.id} style={{ marginBottom:18 }}>
                <label style={{ display:"block",color:"rgba(255,255,255,0.6)",fontSize:12,fontWeight:700,marginBottom:8,letterSpacing:0.5,textTransform:"uppercase" }}>{f.label}</label>
                <div style={{ position:"relative" }}>
                  <span style={{ position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:17 }}>{f.icon}</span>
                  <input id={f.id} type={f.type} value={f.val} onChange={e=>f.set(e.target.value)} required
                    style={{ width:"100%",boxSizing:"border-box",padding:"14px 16px 14px 44px",background:"rgba(255,255,255,0.07)",border:"1.5px solid rgba(255,255,255,0.12)",borderRadius:14,color:"#fff",fontSize:15,outline:"none" }}
                    onFocus={e=>e.target.style.borderColor="rgba(124,58,237,0.8)"} onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.12)"} />
                </div>
              </div>
            ))}

            <div style={{ marginBottom:24 }}>
              <label style={{ display:"block",color:"rgba(255,255,255,0.6)",fontSize:12,fontWeight:700,marginBottom:8,letterSpacing:0.5,textTransform:"uppercase" }}>Password</label>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:17 }}>🔑</span>
                <input id="a-password" type={showPass?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} required
                  style={{ width:"100%",boxSizing:"border-box",padding:"14px 48px 14px 44px",background:"rgba(255,255,255,0.07)",border:"1.5px solid rgba(255,255,255,0.12)",borderRadius:14,color:"#fff",fontSize:15,outline:"none" }}
                  onFocus={e=>e.target.style.borderColor="rgba(124,58,237,0.8)"} onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.12)"} />
                <button type="button" onClick={()=>setShowPass(v=>!v)} style={{ position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:18,color:"rgba(255,255,255,0.5)" }}>{showPass?"🙈":"👁️"}</button>
              </div>
            </div>

            {error && <div style={{ background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.4)",borderRadius:10,padding:"10px 14px",color:"#fca5a5",fontSize:13,marginBottom:18 }}>⚠️ {error}</div>}

            <button id="admin-login-btn" type="submit" disabled={loading}
              style={{ width:"100%",padding:"15px",background:loading?"rgba(124,58,237,0.4)":"linear-gradient(135deg,#7c3aed,#3b82f6)",border:"none",borderRadius:14,color:"#fff",fontSize:16,fontWeight:800,cursor:loading?"not-allowed":"pointer",boxShadow:"0 4px 20px rgba(124,58,237,0.4)",letterSpacing:0.3,transition:"opacity 0.2s" }}>
              {loading ? "Signing in…" : "🚀 Sign In as Admin"}
            </button>
          </form>

          <p style={{ textAlign:"center",color:"rgba(255,255,255,0.25)",fontSize:12,marginTop:24 }}>Secured · Notes App Control Center</p>
        </div>
      </div>

      {/* Right decorative panel */}
      <div style={{ flex:1,display:"none",background:"rgba(255,255,255,0.03)",alignItems:"center",justifyContent:"center",padding:48,flexDirection:"column",gap:32 }} className="login-right">
        {[{icon:"👤",label:"User Management",desc:"View, search and manage all registered users"},{icon:"💸",label:"Expense Tracking",desc:"Monitor all financial transactions across users"},{icon:"📝",label:"Notes Overview",desc:"Browse and manage notes created by all users"},{icon:"📊",label:"Live Analytics",desc:"Real-time stats and activity overview"},].map(f=>(
          <div key={f.label} style={{ display:"flex",gap:16,alignItems:"flex-start",maxWidth:320 }}>
            <div style={{ width:44,height:44,borderRadius:12,background:"rgba(124,58,237,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0 }}>{f.icon}</div>
            <div>
              <div style={{ color:"#f0f0ff",fontWeight:700,marginBottom:4 }}>{f.label}</div>
              <div style={{ color:"rgba(255,255,255,0.45)",fontSize:13,lineHeight:1.5 }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, gradient }: { icon:string; label:string; value:string|number; sub?:string; gradient:string }) {
  return (
    <div style={{ background:gradient,borderRadius:18,padding:"22px 24px",boxShadow:"0 4px 24px rgba(0,0,0,0.3)",position:"relative",overflow:"hidden" }}>
      <div style={{ position:"absolute",right:-12,top:-12,fontSize:60,opacity:0.12,lineHeight:1 }}>{icon}</div>
      <div style={{ fontSize:28,marginBottom:8 }}>{icon}</div>
      <div style={{ color:"rgba(255,255,255,0.7)",fontSize:12,fontWeight:700,letterSpacing:0.8,textTransform:"uppercase",marginBottom:4 }}>{label}</div>
      <div style={{ color:"#fff",fontSize:28,fontWeight:900,letterSpacing:-0.5 }}>{value}</div>
      {sub && <div style={{ color:"rgba(255,255,255,0.55)",fontSize:12,marginTop:4 }}>{sub}</div>}
    </div>
  );
}

// ─── Search Bar ────────────────────────────────────────────────────────────────
function SearchBar({ value, onChange, placeholder }: { value:string; onChange(v:string):void; placeholder:string }) {
  return (
    <div style={{ position:"relative",flex:1 }}>
      <span style={{ position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:16,pointerEvents:"none" }}>🔍</span>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{ width:"100%",boxSizing:"border-box",padding:"11px 16px 11px 42px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,color:"#f0f0ff",fontSize:14,outline:"none" }}
        onFocus={e=>e.target.style.borderColor="rgba(124,58,237,0.6)"} onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.1)"} />
    </div>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────
function AdminDashboard({ token, onLogout }: { token:string; onLogout():void }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [expenses, setExpenses] = useState<AdminExpense[]>([]);
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("");
  const [sortDir, setSortDir] = useState<1|-1>(1);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [confirm, setConfirm] = useState<{msg:string; onOk():void} | null>(null);
  const [filterType, setFilterType] = useState("all");
  const { toasts, show: showToast } = useToast();

  const load = useCallback(async (t: Tab) => {
    setLoading(true); setSearch("");
    try {
      if (t === "overview") {
        const [sd, ud, ed, nd] = await Promise.all([
          adminFetch("/admin/stats", token),
          adminFetch("/admin/users", token),
          adminFetch("/admin/expenses", token),
          adminFetch("/admin/notes", token),
        ]);
        setStats(sd.stats); setUsers(ud.users || []); setExpenses(ed.expenses || []); setNotes(nd.notes || []);
      } else if (t === "users") {
        const d = await adminFetch("/admin/users", token); setUsers(d.users || []);
      } else if (t === "expenses") {
        const d = await adminFetch("/admin/expenses", token); setExpenses(d.expenses || []);
      } else {
        const d = await adminFetch("/admin/notes", token); setNotes(d.notes || []);
      }
    } catch { showToast("Failed to load data", "error"); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(tab); }, [tab, load]);

  // Sort helper
  function toggleSort(field: string) {
    if (sortField === field) setSortDir(d => d === 1 ? -1 : 1);
    else { setSortField(field); setSortDir(1); }
  }
  function SortIcon({ field }: { field: string }) {
    if (sortField !== field) return <span style={{ color:"rgba(255,255,255,0.2)" }}>↕</span>;
    return <span style={{ color:"#a78bfa" }}>{sortDir === 1 ? "↑" : "↓"}</span>;
  }

  // Filtered + sorted data
  const q = search.toLowerCase();
  const filteredUsers = users.filter(u => `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q))
    .sort((a:any,b:any) => sortField ? (a[sortField] > b[sortField] ? sortDir : -sortDir) : 0);

  const filteredExpenses = expenses
    .filter(e => {
      const matchSearch = `${e.name} ${e.user?.firstName ?? ""} ${e.user?.email ?? ""} ${e.paymentMethod ?? ""}`.toLowerCase().includes(q);
      const matchType = filterType === "all" || e.type === filterType;
      return matchSearch && matchType;
    })
    .sort((a:any,b:any) => sortField ? (a[sortField] > b[sortField] ? sortDir : -sortDir) : 0);

  const filteredNotes = notes
    .filter(n => `${n.title} ${n.content} ${n.user?.firstName ?? ""} ${n.user?.email ?? ""}`.toLowerCase().includes(q))
    .sort((a:any,b:any) => sortField ? (a[sortField] > b[sortField] ? sortDir : -sortDir) : 0);

  const sendTotal = expenses.filter(e=>e.type==="send").reduce((s,e)=>s+e.amount,0);
  const recvTotal = expenses.filter(e=>e.type==="receive").reduce((s,e)=>s+e.amount,0);

  // Delete handlers
  async function deleteExpense(id: string) {
    try { await adminFetch(`/admin/expenses/${id}`, token, { method:"DELETE" }); setExpenses(ex=>ex.filter(e=>e._id!==id)); showToast("Expense deleted"); }
    catch { showToast("Failed to delete", "error"); }
    finally { setConfirm(null); }
  }
  async function deleteNote(id: string) {
    try { await adminFetch(`/admin/notes/${id}`, token, { method:"DELETE" }); setNotes(ns=>ns.filter(n=>n._id!==id)); showToast("Note deleted"); }
    catch { showToast("Failed to delete", "error"); }
    finally { setConfirm(null); }
  }
  async function deleteUser(id: string) {
    try { await adminFetch(`/admin/users/${id}`, token, { method:"DELETE" }); setUsers(us=>us.filter(u=>u._id!==id)); showToast("User deleted"); }
    catch { showToast("Failed to delete", "error"); }
    finally { setConfirm(null); }
  }

  const C = { bg:"#090818", surface:"rgba(255,255,255,0.04)", border:"rgba(255,255,255,0.08)", text:"#f0f0ff", muted:"rgba(255,255,255,0.4)" };
  const tabList: {id:Tab; icon:string; label:string}[] = [
    {id:"overview",icon:"📊",label:"Overview"},
    {id:"users",icon:"👥",label:"Users"},
    {id:"expenses",icon:"💸",label:"Expenses"},
    {id:"notes",icon:"📝",label:"Notes"},
  ];

  const TH = ({ children, field }: { children:React.ReactNode; field?:string }) => (
    <th onClick={field?()=>toggleSort(field):undefined} style={{ padding:"13px 18px",textAlign:"left",fontSize:11,fontWeight:700,color:C.muted,letterSpacing:0.8,textTransform:"uppercase",borderBottom:`1px solid ${C.border}`,cursor:field?"pointer":"default",userSelect:"none",whiteSpace:"nowrap" }}>
      {children} {field && <SortIcon field={field}/>}
    </th>
  );

  return (
    <div style={{ minHeight:"100vh",background:C.bg,fontFamily:"'Inter','Segoe UI',sans-serif",color:C.text,display:"flex" }}>
      {/* Sidebar */}
      <aside style={{ width:220,flexShrink:0,background:"rgba(255,255,255,0.03)",borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh" }}>
        <div style={{ padding:"28px 20px 20px" }}>
          <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:32 }}>
            <div style={{ width:38,height:38,borderRadius:11,background:"linear-gradient(135deg,#7c3aed,#3b82f6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20 }}>🛡️</div>
            <div>
              <div style={{ fontWeight:900,fontSize:15,letterSpacing:-0.3 }}>Admin Panel</div>
              <div style={{ color:C.muted,fontSize:11 }}>Notes App</div>
            </div>
          </div>
          <nav style={{ display:"flex",flexDirection:"column",gap:4 }}>
            {tabList.map(t => (
              <button key={t.id} id={`admin-tab-${t.id}`} onClick={()=>setTab(t.id)} style={{ display:"flex",alignItems:"center",gap:10,padding:"11px 14px",borderRadius:12,border:"none",cursor:"pointer",textAlign:"left",transition:"all 0.2s",background:tab===t.id?"linear-gradient(135deg,rgba(124,58,237,0.3),rgba(59,130,246,0.2))":"transparent",color:tab===t.id?"#c4b5fd":C.muted,fontWeight:tab===t.id?700:500,fontSize:14,borderLeft:tab===t.id?"3px solid #7c3aed":"3px solid transparent" }}>
                <span style={{ fontSize:18 }}>{t.icon}</span>{t.label}
              </button>
            ))}
          </nav>
        </div>
        <div style={{ marginTop:"auto",padding:"20px" }}>
          <div style={{ background:"rgba(255,255,255,0.05)",borderRadius:12,padding:"12px 14px",marginBottom:12 }}>
            <div style={{ color:C.muted,fontSize:11,marginBottom:2 }}>Signed in as</div>
            <div style={{ color:"#c4b5fd",fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>admin@gmail.com</div>
          </div>
          <button id="admin-logout-btn" onClick={onLogout} style={{ width:"100%",padding:"10px",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:10,color:"#fca5a5",fontSize:13,fontWeight:600,cursor:"pointer" }}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex:1,overflowY:"auto",minWidth:0 }}>
        <div style={{ maxWidth:1100,margin:"0 auto",padding:"32px 28px 60px" }}>

          {/* Overview */}
          {tab === "overview" && (
            <>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:28 }}>
                <div>
                  <h2 style={{ margin:0,fontSize:24,fontWeight:900,letterSpacing:-0.5 }}>Dashboard Overview</h2>
                  <p style={{ color:C.muted,margin:"6px 0 0",fontSize:14 }}>Real-time snapshot of your Notes App data</p>
                </div>
                <button onClick={()=>load("overview")} style={{ padding:"10px 18px",background:"rgba(255,255,255,0.06)",border:`1px solid ${C.border}`,borderRadius:12,color:C.muted,cursor:"pointer",fontSize:13,fontWeight:600 }}>🔄 Refresh</button>
              </div>

              {loading ? <div style={{ color:C.muted,padding:80,textAlign:"center",fontSize:16 }}>⏳ Loading…</div> : (
                <>
                  {/* ── Stat Cards ── */}
                  <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:14,marginBottom:28 }}>
                    <StatCard icon="👤" label="Total Users" value={stats?.userCount??0} sub={`+${stats?.newUsersThisWeek??0} this week`} gradient="linear-gradient(135deg,#7c3aed,#5b21b6)" />
                    <StatCard icon="💸" label="Expenses" value={stats?.expenseCount??0} gradient="linear-gradient(135deg,#0ea5e9,#0369a1)" />
                    <StatCard icon="📤" label="Total Sent" value={fmtCur(stats?.sendTotal??0)} sub={`${stats?.sendCount??0} transactions`} gradient="linear-gradient(135deg,#ef4444,#b91c1c)" />
                    <StatCard icon="📥" label="Total Received" value={fmtCur(stats?.receiveTotal??0)} sub={`${stats?.receiveCount??0} transactions`} gradient="linear-gradient(135deg,#10b981,#047857)" />
                    <StatCard icon="📝" label="Notes" value={stats?.noteCount??0} gradient="linear-gradient(135deg,#f59e0b,#b45309)" />
                    <StatCard icon="👥" label="Friends" value={stats?.friendCount??0} gradient="linear-gradient(135deg,#ec4899,#be185d)" />
                  </div>

                  {/* ── Row 1: Area Chart + Donut ── */}
                  <div style={{ display:"grid",gridTemplateColumns:"2fr 1fr",gap:20,marginBottom:20 }}>

                    {/* Area Chart: Expense Trends */}
                    <div style={{ background:C.surface,border:`1px solid ${C.border}`,borderRadius:18,padding:"22px 24px" }}>
                      <div style={{ marginBottom:20 }}>
                        <div style={{ fontWeight:800,fontSize:15 }}>📈 Expense Trends (Last 6 Months)</div>
                        <div style={{ color:C.muted,fontSize:12,marginTop:4 }}>Monthly sent vs received amounts</div>
                      </div>
                      <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={stats?.chartMonths??[]} margin={{ top:5,right:10,left:0,bottom:0 }}>
                          <defs>
                            <linearGradient id="gradSent" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="gradRecv" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                          <XAxis dataKey="month" tick={{ fill:"rgba(255,255,255,0.4)",fontSize:11 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill:"rgba(255,255,255,0.4)",fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k`:v} />
                          <Tooltip cursor={false} contentStyle={{ background:"#1e1b3a",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,color:"#f0f0ff",fontSize:12 }} formatter={(v:any)=>[`₹${Number(v).toLocaleString()}`,""]} />
                          <Legend wrapperStyle={{ fontSize:12,color:"rgba(255,255,255,0.5)" }} />
                          <Area type="monotone" dataKey="sent" name="Sent" stroke="#ef4444" strokeWidth={2} fill="url(#gradSent)" dot={{ fill:"#ef4444",r:4 }} />
                          <Area type="monotone" dataKey="received" name="Received" stroke="#10b981" strokeWidth={2} fill="url(#gradRecv)" dot={{ fill:"#10b981",r:4 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Donut Chart: Sent vs Received */}
                    <div style={{ background:C.surface,border:`1px solid ${C.border}`,borderRadius:18,padding:"22px 24px" }}>
                      <div style={{ marginBottom:16 }}>
                        <div style={{ fontWeight:800,fontSize:15 }}>🍩 Expense Split</div>
                        <div style={{ color:C.muted,fontSize:12,marginTop:4 }}>Sent vs Received ratio</div>
                      </div>
                      {(stats?.sendTotal??0) + (stats?.receiveTotal??0) === 0 ? (
                        <div style={{ height:200,display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,fontSize:13 }}>No expense data yet</div>
                      ) : (
                        <>
                          <ResponsiveContainer width="100%" height={160}>
                            <PieChart>
                              <Pie data={[
                                { name:"Sent", value: stats?.sendTotal??0 },
                                { name:"Received", value: stats?.receiveTotal??0 },
                              ]} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={4} dataKey="value">
                                <Cell fill="#ef4444" />
                                <Cell fill="#10b981" />
                              </Pie>
                              <Tooltip cursor={false} contentStyle={{ background:"#1e1b3a",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,color:"#f0f0ff",fontSize:12 }} formatter={(v:any)=>[`₹${Number(v).toLocaleString()}`,""]} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div style={{ display:"flex",flexDirection:"column",gap:8,marginTop:8 }}>
                            {[{label:"📤 Sent",val:stats?.sendTotal??0,color:"#ef4444"},{label:"📥 Received",val:stats?.receiveTotal??0,color:"#10b981"}].map(item=>(
                              <div key={item.label} style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                                <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                                  <div style={{ width:10,height:10,borderRadius:"50%",background:item.color }} />
                                  <span style={{ color:C.muted,fontSize:12 }}>{item.label}</span>
                                </div>
                                <span style={{ color:item.color,fontWeight:700,fontSize:13 }}>{fmtCur(item.val)}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* ── Row 2: User Growth Bar + Payment Methods ── */}
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20 }}>

                    {/* Bar Chart: User Growth */}
                    <div style={{ background:C.surface,border:`1px solid ${C.border}`,borderRadius:18,padding:"22px 24px" }}>
                      <div style={{ marginBottom:20 }}>
                        <div style={{ fontWeight:800,fontSize:15 }}>👤 User Growth (Last 6 Months)</div>
                        <div style={{ color:C.muted,fontSize:12,marginTop:4 }}>New registrations per month</div>
                      </div>
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={stats?.chartMonths??[]} margin={{ top:5,right:10,left:0,bottom:0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false}/>
                          <XAxis dataKey="month" tick={{ fill:"rgba(255,255,255,0.4)",fontSize:11 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill:"rgba(255,255,255,0.4)",fontSize:11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <Tooltip cursor={false} contentStyle={{ background:"#1e1b3a",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,color:"#f0f0ff",fontSize:12 }} />
                          <Bar dataKey="users" name="New Users" fill="#7c3aed" radius={[6,6,0,0]}>
                            {(stats?.chartMonths??[]).map((_,i)=>(
                              <Cell key={i} fill={`hsl(${260+i*10},70%,${55+i*3}%)`} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Bar Chart: Payment Methods */}
                    <div style={{ background:C.surface,border:`1px solid ${C.border}`,borderRadius:18,padding:"22px 24px" }}>
                      <div style={{ marginBottom:20 }}>
                        <div style={{ fontWeight:800,fontSize:15 }}>💳 Payment Methods</div>
                        <div style={{ color:C.muted,fontSize:12,marginTop:4 }}>Most used payment methods</div>
                      </div>
                      {(stats?.paymentMethods?.length??0) === 0 ? (
                        <div style={{ height:180,display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,fontSize:13 }}>No payment method data</div>
                      ) : (
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart data={stats?.paymentMethods??[]} layout="vertical" margin={{ top:0,right:10,left:0,bottom:0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                            <XAxis type="number" tick={{ fill:"rgba(255,255,255,0.4)",fontSize:11 }} axisLine={false} tickLine={false} />
                            <YAxis type="category" dataKey="name" tick={{ fill:"rgba(255,255,255,0.55)",fontSize:12 }} axisLine={false} tickLine={false} width={70} />
                            <Tooltip cursor={false} contentStyle={{ background:"#1e1b3a",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,color:"#f0f0ff",fontSize:12 }} />
                            <Bar dataKey="value" name="Count" radius={[0,6,6,0]}>
                              {(stats?.paymentMethods??[]).map((_,i)=>(
                                <Cell key={i} fill={["#7c3aed","#3b82f6","#10b981","#f59e0b","#ef4444","#ec4899"][i%6]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* ── Row 3: Recent Users + Recent Expenses ── */}
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:20 }}>
                    <div style={{ background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,overflow:"hidden" }}>
                      <div style={{ padding:"16px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                        <span style={{ fontWeight:700,fontSize:14 }}>👤 Recent Users</span>
                        <button onClick={()=>setTab("users")} style={{ background:"rgba(124,58,237,0.15)",border:"none",color:"#a78bfa",borderRadius:8,padding:"5px 12px",cursor:"pointer",fontSize:12,fontWeight:600 }}>View All →</button>
                      </div>
                      {users.length===0 && <div style={{ padding:24,textAlign:"center",color:C.muted,fontSize:13 }}>No users yet</div>}
                      {users.slice(0,5).map(u=>(
                        <div key={u._id} style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 20px",borderBottom:`1px solid ${C.border}` }}>
                          <div style={{ width:34,height:34,borderRadius:"50%",background:avatarColor(u.email),display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,color:"#fff",flexShrink:0 }}>{initials(u.firstName,u.lastName)}</div>
                          <div style={{ flex:1,minWidth:0 }}>
                            <div style={{ fontWeight:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{u.firstName} {u.lastName}</div>
                            <div style={{ color:C.muted,fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{u.email}</div>
                          </div>
                          <div style={{ color:C.muted,fontSize:11,flexShrink:0 }}>{fmt(u.createdAt)}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,overflow:"hidden" }}>
                      <div style={{ padding:"16px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                        <span style={{ fontWeight:700,fontSize:14 }}>💸 Recent Expenses</span>
                        <button onClick={()=>setTab("expenses")} style={{ background:"rgba(124,58,237,0.15)",border:"none",color:"#a78bfa",borderRadius:8,padding:"5px 12px",cursor:"pointer",fontSize:12,fontWeight:600 }}>View All →</button>
                      </div>
                      {expenses.length===0 && <div style={{ padding:24,textAlign:"center",color:C.muted,fontSize:13 }}>No expenses yet</div>}
                      {expenses.slice(0,5).map(e=>(
                        <div key={e._id} style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 20px",borderBottom:`1px solid ${C.border}` }}>
                          <div style={{ width:34,height:34,borderRadius:10,background:e.type==="send"?"rgba(239,68,68,0.15)":"rgba(16,185,129,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0 }}>{e.type==="send"?"📤":"📥"}</div>
                          <div style={{ flex:1,minWidth:0 }}>
                            <div style={{ fontWeight:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{e.name}</div>
                            <div style={{ color:C.muted,fontSize:11 }}>{e.user ? `${e.user.firstName} ${e.user.lastName}` : "—"}</div>
                          </div>
                          <div style={{ color:e.type==="send"?"#f87171":"#34d399",fontWeight:700,fontSize:14,flexShrink:0 }}>{e.type==="send"?"-":"+"}₹{e.amount.toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* Users Tab */}
          {tab === "users" && (
            <>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:12 }}>
                <div>
                  <h2 style={{ margin:0,fontSize:22,fontWeight:900 }}>👥 Users ({filteredUsers.length})</h2>
                  <p style={{ color:C.muted,margin:"4px 0 0",fontSize:13 }}>All registered app users</p>
                </div>
                <div style={{ display:"flex",gap:10 }}>
                  <SearchBar value={search} onChange={setSearch} placeholder="Search users…" />
                  <button onClick={()=>exportCSV(filteredUsers.map(({_id,...r})=>({name:`${r.firstName} ${r.lastName}`,email:r.email,joined:fmt(r.createdAt),expenses:r.expenseCount,notes:r.noteCount})),"users.csv")} style={{ padding:"10px 18px",background:"rgba(16,185,129,0.15)",border:"1px solid rgba(16,185,129,0.3)",borderRadius:12,color:"#34d399",cursor:"pointer",fontSize:13,fontWeight:600,whiteSpace:"nowrap" }}>⬇ CSV</button>
                  <button onClick={()=>load("users")} style={{ padding:"10px 18px",background:"rgba(255,255,255,0.06)",border:`1px solid ${C.border}`,borderRadius:12,color:C.muted,cursor:"pointer",fontSize:13,fontWeight:600 }}>🔄 Refresh</button>
                </div>
              </div>
              <div style={{ background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,overflow:"hidden" }}>
                {loading ? <div style={{ padding:60,textAlign:"center",color:C.muted }}>Loading…</div> : (
                  <table style={{ width:"100%",borderCollapse:"collapse" }}>
                    <thead><tr style={{ background:"rgba(255,255,255,0.03)" }}>
                      <TH field="firstName">User</TH>
                      <TH field="expenseCount">Expenses</TH>
                      <TH field="expenseTotal">Spent</TH>
                      <TH field="noteCount">Notes</TH>
                      <TH field="friendCount">Friends</TH>
                      <TH field="createdAt">Joined</TH>
                      <TH>Actions</TH>
                    </tr></thead>
                    <tbody>
                      {filteredUsers.length === 0 && <tr><td colSpan={7} style={{ padding:40,textAlign:"center",color:C.muted }}>No users found</td></tr>}
                      {filteredUsers.map((u,i)=>(
                        <tr key={u._id} style={{ borderBottom:i<filteredUsers.length-1?`1px solid ${C.border}`:"none",transition:"background 0.15s",cursor:"pointer" }}
                          onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.025)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                          <td style={{ padding:"14px 18px" }}>
                            <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                              <div style={{ width:38,height:38,borderRadius:"50%",background:avatarColor(u.email),display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,color:"#fff",flexShrink:0 }}>{initials(u.firstName,u.lastName)}</div>
                              <div>
                                <div style={{ fontWeight:700,fontSize:14 }}>{u.firstName} {u.lastName}</div>
                                <div style={{ color:C.muted,fontSize:12 }}>{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding:"14px 18px",fontWeight:600 }}>{u.expenseCount}</td>
                          <td style={{ padding:"14px 18px",color:"#34d399",fontWeight:700 }}>{fmtCur(u.expenseTotal)}</td>
                          <td style={{ padding:"14px 18px",fontWeight:600 }}>{u.noteCount}</td>
                          <td style={{ padding:"14px 18px",fontWeight:600 }}>{u.friendCount}</td>
                          <td style={{ padding:"14px 18px",color:C.muted,fontSize:13 }}>{fmt(u.createdAt)}</td>
                          <td style={{ padding:"14px 18px" }}>
                            <div style={{ display:"flex",gap:8 }}>
                              <button onClick={()=>setSelectedUser(u)} style={{ padding:"7px 14px",background:"rgba(124,58,237,0.15)",border:"1px solid rgba(124,58,237,0.3)",borderRadius:8,color:"#a78bfa",cursor:"pointer",fontSize:12,fontWeight:600 }}>View</button>
                              <button onClick={()=>setConfirm({msg:`Delete ${u.firstName} ${u.lastName} and ALL their data?`,onOk:()=>deleteUser(u._id)})} style={{ padding:"7px 14px",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:8,color:"#fca5a5",cursor:"pointer",fontSize:12,fontWeight:600 }}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {/* Expenses Tab */}
          {tab === "expenses" && (
            <>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:12 }}>
                <div>
                  <h2 style={{ margin:0,fontSize:22,fontWeight:900 }}>💸 Expenses ({filteredExpenses.length})</h2>
                  <p style={{ color:C.muted,margin:"4px 0 0",fontSize:13 }}>
                    <span style={{ color:"#f87171" }}>Sent: {fmtCur(sendTotal)}</span> · <span style={{ color:"#34d399" }}>Received: {fmtCur(recvTotal)}</span>
                  </p>
                </div>
                <div style={{ display:"flex",gap:10,flexWrap:"wrap" }}>
                  <SearchBar value={search} onChange={setSearch} placeholder="Search expenses…" />
                  <select value={filterType} onChange={e=>setFilterType(e.target.value)} style={{ padding:"10px 14px",background:"rgba(255,255,255,0.06)",border:`1px solid ${C.border}`,borderRadius:12,color:C.text,fontSize:13,cursor:"pointer",outline:"none" }}>
                    <option value="all">All Types</option>
                    <option value="send">Sent</option>
                    <option value="receive">Received</option>
                  </select>
                  <button onClick={()=>exportCSV(filteredExpenses.map(e=>({user:`${e.user?.firstName??""} ${e.user?.lastName??""}`.trim()||"—",email:e.user?.email??"—",title:e.name,amount:e.amount,type:e.type,date:fmt(e.date),payment:e.paymentMethod||"—"})),"expenses.csv")} style={{ padding:"10px 18px",background:"rgba(16,185,129,0.15)",border:"1px solid rgba(16,185,129,0.3)",borderRadius:12,color:"#34d399",cursor:"pointer",fontSize:13,fontWeight:600,whiteSpace:"nowrap" }}>⬇ CSV</button>
                  <button onClick={()=>load("expenses")} style={{ padding:"10px 18px",background:"rgba(255,255,255,0.06)",border:`1px solid ${C.border}`,borderRadius:12,color:C.muted,cursor:"pointer",fontSize:13,fontWeight:600 }}>🔄 Refresh</button>
                </div>
              </div>
              <div style={{ background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,overflow:"hidden" }}>
                {loading ? <div style={{ padding:60,textAlign:"center",color:C.muted }}>Loading…</div> : (
                  <table style={{ width:"100%",borderCollapse:"collapse" }}>
                    <thead><tr style={{ background:"rgba(255,255,255,0.03)" }}>
                      <TH field="name">Title</TH>
                      <TH>User</TH>
                      <TH field="amount">Amount</TH>
                      <TH field="type">Type</TH>
                      <TH>Payment</TH>
                      <TH field="date">Date</TH>
                      <TH>Action</TH>
                    </tr></thead>
                    <tbody>
                      {filteredExpenses.length === 0 && <tr><td colSpan={7} style={{ padding:40,textAlign:"center",color:C.muted }}>No expenses found</td></tr>}
                      {filteredExpenses.map((e,i)=>(
                        <tr key={e._id} style={{ borderBottom:i<filteredExpenses.length-1?`1px solid ${C.border}`:"none",opacity:e.isDisabled?0.4:1,transition:"background 0.15s" }}
                          onMouseEnter={ev=>ev.currentTarget.style.background="rgba(255,255,255,0.025)"} onMouseLeave={ev=>ev.currentTarget.style.background="transparent"}>
                          <td style={{ padding:"13px 18px",maxWidth:160 }}>
                            <div style={{ fontWeight:700,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{e.name}</div>
                            {e.notes && <div style={{ color:C.muted,fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{e.notes}</div>}
                          </td>
                          <td style={{ padding:"13px 18px" }}>
                            {e.user ? <div style={{ fontSize:13 }}><div style={{ fontWeight:600 }}>{e.user.firstName} {e.user.lastName}</div><div style={{ color:C.muted,fontSize:11 }}>{e.user.email}</div></div> : <span style={{ color:C.muted }}>—</span>}
                          </td>
                          <td style={{ padding:"13px 18px",fontWeight:800,fontSize:15,color:e.type==="send"?"#f87171":"#34d399" }}>{e.type==="send"?"-":"+"}₹{e.amount.toLocaleString()}</td>
                          <td style={{ padding:"13px 18px" }}>
                            <span style={{ display:"inline-flex",alignItems:"center",padding:"3px 12px",borderRadius:99,fontSize:12,fontWeight:700,background:e.type==="send"?"rgba(239,68,68,0.18)":"rgba(16,185,129,0.18)",color:e.type==="send"?"#f87171":"#34d399" }}>{e.type==="send"?"📤 Sent":"📥 Received"}</span>
                          </td>
                          <td style={{ padding:"13px 18px",color:C.muted,fontSize:13 }}>{e.paymentMethod || "—"}</td>
                          <td style={{ padding:"13px 18px",color:C.muted,fontSize:13 }}>{fmt(e.date)}</td>
                          <td style={{ padding:"13px 18px" }}>
                            <button onClick={()=>setConfirm({msg:`Delete expense "${e.name}"?`,onOk:()=>deleteExpense(e._id)})} style={{ padding:"6px 14px",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:8,color:"#fca5a5",cursor:"pointer",fontSize:12,fontWeight:600 }}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {/* Notes Tab */}
          {tab === "notes" && (
            <>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:12 }}>
                <div>
                  <h2 style={{ margin:0,fontSize:22,fontWeight:900 }}>📝 Notes ({filteredNotes.length})</h2>
                  <p style={{ color:C.muted,margin:"4px 0 0",fontSize:13 }}>All notes across all users</p>
                </div>
                <div style={{ display:"flex",gap:10 }}>
                  <SearchBar value={search} onChange={setSearch} placeholder="Search notes…" />
                  <button onClick={()=>exportCSV(filteredNotes.map(n=>({user:`${n.user?.firstName??""} ${n.user?.lastName??""}`.trim()||"—",email:n.user?.email??"—",title:n.title,content:n.content,updated:fmt(n.updatedAt)})),"notes.csv")} style={{ padding:"10px 18px",background:"rgba(16,185,129,0.15)",border:"1px solid rgba(16,185,129,0.3)",borderRadius:12,color:"#34d399",cursor:"pointer",fontSize:13,fontWeight:600,whiteSpace:"nowrap" }}>⬇ CSV</button>
                  <button onClick={()=>load("notes")} style={{ padding:"10px 18px",background:"rgba(255,255,255,0.06)",border:`1px solid ${C.border}`,borderRadius:12,color:C.muted,cursor:"pointer",fontSize:13,fontWeight:600 }}>🔄 Refresh</button>
                </div>
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:16 }}>
                {loading && <div style={{ gridColumn:"1/-1",padding:60,textAlign:"center",color:C.muted }}>Loading…</div>}
                {!loading && filteredNotes.length === 0 && <div style={{ gridColumn:"1/-1",padding:60,textAlign:"center",color:C.muted }}>No notes found</div>}
                {!loading && filteredNotes.map(n=>(
                  <div key={n._id} style={{ background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:"20px",position:"relative",transition:"all 0.2s" }}
                    onMouseEnter={e=>{ e.currentTarget.style.background="rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor="rgba(124,58,237,0.3)"; }}
                    onMouseLeave={e=>{ e.currentTarget.style.background=C.surface; e.currentTarget.style.borderColor=C.border; }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12 }}>
                      <div style={{ fontWeight:800,fontSize:15,flex:1,paddingRight:8 }}>📄 {n.title}</div>
                      <button onClick={()=>setConfirm({msg:`Delete note "${n.title}"?`,onOk:()=>deleteNote(n._id)})} style={{ background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:7,padding:"4px 10px",color:"#fca5a5",cursor:"pointer",fontSize:11,fontWeight:600,flexShrink:0 }}>Delete</button>
                    </div>
                    <p style={{ color:C.muted,fontSize:13,lineHeight:1.6,margin:"0 0 16px",display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical",overflow:"hidden" }}>{n.content || <em>Empty note</em>}</p>
                    <div style={{ borderTop:`1px solid ${C.border}`,paddingTop:12,display:"flex",alignItems:"center",gap:10 }}>
                      {n.user && <div style={{ width:28,height:28,borderRadius:"50%",background:avatarColor(n.user.email),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff" }}>{initials(n.user.firstName,n.user.lastName)}</div>}
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{n.user ? `${n.user.firstName} ${n.user.lastName}` : "Unknown"}</div>
                        <div style={{ fontSize:11,color:C.muted }}>{fmt(n.updatedAt)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Toasts */}
      <div style={{ position:"fixed",bottom:24,right:24,zIndex:2000,display:"flex",flexDirection:"column",gap:10 }}>
        {toasts.map(t=>(
          <div key={t.id} style={{ background:t.type==="success"?"rgba(16,185,129,0.9)":"rgba(239,68,68,0.9)",backdropFilter:"blur(10px)",color:"#fff",padding:"12px 20px",borderRadius:12,fontSize:14,fontWeight:600,boxShadow:"0 8px 24px rgba(0,0,0,0.3)",animation:"fadeIn 0.3s ease" }}>
            {t.type==="success"?"✅":"❌"} {t.msg}
          </div>
        ))}
      </div>

      {/* Modals */}
      {selectedUser && <UserDetailModal user={selectedUser} token={token} onClose={()=>setSelectedUser(null)} onUserUpdated={()=>load("users")} />}
      {confirm && <ConfirmDialog msg={confirm.msg} onConfirm={confirm.onOk} onCancel={()=>setConfirm(null)} />}

      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [token, setToken] = useState<string|null>(()=>sessionStorage.getItem("admin_token"));
  return token
    ? <AdminDashboard token={token} onLogout={()=>{ sessionStorage.removeItem("admin_token"); setToken(null); }} />
    : <AdminLogin onLogin={t=>{ sessionStorage.setItem("admin_token",t); setToken(t); }} />;
}
