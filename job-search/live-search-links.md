# Live CCTV / Access Control job searches (UK, £40k+)

These are **constructed search URLs**, not individual job adverts. Individual adverts
expire within days; these links always show whatever is live *right now*, filtered to
recently-posted roles above £40k. Bookmark these — they are the reliable entry point.

> Note: these URLs are built from each site's standard filter parameters. They have not
> been opened from this environment (the network egress policy blocks job sites), so a
> site may occasionally rename a parameter. If a filter looks wrong, adjust it in the
> site's own UI.

## Posted in the last 7 days, £40,000+

| Site | Live search |
|---|---|
| Indeed UK | https://uk.indeed.com/jobs?q=CCTV+engineer+%C2%A340%2C000&fromage=7&sort=date |
| Indeed UK (commissioning) | https://uk.indeed.com/jobs?q=CCTV+commissioning+engineer&fromage=7&sort=date |
| Reed | https://www.reed.co.uk/jobs/cctv-engineer-jobs?salaryfrom=40000&datecreatedoffset=LastWeek&sortby=DisplayDate |
| Reed (access control) | https://www.reed.co.uk/jobs/access-control-engineer-jobs?salaryfrom=40000&datecreatedoffset=LastWeek&sortby=DisplayDate |
| CV-Library | https://www.cv-library.co.uk/cctv-engineer-jobs?posted=7&salarymin=40000&salarytype=annum&order=posted |
| Totaljobs | https://www.totaljobs.com/jobs/cctv-engineer?postedwithin=7&salaryfrom=40000&sortby=date |
| LinkedIn Jobs | https://uk.linkedin.com/jobs/search?keywords=CCTV%20Engineer&location=United%20Kingdom&f_TPR=r604800&sortBy=DD |
| LinkedIn (commissioning) | https://uk.linkedin.com/jobs/search?keywords=CCTV%20Commissioning%20Engineer&location=United%20Kingdom&f_TPR=r604800&sortBy=DD |
| Find a job (DWP) | https://findajob.dwp.gov.uk/search?q=CCTV+engineer&sb=date&sd=down |

## Posted in the last 24 hours (for the daily check)

| Site | Live search |
|---|---|
| Indeed UK | https://uk.indeed.com/jobs?q=CCTV+engineer&fromage=1&sort=date |
| Reed | https://www.reed.co.uk/jobs/cctv-engineer-jobs?salaryfrom=40000&datecreatedoffset=Today&sortby=DisplayDate |
| CV-Library | https://www.cv-library.co.uk/cctv-engineer-jobs?posted=1&salarymin=40000&order=posted |
| LinkedIn | https://uk.linkedin.com/jobs/search?keywords=CCTV%20Engineer&location=United%20Kingdom&f_TPR=r86400&sortBy=DD |

## Why individual advert links go dead

The daily automation can only see cached search-engine snippets — the environment's
network policy blocks direct access to every job site, so a specific advert URL cannot be
opened and confirmed live before it is sent. Freshness is therefore established from
date signals in the search snippets ("posted 2 days ago") and by rejecting anything
carrying an expiry marker. That is good but not perfect, which is why every daily email
also carries the matching live search link above.

## How to make true verification possible

Add these hosts to this environment's egress allowlist (Claude Code web → environment
settings → network policy), and the automation can verify each advert directly:

- `api.adzuna.com` — free job API with real posting dates, returns only live jobs
- `findajob.dwp.gov.uk` — UK government job board, no bot blocking
- `www.reed.co.uk`, `uk.indeed.com`, `www.cv-library.co.uk`, `www.totaljobs.com`

With `api.adzuna.com` alone (free key from developer.adzuna.com), every daily result
could be a confirmed-live advert with an exact posting date.

## Genetec and enterprise VMS (added at user request)

Genetec roles are typically network-heavy and pay above the general CCTV-engineer band,
so they are worth a separate weekly sweep.

| Site | Live search |
|---|---|
| Indeed UK — Genetec | https://uk.indeed.com/jobs?q=Genetec&fromage=7&sort=date |
| Indeed UK — Genetec CCTV | https://uk.indeed.com/jobs?q=Genetec+CCTV+engineer&fromage=7&sort=date |
| Reed — Genetec | https://www.reed.co.uk/jobs/genetec-jobs?salaryfrom=40000&datecreatedoffset=LastWeek&sortby=DisplayDate |
| CV-Library — Genetec | https://www.cv-library.co.uk/genetec-jobs?posted=7&salarymin=40000&order=posted |
| Totaljobs — Genetec | https://www.totaljobs.com/jobs/genetec?postedwithin=7&salaryfrom=40000&sortby=date |
| LinkedIn — Genetec | https://uk.linkedin.com/jobs/search?keywords=Genetec&location=United%20Kingdom&f_TPR=r604800&sortBy=DD |
| Professional Security Magazine | https://professionalsecurity.co.uk/?s=Genetec |
| Indeed UK — Milestone VMS | https://uk.indeed.com/jobs?q=Milestone+XProtect+CCTV&fromage=7&sort=date |

Note on the CV: Genetec is not currently listed on the CV (the VMS line reads Milestone,
iVMS-4200, DSS, Avigilon). Application letters for Genetec roles therefore position the
experience as transferable from equivalent enterprise VMS platforms at 1050+ camera scale,
rather than claiming Genetec itself. If there is real Genetec exposure, adding it to the CV
would materially strengthen these applications.
