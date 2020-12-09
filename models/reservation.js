/** Reservation for Lunchly */

const moment = require("moment");

const db = require("../db");


/** A reservation for a party */

class Reservation {
  constructor({ id, customerId, numGuests, startAt, notes }) {
    this.id = id;
    this.customerId = customerId;
    this.numGuests = numGuests;
    this.startAt = startAt;
    this.notes = notes;
  }

  /** getter for numGuests */

  get numGuests() {
    return this._numGuests;
  }

  /** setter for numGuests */

  set numGuests(numGuests) {
    if (numGuests < 1) {
      throw new Error('Number of guests must be greater than zero');
    } else {
      this._numGuests = numGuests;
    }
  }

  /** getter for startAt */

  get startAt() {
    return this._startAt;
  }

  /** setter for startAt */

  set startAt(startAt) {
    const timestamp = Date.parse(startAt);

    if (isNaN(timestamp)) {
      throw new Error('Reservation start must be a valid date');
    } else {
      this._startAt = new Date(startAt);
    }
  }

  /** getter for customerId */

  get customerId() {
    return this._customerId;
  }

  /** setter for customerId */

  set customerId(customerId) {
    if (this._customerId) {
      throw new Error('Customer ID for this reservation has already been set and cannot be changed');
    } else {
      this._customerId = customerId;
    }
  }

  /** formatter for startAt */

  getformattedStartAt() {
    return moment(this.startAt).format('MMMM Do YYYY, h:mm a');
  }

  /** given a customer id, find their reservations. */

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
      `SELECT id, 
           customer_id AS "customerId", 
           num_guests AS "numGuests", 
           start_at AS "startAt", 
           notes AS "notes"
         FROM reservations 
         WHERE customer_id = $1`,
      [customerId]
    );

    return results.rows.map(row => new Reservation(row));
  }

  /** save this reservation. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO reservations (customer_id, start_at, num_guests, notes)
               VALUES ($1, $2, $3, $4)
               RETURNING id`,
        [this.customerId, this.startAt, this.numGuests, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers SET customer_id=$1, start_at=$2, num_guests=$3, notes=$4
               WHERE id=$5`,
        [this.customerId, this.startAt, this.numGuests, this.notes, this.id]
      );
    }
  }
}


module.exports = Reservation;
