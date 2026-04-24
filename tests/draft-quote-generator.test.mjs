import test from 'node:test';
import assert from 'node:assert/strict';

import {
  deriveDraftQuote,
  isPricingProfileReadyForDrafts,
} from '../app/draft-quote-generator.mjs';

test('deriveDraftQuote picks the highest-rated priced brand and computes deterministic breakdown', () => {
  const lead = {
    id: 'lead-1',
    service_type: 'AC Installation',
    zip_code: '95630',
    home_size_sqft: 2100,
  };

  const pricingProfile = {
    base_labor_rate: 3200,
    brand_markups: {
      Carrier: 2400,
      Trane: 2800,
      Goodman: 1800,
    },
    service_area_fees: {
      '95630': 250,
    },
    default_warranty_offered: 10,
    default_install_timeline_days: 2,
    markup_preferences: {
      permit_buffer: 350,
      target_margin_pct: 20,
    },
  };

  const brandRatings = [
    { brand_name: 'Carrier', system_type: 'split_system', rating_score: 8.5 },
    { brand_name: 'Trane', system_type: 'split_system', rating_score: 8.5 },
    { brand_name: 'Goodman', system_type: 'split_system', rating_score: 7.0 },
  ];

  const draft = deriveDraftQuote({ lead, pricingProfile, brandRatings, nowIso: '2026-04-24T12:00:00.000Z' });

  assert.equal(draft.equipment_brand, 'Carrier');
  assert.equal(draft.system_type, 'split_system');
  assert.equal(draft.system_size_tons, 3.5);
  assert.equal(draft.warranty_years, 10);
  assert.equal(draft.install_timeline_days, 2);
  assert.equal(draft.install_time_label, '2 days');
  assert.equal(draft.price_breakdown.equipment_cost, 2400);
  assert.equal(draft.price_breakdown.labor_cost, 3200);
  assert.equal(draft.price_breakdown.additional_cost, 600);
  assert.equal(draft.price_breakdown.subtotal_before_margin, 6200);
  assert.equal(draft.price_breakdown.margin_pct, 20);
  assert.equal(draft.price_total, 7440);
  assert.equal(draft.draft_generated_at, '2026-04-24T12:00:00.000Z');
  assert.match(draft.note_to_homeowner, /Carrier/i);
});

test('isPricingProfileReadyForDrafts requires the minimum deterministic inputs', () => {
  assert.equal(isPricingProfileReadyForDrafts(null), false);
  assert.equal(isPricingProfileReadyForDrafts({ base_labor_rate: 0, default_warranty_offered: 10, default_install_timeline_days: 2 }), false);
  assert.equal(isPricingProfileReadyForDrafts({ base_labor_rate: 3200, default_warranty_offered: null, default_install_timeline_days: 2 }), false);
  assert.equal(isPricingProfileReadyForDrafts({ base_labor_rate: 3200, default_warranty_offered: 10, default_install_timeline_days: 2 }), true);
});
