const router = require("express").Router();

const {
  createPolicy,
  getPolicies,
  getSinglePolicy,
  updatePolicy,
  deletePolicy,
} = require("../controllers/policy.controller");


// ================= CREATE POLICY =================

router.post(
  "/",
  createPolicy
);


// ================= GET ALL POLICIES =================

router.get(
  "/",
  getPolicies
);


// ================= GET SINGLE POLICY =================

router.get(
  "/:id",
  getSinglePolicy
);


// ================= UPDATE POLICY =================

router.put(
  "/:id",
  updatePolicy
);


// ================= DELETE POLICY =================

router.delete(
  "/:id",
  deletePolicy
);

module.exports = router;