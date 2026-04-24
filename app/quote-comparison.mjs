function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function formatMoney(value) {
  const amount = toNumber(value);
  if (amount === null) return 'Price unavailable';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

function yesNo(value) {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return '—';
}

function pickValue(obj, keys, fallback = null) {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return fallback;
}

function getCanonicalPrice(quote) {
  const raw = pickValue(quote, ['price_total', 'total_price'], null);
  return raw === null ? null : toNumber(raw);
}

function formatSystemSize(value) {
  const tons = toNumber(value);
  if (tons === null) return '—';
  return `${tons} tons`;
}

function formatWarranty(value) {
  const years = toNumber(value);
  if (years === null) return '—';
  return `${years} years`;
}

function formatTimelineDays(value) {
  const days = toNumber(value);
  if (days === null) return '—';
  if (days <= 0) return 'Same day';
  if (days === 1) return '1 day';
  return `${days} days`;
}

function getBrandRating(quote, brandRatings = []) {
  const brandName = pickValue(quote, ['equipment_brand'], null);
  const systemType = pickValue(quote, ['system_type'], null);
  if (!brandName) return null;
  const match = (brandRatings || []).find(row => row?.brand_name === brandName && (!systemType || !row?.system_type || row.system_type === systemType));
  return match ? toNumber(match.rating_score) : null;
}

function getBrandRatingLabel(score) {
  if (score === null || score === undefined || score === '') return 'Unrated';
  const value = toNumber(score);
  if (value === null) return 'Unrated';
  if (value >= 8) return 'Excellent';
  if (value >= 6.5) return 'Strong';
  if (value >= 5) return 'Average';
  if (value >= 3.5) return 'Below average';
  return 'Weak';
}

function getContractorName(contractor, contractorUser) {
  return pickValue(contractor, ['business_name'], pickValue(contractorUser, ['full_name'], 'Local contractor'));
}

function getContractorScore(contractor, contractorUser) {
  const ratingRaw = pickValue(contractor, ['rating', 'avg_rating', 'average_rating'], pickValue(contractorUser, ['rating', 'avg_rating', 'average_rating'], null));
  const rating = toNumber(ratingRaw);
  return rating === null ? 'New' : rating.toFixed(1);
}

function buildBrandLine(quote) {
  const equipmentBrand = pickValue(quote, ['equipment_brand'], null);
  const equipmentModel = pickValue(quote, ['equipment_model'], null);
  const seer = toNumber(pickValue(quote, ['seer_rating'], null));
  return [equipmentBrand, equipmentModel, seer === null ? null : `${seer} SEER`].filter(Boolean).join(' · ') || 'Equipment details coming soon';
}

function buildBreakdownRows(quote) {
  const breakdown = quote?.price_breakdown || {};
  return [
    { label: 'Equipment', value: formatMoney(breakdown.equipment_cost) },
    { label: 'Labor', value: formatMoney(breakdown.labor_cost) },
    { label: 'Other', value: formatMoney(pickValue(breakdown, ['additional_cost'], null)) },
  ];
}

function buildQuoteComparisonViewModel({ quote, contractor, contractorUser, brandRatings, optionLabel, isBestValue = false }) {
  const canonicalPrice = getCanonicalPrice(quote);
  const brandRating = getBrandRating(quote, brandRatings);
  const brandRatingLabel = getBrandRatingLabel(brandRating);
  const brandRatingValue = brandRating === null ? 'Unrated' : `${brandRating.toFixed(1)} / 10`;
  const sizeLabel = formatSystemSize(pickValue(quote, ['system_size_tons', 'tonnage'], null));
  const timelineLabel = formatTimelineDays(pickValue(quote, ['install_timeline_days'], null));
  const warrantyLabel = formatWarranty(pickValue(quote, ['warranty_years'], null));

  return {
    optionLabel,
    isBestValue,
    contractorName: getContractorName(contractor, contractorUser),
    contractorScore: getContractorScore(contractor, contractorUser),
    priceValue: formatMoney(canonicalPrice),
    brandLine: buildBrandLine(quote),
    sizeLabel,
    timelineLabel,
    warrantyLabel,
    brandRatingLabel,
    brandRatingValue,
    note: pickValue(quote, ['note_to_homeowner', 'contractor_notes'], ''),
    breakdownRows: buildBreakdownRows(quote),
    detailRows: [
      { label: 'System size', value: sizeLabel },
      { label: 'Warranty', value: warrantyLabel },
      { label: 'Install timeline', value: timelineLabel },
      { label: 'Brand rating', value: brandRating === null ? 'Unrated' : `${brandRatingLabel} (${brandRatingValue})` },
      { label: 'Removal included', value: yesNo(pickValue(quote, ['includes_removal'], null)) },
      { label: 'Permits included', value: yesNo(pickValue(quote, ['permits_included'], null)) },
      { label: 'Financing', value: yesNo(pickValue(quote, ['financing_available'], null)) },
    ],
  };
}

const QuoteComparison = {
  buildQuoteComparisonViewModel,
  formatMoney,
  formatSystemSize,
  formatTimelineDays,
  formatWarranty,
  getBrandRating,
  getBrandRatingLabel,
  getCanonicalPrice,
  getContractorName,
  getContractorScore,
  pickValue,
  yesNo,
};

if (typeof window !== 'undefined') {
  window.QuoteComparison = QuoteComparison;
}

export {
  buildQuoteComparisonViewModel,
  formatMoney,
  formatSystemSize,
  formatTimelineDays,
  formatWarranty,
  getBrandRating,
  getBrandRatingLabel,
  getCanonicalPrice,
  getContractorName,
  getContractorScore,
  pickValue,
  yesNo,
};
