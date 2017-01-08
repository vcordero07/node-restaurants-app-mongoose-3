BEGIN;

CREATE TYPE borough_options as ENUM (
    'Brooklyn', 'Bronx', 'Manhattan', 'Queens',
    'Staten Island', 'Missing');

CREATE TABLE restaurants (
    id serial PRIMARY KEY,
    name text NOT NULL,
    nyc_restaurant_id integer, -- assigned by NYC, not db
    borough borough_options,
    cuisine text,
    address_building_number text,
    address_street text,
    address_zipcode text
);

CREATE TABLE grades (
    id serial PRIMARY KEY,
    "date" timestamptz NOT NULL,
    grade text NOT NULL,
    score integer NOT NULL,
    restaurant_id integer REFERENCES restaurants
);

END;