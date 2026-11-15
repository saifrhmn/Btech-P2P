# SourceFlow P2P Demo

An Angular dashboard prototype for the procure-to-pay process described in
[`../P2P_Business_Process.md`](../P2P_Business_Process.md).

## What is included

- Sample SAP-style purchase requisitions across PR release, RFQ sourcing,
  purchase orders, goods receipt, invoice approval, and payment.
- Procurement summary cards, pipeline visualization, workflow overview, and
  requisition detail drawer.
- Search and status filters, plus CSV export of the visible records.
- A clearly labeled demo refresh action; the application does not connect to SAP.

All records are illustrative demo data. The refresh button updates only the
displayed refresh time and does not call an SAP API.

## Run locally

Install dependencies with `npm install`, then start the development server:

```bash
npm start
```

Open `http://localhost:4200/`.

## Validate

```bash
npm test -- --watch=false
npm run build
```
