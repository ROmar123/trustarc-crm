import { useEffect, useState } from "react";
import Modal from "../ui/Modal.jsx";

const empty = {
  customer_type: "individual",
  display_name: "",
  email: "",
  phone: "",
  status: "active",
  notes: "",
};

export default function CustomerModal({ open, onClose, initial, onSave }) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    setForm(initial ? { ...empty, ...initial } : empty);
  }, [initial, open]);

  const isEdit = !!initial?.customer_id;

  return (
    <Modal
      title={isEdit ? "Edit Customer" : "Add Customer"}
      open={open}
      onClose={onClose}
      footer={
        <>
          <button className="btn btnGhost" onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className="btn btnPrimary"
            type="button"
            onClick={() => onSave(form)}
          >
            Save
          </button>
        </>
      }
    >
      <div className="formGrid">
        <div className="formRow2">
          <div>
            <div className="kpiLabel">Customer Type</div>
            <select
              value={form.customer_type}
              onChange={(e) => setForm({ ...form, customer_type: e.target.value })}
            >
              <option value="individual">Individual</option>
              <option value="business">Business</option>
            </select>
          </div>

          <div>
            <div className="kpiLabel">Status</div>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div>
          <div className="kpiLabel">Display Name</div>
          <input
            className="input"
            value={form.display_name}
            onChange={(e) => setForm({ ...form, display_name: e.target.value })}
            placeholder="e.g. Ayesha Jacobs"
          />
        </div>

        <div className="formRow2">
          <div>
            <div className="kpiLabel">Email</div>
            <input
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="name@email.com"
            />
          </div>

          <div>
            <div className="kpiLabel">Phone</div>
            <input
              className="input"
              value={form.phone || ""}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Optional"
            />
          </div>
        </div>

        <div>
          <div className="kpiLabel">Notes</div>
          <textarea
            value={form.notes || ""}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Optional…"
          />
        </div>
      </div>
    </Modal>
  );
}