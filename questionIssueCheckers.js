// GOAL: Pass parameters into function to generate objects which specify things such as
//  1. which keys to test
//  2. which question types to test on
//  3. flag reason
//  4. a test to run

// function makeTest(validator, flagReason, questionType, keeperKeys) {
//     var example = {
//         validator: (value) => true,
//         flagReason: null,
//         questionType: null,
//         keeperKeys: [null],
//     }
//     var output = {
//         validator: validator,
//         flagReason: flagReason,
//         questionType: questionType,
//         keeperKeys: keeperKeys,
//     }
//     return Object.assign(example, output)
// }

const questionIssueCheckers = {
    "matching_question": {
        checkers: [blankTest(true)],
        keeperKeys: [
            ['text', 'html'],
            'left',
            'right',
        ],
    },
    "multiple_choice_question": {
        checkers: [blankTest(true), textTest('no answer text provided')],
        keeperKeys: [
            ['text', 'html'],
        ],
    },
    "numerical_question": {
        checkers: [blankTest(), zeroTest()],
        keeperKeys: [
            'exact',
        ],
    },
    "short_answer_question": {
        checkers: [blankTest(true), hyphenTest(), textTest('response_')],
        keeperKeys: [
            ['text', 'html'],
        ],
    },
    "fill_in_multiple_blanks_question": {
        checkers: [blankTest(true), hyphenTest(), textTest('response_')],
        keeperKeys: [
            ['text', 'html'],
        ],
    },
}

// checks for blanks in fields
function blankTest(checkEveryKeyPerCollection = false) {
    return {
        validator: new RegExp(/^[\n\s\t\ufeff]+$|^$|^null$|^undefined$/, 'gi'),
        flagReason: 'blank',
        checkEvery: checkEveryKeyPerCollection
    }
}
// Check for hyphens in fields
function hyphenTest(checkEveryKeyPerCollection = false) {
    return {
        // validator: new RegExp(/-/, 'gi'),
        // validator: new RegExp(/(?!^[1234567890.,$\-+*•^%/()[\]\s]+$)\w+\s*\-\s*\w+/, 'gi'),
        // validator: new RegExp(/[A-Z]+\s*\-\s*[A-Z]+/, 'gi'),
        // validator: new RegExp(/[A-Z]+\-[A-Z]+/, 'gi'),
        validator: new RegExp(/^[^\s\-]+(?:\-[^\s\-]+)+$/, 'gi'),
        flagReason: 'hyphen',
        checkEvery: checkEveryKeyPerCollection
    }
}
// check for matching text in fields
function textTest(text, checkEveryKeyPerCollection = false) {
    return {
        validator: new RegExp(text, 'gi'),
        flagReason: `text matched: ${text}`,
        checkEvery: checkEveryKeyPerCollection
    }
}
// check for zero in fields
function zeroTest(checkEveryKeyPerCollection = false) {
    return {
        validator: new RegExp(/^0$/, 'i'),
        flagReason: 'zero',
        checkEvery: checkEveryKeyPerCollection
    }
};
module.exports = questionIssueCheckers;
