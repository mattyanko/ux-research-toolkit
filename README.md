# Sample / UX research sample size planner

Static HTML for GitHub Pages. Open index.html locally; no build step. Optional Google Fonts fall back to system fonts. Inputs stay in the browser.

## Research questions

### Tabbed research toolkit

The original planner remains in Calculate sample size. Three additional keyboard-accessible tabs are implemented in toolkit.js with pure calculations in toolkit-math.js:

- Work with my sample: usable n → approximate rate / mean precision or detectable mean difference for independent / paired designs. Independent n is the total split across groups. Uses normal critical values, not exact t or rank power; endpoints 0% and 100% are excluded from rate precision because this approximation degenerates there.
- Interpret results: observed counts → Wilson score interval / one-sided lower bound against a fixed goal. Numeric means use an explicitly labelled z approximation with observed SD, not a t interval. Goal decisions are above, below (two-sided only), or inconclusive. A one-sided mean bound extends to infinity; its drawing is a finite view. No historical-benchmark uncertainty is included.
- Plan segments: shared within-segment precision assumptions → usable and recruitment quotas. Non-overlapping exhaustive shares must sum to 100%. Overlapping membership gives counting bounds only, not a unique-person estimate. Natural sampling totals are expectations, not quota assurance. Population weighting and comparison power require separate planning.

All three keep family corrections separate and do not upload inputs. Run `node test-toolkit.js` for numerical reference, decision, recruitment, and validation checks. References were independently computed using Python statistics.NormalDist; the Wilson interval reference is 82/100 → [0.7333264161, 0.8829977450] at 95%. Visual browser QA is not established by these tests.

For GitHub Pages, also include toolkit.js and toolkit-math.js with the existing page files.

- Estimate a top-two-box / positive-rating percentage, with a defined cutoff and denominator.
- Compare a positive-rating percentage with a fixed benchmark (one- or two-sided).
- Demonstrate that the population percentage exceeds a minimum acceptable target (one-sided).
- Estimate mean scale scores, test a fixed benchmark, or compare means within / between participants.
- Compare independent positive-rating percentages.
- Plan observation of a specified issue in interviews or usability research, not thematic saturation.

Benchmark power needs an expected population value distinct from the null benchmark. For an 80% goal, expecting 90% is a power-planning assumption; merely observing 80% does not establish population adequacy. Historical sample benchmarks have uncertainty and are not interchangeable with fixed goals.

## Families and direction

All sample-size results are unadjusted at the selected per-test alpha. Family correction is a separate educational guide; it never changes recruitment numbers. Its threshold illustration shows Bonferroni and Holm, with explanations of FWER, FDR, and model-specific methods. A family is defined by the related claims and decision rule, not automatically the whole dataset. Define and justify families before inspecting results. Corrected analyses can need larger samples to maintain power.

Scale modes offer an editable 1–5 example: SD 1.1, precision 0.2 or difference 0.3. These are illustrations, not universal limits or validated importance thresholds. Paired example SD 1.1 assumes item SD 1.1 in each condition and correlation .5. A difference worth detecting is a decision-relevant population effect, not a significance cutoff. The calculator plans detection against zero, not a test that an effect exceeds that threshold.

## Methods and limits

### Optional finite population correction

The rate-estimation scenario in Calculate sample size offers a known finite population option. It applies n = ceiling[N n0 / (N − 1 + n0)] using unrounded n0 = z²p(1−p)/margin². At N=2,500, p=.5, 95% confidence and ±5 percentage points it gives 334 usable responses (385 without correction); 10% exclusions increase the recruitment target to 372. It assumes simple random sampling without replacement from the specified fixed population, not a convenience / voluntary-response sample. The population, method, and correction are included in the copied study plan. The other tabs do not automatically inherit it.

### Individual ordinal items

The independent Mann–Whitney path takes expected category percentages (five or seven ordered categories) and uses the tie-adjusted asymptotic approximation in Zhao, Rahardja & Qu (2008), Equation 12, with equal allocation. Total N = (z_alpha + z_power)^2 * [1 − sum(pooled_category_probability^3)] / [3 * (theta − .5)^2]; round each group up from N/2. Theta = P(B>A) + .5P(B=A). This mode is two-sided only. It is not exact power and does not share the mean-based sample-size formula.

Reference method: https://search.r-project.org/CRAN/refmans/samplesize/html/n.wilcox.ord.html . Reference implementation: https://github.com/cran/samplesize/blob/master/R/n.wilcox.ord.R . The method is implemented independently from the mathematical expression.

For the UI example A=(10,15,30,30,15)% and B=(5,10,20,35,30)%, theta=.6225 and the result is 82 per group at alpha=.05 and power=.80. An independent Python Monte Carlo check (seed 149, 4,000 repetitions, actual-sample tie variance and continuity-corrected asymptotic two-sided MW) gave .812 rejection probability. This is a sanity check for one scenario, not universal validation.

The analysis chooser distinguishes single ordinal items, composite scale means, paired ratings, and T2B outcomes. Signed-rank / sign-test and paired ordinal power are not implemented and are clearly identified as unavailable; users should not substitute independent MW or mean power. Mean modes remain normal approximations, not exact t/Welch power. The separate family-wise error guide remains independent of all sample-size results.

Discovery uses the binomial at-least-once model. Other modes are normal approximations, not t-based / exact small-sample calculations. Fixed benchmark proportions use null variance for the critical value and alternative variance for power. Two-sided power uses a dominant-tail approximation. Minimum usable n is two except discovery. Recruitment inflation is rounded per group. See the page for formulas.

No paired binary, paired rank-test, clustered, ordinal-regression, non-inferiority / equivalence, or joint-power calculations. Finite-population correction is optional for rate sample-size estimation only. Normal approximations may be inadequate with small expected outcome counts. Survey recruitment bias and qualitative saturation are not solved by these formulas.

## Hosting

Repository: https://github.com/mattyanko/ux-research-toolkit . The static site files are in the repository root. In Settings → Pages choose deployment from main and / (root). Include index.html, style.css, calculator.js, app.js, toolkit-math.js, toolkit.js, and .nojekyll. Do not upload the copyrighted reference PDF without permission.

## Verification and sources

Run `node test-calculator.js`. References include book discovery and rate-precision examples and independent Python statistics.NormalDist formula calculations. Logic checks do not establish small-sample accuracy.

- Lewis & Sauro (2016), Excel and R Companion to Quantifying the User Experience, chapters 6–7.
- https://itl.nist.gov/div898/handbook/ppc/section3/ppc333.htm
- https://itl.nist.gov/div898/handbook/eda/section3/eda352.htm
- https://itl.nist.gov/div898/handbook/prc/section4/prc473.htm
- https://itl.nist.gov/div898/handbook/prc/section4/prc47.htm
- https://www.statsmodels.org/dev/_modules/statsmodels/stats/proportion.html

