"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const response_js_1 = require("../utils/response.js");
const validate = (schema) => {
    return async (req, res, next) => {
        try {
            req.body = await schema.parseAsync(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
                return (0, response_js_1.sendError)(res, errorMessages || 'Doğrulama hatası', 422, error.format());
            }
            return (0, response_js_1.sendError)(res, 'Geçersiz veri girişi', 400);
        }
    };
};
exports.validate = validate;
