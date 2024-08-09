import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { courses, students } = await request.json();

    const prompt = `
    Given the following courses and students, allocate the courses to the students in a fair manner based on the Envy-Free up to one item (EF1) principle.

    Definition of Envy:
    A student is said to "envy" another student if they believe that the set of courses allocated to the other student is more valuable to them (based on their valuation function) than the set of courses they were allocated. In the EF1 principle, no student should envy another student's allocation if at most one course is removed from the other student's allocation.

    Courses:
    ${courses.map(course => `ID: ${course.courseId}, Credits: ${course.credits}, Capacity: ${course.seatCapacity}, Start Time: ${course.startTime}, End Time: ${course.endTime}`).join('\n')}

    Students:
    ${students.map(student => `ID: ${student.studentId}, Max Credits: ${student.maxCredits}, Valuations: ${JSON.stringify(student.valuationFunction)}`).join('\n')}

    The allocation should ensure the following:
    - Each student is allocated courses such that their total credits do not exceed their maximum credits.
    - No course is left out; all courses must be allocated.
    - No student should envy another student's allocation after removing at most one course from the other student's allocation.

    Provide the allocation of courses for each student in the following format:
    Student ID: <studentId>
    Allocated Courses: <courseId1>, <courseId2>, ...
    Total Student Valuation: <computed valuation>

    Example:
    Student ID: 1
    Allocated Courses: 2, 3
    Total Student Valuation: 12
    Student ID: 2
    Allocated Courses: 1, 4
    Total Student Valuation: 15

    Ensure that the allocation adheres to the EF1 principle. JUST OUTPUT THE DATA AND NOTHING ELSE.
    `;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 500,
    });

    const allocationInstance = completion.choices[0].message.content.trim();

    return NextResponse.json({ status: 'success', allocationInstance: allocationInstance });
  } catch (error) {
    console.error('Error generating allocation instance:', error);
    return NextResponse.json({ message: 'Failed to generate allocation instance', error: error.message }, { status: 500 });
  }
}
