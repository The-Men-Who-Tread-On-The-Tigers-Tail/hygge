export const questions = [
  'What small part of today felt most like home?',
  'What small part of today helped you breathe more slowly?',
  'What small part of today made the room feel warmer?',
  'What small part of today invited you to linger a little longer?',
  'What small part of today deserves more gratitude than it usually gets?',
  'What small part of today would you gladly repeat tomorrow?',
  'What small part of today made you feel quietly cared for?',
  'What small part of today brought a sense of calm without asking for attention?',
]

export function nextQuestion(currentQuestion) {
  const currentIndex = questions.indexOf(currentQuestion)
  return questions[(currentIndex + 1) % questions.length]
}

export function firstQuestion() {
  return questions[0]
}
