const express = require('express');
const ExpressError = require('../expressError');
const db = require('../db');

const router = new express.Router();

router.get('/', async function(req, res, next) {
	try {
		const result = await db.query(
			`SELECT id, comp_code
            FROM invoices 
            ORDER BY id`
		);
		return res.json({ invoices: result.rows });
	} catch (err) {
		return next(err);
	}
});

router.get('/:id', async function(req, res, next) {
	try {
		let id = req.params.id;
		const result = await db.query(
			`SELECT i.id, i.amt, i.paid, i.add_date, i.paid_date, i.comp_code, c.name, c.description
            FROM invoices AS i
            INNER JOIN companies AS c ON (i.comp_code = c.code)
            WHERE id=$1`,
			[ id ]
		);
		if (result.rows.length === 0) {
			throw new ExpressError(`No invoice found with id of ${id}`, 404);
		}
		const resData = result.rows[0];
		const invoice = {
			id: resData.id,
			amt: resData.amt,
			paid: resData.paid,
			add_date: resData.add_date,
			paid_date: resData.paid_date,
			company: {
				code: resData.comp_code,
				name: resData.name,
				description: resData.description
			}
		};
		return res.json({ invoice: invoice });
	} catch (err) {
		return next(err);
	}
});

router.post('/', async function(req, res, next) {
	try {
		let { comp_code, amt } = req.body;
		const result = db.query(
			`INSERT INTO invoices (comp_code, amt)
            VALUES ($1, $2)
            RETURNING id, comp_code, amt, paid, add_date, paid_date`,
			[ comp_code, amt ]
		);
		return res.status(201).json({ invoice: results.rows[0] });
	} catch (err) {
		return next(err);
	}
});

router.put('/:id', async function(req, res, next) {
	try {
		let amt = req.body.amt;
		let id = req.params.id;

		const result = db.query(
			`UPDATE invoices
            SET amt=$1
            WHERE id=$2
            RETURNING id, comp_code, amt, paid, add_date, paid_date`,
			[ amt, id ]
		);
		if (result.rows.length === 0) {
			throw new ExpressError(`No invoice found with id of ${id}`, 404);
		}
		return res.json({ invoice: result.rows[0] });
	} catch (err) {
		return next(err);
	}
});

router.delete('/:id', async function(req, res, next) {
	try {
		let id = req.params.id;
		const result = await db.query(
			`DELETE FROM invoices
            WHERE id=$1
            RETURNING id`,
			[ id ]
		);
		if (result.rows.length === 0) {
			throw new ExpressError(`No invoice found with id of ${id}`, 404);
		}
		return res.json({ status: 'deleted' });
	} catch (err) {
		return next(err);
	}
});

module.exports = router;
