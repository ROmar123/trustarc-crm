// src/pages/InvoiceView.jsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase.js";
import {
  PDFDownloadLink,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import Card from "../components/ui/Card.jsx";

/**
 * ✅ Uses the SAME logo approach as your app header should:
 * Put the logo in: /public/trustarc-logo.png
 * Then reference by URL (react-pdf needs a URL, NOT a JS import)
 */
const LOGO_URL = "/trustarc-logo.png";

function toNum(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}
function money(n) {
  const v = toNum(n);
  return `R ${v.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/* =========================
   Premium PDF Styles
   ========================= */
const BRAND = "#1E3A8A"; // deep blue (premium look)
const BRAND_SOFT = "#E8EEFF";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const BORDER = "#E2E8F0";

const pdfStyles = StyleSheet.create({
  page: { padding: 28, fontSize: 10, color: TEXT, backgroundColor: "#FFFFFF" },

  // Top brand strip
  topStrip: {
    height: 10,
    backgroundColor: BRAND,
    borderRadius: 6,
    marginBottom: 14,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  brandWrap: { flexDirection: "row", gap: 10, alignItems: "center" },
  logo: { width: 40, height: 40 },
  brand: { fontSize: 18, fontWeight: 900, color: BRAND },
  muted: { color: MUTED, marginTop: 3 },

  chip: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: BRAND_SOFT,
    border: `1px solid ${BORDER}`,
    color: BRAND,
    fontSize: 9,
    fontWeight: 900,
    alignSelf: "flex-end",
    marginTop: 6,
  },

  // Cards / sections
  card: {
    border: `1px solid ${BORDER}`,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  cardTitle: { fontSize: 11, fontWeight: 900, marginBottom: 8, color: TEXT },

  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  col: { flex: 1 },

  // Lines table
  thRow: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    border: `1px solid ${BORDER}`,
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 8,
    marginBottom: 6,
  },
  trRow: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottom: `1px solid ${BORDER}`,
  },
  th: { fontWeight: 900, color: TEXT },

  c1: { flex: 4 },
  c2: { flex: 1, textAlign: "right" },
  c3: { flex: 2, textAlign: "right" },
  c4: { flex: 2, textAlign: "right" },

  // Totals box
  totalsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  totalsBox: {
    border: `1px solid ${BORDER}`,
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#F8FAFC",
    minWidth: 210,
    alignSelf: "flex-end",
  },
  totalsLine: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  totalsLabel: { color: MUTED },
  totalsValue: { fontWeight: 900, color: TEXT },
  totalsStrong: { fontWeight: 900, color: BRAND },

  footer: {
    position: "absolute",
    left: 28,
    right: 28,
    bottom: 20,
    paddingTop: 8,
    borderTop: `1px solid ${BORDER}`,
    flexDirection: "row",
    justifyContent: "space-between",
    color: MUTED,
    fontSize: 9,
  },
});

function InvoicePDF({
  invoice,
  customer,
  route,
  subscription,
  lines,
  paidAmount,
  balanceAmount,
}) {
  const invNo =
    invoice?.invoice_number || String(invoice?.invoice_id || "").slice(0, 8);

  const pStart = invoice?.period_start
    ? format(new Date(invoice.period_start), "yyyy-MM-dd")
    : "—";
  const pEnd = invoice?.period_end
    ? format(new Date(invoice.period_end), "yyyy-MM-dd")
    : "—";

  const statusUpper = String(invoice?.status || "").toUpperCase();

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.topStrip} />

        <View style={pdfStyles.headerRow}>
          <View>
            <View style={pdfStyles.brandWrap}>
              <Image src={LOGO_URL} style={pdfStyles.logo} />
              <View>
                <Text style={pdfStyles.brand}>TrustArc</Text>
                <Text style={pdfStyles.muted}>Invoice</Text>
              </View>
            </View>

            <Text style={pdfStyles.muted}>
              Bill To: {customer?.display_name || "—"}
            </Text>
            {customer?.email ? (
              <Text style={pdfStyles.muted}>{customer.email}</Text>
            ) : null}
          </View>

          <View style={{ textAlign: "right" }}>
            <Text style={{ fontSize: 12, fontWeight: 900, color: TEXT }}>
              {invNo}
            </Text>
            <Text style={pdfStyles.muted}>
              Period: {pStart} → {pEnd}
            </Text>
            <Text style={pdfStyles.chip}>STATUS: {statusUpper || "—"}</Text>
          </View>
        </View>

        <View style={pdfStyles.card}>
          <Text style={pdfStyles.cardTitle}>Details</Text>
          <View style={pdfStyles.row}>
            <View style={pdfStyles.col}>
              <Text style={pdfStyles.muted}>Customer</Text>
              <Text style={{ fontWeight: 900 }}>{customer?.display_name || "—"}</Text>
              {customer?.phone ? <Text style={pdfStyles.muted}>{customer.phone}</Text> : null}
            </View>

            <View style={pdfStyles.col}>
              <Text style={pdfStyles.muted}>Subscription</Text>
              <Text style={{ fontWeight: 900 }}>
                {subscription?.billing_period
                  ? `Billing: ${subscription.billing_period}`
                  : "—"}
              </Text>
              <Text style={pdfStyles.muted}>
                Seats: {subscription?.seats ?? "—"}
              </Text>
            </View>

            <View style={pdfStyles.col}>
              <Text style={pdfStyles.muted}>Route</Text>
              <Text style={{ fontWeight: 900 }}>{route?.route_name || "—"}</Text>
            </View>
          </View>
        </View>

        <View style={pdfStyles.card}>
          <Text style={pdfStyles.cardTitle}>Invoice lines</Text>

          <View style={pdfStyles.thRow}>
            <Text style={[pdfStyles.c1, pdfStyles.th]}>Description</Text>
            <Text style={[pdfStyles.c2, pdfStyles.th]}>Qty</Text>
            <Text style={[pdfStyles.c3, pdfStyles.th]}>Unit</Text>
            <Text style={[pdfStyles.c4, pdfStyles.th]}>Total</Text>
          </View>

          {(lines || []).map((l) => (
            <View key={l.invoice_line_id} style={pdfStyles.trRow}>
              <Text style={pdfStyles.c1}>{l.description}</Text>
              <Text style={pdfStyles.c2}>{toNum(l.qty)}</Text>
              <Text style={pdfStyles.c3}>{money(l.unit_price)}</Text>
              <Text style={pdfStyles.c4}>
                {money(l.line_total ?? toNum(l.qty) * toNum(l.unit_price))}
              </Text>
            </View>
          ))}

          {/* Totals */}
          <View style={pdfStyles.totalsRow}>
            <View />
            <View style={pdfStyles.totalsBox}>
              <View style={pdfStyles.totalsLine}>
                <Text style={pdfStyles.totalsLabel}>Total</Text>
                <Text style={pdfStyles.totalsValue}>{money(invoice?.total_amount)}</Text>
              </View>
              <View style={pdfStyles.totalsLine}>
                <Text style={pdfStyles.totalsLabel}>Paid</Text>
                <Text style={pdfStyles.totalsValue}>{money(paidAmount)}</Text>
              </View>
              <View style={pdfStyles.totalsLine}>
                <Text style={pdfStyles.totalsLabel}>Balance</Text>
                <Text style={pdfStyles.totalsStrong}>{money(balanceAmount)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={pdfStyles.footer}>
          <Text>Generated by TrustArc Billing</Text>
          <Text>{format(new Date(), "yyyy-MM-dd HH:mm")}</Text>
        </View>
      </Page>
    </Document>
  );
}

export default function InvoiceView({ setView, setContext, context }) {
  const invoiceId = context?.invoice_id;

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  const [invoice, setInvoice] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [route, setRoute] = useState(null);

  const [lines, setLines] = useState([]);
  const [paidAmount, setPaidAmount] = useState(0);
  const [balanceAmount, setBalanceAmount] = useState(0);

  const [lineForm, setLineForm] = useState({
    description: "",
    qty: 1,
    unit_price: 0,
  });

  async function load() {
    if (!invoiceId) {
      setToast("No invoice selected.");
      return;
    }

    setLoading(true);
    setToast("");

    try {
      // Invoice
      const invRes = await supabase
        .from("invoices")
        .select(
          "invoice_id, invoice_number, customer_id, subscription_id, period_start, period_end, total_amount, status, email_status, payfast_reference, created_at"
        )
        .eq("invoice_id", invoiceId)
        .single();
      if (invRes.error) throw invRes.error;
      setInvoice(invRes.data);

      // Customer
      const custRes = await supabase
        .from("customers")
        .select("customer_id, display_name, email, phone, status")
        .eq("customer_id", invRes.data.customer_id)
        .single();
      if (custRes.error) throw custRes.error;
      setCustomer(custRes.data);

      // Subscription + Route
      const subRes = await supabase
        .from("subscriptions")
        .select("subscription_id, route_id, billing_period, seats, status")
        .eq("subscription_id", invRes.data.subscription_id)
        .single();
      if (subRes.error) throw subRes.error;
      setSubscription(subRes.data);

      const routeRes = await supabase
        .from("routes")
        .select("route_id, route_name")
        .eq("route_id", subRes.data.route_id)
        .single();
      if (routeRes.error) throw routeRes.error;
      setRoute(routeRes.data);

      // Lines
      const linesRes = await supabase
        .from("invoice_lines")
        .select("invoice_line_id, invoice_id, description, qty, unit_price, line_total, created_at")
        .eq("invoice_id", invoiceId)
        .order("created_at", { ascending: true });
      if (linesRes.error) throw linesRes.error;
      setLines(linesRes.data || []);

      // Paid/Balance from allocations
      const allocRes = await supabase
        .from("payment_allocations")
        .select("allocated_amount")
        .eq("invoice_id", invoiceId);
      if (allocRes.error) throw allocRes.error;

      const paid = (allocRes.data || []).reduce((a, r) => a + toNum(r.allocated_amount), 0);
      const total = toNum(invRes.data.total_amount);
      const bal = Math.max(0, Number((total - paid).toFixed(2)));

      setPaidAmount(paid);
      setBalanceAmount(bal);
    } catch (e) {
      setToast(e?.message || "Couldn’t load invoice.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  async function addLine() {
    if (!invoice?.invoice_id) return;
    setToast("");

    const desc = String(lineForm.description || "").trim();
    const qty = toNum(lineForm.qty);
    const unit = toNum(lineForm.unit_price);

    if (!desc) return setToast("Description is required.");
    if (qty <= 0) return setToast("Qty must be > 0.");

    // Guardrail: prevent invoice total going below 0 if you’re using negative unit_price for credits.
    const proposedDelta = Number((qty * unit).toFixed(2));
    const currentTotal = toNum(invoice.total_amount);
    const nextTotal = Number((currentTotal + proposedDelta).toFixed(2));

    if (nextTotal < 0) {
      return setToast(`Credit too large. Invoice total cannot go below R 0.00 (would be ${money(nextTotal)}).`);
    }

    const payload = {
      invoice_id: invoice.invoice_id,
      description: desc,
      qty,
      unit_price: unit, // can be negative if DB allows
    };

    const insRes = await supabase.from("invoice_lines").insert(payload);
    if (insRes.error) return setToast(insRes.error.message);

    setLineForm({ description: "", qty: 1, unit_price: 0 });
    await load();
  }

  async function deleteLine(invoice_line_id) {
    setToast("");
    const delRes = await supabase.from("invoice_lines").delete().eq("invoice_line_id", invoice_line_id);
    if (delRes.error) return setToast(delRes.error.message);
    await load();
  }

  const invNo =
    invoice?.invoice_number ||
    (invoice?.invoice_id ? String(invoice.invoice_id).slice(0, 8) : "—");

  const pdfDoc = useMemo(() => {
    if (!invoice) return null;
    return (
      <InvoicePDF
        invoice={invoice}
        customer={customer}
        subscription={subscription}
        route={route}
        lines={lines}
        paidAmount={paidAmount}
        balanceAmount={balanceAmount}
      />
    );
  }, [invoice, customer, subscription, route, lines, paidAmount, balanceAmount]);

  return (
    <div>
      <div className="pageHead">
        <div>
          <div className="pageTitle">Invoice</div>
          <div className="pageSub">
            {invNo} {invoice?.period_start ? `• ${invoice.period_start} → ${invoice.period_end}` : ""}
          </div>
        </div>

        <div className="pageActions">
          <button className="btn btnGhost" type="button" onClick={() => setView?.("billing")}>
            ← Back to billing
          </button>

          {pdfDoc ? (
            <PDFDownloadLink
              document={pdfDoc}
              fileName={`invoice-${invNo}.pdf`}
              style={{ textDecoration: "none" }}
            >
              {({ loading: pdfLoading }) => (
                <button className="btn btnPrimary" type="button" disabled={pdfLoading}>
                  {pdfLoading ? "Preparing PDF..." : "Download PDF"}
                </button>
              )}
            </PDFDownloadLink>
          ) : null}
        </div>
      </div>

      {toast ? <div className="toast">{toast}</div> : null}

      <div className="grid grid2">
        <Card title="Customer">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontWeight: 900 }}>{customer?.display_name || "—"}</div>
            <div className="muted">{customer?.email || ""}</div>
            <div className="muted">{customer?.phone || ""}</div>
            <div className="muted">Status: {String(customer?.status || "").toUpperCase()}</div>
          </div>
        </Card>

        <Card title="Summary">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div>Total: <b>{money(invoice?.total_amount)}</b></div>
            <div>Paid: <b>{money(paidAmount)}</b></div>
            <div>Balance: <b>{money(balanceAmount)}</b></div>
            <div className="muted">Invoice status: {String(invoice?.status || "").toUpperCase()}</div>
          </div>
        </Card>
      </div>

      <div style={{ height: 14 }} />

      <Card title="Invoice lines" action={<span className="chip">{lines.length} lines</span>}>
        <div className="formGrid" style={{ marginBottom: 10 }}>
          <div>
            <div className="kpiLabel">Description</div>
            <input
              className="input"
              value={lineForm.description}
              onChange={(e) => setLineForm((s) => ({ ...s, description: e.target.value }))}
              placeholder="e.g. Discount / Credit note / Extra charge"
            />
          </div>

          <div className="formRow2">
            <div>
              <div className="kpiLabel">Qty</div>
              <input
                className="input"
                type="number"
                value={lineForm.qty}
                onChange={(e) => setLineForm((s) => ({ ...s, qty: e.target.value }))}
              />
            </div>

            <div>
              <div className="kpiLabel">Unit price (R)</div>
              <input
                className="input"
                type="number"
                value={lineForm.unit_price}
                onChange={(e) => setLineForm((s) => ({ ...s, unit_price: e.target.value }))}
              />
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                Use a negative unit price for credits (qty must stay positive).
              </div>
            </div>
          </div>

          <button className="btn btnPrimary" type="button" onClick={addLine} disabled={loading}>
            Add line
          </button>
        </div>

        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style={{ width: 90, textAlign: "right" }}>Qty</th>
                <th style={{ width: 160, textAlign: "right" }}>Unit</th>
                <th style={{ width: 160, textAlign: "right" }}>Total</th>
                <th style={{ width: 120 }} />
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.invoice_line_id}>
                  <td>{l.description}</td>
                  <td style={{ textAlign: "right" }}>{toNum(l.qty)}</td>
                  <td style={{ textAlign: "right" }}>{money(l.unit_price)}</td>
                  <td style={{ textAlign: "right", fontWeight: 900 }}>
                    {money(l.line_total ?? toNum(l.qty) * toNum(l.unit_price))}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button className="btn btnGhost" type="button" onClick={() => deleteLine(l.invoice_line_id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}

              {!lines.length ? (
                <tr>
                  <td colSpan={5} className="muted">
                    No lines yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}