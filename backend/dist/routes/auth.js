"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = require("../index");
const router = (0, express_1.Router)();
// ログイン
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'メールアドレスとパスワードが必要です' });
        }
        // ユーザーを検索
        const user = await index_1.prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            return res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
        }
        // パスワードを検証
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
        }
        // 初回ログインフラグと最終ログイン日時を更新
        await index_1.prisma.user.update({
            where: { id: user.id },
            data: {
                isFirstLogin: false,
                lastLoginAt: new Date()
            }
        });
        // JWTトークンを生成
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                isFirstLogin: false
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'ログインに失敗しました' });
    }
});
// 受講生自己登録
router.post('/register', async (req, res) => {
    try {
        const { email, name, password, groupCode } = req.body;
        if (!email || !name || !password) {
            return res.status(400).json({ error: 'メールアドレス、名前、パスワードが必要です' });
        }
        // パスワードの長さチェック
        if (password.length < 6) {
            return res.status(400).json({ error: 'パスワードは6文字以上である必要があります' });
        }
        // メールアドレスの重複チェック
        const existingUser = await index_1.prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            return res.status(400).json({ error: 'このメールアドレスは既に使用されています' });
        }
        // グループコードの確認（オプション）
        let groupId = null;
        if (groupCode) {
            const group = await index_1.prisma.group.findUnique({
                where: { code: groupCode }
            });
            if (group) {
                groupId = group.id;
            }
        }
        // パスワードをハッシュ化
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // ユーザーを作成（デフォルトでUSERロール）
        const user = await index_1.prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                role: 'USER',
                groupId
            }
        });
        // JWTトークンを生成
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.status(201).json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'アカウント作成に失敗しました' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map