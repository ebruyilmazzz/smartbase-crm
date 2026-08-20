"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendError = exports.sendSuccess = void 0;
const sendSuccess = (res, data, message, statusCode = 200, meta) => {
    const response = {
        success: true,
        data,
        message,
        meta,
    };
    return res.status(statusCode).json(response);
};
exports.sendSuccess = sendSuccess;
const sendError = (res, message, statusCode = 400, data) => {
    const response = {
        success: false,
        message,
        data,
    };
    return res.status(statusCode).json(response);
};
exports.sendError = sendError;
