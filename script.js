const subjects = ['Math', 'English', 'Science', 'History', 'Art'];
const studentForm = document.getElementById('student-form');
const studentsTableBody = document.querySelector('#students-table tbody');
const gradeInputs = document.getElementById('grade-inputs');
const showAddFormButton = document.getElementById('show-add-form');
const cancelEditButton = document.getElementById('cancel-edit');
const studentIdField = document.getElementById('student-id');
const nameField = document.getElementById('student-name');
const classField = document.getElementById('student-class');
const sectionField = document.getElementById('student-section');
const rollField = document.getElementById('student-roll');

function createGradeFields() {
  gradeInputs.innerHTML = '';
  subjects.forEach((subject) => {
    const field = document.createElement('div');
    field.className = 'mb-3 grade-field';
    const label = document.createElement('label');
    label.className = 'form-label subject-label';
    label.textContent = `${subject} score`;
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'form-control subject-score';
    input.min = '0';
    input.max = '100';
    input.required = true;
    input.dataset.subject = subject;
    input.placeholder = '0 - 100';
    field.appendChild(label);
    field.appendChild(input);
    gradeInputs.appendChild(field);
  });
}

function clearForm() {
  studentIdField.value = '';
  nameField.value = '';
  classField.value = '';
  sectionField.value = '';
  rollField.value = '';
  document.querySelectorAll('.subject-score').forEach((input) => {
    input.value = '';
  });
  cancelEditButton.classList.add('d-none');
  showAddFormButton.disabled = false;
}

function showEditState(student) {
  studentIdField.value = student.id;
  nameField.value = student.name;
  classField.value = student.class;
  sectionField.value = student.section;
  rollField.value = student.roll;

  document.querySelectorAll('.subject-score').forEach((input) => {
    const grade = student.grades.find((g) => g.subject === input.dataset.subject);
    input.value = grade ? grade.score : '';
  });

  cancelEditButton.classList.remove('d-none');
  showAddFormButton.disabled = true;
}

function renderStudents(students) {
  studentsTableBody.innerHTML = '';
  students.forEach((student, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${student.name}</td>
      <td>${student.class}${student.section ? ' ' + student.section : ''}</td>
      <td>${student.roll}</td>
      <td>${student.total}</td>
      <td>${student.percentage}%</td>
      <td>${student.letterGrade}</td>
      <td class="action-buttons">
        <button class="btn btn-sm btn-outline-light me-1 edit-btn">Edit</button>
        <button class="btn btn-sm btn-outline-danger delete-btn">Delete</button>
      </td>
    `;

    row.querySelector('.edit-btn').addEventListener('click', () => showEditState(student));
    row.querySelector('.delete-btn').addEventListener('click', () => deleteStudent(student.id));

    studentsTableBody.appendChild(row);
  });
}

function showError(message) {
  alert(`Error: ${message}`);
  console.error(message);
}

async function fetchStudents() {
  try {
    const response = await fetch('/api/students');
    if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
    const data = await response.json();
    renderStudents(data);
  } catch (error) {
    showError(error.message || error);
  }
}

function collectGrades() {
  return Array.from(document.querySelectorAll('.subject-score')).map((input) => ({
    subject: input.dataset.subject,
    score: Number(input.value)
  }));
}

async function addStudent(student) {
  const response = await fetch('/api/students', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(student)
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Status ${response.status}`);
  }
  await fetchStudents();
}

async function updateStudent(id, student) {
  const response = await fetch(`/api/students/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(student)
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Status ${response.status}`);
  }
  await fetchStudents();
}

async function deleteStudent(id) {
  if (!confirm('Remove this student and all grades?')) return;
  const response = await fetch(`/api/students/${id}`, { method: 'DELETE' });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Status ${response.status}`);
  }
  await fetchStudents();
}

studentForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const student = {
    name: nameField.value.trim(),
    class: classField.value.trim(),
    section: sectionField.value.trim(),
    roll: Number(rollField.value),
    grades: collectGrades()
  };

  try {
    const studentId = studentIdField.value;
    if (studentId) {
      await updateStudent(Number(studentId), student);
    } else {
      await addStudent(student);
    }
    clearForm();
  } catch (error) {
    showError(error.message || error);
  }
});

showAddFormButton.addEventListener('click', () => {
  clearForm();
});

cancelEditButton.addEventListener('click', () => {
  clearForm();
});

createGradeFields();
fetchStudents();
