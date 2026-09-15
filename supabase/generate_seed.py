import sqlite3

db_path = '/home/jeo/.gemini/antigravity/scratch/cardo-board/cardo_board.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

out_path = '/home/jeo/.gemini/antigravity/scratch/CardoBE/supabase/seed_data.sql'
with open(out_path, 'w') as f:
    f.write('-- Cardo Board Complete Seed SQL for Supabase\n')
    f.write('BEGIN;\n\n')

    # dim_spice
    cur.execute('SELECT code, name, commodity_group, scientific_name, description, active FROM dim_spice')
    for r in cur.fetchall():
        desc = (r[4] or '').replace("'", "''")
        f.write(f"INSERT INTO dim_spice (code, name, commodity_group, scientific_name, description, active) VALUES ('{r[0]}', '{r[1]}', '{r[2]}', '{r[3]}', '{desc}', TRUE) ON CONFLICT (code) DO NOTHING;\n")

    # dim_country
    cur.execute('SELECT iso2, iso3, name FROM dim_country')
    for r in cur.fetchall():
        f.write(f"INSERT INTO dim_country (iso2, iso3, name) VALUES ('{r[0]}', '{r[1]}', '{r[2]}') ON CONFLICT (iso3) DO NOTHING;\n")

    # dim_region
    cur.execute('SELECT country_id, parent_id, region_type, name, latitude, longitude FROM dim_region')
    for r in cur.fetchall():
        p_id = r[1] if r[1] is not None else 'NULL'
        f.write(f"INSERT INTO dim_region (country_id, parent_id, region_type, name, latitude, longitude) VALUES ({r[0]}, {p_id}, '{r[2]}', '{r[3]}', {r[4] or 'NULL'}, {r[5] or 'NULL'});\n")

    # dim_market
    cur.execute('SELECT name, region_id, latitude, longitude, market_type FROM dim_market')
    for r in cur.fetchall():
        f.write(f"INSERT INTO dim_market (name, region_id, latitude, longitude, market_type) VALUES ('{r[0]}', {r[1]}, {r[2] or 'NULL'}, {r[3] or 'NULL'}, '{r[4]}');\n")

    # dim_source
    cur.execute('SELECT organization, dataset_name, source_url, source_type, license, retrieved_at, dataset_version, methodology_url FROM dim_source')
    for r in cur.fetchall():
        src_url = r[2] or ''
        lic = r[4] or ''
        ver = r[6] or ''
        meth = r[7] or ''
        f.write(f"INSERT INTO dim_source (organization, dataset_name, source_url, source_type, license, retrieved_at, dataset_version, methodology_url) VALUES ('{r[0]}', '{r[1]}', '{src_url}', '{r[3]}', '{lic}', '{r[5]}', '{ver}', '{meth}');\n")

    # fact_production
    cur.execute('SELECT spice_id, country_id, region_id, period_start, period_end, period_granularity, production_value, production_unit, area_value, area_unit, yield_value, yield_unit, source_id, source_record_id, quality_status FROM fact_production')
    for r in cur.fetchall():
        c_id = r[1] if r[1] is not None else 'NULL'
        r_id = r[2] if r[2] is not None else 'NULL'
        f.write(f"INSERT INTO fact_production (spice_id, country_id, region_id, period_start, period_end, period_granularity, production_value, production_unit, area_value, area_unit, yield_value, yield_unit, source_id, source_record_id, quality_status) VALUES ({r[0]}, {c_id}, {r_id}, '{r[3]}', '{r[4]}', '{r[5]}', {r[6]}, '{r[7]}', {r[8]}, '{r[9]}', {r[10]}, '{r[11]}', {r[12]}, '{r[13]}', '{r[14]}');\n")

    # fact_trade
    cur.execute('SELECT spice_id, flow, reporter_country_id, partner_country_id, period_start, period_granularity, hs_code, quantity, quantity_unit, trade_value, currency, unit_value_usd_per_kg, source_id, quality_status FROM fact_trade')
    for r in cur.fetchall():
        f.write(f"INSERT INTO fact_trade (spice_id, flow, reporter_country_id, partner_country_id, period_start, period_granularity, hs_code, quantity, quantity_unit, trade_value, currency, unit_value_usd_per_kg, source_id, quality_status) VALUES ({r[0]}, '{r[1]}', {r[2]}, {r[3]}, '{r[4]}', '{r[5]}', '{r[6]}', {r[7]}, '{r[8]}', {r[9]}, '{r[10]}', {r[11]}, {r[12]}, '{r[13]}');\n")

    # fact_consumption
    cur.execute('SELECT spice_id, country_id, year, consumption_type, quantity, quantity_unit, per_capita_quantity, per_capita_unit, source_id, quality_status FROM fact_consumption')
    for r in cur.fetchall():
        f.write(f"INSERT INTO fact_consumption (spice_id, country_id, year, consumption_type, quantity, quantity_unit, per_capita_quantity, per_capita_unit, source_id, quality_status) VALUES ({r[0]}, {r[1]}, {r[2]}, '{r[3]}', {r[4]}, '{r[5]}', {r[6]}, '{r[7]}', {r[8]}, '{r[9]}');\n")

    # fact_weather
    cur.execute('SELECT date, region_id, source_id, rainfall_mm, baseline_rainfall_mm, rainfall_anomaly_mm, tmin_c, tmax_c, tmean_c, humidity_pct, soil_moisture, quality_status FROM fact_weather')
    for r in cur.fetchall():
        f.write(f"INSERT INTO fact_weather (date, region_id, source_id, rainfall_mm, baseline_rainfall_mm, rainfall_anomaly_mm, tmin_c, tmax_c, tmean_c, humidity_pct, soil_moisture, quality_status) VALUES ('{r[0]}', {r[1]}, {r[2]}, {r[3]}, {r[4]}, {r[5]}, {r[6]}, {r[7]}, {r[8]}, {r[9] or 'NULL'}, {r[10] or 'NULL'}, '{r[11]}');\n")

    # fact_price
    cur.execute('SELECT spice_id, date, country_id, region_id, market_id, seller_or_auctioneer, price_type, min_price, max_price, avg_price, currency, unit, quantity, quantity_sold, quantity_unit, source_id, source_record_id, quality_status FROM fact_price')
    for r in cur.fetchall():
        auc = (r[5] or '').replace("'", "''")
        m_id = r[4] if r[4] is not None else 'NULL'
        f.write(f"INSERT INTO fact_price (spice_id, date, country_id, region_id, market_id, seller_or_auctioneer, price_type, min_price, max_price, avg_price, currency, unit, quantity, quantity_sold, quantity_unit, source_id, source_record_id, quality_status) VALUES ({r[0]}, '{r[1]}', {r[2]}, {r[3]}, {m_id}, '{auc}', '{r[6]}', {r[7] or 'NULL'}, {r[8] or 'NULL'}, {r[9]}, '{r[10]}', '{r[11]}', {r[12] or 'NULL'}, {r[13] or 'NULL'}, '{r[14]}', {r[15]}, '{r[16]}', '{r[17]}');\n")

    f.write('\nCOMMIT;\n')

print('Generated seed_data.sql successfully!')
