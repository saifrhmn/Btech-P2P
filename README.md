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

## Workflow and demo roles

| # | Step | Demo role |
|---|------|-----------|
| 1 | Purchase requisition created in SAP/ERP and sent to P2P | Requester / SAP user |
| 2 | RFQ created with specs, T&C, vendors and end date; invitation emailed | RFQ creator |
| 3 | Vendors submit a unit price per item in the Vendor Portal | Vendor |
| 4 | RFQ end date passes (or *End RFQ validity now* in the demo) | RFQ creator |
| 5 | Technical evaluation: each vendor's offer marked **Yes / No** per item | Technical evaluator |
| 6 | **Winner selection:** for each item, the vendor with the **lowest price among technically accepted (Yes) offers wins the bid** | Automatic |
| 7 | RFQ processed: SAP/ERP RFQ No. and one purchase order per winning vendor created | RFQ creator |
| 8 | GRN recorded in SAP | Requester / SAP user |
| 9 | Vendor raises the invoice in the Vendor Portal | Vendor |
| 10 | Invoice parked (Invoice Park No.) | Accounts in Charge |
| 11 | Department approval, then VAT approval (posts the invoice in SAP) | Dept. approver, VAT approver |
| 12 | Bill paid; payment history recorded | Accounts in Charge |

Offers marked **No** are excluded from the award even if they are cheaper.
If no vendor's offer is accepted for an item, that item is not awarded.

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
