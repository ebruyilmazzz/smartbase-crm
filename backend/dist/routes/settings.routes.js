"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settings_controller_js_1 = require("../controllers/settings.controller.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const role_middleware_js_1 = require("../middleware/role.middleware.js");
const validate_middleware_js_1 = require("../middleware/validate.middleware.js");
const index_js_1 = require("../validators/index.js");
const router = (0, express_1.Router)();
router.use(auth_middleware_js_1.authenticate);
// Statuses & Priorities can be fetched by all authenticated users to populate dropdowns
router.get('/statuses', settings_controller_js_1.getStatuses);
router.get('/priorities', settings_controller_js_1.getPriorities);
// Admin-only management routes
router.use(role_middleware_js_1.requireAdmin);
router.get('/users', settings_controller_js_1.getUsers);
router.post('/users', (0, validate_middleware_js_1.validate)(index_js_1.createUserSchema), settings_controller_js_1.createUser);
router.put('/users/:id', (0, validate_middleware_js_1.validate)(index_js_1.updateUserSchema), settings_controller_js_1.updateUser);
router.post('/statuses', settings_controller_js_1.createStatus);
router.put('/statuses/:id', settings_controller_js_1.updateStatus);
router.post('/priorities', settings_controller_js_1.createPriority);
router.put('/priorities/:id', settings_controller_js_1.updatePriority);
exports.default = router;
