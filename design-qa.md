# Current design QA

final result: blocked

## Source and intended state

- Selected visual truth: `/workspace/generated_images/exec-269c2e41-133f-4894-aba6-4fd7f156210f.png`.
- Intended CSS viewport: 1440 × 1024, dark theme, Dispatch day view, selected unassigned Patricia Moore job, North/Lake/South crew lanes.
- Source raster: 1488 × 1058 pixels from Image Gen. Density/crop normalization has not been performed because no implementation capture is available.
- Water asset: `/workspace/codex/public/water-header.png`; generated and inspected as an individual background asset, not a screenshot of the app.

## Blocking evidence gap

Implementation screenshot: unavailable. No interactive Browser `js` or cloud CUA browser tool is exposed in this session. Sites' project setup/build/source helpers are not mounted in the executor, and attempts to read their source through the skill provider did not expose them. The available `sites-preview` CLI does not provide the missing browser control. Following the managed Sites preview instructions, a preview server was not launched without the required browser capability. TinyFish was declined; it was not used or suggested again.

No full-view or focused-region source/implementation comparison has occurred. Typography, spacing/layout rhythm, color tokens, image quality in the rendered header, copy wrapping, mobile layout, and browser interaction quality remain unverified. No browser-console inspection, keyboard-only flow, or live drag/drop check has been performed. Build success and API tests are recorded separately and are not substituted for visual QA.

## Comparison history

No visual QA iteration has been completed. There is no evidence to classify visual differences as acceptable or to claim a match.

## Required checks once the environment is available

1. Start the app using the supported preview workflow; capture the dark Dispatch view at the intended viewport.
2. Place the source and implementation captures together in the same comparison input. Normalize dimensions and inspect the whole composition plus header, timeline blocks, sidebar and job details.
3. Review all five fidelity surfaces: typography; layout/spacing; colors; asset crop/quality; copy/content.
4. Test the light theme and 390px, 760px and desktop widths. Confirm timelines pan without hiding persistent controls, and dialogs remain usable.
5. Exercise customer creation, job scheduling, rejected conflicts, drag/drop assignment, keyboard/touch rescheduling, checklist completion, water reading, stock use, next recurring visit, invoice approval, external payment recording, portal request, workflow draft creation, and CSV import/rejection.
6. Check focus management, contrast, input labels, 44px touch targets, reduced motion, browser console and errors. Repair any P0/P1/P2 issues, recapture and compare again.
7. Mark `final result: passed` only when browser-rendered evidence supports it. Until then, do not call the app production-ready or hand off a purported verified preview.
