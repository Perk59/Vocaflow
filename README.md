VocabFlow
VocabFlow AI Development Specification

1. Project Overview
Project Name: VocabFlow - Hands-Free English Vocabulary Learning System

Languages Used: PHP, HTML, CSS, JavaScript

Target Device: Smartphones (Browser-based)

2. Core Functional Requirements
2.1 Hands-Free Vocabulary Listening Feature
Feature Overview
After pressing the “Start” button, English words and their Japanese translations are read aloud using synthesized speech.

Users can continue learning without touching the smartphone screen.

Designed for multitasking scenarios such as commuting, housework, or jogging.

Detailed Specifications
Speech Playback:

Playback Order: English word → 2-second pause → Japanese translation → 3-second pause → next word

Speech Synthesis: Utilizes Web Speech API (SpeechSynthesis)

English words are read with an English voice.

Japanese translations are read with a Japanese voice.

Adjustable playback speed (0.5x to 2.0x)

Audio Output Mode Switching:

Mono Mode: Choose between left or right ear

Stereo Mode: Output to both ears

Modes can be switched during learning

Considerations for baby crying or call alerts

Learning Control:

Pause / Resume function

Skip function (skip current word and go to the next)

Volume control (adjustable during learning)

Resume from the last position after interruption

2.2 Post-Learning Quiz Feature
Feature Overview
Automatically transitions to test mode after listening session ends

Random 4-choice questions based on the learned words

Number of questions: 120% of learned words (rounded down)

Detailed Specifications
Question Formats:

English word → Choose correct Japanese translation

Japanese translation → Choose correct English word

Questions are randomly presented in either pattern

Question Generation Logic:

Correct answers are selected from the learned vocabulary

Incorrect options are selected from other words at the same difficulty level

Answer options are displayed in random order

Results Display:

Number of correct answers / Total number of questions

Accuracy rate (%)

Total learning time

List of incorrectly answered words

3. Screen Layouts
3.1 Main Screen (index.php)
Learning Settings Area:

Select word category (TOEIC, Daily Conversation, Business, etc.)

Choose difficulty level (Beginner, Intermediate, Advanced)

Set number of words to learn (10, 20, 50, 100)

Slider to adjust playback speed

Select audio output mode (Mono Left / Mono Right / Stereo)

Volume control slider

Note: All settings can be modified during the learning session.

Learning Control Area:

Start Learning button

Pause / Resume button

Stop button

Skip button

Learning Status Display Area:

Display of current word

Progress bar (current word / total number of words)

Elapsed time display

Display of currently playing word and translation

3.2 Test Screen (test.php)
Question Display Area:

Display of question sentence

Four selectable answer buttons

Display of question number / total number of questions

Results Display Area:

Correct answers / Total questions

Accuracy rate (as %)

Total learning time

List of incorrectly answered words

4. Database Design
(Details omitted in original, assumed to be part of DB planning)

5. Technical Specifications
5.1 Voice Control
Web Speech API: Uses SpeechSynthesis

Voice Language Settings:

English words: lang='en-US'

Japanese translations: lang='ja-JP'

5.2 Session Management
PHP sessions are used to manage the user's learning status

Session IDs are generated to identify users

5.3 Responsive Design
Optimized for smartphones

Supports touch operations

Compatible with both portrait and landscape modes

6. File Structure
 /vocabflow/
├── index.php                # Main Screen
├── test.php                 # Test Screen
├── api/
│   ├── get_words.php        # Word Retrieval API
│   ├── save_progress.php    # Learning Progress Save API
│   ├── generate_test.php    # Test Question Generator API
│   └── save_test_result.php # Test Result Save API
├── css/
│   └── style.css
├── js/
│   ├── speech.js            # Voice Control Script
│   ├── learning.js          # Learning Control Script
│   └── test.js              # Test Control Script
└── config/
    └── database.php         # DB Connection Settings
7. Key Implementation Points
7.1 Runtime Setting Adjustments
JavaScript event listeners for real-time setting changes

Instant switching of audio output modes

Real-time adjustment of speed and volume

7.2 Question Count Calculation Logic
$question_count = floor($learned_word_count * 1.2);
7.3 Stability in Voice Playback
Detect completion of speech playback

Error handling for playback issues

Compatibility across major browsers

7.4 Data Persistence
Auto-save of learning progress

Resume from the exact position when returning

History management of test results

Based on this specification, proceed with the development of a hands-free English vocabulary learning system using PHP and HTML.
