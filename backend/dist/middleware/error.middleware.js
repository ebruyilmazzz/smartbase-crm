"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const response_js_1 = require("../utils/response.js");
const errorHandler = (err, req, res, next) => {
    console.error('Unhandled Error:', err);
    if (err.name === 'UnauthorizedError') {
        return (0, response_js_1.sendError)(res, 'Yetkisiz erişim.', 401);
    }
    if (err.name === 'NotFoundError') {
        return (0, response_js_1.sendError)(res, err.message || 'Kayıt bulunamadı.', 404);
    }
    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'Sunucu kaynaklı bir hata oluştu. Lütfen tekrar deneyiniz.'
        : err.message || 'Sunucu hatası';
    return (0, response_js_1.sendError)(res, message, statusCode);
};
exports.errorHandler = errorHandler;
