"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jwt_js_1 = require("../utils/jwt.js");
const response_js_1 = require("../utils/response.js");
const prisma_js_1 = require("../utils/prisma.js");
const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return (0, response_js_1.sendError)(res, 'Yetkilendirme belirteci bulunamadı.', 401);
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = (0, jwt_js_1.verifyToken)(token);
        // Verify user exists and is active in database
        const user = await prisma_js_1.prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, email: true, name: true, role: true, status: true }
        });
        if (!user) {
            return (0, response_js_1.sendError)(res, 'Kullanıcı bulunamadı.', 401);
        }
        if (user.status === 'DISABLED') {
            return (0, response_js_1.sendError)(res, 'Kullanıcı hesabı devre dışı bırakılmış.', 403);
        }
        req.user = user;
        next();
    }
    catch (error) {
        return (0, response_js_1.sendError)(res, 'Geçersiz veya süresi dolmuş oturum.', 401);
    }
};
exports.authenticate = authenticate;
