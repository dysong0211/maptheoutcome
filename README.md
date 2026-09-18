# MapToc website

Serve this folder with a static web server to use the full website and interactive demo. For local preview, run `npm run dev` from this folder and open the address on port 4173. The app demo requires HTTP hosting; opening its HTML directly as a local file will not load its absolute asset paths.

## Interactive app demo

- The homepage “Try the app demo” button, app preview and product-section link open `/demo/`.
- The supplied demo includes Overview, Evidence Insight, Program Progress, Documents, Finances and a transparency log. The “Website” link returns to the homepage.
- It uses synthetic example records. Changes and uploaded files are stored in the visitor’s browser. “Reset demo” restores the sample records.
- Prepared summaries, source inspection and evidence exploration work in this static package. Free-form AI questions and live AI processing are disabled and need the separate server application; no AI keys or server endpoint are included.
- The demo uses the website’s local font and MapToc symbol through `demo/website-integration.css`. The supplied compiled application is retained.

## GitHub Pages upload

Upload the extracted website contents, including the complete `demo/` directory and `.nojekyll`, to the publishing root. Keep any existing custom-domain configuration. The `.nojekyll` file ensures GitHub Pages serves the demo’s `_next` assets.

The supplied demo is built for `/demo/` at the domain root, such as `maptheoutcome.org/demo/`. Hosting the website beneath a repository subpath requires rebuilding the demo from its source with the corresponding base path. The uploaded archive contains a compiled export, not its source project.

## This revision
- Restored the fuller Problem section and comparison diagrams; removed only the requested reconstruction sentence. Both key phrases share the same heading size, with tighter Solution spacing and all wording retained.
- Restored the open-column Why MapToc design, preserved the institutional block and removed only its eyebrow label.
- Outcome-diagram keywords use a darker green for stronger contrast.
- Hero actions use clean SVG arrows, and the mobile funding headline has explicit word spacing.
- Further reduced mobile section padding and comparison-card height while keeping app panels and diagrams visible.
- Compact phone layouts for the Problem, Product, Outcome trail and How it works sections. The Without/With comparison remains side by side on phones.
- Mobile copy removes repetition while desktop wording and app visuals are preserved. Outcome nodes, workflow stages and source inspection remain interactive.
- Mobile evidence-gap section now uses a compact 2×2 card grid and fits within a typical phone viewport at both 320px and 390px widths.
- Preserved all four percentages, denominators, the audit-method link and a concise source citation.
- White Paper aligned with the current outcome-focused AI engine, institutional buyer and living-record positioning.
- Reframed the core problem as lost institutional memory and disconnected accountability during implementation.
- Added automated accountability, frictionless oversight, live program integrity and real-time visibility to the institutional case.
- Clarified the SaaS model, implementer access, funding-requirement ambition and audit-readiness boundary.
- Renamed the White Paper chapter “Investors and partners” to “Institutional case.”
- Larger hero headline, preview aligned with the Program Intelligence label, and buttons aligned to the bottom of the desktop preview.
- Tighter funding, outcome-trail and workflow panels with preserved diagram text sizes.
- Refined benefit cards, institutional panel and resource links with subtle borders, depth and color accents.
- Investors is now Vision throughout navigation; investors.html redirects to vision.html and preserves fragment links.
- Hero captions share an aligned row, and the app begins below the Program Intelligence label. Traceable evidence has been removed from the hero pillars.
- Product anchor spacing and the evidence-capture interface are compact enough for a laptop viewport, without reducing finding text sizes.
- Vision presents the SaaS model without claiming that implementer access is included. Related homepage and White Paper copy is consistent.
- Every Vision section links to its relevant White Paper chapter.

## Retained design and features
- Header logo reduced by a further 1 mm (approximately 3.78 CSS pixels); navigation remains 13.5px.
- Refined hero with a larger headline and links, Explained Outcomes, a shorter app preview and an outlined investment link.
- Evidence Capture matches the reference: source document, connecting arrow and four stacked findings. Click a finding to reveal its original passage.
- Branded comparison panels and a redesigned Investors opportunity section. Product section renamed What MapToc does.
- Problem copy focuses on scattered and lost records as programs unfold.
- Investors now includes four institutional value outcomes: Automated Accountability, Frictionless Oversight, Live Program Integrity and Real-Time Visibility.
- The Investors page separates value for funders, donors and governments from value for implementers and program teams.
- Research now opens with “Three findings worth investigating” before the evidence-gap dashboard.
- The Investors opportunity section now explains the institutional buying case: late oversight, unlinked spending and missing context versus one record that grows with the work.
- Hero preview width reduced by approximately 1.5 cm at desktop and the headline enlarged by 2px.
- Compact evidence cards and comparison panels; green emphasis for the problem headline and outcome-map keywords.
- Hero label aligned with the preview, revised AI-engine positioning and funding-requirement line.
- Institutional problem reframed as fragmented accountability; evidence section tightened.
- All eight outcome-map blocks show explanations, support keyboard selection and retain centered labels.
- Native MapToc wordmark and vector symbol, with no image background.
- Consistent section labels, title sizes and compact problem/evidence content.
- Balanced hero layout with aligned, smaller links and preserved app previews.
- Restored the Without / With comparison panels and evidence coverage cards.
- Evidence capture, funding context, outcome trail and workflow are all visible on the homepage.
- Preserved the app concept interface and interactive evidence diagrams.
- Restored the Research publication layout and kept its articles, filters and search.
- Unified navigation across the homepage, Research, Investors and White Paper, including subpages.
- Shortened the investor pitch and added product, adoption and subscription visuals.

## Styles
`site-system.css` holds shared typography, navigation, branding and layout tokens. `landing-page.css`, `research-panels.css` and `investor-page.css` contain page-specific presentation. `app-preview.css` preserves the detailed concept interface. Document and research-reading styles remain separate.

## Verification
The integrated package includes 84 HTML pages. Local routes, asset references and JavaScript syntax were checked. The demo’s five main navigation routes, source inspection, evidence detail, return-to-website link and phone menus were checked at desktop, 390px and 320px widths without missing assets, JavaScript errors or horizontal overflow. Live AI controls remained disabled and made no API requests.

The 50 marketing and document pages were checked for local links, anchor targets, duplicate IDs and spelling. Navigation is consistent across all 48 pages that contain it; two compatibility redirects omit navigation. Homepage and Vision checked in the browser at 320, 390, 1024 and 1366 pixels without horizontal overflow or JavaScript errors. Product anchor positioning, source inspection, Vision chapter links and the legacy Investors redirect were checked. Desktop screenshots reviewed. Research and White Paper retain their previously tested layouts. No deployment performed.

The homepage examples and interactive app use illustrative records. Proposed capabilities are not a production service.

## Editorial review before launch
- The evidence percentages remain labeled preliminary. Publish the audit exports and coding rules to make the findings independently reproducible.
