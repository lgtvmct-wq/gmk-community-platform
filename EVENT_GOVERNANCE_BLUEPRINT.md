# GMK Event Governance Blueprint (Revised)
### Greens Malayalee Community (GMK) — Muscat, Oman

---

## 1. Executive Summary & Purpose
The **GMK Event Governance Framework** outlines the business architecture for managing and securing community celebrations, cultural showcases, and recreational meetings. This revised blueprint incorporates:
*   **Dual Leadership Support:** Up to two Coordinators per committee to enable shared operational overhead and transition redundancy.
*   **Event-Specific Role Scoping:** Replacing permanent global user roles with lightweight, event-specific dynamic assignments. This ensures volunteers can pivot to different roles for different events without administrative friction.
*   **Independent Multi-Stage Approval Workflows:** Separating financial verification (Finance Committee) from executive validation (Event Directors) to enforce operational controls.
*   **The Communications Committee:** The eighth core team tasked with managing promotions, PR, notifications, and social streams.

---

## 2. Event-Specific Dynamic Assignments (Contextual RBAC)

To eliminate the rigidity of permanent global user profiles, privileges are scoped strictly to the **active event**. Under this model, a user's permissions are dynamically resolved at runtime by querying their assignment within the context of `/events/{eventId}/assignments/{userId}` rather than checking global user profile claims.

```
                      GLOBAL USER LIST
                 [ User: UserA (Resident) ]
                             │
                             ▼ (Enrolls in Event #123)
              EVENT-SPECIFIC ASSIGNMENT PROFILE
       [ /events/123/assignments/UserA ] ──► Role: "Finance Coordinator"
                             │
                             ▼ (Enrolls in Event #456)
              EVENT-SPECIFIC ASSIGNMENT PROFILE
       [ /events/456/assignments/UserA ] ──► Role: "Volunteer Member"
```

### Dynamic Role Assignments Resolution
*   **Event Owner / Event Directors:** Retain global administrative privileges over the active event node.
*   **Dynamic Committee Coordinators:** Granted write access to specified committee collections inside the specific event.
*   **Dynamic Committee Members:** Cleared for execution tasks and logging features strictly within that specified event.

---

## 3. Dual-Coordinator Command Model

Each operational committee supports a **Dual-Coordinator (Co-Lead)** model.
*   **Scale Limitation:** A maximum of two (2) users may be assigned the `Coordinator` role for any single committee under an active event.
*   **Operational Intent:** This model prevents single-point-of-failure delays, allows shift splitting, and facilitates mentorship pipelines (e.g., pairing an experienced coordinator with a first-time leader).
*   **Access Equity:** Both co-coordinators have identical, concurrent edit and submit privileges within their committee's domain.

---

## 4. Multi-Stage Transactional Sign-Off Pipeline

To prevent conflicts of interest and streamline community accounting, all budget expansions or expense reimbursement claims follow a separate, multi-stage approval workflow.

```
┌────────────────────────┐      ┌──────────────────────────┐      ┌───────────────────────────┐
│     Committee Lead     │      │    Finance Committee     │      │      Event Director       │
│     Creates Claim      ├─────►│ Marks Finance Verified   ├─────►│  Executes Final Sign-Off  │
│ status: 'draft_submitted'│    │ status: 'finance_verified'│     │ status: 'approved_released'│
└────────────────────────┘      └──────────────────────────┘      └───────────────────────────┘
```

1.  **Draft Initiation:** A committee coordinator logs an expense or budget projection. The initial status is set to `'draft_submitted'`.
2.  **Finance Committee Audit:** The Finance Committee evaluates the invoice, aligns it with the overall event balance, and marks it `'finance_verified'`. 
    *   *System constraint:* The Finance Committee **cannot** bypass Event Director authorization.
3.  **Event Director Sign-Off:** The Event Director reviews the finance-verified claim and executes final approval, transitioning the state to `'approved_released'`. This triggers the release of funds or finalizes the ledger entry.

---

## 5. The Eight Operational Committees: Revised Specifications

---

### I. Finance Committee

#### A. Dual Coordinator Responsibilities
*   Co-manage overall event budget sheets, ledger targets, and cash forecasts.
*   Audit and verify outgoing expense/reimbursement claims submitted by other committees.
*   Update transaction records to `'finance_verified'` upon proof of purchase and compliance alignment.

#### B. Member Responsibilities
*   Input transaction lines, upload digital receipts, and record ticket revenue files.
*   Process physical cash logs from manual checkout gates.

#### C. Menu Access
*   **Coordinators:** Budget Monitor Panel, Verified Reimbursements Queue, Cash Audit Console, Ledger Overview.
*   **Members:** Transaction Entry Drawer, Receipts Repository, General Expense Roster.

#### D. Firestore Collections Required
*   `/events/{eventId}/financials/{txnId}` (Attributes: `status: 'draft_submitted' | 'finance_verified' | 'approved_released'`)
*   `/events/{eventId}/budgets/{budgetId}`

#### E. Security Model
*   **Read:** Restricted to Finance Co-Leads, Members, and Event Directors.
*   **Write (Creation):** Members are restricted to draft ledger nodes (`'draft_submitted'`). Coordinators can log entries directly and update states up to `'finance_verified'`.
*   **Auditing State Restrictions:** Moving a transaction status from `'finance_verified'` to `'approved_released'` requires Event Director signature check.

---

### II. Registration Committee

#### A. Dual Coordinator Responsibilities
*   Manage dynamic ticket tiers, registration capacity limits, and pricing.
*   Reconcile public ticket sales with the Finance Committee.
*   Resolve waitlists, process booking changes, or initiate cancellation pipelines.

#### B. Member Responsibilities
*   Respond to ticket-booking issues and perform manual check-ins.
*   Look up registration numbers and verification receipts at offline helpdesks.

#### C. Menu Access
*   **Coordinators:** Ticket Inventory Ledger, Sales Reconciler, Override Panel, Refunds Dashboard.
*   **Members:** Registration Search Deck, Helpdesk Checksheet, Dynamic Reservation Drawer.

#### D. Firestore Collections Required
*   `/events/{eventId}/eventRegistrations/{regId}`
*   `/events/{eventId}/tickets/{ticketId}`

#### E. Security Model
*   **Read:** Open for all enrolled committee staff and Event Directors. Individual families can read only their specific reservation records.
*   **Write:** Registration Coordinators can create or modify ticket ranges. Members can write booking check-ins but cannot adjust prices or overall capacity.

---

### III. Attendance Committee

#### A. Dual Coordinator Responsibilities
*   Configure gate entries, allocate check-in hardware, and assign scanning teams.
*   Monitor gate-flow velocity metrics and coordinate bottleneck-relief teams.

#### B. Member Responsibilities
*   Operate mobile QR code/barcode ticket scanners at entry points.
*   Log manual attendance validations when electronic optical scanners fail.

#### C. Menu Access
*   **Coordinators:** Gate Setup Desk, Live Flow Charts, Scanner Allocations, Audit Check.
*   **Members:** QR Scanner Terminal, Direct Resident Search Check, Station Scan Logs.

#### D. Firestore Collections Required
*   `/events/{eventId}/attendanceLogs/{logId}` (Immutable timeline entries)
*   `/events/{eventId}/gates/{gateId}`

#### E. Security Model
*   **Read/Write:** Append-only log design. Scanners emit new event logs with user and timestamp signatures. No committee role can edit or delete a compiled scan log, preventing gate auditing bypasses.

---

### IV. Food Committee

#### A. Dual Coordinator Responsibilities
*   Manage catering contracts, food item profiles, and coordinate dietary lines (Veg, Non-Veg, Child).
*   Review distribution pace, monitor storage conditions, and direct ingredient/parcel buffers.

#### B. Member Responsibilities
*   Scan QR food coupons accompanying attendee registrations to hand out portion packages.
*   Record incoming bulk pallet counts from catering kitchens.

#### C. Menu Access
*   **Coordinators:** Menu Builder, Meal Balance Monitor, Vendor Allocation Shelf, Wastage Log.
*   **Members:** Meal Coupon Scanner, Inventory Inbound sheet, Delivery Counter Console.

#### D. Firestore Collections Required
*   `/events/{eventId}/foodInventory/{itemId}`
*   `/events/{eventId}/foodDisbursement/{disbId}`

#### E. Security Model
*   **Write:** Only Food Coordinators can modify total batch quantities. Members are limited to confirming barcode redemptions (updating registration food states from `unclaimed` to `claimed`).

---

### V. Program Committee

#### A. Dual Coordinator Responsibilities
*   Draft, adjust, and deploy the Master Agenda and chronological show timelines.
*   Manage artist assignments, review performance tracks, and assign Green Room spots.

#### B. Member Responsibilities
*   Manage backstage runner sheets, notifying coordinators of timing changes.
*   Update active performance states (Rehearsing, On Deck, Active Stage, Complete) in-app.

#### C. Menu Access
*   **Coordinators:** Dynamic Timetable Workspace, Artist Roster, Audio/Visual Log, Green Room Layout.
*   **Members:** Chronometer Control, Backstage Status Sheet, Green Room Monitor.

#### D. Firestore Collections Required
*   `/events/{eventId}/programTimeline/{agendaId}`
*   `/events/{eventId}/greenRoom/{roomId}`

#### E. Security Model
*   **Read:** Timelines are public-readable to enable live interactive schedule viewing in the community app.
*   **Write:** Program coordinators hold structural timeline edit rights. Members can only trigger state-changes (e.g. `status: 'onstage'`).

---

### VI. Sponsorship Committee

#### A. Dual Coordinator Responsibilities
*   Configure sponsor package rules and reconcile incoming pledge contracts alongside Finance.
*   Evaluate promo campaigns and coordinate physical banner layouts at events.

#### B. Member Responsibilities
*   Follow up on sponsor logo assets, brochure files, and approval forms.
*   Verify that digital advertisement sequences are programmed onto screens.

#### C. Menu Access
*   **Coordinators:** Sponsor Package builder, CRM Pipelines, Contract Reconciler, Display Config.
*   **Members:** Sponsor Accounts Board, Creative Assets Ledger, Placement Checklist.

#### D. Firestore Collections Required
*   `/events/{eventId}/sponsorships/{sponsorId}`

#### E. Security Model
*   **Write:** Financial agreements are editable only by Sponsorship leads and Finance leads. Members are limited to uploading marketing image files and toggling asset verification pins.

---

### VII. Volunteer Committee

#### A. Dual Coordinator Responsibilities
*   Build shift schedules, recruit shift volunteers, and define skill levels.
*   Reconcile shift swaps and coordinate team meals with the Food Committee.

#### B. Member Responsibilities
*   Review and register for empty shift periods.
*   Check-in/out of scheduled assignments and report incident flags to coordinators.

#### C. Menu Access
*   **Coordinators:** Shift Matrix Workbench, Crew Matcher, Incident Center.
*   **Members:** Available Shifts Hub, Personal Task Sheet, Incident Logging Drawer.

#### D. Firestore Collections Required
*   `/events/{eventId}/volunteerShifts/{shiftId}`
*   `/events/{eventId}/incidents/{incidentId}`

#### E. Security Model
*   **Read:** Shift schedules are public-readable for community enrollment. Incident reports are strictly private (secured to creator, Volunteer Coordinators, and Event Directors).

---

### VIII. Communications Committee

#### A. Dual Coordinator Responsibilities
*   Orchestrate dynamic PR notification strategies, news updates, and social media media calendars.
*   Enforce branding standards and review community press statements.
*   Approve and queue push-notification blasts targeting and filtering community subsets.

#### B. Member Responsibilities
*   Capture photo/video media during active sessions and post to the live media library feed.
*   Draft operational alerts (e.g., parking shift updates, agenda changes) under direction.
*   Manage official community chats and digital information boards.

#### C. Menu Access
*   **Coordinators:** Announcement Creator, Push Notification Broadcaster, Media Approval Suite, PR Calendar.
*   **Members:** Operational Updates Composer, Live Media Upload Deck, Announcements Log.

#### D. Firestore Collections Required
*   `/events/{eventId}/communications/{pubId}` (Media and announcements logging)
*   `/events/{eventId}/promotionalAssets/{assetId}`

#### E. Security Model
*   **Read:** Published alerts/announcements are readable by all active community members to power real-time announcements.
*   **Write:** Only Communications Coordinators can authorize and send push notifications or broadcast updates to the public. Members process queue drafts or post updates to media pools.

---

## 6. Matrix mapping of Committee Scopes

| Committee | Chief Collections | Maximum Coordinators | Write Permission Authority | Multi-Stage Workflow Checks |
| :--- | :--- | :--- | :--- | :--- |
| **Finance** | `financials`, `budgets` | 2 | Co-Leads edit targets, verify cash claims | Multi-stage finance log verify |
| **Registration** | `eventRegistrations`, `tickets` | 2 | Co-Leads manage ticket counts, inventory | Integrated payments callback |
| **Attendance** | `attendanceLogs`, `gates` | 2 | Append-only scanners check-ins | Immutable log verification |
| **Food** | `foodInventory`, `foodDisbursement`| 2 | Co-Leads edit counts, Members scan tickets | Redemption stamp updates |
| **Program** | `programTimeline`, `greenRoom` | 2 | Co-Leads structure timetable, Members log stages| Public schedule updates |
| **Sponsorship** | `sponsorships` | 2 | Co-Leads edit contracts, Members manage files | Financial contract verification |
| **Volunteer** | `volunteerShifts`, `incidents` | 2 | Co-Leads schedule shifts, resolve alerts | Private Incident routing |
| **Communications**| `communications`, `promotionalAssets`| 2 | Co-Leads broadcast push, Members queue drafts | Dynamic distribution channels |

---
*End of GMK Event Governance Business Architecture Document (Revised).*
