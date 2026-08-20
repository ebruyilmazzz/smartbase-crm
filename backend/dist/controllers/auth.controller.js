"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.getMe = exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_js_1 = require("../utils/prisma.js");
const jwt_js_1 = require("../utils/jwt.js");
const response_js_1 = require("../utils/response.js");
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma_js_1.prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
        });
        if (!user) {
            return (0, response_js_1.sendError)(res, 'E-posta adresi veya şifre hatalı.', 401);
        }
        if (user.status === 'DISABLED') {
            return (0, response_js_1.sendError)(res, 'Hesabınız devre dışı bırakılmıştır. Lütfen yöneticinizle iletişime geçin.', 403);
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return (0, response_js_1.sendError)(res, 'E-posta adresi veya şifre hatalı.', 401);
        }
        const authUser = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            status: user.status,
        };
        const token = (0, jwt_js_1.generateToken)(authUser);
        return (0, response_js_1.sendSuccess)(res, {
            token,
            user: authUser,
        }, 'Giriş başarılı.');
    }
    catch (error) {
        console.error('Login error:', error);
        return (0, response_js_1.sendError)(res, 'Giriş yapılırken bir hata oluştu.', 500);
    }
};
exports.login = login;
const getMe = async (req, res) => {
    try {
        if (!req.user) {
            return (0, response_js_1.sendError)(res, 'Oturum bulunamadı.', 401);
        }
        const user = await prisma_js_1.prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                status: true,
                createdAt: true,
            },
        });
        if (!user) {
            return (0, response_js_1.sendError)(res, 'Kullanıcı bulunamadı.', 404);
        }
        return (0, response_js_1.sendSuccess)(res, user);
    }
    catch (error) {
        console.error('getMe error:', error);
        return (0, response_js_1.sendError)(res, 'Kullanıcı bilgisi alınamadı.', 500);
    }
};
exports.getMe = getMe;
const logout = async (req, res) => {
    return (0, response_js_1.sendSuccess)(res, null, 'Oturum kapatıldı.');
};
exports.logout = logout;
