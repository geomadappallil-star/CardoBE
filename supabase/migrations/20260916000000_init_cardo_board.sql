-- Cardo Board Canonical PostgreSQL Schema for Supabase
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 1. DIMENSIONS
CREATE TABLE IF NOT EXISTS dim_spice (
    id BIGSERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    commodity_group TEXT,
    scientific_name TEXT,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS dim_country (
    id BIGSERIAL PRIMARY KEY,
    iso2 CHAR(2),
    iso3 CHAR(3) UNIQUE NOT NULL,
    name TEXT NOT NULL,
    geometry GEOMETRY(MULTIPOLYGON, 4326)
);

CREATE TABLE IF NOT EXISTS dim_region (
    id BIGSERIAL PRIMARY KEY,
    country_id BIGINT REFERENCES dim_country(id),
    parent_id BIGINT REFERENCES dim_region(id),
    region_type TEXT NOT NULL,
    name TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    geometry GEOMETRY(MULTIPOLYGON, 4326)
);

CREATE TABLE IF NOT EXISTS dim_market (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    region_id BIGINT REFERENCES dim_region(id),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    market_type TEXT
);

CREATE TABLE IF NOT EXISTS dim_grade (
    id BIGSERIAL PRIMARY KEY,
    spice_id BIGINT REFERENCES dim_spice(id),
    name TEXT NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS dim_source (
    id BIGSERIAL PRIMARY KEY,
    organization TEXT NOT NULL,
    dataset_name TEXT,
    source_url TEXT,
    source_type TEXT,
    license TEXT,
    retrieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    dataset_version TEXT,
    methodology_url TEXT
);

-- 2. FACT TABLES
CREATE TABLE IF NOT EXISTS fact_price (
    id BIGSERIAL PRIMARY KEY,
    spice_id BIGINT NOT NULL REFERENCES dim_spice(id),
    date DATE NOT NULL,
    country_id BIGINT REFERENCES dim_country(id),
    region_id BIGINT REFERENCES dim_region(id),
    market_id BIGINT REFERENCES dim_market(id),
    grade_id BIGINT REFERENCES dim_grade(id),
    seller_or_auctioneer TEXT,
    price_type TEXT NOT NULL,
    min_price NUMERIC(10, 2),
    max_price NUMERIC(10, 2),
    avg_price NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    unit TEXT NOT NULL DEFAULT 'INR/kg',
    quantity NUMERIC(12, 2),
    quantity_sold NUMERIC(12, 2),
    quantity_unit TEXT DEFAULT 'kg',
    source_id BIGINT NOT NULL REFERENCES dim_source(id),
    source_record_id TEXT,
    quality_status TEXT NOT NULL DEFAULT 'OBSERVED'
);

CREATE TABLE IF NOT EXISTS fact_weather (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL,
    region_id BIGINT NOT NULL REFERENCES dim_region(id),
    source_id BIGINT NOT NULL REFERENCES dim_source(id),
    rainfall_mm NUMERIC(8, 2),
    baseline_rainfall_mm NUMERIC(8, 2),
    rainfall_anomaly_mm NUMERIC(8, 2),
    tmin_c NUMERIC(5, 2),
    tmax_c NUMERIC(5, 2),
    tmean_c NUMERIC(5, 2),
    humidity_pct NUMERIC(5, 2),
    soil_moisture NUMERIC(6, 4),
    source_grid_id TEXT,
    quality_status TEXT NOT NULL DEFAULT 'OBSERVED'
);

CREATE TABLE IF NOT EXISTS fact_production (
    id BIGSERIAL PRIMARY KEY,
    spice_id BIGINT NOT NULL REFERENCES dim_spice(id),
    country_id BIGINT REFERENCES dim_country(id),
    region_id BIGINT REFERENCES dim_region(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    period_granularity TEXT NOT NULL DEFAULT 'ANNUAL',
    production_value NUMERIC(14, 2),
    production_unit TEXT DEFAULT 'tonnes',
    area_value NUMERIC(14, 2),
    area_unit TEXT DEFAULT 'ha',
    yield_value NUMERIC(10, 2),
    yield_unit TEXT DEFAULT 'kg/ha',
    source_id BIGINT NOT NULL REFERENCES dim_source(id),
    source_record_id TEXT,
    quality_status TEXT NOT NULL DEFAULT 'OFFICIAL_ESTIMATE'
);

CREATE TABLE IF NOT EXISTS fact_trade (
    id BIGSERIAL PRIMARY KEY,
    spice_id BIGINT NOT NULL REFERENCES dim_spice(id),
    flow TEXT NOT NULL,
    reporter_country_id BIGINT REFERENCES dim_country(id),
    partner_country_id BIGINT REFERENCES dim_country(id),
    period_start DATE NOT NULL,
    period_granularity TEXT NOT NULL DEFAULT 'ANNUAL',
    hs_code TEXT,
    quantity NUMERIC(14, 2),
    quantity_unit TEXT DEFAULT 'tonnes',
    trade_value NUMERIC(16, 2),
    currency TEXT DEFAULT 'USD',
    unit_value_usd_per_kg NUMERIC(10, 2),
    source_id BIGINT NOT NULL REFERENCES dim_source(id),
    quality_status TEXT NOT NULL DEFAULT 'OFFICIAL_ESTIMATE'
);

CREATE TABLE IF NOT EXISTS fact_consumption (
    id BIGSERIAL PRIMARY KEY,
    spice_id BIGINT NOT NULL REFERENCES dim_spice(id),
    country_id BIGINT REFERENCES dim_country(id),
    year INTEGER NOT NULL,
    consumption_type TEXT NOT NULL DEFAULT 'FOOD_SUPPLY',
    quantity NUMERIC(14, 2),
    quantity_unit TEXT DEFAULT 'tonnes',
    per_capita_quantity NUMERIC(8, 4),
    per_capita_unit TEXT DEFAULT 'kg/capita/year',
    source_id BIGINT NOT NULL REFERENCES dim_source(id),
    quality_status TEXT NOT NULL DEFAULT 'OFFICIAL_ESTIMATE'
);

CREATE TABLE IF NOT EXISTS data_quality_run (
    id BIGSERIAL PRIMARY KEY,
    dataset_name TEXT NOT NULL,
    run_started_at TIMESTAMPTZ NOT NULL,
    run_finished_at TIMESTAMPTZ,
    rows_read BIGINT,
    rows_loaded BIGINT,
    rows_rejected BIGINT,
    missing_dates BIGINT,
    duplicate_rows BIGINT,
    status TEXT NOT NULL,
    report_path TEXT
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_fact_price_spice_date ON fact_price(spice_id, date);
CREATE INDEX IF NOT EXISTS idx_fact_price_region_date ON fact_price(region_id, date);
CREATE INDEX IF NOT EXISTS idx_fact_weather_region_date ON fact_weather(region_id, date);
CREATE INDEX IF NOT EXISTS idx_fact_production_spice_region ON fact_production(spice_id, region_id, period_start);
CREATE INDEX IF NOT EXISTS idx_fact_trade_spice_flow ON fact_trade(spice_id, flow, period_start);

-- 4. ROW LEVEL SECURITY (Enable public read access for Supabase anon clients)
ALTER TABLE dim_spice ENABLE ROW LEVEL SECURITY;
ALTER TABLE dim_country ENABLE ROW LEVEL SECURITY;
ALTER TABLE dim_region ENABLE ROW LEVEL SECURITY;
ALTER TABLE dim_market ENABLE ROW LEVEL SECURITY;
ALTER TABLE dim_source ENABLE ROW LEVEL SECURITY;
ALTER TABLE fact_price ENABLE ROW LEVEL SECURITY;
ALTER TABLE fact_weather ENABLE ROW LEVEL SECURITY;
ALTER TABLE fact_production ENABLE ROW LEVEL SECURITY;
ALTER TABLE fact_trade ENABLE ROW LEVEL SECURITY;
ALTER TABLE fact_consumption ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_quality_run ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on dim_spice" ON dim_spice FOR SELECT USING (true);
CREATE POLICY "Allow public read access on dim_country" ON dim_country FOR SELECT USING (true);
CREATE POLICY "Allow public read access on dim_region" ON dim_region FOR SELECT USING (true);
CREATE POLICY "Allow public read access on dim_market" ON dim_market FOR SELECT USING (true);
CREATE POLICY "Allow public read access on dim_source" ON dim_source FOR SELECT USING (true);
CREATE POLICY "Allow public read access on fact_price" ON fact_price FOR SELECT USING (true);
CREATE POLICY "Allow public read access on fact_weather" ON fact_weather FOR SELECT USING (true);
CREATE POLICY "Allow public read access on fact_production" ON fact_production FOR SELECT USING (true);
CREATE POLICY "Allow public read access on fact_trade" ON fact_trade FOR SELECT USING (true);
CREATE POLICY "Allow public read access on fact_consumption" ON fact_consumption FOR SELECT USING (true);
CREATE POLICY "Allow public read access on data_quality_run" ON data_quality_run FOR SELECT USING (true);
