const express = require("express");

const {
    getAnalytics,
} = require("../controllers/reportController");

const {
    protect,
    authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
    "/analytics",
    protect,
    authorize("Fleet Manager", "Financial Analyst"),
    getAnalytics
);

module.exports = router;
