// Order emails (nodemailer over SMTP, Gmail by default): a confirmation for the customer and a "new order" alert for the shop.
// Needs SMTP_USER + SMTP_PASS (a Gmail app password). Without them, emails are skipped and the order still goes through.
import nodemailer from "nodemailer";

const SHOP = "Good Noura";
const SITE = "goodnoura.com";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const rs = n => "Rs " + Math.round(+n || 0).toLocaleString("en-US");

export const adminEmail = () => (process.env.ADMIN_EMAIL || process.env.SMTP_USER || "goodnoura6@gmail.com").trim();
export const emailLooksValid = e => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(String(e || "").trim());

let transporter;
function getTransporter() {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT) || 587;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      connectionTimeout: 8000, greetingTimeout: 8000, socketTimeout: 12000,
    });
  }
  return transporter;
}

export async function sendEmail({ to, subject, html, replyTo }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("Email skipped: SMTP_USER / SMTP_PASS are not set.");
    return { skipped: true };
  }
  return getTransporter().sendMail({
    from: process.env.EMAIL_FROM || `${SHOP} <${process.env.SMTP_USER}>`,
    to, subject, html, ...(replyTo ? { replyTo } : {}),
  });
}

// ---- Shared pieces of the email layout (dark chocolate header, gold accent) ----
const shell = (title, sub, body) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f6efe6;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f6efe6;padding:28px 12px;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #eadcc8;border-radius:10px;max-width:560px;width:100%;overflow:hidden;">
  <tr><td style="background:#1f140e;padding:28px 32px;text-align:center;">
    <p style="color:#e6b04c;font-size:11px;letter-spacing:4px;text-transform:uppercase;margin:0 0 6px;">${SHOP}</p>
    <h1 style="color:#f4ead9;font-size:22px;margin:0;font-weight:600;">${title}</h1>
    ${sub ? `<p style="color:#e6b04c;font-size:13px;margin:8px 0 0;">${sub}</p>` : ""}
  </td></tr>
  <tr><td style="padding:28px 32px;">${body}</td></tr>
  <tr><td style="background:#f6efe6;padding:18px 32px;text-align:center;border-top:1px solid #eadcc8;">
    <p style="color:#8a6a4a;font-size:12px;margin:0;">${SITE} · Honest nut butters</p>
  </td></tr>
</table></td></tr></table></body></html>`;

const row = (label, value, bold) => `<tr>
  <td style="padding:9px 14px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#8a6a4a;width:36%;border-bottom:1px solid #eadcc8;vertical-align:top;">${label}</td>
  <td style="padding:9px 14px;font-size:14px;color:#1f140e;text-align:right;border-bottom:1px solid #eadcc8;${bold ? "font-weight:700;" : ""}">${value}</td></tr>`;

const itemsTable = items => `<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
  <tr style="background:#f6efe6;">
    <th style="padding:9px 12px;text-align:left;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#8a6a4a;">Product</th>
    <th style="padding:9px 12px;text-align:center;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#8a6a4a;">Qty</th>
    <th style="padding:9px 12px;text-align:right;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#8a6a4a;">Price</th></tr>
  ${(items || []).map(i => {
    const each = i.unitPaid ?? i.price;
    return `<tr>
    <td style="padding:10px 12px;border-bottom:1px solid #eadcc8;font-size:14px;color:#1f140e;">${esc(i.name)}${i.variant ? `<br><span style="color:#8a6a4a;font-size:12px;">${esc(i.variant)}</span>` : ""}</td>
    <td style="padding:10px 12px;border-bottom:1px solid #eadcc8;font-size:14px;color:#6b4c2a;text-align:center;">×${esc(i.qty)}</td>
    <td style="padding:10px 12px;border-bottom:1px solid #eadcc8;font-size:14px;color:#1f140e;text-align:right;">${rs((i.qty || 1) * each)}</td></tr>`;
  }).join("")}</table>`;

const totalsRows = o => [
  row("Subtotal", rs(o.subtotal)),
  o.discount ? row(`Promo ${esc(o.promo)}`, "− " + rs(o.discount)) : "",
  row("Delivery", o.shipping ? rs(o.shipping) : "Free"),
  row("Total", rs(o.total), true),
].join("");

const payLabel = p => (p === "online" ? "Online (bank transfer)" : "Cash on delivery");

// Order lines already store the price for the chosen payment method in subtotal; show the per-item price that was charged.
const withPaid = o => ({ ...o, items: (o.items || []).map(i => ({ ...i, unitPaid: o.payment === "online" ? i.onlinePrice : i.price })) });

// ---- Customer confirmation ----
export function orderConfirmationHtml(order, settings = {}) {
  const o = withPaid(order);
  const bank = o.payment === "online" && (settings.accountNumber || settings.iban) ? `
    <p style="color:#1f140e;font-size:14px;font-weight:700;margin:0 0 8px;">Pay by bank transfer</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fbf6ee;border:1px dashed #e6b04c;margin:0 0 20px;">
      ${[["Bank", settings.bankName], ["Account title", settings.accountTitle], ["Account no.", settings.accountNumber], ["IBAN", settings.iban]].filter(r => r[1]).map(([k, v]) => row(k, esc(v))).join("")}
    </table>
    <p style="color:#6b4c2a;font-size:13px;margin:0 0 20px;">${esc(settings.payNote || "Send a screenshot of your payment on WhatsApp with your order number.")}</p>` : "";
  const body = `
    <p style="color:#1f140e;font-size:15px;line-height:1.7;margin:0 0 22px;">Dear <strong>${esc(o.name)}</strong>,<br>Thank you for your order. We've received it and will message you on WhatsApp to confirm.</p>
    ${itemsTable(o.items)}
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fbf6ee;border:1px solid #eadcc8;margin:0 0 22px;">
      ${row("Order", esc(o.id), true)}${row("Payment", payLabel(o.payment))}${row("Deliver to", `${esc(o.address)}, ${esc(o.city)}`)}${totalsRows(o)}
    </table>
    ${bank}
    <p style="color:#6b4c2a;font-size:13px;line-height:1.6;margin:0;">Delivery: Karachi 24–48 hrs, other cities 4–6 days.${settings.phone ? ` Questions? WhatsApp us on ${esc(settings.phone)}.` : ""}</p>`;
  return shell("Order Confirmed", esc(o.id), body);
}

// ---- Alert for the shop ----
export function adminOrderHtml(order) {
  const o = withPaid(order);
  const wa = String(o.phone || "").replace(/\D/g, "").replace(/^0/, "92");
  const body = `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fbf6ee;border:1px solid #eadcc8;margin:0 0 20px;">
      ${row("Order", esc(o.id), true)}${row("Customer", esc(o.name))}
      ${row("WhatsApp", wa ? `<a href="https://wa.me/${wa}" style="color:#8e3c19;">${esc(o.phone)}</a>` : esc(o.phone))}
      ${o.email ? row("Email", esc(o.email)) : ""}${row("City", esc(o.city))}${row("Address", esc(o.address))}${row("Payment", payLabel(o.payment))}
    </table>
    ${itemsTable(o.items)}
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fbf6ee;border:1px solid #eadcc8;">${totalsRows(o)}</table>
    <p style="text-align:center;margin:22px 0 0;"><a href="https://${SITE}/admin" style="background:#e6b04c;color:#1f140e;text-decoration:none;font-weight:700;font-size:14px;padding:11px 22px;border-radius:8px;display:inline-block;">Open the admin</a></p>`;
  return shell("🛒 New order received", `${esc(o.id)} · ${rs(o.total)}`, body);
}

// Send both emails. Never throws, and never holds the order up for long: a failed email must not fail the order.
export async function notifyOrder(order, settings) {
  const jobs = [sendEmail({
    to: adminEmail(),
    subject: `New order ${order.id} — ${order.name} (${order.city}) — ${rs(order.total)}`,
    html: adminOrderHtml(order),
    ...(emailLooksValid(order.email) ? { replyTo: order.email } : {}),
  }).catch(e => console.error("Admin order email failed:", e.message))];
  if (emailLooksValid(order.email)) {
    jobs.push(sendEmail({
      to: order.email.trim(),
      subject: `Your Good Noura order ${order.id} is confirmed`,
      html: orderConfirmationHtml(order, settings),
    }).catch(e => console.error("Customer order email failed:", e.message)));
  }
  await Promise.race([Promise.allSettled(jobs), new Promise(r => setTimeout(r, 15000))]);
}

// ---- Status updates: one email to the customer every time the admin changes an order's status ----
const STATUS_EMAIL = {
  Pending: { label: "Order Received", subject: "We received your order", msg: () => "We've received your order and will confirm it with you on WhatsApp shortly." },
  Confirmed: { label: "Order Confirmed", subject: "is confirmed", msg: () => "Great news! Your order is confirmed and we're getting your jars ready." },
  Shipped: { label: "Order Shipped", subject: "has been shipped", msg: () => "Your order has been shipped and is on its way to you. Karachi usually takes 24–48 hrs, other cities 4–6 days." },
  "Out for Delivery": { label: "Out for Delivery", subject: "is out for delivery", msg: o => `Your order is out for delivery today and our rider is on the way.${o.payment === "online" ? "" : ` Please keep ${rs(o.total)} ready.`}` },
  Attempt: { label: "Delivery Attempted", subject: "delivery attempt", msg: () => "Our rider tried to deliver your order but couldn't reach you. Please message us on WhatsApp so we can arrange delivery again." },
  Delivered: { label: "Order Delivered", subject: "has been delivered", msg: () => "Your order has been delivered. We hope you love it! We'd really like to hear what you think." },
  Cancelled: { label: "Order Cancelled", subject: "has been cancelled", msg: () => "Your order has been cancelled. If this is a mistake, please message us and we'll sort it out." },
  Returned: { label: "Order Returned", subject: "was returned", msg: () => "Your order came back to us because the delivery couldn't be completed. Message us on WhatsApp and we'll send it again." },
};

export function orderStatusHtml(order, status, settings = {}) {
  const o = withPaid(order);
  const cfg = STATUS_EMAIL[status] || { label: `Order ${status}`, msg: () => `Your order status is now: ${status}.` };
  const body = `
    <p style="color:#1f140e;font-size:15px;line-height:1.7;margin:0 0 22px;">Dear <strong>${esc(o.name)}</strong>,<br>${esc(cfg.msg(o))}</p>
    ${status === "Delivered" ? "" : itemsTable(o.items)}
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fbf6ee;border:1px solid #eadcc8;margin:0 0 22px;">
      ${row("Order", esc(o.id), true)}${row("Status", esc(status))}${o.instaworld_tracking && ["Shipped", "Out for Delivery", "Attempt"].includes(status) ? row("Tracking no.", esc(o.instaworld_tracking), true) : ""}${row("Payment", payLabel(o.payment))}${row("Total", rs(o.total), true)}
    </table>
    <p style="color:#6b4c2a;font-size:13px;line-height:1.6;text-align:center;margin:0;">Questions? ${settings.phone ? `WhatsApp us on ${esc(settings.phone)} or ` : ""}reply to this email.</p>`;
  return shell(cfg.label, esc(o.id), body);
}

// Emails the customer about the new status. Returns "sent", "no-email", "skipped" (SMTP not set up) or "failed". Never throws.
export async function sendStatusEmail(order, status, settings) {
  if (!emailLooksValid(order.email)) return "no-email";
  const cfg = STATUS_EMAIL[status];
  const subject = status === "Pending" || !cfg ? `Update on your Good Noura order ${order.id}` : `Your Good Noura order ${order.id} ${cfg.subject}`;
  try {
    const r = await Promise.race([
      sendEmail({ to: order.email.trim(), subject, html: orderStatusHtml(order, status, settings) }),
      new Promise((_, rej) => setTimeout(() => rej(new Error("email timed out")), 15000)),
    ]);
    return r && r.skipped ? "skipped" : "sent";
  } catch (e) {
    console.error("Status email failed:", e.message);
    return "failed";
  }
}
