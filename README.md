# Map the Outcome Website

Static website package for GitHub Pages.

## Pages

- `index.html`: restored attachment homepage, using MotOc, with Product, The Need, How it works, Why MotOc, White Paper, Research and Contact navigation.
- `homepage.css`: shared homepage and Research typography, colours, navigation and content width.
- `evidence-notes.html`: the existing audit source notes and limitations, linked from the homepage.
- `white-paper.html`: overview, with a left-hand chapter sidebar.
- `white-paper/`: ten additional product chapters with previous/next navigation.
- `research.html`: an evidence dashboard followed directly by the collection of 33 articles, with theme filters, search, sorting, illustrated cards and slide-over readers.
- `research/`: individual article pages that can be linked, indexed or opened without JavaScript.
- `insights.html`: compatibility link to the renamed Research collection.
- `assets/`: three optimised editorial illustrations, bundled locally.

The Research themes are Outcome, Research Findings, Summaries, Field Chronicles and Perspectives. Field Chronicles use labelled illustrative scenarios, not claimed field reporting. Source links and the original article references are retained. New study summaries cite their publications and state their scope.

The reading panel includes a key takeaway, organisation attribution, source links and a text-size control. Exercise blocks and the duplicate perspective callout have been removed from every article and reading panel.

The visible contact email has been removed. “Send an inquiry” opens the visitor's mail application with the existing recipient address. The address therefore remains in the link source, as required for email to work.

## GitHub Pages

Open the extracted `maptheoutcome_website` folder and copy its contents to the GitHub Pages publishing directory, preserving the `research`, `white-paper` and `assets` subfolders. No build step or backend is required. The homepage loads from `index.html`, with separate pages at:

- `/white-paper.html`
- `/research.html`

All local links and assets use relative paths, so the package also works in a GitHub project subdirectory. Canonical URLs and article metadata use `https://maptheoutcome.org`; change those if a different permanent domain is used. These help describe pages to search engines but do not guarantee discovery or ranking.

Google Fonts are optional external requests; system font fallbacks are provided. The website content, illustrations and reading panels are included in this download.

## Validation

The package is checked for JavaScript syntax, local links and fragment targets, section structure, article count, source preservation, image files and structured data. Browser-based visual testing was not performed in this revision.

Nothing in this package has been deployed to the live website.

## Latest revision

Homepage sections use a shared numbered divider and content container. Product includes “What MotOc does”, followed by a separate five-step workflow: Upload, Extract, Review, Connect and Use. Technical and API information is linked to the White Paper. The full eight-row “What changes with MotOc” table stays visible. Evidence Pathway remains above Network.

Research shares the homepage's Manrope headings and DM Sans body text. The three featured articles are removed from the landing section; those articles remain in the full collection. The four-metric dashboard retains preliminary-data labels, denominators and source notes. Existing editorial illustrations are restored in article cards and readers.
