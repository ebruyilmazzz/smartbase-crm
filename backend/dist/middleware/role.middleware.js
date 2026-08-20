"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireSalesOrAdmin = exports.requireAdmin = exports.requireRoles = void 0;
const response_js_1 = require("../utils/response.js");
const requireRoles = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return (0, response_js_1.sendError)(res, 'Yetkilendirme gerekli.', 401);
        }
        if (!roles.includes(req.user.role)) {
            return (0, response_js_1.sendError)(res, 'Bu işlem için yetkiniz bulunmamaktadır.', 403);
        }
        next();
    };
};
exports.requireRoles = requireRoles;
exports.requireAdmin = (0, exports.requireRoles)(['ADMIN']);
exports.requireSalesOrAdmin = (0, exports.requireRoles)(['ADMIN', 'SALES']);
