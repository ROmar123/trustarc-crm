import { useEffect, useState } from "react";
import Modal from "../ui/Modal.jsx";

const empty = {
  weekly_price: "",
  monthly_price: "",
  effective_from: "",
  effective_to: "",
};

export default function PricingModal({ open, onClose, routeName, onSave }) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (open) setForm(empty);
  }, [open]);

  return (
    <Modal
      title={`Add Pricing${routeName ? ` — ${routeName}` : ""}`}
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
            <div className="kpiLabel">Weekly Price</div>
            <input
              className="input"
              value={form.weekly_price}
              onChange={(e) => setForm({ ...form, weekly_price: e.target.value })}
              placeholder="e.g. 350"
            />
          </div>

          <div>
            <div className="kpiLabel">Monthly Price</div>
            <input
              className="input"
              value={form.monthly_price}
              onChange={(e) => setForm({ ...form, monthly_price: e.target.value })}
              placeholder="e.g. 1200"
            />
          </div>
        </div>

        <div className="formRow2">
          <div>
            <div className="kpiLabel">Effective From</div>
            <input
              className="input"
              type="date"
              value={form.effective_from}
              onChange={(e) => setForm({ ...form, effective_from: e.target.value })}
            />
          </div>

          <div>
            <div className="kpiLabel">Effective To (optional)</div>
            <input
              className="input"
              type="date"
              value={form.effective_to}
              onChange={(e) => setForm({ ...form, effective_to: e.target.value })}
            />
          </div>
        </div>

        <div className="muted" style={{ fontSize: 12 }}>
          Tip: leave “Effective To” blank to keep pricing active until replaced.
        </div>
      </div>
    </Modal>
  );
}