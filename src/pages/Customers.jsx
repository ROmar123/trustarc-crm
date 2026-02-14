import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase.js";
import Card from "../components/ui/Card.jsx";

function Icon({ kind }) {
  const common = {
    width: 18,
    height: 18,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  if (kind === "users")
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );

  if (kind === "active")
    return (
      <svg {...common} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12l3 3 5-7" />
      </svg>
    );

  if (kind === "inactive")
    return (
      <svg {...common} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <path d="M15 9l-6 6" />
        <path d="M9 9l6 6" />
      </svg>
    );

  if (kind === "view")
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );

  if (kind === "plus")
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    );

  return null;
}

function StatusBadge({ status }) {
  const s = String(status || "").toLowerCase();
  const tone = s === "active" ? "green" : "muted";

  const bg =
    tone === "green" ? "rgba(65, 230, 155, .14)" : "rgba(255,255,255,.08)";
  const border =
    tone === "green" ? "rgba(65, 230, 155, .22)" : "rgba(255,255,255,.10)";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        borderRadius: 999,
        border: `1px solid ${border}`,
        background: bg,
        color: "rgba(255,255,255,.90)",
        fontSize: 12,
        fontWeight: 850,
        letterSpacing: ".2px",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background:
            tone === "green"
              ? "rgba(65, 230, 155, 1)"
              : "rgba(255,255,255,.35)",
        }}
      />
      {s ? s.toUpperCase() : "—"}
    </span>
  );
}

function Modal({ title, onClose, children, footer }) {
  return (
    <div className="modalBackdrop" onMouseDown={onClose}>
      <div className="modalBox" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modalHead">
          <div className="modalTitle">{title}</div>
          <button className="btn btnGhost" type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="modalBody">{children}</div>
        {footer ? <div className="modalFooter">{footer}</div> : null}
      </div>
    </div>
  );
}

export default function Customers({ setView, setContext }) {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  const [status, setStatus] = useState("all"); // all | active | inactive
  const [q, setQ] = useState("");

  const [rows, setRows] = useState([]);
  const [kpis, setKpis] = useState({ total: 0, active: 0, inactive: 0 });

  const [busyId, setBusyId] = useState(null); // per-row action lock

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    customer_type: "individual",
    display_name: "",
    email: "",
    phone: "",
    status: "active",
    notes: "",
  });

  async function load() {
    setLoading(true);
    setToast("");

    try {
      let query = supabase
        .from("customers")
        .select("customer_id, customer_type, display_name, email, phone, status, created_at")
        .order("display_name", { ascending: true })
        .limit(1000);

      if (status !== "all") query = query.eq("status", status);

      const { data, error } = await query;
      if (error) throw error;

      let mapped = (data || []).map((c) => ({
        ...c,
        display_name: c.display_name || "—",
        email: c.email || "",
        phone: c.phone || "",
      }));

      if (q.trim()) {
        const qq = q.trim().toLowerCase();
        mapped = mapped.filter((r) => {
          return (
            String(r.display_name || "").toLowerCase().includes(qq) ||
            String(r.email || "").toLowerCase().includes(qq) ||
            String(r.phone || "").toLowerCase().includes(qq)
          );
        });
      }

      const allRes = await supabase.from("customers").select("customer_id, status").limit(5000);
      if (allRes.error) throw allRes.error;

      const all = allRes.data || [];
      const activeCount = all.filter((x) => String(x.status).toLowerCase() === "active").length;
      const inactiveCount = all.filter((x) => String(x.status).toLowerCase() === "inactive").length;

      setKpis({ total: all.length, active: activeCount, inactive: inactiveCount });
      setRows(mapped);
    } catch (e) {
      setToast(e?.message || "Couldn’t load customers.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  async function createCustomer() {
    setToast("");

    const name = String(createForm.display_name || "").trim();
    const email = String(createForm.email || "").trim();

    if (!name) return setToast("Customer name is required.");
    if (!email) return setToast("Email is required.");

    const payload = {
      customer_type: createForm.customer_type,
      display_name: name,
      email,
      phone: String(createForm.phone || "").trim() || null,
      status: createForm.status,
      notes: String(createForm.notes || "").trim() || null,
    };

    const { error } = await supabase.from("customers").insert(payload);
    if (error) return setToast(error.message);

    setShowCreate(false);
    setCreateForm({
      customer_type: "individual",
      display_name: "",
      email: "",
      phone: "",
      status: "active",
      notes: "",
    });

    await load();
  }

  // ✅ NEW: toggle active/inactive
  async function setCustomerStatus(customer_id, nextStatus) {
    setToast("");
    setBusyId(customer_id);

    try {
      // Optional safety rule: don’t allow inactivating if invoices exist (non-void)
      if (nextStatus === "inactive") {
        const invCheck = await supabase
          .from("invoices")
          .select("invoice_id")
          .eq("customer_id", customer_id)
          .neq("status", "void")
          .limit(1);

        if (invCheck.error) throw invCheck.error;
        if ((invCheck.data || []).length > 0) {
          throw new Error("Cannot set inactive: customer has invoices. Void/settle first (or remove this guard).");
        }
      }

      const { error } = await supabase
        .from("customers")
        .update({ status: nextStatus })
        .eq("customer_id", customer_id);

      if (error) throw error;

      // Optimistic update (faster UI), then refresh KPIs
      setRows((prev) =>
        prev.map((r) => (r.customer_id === customer_id ? { ...r, status: nextStatus } : r))
      );
      await load();
    } catch (e) {
      setToast(e?.message || "Couldn’t update status.");
    } finally {
      setBusyId(null);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div>
      <div className="pageHead">
        <div>
          <div className="pageTitle">Customers</div>
          <div className="pageSub">Manage customer profiles and open full customer detail views.</div>
        </div>

        <div className="pageActions">
          <div style={{ minWidth: 190 }}>
            <div className="kpiLabel">Status</div>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div style={{ minWidth: 260 }}>
            <div className="kpiLabel">Search</div>
            <input
              className="input"
              placeholder="Name, email, phone…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <button className="btn btnGhost" type="button" onClick={load} disabled={loading}>
            Refresh
          </button>

          <button className="btn btnPrimary" type="button" onClick={() => setShowCreate(true)}>
            <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
              <Icon kind="plus" /> + Customer
            </span>
          </button>
        </div>
      </div>

      {toast ? <div className="toast">{toast}</div> : null}

      <div className="grid grid3">
        <div className="card cardGlow">
          <div className="kpiRow">
            <div>
              <div className="kpiLabel">Total customers</div>
              <div className="kpiValue" style={{ fontSize: 22 }}>{kpis.total}</div>
            </div>
            <div className="kpiIcon"><Icon kind="users" /></div>
          </div>
        </div>

        <div className="card">
          <div className="kpiRow">
            <div>
              <div className="kpiLabel">Active</div>
              <div className="kpiValue" style={{ fontSize: 22 }}>{kpis.active}</div>
            </div>
            <div className="kpiIcon"><Icon kind="active" /></div>
          </div>
        </div>

        <div className="card">
          <div className="kpiRow">
            <div>
              <div className="kpiLabel">Inactive</div>
              <div className="kpiValue" style={{ fontSize: 22 }}>{kpis.inactive}</div>
            </div>
            <div className="kpiIcon"><Icon kind="inactive" /></div>
          </div>
        </div>
      </div>

      <div style={{ height: 14 }} />

      <Card title="Customer list" action={<span className="chip">{rows.length} shown</span>}>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th style={{ width: 160 }}>Phone</th>
                <th style={{ width: 160 }}>Status</th>
                <th style={{ width: 360 }} />
              </tr>
            </thead>
            <tbody>
              {rows
                .filter((r) => {
                  if (!q.trim()) return true;
                  const qq = q.trim().toLowerCase();
                  return (
                    String(r.display_name || "").toLowerCase().includes(qq) ||
                    String(r.email || "").toLowerCase().includes(qq) ||
                    String(r.phone || "").toLowerCase().includes(qq)
                  );
                })
                .map((r) => {
                  const isActive = String(r.status || "").toLowerCase() === "active";
                  const nextStatus = isActive ? "inactive" : "active";
                  const busy = busyId === r.customer_id;

                  return (
                    <tr key={r.customer_id}>
                      <td style={{ fontWeight: 900 }}>{r.display_name}</td>
                      <td className="muted">{r.email}</td>
                      <td className="muted">{r.phone || "—"}</td>
                      <td><StatusBadge status={r.status} /></td>

                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <button
                          className="btn btnGhost"
                          type="button"
                          onClick={() => setCustomerStatus(r.customer_id, nextStatus)}
                          disabled={busy || loading}
                          style={{ marginRight: 8 }}
                        >
                          {busy ? "Saving…" : isActive ? "Deactivate" : "Activate"}
                        </button>

                        <button
                          className="btn btnPrimary"
                          type="button"
                          onClick={() => {
                            setContext?.({ customer_id: r.customer_id });
                            setView?.("customer_detail");
                          }}
                        >
                          <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                            <Icon kind="view" /> View
                          </span>
                        </button>
                      </td>
                    </tr>
                  );
                })}

              {!rows.length ? (
                <tr>
                  <td colSpan={5} className="muted">No customers found.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      {showCreate ? (
        <Modal
          title="Add customer"
          onClose={() => setShowCreate(false)}
          footer={
            <>
              <button className="btn btnGhost" type="button" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button className="btn btnPrimary" type="button" onClick={createCustomer} disabled={loading}>
                Create
              </button>
            </>
          }
        >
          <div className="formGrid">
            <div className="formRow2">
              <div>
                <div className="kpiLabel">Customer type</div>
                <select
                  value={createForm.customer_type}
                  onChange={(e) => setCreateForm((s) => ({ ...s, customer_type: e.target.value }))}
                >
                  <option value="individual">individual</option>
                  <option value="business">business</option>
                </select>
              </div>
              <div>
                <div className="kpiLabel">Status</div>
                <select
                  value={createForm.status}
                  onChange={(e) => setCreateForm((s) => ({ ...s, status: e.target.value }))}
                >
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                </select>
              </div>
            </div>

            <div>
              <div className="kpiLabel">Display name</div>
              <input
                className="input"
                value={createForm.display_name}
                onChange={(e) => setCreateForm((s) => ({ ...s, display_name: e.target.value }))}
                placeholder="e.g. Amina Jacobs"
              />
            </div>

            <div className="formRow2">
              <div>
                <div className="kpiLabel">Email</div>
                <input
                  className="input"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((s) => ({ ...s, email: e.target.value }))}
                  placeholder="e.g. amina@email.com"
                />
              </div>

              <div>
                <div className="kpiLabel">Phone</div>
                <input
                  className="input"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm((s) => ({ ...s, phone: e.target.value }))}
                  placeholder="optional"
                />
              </div>
            </div>

            <div>
              <div className="kpiLabel">Notes</div>
              <textarea
                value={createForm.notes}
                onChange={(e) => setCreateForm((s) => ({ ...s, notes: e.target.value }))}
                placeholder="optional"
              />
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}