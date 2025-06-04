-- ハンズフリー英単語学習アプリ用 SQLite データベーススキーマ
-- ファイル名: create_tables.sql
-- 使用方法: sqlite3 vocab.db < create_tables.sql

-- 英単語テーブル
CREATE TABLE IF NOT EXISTS words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word TEXT NOT NULL UNIQUE,
    meaning TEXT NOT NULL,
    difficulty_level INTEGER DEFAULT 1, -- 1:初級, 2:中級, 3:上級
    category TEXT DEFAULT 'general',     -- 単語カテゴリ（一般、ビジネス、技術など）
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 学習進捗テーブル
CREATE TABLE IF NOT EXISTS progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    word_ids TEXT NOT NULL,   -- JSON 文字列で単語 ID の配列を保持
    duration INTEGER NOT NULL,-- 学習時間（秒単位）
    words_count INTEGER DEFAULT 0, -- 学習した単語数
    session_type TEXT DEFAULT 'listening', -- セッションタイプ
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- クイズ結果テーブル
CREATE TABLE IF NOT EXISTS quiz_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    question_id INTEGER NOT NULL,
    word_id INTEGER,          -- 問題となった単語のID
    is_correct INTEGER NOT NULL,  -- 1: 正解, 0: 不正解
    selected_answer TEXT,     -- ユーザーが選択した回答
    correct_answer TEXT,      -- 正解
    response_time INTEGER,    -- 回答にかかった時間（ミリ秒）
    answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (word_id) REFERENCES words(id)
);

-- インデックスの作成（パフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS idx_progress_user_id ON progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_created_at ON progress(created_at);
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_word_id ON quiz_results(word_id);
CREATE INDEX IF NOT EXISTS idx_words_difficulty ON words(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_words_category ON words(category);

-- サンプルデータの挿入
INSERT OR IGNORE INTO words (word, meaning, difficulty_level, category) VALUES
-- 初級レベル
('apple', 'りんご', 1, 'food'),
('book', '本', 1, 'general'),
('car', '車', 1, 'transport'),
('dog', '犬', 1, 'animal'),
('eat', '食べる', 1, 'general'),
('fish', '魚', 1, 'animal'),
('good', '良い', 1, 'general'),
('house', '家', 1, 'general'),
('ice', '氷', 1, 'general'),
('jump', '跳ぶ', 1, 'general'),
('king', '王', 1, 'general'),
('love', '愛', 1, 'general'),
('music', '音楽', 1, 'general'),
('name', '名前', 1, 'general'),
('ocean', '海', 1, 'nature'),
('park', '公園', 1, 'general'),
('quiet', '静かな', 1, 'general'),
('rain', '雨', 1, 'weather'),
('school', '学校', 1, 'general'),
('tree', '木', 1, 'nature'),

-- 中級レベル
('beautiful', '美しい', 2, 'general'),
('computer', 'コンピューター', 2, 'technology'),
('development', '開発', 2, 'business'),
('environment', '環境', 2, 'nature'),
('fantastic', '素晴らしい', 2, 'general'),
('government', '政府', 2, 'politics'),
('helicopter', 'ヘリコプター', 2, 'transport'),
('important', '重要な', 2, 'general'),
('journey', '旅', 2, 'general'),
('knowledge', '知識', 2, 'general'),
('language', '言語', 2, 'general'),
('mountain', '山', 2, 'nature'),
('necessary', '必要な', 2, 'general'),
('opportunity', '機会', 2, 'business'),
('population', '人口', 2, 'general'),
('question', '質問', 2, 'general'),
('relationship', '関係', 2, 'general'),
('situation', '状況', 2, 'general'),
('temperature', '温度', 2, 'science'),
('university', '大学', 2, 'education'),

-- 上級レベル
('accommodate', '収容する', 3, 'business'),
('bureaucracy', '官僚制', 3, 'politics'),
('contemporary', '現代の', 3, 'general'),
('distinguish', '区別する', 3, 'general'),
('entrepreneur', '起業家', 3, 'business'),
('facilitate', '促進する', 3, 'business'),
('gratitude', '感謝', 3, 'general'),
('hypothesis', '仮説', 3, 'science'),
('inevitable', '避けられない', 3, 'general'),
('jurisdiction', '管轄権', 3, 'legal'),
('kaleidoscope', '万華鏡', 3, 'general'),
('legislature', '立法府', 3, 'politics'),
('magnificent', '壮大な', 3, 'general'),
('negotiation', '交渉', 3, 'business'),
('obsolete', '時代遅れの', 3, 'general'),
('perseverance', '忍耐', 3, 'general'),
('quintessential', '真髄の', 3, 'general'),
('reciprocal', '相互の', 3, 'general'),
('sustainability', '持続可能性', 3, 'environment'),
('unprecedented', '前例のない', 3, 'general');

-- トリガーの作成（updated_atの自動更新）
CREATE TRIGGER IF NOT EXISTS update_words_timestamp 
    AFTER UPDATE ON words
BEGIN
    UPDATE words SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- 統計用ビューの作成
CREATE VIEW IF NOT EXISTS user_progress_summary AS
SELECT 
    user_id,
    COUNT(*) as total_sessions,
    SUM(duration) as total_duration,
    SUM(words_count) as total_words_learned,
    AVG(duration) as avg_session_duration,
    MAX(created_at) as last_session_date
FROM progress 
GROUP BY user_id;

CREATE VIEW IF NOT EXISTS quiz_performance_summary AS
SELECT 
    user_id,
    COUNT(*) as total_questions,
    SUM(is_correct) as correct_answers,
    ROUND(CAST(SUM(is_correct) AS FLOAT) / COUNT(*) * 100, 2) as accuracy_percentage,
    AVG(response_time) as avg_response_time
FROM quiz_results 
GROUP BY user_id;

-- データベース設定
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = 1000;
PRAGMA temp_store = memory;
