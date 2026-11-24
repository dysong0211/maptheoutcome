# Draft MapToc product direction and homepage brief

Date: 5 October 2026  
For: MapToc product, design, and homepage teams  
Status: Proposed positioning and communication brief, not a claim of production readiness

MapToc should retain its foundation in program intelligence while making assurance the practical reason to use it. The product should help people notice an issue, understand its evidence and context, and follow up while a program is still running. Reports are an output of this work, not the whole product.

This memo guides a future homepage revision. The current app revision changes presentation and prioritization only; it does not introduce an autonomous risk engine, new audit services, or new data integrations.

## The problem remains the same

The product hypothesis is that development programs lose useful context across reports, spreadsheets, field updates, staff changes, and program closure. Recording and reconstructing that context adds work. Spending and delivery figures can become disconnected from decisions, constraints, and the evidence needed to explain them.

MapToc aims to reduce this burden and make gaps visible earlier. It should help teams account for resources and preserve lessons without promising that digitizing records alone will prove impact, eliminate misuse, or maximize value for money. Validate these benefits with pilot users before presenting them as established outcomes.

## Recommended positioning

MapToc is an AI-assisted program intelligence and assurance platform for development programs. It connects activities, decisions, spending, results, and original evidence so teams can identify gaps early, follow up on risks, and preserve program knowledge throughout the lifecycle.

Use “continuous assurance” to describe the intended operating approach: revisiting evidence and issues as a program changes. Do not imply that the current demo runs unattended monitoring or continuously verifies all program activity.

The distinction from a reporting tool is action. The distinction from detailed project management is focus: MapToc asks what needs attention, what supports the account, and what remains unresolved, rather than managing every daily task.

## Vision and users

The vision is for every program to leave an understandable, source-linked record of its decisions, use of resources, results, uncertainties, and lessons.

Field staff contribute documents and observations without having to write another report. Program managers interpret changes and coordinate follow-up. Reviewers examine evidence and record decisions. Funders and leadership need a scoped view of unresolved issues and the support behind reported progress.

These are intended user experiences, not a claim that the demo provides production-grade access control for multiple organizations.

## The operating loop

1. Capture existing documents, photos, and field updates.
2. Use AI to propose summaries and findings, with source references.
3. Have people review the evidence before publishing findings.
4. Connect reviewed findings to delivery, spending, decisions, risks, and questions.
5. Check defined requirements and surface potential exceptions or missing support.
6. Request evidence, record a response, recheck, and preserve the resolution history.
7. Reuse that record for updates, learning, and later independent review.

An AI document summary provides context. It is not an approved program conclusion. Approved, source-supported findings feed the living record and Program Summary. Numerical indicators need explicit source and metric mapping; arbitrary uploaded figures must not silently change aggregate totals.

## App direction

Keep the existing capture, review, chat, progress, evidence, finance, risk, report, and assurance workflows. Improve their hierarchy rather than adding another set of tools.

The Overview should answer three questions immediately: What needs attention? What is happening in the program? What can I do next? Show attention signals first, retain the AI workspace, and keep actionable follow-ups ahead of the deeper program summary.

Each attention item should expose its basis, status, and next action. Show owners and due dates where recorded; label missing values instead of inventing accountability. Keep original passages available when inspecting a finding.

Use the reference design: near-black green workspace framing, blue-green panel headers, white reading surfaces, teal actions, and mint accents. Reserve red for overdue items and risk signals; use amber for pending review, missing support, or stale checks. Always pair color with an icon and a plain-language label.

A recorded risk is not a confirmed breach. A potential exception requires review. Missing evidence is not proof that an activity failed. A passed check applies only to the tested requirement and evidence version, not to the entire program. Avoid an unexplained overall assurance score.

## Current demo and future work

The demo has document capture and review, source-linked records, contextual views of delivery and spending, follow-ups, and scoped deterministic assurance checks. Live AI requires configuration. Its illustrative financial allocation and synthetic records must stay labeled. Assurance checks are run explicitly; displayed signals do not establish continuous background monitoring.

Production work should be scoped separately: durable organizational storage, enforced server-side permissions, retention and deletion controls, operational security, validated extraction and metric mapping, and monitored reliability. Do not describe these as delivered based on browser-local workflows.

Independent audit services and KYC belong to later phases. Assurance can prepare a clearer evidence record for auditors; it must not be marketed as an independent audit opinion or certification.

## Homepage copy proposal

Eyebrow: AI-assisted program intelligence and assurance

Headline: See what needs attention. Keep the evidence connected.

Supporting copy: Bring program updates, decisions, spending, and results into one source-linked record. Review AI suggestions, spot missing support, and follow up on risks before context is lost.

Primary action: Explore the demo  
Secondary action: Discuss a pilot

Follow the hero with an app view showing labeled attention signals and a source-backed follow-up, rather than only totals. Then explain capture, human review, connected evidence, and follow-up. Use a worked example showing a transport cost change alongside its explanation, approval evidence, and unresolved outcome question.

Close with the benefit of a reusable program record: less reconstruction at reporting time and better continuity when teams change. Present these as intended benefits until pilot results support stronger claims.

## Homepage publication checks

- Label illustrative records and distinguish prepared demo findings from live AI.
- Keep reported delivery separate from demonstrated outcomes.
- Show the reporting period and source for numerical claims.
- Do not label every budget change as misuse or every risk as a confirmed exception.
- Avoid “certified,” “audit passed,” “fraud detected,” “real-time monitoring,” and “guaranteed impact” unless independently justified.
- Demonstrate the next action, not just a red badge.
- Publish this direction only after product-owner review; this memo does not authorize a website deployment.

## Proposed measures of success

During pilots, measure how quickly a user can identify the leading issue and open its evidence; how many findings retain valid citations; the time from clarification request to reviewed resolution; whether staff repeat data entry; and whether teams can reconstruct key decisions after a handover. Establish baselines before promising numerical improvements.
