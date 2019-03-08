const quizDataReducer = require('./quizDataReducer');
let questions = [{
    "course_id": "10001",
    "course_name": "MA",
    "course_sisid": "C.O.1919.Wi.CCT 98.8",
    "course_html_url": "https://byui.instructure.com/courses/10001",
    "quizOrBank_type": "bank",
    "quizOrBank_id": "100001",
    "quizOrBank_title": "Question Bank: Self Assessment",
    "quizOrBank_html_url": "https://byui.instructure.com/courses/10001/question_banks/100001",
    "question_id": 1000001,
    "question_name": "Question",
    "question_type": "short_answer_question",
    "question_text": "<div class=\"byui CCT98\">\n    How Many problems can be found in a course?</p>\n</div>",
    "question_answers": [
        {
            "text": "",
            "html": "",
            "weight": 100,
            "comments": "",
            "id": 10001
        }
    ],
    "question_matches": null,
    "question_matching_answer_incorrect_matches": null,
    "question_flagReason": []
}]

function quizDataReducerTest() {

    return quizDataReducer(questions)

}

var log = quizDataReducerTest();
console.log(log);