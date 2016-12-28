const pgp = require('pg-promise')();

const {Restaurant} = require('./models');
const {runServer, closeServer} = require('./server');


const PG_DATABASE_URL = 'postgres://localhost:5432/restaurants-app';

const db = pgp(PG_DATABASE_URL);

function handleRestaurant(client, restaurant) {
  let newId;
  return client
    .one(`
      INSERT INTO restaurants (name, nyc_restaurant_id, borough, cuisine, address_building_number, address_street, address_zipcode)
      VALUES (
        $$${restaurant.name}$$, $$${restaurant.restaurant_id}$$,
        $$${restaurant.borough}$$, $$${restaurant.cuisine}$$,
        $$${restaurant.address.building}$$,
        $$${restaurant.address.street}$$,
        $$${restaurant.address.zipcode}$$
      ) RETURNING (id);`
    )
    .then(result => {
      newId = result.id;
      console.info(`Ported restaurant with mongo id ${restaurant.id} to postgres with id ${newId}`);
      if (!restaurant.grades.length) {
        return [];
      }
      const gradeInserts = restaurant.grades.map(
        grade => `($$${grade.date.toISOString()}$$, $$${grade.grade}$$, ${grade.score}, ${newId})`);

      return client.many(`
        INSERT INTO grades (date, grade, score, restaurant_id) VALUES
        ${gradeInserts.join(',\n')} RETURNING (id);
      `);
    })
    .then(newGrades => {
        console.log(`Inserted ${newGrades.length} grades for restaurant ${newId}`);
    })
    .catch(err => {
      console.error(`Problem adding restaurant ${restaurant.id}: ${err}`);
    });
}

function doMigration() {
  return runServer()
    .then(() => {
      return Restaurant
        .find()
        .limit()
        .exec()
    })
    .then(restaurants => {
      return Promise.all(restaurants.map(restaurant => {
        return handleRestaurant(db, restaurant);
      }));
    })
    .then(() => console.log('migration complete'))
    .catch(err => console.error(`Something went wrong: ${err}`))
}

doMigration().then(closeServer);

