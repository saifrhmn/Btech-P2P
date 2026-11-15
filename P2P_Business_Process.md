# Procure-to-Pay (P2P) Business Process

## 1. Purpose and scope

This document describes the procure-to-pay process shown in `P2P_Flow.jpg`, from creating a purchase requisition (PR) in SAP through supplier quotation, RFQ evaluation, purchase order (PO), goods receipt, invoice approval, and payment.

The process uses SAP, the P2P application, the Vendor Portal, and the invoice automation workflow. The flowchart does not define approval thresholds, service-level timelines, evaluation formulas, or exception policies; those must be confirmed in the applicable business policies and system configuration.

## 2. Systems and participants

### Systems

- **SAP:** Source of the PR and the system where the goods receipt (GRN) is recorded manually.
- **P2P application:** Receives approved PR information, creates and evaluates RFQs, and creates the PO from the processed RFQ.
- **Vendor Portal:** Used by vendors to submit RFQ quotations and, after GRN, raise invoices.
- **Invoice automation:** Receives vendor invoices and routes them for approval, parking, and posting.

### Participants

- **Requester / SAP user:** Creates or updates a PR.
- **PR approver:** Approves or rejects the PR through the configured release process.
- **RFQ creator:** Sets up the RFQ, compares quotations, completes evaluations, and processes the RFQ.
- **Supply Chain GM:** Opens the RFQ for processing after its deadline.
- **Vendor:** Submits a quotation and raises an invoice through the Vendor Portal.
- **Technical and commercial approvers:** Review and approve the respective comparisons in configured sequences.
- **User department approver:** Approves the invoice in the invoice workflow.
- **VAT approver:** Approves the VAT stage, during which the invoice is automatically parked and posted.
- **Accounts in Charge:** Pays the bill and completes the process.

## 3. End-to-end process

### Phase A — Purchase requisition and release

1. The requester creates or updates a PR in SAP.
2. SAP sends the PR to P2P through a real-time API.
3. The PR goes through its release/approval decision:
   - **Approved:** PR information is synchronized into the P2P application, and the process continues to RFQ creation.
   - **Rejected:** The flow returns to creating or updating the PR in SAP. The requester can revise and resubmit it according to the applicable release procedure.

**Output:** An approved PR available in P2P for sourcing.

### Phase B — RFQ creation and specification

4. The RFQ creator creates an RFQ in P2P using the synchronized PR information.
5. The creator binds material to the RFQ and checks whether the PR item is recognized:
   - **Yes:** Continue with template selection.
   - **No:** Select the material and all other required information manually, then continue with template selection.
6. Select the RFQ template.
7. Select the technical specification set.
8. Select the commercial specification set.
9. Select the cost-breakdown specification set.
10. Select vendors.
11. Select the terms and conditions.
12. Float/publish the RFQ to the selected vendors.

**Output:** An RFQ with its requirements, invited vendors, and terms available to suppliers.

### Phase C — Vendor quotation and RFQ opening

13. Vendors submit quotations against the RFQ specification through the Vendor Portal.
14. After the RFQ deadline, the Supply Chain GM opens the RFQ for processing.
15. The RFQ creator initiates the technical and commercial comparison of the submitted quotations.

**Output:** Submitted quotations available for evaluation.

### Phase D — Evaluation and approvals

16. Check whether both technical and commercial templates were selected when the RFQ was created:

   **If yes:**

   1. The RFQ creator completes the pre-calculation from the RFQ line-item dashboard.
   2. The RFQ creator initiates the technical comparison.
   3. Select the technical approver set.
   4. Route the technical evaluation through that approver set in its configured sequence.
   5. Continue to the commercial comparison.

   **If no:**

   - The RFQ creator initiates the commercial comparison directly.

17. Route the commercial evaluation through the approver sequence configured for the purchase category.
18. Finalize the winning vendor after the required evaluation and approvals.

**Output:** An approved evaluation and selected winning vendor.

### Phase E — RFQ processing and purchase order

19. The RFQ creator processes the RFQ.
20. P2P generates a PO referencing the processed RFQ.

**Output:** A PO linked to its source RFQ.

### Phase F — Goods receipt, invoice, and payment

21. Record the GRN manually in SAP.
22. After GRN, the vendor can raise an invoice through the Vendor Portal.
23. The invoice flows automatically into the invoice automation approval workflow. The approval flow is bound to the purchase group and PO location.
24. The invoice goes to the user department for approval.
25. During VAT-person approval, the invoice is automatically parked and posted.
26. Accounts in Charge pays the bill and completes the process.

**Output:** The invoice is approved, parked and posted, and paid.

## 4. Process checkpoints and decision outcomes

| Checkpoint | Outcome | Next step |
|---|---|---|
| PR release | Approved | Synchronize PR information to P2P and create RFQ |
| PR release | Rejected | Return to PR creation/update in SAP |
| PR item/material binding | Recognized | Select template |
| PR item/material binding | Not recognized | Manually select material and required information, then select template |
| Technical and commercial templates | Both selected | Pre-calculate, complete technical comparison and approval, then commercial comparison |
| Technical and commercial templates | Not both selected | Initiate commercial comparison |
| RFQ deadline | Reached | Supply Chain GM opens RFQ for processing |
| GRN | Recorded manually in SAP | Vendor may raise invoice |

## 5. Key records and handoffs

- **PR:** Created and maintained in SAP; approved PR data is transferred to P2P through the real-time API.
- **RFQ:** Created in P2P from the PR, configured with material, templates/specifications, vendors, and terms, and published to vendors.
- **Quotation:** Submitted by vendors in the Vendor Portal and evaluated in P2P.
- **Evaluation and approvals:** Technical and commercial comparisons follow their respective configured approver sequences.
- **PO:** Generated in P2P with a reference to the processed RFQ.
- **GRN:** Entered manually in SAP.
- **Invoice:** Raised through the Vendor Portal after GRN and routed automatically for approval and posting.
- **Payment:** Completed by Accounts in Charge after the invoice workflow.

## 6. Controls implied by the flow

- PR release approval precedes the PR information synchronization and RFQ creation.
- Vendor quotations are submitted against the published RFQ and are processed after its deadline.
- Technical and commercial evaluations use configured approver sets/sequences where applicable.
- Commercial approvals are configured by purchase category.
- Invoice approval routing is associated with purchase group and PO location.
- The flow requires a GRN in SAP before a vendor can raise an invoice.
- The generated PO retains a reference to the processed RFQ.

## 7. Items to confirm with process owners

The flowchart does not specify the following operational rules. Confirm them before using this document as a detailed procedure or control standard:

- PR release approvers, approval thresholds, delegation, and resubmission rules.
- Required RFQ fields and how a PR item is identified as recognized or unrecognized.
- Vendor eligibility, invitation rules, and treatment of no or late quotations.
- RFQ extension, cancellation, amendment, and reopening procedures.
- Technical and commercial scoring, pre-calculation rules, tie handling, and award justification.
- Rejection, clarification, or rework paths for technical or commercial approvals.
- Purchase-category approver configuration and approval authority limits.
- PO approval, dispatch to the vendor, and change/cancellation handling.
- GRN ownership and handling of partial, rejected, or returned goods/services.
- Invoice matching, tax validation, discrepancies, credit notes, and duplicate invoices.
- Invoice approval service levels, exception handling, and payment terms.
- Whether invoice parking/posting occurs only after VAT approval or can be held for additional review.

## 8. Process completion

The process is complete when Accounts in Charge has paid the approved invoice. The source flow ends at payment and does not describe payment reconciliation, accounting close, or supplier performance follow-up.
