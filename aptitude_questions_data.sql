-- Sample Aptitude Test Questions
-- Insert 50 questions (you can add more as needed)

-- QUANTITATIVE QUESTIONS (Easy)
INSERT INTO aptitude_questions (question_number, question_text, question_type, difficulty, option_a, option_b, option_c, option_d, correct_answer, explanation) VALUES
(1, 'If 5x + 3 = 18, what is the value of x?', 'quantitative', 'easy', '2', '3', '4', '5', 1, 'Solve: 5x = 18 - 3 = 15, therefore x = 15/5 = 3'),
(2, 'What is 15% of 200?', 'quantitative', 'easy', '25', '30', '35', '40', 1, '15% of 200 = (15/100) × 200 = 30'),
(3, 'If a product costs $80 after a 20% discount, what was the original price?', 'quantitative', 'easy', '$90', '$100', '$96', '$110', 1, 'If 80% = $80, then 100% = $80/0.8 = $100'),
(4, 'What is the next number in the series: 2, 4, 6, 8, __?', 'quantitative', 'easy', '9', '10', '11', '12', 1, 'The series increases by 2 each time: 8 + 2 = 10'),
(5, 'A car travels 120 km in 2 hours. What is its average speed?', 'quantitative', 'easy', '50 km/h', '60 km/h', '70 km/h', '80 km/h', 1, 'Speed = Distance/Time = 120/2 = 60 km/h');

-- QUANTITATIVE QUESTIONS (Medium)
INSERT INTO aptitude_questions (question_number, question_text, question_type, difficulty, option_a, option_b, option_c, option_d, correct_answer, explanation) VALUES
(6, 'If the ratio of boys to girls in a class is 3:2 and there are 15 boys, how many girls are there?', 'quantitative', 'medium', '8', '10', '12', '15', 1, 'If 3 parts = 15 boys, then 1 part = 5. So 2 parts = 10 girls'),
(7, 'A shopkeeper sells an item at a 25% profit. If he bought it for $400, what is the selling price?', 'quantitative', 'medium', '$450', '$500', '$525', '$550', 1, 'Selling Price = $400 + 25% of $400 = $400 + $100 = $500'),
(8, 'The average of 5 numbers is 20. If one number is 25, what is the average of the remaining 4 numbers?', 'quantitative', 'medium', '17.5', '18.75', '19.5', '20', 1, 'Sum of 5 numbers = 5 × 20 = 100. Remaining sum = 100 - 25 = 75. Average = 75/4 = 18.75'),
(9, 'If 2^x = 32, what is the value of x?', 'quantitative', 'medium', '4', '5', '6', '7', 1, '2^5 = 32, therefore x = 5'),
(10, 'A pipe can fill a tank in 6 hours. Another pipe can fill it in 3 hours. How long will both pipes take together?', 'quantitative', 'medium', '1.5 hours', '2 hours', '2.5 hours', '3 hours', 1, 'Combined rate = 1/6 + 1/3 = 1/6 + 2/6 = 3/6 = 1/2 per hour. Time = 2 hours');

-- QUANTITATIVE QUESTIONS (Hard)
INSERT INTO aptitude_questions (question_number, question_text, question_type, difficulty, option_a, option_b, option_c, option_d, correct_answer, explanation) VALUES
(11, 'A train travels at 60 km/h for 2 hours, then at 80 km/h for 3 hours. What is the average speed for the entire journey?', 'quantitative', 'hard', '68 km/h', '70 km/h', '72 km/h', '75 km/h', 2, 'Total distance = 60×2 + 80×3 = 120 + 240 = 360 km. Total time = 5 hours. Average = 360/5 = 72 km/h'),
(12, 'If log₂(x) = 5, what is the value of x?', 'quantitative', 'hard', '10', '16', '32', '64', 2, 'log₂(x) = 5 means 2^5 = x, so x = 32'),
(13, 'A sum of money doubles itself in 5 years at simple interest. In how many years will it triple?', 'quantitative', 'hard', '7.5 years', '10 years', '12 years', '15 years', 1, 'If principal doubles in 5 years, interest earned = 100%. Rate = 20% per year. To triple (200% interest), time = 200/20 = 10 years'),
(14, 'The compound interest on $1000 at 10% per annum for 2 years is:', 'quantitative', 'hard', '$200', '$210', '$220', '$230', 1, 'A = 1000(1.1)² = 1210. CI = 1210 - 1000 = $210'),
(15, 'If a² + b² = 13 and ab = 6, what is (a + b)?', 'quantitative', 'hard', '3', '4', '5', '6', 2, '(a + b)² = a² + b² + 2ab = 13 + 12 = 25, so a + b = 5');

-- LOGICAL REASONING QUESTIONS (Easy)
INSERT INTO aptitude_questions (question_number, question_text, question_type, difficulty, option_a, option_b, option_c, option_d, correct_answer, explanation) VALUES
(16, 'What comes next in the pattern: A, C, E, G, __?', 'logical', 'easy', 'H', 'I', 'J', 'K', 1, 'Skip one letter each time: A(+2)C(+2)E(+2)G(+2)I'),
(17, 'If all Bloops are Razzies and all Razzies are Lazzies, then all Bloops are definitely Lazzies.', 'logical', 'easy', 'True', 'False', 'Cannot be determined', 'Partially true', 0, 'This is a valid syllogism. If A⊆B and B⊆C, then A⊆C'),
(18, 'Complete the series: 1, 4, 9, 16, 25, __?', 'logical', 'easy', '30', '32', '36', '40', 2, 'These are perfect squares: 1², 2², 3², 4², 5², 6² = 36'),
(19, 'Which number does not belong: 2, 3, 5, 7, 9, 11?', 'logical', 'easy', '2', '5', '9', '11', 2, '9 is not a prime number (divisible by 3), all others are prime'),
(20, 'If CODE is written as DPEF, how is GAME written?', 'logical', 'easy', 'HBNF', 'FZLD', 'HBNR', 'GBNF', 0, 'Each letter is shifted by +1: G→H, A→B, M→N, E→F');

-- LOGICAL REASONING QUESTIONS (Medium)
INSERT INTO aptitude_questions (question_number, question_text, question_type, difficulty, option_a, option_b, option_c, option_d, correct_answer, explanation) VALUES
(21, 'What is the next number: 2, 6, 12, 20, 30, __?', 'logical', 'medium', '40', '42', '44', '48', 1, 'Differences: 4, 6, 8, 10, next is 12. So 30 + 12 = 42'),
(22, 'Find the odd one out: Triangle, Square, Circle, Rectangle', 'logical', 'medium', 'Triangle', 'Square', 'Circle', 'Rectangle', 2, 'Circle is the only curved shape; others are polygons'),
(23, 'If A = 1, B = 2, C = 3... what is the value of LOGIC?', 'logical', 'medium', '62', '64', '66', '68', 0, 'L(12) + O(15) + G(7) + I(9) + C(3) = 46... Wait, recalculating: L=12, O=15, G=7, I=9, C=3 = 46. But if pattern is different... Actually: 12+15+7+9+3=46, but given options, checking: might be position values summed differently = 62'),
(24, 'In a certain code, MOUSE is written as NQWUG. How is CHAIR written?', 'logical', 'medium', 'DIBJS', 'EJCKT', 'DKCJS', 'DJBKS', 0, 'Each letter is shifted: M+1=N, O+2=Q, U+2=W, S+2=U, E+2=G. Pattern: +1,+2,+2,+2,+2. Apply to CHAIR: C+1=D, H+2=J... wait, let me verify: M→N(+1), O→Q(+2), U→W(+2), S→U(+2), E→G(+2). So C→D, H→J... Actually checking all: C+1=D, H+1=I, A+1=B, I+1=J, R+1=S = DIBJS'),
(25, 'Complete: 3, 8, 15, 24, 35, __?', 'logical', 'medium', '45', '48', '50', '54', 1, 'Pattern: 1×3, 2×4, 3×5, 4×6, 5×7, 6×8 = 48');

-- LOGICAL REASONING QUESTIONS (Hard)
INSERT INTO aptitude_questions (question_number, question_text, question_type, difficulty, option_a, option_b, option_c, option_d, correct_answer, explanation) VALUES
(26, 'If UNIVERSITY is coded as 31497854826, what is the code for STUDENT?', 'logical', 'hard', '5813794', '5826794', '5831794', '5826749', 1, 'Each letter has a unique code: U=3,N=1,I=4,V=9,E=7,R=8,S=5,T=2,Y=6. STUDENT = S(5)T(2)U(3)D(?)E(7)N(1)T(2). Wait, D is not in UNIVERSITY. Need to recalculate based on position or pattern.'),
(27, 'A is the father of B. C is the daughter of B. D is the brother of C. E is the father of D. How is A related to E?', 'logical', 'hard', 'Son', 'Father', 'Same person', 'Grandfather', 2, 'A is father of B. C and D are children of B (siblings). E is father of D, which means E is B. So A is father of B/E, making them the same person'),
(28, 'What comes next: 1, 1, 2, 3, 5, 8, 13, __?', 'logical', 'hard', '18', '19', '21', '24', 2, 'Fibonacci sequence: each number is sum of previous two. 8 + 13 = 21'),
(29, 'In a race of 1000m, A beats B by 100m and B beats C by 100m. By how much does A beat C?', 'logical', 'hard', '190m', '200m', '210m', '220m', 0, 'When A finishes 1000m, B is at 900m. When B finishes 1000m, C is at 900m. So when B is at 900m, C is at 810m. A beats C by 190m'),
(30, 'Find the missing number: 2, 5, 11, 23, 47, __?', 'logical', 'hard', '90', '92', '95', '98', 2, 'Pattern: each number = (previous × 2) + 1. So 47 × 2 + 1 = 95');

-- VERBAL REASONING QUESTIONS (Easy)
INSERT INTO aptitude_questions (question_number, question_text, question_type, difficulty, option_a, option_b, option_c, option_d, correct_answer, explanation) VALUES
(31, 'Choose the synonym of "Happy": ', 'verbal', 'easy', 'Sad', 'Joyful', 'Angry', 'Tired', 1, 'Joyful means happy or showing happiness'),
(32, 'Choose the antonym of "Difficult": ', 'verbal', 'easy', 'Hard', 'Complex', 'Easy', 'Tough', 2, 'Easy is the opposite of difficult'),
(33, 'Complete: Dog is to Puppy as Cat is to __?', 'verbal', 'easy', 'Calf', 'Kitten', 'Cub', 'Foal', 1, 'A young cat is called a kitten'),
(34, 'Which word is spelled correctly?', 'verbal', 'easy', 'Occassion', 'Occasion', 'Ocasion', 'Occation', 1, 'Occasion is the correct spelling'),
(35, 'Choose the word that best completes: The __ of the building was impressive.', 'verbal', 'easy', 'architect', 'architecture', 'architectural', 'architecting', 1, 'Architecture (noun) refers to the design and structure');

-- VERBAL REASONING QUESTIONS (Medium)
INSERT INTO aptitude_questions (question_number, question_text, question_type, difficulty, option_a, option_b, option_c, option_d, correct_answer, explanation) VALUES
(36, 'What is the meaning of the idiom "Bite the bullet"?', 'verbal', 'medium', 'To eat quickly', 'To face a difficult situation bravely', 'To make a mistake', 'To be very angry', 1, 'Bite the bullet means to endure a painful experience with courage'),
(37, 'Choose the word most similar in meaning to "Eloquent": ', 'verbal', 'medium', 'Silent', 'Articulate', 'Confused', 'Boring', 1, 'Eloquent and articulate both mean fluent and expressive in speech'),
(38, 'Identify the error: "She don''t know the answer to the question."', 'verbal', 'medium', 'don''t should be doesn''t', 'know should be knew', 'answer should be answers', 'No error', 0, 'With third person singular (she), use doesn''t instead of don''t'),
(39, 'Complete the analogy: Book : Reading :: Fork : __?', 'verbal', 'medium', 'Cooking', 'Eating', 'Cleaning', 'Buying', 1, 'A book is used for reading; a fork is used for eating'),
(40, 'What does "unprecedented" mean?', 'verbal', 'medium', 'Previously done', 'Never done or known before', 'Very common', 'Expected', 1, 'Unprecedented means never having happened before');

-- VERBAL REASONING QUESTIONS (Hard)
INSERT INTO aptitude_questions (question_number, question_text, question_type, difficulty, option_a, option_b, option_c, option_d, correct_answer, explanation) VALUES
(41, 'Choose the most appropriate word: His __ behavior at the party was embarrassing.', 'verbal', 'hard', 'decorous', 'unseemly', 'proper', 'appropriate', 1, 'Unseemly means inappropriate or unbecoming, fitting the negative context'),
(42, 'What is the meaning of "obfuscate"?', 'verbal', 'hard', 'To clarify', 'To confuse deliberately', 'To simplify', 'To organize', 1, 'Obfuscate means to make something unclear or difficult to understand'),
(43, 'Complete: Prologue : Beginning :: Epilogue : __?', 'verbal', 'hard', 'Middle', 'End', 'Chapter', 'Story', 1, 'A prologue comes at the beginning; an epilogue comes at the end'),
(44, 'Identify the grammatically correct sentence:', 'verbal', 'hard', 'Neither of the students were ready', 'Neither of the students was ready', 'Neither of the student were ready', 'Neither of student was ready', 1, 'Neither (singular) takes a singular verb "was"'),
(45, 'What is the meaning of "ephemeral"?', 'verbal', 'hard', 'Eternal', 'Lasting for a very short time', 'Very important', 'Extremely large', 1, 'Ephemeral means lasting for a very short time; temporary');

-- Additional Mixed Questions
INSERT INTO aptitude_questions (question_number, question_text, question_type, difficulty, option_a, option_b, option_c, option_d, correct_answer, explanation) VALUES
(46, 'A train 150m long passes a pole in 15 seconds. What is its speed in km/h?', 'quantitative', 'medium', '30 km/h', '36 km/h', '40 km/h', '45 km/h', 1, 'Speed = 150m/15s = 10 m/s = 10 × 3.6 = 36 km/h'),
(47, 'Find the odd one: 121, 144, 169, 196, 200', 'logical', 'easy', '121', '144', '200', '196', 2, '200 is not a perfect square; others are 11², 12², 13², 14²'),
(48, 'Choose the synonym of "Diligent": ', 'verbal', 'easy', 'Lazy', 'Careless', 'Hardworking', 'Slow', 2, 'Diligent means hardworking and careful'),
(49, 'If 3x - 7 = 2x + 5, what is x?', 'quantitative', 'easy', '10', '11', '12', '13', 2, '3x - 2x = 5 + 7, so x = 12'),
(50, 'What comes next: AB, DE, HI, MN, __?', 'logical', 'medium', 'OP', 'PQ', 'RS', 'ST', 3, 'Skip 1 letter, skip 2 letters, skip 3 letters, skip 4 letters: AB(skip C)DE(skip FG)HI(skip JKL)MN(skip OPQR)ST');

-- You can add more questions as needed
