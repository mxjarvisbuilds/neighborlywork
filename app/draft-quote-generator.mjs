const BRAND_FALLBACK_ORDER = ['Carrier', 'Trane', 'Lennox', 'Rheem', 'Goodman', 'Daikin', 'Other'];

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function roundMoney(value) {
  return Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;
}

function normalizeObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function normalizeSystemType(serviceType = '') {
  const raw = String(serviceType || '').toLowerCase();
  if (raw.includes('mini-split')) return 'mini_split';
  return 'split_system';
}

function estimateSystemSizeTons(homeSizeSqft) {
  const sqft = toNumber(homeSizeSqft, 0);
  if (sqft <= 0) return null;
  const estimated = Math.max(1.5, Math.min(5, Math.round((sqft / 600) * 2) / 2));
  return estimated;
}

function formatTimelineLabel(days) {
  if (!Number.isFinite(days) || days <= 0) return 'Flexible';
  if (days === 1) return '1 day';
  return `${days} days`;
}

function isPricingProfileReadyForDrafts(pricingProfile) {
  if (!pricingProfile || typeof pricingProfile !== 'object') return false;
  return toNumber(pricingProfile.base_labor_rate, 0) > 0
    && pricingProfile.default_warranty_offered !== null
    && pricingProfile.default_warranty_offered !== undefined
    && pricingProfile.default_install_timeline_days !== null
    && pricingProfile.default_install_timeline_days !== undefined;
}

function pickRecommendedBrand({ pricingProfile, brandRatings, systemType }) {
  const brandMarkups = normalizeObject(pricingProfile?.brand_markups);
  const pricedBrands = Object.entries(brandMarkups)
    .filter(([, value]) => Number.isFinite(Number(value)) && Number(value) >= 0)
    .map(([brand, value]) => ({ brand, markup: Number(value) }));

  const scopedRatings = Array.isArray(brandRatings)
    ? brandRatings.filter(row => row && row.brand_name && (!row.system_type || row.system_type === systemType))
    : [];

  const ratingMap = new Map(scopedRatings.map(row => [row.brand_name, toNumber(row.rating_score, 0)]));

  if (pricedBrands.length) {
    pricedBrands.sort((a, b) => {
      const ratingDiff = (ratingMap.get(b.brand) || 0) - (ratingMap.get(a.brand) || 0);
      if (ratingDiff !== 0) return ratingDiff;
      const markupDiff = a.markup - b.markup;
      if (markupDiff !== 0) return markupDiff;
      return a.brand.localeCompare(b.brand);
    });
    return pricedBrands[0].brand;
  }

  if (scopedRatings.length) {
    return [...scopedRatings]
      .sort((a, b) => {
        const ratingDiff = toNumber(b.rating_score, 0) - toNumber(a.rating_score, 0);
        if (ratingDiff !== 0) return ratingDiff;
        const fallbackIndexA = BRAND_FALLBACK_ORDER.indexOf(a.brand_name);
        const fallbackIndexB = BRAND_FALLBACK_ORDER.indexOf(b.brand_name);
        return (fallbackIndexA === -1 ? 999 : fallbackIndexA) - (fallbackIndexB === -1 ? 999 : fallbackIndexB);
      })[0].brand_name;
  }

  return BRAND_FALLBACK_ORDER[0];
}

function deriveDraftQuote({ lead, pricingProfile, brandRatings, nowIso = new Date().toISOString() }) {
  if (!isPricingProfileReadyForDrafts(pricingProfile)) {
    throw new Error('Pricing profile is incomplete. Save base labor, default warranty, and default timeline first.');
  }

  const systemType = normalizeSystemType(lead?.service_type);
  const brand = pickRecommendedBrand({ pricingProfile, brandRatings, systemType });
  const brandMarkups = normalizeObject(pricingProfile.brand_markups);
  const serviceAreaFees = normalizeObject(pricingProfile.service_area_fees);
  const markupPreferences = normalizeObject(pricingProfile.markup_preferences);

  const laborCost = roundMoney(pricingProfile.base_labor_rate);
  const equipmentCost = roundMoney(brandMarkups[brand] ?? 0);
  const serviceAreaFee = roundMoney(serviceAreaFees[lead?.zip_code] ?? 0);
  const permitBuffer = roundMoney(markupPreferences.permit_buffer ?? 0);
  const additionalCost = roundMoney(serviceAreaFee + permitBuffer);
  const subtotalBeforeMargin = roundMoney(equipmentCost + laborCost + additionalCost);
  const marginPct = Math.max(0, toNumber(markupPreferences.target_margin_pct, 0));
  const priceTotal = roundMoney(subtotalBeforeMargin * (1 + marginPct / 100));
  const systemSizeTons = estimateSystemSizeTons(lead?.home_size_sqft);
  const installTimelineDays = toNumber(pricingProfile.default_install_timeline_days, 0);
  const warrantyYears = toNumber(pricingProfile.default_warranty_offered, 0);

  return {
    equipment_brand: brand,
    equipment_model: null,
    system_type: systemType,
    system_size_tons: systemSizeTons,
    seer_rating: null,
    warranty_years: warrantyYears,
    install_timeline_days: installTimelineDays,
    install_time_label: formatTimelineLabel(installTimelineDays),
    price_total: priceTotal,
    price_breakdown: {
      equipment_cost: equipmentCost,
      labor_cost: laborCost,
      additional_cost: additionalCost,
      service_area_fee: serviceAreaFee,
      permit_buffer: permitBuffer,
      subtotal_before_margin: subtotalBeforeMargin,
      margin_pct: marginPct,
    },
    draft_generated_at: nowIso,
    note_to_homeowner: `Draft quote based on your pricing profile and ${brand} brand rating. Review and edit before submitting.`
  };
}

const DraftQuoteGenerator = {
  deriveDraftQuote,
  estimateSystemSizeTons,
  formatTimelineLabel,
  isPricingProfileReadyForDrafts,
  normalizeSystemType,
  pickRecommendedBrand,
};

if (typeof window !== 'undefined') {
  window.DraftQuoteGenerator = DraftQuoteGenerator;
}

export {
  deriveDraftQuote,
  estimateSystemSizeTons,
  formatTimelineLabel,
  isPricingProfileReadyForDrafts,
  normalizeSystemType,
  pickRecommendedBrand,
};
