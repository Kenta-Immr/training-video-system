"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = require("../index");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const router = (0, express_1.Router)();
// 動画詳細取得
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const videoId = parseInt(req.params.id);
        const video = await index_1.prisma.video.findUnique({
            where: { id: videoId },
            include: {
                curriculum: {
                    include: {
                        course: true
                    }
                },
                viewingLogs: req.user.role === 'ADMIN' ? true : {
                    where: { userId: req.user.id }
                }
            }
        });
        if (!video) {
            return res.status(404).json({ error: '動画が見つかりません' });
        }
        res.json(video);
    }
    catch (error) {
        console.error('Error fetching video:', error);
        res.status(500).json({ error: '動画詳細の取得に失敗しました' });
    }
});
// 動画ファイルアップロード（管理者のみ）
router.post('/upload', auth_1.authenticateToken, auth_1.requireAdmin, upload_1.videoUpload.single('video'), async (req, res) => {
    try {
        const { title, description, curriculumId } = req.body;
        const file = req.file;
        if (!title || !curriculumId) {
            return res.status(400).json({ error: 'タイトルとカリキュラムIDが必要です' });
        }
        if (!file) {
            return res.status(400).json({ error: '動画ファイルが必要です' });
        }
        // ファイルのURLを生成
        const videoUrl = `${req.protocol}://${req.get('host')}/uploads/videos/${file.filename}`;
        const video = await index_1.prisma.video.create({
            data: {
                title,
                description,
                videoUrl,
                curriculumId: parseInt(curriculumId)
            }
        });
        res.status(201).json(video);
    }
    catch (error) {
        console.error('Error uploading video:', error);
        res.status(500).json({ error: '動画のアップロードに失敗しました' });
    }
});
// 動画作成（管理者のみ）
router.post('/', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const { title, description, videoUrl, curriculumId } = req.body;
        if (!title || !videoUrl || !curriculumId) {
            return res.status(400).json({ error: 'タイトル、動画URL、カリキュラムIDが必要です' });
        }
        const video = await index_1.prisma.video.create({
            data: {
                title,
                description,
                videoUrl,
                curriculumId: parseInt(curriculumId)
            }
        });
        res.status(201).json(video);
    }
    catch (error) {
        console.error('Error creating video:', error);
        res.status(500).json({ error: '動画の作成に失敗しました' });
    }
});
// 動画更新（管理者のみ）
router.put('/:id', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const videoId = parseInt(req.params.id);
        const { title, description, videoUrl, curriculumId } = req.body;
        if (!title || !videoUrl) {
            return res.status(400).json({ error: 'タイトルと動画URLが必要です' });
        }
        const updateData = {
            title,
            description,
            videoUrl
        };
        if (curriculumId) {
            updateData.curriculumId = parseInt(curriculumId);
        }
        const video = await index_1.prisma.video.update({
            where: { id: videoId },
            data: updateData
        });
        res.json(video);
    }
    catch (error) {
        console.error('Error updating video:', error);
        res.status(500).json({ error: '動画の更新に失敗しました' });
    }
});
// 動画削除（管理者のみ）
router.delete('/:id', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const videoId = parseInt(req.params.id);
        await index_1.prisma.video.delete({
            where: { id: videoId }
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting video:', error);
        res.status(500).json({ error: '動画の削除に失敗しました' });
    }
});
exports.default = router;
//# sourceMappingURL=videos.js.map