import { useEffect, useState } from "react";
import Modal from "../ui/Modal.jsx";

const empty = {
  route_name: "",
  origin_label: "",
  destination_label: "",
  is_active: true,
};

export default function RouteModal({ open, onClose, initial, onSave }) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    setForm(initial ? { ...empty, ...initial } : empty);
  }, [initial, open]);

  const isEdit = !!initial?.route_id;

  return (
    <Modal
      title={isEdit ? "Edit Route" : "Add Route"}
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
        <div>
          <div className="kpiLabel">Route Name</div>
          <input
            className="input"
            value={form.route_name}
            onChange={(e) => setForm({ ...form, route_name: e.target.value })}
            placeholder="e.g. Lansdowne → Town"
          />
        </div>

        <div className="formRow2">
          <div>
            <div className="kpiLabel">Origin</div>
            <input
              className="input"
              value={form.origin_label || ""}
              onChange={(e) => setForm({ ...form, origin_label: e.target.value })}
              placeholder="Optional"
            />
          </div>

          <div>
            <div className="kpiLabel">Destination</div>
            <input
              className="input"
              value={form.destination_label || ""}
              onChange={(e) => setForm({ ...form, destination_label: e.target.value })}
              placeholder="Optional"
            />
          </div>
        </div>

        <div className="formRow2">
          <div>
            <div className="kpiLabel">Active</div>
            <select
              value={form.is_active ? "true" : "false"}
              onChange={(e) => setForm({ ...form, is_active: e.target.value === "true" })}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div />
        </div>
      </div>
    </Modal>
  );
}