/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  /** getter for notes. */

  get notes() {
    return this._notes;
  }

  /** setter for notes. */

  set notes(notes) {
    if (!notes) {
      this._notes = '';
    } else {
      this._notes = notes;
    }
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes
       FROM customers
       ORDER BY last_name, first_name`
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes 
        FROM customers WHERE id = $1`,
      [id]
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** search for customers by name. */

  static async search(term) {
    const index = term.indexOf(' ');
    if (index === -1) {
      const results = await db.query(`SELECT id, 
            first_name AS "firstName",  
            last_name AS "lastName", 
            phone, 
            notes
          FROM customers
          WHERE first_name ILIKE '${term}%' OR last_name ILIKE '${term}%'
          ORDER BY last_name, first_name`);
      return results.rows.map(c => new Customer(c));
    } else {
      const first = term.slice(0, index);
      const last = term.slice(index + 1);
      const results = await db.query(`SELECT id,
            first_name AS "firstName",
            last_name AS "lastName",
            phone,
            notes
          FROM customers
          WHERE first_name ILIKE '${first}%' OR last_name ILIKE '${last}%'`);
      return results.rows.map(c => new Customer(c));
    }
  }

  static async top(limit) {
    const results = await db.query(`SELECT customers.id,
          first_name AS "firstName",
          last_name AS "lastName",
          phone,
          customers.notes,
          Count(reservations.id)
        FROM customers
        LEFT JOIN reservations ON (customers.id=reservations.customer_id)
        GROUP BY customers.id
        ORDER BY Count(reservations.id) DESC
        LIMIT ${limit}`);
    return results.rows.map(c => new Customer(c));
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers SET first_name=$1, last_name=$2, phone=$3, notes=$4
             WHERE id=$5`,
        [this.firstName, this.lastName, this.phone, this.notes, this.id]
      );
    }
  }

  /** get customer's full name */

  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }
}

module.exports = Customer;
