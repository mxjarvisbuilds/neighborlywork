-- NeighborlyWork brand ratings seed v1
-- Checkpoint 2.5: launch seed/import path for public.brand_ratings
-- Applies launch brand ratings for mainstream ducted split-system brands
-- plus first mini-split expansion brands.

begin;

insert into public.brand_ratings (
  brand_name,
  system_type,
  rating_score,
  rating_sources,
  methodology_notes
)
values
  (
    'Carrier',
    'split_system',
    8.5,
    jsonb_build_array(
      jsonb_build_object('category','reliability','source_name','Consumer Reports','source_type','independent_survey','notes','Use independent reliability and owner satisfaction where available'),
      jsonb_build_object('category','efficiency','source_name','ENERGY STAR','source_type','certification','notes','Broad efficient lineup presence'),
      jsonb_build_object('category','certification','source_name','AHRI','source_type','certification','notes','Certified product breadth'),
      jsonb_build_object('category','warranty','source_name','Manufacturer warranty docs','source_type','primary_document','notes','Standard parts/compressor coverage'),
      jsonb_build_object('category','support','source_name','Dealer footprint review','source_type','qualitative','notes','Broad residential support network')
    ),
    'Strong all-around legacy brand with broad lineup depth, strong support footprint, and strong brand familiarity in residential replacement quotes. Score is brand-level only; installation quality still matters heavily.'
  ),
  (
    'Bryant',
    'split_system',
    8.0,
    jsonb_build_array(
      jsonb_build_object('category','family_context','source_name','Carrier family ecosystem','source_type','qualitative','notes','Closely aligned with Carrier support platform'),
      jsonb_build_object('category','efficiency','source_name','ENERGY STAR','source_type','certification','notes','Residential efficient lineup presence'),
      jsonb_build_object('category','certification','source_name','AHRI','source_type','certification','notes','Certified product coverage'),
      jsonb_build_object('category','warranty','source_name','Manufacturer warranty docs','source_type','primary_document','notes','Standard coverage review'),
      jsonb_build_object('category','support','source_name','Dealer footprint review','source_type','qualitative','notes','Broad residential dealer support')
    ),
    'Strong mainstream brand with broad residential relevance and a strong support ecosystem. Slightly lower confidence than Carrier because independent brand-level public evidence is often less front-and-center.'
  ),
  (
    'Trane',
    'split_system',
    8.5,
    jsonb_build_array(
      jsonb_build_object('category','reliability','source_name','Consumer Reports','source_type','independent_survey','notes','Use independent reliability and owner satisfaction where available'),
      jsonb_build_object('category','efficiency','source_name','ENERGY STAR','source_type','certification','notes','Strong residential efficient lineup'),
      jsonb_build_object('category','certification','source_name','AHRI','source_type','certification','notes','Certified product breadth'),
      jsonb_build_object('category','warranty','source_name','Manufacturer warranty docs','source_type','primary_document','notes','Warranty positioning reviewed'),
      jsonb_build_object('category','support','source_name','Dealer footprint review','source_type','qualitative','notes','Broad installer footprint')
    ),
    'Premium-leaning mainstream brand with strong homeowner recognition, broad lineup, and broad installer footprint. Premium branding does not guarantee install quality, so the score remains brand-level only.'
  ),
  (
    'American Standard',
    'split_system',
    8.5,
    jsonb_build_array(
      jsonb_build_object('category','family_context','source_name','Trane family ecosystem','source_type','qualitative','notes','Closely aligned with Trane platform and support footprint'),
      jsonb_build_object('category','efficiency','source_name','ENERGY STAR','source_type','certification','notes','Residential efficient lineup presence'),
      jsonb_build_object('category','certification','source_name','AHRI','source_type','certification','notes','Certified product breadth'),
      jsonb_build_object('category','warranty','source_name','Manufacturer warranty docs','source_type','primary_document','notes','Warranty review completed'),
      jsonb_build_object('category','support','source_name','Dealer footprint review','source_type','qualitative','notes','Broad installer footprint')
    ),
    'Strong mainstream brand closely aligned with Trane, with broad residential fit and strong service support. Keep score aligned with Trane unless stronger contrary evidence appears in later refreshes.'
  ),
  (
    'Lennox',
    'split_system',
    7.5,
    jsonb_build_array(
      jsonb_build_object('category','efficiency','source_name','ENERGY STAR','source_type','certification','notes','Strong premium-efficiency presence'),
      jsonb_build_object('category','certification','source_name','AHRI','source_type','certification','notes','Certified lineup breadth'),
      jsonb_build_object('category','warranty','source_name','Manufacturer warranty docs','source_type','primary_document','notes','Warranty positioning reviewed'),
      jsonb_build_object('category','support','source_name','Dealer footprint review','source_type','qualitative','notes','Mainstream residential support network'),
      jsonb_build_object('category','reliability','source_name','Independent review needed','source_type','methodology_flag','notes','Do not overstate reliability edge without strong independent evidence')
    ),
    'Well-known premium/mainstream brand with strong efficiency reputation. Keep below the very top launch tier until stronger independent reliability evidence clearly supports a higher score.'
  ),
  (
    'Rheem',
    'split_system',
    7.5,
    jsonb_build_array(
      jsonb_build_object('category','efficiency','source_name','ENERGY STAR','source_type','certification','notes','Residential lineup presence'),
      jsonb_build_object('category','certification','source_name','AHRI','source_type','certification','notes','Certified product coverage'),
      jsonb_build_object('category','warranty','source_name','Manufacturer warranty docs','source_type','primary_document','notes','Warranty review completed'),
      jsonb_build_object('category','support','source_name','Dealer footprint review','source_type','qualitative','notes','Broad support footprint'),
      jsonb_build_object('category','reliability','source_name','Independent review where available','source_type','independent_survey','notes','Use independent data when available')
    ),
    'Strong mainstream residential brand with broad quote presence and solid support footprint. Keep in the upper-mid launch tier pending fuller evidence refresh.'
  ),
  (
    'Ruud',
    'split_system',
    7.5,
    jsonb_build_array(
      jsonb_build_object('category','family_context','source_name','Rheem family ecosystem','source_type','qualitative','notes','Close family relationship to Rheem support platform'),
      jsonb_build_object('category','efficiency','source_name','ENERGY STAR','source_type','certification','notes','Residential lineup presence'),
      jsonb_build_object('category','certification','source_name','AHRI','source_type','certification','notes','Certified product coverage'),
      jsonb_build_object('category','warranty','source_name','Manufacturer warranty docs','source_type','primary_document','notes','Warranty review completed'),
      jsonb_build_object('category','support','source_name','Dealer footprint review','source_type','qualitative','notes','Broad support footprint')
    ),
    'Strong mainstream residential brand closely tied to Rheem with broad contractor familiarity. Keep closely aligned with Rheem unless later evidence supports a sharper separation.'
  ),
  (
    'Goodman',
    'split_system',
    7.0,
    jsonb_build_array(
      jsonb_build_object('category','family_context','source_name','Daikin family ecosystem','source_type','qualitative','notes','Broad value-tier support context'),
      jsonb_build_object('category','efficiency','source_name','ENERGY STAR','source_type','certification','notes','Lineup presence where applicable'),
      jsonb_build_object('category','certification','source_name','AHRI','source_type','certification','notes','Certified products present'),
      jsonb_build_object('category','warranty','source_name','Manufacturer warranty docs','source_type','primary_document','notes','Warranty review completed'),
      jsonb_build_object('category','support','source_name','Contractor prevalence review','source_type','qualitative','notes','Very common in contractor quote sets')
    ),
    'Very common quote brand with strong market presence and value positioning, but not seeded in the premium tier at launch without stronger independent reliability evidence.'
  ),
  (
    'Amana',
    'split_system',
    7.5,
    jsonb_build_array(
      jsonb_build_object('category','family_context','source_name','Daikin family ecosystem','source_type','qualitative','notes','Shared support ecosystem with Goodman/Daikin'),
      jsonb_build_object('category','efficiency','source_name','ENERGY STAR','source_type','certification','notes','Efficient lineup presence'),
      jsonb_build_object('category','certification','source_name','AHRI','source_type','certification','notes','Certified products present'),
      jsonb_build_object('category','warranty','source_name','Manufacturer warranty docs','source_type','primary_document','notes','Warranty positioning reviewed'),
      jsonb_build_object('category','support','source_name','Dealer footprint review','source_type','qualitative','notes','Mainstream support footprint')
    ),
    'Mainstream residential brand with stronger premium positioning than Goodman inside the same family ecosystem. Slightly above Goodman at launch, but still below the top tier.'
  ),
  (
    'Daikin',
    'split_system',
    8.0,
    jsonb_build_array(
      jsonb_build_object('category','efficiency','source_name','ENERGY STAR','source_type','certification','notes','Broad high-efficiency relevance'),
      jsonb_build_object('category','certification','source_name','AHRI','source_type','certification','notes','Certified product breadth'),
      jsonb_build_object('category','warranty','source_name','Manufacturer warranty docs','source_type','primary_document','notes','Warranty review completed'),
      jsonb_build_object('category','support','source_name','Dealer footprint review','source_type','qualitative','notes','Strong family ecosystem support'),
      jsonb_build_object('category','market_context','source_name','Launch market review','source_type','qualitative','notes','Strong relevance in inverter / efficiency conversations')
    ),
    'Strong global HVAC brand with broad lineup depth and strong relevance in inverter and premium-efficiency conversations. Keep confidence medium until local quote evidence is refreshed further.'
  ),
  (
    'York',
    'split_system',
    7.0,
    jsonb_build_array(
      jsonb_build_object('category','family_context','source_name','Johnson Controls family context','source_type','qualitative','notes','Mainstream family support context'),
      jsonb_build_object('category','efficiency','source_name','ENERGY STAR','source_type','certification','notes','Residential lineup presence'),
      jsonb_build_object('category','certification','source_name','AHRI','source_type','certification','notes','Certified products present'),
      jsonb_build_object('category','warranty','source_name','Manufacturer warranty docs','source_type','primary_document','notes','Warranty review completed'),
      jsonb_build_object('category','support','source_name','Dealer footprint review','source_type','qualitative','notes','Adequate launch support footprint')
    ),
    'Established mainstream brand with broad residential familiarity and adequate launch coverage. Keep in the solid middle tier rather than the premium tier.'
  ),
  (
    'Coleman',
    'split_system',
    6.5,
    jsonb_build_array(
      jsonb_build_object('category','family_context','source_name','Johnson Controls family context','source_type','qualitative','notes','Shared support ecosystem with York'),
      jsonb_build_object('category','efficiency','source_name','ENERGY STAR','source_type','certification','notes','Coverage where applicable'),
      jsonb_build_object('category','certification','source_name','AHRI','source_type','certification','notes','Certified products present'),
      jsonb_build_object('category','warranty','source_name','Manufacturer warranty docs','source_type','primary_document','notes','Warranty review completed'),
      jsonb_build_object('category','support','source_name','Dealer footprint review','source_type','qualitative','notes','Value-tier support footprint')
    ),
    'Recognizable mainstream value brand that belongs in launch comparisons but should start slightly below the stronger mid-tier brands.'
  ),
  (
    'Payne',
    'split_system',
    7.0,
    jsonb_build_array(
      jsonb_build_object('category','family_context','source_name','Carrier family ecosystem','source_type','qualitative','notes','Value-tier support context within Carrier family'),
      jsonb_build_object('category','efficiency','source_name','ENERGY STAR','source_type','certification','notes','Coverage where applicable'),
      jsonb_build_object('category','certification','source_name','AHRI','source_type','certification','notes','Certified products present'),
      jsonb_build_object('category','warranty','source_name','Manufacturer warranty docs','source_type','primary_document','notes','Warranty review completed'),
      jsonb_build_object('category','support','source_name','Dealer footprint review','source_type','qualitative','notes','Mainstream contractor relevance')
    ),
    'Value-oriented mainstream brand within the Carrier family ecosystem. Launch score reflects broad residential relevance without placing it in the premium tier.'
  ),
  (
    'Bosch',
    'split_system',
    8.0,
    jsonb_build_array(
      jsonb_build_object('category','efficiency','source_name','ENERGY STAR','source_type','certification','notes','Strong relevance in higher-efficiency / inverter positioning'),
      jsonb_build_object('category','certification','source_name','AHRI','source_type','certification','notes','Certified product coverage'),
      jsonb_build_object('category','warranty','source_name','Manufacturer warranty docs','source_type','primary_document','notes','Warranty review completed'),
      jsonb_build_object('category','support','source_name','Dealer footprint review','source_type','qualitative','notes','Growing support footprint'),
      jsonb_build_object('category','market_context','source_name','Launch market review','source_type','qualitative','notes','Strong relevance in modern heat-pump conversations')
    ),
    'Strong modern/inverter-oriented brand with meaningful relevance in premium-efficiency and electrification conversations. Keep confidence medium until local prevalence is refreshed further.'
  ),
  (
    'Mitsubishi Electric',
    'mini_split',
    9.0,
    jsonb_build_array(
      jsonb_build_object('category','market_context','source_name','Ductless market review','source_type','qualitative','notes','Top-tier ductless relevance for homeowner comparisons'),
      jsonb_build_object('category','efficiency','source_name','ENERGY STAR','source_type','certification','notes','Strong mini-split efficiency presence'),
      jsonb_build_object('category','certification','source_name','AHRI','source_type','certification','notes','Certified product breadth'),
      jsonb_build_object('category','warranty','source_name','Manufacturer warranty docs','source_type','primary_document','notes','Warranty review completed'),
      jsonb_build_object('category','support','source_name','Dealer footprint review','source_type','qualitative','notes','Strong ductless support footprint')
    ),
    'Top-tier ductless brand for launch comparisons, especially where mini-split and zone-based solutions are in play. Strong ductless reputation and support justify a top launch-tier score for mini_split contexts.'
  ),
  (
    'Fujitsu',
    'mini_split',
    8.0,
    jsonb_build_array(
      jsonb_build_object('category','market_context','source_name','Ductless market review','source_type','qualitative','notes','Strong mini-split relevance'),
      jsonb_build_object('category','efficiency','source_name','ENERGY STAR','source_type','certification','notes','Mini-split efficiency presence'),
      jsonb_build_object('category','certification','source_name','AHRI','source_type','certification','notes','Certified products present'),
      jsonb_build_object('category','warranty','source_name','Manufacturer warranty docs','source_type','primary_document','notes','Warranty review completed'),
      jsonb_build_object('category','support','source_name','Installer footprint review','source_type','qualitative','notes','Meaningful ductless installer support')
    ),
    'Strong ductless-focused brand that belongs in launch expansion for mini-split comparisons. Keep below Mitsubishi Electric at launch unless stronger evidence supports parity.'
  ),
  (
    'Gree',
    'mini_split',
    7.0,
    jsonb_build_array(
      jsonb_build_object('category','market_context','source_name','Ductless market review','source_type','qualitative','notes','Useful mini-split comparison brand for breadth'),
      jsonb_build_object('category','efficiency','source_name','ENERGY STAR','source_type','certification','notes','Coverage where applicable'),
      jsonb_build_object('category','certification','source_name','AHRI','source_type','certification','notes','Certified product coverage where applicable'),
      jsonb_build_object('category','warranty','source_name','Manufacturer warranty docs','source_type','primary_document','notes','Warranty review completed'),
      jsonb_build_object('category','support','source_name','Installer footprint review','source_type','qualitative','notes','Expansion-brand support footprint')
    ),
    'Useful ductless expansion brand for launch coverage, but not placed in the top premium ductless tier at launch.'
  )
on conflict (brand_name, system_type)
do update set
  rating_score = excluded.rating_score,
  rating_sources = excluded.rating_sources,
  methodology_notes = excluded.methodology_notes,
  last_updated = now();

commit;
