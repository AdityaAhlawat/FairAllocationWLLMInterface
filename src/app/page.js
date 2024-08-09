"use client";
import React, { useState } from 'react';

class Course {
  constructor(courseId, credits, seatCapacity, startTime, endTime) {
    this.courseId = courseId;
    this.credits = credits;
    this.seatCapacity = seatCapacity;
    this.startTime = startTime; // Integer representing the start time (e.g., hour in a day)
    this.endTime = endTime;     // Integer representing the end time (e.g., hour in a day)
    this.seatCount = 0;
  }

  toString() {
    return `Course(id=${this.courseId}, credits=${this.credits}, seatCapacity=${this.seatCapacity}, startTime=${this.startTime}, endTime=${this.endTime}, seatCount=${this.seatCount})`;
  }
}

class Student {
  constructor(studentId, valuationFunction, maxCredits) {
    this.studentId = studentId;
    this.valuationFunction = valuationFunction;
    this.maxCredits = maxCredits;
  }

  toString() {
    return `Student(id=${this.studentId}, valuationFunction=${JSON.stringify(this.valuationFunction)}, maxCredits=${this.maxCredits})`;
  }

  utility(allocation) {
    return allocation[this.studentId].reduce((total, course) => total + (this.valuationFunction[course.courseId] || 0), 0);
  }
}

function generateData(numOfCourses, numOfStudents, totalSchoolTime, options = {}) {
  const { uniformCreditCaps, uniformUtilities, uniformUtilities1, uniformCourseLengths, binaryPreferencesPerStudent } = options;

  const courses = [];
  for (let i = 0; i < numOfCourses; i++) {
    const courseId = i + 1;
    const credits = 1;
    const seatCapacity = 1;

    const startTime = Math.floor(Math.random() * totalSchoolTime); // Generate random start time as an integer
    const endTime = generateEndTime(startTime, uniformCourseLengths, totalSchoolTime);

    courses.push(new Course(courseId, credits, seatCapacity, startTime, endTime));
  }

  const students = [];
  for (let j = 0; j < numOfStudents; j++) {
    const studentId = j + 1;
    let valuationFunction = {};

    if (uniformUtilities1) {
      valuationFunction = Object.fromEntries(courses.map(course => [course.courseId, 1]));
    } else if (uniformUtilities) {
      valuationFunction = Object.fromEntries(courses.map(course => [course.courseId, 3]));
    } else if (binaryPreferencesPerStudent) {
      valuationFunction = Object.fromEntries(courses.map(course => [course.courseId, Math.random() < 0.5 ? 0 : 1]));
    } else {
      valuationFunction = Object.fromEntries(courses.map(course => [course.courseId, Math.floor(Math.random() * 10) + 1]));
    }

    const maxCredits = uniformCreditCaps ? 3 : Math.floor(Math.random() * 4) + 3;
    students.push(new Student(studentId, valuationFunction, maxCredits));
  }

  return { courses, students };
}

// Function to generate end time based on start time
function generateEndTime(startTime, uniformCourseLengths, totalSchoolTime) {
  const duration = uniformCourseLengths ? 1 : Math.floor(Math.random() * 3) + 1;
  let endTime = startTime + duration;

  // Ensure endTime doesn't exceed total school time
  if (endTime > totalSchoolTime) {
    endTime = totalSchoolTime;
  }

  return endTime;
}

export default function Home() {
  const [allocationInstance, setAllocationInstance] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedData, setGeneratedData] = useState(null);
  const [showGeneratedData, setShowGeneratedData] = useState(true);

  const [numOfCourses, setNumOfCourses] = useState(5);
  const [numOfStudents, setNumOfStudents] = useState(10);
  const [totalSchoolTime, setTotalSchoolTime] = useState(10);
  const [uniformCreditCaps, setUniformCreditCaps] = useState(false);
  const [uniformUtilities, setUniformUtilities] = useState(false);
  const [uniformUtilities1, setUniformUtilities1] = useState(false);
  const [uniformCourseLengths, setUniformCourseLengths] = useState(false);
  const [binaryPreferencesPerStudent, setBinaryPreferencesPerStudent] = useState(false);

  const handleGenerateData = () => {
    const data = generateData(numOfCourses, numOfStudents, totalSchoolTime, {
      uniformCreditCaps,
      uniformUtilities,
      uniformUtilities1,
      uniformCourseLengths,
      binaryPreferencesPerStudent,
    });
    setGeneratedData(data);
    setShowGeneratedData(true);
    setMessage('Data generated successfully');
  };

  const handleCloseGeneratedData = () => {
    setShowGeneratedData(false);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/recommendation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courses: generatedData.courses, students: generatedData.students }),
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setAllocationInstance(data.allocationInstance);
      setMessage(data.status === 'success' ? 'Allocation generated successfully' : 'Allocation generated but not in correct JSON format');
    } catch (error) {
      console.error('Error generating allocation instance:', error);
      setMessage('Failed to generate allocation instance');
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 p-4">
      <main className="flex-grow">
        <div className="mb-4">
          <h3 className="font-bold">Data Generation Parameters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label>Number of Courses:</label>
              <input
                type="number"
                value={numOfCourses}
                onChange={(e) => setNumOfCourses(parseInt(e.target.value))}
                className="p-2 border border-gray-300 w-full"
              />
            </div>
            <div>
              <label>Number of Students:</label>
              <input
                type="number"
                value={numOfStudents}
                onChange={(e) => setNumOfStudents(parseInt(e.target.value))}
                className="p-2 border border-gray-300 w-full"
              />
            </div>
            <div>
              <label>Total School Time:</label>
              <input
                type="number"
                value={totalSchoolTime}
                onChange={(e) => setTotalSchoolTime(parseInt(e.target.value))}
                className="p-2 border border-gray-300 w-full"
              />
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={uniformCreditCaps}
                  onChange={(e) => setUniformCreditCaps(e.target.checked)}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
                <span className="ml-2">Uniform Credit Caps</span>
              </label>
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={uniformUtilities}
                  onChange={(e) => setUniformUtilities(e.target.checked)}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
                <span className="ml-2">Uniform Utilities</span>
              </label>
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={uniformUtilities1}
                  onChange={(e) => setUniformUtilities1(e.target.checked)}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
                <span className="ml-2">Uniform Utilities 1</span>
              </label>
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={uniformCourseLengths}
                  onChange={(e) => setUniformCourseLengths(e.target.checked)}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
                <span className="ml-2">Uniform Course Lengths</span>
              </label>
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={binaryPreferencesPerStudent}
                  onChange={(e) => setBinaryPreferencesPerStudent(e.target.checked)}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
                <span className="ml-2">Binary Preferences Per Student</span>
              </label>
            </div>
          </div>
          <div className="mt-4">
            <button onClick={handleGenerateData} className="bg-blue-500 text-white px-4 py-2">
              Generate Data
            </button>
          </div>
        </div>

        {generatedData && showGeneratedData && (
          <div className="mb-4 p-4 bg-white rounded-md shadow-md" style={{ fontFamily: 'Arial', color: 'black' }}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold">Generated Data:</h3>
              <button onClick={handleCloseGeneratedData} className="text-red-500">Close</button>
            </div>
            <div className="mb-4">
              <h4 className="font-bold">Courses</h4>
              <ul className="list-disc pl-5">
                {generatedData.courses.map(course => (
                  <li key={course.courseId}>
                    <strong>ID:</strong> {course.courseId}, <strong>Credits:</strong> {course.credits}, <strong>Capacity:</strong> {course.seatCapacity}, <strong>Start Time:</strong> {course.startTime}, <strong>End Time:</strong> {course.endTime}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold">Students</h4>
              <ul className="list-disc pl-5">
                {generatedData.students.map(student => (
                  <li key={student.studentId}>
                    <strong>ID:</strong> {student.studentId}, <strong>Max Credits:</strong> {student.maxCredits}, <strong>Valuations:</strong> {JSON.stringify(student.valuationFunction)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="flex items-center mb-4">
          <button onClick={handleSubmit} className="bg-blue-500 text-white px-4 py-2">
            Generate Allocation
          </button>
        </div>

        {message && <div className="mb-4 text-center text-black" style={{ fontFamily: 'Arial' }}>{message}</div>}
        {loading && <LoadingSpinner />}
        {allocationInstance && (
          <div className="mb-4 p-4 bg-white rounded-md shadow-md" style={{ fontFamily: 'Arial', color: 'black' }}>
            <h3 className="font-bold">Generated Allocation Instance:</h3>
            <pre>{allocationInstance}</pre>
          </div>
        )}
      </main>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center">
      <svg
        className="animate-spin h-5 w-5 text-gray-600"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C6.58 0 2 4.58 2 10h2zm2 5.3l1.42 1.42A8.064 8.064 0 014 12H2c0 2.68 1.05 5.1 2.76 6.9z"
        ></path>
      </svg>
    </div>
  );
}
