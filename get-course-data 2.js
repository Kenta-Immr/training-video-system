const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// データベースファイルのパス
const dbPath = path.join(__dirname, 'backend', 'dev.db');

console.log('データベースパス:', dbPath);

// データベース接続
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('データベース接続エラー:', err.message);
    return;
  }
  console.log('データベースに接続されました');
});

// コースデータを取得
const getCoursesWithDetails = () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        c.id as courseId,
        c.title as courseTitle,
        c.description as courseDescription,
        c.thumbnailUrl as courseThumbnailUrl,
        cu.id as curriculumId,
        cu.title as curriculumTitle,
        cu.description as curriculumDescription,
        v.id as videoId,
        v.title as videoTitle,
        v.description as videoDescription,
        v.videoUrl
      FROM Course c
      LEFT JOIN Curriculum cu ON c.id = cu.courseId
      LEFT JOIN Video v ON cu.id = v.curriculumId
      ORDER BY c.id, cu.id, v.id
    `;

    db.all(query, [], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      // データを構造化
      const coursesMap = new Map();

      rows.forEach(row => {
        if (!coursesMap.has(row.courseId)) {
          coursesMap.set(row.courseId, {
            id: row.courseId,
            title: row.courseTitle,
            description: row.courseDescription,
            thumbnailUrl: row.courseThumbnailUrl,
            curriculums: new Map()
          });
        }

        const course = coursesMap.get(row.courseId);

        if (row.curriculumId && !course.curriculums.has(row.curriculumId)) {
          course.curriculums.set(row.curriculumId, {
            id: row.curriculumId,
            title: row.curriculumTitle,
            description: row.curriculumDescription,
            courseId: row.courseId,
            videos: []
          });
        }

        if (row.videoId && row.curriculumId) {
          const curriculum = course.curriculums.get(row.curriculumId);
          curriculum.videos.push({
            id: row.videoId,
            title: row.videoTitle,
            description: row.videoDescription,
            videoUrl: row.videoUrl,
            curriculumId: row.curriculumId
          });
        }
      });

      // Mapを配列に変換
      const courses = Array.from(coursesMap.values()).map(course => ({
        ...course,
        curriculums: Array.from(course.curriculums.values())
      }));

      resolve(courses);
    });
  });
};

// 実行
getCoursesWithDetails()
  .then(courses => {
    console.log('=== コースデータ ===');
    console.log(JSON.stringify(courses, null, 2));
    db.close();
  })
  .catch(err => {
    console.error('エラー:', err);
    db.close();
  });