import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildQuoteComparisonViewModel,
  getBrandRatingLabel,
  getCanonicalPrice,
} from '../app/quote-comparison.mjs';

test('getCanonicalPrice prefers canonical price_total and falls back to total_price', () => {
  assert.equal(getCanonicalPrice({ price_total: 7440, total_price: 6200 }), 7440);
  assert.equal(getCanonicalPrice({ total_price: 6200 }), 6200);
  assert.equal(getCanonicalPrice({}), null);
});

test('getBrandRatingLabel maps numeric rating scores into homeowner-facing labels', () => {
  assert.equal(getBrandRatingLabel(8.5), 'Excellent');
  assert.equal(getBrandRatingLabel(7.0), 'Strong');
  assert.equal(getBrandRatingLabel(5.0), 'Average');
  assert.equal(getBrandRatingLabel(null), 'Unrated');
});

test('buildQuoteComparisonViewModel surfaces canonical comparison fields for homeowner UI', () => {
  const quote = {
    id: 'quote-1',
    contractor_id: 'contractor-1',
    equipment_brand: 'Carrier',
    equipment_model: '24ABC6',
    system_type: 'split_system',
    system_size_tons: 3.5,
    seer_rating: 16,
    warranty_years: 10,
    install_timeline_days: 2,
    price_total: 7440,
    price_breakdown: {
      equipment_cost: 2400,
      labor_cost: 3200,
      additional_cost: 600,
      service_area_fee: 250,
      permit_buffer: 350,
      margin_pct: 20,
    },
    includes_removal: true,
    permits_included: true,
    financing_available: false,
    note_to_homeowner: 'Draft quote based on your home size and ZIP.',
  };

  const contractor = {
    id: 'contractor-1',
    business_name: 'Delta HVAC',
    rating: 4.8,
  };

  const brandRatings = [
    { brand_name: 'Carrier', system_type: 'split_system', rating_score: 8.5 },
  ];

  const vm = buildQuoteComparisonViewModel({
    quote,
    contractor,
    contractorUser: null,
    brandRatings,
    optionLabel: 'Option A',
    isBestValue: true,
  });

  assert.equal(vm.contractorName, 'Delta HVAC');
  assert.equal(vm.optionLabel, 'Option A');
  assert.equal(vm.isBestValue, true);
  assert.equal(vm.priceValue, '$7,440');
  assert.equal(vm.brandLine, 'Carrier · 24ABC6 · 16 SEER');
  assert.equal(vm.sizeLabel, '3.5 tons');
  assert.equal(vm.timelineLabel, '2 days');
  assert.equal(vm.warrantyLabel, '10 years');
  assert.equal(vm.brandRatingValue, '8.5 / 10');
  assert.equal(vm.brandRatingLabel, 'Excellent');
  assert.equal(vm.breakdownRows[0].label, 'Equipment');
  assert.equal(vm.breakdownRows[0].value, '$2,400');
  assert.equal(vm.breakdownRows[1].label, 'Labor');
  assert.equal(vm.breakdownRows[2].label, 'Other');
  assert.equal(vm.detailRows.some(row => row.label === 'System size' && row.value === '3.5 tons'), true);
  assert.equal(vm.detailRows.some(row => row.label === 'Brand rating' && row.value === 'Excellent (8.5 / 10)'), true);
  assert.equal(vm.detailRows.some(row => row.label === 'Install timeline' && row.value === '2 days'), true);
});
