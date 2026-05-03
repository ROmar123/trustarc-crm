import { useEffect, useState } from "react";
import Modal from "../ui/Modal.jsx";

const empty = {
  customer_id: "",
  route_id: "",
  billing_period: "weekly",
  seats: 1,
  price_override: "",
  start_date: "",
  next_period_start: "",
  status: "active",
  notes: "",
};

export default function SubscriptionModal({
  open,
  onClose,
  initial,
  customers = [],
  routes = [],
  onSave,
}) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    setForm(initial ? { ...empty, ...initial } : empty);
  }, [initial, open]);

  const isEdit = !!initial?.subscription_id;

  return (
    <Modal
      title={isEdit ? "Edit Subscription" : "Add Subscription"}
      open={open}
      onClose={onClose}
      footer={
        <>
          <button className="btn btnGhost" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="btn btnPrimary" type="button" onClick={() => onSave(form)}>
            Save
          </button>
        </>
      }
    >
      <div className="formGrid">
        <div className="formRow2">
          <div>
            <div className="kpiLabel">Customer</div>
            <select
              value={form.customer_id}
              onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
            >
              <option value="">Select…</option>
              {customers.map((c) => (
                <option key={c.customer_id} value={c.customer_id}>
                  {c.display_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="kpiLabel">Route</div>
            <select
              value={form.route_id}
              onChange={(e) => setForm({ ...form, route_id: e.target.value })}
            >
              <option value="">Select…</option>
              {routes.map((r) => (
                <option key={r.route_id} value={r.route_id}>
                  {r.route_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="formRow2">
          <div>
            <div className="kpiLabel">Billing Period</div>
            <select
              value={form.billing_period}
              onChange={(e) => setForm({ ...form, billing_period: e.target.value })}
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div>
            <div className="kpiLabel">Status</div>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="formRow2">
          <div>
            <div className="kpiLabel">Seats</div>
            <input
              className="input"
              type="number"
              min="1"
              value={form.seats}
              onChange={(e) => setForm({ ...form, seats: Number(e.target.value) })}
            />
          </div>

          <div>
            <div className="kpiLabel">Price Override (optional)</div>
            <input
              className="input"
              value={form.price_override || ""}
              onChange={(e) => setForm({ ...form, price_override: e.target.value })}
              placeholder="Leave blank to use route pricing"
            />
          </div>
        </div>

        <div className="formRow2">
          <div>
            <div className="kpiLabel">Start Date</div>
            <input
              className="input"
              type="date"
              value={form.start_date || ""}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            />
          </div>

          <div>
            <div className="kpiLabel">Next Period Start</div>
            <input
              className="input"
              type="date"
              value={form.next_period_start || ""}
              onChange={(e) => setForm({ ...form, next_period_start: e.target.value })}
            />
          </div>
        </div>

        <div>
          <div className="kpiLabel">Notes</div>
          <textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>

        <div className="muted" style={{ fontSize: 12 }}>
          Note: this form does not invent business states — it only writes to the DB fields you already defined.
        </div>
      </div>
    </Modal>
  );
}