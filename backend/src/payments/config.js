"use strict";
const isProd = process.env.NODE_ENV === "production";

/**
 * Feature flag principal:
 *  - PROD: OFF (false) par défaut
 *  - DEV:  ON (true) par défaut
 */
module.exports = {
  paymentsEnabled: process.env.PAYMENTS_ENABLED
    ? process.env.PAYMENTS_ENABLED === "true"
    : !isProd,
};
