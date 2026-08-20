"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logActivity = void 0;
const prisma_js_1 = require("../utils/prisma.js");
const logActivity = async ({ userId, action, description, companyId, taskId, requestId, }) => {
    try {
        return await prisma_js_1.prisma.activity.create({
            data: {
                userId,
                action,
                description,
                companyId,
                taskId,
                requestId,
            },
        });
    }
    catch (error) {
        console.error('Activity logging failed:', error);
        // Don't fail parent operation if activity logging encounters an issue
        return null;
    }
};
exports.logActivity = logActivity;
